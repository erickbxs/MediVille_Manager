/**
 * Arquivo: src/ui/tutorial-view.ts
 * O que faz: Exibe dicas contextuais sutis e elegantes estilo Apple no canto da tela quando o jogador realiza novas ações pela primeira vez.
 * Para que foi criado: Cumprir o Prompt 10 do GDD com tutorial não invasivo e educativo.
 * Como modificar/debugar: Ajuste o tempo de exibição ou estilos visuais das notificações aqui.
 * Importa: src/core/event-bus.ts
 * Conecta-se com: src/main.ts
 */

import { globalBus } from '../core/event-bus';

export class TutorialView {
  private container: HTMLElement;
  private timeoutId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupListener();
  }

  private setupListener(): void {
    globalBus.on('tutorial:tip_triggered', ({ title, message }) => {
      this.showTip(title, message);
    });

    globalBus.on('progression:level_up', ({ name }) => {
      this.showTip('🎉 Hospital Evoluiu!', `Sua unidade de saúde avançou para ${name}! Novos setores desbloqueados.`);
    });
  }

  public showTip(title: string, message: string): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.container.innerHTML = `
      <aside aria-label="Dica Tutorial" class="pointer-events-auto max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-sky-500/30 text-slate-800 dark:text-slate-100 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div class="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0">
          💡
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider">${title}</h4>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">${message}</p>
        </div>
        <button id="btn-close-tip" aria-label="Fechar dica" class="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold text-sm">
          ✕
        </button>
      </aside>
    `;

    document.getElementById('btn-close-tip')?.addEventListener('click', () => {
      this.clear();
    });

    const hideDelayMs = 9000;
    this.timeoutId = window.setTimeout(() => {
      this.clear();
    }, hideDelayMs);
  }

  private clear(): void {
    this.container.innerHTML = '';
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
