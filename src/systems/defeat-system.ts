/**
 * Arquivo: src/systems/defeat-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a verificação de condições de derrota (falência financeira ou colapso de reputação por 7 dias),
 * emite alertas críticos pré-derrota (aos 5 e 6 dias consecutivos), rastreia marcos históricos da partida
 * e calcula a pontuação final para a tela de Game Over e Ranking.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 14, garantindo aviso acionável com as 3 saídas do GDD e transição consistente
 * para o encerramento da partida sem travamento da simulação.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste os parâmetros de derrota em src/data/balance.json (defeat.graceDays, defeat.minCash, defeat.minReputation).
 *
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts
 * Conecta-se com: src/systems/day-system.ts, src/ui/game-over-modal.ts, src/ui/defeat-warning-modal.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';

export interface DefeatWarningInfo {
  type: 'cash' | 'reputation';
  consecutiveDays: number;
  daysRemaining: number;
}

export interface FinalScoreSummary {
  days: number;
  patientsTreated: number;
  masteredCases: number;
  finalReputation: number;
  score: number;
}

const EMERGENCY_GRANT_AMOUNT = 15000;
const IDLE_ROOM_REFUND_RATIO = 0.5;
const WARNING_THRESHOLD_DAYS = 5;
const SCORE_POINTS_PER_DAY = 100;
const SCORE_POINTS_PER_PATIENT = 50;
const SCORE_POINTS_PER_PROTOCOL = 200;
const SCORE_POINTS_PER_REP = 10;
const PATIENTS_TIER_1 = 100;
const PATIENTS_TIER_2 = 500;
const PATIENTS_TIER_3 = 1000;
const PROTOCOLS_TIER_1 = 50;
const PROTOCOLS_TIER_2 = 100;
const PROTOCOLS_TIER_3 = 150;

export function calculateFinalScore(state: GameState): FinalScoreSummary {
  const days = Math.max(1, state.day);
  const patientsTreated = state.stats?.treatedCount ?? 0;
  const masteredCases = state.masteredCaseIds?.length ?? 0;
  const finalReputation = Math.max(0, Math.round(state.reputation));

  const score = (days * SCORE_POINTS_PER_DAY)
    + (patientsTreated * SCORE_POINTS_PER_PATIENT)
    + (masteredCases * SCORE_POINTS_PER_PROTOCOL)
    + (finalReputation * SCORE_POINTS_PER_REP);

  return { days, patientsTreated, masteredCases, finalReputation, score };
}

export function checkGameMilestones(state: GameState): string[] {
  const current = state.milestones ?? [];
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean, title: string, desc: string): void => {
    if (condition && !current.includes(id)) {
      current.push(id);
      newlyUnlocked.push(id);
      globalBus.emit('milestone:unlocked', { id, title, description: desc });
    }
  };

  const treated = state.stats?.treatedCount ?? 0;
  const mastered = state.masteredCaseIds?.length ?? 0;

  check('milestone_hospital_medium', state.hospitalLevel === 'upa' || state.hospitalLevel === 'hospital', 'Hospital de Médio Porte', 'Alcançou nível de UPA ou Hospital');
  check('milestone_hospital_large', state.hospitalLevel === 'hospital', 'Hospital de Grande Porte', 'Construiu a estrutura máxima de atendimento SUS');
  check('milestone_patients_100', treated >= PATIENTS_TIER_1, '100 Vidas Salvas', 'Atendeu 100 pacientes com sucesso');
  check('milestone_patients_500', treated >= PATIENTS_TIER_2, '500 Vidas Salvas', 'Atendeu 500 pacientes com sucesso');
  check('milestone_patients_1000', treated >= PATIENTS_TIER_3, '1.000 Vidas Salvas', 'Hospital de referência regional');
  check('milestone_protocols_50', mastered >= PROTOCOLS_TIER_1, '50 Protocolos Dominados', 'Amplo domínio das diretrizes clínicas do SUS');
  check('milestone_protocols_100', mastered >= PROTOCOLS_TIER_2, '100 Protocolos Dominados', 'Centro de excelência médica do Ministério da Saúde');
  check('milestone_protocols_150', mastered >= PROTOCOLS_TIER_3, '150 Protocolos Dominados', 'Mestre Absoluto da Enciclopédia RENAME');

  state.milestones = current;
  return newlyUnlocked;
}

function evaluateCounters(state: GameState): { cashDanger: boolean; repDanger: boolean } {
  const { minCash, minReputation } = BALANCE.defeat;

  if (state.cash < minCash) {
    state.consecutiveNegativeCashDays += 1;
  } else {
    state.consecutiveNegativeCashDays = 0;
  }

  if (state.reputation < minReputation) {
    state.consecutiveLowReputationDays += 1;
  } else {
    state.consecutiveLowReputationDays = 0;
  }

  return {
    cashDanger: state.consecutiveNegativeCashDays >= WARNING_THRESHOLD_DAYS,
    repDanger: state.consecutiveLowReputationDays >= WARNING_THRESHOLD_DAYS,
  };
}

function triggerDefeatWarningIfNeeded(state: GameState, cashDanger: boolean, repDanger: boolean): void {
  const { graceDays } = BALANCE.defeat;

  if (cashDanger && state.consecutiveNegativeCashDays < graceDays) {
    const daysRemaining = graceDays - state.consecutiveNegativeCashDays;
    globalBus.emit('defeat:warning', {
      type: 'cash',
      consecutiveDays: state.consecutiveNegativeCashDays,
      daysRemaining,
    });
  }

  if (repDanger && state.consecutiveLowReputationDays < graceDays) {
    const daysRemaining = graceDays - state.consecutiveLowReputationDays;
    globalBus.emit('defeat:warning', {
      type: 'reputation',
      consecutiveDays: state.consecutiveLowReputationDays,
      daysRemaining,
    });
  }
}

export function checkDefeatAndWarnings(state: GameState): boolean {
  const { graceDays } = BALANCE.defeat;
  const { cashDanger, repDanger } = evaluateCounters(state);

  triggerDefeatWarningIfNeeded(state, cashDanger, repDanger);

  if (state.consecutiveNegativeCashDays >= graceDays) {
    state.isDefeated = true;
    state.isGameOver = true;
    state.defeatReason = 'Falência: Caixa negativo por 7 dias consecutivos.';
    const summary = calculateFinalScore(state);
    globalBus.emit('game:defeat', { reason: state.defeatReason });
    globalBus.emit('game:over', { reason: state.defeatReason, stats: summary });
    return true;
  }

  if (state.consecutiveLowReputationDays >= graceDays) {
    state.isDefeated = true;
    state.isGameOver = true;
    state.defeatReason = 'Reputação crítica abaixo de 10 por 7 dias consecutivos.';
    const summary = calculateFinalScore(state);
    globalBus.emit('game:defeat', { reason: state.defeatReason });
    globalBus.emit('game:over', { reason: state.defeatReason, stats: summary });
    return true;
  }

  checkGameMilestones(state);
  return false;
}

export function executeEmergencyTransferRescue(state: GameState): { success: boolean; amount: number; message: string } {
  state.cash += EMERGENCY_GRANT_AMOUNT;
  state.consecutiveNegativeCashDays = 0;
  state.finances.emergencyGrants += EMERGENCY_GRANT_AMOUNT;

  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: EMERGENCY_GRANT_AMOUNT,
    reason: 'Repasse de Emergência Governamental (Socorro Financeiro SUS)',
  });

  return {
    success: true,
    amount: EMERGENCY_GRANT_AMOUNT,
    message: 'Repasse emergencial de R$ 15.000 concedido! O contador de falência foi resetado.',
  };
}

export function executeDemolishIdleRoomRescue(state: GameState, roomId: string): { success: boolean; refund: number } {
  const room = state.rooms.get(roomId);
  if (!room) return { success: false, refund: 0 };

  const refund = Math.round(room.definition.cost * IDLE_ROOM_REFUND_RATIO);
  state.rooms.delete(roomId);
  state.cash += refund;

  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: refund,
    reason: `Desmobilização emergencial da sala ${room.definition.id} (+50% reembolso)`,
  });
  globalBus.emit('room:removed', { roomId, refund });

  return { success: true, refund };
}
