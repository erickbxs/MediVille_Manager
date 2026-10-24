/**
 * Arquivo: src/ui/finances-modal.ts
 *
 * 1. O que este arquivo faz?
 * Exibe o demonstrativo financeiro do SUS (procedimentos BPA faturados, repasses do Ministério da Saúde) e permite solicitar verba imediata com a Secretaria de Saúde para reforma.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir o Prompt 6 do GDD e o pedido do usuário de controle orçamentário transparente adaptado para mobile em formato bottom sheet.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Valores de repasse e verbas vêm de src/data/balance.json e src/systems/economy-system.ts.
 *
 * Importa: src/core/simulation.ts, src/systems/economy-system.ts, src/core/config.ts
 * Conecta-se with: src/ui/hud.ts, src/main.ts
 */

import { BALANCE, SIGTAP_CATALOG } from '../core/config';
import type { HospitalSimulation } from '../core/simulation';
import { requestEmergencyGrant } from '../systems/economy-system';

export class FinancesModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(): void {
    this.simulation.pauseForModal();
    const { finances, cash } = this.simulation.state;
    const procedures = SIGTAP_CATALOG.procedures;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[82dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-xl">🏛️</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Finanças SUS & Repasses</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Balanço orçamentário, faturamento SIGTAP e captação de recursos</p>
              </div>
            </div>
            <button id="btn-close-finances" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-5 overflow-y-auto space-y-6 text-sm flex-1">
            <div class="p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span class="text-xs uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">Secretaria Municipal de Saúde</span>
                  <h4 class="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-0.5">Verba Extraordinária para Obras e Reforma</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                    Como gestor hospitalar, solicite injeção emergencial de recursos com o Secretário de Saúde para reformas, novas salas ou folha de pagamento.
                  </p>
                </div>
                <button id="btn-modal-grant" class="min-h-[44px] px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all">
                  🏛️ Solicitar Verba (+R$ ${BALANCE.emergencyGrant.amount.toLocaleString('pt-BR')})
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Caixa Atual</span>
                <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">R$ ${cash.toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Faturado BPA (SUS)</span>
                <span class="text-sm font-extrabold text-sky-600 dark:text-sky-400">R$ ${finances.bpaRevenue.toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Repasses do Ministério</span>
                <span class="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">R$ ${finances.ministryTransfers.toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Verbas da Secretaria</span>
                <span class="text-sm font-extrabold text-amber-600 dark:text-amber-400">R$ ${finances.emergencyGrants.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tabela SIGTAP de Procedimentos</h4>
              <div class="space-y-2">
                ${procedures.map((p) => `
                  <div class="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/30 dark:bg-slate-800/20">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold">${p.code}</span>
                        <strong class="text-slate-800 dark:text-slate-200">${p.name}</strong>
                        <span class="text-[10px] font-bold text-sky-600">${p.type}</span>
                      </div>
                      <p class="text-slate-400 text-[11px] mt-0.5">${p.description}</p>
                    </div>
                    <span class="font-extrabold text-emerald-600 text-sm whitespace-nowrap ml-2">R$ ${p.baseValue.toLocaleString('pt-BR')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
            <button id="btn-done-finances" class="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all">
              Fechar
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const close = () => {
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    };

    document.getElementById('btn-close-finances')?.addEventListener('click', close);
    document.getElementById('btn-done-finances')?.addEventListener('click', close);

    document.getElementById('btn-modal-grant')?.addEventListener('click', () => {
      requestEmergencyGrant(this.simulation.state);
      this.open();
    });
  }
}
