/**
 * Arquivo: src/ui/decision-modal.ts
 * O que faz: Exibe o modal da ficha clínica do paciente para tomada de decisão médica pelo jogador, com feedback educativo imediato.
 * Para que foi criado: Cumprir o pilar central de micro-aprendizado do GDD com condutas reais do SUS/RENAME e explicações curtas.
 * Como modificar/debugar: Ajuste fontes e textos em src/data/cases.json e pt.json.
 * Importa: src/entities/patient.ts, src/core/simulation.ts
 * Conecta-se com: src/main.ts
 */

import type { PatientInstance } from '../entities/patient';
import type { HospitalSimulation } from '../core/simulation';
import { getNextPendingDecision, finishPatientDecision } from '../systems/consultation-system';

import { globalBus } from '../core/event-bus';

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

    const optionsHtml = pCase.conductOptions.map((opt) => `
      <button data-conduct-id="${opt.id}" class="conduct-btn w-full min-h-[48px] text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-700/80 transition-all font-medium text-sm text-slate-800 dark:text-slate-100 active:scale-[0.99]">
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
  }

  private close(): void {
    if (this.currentPatient) {
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

  private showFeedback(box: HTMLElement | null): void {
    if (!box || !this.currentPatient) return;
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
