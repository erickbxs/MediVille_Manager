/**
 * Arquivo: src/systems/goals-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia as metas de saúde pública do SUS, os marcos de retenção diários com bonificação financeira
 * e a persistência do catálogo de casos clínicos desbloqueados na Enciclopédia Médica do jogador.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir os requisitos da Parte 4 do Prompt 11, incentivando condutas médicas assertivas e fidelização no loop tycoon.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novas metas, insira em SUS_GOALS_DEFINITIONS. As metas são verificadas a cada fechamento de consulta ou dia.
 *
 * Importa: src/state/game-state.ts, src/core/event-bus.ts, src/systems/revalida-system.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/hud.ts, src/ui/title-screen.ts
 */

import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';
import { getUnlockedAreas, isRevalidaActive, REVALIDA_AREAS } from './revalida-system';

export interface SUSGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardCash: number;
  completed: boolean;
}

const STORAGE_KEYS = {
  ENCYCLOPEDIA: 'mediville_encyclopedia_v1',
  GOALS: 'mediville_goals_v1',
  REVALIDA_GOALS: 'mediville_goals_revalida_v1',
} as const;

const GOAL_REWARDS = {
  TREAT_5: 5000,
  SATISFACTION_HIGH: 4000,
  CLEAR_QUEUE: 3000,
  UNLOCK_5: 6000,
  DISPENSE_10: 3500,
} as const;

const TARGETS = {
  FIVE_CASES: 5,
  TEN_MEDS: 10,
  HIGH_SATISFACTION_PERCENT: 80,
  CLEAR_QUEUE_MIN_TREATED: 10,
  STUDY_FIRST: 10,
  STUDY_STEADY: 50,
  STUDY_MARATHON: 150,
  REVIEW_MIN_ANSWERED: 20,
  AREAS_HALF: 3,
  ACCURACY_PERCENT: 70,
  ACCURACY_MIN_ANSWERED: 30,
} as const;

const STUDY_REWARDS = {
  FIRST: 3000,
  STEADY: 8000,
  MARATHON: 15000,
  REVIEW: 4000,
  AREAS_HALF: 6000,
  AREAS_ALL: 10000,
  ACCURACY: 7000,
} as const;

const PERCENT = 100;

const REVALIDA_GOALS: SUSGoal[] = [
  { id: 'rv_first_10', title: 'Primeiros Plantões', description: 'Acertar 10 questões do Revalida', target: TARGETS.STUDY_FIRST, rewardCash: STUDY_REWARDS.FIRST, completed: false },
  { id: 'rv_correct_50', title: 'Estudo Constante', description: 'Acertar 50 questões do Revalida', target: TARGETS.STUDY_STEADY, rewardCash: STUDY_REWARDS.STEADY, completed: false },
  { id: 'rv_correct_150', title: 'Maratona de Estudos', description: 'Acertar 150 questões do Revalida', target: TARGETS.STUDY_MARATHON, rewardCash: STUDY_REWARDS.MARATHON, completed: false },
  { id: 'rv_review_clear', title: 'Revisão em Dia', description: 'Zerar a fila de revisão depois de responder pelo menos 20 questões', target: TARGETS.REVIEW_MIN_ANSWERED, rewardCash: STUDY_REWARDS.REVIEW, completed: false },
  { id: 'rv_accuracy_70', title: 'Mira Certeira', description: 'Ter 70% de acerto com pelo menos 30 questões respondidas', target: TARGETS.ACCURACY_PERCENT, rewardCash: STUDY_REWARDS.ACCURACY, completed: false },
  { id: 'rv_areas_3', title: 'Clínico Versátil', description: 'Liberar 3 áreas da prova construindo as salas', target: TARGETS.AREAS_HALF, rewardCash: STUDY_REWARDS.AREAS_HALF, completed: false },
  { id: 'rv_areas_all', title: 'Prova Completa', description: 'Liberar as 5 áreas da prova', target: REVALIDA_AREAS.length, rewardCash: STUDY_REWARDS.AREAS_ALL, completed: false },
];

const DEFAULT_GOALS: SUSGoal[] = [
  {
    id: 'treat_5_clean',
    title: 'Excelência na APS',
    description: 'Atender 5 pacientes sem cometer erros de conduta clínica',
    target: TARGETS.FIVE_CASES,
    rewardCash: GOAL_REWARDS.TREAT_5,
    completed: false,
  },
  {
    id: 'high_satisfaction',
    title: 'Acolhimento Humanizado',
    description: 'Manter a média de satisfação dos usuários acima de 80%',
    target: TARGETS.HIGH_SATISFACTION_PERCENT,
    rewardCash: GOAL_REWARDS.SATISFACTION_HIGH,
    completed: false,
  },
  {
    id: 'clear_queue',
    title: 'Fila Zero no SUS',
    description: 'Zerar a fila da sala de espera depois de atender pelo menos 10 pacientes',
    target: TARGETS.CLEAR_QUEUE_MIN_TREATED,
    rewardCash: GOAL_REWARDS.CLEAR_QUEUE,
    completed: false,
  },
  {
    id: 'unlock_5_cases',
    title: 'Estudioso da RENAME',
    description: 'Desbloquear 5 patologias distintas na Enciclopédia Médica',
    target: TARGETS.FIVE_CASES,
    rewardCash: GOAL_REWARDS.UNLOCK_5,
    completed: false,
  },
  {
    id: 'dispense_10_meds',
    title: 'Farmácia Eficiente',
    description: 'Dispensar 10 prescrições completas da RENAME',
    target: TARGETS.TEN_MEDS,
    rewardCash: GOAL_REWARDS.DISPENSE_10,
    completed: false,
  },
];

