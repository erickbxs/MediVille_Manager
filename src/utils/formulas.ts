/**
 * Arquivo: src/utils/formulas.ts
 *
 * 1. O que este arquivo faz?
 * Implementa as 4 fórmulas matemáticas puras oficiais do GDD do MediVille Manager:
 * - Tempo de Atendimento com habilidade e fadiga: T_atend = T_base * (1 - 0.05 * (H - 1))
 * - Satisfação do Paciente limitada (0-100): S = clamp(100 - 20 * (T_espera / T_paciencia) - 15 * N_erros, 0, 100)
 * - Evolução Diária da Reputação (0-100): R_{dia+1} = clamp(R_{dia} + 0.1 * (S_{media} - R_{dia}), 0, 100)
 * - Taxa de Chegada de Pacientes por Setores: lambda = lambda_base * (1 + 0.1 * N_setores)
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 19, centralizando a calibragem do GDD lendo exclusivamente de balance.json,
 * sem números mágicos espalhados e com funções puras e determinísticas para os testes.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Todos os multiplicadores provêm de src/data/balance.json. Valide via tests/fatigue-weather-balance-and-6langs.test.ts.
 *
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/systems/satisfaction-system.ts,
 *                 src/systems/reputation-system.ts, src/systems/arrival-system.ts,
 *                 tests/formulas.test.ts, tests/fatigue-weather-balance-and-6langs.test.ts
 */

import { BALANCE } from '../core/config';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Fórmula 1: Tempo de Atendimento baseado na habilidade do profissional (H) e cansaço.
 * T_{atend} = T_{base} * (1 - 0.05 * (H - 1))
 */
export function calculateConsultationDuration(
  baseTimeSec = BALANCE.consultation.baseTimeSec,
  skill = 1,
  fatiguePenalty = 0
): number {
  const { skillMin, skillMax, skillReductionPerLevel } = BALANCE.consultation;
  const clampedSkill = clamp(skill, skillMin, skillMax);
  const skillFactor = 1 - skillReductionPerLevel * (clampedSkill - 1);
  const duration = baseTimeSec * skillFactor * (1 + fatiguePenalty);
  return Math.max(1, Math.round(duration));
}

/**
 * Fórmula 2: Satisfação do Paciente (0 a 100).
 * S = clamp(100 - 20 * (T_espera / T_paciencia) - 15 * N_erros, 0, 100)
 */
export function calculateSatisfaction(
  waitTimeSec: number,
  patienceSec = BALANCE.queue.patienceSec,
  errorsCount = 0
): number {
  const { min, max, waitPenalty, errorPenalty } = BALANCE.satisfaction;
  const waitRatio = patienceSec > 0 ? clamp(waitTimeSec / patienceSec, 0, 1) : 0;
  const score = max - (waitPenalty * waitRatio) - (errorPenalty * errorsCount);
  return Math.round(clamp(score, min, max));
}

/**
 * Fórmula 3: Reputação no dia seguinte (0 a 100).
 * R_{dia+1} = clamp(R_{dia} + 0.1 * (S_{media} - R_{dia}), 0, 100)
 */
export function calculateNextDayReputation(
  currentReputation = BALANCE.reputation.initial,
  averageSatisfaction = BALANCE.satisfaction.initial,
  learningRate = BALANCE.reputation.learningRate
): number {
  const { min, max } = BALANCE.satisfaction;
  const delta = learningRate * (averageSatisfaction - currentReputation);
  const updated = currentReputation + delta;
  return Math.round(clamp(updated, min, max) * 10) / 10;
}

/**
 * Fórmula 4: Taxa de Chegada de Pacientes (lambda) e Intervalo entre Chegadas.
 * lambda = lambda_base * (1 + 0.1 * N_setores)
 * I = I_base / (1 + 0.1 * N_setores)
 */
export function calculateArrivalRate(
  sectorCount: number,
  baseRatePerHour = BALANCE.time.dayDurationSec / BALANCE.arrival.baseIntervalSec,
  growthFactor = BALANCE.arrival.sectorGrowthFactor
): number {
  const factor = 1 + growthFactor * Math.max(0, sectorCount);
  return baseRatePerHour * factor;
}

export function calculateArrivalIntervalFromRate(
  sectorCount: number,
  baseIntervalSec = BALANCE.arrival.baseIntervalSec,
  growthFactor = BALANCE.arrival.sectorGrowthFactor
): number {
  const factor = 1 + growthFactor * Math.max(0, sectorCount);
  return Math.max(1, baseIntervalSec / factor);
}
