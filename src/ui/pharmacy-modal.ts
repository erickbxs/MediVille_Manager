/**
 * Arquivo: src/ui/pharmacy-modal.ts
 * O que faz: Exibe o modal da Farmácia da RENAME para monitorar estoques de medicamentos essenciais e adquirir novos lotes com um clique.
 * Para que foi criado: Permitir ao gestor evitar desabastecimento na farmácia do hospital e garantir conformidade com o SUS.
 * Como modificar/debugar: Dados de medicamentos, dosagens e custos de lotes vêm de src/data/pharmacy.json.
 * Importa: src/core/config.ts, src/core/simulation.ts, src/systems/economy-system.ts
 * Conecta-se with: src/ui/hud.ts, src/main.ts
 */

import { PHARMACY_CATALOG, type RenameMedication } from '../core/config';
import type { HospitalSimulation } from '../core/simulation';
import { buyMedicationBatch } from '../systems/economy-system';

export class PharmacyModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(): void {
    this.simulation.pauseForModal();
    const meds = PHARMACY_CATALOG.medications;
    const stock = this.simulation.state.pharmacyStock;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">💊</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Farmácia Básica — RENAME</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Controle de estoque e aquisição de lotes de medicamentos essenciais do SUS</p>
              </div>
            </div>
            <button id="btn-close-pharmacy" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-5 overflow-y-auto space-y-4 text-sm flex-1">
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
              <span>Medicamento Genérico</span>
              <span>Estoque Atual & Aquisição</span>
            </div>

            <div class="space-y-2.5">
              ${meds.map((m) => this.renderMedicationRow(m, stock[m.id] ?? 0)).join('')}
            </div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <span class="text-xs text-slate-500">Saldo Disponível: <strong class="text-emerald-600 font-extrabold">R$ ${this.simulation.state.cash.toLocaleString('pt-BR')}</strong></span>
            <button id="btn-done-pharmacy" class="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all">
              Concluir
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderMedicationRow(med: RenameMedication, currentStock: number): string {
    const isOutOfStock = currentStock === 0;
    const isLowStock = currentStock > 0 && currentStock < 10;

    let badgeClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    let statusText = `${currentStock} ${med.unit}s`;
    if (isOutOfStock) {
      badgeClass = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse';
      statusText = 'EM FALTA (0 un)';
    } else if (isLowStock) {
      badgeClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
      statusText = `Baixo: ${currentStock} un`;
    }

    return `
      <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-slate-50/40 dark:bg-slate-800/20">
        <div class="min-w-[180px] flex-1">
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-slate-800 dark:text-slate-100 text-sm">${med.genericName}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}">${statusText}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${med.category} • ${med.description}</p>
        </div>

        <div class="flex items-center gap-3">
          <button data-buy-med="${med.id}" class="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm">
            + Lote (${med.batchSize}) R$ ${med.batchCost}
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const close = () => {
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    };

    document.getElementById('btn-close-pharmacy')?.addEventListener('click', close);
    document.getElementById('btn-done-pharmacy')?.addEventListener('click', close);

    this.container.querySelectorAll<HTMLButtonElement>('[data-buy-med]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const medId = btn.getAttribute('data-buy-med');
        if (!medId) return;
        const res = buyMedicationBatch(this.simulation.state, medId);
        if (res.success) {
          this.open();
        } else {
          alert(res.error ?? 'Não foi possível comprar o lote.');
        }
      });
    });
  }
}
