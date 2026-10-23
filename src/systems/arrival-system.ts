/**
 * Arquivo: src/systems/arrival-system.ts
 * O que faz: Simula o fluxo contínuo de chegada de pacientes ao hospital baseado no tempo e número de setores instalados.
 * Para que foi criado: Aumentar a demanda conforme o hospital cresce, seguindo a fórmula lambda do GDD.
 * Como modificar/debugar: Ajuste baseIntervalSec e sectorGrowthFactor em src/data/balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/systems/case-system.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/queue-system.ts
 */

import { BALANCE } from '../core/config';
import type { GameState } from '../state/game-state';
import { createPatient } from './case-system';
import { globalBus } from '../core/event-bus';

export function calculateArrivalInterval(sectorCount: number): number {
  const { baseIntervalSec, sectorGrowthFactor } = BALANCE.arrival;
  const multiplier = 1 + sectorGrowthFactor * sectorCount;
  return Math.max(1, baseIntervalSec / multiplier);
}

export function updateArrivalSystem(state: GameState, deltaSec: number): void {
  const interval = calculateArrivalInterval(state.rooms.size);
  state.arrivalTimerSec += deltaSec;

  if (state.arrivalTimerSec >= interval) {
    state.arrivalTimerSec -= interval;
    const patientId = `pat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const patient = createPatient(patientId);

    state.patients.set(patientId, patient);
    state.queueIds.push(patientId);
    patient.state = 'waiting';

    globalBus.emit('patient:arrived', { patientId, name: patient.name });
    globalBus.emit('patient:entered_queue', { patientId });
  }
}
