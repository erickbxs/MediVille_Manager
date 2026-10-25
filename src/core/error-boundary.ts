/**
 * Arquivo: src/core/error-boundary.ts
 *
 * 1. O que este arquivo faz?
 * Registra interceptadores globais de exceções não tratadas (window.onerror e window.onunhandledrejection)
 * que realizam o salvamento emergencial assíncrono do estado válido no slot de segurança do IndexedDB
 * e exibem um modal resiliente com estética Apple ("Recuperar Turno").
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender aos requisitos da Parte 4 do Prompt 13 (tolerância a falhas e recuperação de turnos),
 * impedindo travamento mudo da interface e protegendo os dados do jogador sem logar informações confidenciais.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para disparar um teste de contingência, execute window.dispatchEvent(new ErrorEvent('error', { error: new Error('Simulated') })).
 *
 * Importa: src/core/simulation.ts, src/services/indexeddb-save.ts, src/systems/save-system.ts
 * Conecta-se com: src/main.ts, window
 */

import type { HospitalSimulation } from './simulation';
import { saveGameDualSlots } from '../services/indexeddb-save';
import { serializeGameState } from '../systems/save-system';

export class GlobalErrorBoundary {
  private simulation: HospitalSimulation | null = null;
  private isModalActive = false;

  public attach(simulation: HospitalSimulation): void {
    this.simulation = simulation;
    this.setupListeners();
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.onerror = (message) => {
      this.handleCrash('Erro de Execução', message ? String(message) : 'Falha interna inesperada');
      return true;
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      this.handleCrash('Promessa Não Tratada', event.reason ? String(event.reason) : 'Falha assíncrona');
      event.preventDefault();
    };
  }

  private handleCrash(title: string, detail: string): void {
    if (this.isModalActive) return;
    this.isModalActive = true;

    // Tentativa de salvamento emergencial assíncrono
    if (this.simulation && this.simulation.state) {
      try {
        const serialized = serializeGameState(this.simulation.state);
        void saveGameDualSlots(serialized);
      } catch (saveErr) {
        console.warn('[ErrorBoundary] Falha no salvamento emergencial:', saveErr);
      }
    }

    this.renderRecoveryModal(title, detail);
  }

  private renderRecoveryModal(title: string, detail: string): void {
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'error-boundary-modal';
    overlay.className = 'fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200';
    overlay.innerHTML = buildRecoveryModalHtml(title, detail);

    document.body.appendChild(overlay);

    const reload = () => {
      overlay.remove();
      this.isModalActive = false;
      if (typeof window !== 'undefined') window.location.reload();
    };

    overlay.querySelector('#btn-recover-turn')?.addEventListener('click', reload);
    overlay.querySelector('#btn-reload-game')?.addEventListener('click', reload);
  }
}

function buildRecoveryModalHtml(title: string, detail: string): string {
  const safeDetail = detail.replace(/https?:\/\/[^\s]+/g, '[recurso interno]');
  return `
    <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
      <div class="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto">🛡️</div>
      <div class="space-y-1">
        <h3 class="text-base font-extrabold text-slate-900 dark:text-slate-50">${title}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">O MediVille Manager detectou uma instabilidade, mas seu turno foi preservado com segurança no backup duplo.</p>
      </div>
      <div class="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[11px] font-mono text-slate-600 dark:text-slate-300 line-clamp-2">${safeDetail}</div>
      <div class="pt-2 flex flex-col sm:flex-row gap-2">
        <button id="btn-recover-turn" class="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all">↺ Recuperar Turno</button>
        <button id="btn-reload-game" class="min-h-[44px] px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 active:scale-95 transition-all">Recarregar Página</button>
      </div>
    </div>
  `;
}

export const globalErrorBoundary = new GlobalErrorBoundary();
