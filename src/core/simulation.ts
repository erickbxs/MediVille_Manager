/**
 * Arquivo: src/core/simulation.ts
 * O que faz: Coordena o avanço da simulação em passo fixo e expõe ações do jogador (construir, pausar, decidir condutas).
 * Para que foi criado: Isolar toda a lógica de jogo, mantendo-a pura e testável sem depender de DOM ou PixiJS.
 * Como modificar/debugar: Caso precise de novas ações de jogador, exponha métodos públicos aqui e emita eventos pelo globalBus.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/core/new-game.ts, src/state/game-state.ts, src/systems/*
 * Conecta-se com: src/core/game-loop.ts, src/ui/*, src/render/*
 */

import { BALANCE } from './config';
import { globalBus } from './event-bus';
import { createInitialGameState } from './new-game';
import type { GameState } from '../state/game-state';
import { updateArrivalSystem } from '../systems/arrival-system';
import { updateQueueSystem } from '../systems/queue-system';
import { dischargePatient, updateConsultationSystem } from '../systems/consultation-system';
import { updateDaySystem } from '../systems/day-system';
import { placeRoom as sysPlaceRoom, removeRoom as sysRemoveRoom } from '../systems/grid-system';

export class HospitalSimulation {
  public state: GameState;

  constructor(initialState?: GameState) {
    this.state = initialState ?? createInitialGameState();
  }

  public step(deltaSec: number): void {
    if (this.state.isDefeated || this.state.speed === 0) return;

    const scaledDelta = deltaSec * this.state.speed;
    updateArrivalSystem(this.state, scaledDelta);
    updateQueueSystem(this.state, scaledDelta);
    updateConsultationSystem(this.state, scaledDelta);
    updateDaySystem(this.state, scaledDelta);

    const dayProgress = this.state.dayTimeSec / BALANCE.time.dayDurationSec;
    globalBus.emit('tick', { day: this.state.day, dayProgress, speed: this.state.speed });
  }

  public setSpeed(speed: number): void {
    if (this.state.speed > 0 && speed === 0) {
      this.state.previousSpeed = this.state.speed;
    }
    this.state.speed = speed;
    globalBus.emit('state:changed', undefined);
  }

  public togglePause(): void {
    if (this.state.speed === 0) {
      this.setSpeed(this.state.previousSpeed || 1);
    } else {
      this.setSpeed(0);
    }
  }

  public buildRoom(typeId: string, col: number, row: number, rotated = false): boolean {
    const room = sysPlaceRoom(this.state, typeId, col, row, rotated);
    if (!room) return false;
    globalBus.emit('room:placed', { roomId: room.id, typeId, cost: room.definition.cost });
    globalBus.emit('cash:changed', { cash: this.state.cash, delta: -room.definition.cost, reason: 'Construção de sala' });
    globalBus.emit('state:changed', undefined);
    return true;
  }

  public demolishRoom(roomId: string): boolean {
    const refund = sysRemoveRoom(this.state, roomId);
    if (refund <= 0) return false;
    globalBus.emit('room:removed', { roomId, refund });
    globalBus.emit('cash:changed', { cash: this.state.cash, delta: refund, reason: 'Venda de sala' });
    globalBus.emit('state:changed', undefined);
    return true;
  }

  public submitClinicalDecision(patientId: string, conductId: string): boolean {
    const patient = this.state.patients.get(patientId);
    if (!patient || patient.state !== 'needs_decision') return false;

    const chosen = patient.clinicalCase.conductOptions.find((c) => c.id === conductId);
    if (!chosen) return false;

    patient.clinicalCase.chosenConductId = conductId;
    patient.clinicalCase.decisionMade = true;
    patient.clinicalCase.isDecisionCorrect = chosen.isCorrect;
    patient.clinicalCase.feedbackText = chosen.isCorrect
      ? patient.clinicalCase.definition.explanation
      : (chosen.whyWrong || 'Conduta não recomendada para este quadro clínico.');

    this.state.stats.totalDecisions += 1;
    if (chosen.isCorrect) {
      this.state.stats.correctDecisions += 1;
    } else {
      patient.errorsCount += 1;
    }

    dischargePatient(this.state, patient.id);
    if (this.state.activeDecisionPatientId === patient.id) {
      this.state.activeDecisionPatientId = null;
    }
    globalBus.emit('state:changed', undefined);
    return true;
  }
}
