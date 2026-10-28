/**
 * Arquivo: src/ui/decision-modal.ts
 *
 * 1. O que este arquivo faz?
 * Exibe o modal da ficha clínica do paciente para tomada de decisão médica pelo jogador,
 * com feedback educativo imediato e compra rápida de medicamento em falta com 1 clique (Lei de Tesler).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir o pilar de micro-aprendizado do GDD com condutas reais do SUS/RENAME e ergonomia tátil sem atrito.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O catálogo de condutas provém de src/data/cases.json e a verificação de estoque utiliza findRelevantMedication e buyMedicationBatch.
 *
 * Importa: src/entities/patient.ts, src/core/simulation.ts, src/systems/consultation-system.ts, src/core/config.ts, src/systems/economy-system.ts, src/core/event-bus.ts, src/entities/revalida-question.ts, src/i18n/i18n.ts, src/ui/revalida-question-view.ts
 * Conecta-se com: src/main.ts, tests/ux-20-laws-and-aesthetics.test.ts
 */

import type { PatientInstance } from '../entities/patient';
import type { HospitalSimulation } from '../core/simulation';
import { getNextPendingDecision, finishPatientDecision } from '../systems/consultation-system';
import { PHARMACY_CATALOG, type RenameMedication } from '../core/config';
import { buyMedicationBatch } from '../systems/economy-system';
import { globalBus } from '../core/event-bus';
import type { RevalidaCasePayload } from '../entities/revalida-question';
import { t } from '../i18n/i18n';
import {
  areaLabel,
  escapeHtml,
  markAnsweredOptions,
  renderOptionButtons,
  renderReferenceLine,
  renderRevalidaFeedback,
  renderStem,
} from './revalida-question-view';

export function findRelevantMedication(conductText: string, caseName = ''): RenameMedication {
  const norm = (conductText + ' ' + caseName).toLowerCase();
  for (const med of PHARMACY_CATALOG.medications) {
    const medKey = med.id.split('-')[0] ?? '';
    const namePart = med.genericName.toLowerCase().split(' ')[0] ?? '';
    if (norm.includes(medKey) || (namePart.length > 3 && norm.includes(namePart))) {
      return med;
    }
  }
  return PHARMACY_CATALOG.medications[0]!;
}

