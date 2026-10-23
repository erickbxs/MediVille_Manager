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
  stats: HospitalStats;
  arrivalTimerSec: number;
  staff: Map<string, StaffMember>;
  activeEvents: ActiveEvent[];
  eventTimerSec: number;
}
