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
import type { PatientInstance } from '../entities/patient';
import { updateArrivalSystem } from '../systems/arrival-system';
import { updateQueueSystem } from '../systems/queue-system';
import { dischargePatient, updateConsultationSystem } from '../systems/consultation-system';
import { updateDaySystem } from '../systems/day-system';
import { placeRoom as sysPlaceRoom, removeRoom as sysRemoveRoom, moveRoom as sysMoveRoom } from '../systems/grid-system';
import { updateEventSystem } from '../systems/event-system';
import { hireStaff as sysHireStaff, fireStaff as sysFireStaff } from '../systems/staff-system';
import { goalsSystem } from '../systems/goals-system';

export class HospitalSimulation {
  public state: GameState;
  private modalPauseSpeed: number | null = null;

  constructor(initialStateOrChoice?: GameState | 'ubs' | 'upa' | 'clinica' | 'hospital') {
    if (typeof initialStateOrChoice === 'string') {
      this.state = createInitialGameState(initialStateOrChoice);
    } else {
      this.state = initialStateOrChoice ?? createInitialGameState();
    }
  }

  public step(deltaSec: number): void {
    if (this.state.isDefeated || this.state.speed === 0) return;

    const scaledDelta = deltaSec * this.state.speed;
    updateArrivalSystem(this.state, scaledDelta);
    updateQueueSystem(this.state, scaledDelta);
    updateConsultationSystem(this.state, scaledDelta);
    updateEventSystem(this.state, scaledDelta);
    updateDaySystem(this.state, scaledDelta);

    const dayProgress = this.state.dayTimeSec / BALANCE.time.dayDurationSec;
    globalBus.emit('tick', { day: this.state.day, dayProgress, speed: this.state.speed });
  }

  public setSpeed(speed: number): void {
    if (this.state.speed > 0 && speed === 0) {
      this.state.previousSpeed = this.state.speed;
    }
    this.state.speed = speed;
    globalBus.emit('simulation:speed_changed', { speed });
    globalBus.emit('state:changed', undefined);
  }

  public pauseForModal(): void {
    if (this.modalPauseSpeed === null) {
      this.modalPauseSpeed = this.state.speed;
      this.setSpeed(0);
    }
  }

  public resumeFromModal(): void {
    if (this.modalPauseSpeed !== null) {
      const restore = this.modalPauseSpeed;
      this.modalPauseSpeed = null;
      this.setSpeed(restore > 0 ? restore : 1);
    }
  }

  public triggerConsultation(patientId: string): PatientInstance | null {
    const patient = this.state.patients.get(patientId);
    if (!patient) return null;
    if (patient.state === 'ready_for_treatment' || patient.state === 'needs_decision') {
      patient.state = 'needs_decision';
      return patient;
    }
    return null;
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

  public moveRoom(roomId: string, newCol: number, newRow: number, newRotated = false): boolean {
    const moved = sysMoveRoom(this.state, roomId, newCol, newRow, newRotated);
    if (!moved) return false;
    globalBus.emit('room:moved', { roomId, col: newCol, row: newRow, rotated: newRotated });
    globalBus.emit('state:changed', undefined);
    return true;
  }

  public submitClinicalDecision(patientId: string, conductId: string): boolean {
    const patient = this.state.patients.get(patientId);
    if (!patient || (patient.state !== 'needs_decision' && patient.state !== 'ready_for_treatment')) return false;

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
      goalsSystem.unlockCase(patient.clinicalCase.definition.id);
    } else {
      patient.errorsCount += 1;
    }

    dischargePatient(this.state, patient.id);
    goalsSystem.checkGoals(this.state);
    if (this.state.activeDecisionPatientId === patient.id) {
      this.state.activeDecisionPatientId = null;
    }
    globalBus.emit('state:changed', undefined);
    return true;
  }

  public hireStaff(roleId: string, skill?: number): boolean {
    const member = sysHireStaff(this.state, roleId, skill);
    return member !== null;
  }

  public fireStaff(staffId: string): boolean {
    return sysFireStaff(this.state, staffId);
  }
}
