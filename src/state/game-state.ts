/**
 * Arquivo: src/state/game-state.ts
 *
 * 1. O que este arquivo faz?
 * Estrutura o estado central imutável da simulação (caixa, reputação, relógio, salas, pacientes, fila e timers de eventos).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter uma fonte única da verdade para a simulação, facilitando testes, persistência e sincronização de subsistemas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Novos contadores, timers de transporte (ônibus, SAMU) ou estatísticas clínicas devem ser tipados na interface GameState.
 *
 * Importa: src/entities/room.ts, src/entities/patient.ts, src/entities/staff.ts, src/entities/event.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/*, src/ui/hud.ts
 */

import type { RoomInstance } from '../entities/room';
import type { PatientInstance } from '../entities/patient';
import type { StaffMember } from '../entities/staff';
import type { ActiveEvent } from '../entities/event';

export interface HospitalStats {
  treatedCount: number;
  abandonedCount: number;
  totalDecisions: number;
  correctDecisions: number;
}

export interface FinancialStats {
  bpaRevenue: number;
  aihRevenue: number;
  ministryTransfers: number;
  emergencyGrants: number;
  medicationPurchases: number;
  privateRevenue: number;
  contractsRevenue: number;
}

export interface GameState {
  day: number;
  dayTimeSec: number;
  speed: number;
  previousSpeed: number;
  cash: number;
  reputation: number;
  satisfactionAverage: number;
  consecutiveNegativeCashDays: number;
  consecutiveLowReputationDays: number;
  isDefeated: boolean;
  isGameOver?: boolean;
  defeatReason: string | null;
  milestones?: string[];
  gridSize?: number;
  rooms: Map<string, RoomInstance>;
  patients: Map<string, PatientInstance>;
  queueIds: string[];
  activeDecisionPatientId: string | null;
  pendingDecisionPatientIds: string[];
  hospitalLevel: 'ubs' | 'upa' | 'hospital';
  unitType: 'private_clinic' | 'ubs' | 'upa' | 'hospital';
  privateConsultationFee: number;
  activeContracts: string[];
  cleanlinessRating: number;
  helipadTimerSec: number;
  busArrivalTimerSec?: number;
  unlockedRoomIds: string[];
  seenTutorialTips: string[];
  movingRoomId: string | null;
  stats: HospitalStats;
  arrivalTimerSec: number;
  staff: Map<string, StaffMember>;
  activeEvents: ActiveEvent[];
  eventTimerSec: number;
  pharmacyStock: Record<string, number>;
  finances: FinancialStats;
  masteredCaseIds: string[];
  governmentNegotiationCooldownDays: number;
  governmentGrantBonusMultiplier: number;
  dismissedAdvisorAlertIds: string[];
}

