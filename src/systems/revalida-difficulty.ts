/**
 * Arquivo: src/systems/revalida-difficulty.ts
 * O que faz: Níveis do Modo Revalida. Fácil e Médio riscam uma alternativa errada oficial (o texto da prova não muda):
 * Fácil risca a "pegadinha" (errada mais parecida com a certa) e deixa as erradas mais distantes;
 * Médio risca a errada mais óbvia e mantém a pegadinha; Difícil mostra as 4 alternativas da prova.
 * Para que foi criado: Permitir treinar em dias mais leves sem alterar as questões do INEP (licença CC BY-ND).
 * Como modificar/debugar: Parâmetros em src/data/balance.json → revalida.difficulty. A "parecença" é a proporção de
 * palavras em comum (com 4+ letras, sem acento) entre a alternativa errada e a certa.
 * Importa: src/core/config.ts, src/core/config-types.ts, src/entities/clinical-case.ts
 * Conecta-se com: src/systems/case-system.ts, src/systems/consultation-system.ts, src/ui/settings-modal.ts, src/ui/decision-modal.ts
 */

import { BALANCE } from '../core/config';
import type { RevalidaDifficulty } from '../core/config-types';
import type { ConductOption } from '../entities/clinical-case';

const MIN_WORD_LENGTH = 4;
/** Precisa sobrar ao menos uma errada além da riscada. */
const MIN_WRONG_TO_ELIMINATE = 2;
const DIFFICULTIES: RevalidaDifficulty[] = ['facil', 'medio', 'dificil'];

const preference = { level: BALANCE.revalida.difficulty.default as RevalidaDifficulty };

export function getRevalidaDifficulty(): RevalidaDifficulty {
  return preference.level;
}

export function setRevalidaDifficulty(level: string): void {
  if ((DIFFICULTIES as string[]).includes(level)) preference.level = level as RevalidaDifficulty;
}

export function getDifficultyRewardMultiplier(level: RevalidaDifficulty = preference.level): number {
  return BALANCE.revalida.difficulty.levels[level].rewardMultiplier;
}

function words(text: string): Set<string> {
  const plain = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return new Set(plain.split(/[^a-z0-9]+/).filter((w) => w.length >= MIN_WORD_LENGTH));
}

/** Parecença entre duas alternativas (0 = nada em comum, 1 = mesmas palavras). */
export function optionSimilarity(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  wa.forEach((w) => { if (wb.has(w)) shared += 1; });
  return shared / (wa.size + wb.size - shared);
}

/** Marca como riscada uma alternativa errada, conforme o nível. Não altera textos nem a ordem A–D. */
export function applyDifficulty(options: ConductOption[], level: RevalidaDifficulty = preference.level): ConductOption[] {
  const rule = BALANCE.revalida.difficulty.levels[level].eliminate;
  const correct = options.find((o) => o.isCorrect);
  const wrong = options.filter((o) => !o.isCorrect);
  if (rule === 'none' || !correct || wrong.length < MIN_WRONG_TO_ELIMINATE) return options.map((o) => ({ ...o, eliminated: false }));
  const ranked = [...wrong].sort((x, y) => optionSimilarity(y.text, correct.text) - optionSimilarity(x.text, correct.text));
  const target = rule === 'tricky' ? ranked[0] : ranked[ranked.length - 1];
  return options.map((o) => ({ ...o, eliminated: o.id === target?.id }));
}
