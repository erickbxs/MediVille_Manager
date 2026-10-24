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

import { CASES_CATALOG, type ClinicalCaseDefinition } from '../core/config';
import { goalsSystem } from '../systems/goals-system';

export class EncyclopediaModal {
  private container: HTMLElement;
  private activeCategory = 'all';
  private onPracticeCallback?: (caseId: string) => void;

  constructor(container: HTMLElement, onPractice?: (caseId: string) => void) {
    this.container = container;
    this.onPracticeCallback = onPractice;
  }

  public open(): void {
    this.render();
  }

  private render(): void {
    const unlockedSet = new Set(goalsSystem.getUnlockedCaseIds());
    const allCases = CASES_CATALOG.cases;
    const unlockedCount = allCases.filter((c) => unlockedSet.has(c.id)).length;

    const categories = [
      { id: 'all', label: 'Todos' },
      { id: 'Respiratórios', label: 'Respiratórios' },
      { id: 'Virais', label: 'Virais' },
      { id: 'Bacterianos', label: 'Bacterianos' },
      { id: 'ISTs e Tropicais', label: 'ISTs/Tropicais' },
      { id: 'Digestivos', label: 'Digestivos' },
      { id: 'Cardiovasculares', label: 'Cardiovasculares' },
      { id: 'Neurológicos', label: 'Neurológicos' },
      { id: 'Endócrinos', label: 'Endócrinos' },
      { id: 'Trauma, Toxicologia e Alergia', label: 'Trauma/Alergia' },
    ];

    const filteredCases = this.activeCategory === 'all'
      ? allCases
      : allCases.filter((c) => c.area.toLowerCase().includes(this.activeCategory.toLowerCase()));

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[88dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-xl">📖</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Enciclopédia Médica SUS</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <strong>${unlockedCount}</strong> de <strong>${allCases.length}</strong> protocolos clínicos dominados
                </p>
              </div>
            </div>
            <button id="btn-close-encyclopedia" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <!-- Filtro de Categorias -->
          <div class="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-slate-100 dark:border-slate-800 text-xs no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            ${categories.map((cat) => `
              <button data-cat="${cat.id}" class="btn-encyclopedia-cat shrink-0 px-3 py-1.5 rounded-xl font-bold transition-all ${this.activeCategory === cat.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                ${cat.label}
              </button>
            `).join('')}
          </div>

          <div class="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-sm flex-1">
            <div class="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>Protocolo Dominado:</strong> Ao acertar a conduta médica de um caso no consultório, ele é dominado pela equipe e passará a ser resolvido automaticamente nas próximas visitas!
            </div>

            <div class="grid grid-cols-1 gap-3">
              ${filteredCases.map((c: ClinicalCaseDefinition) => {
                const isUnlocked = unlockedSet.has(c.id);
                if (isUnlocked) {
                  return `
                    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-emerald-500/30 space-y-2.5">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            ${c.area} • ${c.typicalUnit} • ${c.severity}
                          </span>
                          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">${c.name}</h4>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span class="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">⚡ Dominado</span>
                          <button data-practice-id="${c.id}" class="btn-practice-case px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-bold transition-all">
                            🔄 Praticar
                          </button>
                        </div>
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
                  <div class="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/20 border border-dashed border-slate-300 dark:border-slate-700/50 flex items-center justify-between opacity-75">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">🔒</div>
                      <div>
                        <h4 class="font-bold text-xs text-slate-700 dark:text-slate-300">${c.name}</h4>
                        <p class="text-[11px] text-slate-400">${c.area} • Atenda no consultório para instituir o protocolo</p>
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

    this.bindEvents();
  }

  private bindEvents(): void {
    document.getElementById('btn-close-encyclopedia')?.addEventListener('click', () => {
      this.close();
    });

    this.container.querySelectorAll('.btn-encyclopedia-cat').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat');
        if (cat) {
          this.activeCategory = cat;
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-practice-case').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const caseId = (e.currentTarget as HTMLElement).getAttribute('data-practice-id');
        if (caseId && this.onPracticeCallback) {
          this.close();
          this.onPracticeCallback(caseId);
        }
      });
    });
  }

  public close(): void {
    this.container.innerHTML = '';
  }
}
