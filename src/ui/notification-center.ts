/**
 * Arquivo: src/ui/notification-center.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a pilha unificada de notificações e alertas de emergência no canto superior direito da tela ("Corner Toast Stack"),
 * incluindo o Resumo Rápido de Fim de Dia da Regra do Pico-Fim (Peak-End Rule) e auto-minimização para selo circular pulsante.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter 100% da área útil do hospital livre de pop-ups obstrutivos e fornecer fechamento em 5s ou 1 clique.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O tempo de expiração é definido em pushToast e pushDailySummary. O evento diário é alimentado pelo barramento global.
 *
 * Importa: src/entities/event.ts
 * Conecta-se com: src/main.ts, src/ui/event-banner.ts, tests/ux-20-laws-and-aesthetics.test.ts
 */

import type { ActiveEvent } from '../entities/event';

export interface ToastItem {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
  icon?: string;
  timestamp: number;
}

export interface DailySummaryStats {
  day: number;
  patientsCured: number;
  revenue: number;
  goalBonus: number;
  reputationDelta: number;
}

export class NotificationCenter {
  private container: HTMLElement;
  private toasts: ToastItem[] = [];
  private activeEvent: ActiveEvent | null = null;
  private isEventMinimized = false;
  private eventMinimizeTimer: ReturnType<typeof setTimeout> | null = null;
  private currentEventId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public pushDailySummary(stats: DailySummaryStats): string {
    const isRepPositive = stats.reputationDelta >= 0;
    const content = `
      <div class="space-y-1 text-left">
        <div class="font-black text-xs text-amber-300">Resumo do Dia ${stats.day}</div>
        <div class="text-[11px] text-slate-200">
          <div>👥 Salvos: <strong class="text-emerald-400">${stats.patientsCured}</strong></div>
          <div>💰 Caixa: <strong class="text-emerald-400">R$ ${stats.revenue.toLocaleString('pt-BR')}</strong></div>
          ${stats.goalBonus > 0 ? `<div>🎯 Bônus: <strong class="text-amber-400">+R$ ${stats.goalBonus.toLocaleString('pt-BR')}</strong></div>` : ''}
          <div>⭐ Reputação: <strong class="${isRepPositive ? 'text-emerald-400' : 'text-rose-400'}">${isRepPositive ? '+' : ''}${stats.reputationDelta}%</strong></div>
        </div>
      </div>
    `;
    return this.pushToast(content, 'success', '🌅');
  }

  public pushToast(text: string, type: ToastItem['type'] = 'info', icon?: string): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.toasts.push({ id, text, type, icon, timestamp: Date.now() });

    const maxToasts = 5;
    if (this.toasts.length > maxToasts) {
      this.toasts.shift();
    }
    this.render();

    const autoDismissMs = 4500;
    setTimeout(() => {
      this.removeToast(id);
    }, autoDismissMs);

