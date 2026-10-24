/**
 * Arquivo: src/systems/consultation-system.ts
 * O que faz: Coordena o atendimento em consultórios, alocação de pacientes da fila, disparo de decisões médicas e conclusão do caso.
 * Para que foi criado: É o coração do loop principal do MediVille Manager (atendimento e tomada de decisão clínica).
 * Como modificar/debugar: Caso queira mudar tempos de consulta ou regras de finalização, consulte este arquivo e balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/entities/room.ts, src/state/game-state.ts, src/systems/satisfaction-system.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/decision-modal.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import { addOccupant, removeOccupant, type RoomInstance } from '../entities/room';
import type { PatientInstance } from '../entities/patient';
import type { GameState } from '../state/game-state';
import { calculatePatientSatisfaction } from './satisfaction-system';
import { getBestDoctorSkill } from './staff-system';
import { consumeMedicationsForCase } from './economy-system';
import { checkHospitalProgression } from './progression-system';

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

function startConsultationForNextPatient(state: GameState): void {
  if (!hasDoctorAvailable(state)) return;
  if (state.queueIds.length === 0) return;
  const room = findAvailableConsultationRoom(state);
  if (!room) return;

  const patientId = state.queueIds.shift()!;
  const patient = state.patients.get(patientId);
  if (!patient || patient.state !== 'waiting') return;

  patient.state = 'ready_for_treatment';
  patient.currentRoomId = room.id;
  addOccupant(room, patient.id);

  if (!state.pendingDecisionPatientIds.includes(patient.id)) {
    state.pendingDecisionPatientIds.push(patient.id);
    globalBus.emit('decision:queue_updated', { pendingCount: state.pendingDecisionPatientIds.length });
  }

  globalBus.emit('patient:ready_for_treatment', {
    patientId: patient.id,
    roomId: room.id,
    patientName: patient.name,
  });
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
    if (patient.state !== 'ready_for_treatment' && patient.state !== 'in_consultation') continue;

    const doctorSkill = getBestDoctorSkill(state);
    const skillFactor = 1 - BALANCE.consultation.skillReductionPerLevel * (doctorSkill - 1);
    patient.waitTimeSec += deltaSec * (BALANCE.consultation.waitingPatienceFactor * skillFactor);

    if (patient.waitTimeSec >= patient.patienceSec) {
      handleConsultationAbandonment(state, patient);
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

export function dischargePatient(state: GameState, patientId: string): void {
  const patient = state.patients.get(patientId);
  if (!patient) return;

  finishPatientDecision(state, patient.id);
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

  const pharmacyOk = hasPharmacy(state);
  let medStockOk = true;
  if (patient.clinicalCase.definition.requiresPharmacy && pharmacyOk) {
    const res = consumeMedicationsForCase(state, patient.clinicalCase.definition.id);
    medStockOk = res.success;
  }

  patient.satisfaction = calculatePatientSatisfaction(patient, pharmacyOk, medStockOk);
  patient.state = 'treated';

  let revenue = BALANCE.economy.revenuePerPatient;
  if (patient.clinicalCase.definition.requiresPharmacy && pharmacyOk && medStockOk) {
    revenue += BALANCE.economy.pharmacyRevenue;
  }
  state.cash += revenue;
  state.finances.bpaRevenue += revenue;
  state.stats.treatedCount += 1;
  checkHospitalProgression(state);

  globalBus.emit('patient:treated', { patientId: patient.id, satisfaction: patient.satisfaction, revenue });
  globalBus.emit('cash:changed', { cash: state.cash, delta: revenue, reason: 'Procedimento BPA faturado (SUS)' });
  globalBus.emit('feedback:gain_float', { text: `+R$ ${revenue.toLocaleString('pt-BR')}`, col, row });
}

export function updateConsultationSystem(state: GameState, deltaSec: number): void {
  startConsultationForNextPatient(state);
  progressConsultation(state, deltaSec);
}
