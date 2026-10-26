/**
 * Arquivo: src/systems/consultation-system.ts
 *
 * 1. O que este arquivo faz?
 * Coordena o atendimento em consultórios, alocação de pacientes da fila, aplicação de penalidades de fadiga,
 * disparo de decisões médicas e faturamento ambulatorial/hospitalar com dedução de energia do profissional.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Centralizar o ciclo principal de atendimento clínico do SUS e conectar as mecânicas de habilidade,
 * fadiga da equipe e satisfação do paciente.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Multiplicadores e tempos de consulta provêm de balance.json e do sistema de fadiga em staff-fatigue-system.ts.
 *
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/entities/room.ts, src/state/game-state.ts,
 *          src/systems/satisfaction-system.ts, src/systems/staff-fatigue-system.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/decision-modal.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import { addOccupant, removeOccupant, type RoomInstance } from '../entities/room';
import type { PatientInstance } from '../entities/patient';
import type { GameState } from '../state/game-state';
import { calculatePatientSatisfaction } from './satisfaction-system';
import { getBestDoctorSkill } from './staff-system';
import { consumeMedicationsForCase, calculatePatientConsultationRevenue } from './economy-system';
import { checkHospitalProgression } from './progression-system';
import { deductStaffEnergyOnConsultation } from './staff-fatigue-system';

const AUTO_TREATMENT_BASE_SEC = 3.5;
const AUTO_TREATMENT_MIN_SEC = 1.5;
const DEFAULT_TECH_SPEED_REDUCTION = 0.2;
const CLEANLINESS_BENCHMARK = 80;
const MAX_CLEANLINESS_RATING = 100;
const MAX_SATISFACTION = 100;
const DEFAULT_HELIPAD_REWARD = 7200;
const DEFAULT_JANITOR_BONUS = 10;

export function findAvailableConsultationRoom(state: GameState): RoomInstance | null {
  for (const room of state.rooms.values()) {
    if (room.definition.role === 'treatment' && room.occupantIds.length < room.definition.capacity) {
      return room;
    }
  }
  return null;
}

export function hasPharmacy(state: GameState): boolean {
  for (const room of state.rooms.values()) {
    if (room.definition.role === 'dispense') return true;
  }
  return false;
}

export function hasDoctorAvailable(state: GameState): boolean {
  for (const member of state.staff.values()) {
    if (member.roleId === 'doctor') return true;
  }
  return false;
}

export function hasTechAvailable(state: GameState): boolean {
  for (const member of state.staff.values()) {
    if (member.roleId === 'tech') return true;
  }
  return false;
}

function calculateAutoTreatmentDuration(state: GameState, patient: PatientInstance): number {
  const doctorSkill = getBestDoctorSkill(state);
  const skillFactor = 1 - BALANCE.consultation.skillReductionPerLevel * (doctorSkill - 1);
  let duration = Math.max(AUTO_TREATMENT_MIN_SEC, AUTO_TREATMENT_BASE_SEC * skillFactor);

  if (hasTechAvailable(state)) {
    duration *= 1 - (BALANCE.staffPerks?.techSpeedReduction ?? DEFAULT_TECH_SPEED_REDUCTION);
  }

  const hasLab = Array.from(state.rooms.values()).some((r) => r.typeId === 'laboratory');
  const area = patient.clinicalCase.definition.area;
  if (hasLab && (area === 'Infectologia' || area === 'Endocrinologia')) {
    duration *= BALANCE.sectors.laboratorySpeedMultiplier;
  }

  const hasStaffRoom = Array.from(state.rooms.values()).some((r) => r.typeId === 'staff_room');
  if (hasStaffRoom) {
    duration *= BALANCE.sectors.staffRoomSpeedMultiplier;
  }

  const isTired = Array.from(state.staff.values()).some(
    (s) => (s.roleId === 'doctor' || s.roleId === 'nurse') && (s.energy ?? BALANCE.fatigue.energyInitial) < BALANCE.fatigue.tiredThreshold
  );
  if (isTired) {
    duration *= 1 + BALANCE.fatigue.tiredSpeedPenalty;
  }

  return duration;
}

function startAutoTreatment(state: GameState, patient: PatientInstance, roomId: string): void {
  const durationSec = calculateAutoTreatmentDuration(state, patient);

  patient.state = 'in_consultation';
  patient.consultationTimeSec = 0;
  patient.consultationDurationSec = durationSec;

  globalBus.emit('patient:auto_treatment_started', {
    patientId: patient.id,
    roomId,
    caseId: patient.clinicalCase.definition.id,
    durationSec,
  });
}

function startManualTreatment(state: GameState, patient: PatientInstance, roomId: string): void {
  patient.state = 'ready_for_treatment';

  if (!state.pendingDecisionPatientIds.includes(patient.id)) {
    state.pendingDecisionPatientIds.push(patient.id);
    globalBus.emit('decision:queue_updated', { pendingCount: state.pendingDecisionPatientIds.length });
  }

  globalBus.emit('patient:ready_for_treatment', {
    patientId: patient.id,
    roomId,
    patientName: patient.name,
  });
}

function startConsultationForNextPatient(state: GameState): void {
  if (!hasDoctorAvailable(state)) return;
  if (state.queueIds.length === 0) return;
  const room = findAvailableConsultationRoom(state);
  if (!room) return;

  const patientId = state.queueIds.shift()!;
  const patient = state.patients.get(patientId);
  if (!patient || patient.state !== 'waiting') return;

  patient.currentRoomId = room.id;
  addOccupant(room, patient.id);

  const isMastered = state.masteredCaseIds.includes(patient.clinicalCase.definition.id);
  if (isMastered) {
    startAutoTreatment(state, patient, room.id);
  } else {
    startManualTreatment(state, patient, room.id);
  }
}

function handleConsultationAbandonment(state: GameState, patient: PatientInstance): void {
  if (patient.currentRoomId) {
    const room = state.rooms.get(patient.currentRoomId);
    if (room) removeOccupant(room, patient.id);
  }
  patient.state = 'abandoned';
  patient.satisfaction = BALANCE.satisfaction.abandonedSatisfaction;
  state.stats.abandonedCount += 1;
  finishPatientDecision(state, patient.id);
  globalBus.emit('patient:abandoned', {
    patientId: patient.id,
    reason: 'Demora para atendimento médico no consultório',
  });
}

function progressConsultation(state: GameState, deltaSec: number): void {
  for (const patient of state.patients.values()) {
    if (patient.state === 'ready_for_treatment') {
      const doctorSkill = getBestDoctorSkill(state);
      const skillFactor = 1 - BALANCE.consultation.skillReductionPerLevel * (doctorSkill - 1);
      patient.waitTimeSec += deltaSec * (BALANCE.consultation.waitingPatienceFactor * skillFactor);

      if (patient.waitTimeSec >= patient.patienceSec) {
        handleConsultationAbandonment(state, patient);
      }
    } else if (patient.state === 'in_consultation') {
      patient.consultationTimeSec += deltaSec;
      if (patient.consultationTimeSec >= patient.consultationDurationSec) {
        // Concluir auto-resolução com sucesso
        patient.clinicalCase.decisionMade = true;
        patient.clinicalCase.isDecisionCorrect = true;
        patient.clinicalCase.chosenConductId = patient.clinicalCase.definition.suggestedConduct.id;
        patient.clinicalCase.feedbackText = patient.clinicalCase.definition.explanation;
        state.stats.totalDecisions += 1;
        state.stats.correctDecisions += 1;

        dischargePatient(state, patient.id, true);
      }
    }
  }
}

export function getNextPendingDecision(state: GameState): PatientInstance | null {
  while (state.pendingDecisionPatientIds.length > 0) {
    const nextId = state.pendingDecisionPatientIds[0]!;
    const pat = state.patients.get(nextId);
    if (pat && (pat.state === 'ready_for_treatment' || pat.state === 'needs_decision') && !pat.clinicalCase.decisionMade) {
      return pat;
    }
    state.pendingDecisionPatientIds.shift();
  }
  return null;
}

export function finishPatientDecision(state: GameState, patientId: string): void {
  state.pendingDecisionPatientIds = state.pendingDecisionPatientIds.filter((id) => id !== patientId);
  if (state.activeDecisionPatientId === patientId) {
    state.activeDecisionPatientId = null;
  }
  globalBus.emit('decision:queue_updated', { pendingCount: state.pendingDecisionPatientIds.length });
}

function releasePatientRoom(state: GameState, patient: PatientInstance): { col: number; row: number } {
  let col = 0;
  let row = 0;
  if (patient.currentRoomId) {
    const room = state.rooms.get(patient.currentRoomId);
    if (room) {
      col = room.col;
      row = room.row;
      removeOccupant(room, patient.id);
    }
  }
  return { col, row };
}

function calculateSpecializedSectorBonus(state: GameState, patient: PatientInstance): number {
  let bonus = 0;
  const area = patient.clinicalCase.definition.area;
  const symptoms = patient.clinicalCase.definition.symptoms;

  const hasXray = Array.from(state.rooms.values()).some((r) => r.typeId === 'xray');
  const isXrayArea = area === 'Pneumologia' || area === 'Ortopedia' || area === 'Trauma';
  const hasXraySymptoms = symptoms.some((s) => s.toLowerCase().includes('tórax') || s.toLowerCase().includes('fratura') || s.toLowerCase().includes('respirat'));
  if (hasXray && (isXrayArea || hasXraySymptoms)) {
    bonus += BALANCE.sectors.xraySigtapBonus;
  }

  const hasSurgeryOrIcu = Array.from(state.rooms.values()).some((r) => r.typeId === 'surgery' || r.typeId === 'icu');
  const isSevere = patient.clinicalCase.definition.severity === 'Grave' || patient.clinicalCase.definition.severity === 'Crítica';
  if (hasSurgeryOrIcu && isSevere) {
    bonus += BALANCE.sectors.surgeryIcuRevenue;
    state.finances.aihRevenue += BALANCE.sectors.surgeryIcuRevenue;
  }

  return bonus;
}

function processDischargeRevenue(state: GameState, patient: PatientInstance): { amount: number; source: 'bpa' | 'private' | 'contract' } {
  const pharmacyOk = hasPharmacy(state);
  let medStockOk = true;
  if (patient.clinicalCase.definition.requiresPharmacy && pharmacyOk) {
    const res = consumeMedicationsForCase(state, patient.clinicalCase.definition.id);
    medStockOk = res.success;
  }

  let sat = calculatePatientSatisfaction(patient, pharmacyOk, medStockOk);
  if ((state.cleanlinessRating ?? MAX_CLEANLINESS_RATING) >= CLEANLINESS_BENCHMARK) {
    sat = Math.min(MAX_SATISFACTION, sat + (BALANCE.staffPerks?.janitorCleanlinessBonus ?? DEFAULT_JANITOR_BONUS));
  }
  patient.satisfaction = sat;
  patient.state = 'treated';

  let baseRevenue = BALANCE.economy.revenuePerPatient;
  if (patient.clinicalCase.definition.requiresPharmacy && pharmacyOk && medStockOk) {
    baseRevenue += BALANCE.economy.pharmacyRevenue;
  }
  baseRevenue += calculateSpecializedSectorBonus(state, patient);

  if (patient.isHelipadEmergency) {
    baseRevenue += BALANCE.sectors.helipadReward ?? DEFAULT_HELIPAD_REWARD;
  }

  const result = calculatePatientConsultationRevenue(state, baseRevenue);
  state.cash += result.amount;
  state.stats.treatedCount += 1;
  deductStaffEnergyOnConsultation(state);
  checkHospitalProgression(state);
  return result;
}

export function dischargePatient(state: GameState, patientId: string, isAuto = false): void {
  const patient = state.patients.get(patientId);
  if (!patient) return;

  finishPatientDecision(state, patient.id);
  const { col, row } = releasePatientRoom(state, patient);
  const revenueInfo = processDischargeRevenue(state, patient);
  const revenue = revenueInfo.amount;

  const reasonLabel =
    revenueInfo.source === 'private'
      ? 'Consulta Particular faturada'
      : revenueInfo.source === 'contract'
        ? 'Atendimento Convênio Médico faturado'
        : 'Procedimento BPA faturado (SUS)';

  globalBus.emit('patient:treated', { patientId: patient.id, satisfaction: patient.satisfaction, revenue });
  globalBus.emit('patient:consultation_completed', { patientId: patient.id });
  globalBus.emit('cash:changed', { cash: state.cash, delta: revenue, reason: reasonLabel });

  const floatPrefix = isAuto ? '⚡ Auto ' : '';
  const heliPrefix = patient.isHelipadEmergency ? '🚁 SAMU ' : '';
  globalBus.emit('feedback:gain_float', {
    text: `${floatPrefix}${heliPrefix}+R$ ${revenue.toLocaleString('pt-BR')}`,
    col,
    row,
  });
}

export function updateConsultationSystem(state: GameState, deltaSec: number): void {
  startConsultationForNextPatient(state);
  progressConsultation(state, deltaSec);
}
