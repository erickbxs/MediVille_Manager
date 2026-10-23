/**
 * Arquivo: src/systems/queue-system.ts
 * O que faz: Atualiza a fila de espera, tempo acumulado, paciência dos pacientes e remoção por desistência.
 * Para que foi criado: Simular a tensão da fila de atendimento e penalizar a demora excessiva conforme o GDD.
 * Como modificar/debugar: Modifique queue.patienceSec ou satisfaction.abandonedSatisfaction em balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/entities/patient.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/consultation-system.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import { isPatientPatienceExhausted, type PatientInstance } from '../entities/patient';
import type { GameState } from '../state/game-state';

function handlePatientAbandonment(state: GameState, patient: PatientInstance): void {
  patient.state = 'abandoned';
  patient.satisfaction = BALANCE.satisfaction.abandonedSatisfaction;
  state.stats.abandonedCount += 1;

  const qIndex = state.queueIds.indexOf(patient.id);
  if (qIndex !== -1) {
    state.queueIds.splice(qIndex, 1);
  }

  globalBus.emit('patient:abandoned', {
    patientId: patient.id,
    reason: 'Paciência na fila esgotada',
  });
}

export function updateQueueSystem(state: GameState, deltaSec: number): void {
  for (const patientId of [...state.queueIds]) {
    const patient = state.patients.get(patientId);
    if (!patient || patient.state !== 'waiting') continue;

    patient.waitTimeSec += deltaSec;

    if (isPatientPatienceExhausted(patient)) {
      handlePatientAbandonment(state, patient);
    }
  }
}
