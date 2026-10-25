/**
 * Arquivo: src/systems/arrival-system.ts
 * O que faz: Simula o fluxo contínuo de chegada de pacientes ao hospital baseado no tempo, número de setores e eventos ativos.
 * Para que foi criado: Aumentar a demanda conforme o hospital cresce e reagir a eventos (epidemias, acidentes) do GDD.
 * Como modificar/debugar: Ajuste baseIntervalSec e sectorGrowthFactor em src/data/balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/systems/case-system.ts, src/systems/event-system.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/queue-system.ts
 */

import { BALANCE } from '../core/config';
import type { GameState } from '../state/game-state';
import { createPatient } from './case-system';
import { globalBus } from '../core/event-bus';
import { getActiveArrivalMultiplier } from './event-system';
import { calculateDemandMultiplier } from './economy-system';

const MIN_MARKET_MULTIPLIER = 0.1;
const DEFAULT_HELIPAD_INTERVAL_SEC = 60;

export function calculateArrivalInterval(sectorCount: number, eventMultiplier = 1.0, marketMultiplier = 1.0): number {
  const { baseIntervalSec, sectorGrowthFactor } = BALANCE.arrival;
  const sectorMult = 1 + sectorGrowthFactor * sectorCount;
  const totalMult = sectorMult * Math.max(0, eventMultiplier) * Math.max(MIN_MARKET_MULTIPLIER, marketMultiplier);
  return Math.max(1, baseIntervalSec / totalMult);
}

export function checkHelipadArrival(state: GameState, deltaSec: number): void {
  const hasHelipad = Array.from(state.rooms.values()).some((r) => r.typeId === 'helipad');
  if (!hasHelipad) return;

  const interval = BALANCE.sectors.helipadArrivalIntervalSec ?? DEFAULT_HELIPAD_INTERVAL_SEC;
  state.helipadTimerSec = (state.helipadTimerSec ?? 0) + deltaSec;

  if (state.helipadTimerSec >= interval) {
    state.helipadTimerSec = 0;
    const patientId = `heli_pat_${Date.now()}`;
    const patient = createPatient(patientId, state.masteredCaseIds, 'hospital');
    patient.clinicalCase.definition.severity = 'Grave';
    patient.isHelipadEmergency = true;
    state.patients.set(patientId, patient);
    state.queueIds.unshift(patientId);
    globalBus.emit('patient:arrived', { patientId, name: `🚁 ${patient.name} (Aeromédico)` });
    globalBus.emit('helipad:landing', { patientId });
  }
}

export function updateArrivalSystem(state: GameState, deltaSec: number): void {
  const eventMult = getActiveArrivalMultiplier(state);
  const marketMult = calculateDemandMultiplier(state);
  const interval = calculateArrivalInterval(state.rooms.size, eventMult, marketMult);
  state.arrivalTimerSec += deltaSec;

  if (state.arrivalTimerSec >= interval) {
    state.arrivalTimerSec -= interval;
    const patientId = `pat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const patient = createPatient(patientId, state.masteredCaseIds, state.hospitalLevel);

    state.patients.set(patientId, patient);
    state.queueIds.push(patientId);
    patient.state = 'waiting';

    globalBus.emit('patient:arrived', { patientId, name: patient.name });
    globalBus.emit('patient:entered_queue', { patientId });
  }

  checkHelipadArrival(state, deltaSec);
}

