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
 * Importa: src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/hud.ts, src/ui/title-screen.ts
 */

import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

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
} as const;

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
    description: 'Zerar completamente a fila da sala de espera',
    target: 1,
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
  private unlockedCases = new Set<string>();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof localStorage === 'undefined') {
      this.goals = [...DEFAULT_GOALS];
      return;
    }
    const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    this.goals = savedGoals ? (JSON.parse(savedGoals) as SUSGoal[]) : [...DEFAULT_GOALS];

    const savedCases = localStorage.getItem(STORAGE_KEYS.ENCYCLOPEDIA);
    if (savedCases) {
      const arr = JSON.parse(savedCases) as string[];
      arr.forEach((id) => this.unlockedCases.add(id));
    }
  }

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    localStorage.setItem(STORAGE_KEYS.ENCYCLOPEDIA, JSON.stringify(Array.from(this.unlockedCases)));
  }

  public getGoals(): SUSGoal[] {
    return this.goals;
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
    this.goals.forEach((goal) => {
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
    if (goal.id === 'treat_5_clean') {
      return state.stats.correctDecisions >= goal.target;
    }
    if (goal.id === 'high_satisfaction') {
      return state.satisfactionAverage >= goal.target;
    }
    if (goal.id === 'clear_queue') {
      return state.queueIds.length === 0 && state.stats.treatedCount > 0;
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

export const goalsSystem = new GoalsSystem();
