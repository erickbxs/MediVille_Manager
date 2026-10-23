/**
 * Arquivo: src/ui/advisor-view.ts
 * O que faz: Exibe os alertas e sugestões de gargalo no canto superior direito da tela (máximo 3 simultâneos).
 * Para que foi criado: Orientar o jogador sobre necessidades imediatas de expansão conforme o GDD.
 * Como modificar/debugar: Condições de alerta são calculadas em src/systems/advisor-system.ts.
 * Importa: src/systems/advisor-system.ts, src/state/game-state.ts
 * Conecta-se com: src/main.ts
 */

import { getAdvisorAlerts, type AdvisorAlert } from '../systems/advisor-system';
import type { GameState } from '../state/game-state';

export class AdvisorView {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public update(state: GameState): void {
    const alerts = getAdvisorAlerts(state);
    if (alerts.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="pointer-events-auto flex flex-col gap-2 max-w-xs">
        ${alerts.map((a) => this.renderAlertCard(a)).join('')}
      </div>
    `;
  }

  private renderAlertCard(alert: AdvisorAlert): string {
    const isHigh = alert.urgency === 'high';
    const border = isHigh ? 'border-amber-500/60' : 'border-sky-500/60';
    const bg = isHigh ? 'bg-amber-50/90 dark:bg-amber-950/80' : 'bg-white/90 dark:bg-slate-900/90';

    return `
      <div class="p-3 rounded-2xl shadow-lg backdrop-blur-md border ${border} ${bg} text-xs transition-all animate-in slide-in-from-right duration-300">
        <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
          <span>${isHigh ? '⚠️' : '💡'}</span>
          <span>${alert.actionHint}</span>
        </div>
        <p class="text-slate-600 dark:text-slate-300 mt-1 leading-snug">${alert.message}</p>
      </div>
    `;
  }
}
