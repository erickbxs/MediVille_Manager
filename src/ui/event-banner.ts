/**
 * Arquivo: src/ui/event-banner.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o banner de eventos dinâmicos ativos (surtos de dengue, acidentes de trânsito, ondas de frio)
 * em formato de pílula compacta de linha única no mobile com contagem regressiva e expansão opcional ao toque.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter o jogador informado sobre crises sanitárias temporárias sem cobrir o campo de visão do hospital.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para alterar cores ou estilos, ajuste as classes Tailwind neste arquivo ou execute os testes com Vitest.
 *
 * Importa: src/entities/event.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts
 */

import type { ActiveEvent } from '../entities/event';

export class EventBannerView {
  private container: HTMLElement;
  private isExpanded = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public update(activeEvents: ActiveEvent[]): void {
    if (activeEvents.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    const current = activeEvents[0]!;
    const def = current.definition;
    const remaining = Math.max(0, Math.ceil(current.remainingSec));

    this.container.innerHTML = `
      <div id="event-pill" class="cursor-pointer pointer-events-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-rose-600/90 text-white shadow-lg backdrop-blur-md border border-white/20 animate-in slide-in-from-top duration-300 max-w-xs sm:max-w-md mx-auto text-xs font-bold active:scale-95 transition-all">
        <div class="flex items-center gap-1.5 min-w-0 truncate">
          <span class="text-base">${def.icon}</span>
          <span class="truncate">${def.title}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="px-2 py-0.5 rounded-full bg-white/25 text-[11px] font-extrabold">${remaining}s</span>
          <span class="text-[10px] text-white/80">${this.isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      ${this.isExpanded ? `
        <div class="pointer-events-auto mt-1 p-2.5 rounded-2xl bg-slate-900/90 text-white text-xs max-w-xs sm:max-w-md mx-auto backdrop-blur-md shadow-xl border border-white/10 animate-in fade-in">
          ${def.description}
        </div>
      ` : ''}
    `;

    document.getElementById('event-pill')?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      this.update(activeEvents);
    });
  }
}
