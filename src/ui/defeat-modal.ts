/**
 * Arquivo: src/ui/defeat-modal.ts
 * O que faz: Exibe o modal de fim de jogo caso as condições de falência ou baixa reputação sejam atingidas (GDD pág. 6).
 * Para que foi criado: Notificar o jogador sobre o encerramento da partida e permitir reiniciar o hospital.
 * Como modificar/debugar: Regras de derrota são disparadas por src/systems/day-system.ts.
 * Importa: src/core/simulation.ts
 * Conecta-se com: src/main.ts
 */

export class DefeatModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public show(reason: string, onRestart: () => void): void {
    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-500/30 text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 flex items-center justify-center text-3xl">
            📉
          </div>
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-slate-100">Fim de Jogo</h2>
          <p class="text-sm text-slate-600 dark:text-slate-300">${reason}</p>
          <div class="pt-2">
            <button id="btn-restart" class="min-w-[44px] min-h-[44px] w-full py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.container.innerHTML = '';
      onRestart();
    });
  }
}
