/**
 * Arquivo: src/systems/day-system.ts
 * O que faz: Gerencia a virada do dia, desconto da manutenção das salas, atualização da reputação e verificação das regras de derrota.
 * Para que foi criado: Simular a rotina contínua do hospital e aplicar as consequências de gestão financeira e clínica.
 * Como modificar/debugar: Limites de derrota (7 dias) e duração do dia (60s) vêm de balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/systems/reputation-system.ts, src/systems/defeat-system.ts
 * Conecta-se com: src/core/simulation.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';
import { calculateNewReputation } from './reputation-system';
import { calculateTotalDailyStaffSalaries } from './staff-system';
import { processMinistryDailyTransfer } from './economy-system';
import { checkDefeatAndWarnings } from './defeat-system';

const MAX_REPUTATION = 100;
const PERCENT_SCALE = 100;
const DEFAULT_MANAGER_UPKEEP_DISCOUNT_PER_SKILL = 0.1;
const MAX_CLEANLINESS_RATING = 100;
const JANITOR_CLEANLINESS_DAILY_BOOST = 20;
const UNATTENDED_CLEANLINESS_DAILY_PENALTY = 15;

function deductDailyUpkeep(state: GameState): number {
  let totalUpkeep = 0;
  for (const room of state.rooms.values()) {
    totalUpkeep += room.definition.dailyUpkeep;
  }

  let managerStars = 0;
  for (const member of state.staff.values()) {
    if (member.roleId === 'manager') {
      managerStars += member.skill;
    }
  }
  const discountPerSkill = BALANCE.staffPerks?.managerUpkeepReductionPerSkill ?? DEFAULT_MANAGER_UPKEEP_DISCOUNT_PER_SKILL;
  const discountRatio = Math.min(0.5, managerStars * discountPerSkill);
  const discountedUpkeep = Math.round(totalUpkeep * (1 - discountRatio));

  const staffSalaries = calculateTotalDailyStaffSalaries(state);
  const totalDailyCost = discountedUpkeep + staffSalaries;

  state.cash -= totalDailyCost;
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: -totalDailyCost,
    reason: discountRatio > 0
      ? `Manutenção predial (desconto gestor -${Math.round(discountRatio * PERCENT_SCALE)}%) e folha salarial`
      : 'Manutenção predial e folha salarial da equipe',
  });
  return totalDailyCost;
}


function applyVaccinationDailyBonus(state: GameState): void {
  const hasVax = Array.from(state.rooms.values()).some((r) => r.typeId === 'vaccination');
  if (!hasVax) return;

  const bonus = BALANCE.sectors.vaccinationDailyBonus;
  const repBonus = BALANCE.sectors.vaccinationReputationBonus;
  state.cash += bonus;
  state.finances.ministryTransfers += bonus;
  state.reputation = Math.min(MAX_REPUTATION, Math.round((state.reputation + repBonus) * 10) / 10);

  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: bonus,
    reason: 'Bônus diário de Cobertura Vacinal (PNI)',
  });
}

function updateCleanlinessRating(state: GameState): void {
  const hasJanitor = Array.from(state.staff.values()).some((s) => s.roleId === 'janitor');
  const current = state.cleanlinessRating ?? MAX_CLEANLINESS_RATING;
  if (hasJanitor) {
    state.cleanlinessRating = Math.min(MAX_CLEANLINESS_RATING, current + JANITOR_CLEANLINESS_DAILY_BOOST);
  } else {
    state.cleanlinessRating = Math.max(0, current - UNATTENDED_CLEANLINESS_DAILY_PENALTY);
  }
}

export function updateDaySystem(state: GameState, deltaSec: number): void {
  const { dayDurationSec } = BALANCE.time;
  state.dayTimeSec += deltaSec;

  if (state.dayTimeSec >= dayDurationSec) {
    state.dayTimeSec -= dayDurationSec;
    deductDailyUpkeep(state);
    processMinistryDailyTransfer(state);
    applyVaccinationDailyBonus(state);
    updateCleanlinessRating(state);

    if (state.governmentNegotiationCooldownDays > 0) {
      state.governmentNegotiationCooldownDays -= 1;
    }

    const newRep = calculateNewReputation(state.reputation, state.satisfactionAverage);
    const repDelta = Math.round((newRep - state.reputation) * 10) / 10;
    state.reputation = newRep;
    globalBus.emit('reputation:changed', { reputation: state.reputation, delta: repDelta });

    checkDefeatAndWarnings(state);
    state.day += 1;

    globalBus.emit('day:end', {
      day: state.day,
      cash: state.cash,
      reputation: state.reputation,
      patientsTreated: state.stats.treatedCount,
    });
  }
}
