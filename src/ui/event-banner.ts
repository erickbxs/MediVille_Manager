/**
 * Arquivo: src/ui/event-banner.ts
 * O que faz: Exibe o banner dinâmico de eventos ativos (acidentes, epidemias, crises) com contador de tempo restante e efeito visual.
 * Para que foi criado: Alertar o jogador imediatamente sobre mudanças na demanda hospitalar e crises temporárias.
 * Como modificar/debugar: Caso queira mudar a animação ou posição, altere as classes Tailwind neste arquivo.
 * Importa: src/entities/event.ts
 * Conecta-se com: src/main.ts
 */

import type { ActiveEvent } from '../entities/event';

export class EventBannerView {
  private container: HTMLElement;

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
      <div class="pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/90 to-rose-600/90 text-white shadow-xl backdrop-blur-md border border-white/20 animate-in slide-in-from-top duration-300 max-w-lg mx-auto">
        <span class="text-3xl">${def.icon}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-extrabold text-sm truncate">${def.title}</h4>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white/25">${remaining}s</span>
          </div>
          <p class="text-xs text-white/90 leading-tight mt-0.5 line-clamp-2">${def.description}</p>
        </div>
      </div>
    `;
  }
}