export class GoalsSystem {
  private goals: SUSGoal[] = [];
  private revalidaGoals: SUSGoal[] = [];
  private unlockedCases = new Set<string>();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof localStorage === 'undefined') {
      this.goals = DEFAULT_GOALS.map((g) => ({ ...g }));
      this.revalidaGoals = REVALIDA_GOALS.map((g) => ({ ...g }));
      return;
    }
    this.goals = mergeSavedGoals(DEFAULT_GOALS, localStorage.getItem(STORAGE_KEYS.GOALS));
    this.revalidaGoals = mergeSavedGoals(REVALIDA_GOALS, localStorage.getItem(STORAGE_KEYS.REVALIDA_GOALS));

    const savedCases = localStorage.getItem(STORAGE_KEYS.ENCYCLOPEDIA);
    if (savedCases) {
      const arr = JSON.parse(savedCases) as string[];
      arr.forEach((id) => this.unlockedCases.add(id));
    }
  }

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    localStorage.setItem(STORAGE_KEYS.REVALIDA_GOALS, JSON.stringify(this.revalidaGoals));
    localStorage.setItem(STORAGE_KEYS.ENCYCLOPEDIA, JSON.stringify(Array.from(this.unlockedCases)));
  }

  /** No Modo Revalida as metas são de estudo; no modo antigo, de gestão do SUS. */
  public getGoals(): SUSGoal[] {
    return isRevalidaActive() ? this.revalidaGoals : this.goals;
  }

  public getUnlockedCaseIds(): string[] {
    return Array.from(this.unlockedCases);
  }

  public unlockCase(caseId: string): boolean {
    if (this.unlockedCases.has(caseId)) return false;
    this.unlockedCases.add(caseId);
    this.saveState();
    globalBus.emit('encyclopedia:case_unlocked', { caseId });
    return true;
  }

  public checkGoals(state: GameState): number {
    let totalGrantedCash = 0;
    this.getGoals().forEach((goal) => {
      if (goal.completed) return;
      if (this.isGoalMet(goal, state)) {
        goal.completed = true;
        totalGrantedCash += goal.rewardCash;
        state.cash += goal.rewardCash;
        globalBus.emit('goal:completed', { goal, rewardCash: goal.rewardCash });
      }
    });
    if (totalGrantedCash > 0) this.saveState();
    return totalGrantedCash;
  }

  private isGoalMet(goal: SUSGoal, state: GameState): boolean {
    if (goal.id.startsWith('rv_')) return isStudyGoalMet(goal, state);
    if (goal.id === 'treat_5_clean') {
      return state.stats.correctDecisions >= goal.target;
    }
    if (goal.id === 'high_satisfaction') {
      return state.satisfactionAverage >= goal.target;
    }
    if (goal.id === 'clear_queue') {
      return state.queueIds.length === 0 && state.stats.treatedCount >= goal.target;
    }
    if (goal.id === 'unlock_5_cases') {
      return this.unlockedCases.size >= goal.target;
    }
    if (goal.id === 'dispense_10_meds') {
      return state.stats.treatedCount >= goal.target;
    }
    return false;
  }
}

/** Metas antigas salvas mantêm o "concluída", mas título/descrição/alvo vêm sempre da definição atual. */
function mergeSavedGoals(defs: SUSGoal[], raw: string | null): SUSGoal[] {
  const saved = raw ? (JSON.parse(raw) as SUSGoal[]) : [];
  return defs.map((d) => ({ ...d, completed: saved.find((s) => s.id === d.id)?.completed ?? false }));
}

function isStudyGoalMet(goal: SUSGoal, state: GameState): boolean {
  const { correctDecisions, totalDecisions } = state.stats;
  if (goal.id === 'rv_review_clear') return totalDecisions >= goal.target && state.revalidaReviewIds.length === 0;
  if (goal.id === 'rv_accuracy_70') {
    return totalDecisions >= TARGETS.ACCURACY_MIN_ANSWERED && (correctDecisions / totalDecisions) * PERCENT >= goal.target;
  }
  if (goal.id === 'rv_areas_3' || goal.id === 'rv_areas_all') return getUnlockedAreas(state).length >= goal.target;
  return correctDecisions >= goal.target;
}

export const goalsSystem = new GoalsSystem();
