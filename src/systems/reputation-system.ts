/**
 * Arquivo: src/systems/reputation-system.ts
 * O que faz: Atualiza a reputação diária do hospital com base na média de satisfação dos pacientes atendidos: R_{dia+1} = R_{dia} + 0.1 * (S_{media} - R_{dia}).
 * Para que foi criado: Seguir o modelo de progressão e risco de derrota por reputação descritos no GDD.
 * Como modificar/debugar: A taxa de aprendizado e limites vêm de src/data/balance.json.
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/day-system.ts, tests/formulas.test.ts
 */

import { BALANCE } from '../core/config';

export function calculateNewReputation(
  currentReputation: number,
  averageSatisfaction: number
): number {
  const { learningRate } = BALANCE.reputation;
  const { min, max } = BALANCE.satisfaction;

  const delta = learningRate * (averageSatisfaction - currentReputation);
  const updated = currentReputation + delta;

  return Math.max(min, Math.min(max, Math.round(updated * 10) / 10));
}
