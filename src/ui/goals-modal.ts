/**
 * Arquivo: src/ui/goals-modal.ts
 *
 * 1. O que este arquivo faz?
 * Exibe o painel de Metas de Saúde Pública e Marcos do SUS, permitindo acompanhar o progresso de retenção
 * e visualizar os bônus orçamentários já conquistados ou pendentes de atendimento.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 4 do Prompt 11, dando clareza das conquistas de gestão hospitalar ao jogador.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O estado e verificação das metas residem em src/systems/goals-system.ts.
 *
 * Importa: src/systems/goals-system.ts
 * Conecta-se com: src/ui/title-screen.ts, src/ui/hud.ts
 */

import { goalsSystem } from '../systems/goals-system';

export class GoalsModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public open(): void {
    const goals = goalsSystem.getGoals();
    const completedCount = goals.filter((g) => g.completed).length;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[82dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-xl">🏆</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Metas & Marcos do SUS</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ${completedCount} de ${goals.length} metas alcançadas
                </p>
              </div>
            </div>
            <button id="btn-close-goals" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-4 sm:p-5 overflow-y-auto space-y-3 text-sm flex-1">
            ${goals.map((g) => `
              <div class="p-4 rounded-2xl ${g.completed ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border flex items-center justify-between gap-4">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-base">${g.completed ? '⭐' : '🎯'}</span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">${g.title}</h4>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">${g.description}</p>
                </div>
                <div class="text-right shrink-0">
                  <span class="block font-extrabold text-xs text-emerald-600 dark:text-emerald-400">+R$ ${g.rewardCash.toLocaleString('pt-BR')}</span>
                  <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${g.completed ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}">
                    ${g.completed ? 'Concluída' : 'A conquistar'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-goals')?.addEventListener('click', () => {
      this.close();
    });
  }

  public close(): void {
    this.container.innerHTML = '';
  }
}
