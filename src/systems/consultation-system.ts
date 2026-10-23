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
import type { GameState } from '../state/game-state';
import { calculatePatientSatisfaction } from './satisfaction-system';

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

function startConsultationForNextPatient(state: GameState): void {
  if (state.queueIds.length === 0) return;
  const room = findAvailableConsultationRoom(state);
  if (!room) return;

  const patientId = state.queueIds.shift()!;
  const patient = state.patients.get(patientId);
  if (!patient || patient.state !== 'waiting') return;

  patient.state = 'in_consultation';
  patient.currentRoomId = room.id;
  addOccupant(room, patient.id);
  globalBus.emit('patient:consultation_started', { patientId: patient.id, roomId: room.id });
}

function progressConsultation(state: GameState, deltaSec: number): void {
  for (const patient of state.patients.values()) {
    if (patient.state !== 'in_consultation') continue;
    patient.consultationTimeSec += deltaSec;

    if (patient.consultationTimeSec >= patient.consultationDurationSec && !patient.clinicalCase.decisionMade) {
      patient.state = 'needs_decision';
      if (!state.activeDecisionPatientId) {
        state.activeDecisionPatientId = patient.id;
      }
      globalBus.emit('patient:needs_decision', { patientId: patient.id });
    }
  }
}

export function dischargePatient(state: GameState, patientId: string): void {
  const patient = state.patients.get(patientId);
  if (!patient) return;

  if (patient.currentRoomId) {
    const room = state.rooms.get(patient.currentRoomId);
    if (room) removeOccupant(room, patient.id);
  }

  const pharmacyOk = hasPharmacy(state);
  patient.satisfaction = calculatePatientSatisfaction(patient, pharmacyOk);
  patient.state = 'treated';

  let revenue = BALANCE.economy.revenuePerPatient;
  if (patient.clinicalCase.definition.requiresPharmacy && pharmacyOk) {
    revenue += BALANCE.economy.pharmacyRevenue;
  }
  state.cash += revenue;
  state.stats.treatedCount += 1;

  globalBus.emit('patient:treated', { patientId: patient.id, satisfaction: patient.satisfaction, revenue });
  globalBus.emit('cash:changed', { cash: state.cash, delta: revenue, reason: 'Atendimento concluído' });
}

export function updateConsultationSystem(state: GameState, deltaSec: number): void {
  startConsultationForNextPatient(state);
  progressConsultation(state, deltaSec);
}
