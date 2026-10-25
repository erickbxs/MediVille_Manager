/**
 * Arquivo: src/state/game-state.ts
 * O que faz: Estrutura o estado central imutável da simulação (caixa, reputação, relógio, salas, pacientes e fila).
 * Para que foi criado: Manter uma fonte única da verdade para a simulação, facilitando testes e persistência.
 * Como modificar/debugar: Caso precise de novas estatísticas do hospital, adicione no objeto HospitalStats.
 * Importa: src/entities/room.ts, src/entities/patient.ts
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
  defeatReason: string | null;
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

