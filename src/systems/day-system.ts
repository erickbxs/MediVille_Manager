/**
 * Arquivo: src/systems/day-system.ts
 * O que faz: Gerencia a virada do dia, desconto da manutenção das salas, atualização da reputação e verificação das regras de derrota.
 * Para que foi criado: Simular a rotina contínua do hospital e aplicar as consequências de gestão financeira e clínica.
 * Como modificar/debugar: Limites de derrota (7 dias) e duração do dia (60s) vêm de balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/systems/reputation-system.ts
 * Conecta-se com: src/core/simulation.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';
import { calculateNewReputation } from './reputation-system';
import { calculateTotalDailyStaffSalaries } from './staff-system';
import { processMinistryDailyTransfer } from './economy-system';

function deductDailyUpkeep(state: GameState): number {
  let totalUpkeep = 0;
  for (const room of state.rooms.values()) {
    totalUpkeep += room.definition.dailyUpkeep;
  }
  const staffSalaries = calculateTotalDailyStaffSalaries(state);
  const totalDailyCost = totalUpkeep + staffSalaries;

  state.cash -= totalDailyCost;
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: -totalDailyCost,
    reason: 'Manutenção predial e folha salarial da equipe',
  });
  return totalDailyCost;
}

function checkDefeatConditions(state: GameState): void {
  const { graceDays, minCash, minReputation } = BALANCE.defeat;

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

  if (state.consecutiveNegativeCashDays >= graceDays) {
    state.isDefeated = true;
    state.defeatReason = 'Falência: Caixa negativo por 7 dias consecutivos.';
    globalBus.emit('game:defeat', { reason: state.defeatReason });
  } else if (state.consecutiveLowReputationDays >= graceDays) {
    state.isDefeated = true;
    state.defeatReason = 'Reputação crítica abaixo de 10 por 7 dias consecutivos.';
    globalBus.emit('game:defeat', { reason: state.defeatReason });
  }
}

export function updateDaySystem(state: GameState, deltaSec: number): void {
  const { dayDurationSec } = BALANCE.time;
  state.dayTimeSec += deltaSec;

  if (state.dayTimeSec >= dayDurationSec) {
    state.dayTimeSec -= dayDurationSec;
    deductDailyUpkeep(state);
    processMinistryDailyTransfer(state);

    const newRep = calculateNewReputation(state.reputation, state.satisfactionAverage);
    const repDelta = Math.round((newRep - state.reputation) * 10) / 10;
    state.reputation = newRep;
    globalBus.emit('reputation:changed', { reputation: state.reputation, delta: repDelta });

    checkDefeatConditions(state);
    state.day += 1;

    globalBus.emit('day:end', {
      day: state.day,
      cash: state.cash,
      reputation: state.reputation,
      patientsTreated: state.stats.treatedCount,
    });
  }
}
