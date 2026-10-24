/**
 * Arquivo: src/ui/encyclopedia-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o compêndio interativo da Enciclopédia Médica do SUS com os 15 casos clínicos da APS,
 * exibindo diagnósticos, condutas oficiais do Ministério da Saúde e medicamentos da RENAME desbloqueados pelo jogador.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 e 4 do Prompt 11, oferecendo valor pedagógico, retenção e consulta médica transparente.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O catálogo de casos vem de src/data/cases.json e os IDs desbloqueados são gerenciados por GoalsSystem.
 *
 * Importa: src/core/config.ts, src/systems/goals-system.ts
 * Conecta-se com: src/ui/title-screen.ts, src/main.ts
 */

import { CASES_CATALOG } from '../core/config';
import { goalsSystem } from '../systems/goals-system';

export class EncyclopediaModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public open(): void {
    const unlockedSet = new Set(goalsSystem.getUnlockedCaseIds());
    const cases = CASES_CATALOG.cases;
    const unlockedCount = cases.filter((c) => unlockedSet.has(c.id)).length;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[82dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-xl">📖</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Enciclopédia Médica SUS</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ${unlockedCount} de ${cases.length} casos clínicos catalogados
                </p>
              </div>
            </div>
            <button id="btn-close-encyclopedia" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
            <div class="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>Instrução Pedagógica:</strong> Ao atender pacientes no Consultório Médico e acertar a conduta oficial de cada patologia, a ficha clínica completa é registrada permanentemente aqui.
            </div>

            <div class="grid grid-cols-1 gap-3">
              ${cases.map((c) => {
                const isUnlocked = unlockedSet.has(c.id);
                if (isUnlocked) {
                  return `
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            ${c.area} • ${c.severity}
                          </span>
                          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">${c.name}</h4>
                        </div>
                        <span class="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold shrink-0">✅ Desbloqueado</span>
                      </div>
                      
                      <div class="text-xs text-slate-600 dark:text-slate-300">
                        <strong class="text-slate-800 dark:text-slate-200">Quadro Clínico:</strong>
                        <ul class="list-disc list-inside mt-0.5 space-y-0.5 text-slate-500 dark:text-slate-400">
                          ${c.symptoms.map((s) => `<li>${s}</li>`).join('')}
                        </ul>
                      </div>

                      <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200">
                        <strong>Conduta Oficial MS:</strong> ${c.suggestedConduct.text}
                      </div>

                      <div class="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5 pt-1">
                        <span class="font-bold">Medicamentos RENAME:</span>
                        ${c.medications.map((m) => `<span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">${m.genericName} (${m.route})</span>`).join('')}
                      </div>
                    </div>
                  `;
                }

                return `
                  <div class="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/20 border border-dashed border-slate-300 dark:border-slate-700/50 flex items-center justify-between opacity-75">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">🔒</div>
                      <div>
                        <h4 class="font-bold text-xs text-slate-700 dark:text-slate-300">${c.name}</h4>
                        <p class="text-[11px] text-slate-400">Especialidade: ${c.area} • Atenda no consultório para desbloquear</p>
                      </div>
                    </div>
                    <span class="text-[11px] font-bold text-slate-400">Bloqueado</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-encyclopedia')?.addEventListener('click', () => {
      this.close();
    });
  }

  public close(): void {
    this.container.innerHTML = '';
  }
}
