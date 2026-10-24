/**
 * Arquivo: src/ui/advisor-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza até 3 alertas/sugestões contextuais simultâneas do Conselheiro Hospitalar no canto superior com botões de ação direta (Resolver, Adiar, Ignorar).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Implementar a interface viva do Conselheiro de Saúde (GDD e Prompt 12), permitindo ao jogador responder a gargalos hospitalares com 1 clique.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * As condições dos alertas são calculadas em src/systems/advisor-system.ts.
 *
 * Importa: src/systems/advisor-system.ts, src/state/game-state.ts
 * Conecta-se com: src/main.ts, src/ui/build-menu.ts
 */

import {
  getAdvisorAlerts,
  dismissAdvisorAlert,
  snoozeAdvisorAlert,
  type AdvisorAlert,
  type AlertActionType,
} from '../systems/advisor-system';
import type { GameState } from '../state/game-state';

export interface AdvisorViewCallbacks {
  onResolve?: (actionType: AlertActionType, targetRoomType?: string) => void;
  onSnooze?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

export class AdvisorView {
  private container: HTMLElement;
  private callbacks?: AdvisorViewCallbacks;
  private lastState?: GameState;

  constructor(container: HTMLElement, callbacks?: AdvisorViewCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.bindDelegatedEvents();
  }

  public update(state: GameState): void {
    this.lastState = state;
    const alerts = getAdvisorAlerts(state);
    if (alerts.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="pointer-events-auto flex flex-col gap-2.5 max-w-xs sm:max-w-sm">
        ${alerts.map((a) => this.renderAlertCard(a)).join('')}
      </div>
    `;
  }

  private renderAlertCard(alert: AdvisorAlert): string {
    const isHigh = alert.urgency === 'high';
    const isMed = alert.urgency === 'medium';
    const border = isHigh ? 'border-amber-500/70' : isMed ? 'border-sky-500/70' : 'border-emerald-500/70';
    const bg = isHigh
      ? 'bg-amber-50/95 dark:bg-amber-950/90'
      : isMed
      ? 'bg-sky-50/95 dark:bg-slate-900/90'
      : 'bg-emerald-50/95 dark:bg-emerald-950/90';
    const icon = isHigh ? '🚨' : isMed ? '💡' : '🏛️';

    return `
      <div data-alert-id="${alert.id}" class="p-3.5 rounded-2xl shadow-xl backdrop-blur-md border ${border} ${bg} text-xs transition-all animate-in slide-in-from-right duration-300">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-slate-100">
            <span>${icon}</span>
            <span>${alert.title || alert.actionHint}</span>
          </div>
          <button data-action="dismiss" data-alert-id="${alert.id}" title="Ignorar alerta" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-1">
            ✕
          </button>
        </div>
        <p class="text-slate-600 dark:text-slate-300 mt-1 leading-snug">${alert.message}</p>
        <div class="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
          <button data-action="snooze" data-alert-id="${alert.id}" class="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all">
            Adiar
          </button>
          <button data-action="resolve" data-alert-id="${alert.id}" data-action-type="${alert.actionType}" data-target-room="${alert.targetRoomType ?? ''}" class="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] shadow-sm active:scale-95 transition-all">
            ${alert.actionHint}
          </button>
        </div>
      </div>
    `;
  }

  private bindDelegatedEvents(): void {
    this.container.addEventListener('click', (ev) => {
      const target = (ev.target as HTMLElement).closest('button');
      if (!target) return;

      const action = target.dataset.action;
      const alertId = target.dataset.alertId;
      if (!alertId) return;

      if (action === 'dismiss') {
        if (this.lastState) dismissAdvisorAlert(this.lastState, alertId);
        this.callbacks?.onDismiss?.(alertId);
        if (this.lastState) this.update(this.lastState);
      } else if (action === 'snooze') {
        if (this.lastState) snoozeAdvisorAlert(this.lastState, alertId);
        this.callbacks?.onSnooze?.(alertId);
        if (this.lastState) this.update(this.lastState);
      } else if (action === 'resolve') {
        const actionType = target.dataset.actionType as AlertActionType;
        const targetRoom = target.dataset.targetRoom;
        if (this.lastState) dismissAdvisorAlert(this.lastState, alertId);
        this.callbacks?.onResolve?.(actionType, targetRoom);
        if (this.lastState) this.update(this.lastState);
      }
    });
  }
}

