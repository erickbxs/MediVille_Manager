/**
 * Arquivo: src/ui/progression-bar.ts
 *
 * 1. O que este arquivo faz?
 * Calcula e renderiza barras de progresso visuais com o Efeito Zeigarnik e Efeito Gradiente de Meta:
 * - Evolução da unidade de saúde (UBS ➔ UPA 24h ➔ Hospital Geral)
 * - Progresso de protocolos clínicos dominados no SUS (0 a 250 casos)
 * - Ativação visual de destaque dourado/esmeralda com brilho animado quando o progresso atinge >= 75%.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 18, aplicando princípios da psicologia cognitiva para aumentar a motivação
 * e o engajamento do jogador ao aproximar-se da conclusão de metas e níveis.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * As funções de cálculo são determinísticas e puras. Limiares de nível provêm de BALANCE.progression.levels.
 *
 * Importa: src/core/config.ts, src/state/game-state.ts, src/i18n/i18n.ts
 * Conecta-se com: src/ui/hud.ts, src/ui/encyclopedia-modal.ts, tests/ux-20-laws-and-aesthetics.test.ts
 */

import { BALANCE, CASES_CATALOG } from '../core/config';
import type { GameState } from '../state/game-state';

export const NEAR_COMPLETION_THRESHOLD = 75;
export const MAX_PERCENT = 100;

export interface GoalProgressResult {
  percent: number;
  percentage: number;
  isNearCompletion: boolean;
  isHighlighted: boolean;
}

export interface UnitProgressionResult {
  currentLevel: string;
  nextLevel: string | null;
  percent: number;
  percentage: number;
  isNearCompletion: boolean;
  isHighlighted: boolean;
  treatedRatio: number;
  reputationRatio: number;
}

export interface ProtocolProgressionResult {
  masteredCount: number;
  totalCount: number;
  percent: number;
  percentage: number;
  isNearCompletion: boolean;
  isHighlighted: boolean;
}

export function calculateGoalProgress(current: number, target: number): GoalProgressResult {
  if (target <= 0) {
    return {
      percent: MAX_PERCENT,
      percentage: MAX_PERCENT,
      isNearCompletion: true,
      isHighlighted: true,
    };
  }
  const raw = (current / target) * MAX_PERCENT;
  const percent = Math.min(MAX_PERCENT, Math.max(0, Math.round(raw)));
  const isNear = percent >= NEAR_COMPLETION_THRESHOLD;
  return {
    percent,
    percentage: percent,
    isNearCompletion: isNear,
    isHighlighted: isNear,
  };
}

export function calculateUnitLevelProgress(state: GameState): UnitProgressionResult {
  const current = state.hospitalLevel;
  const treated = state.stats.treatedCount;
  const rep = state.reputation;

  const targetConfig = current === 'ubs'
    ? BALANCE.progression.levels.find((l) => l.id === 'upa')
    : current === 'upa'
      ? BALANCE.progression.levels.find((l) => l.id === 'hospital')
      : null;

  if (!targetConfig) {
    return {
      currentLevel: 'HOSPITAL',
      nextLevel: null,
      percent: MAX_PERCENT,
      percentage: MAX_PERCENT,
      isNearCompletion: true,
      isHighlighted: true,
      treatedRatio: 1,
      reputationRatio: 1,
    };
  }

  const treatedRatio = Math.min(1, treated / targetConfig.minTreatedCount);
  const repRatio = Math.min(1, rep / targetConfig.minReputation);
  const combinedPercent = Math.min(MAX_PERCENT, Math.round(((treatedRatio + repRatio) / 2) * MAX_PERCENT));
  const isNear = combinedPercent >= NEAR_COMPLETION_THRESHOLD;

  return {
    currentLevel: current.toUpperCase(),
    nextLevel: targetConfig.id.toUpperCase(),
    percent: combinedPercent,
    percentage: combinedPercent,
    isNearCompletion: isNear,
    isHighlighted: isNear,
    treatedRatio,
    reputationRatio: repRatio,
  };
}

export function calculateProtocolProgress(state: GameState): ProtocolProgressionResult {
  const masteredCount = state.masteredCaseIds ? state.masteredCaseIds.length : 0;
  const totalCount = CASES_CATALOG.cases.length || 250;
  const { percent, isNearCompletion } = calculateGoalProgress(masteredCount, totalCount);

  return {
    masteredCount,
    totalCount,
    percent,
    percentage: percent,
    isNearCompletion,
    isHighlighted: isNearCompletion,
  };
}

export function renderLevelProgressionHtml(input: GameState | UnitProgressionResult): string {
  const prog = 'currentLevel' in input ? input : calculateUnitLevelProgress(input);
  const badgeColor = prog.currentLevel === 'HOSPITAL'
    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    : prog.currentLevel === 'UPA'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400';

  const barGradient = prog.isNearCompletion
    ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 shadow-sm shadow-amber-500/30 animate-pulse'
    : 'bg-gradient-to-r from-sky-500 to-indigo-500';

  return `
    <div class="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
      <span class="text-xs font-black px-1.5 py-0.5 rounded-md ${badgeColor}">${prog.currentLevel}</span>
      ${prog.nextLevel ? `
        <div class="flex items-center gap-1">
          <div class="w-14 sm:w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300 ${barGradient}" style="width: ${prog.percent}%"></div>
          </div>
          <span class="text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-400">${prog.percent}%</span>
        </div>
      ` : `
        <span class="text-[10px] font-bold text-amber-500">★ MAX</span>
      `}
    </div>
  `;
}