    return id;
  }

  public removeToast(id: string): void {
    const idx = this.toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.toasts.splice(idx, 1);
      this.render();
    }
  }

  public clearAll(): void {
    this.toasts = [];
    this.render();
  }

  public getToastCount(): number {
    return this.toasts.length;
  }

  public dismissToast(id: string): void {
    this.removeToast(id);
  }

  public updateActiveEvent(activeEvents: ActiveEvent[]): void {
    const current = activeEvents.length > 0 ? activeEvents[0]! : null;
    if (current && current.instanceId !== this.currentEventId) {
      this.currentEventId = current.instanceId;
      this.isEventMinimized = false;
      if (this.eventMinimizeTimer) clearTimeout(this.eventMinimizeTimer);

      const autoMinimizeMs = 4000;
      this.eventMinimizeTimer = setTimeout(() => {
        this.isEventMinimized = true;
        this.render();
      }, autoMinimizeMs);
    } else if (!current) {
      this.currentEventId = null;
      this.isEventMinimized = false;
      if (this.eventMinimizeTimer) clearTimeout(this.eventMinimizeTimer);
    }
    this.activeEvent = current;
    this.render();
  }

  private render(): void {
    const hasEmergency = Boolean(this.activeEvent);
    const hasToasts = this.toasts.length > 0;

    if (!hasEmergency && !hasToasts) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="fixed top-14 right-3 z-40 w-72 sm:w-80 pointer-events-none flex flex-col items-end gap-2">
        ${this.renderEmergencyHtml()}
        ${this.toasts.length > 2 ? `
          <button id="btn-clear-all-toasts" class="pointer-events-auto text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/80 shadow backdrop-blur-md">
            Limpar Tudo (${this.toasts.length})
          </button>
        ` : ''}
        ${this.toasts.map((toast) => this.renderToastCard(toast)).join('')}
      </div>
    `;

    this.bindEvents();
  }

  private renderEmergencyHtml(): string {
    if (!this.activeEvent) return '';
    const current = this.activeEvent;
    const remaining = Math.max(0, Math.ceil(current.remainingSec));
    const def = current.definition;

    if (this.isEventMinimized) {
      return `
        <button id="btn-emergency-badge" data-testid="emergency-badge-minimized" class="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/95 text-white shadow-xl border border-white/20 backdrop-blur-md animate-pulse active:scale-95 text-xs font-black">
          <span class="text-sm">🚨</span>
          <span>${remaining}s</span>
        </button>
      `;
    }

    return `
      <div id="emergency-card" class="pointer-events-auto w-full p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/95 to-slate-900/95 border border-rose-500/50 shadow-2xl text-white backdrop-blur-xl animate-in slide-in-from-right duration-200">
        <div class="flex items-center justify-between gap-1 pb-1 border-b border-rose-900/60">
          <div class="flex items-center gap-1.5 truncate">
            <span class="text-base">${def.icon}</span>
            <span class="font-black text-xs text-rose-300 truncate">${def.title}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="px-2 py-0.5 rounded-full bg-rose-600/80 text-[10px] font-black">${remaining}s</span>
            <button id="btn-minimize-emergency" title="Minimizar" class="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white font-bold text-sm">✕</button>
          </div>
        </div>
        <p class="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">${def.description}</p>
      </div>
    `;
  }

  private renderToastCard(toast: ToastItem): string {
    const borderColors: Record<string, string> = {
      info: 'border-sky-500/50 bg-slate-900/95',
      success: 'border-emerald-500/50 bg-slate-900/95',
      warning: 'border-amber-500/50 bg-slate-900/95',
      emergency: 'border-rose-500/50 bg-slate-900/95',
    };
    const styleClass = borderColors[toast.type] || borderColors.info;

    return `
      <div data-toast-id="${toast.id}" class="toast-swipe-card pointer-events-auto w-full flex items-center justify-between gap-2 p-2.5 rounded-2xl border shadow-xl text-white backdrop-blur-xl animate-in slide-in-from-right duration-200 select-none ${styleClass}">
        <div class="flex items-center gap-2 min-w-0">
          ${toast.icon ? `<span class="text-base shrink-0">${toast.icon}</span>` : ''}
          <span class="text-xs font-semibold leading-snug break-words">${toast.text}</span>
        </div>
        <button data-dismiss-id="${toast.id}" class="min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 flex items-center justify-center text-slate-400 hover:text-white font-black text-sm active:scale-90">✕</button>
      </div>
    `;
  }

  private bindEvents(): void {
    document.getElementById('btn-clear-all-toasts')?.addEventListener('click', () => this.clearAll());
    document.getElementById('btn-minimize-emergency')?.addEventListener('click', () => {
      this.isEventMinimized = true;
      this.render();
    });
    document.getElementById('btn-emergency-badge')?.addEventListener('click', () => {
      this.isEventMinimized = false;
      this.render();
    });

    const dismissBtns = this.container.querySelectorAll('[data-dismiss-id]');
    dismissBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.dismissId;
        if (id) this.removeToast(id);
      });
    });

    this.bindSwipeToDismiss();
  }

  private bindSwipeToDismiss(): void {
    const cards = this.container.querySelectorAll('.toast-swipe-card');
    cards.forEach((cardEl) => {
      const el = cardEl as HTMLElement;
      let startX = 0;
      let currentX = 0;
      let isSwiping = false;

      el.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        currentX = e.clientX;
        isSwiping = true;
      });

      el.addEventListener('pointermove', (e) => {
        if (!isSwiping) return;
        currentX = e.clientX;
        const diffX = currentX - startX;
        if (diffX > 0) {
          el.style.transform = `translateX(${diffX}px)`;
          el.style.opacity = `${Math.max(0, 1 - diffX / 140)}`;
        }
      });

      const endSwipe = () => {
        if (!isSwiping) return;
        isSwiping = false;
        const diffX = currentX - startX;
        const swipeThreshold = 60;
        if (diffX > swipeThreshold) {
          const id = el.dataset.toastId;
          if (id) this.removeToast(id);
        } else {
          el.style.transform = '';
          el.style.opacity = '';
        }
      };

      el.addEventListener('pointerup', endSwipe);
      el.addEventListener('pointercancel', endSwipe);
    });
  }
}