export class DecisionModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;
  private currentPatient: PatientInstance | null = null;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(patient: PatientInstance): void {
    this.simulation.pauseForModal();
    globalBus.emit('music:ducking_changed', { isDucking: true });
    this.currentPatient = patient;
    const pCase = patient.clinicalCase;
    const def = pCase.definition;
    if (def.revalida) {
      this.openRevalida(patient, def.revalida);
      return;
    }
    const med = findRelevantMedication(def.suggestedConduct.text, def.name);
    const stock = this.simulation.state.pharmacyStock[med.id] ?? 0;

    const optionsHtml = pCase.conductOptions.map((opt) => `
      <button data-conduct-id="${opt.id}" class="conduct-btn btn-interactive w-full min-h-[48px] text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-700/80 transition-all font-medium text-sm text-slate-800 dark:text-slate-100 active:scale-[0.99]">
        ${opt.text}
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[82dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-sky-500/15 flex items-center justify-center text-xl">🩺</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">${patient.name} (${patient.age} anos)</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Quadro: ${def.name} • ${def.area}</p>
              </div>
            </div>
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Pendente Revisão</span>
          </div>

          <div class="p-5 overflow-y-auto space-y-4 text-sm flex-1">
            <div class="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Sintomas Queixados:</span>
              <p class="font-medium text-slate-700 dark:text-slate-200 mt-1">${def.symptoms.join(', ')}</p>
            </div>

            ${pCase.comorbidity ? `
              <div class="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900">
                ⚠️ Condição prévia relatada: ${pCase.comorbidity}
              </div>
            ` : ''}

            <!-- Lei de Tesler: Status do medicamento RENAME e compra com 1 clique -->
            <div id="med-stock-container">
              ${this.renderMedStockBanner(med, stock)}
            </div>

            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Selecione a Conduta Médica:</span>
              <div id="options-container" class="space-y-2.5">${optionsHtml}</div>
            </div>

            <div id="feedback-box" class="hidden p-4 rounded-2xl border text-sm font-medium"></div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-2">
            <button id="btn-close-modal" class="min-w-[44px] min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 active:scale-95 transition-all">
              Concluir Atendimento
            </button>
          </div>
        </div>
      </div>
    `;
    this.bindOptionClicks();
    this.bindQuickBuyMed(med);
  }

  /** Modo Revalida: o paciente traz uma questão oficial do INEP (texto sem alterações + referência). */
  private openRevalida(patient: PatientInstance, payload: RevalidaCasePayload): void {
    const q = payload.question;
    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="revalida-q-title">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90dvh]">
          <div class="flex items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 shrink-0 rounded-2xl bg-sky-500/15 flex items-center justify-center text-xl">🩺</div>
              <div class="min-w-0">
                <h3 id="revalida-q-title" class="font-extrabold text-base text-slate-900 dark:text-slate-50 truncate">${escapeHtml(patient.name)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${escapeHtml(areaLabel(q.area))} · ${escapeHtml(payload.reference)}</p>
              </div>
            </div>
            <span class="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300">Revalida ${escapeHtml(q.editionLabel)}</span>
          </div>
          <div class="p-5 overflow-y-auto space-y-4 text-sm flex-1 min-h-0">
            <div class="space-y-2 text-slate-800 dark:text-slate-100">${renderStem(q)}</div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">${escapeHtml(t('revalida.select_answer'))}</span>
              <div id="options-container" class="space-y-2.5">${renderOptionButtons(patient.clinicalCase.conductOptions)}</div>
            </div>
            <div id="feedback-box" class="hidden"></div>
            ${renderReferenceLine(payload)}
          </div>
          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap justify-end gap-2">
            <button id="btn-close-modal" class="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all">${escapeHtml(t('revalida.answer_later'))}</button>
          </div>
        </div>
      </div>`;
    this.bindOptionClicks();
  }

  private renderMedStockBanner(med: RenameMedication, currentStock: number): string {
    const inStock = currentStock > 0;
    const bannerBg = inStock
      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';

    return `
      <div class="p-3.5 rounded-2xl border text-xs font-medium flex flex-wrap items-center justify-between gap-2 ${bannerBg}">
        <div class="flex items-center gap-2">
          <span class="text-base">💊</span>
          <div>
            <span class="font-bold">${med.genericName}</span>:
            <span>${inStock ? `✅ Em estoque: ${currentStock} un` : `⚠️ Sem estoque — Comprar 1 lote agora`}</span>
          </div>
        </div>
        ${!inStock ? `
          <button id="btn-quick-buy-med" data-med-id="${med.id}" class="btn-interactive min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all active:scale-95 shadow-sm text-xs">
            Comprar Lote (${med.batchSize} un por R$ ${med.batchCost})
          </button>
        ` : ''}
      </div>
    `;
  }

  private bindQuickBuyMed(med: RenameMedication): void {
    const btn = document.getElementById('btn-quick-buy-med');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const res = buyMedicationBatch(this.simulation.state, med.id);
      const container = document.getElementById('med-stock-container');
      if (res.success && container) {
        const newStock = this.simulation.state.pharmacyStock[med.id] ?? 0;
        container.innerHTML = this.renderMedStockBanner(med, newStock);
        this.bindQuickBuyMed(med);
      } else if (!res.success) {
        alert(res.error ?? 'Saldo insuficiente para adquirir lote.');
      }
    });
  }

  private close(): void {
    // Fechar sem responder mantém o paciente na fila de decisões (antes ele ficava preso no consultório).
    if (this.currentPatient?.clinicalCase.decisionMade) {
      finishPatientDecision(this.simulation.state, this.currentPatient.id);
    }
    globalBus.emit('music:ducking_changed', { isDucking: false });
    this.container.innerHTML = '';
    this.currentPatient = null;
    this.simulation.resumeFromModal();
  }

  private bindOptionClicks(): void {
    const box = document.getElementById('feedback-box');
    const closeBtn = document.getElementById('btn-close-modal');

    this.container.querySelectorAll('.conduct-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const conductId = (btn as HTMLElement).dataset.conductId;
        if (!conductId || !this.currentPatient) return;

        this.simulation.submitClinicalDecision(this.currentPatient.id, conductId);
        this.showFeedback(box);
      });
    });

    closeBtn?.addEventListener('click', () => this.close());
  }

  private showRevalidaFeedback(box: HTMLElement, payload: RevalidaCasePayload): void {
    const pCase = this.currentPatient!.clinicalCase;
    const chosenId = pCase.chosenConductId ?? '';
    box.className = '';
    box.innerHTML = renderRevalidaFeedback(payload, chosenId.slice(-1), pCase.isDecisionCorrect);
    markAnsweredOptions(this.container, pCase.conductOptions, chosenId);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.renderFooterActions();
  }

  private showFeedback(box: HTMLElement | null): void {
    if (!box || !this.currentPatient) return;
    const payload = this.currentPatient.clinicalCase.definition.revalida;
    if (payload) {
      this.showRevalidaFeedback(box, payload);
      return;
    }
    const isCorrect = this.currentPatient.clinicalCase.isDecisionCorrect;
    const text = this.currentPatient.clinicalCase.feedbackText;

    box.className = isCorrect
      ? 'p-4 rounded-2xl border text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
      : 'p-4 rounded-2xl border text-sm font-medium bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200';

    box.innerHTML = `
      <div class="font-bold mb-1">${isCorrect ? '✅ Conduta Correta (Protocolo SUS):' : '⚠️ Conduta Inadequada:'}</div>
      <div>${text}</div>
    `;
    box.classList.remove('hidden');
    this.container.querySelectorAll('.conduct-btn').forEach((b) => ((b as HTMLButtonElement).disabled = true));

    this.renderFooterActions();
  }

  private renderFooterActions(): void {
    const footer = this.container.querySelector('.p-4.border-t');
    if (!footer || !this.currentPatient) return;

    const remaining = this.simulation.state.pendingDecisionPatientIds.filter(
      (id) => id !== this.currentPatient?.id
    ).length;

    if (remaining > 0) {
      footer.innerHTML = `
        <button id="btn-next-case" class="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all">
          📋 Atender Próximo Caso (${remaining} na espera)
        </button>
        <button id="btn-close-modal" class="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition-all">
          Voltar ao Hospital
        </button>
      `;

      document.getElementById('btn-next-case')?.addEventListener('click', () => {
        if (this.currentPatient) finishPatientDecision(this.simulation.state, this.currentPatient.id);
        const next = getNextPendingDecision(this.simulation.state);
        if (next) {
          this.open(next);
        } else {
          this.close();
        }
      });
    } else {
      footer.innerHTML = `
        <button id="btn-close-modal" class="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 active:scale-95 transition-all">
          ✓ Concluir Atendimento
        </button>
      `;
    }

    document.getElementById('btn-close-modal')?.addEventListener('click', () => this.close());
  }

  public isOpen(): boolean {
    return this.currentPatient !== null;
  }
}
