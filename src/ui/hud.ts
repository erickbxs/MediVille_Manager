/**
 * Arquivo: src/ui/hud.ts
 * O que faz: Renderiza e atualiza o HUD superior do jogo (caixa, barras de reputação e satisfação, dia e controles de velocidade).
 * Para que foi criado: Seguir rigorosamente o layout e requisitos do HUD descritos na pág. 11 do GDD.
 * Como modificar/debugar: Para adicionar novos indicadores (ex: novos repasses), acrescente elementos em update().
 * Importa: src/core/simulation.ts, src/state/game-state.ts
 * Conecta-se com: src/main.ts
 */

import type { HospitalSimulation } from '../core/simulation';
import type { GameState } from '../state/game-state';

export interface HudCallbacks {
  onOpenStaff?: () => void;
  onOpenPharmacy?: () => void;
  onOpenFinances?: () => void;
  onRequestGrant?: () => void;
}

export class HospitalHUD {
  private container: HTMLElement;
  private simulation: HospitalSimulation;
  private callbacks?: HudCallbacks;

  constructor(container: HTMLElement, simulation: HospitalSimulation, callbacks?: HudCallbacks | (() => void)) {
    this.container = container;
    this.simulation = simulation;
    if (typeof callbacks === 'function') {
      this.callbacks = { onOpenStaff: callbacks };
    } else {
      this.callbacks = callbacks;
    }
    this.renderInitial();
  }

  private renderInitial(): void {
    this.container.innerHTML = `
      <header class="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-100">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
            🏥
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">MediVille Manager</div>
            <div id="hud-cash" class="text-base font-extrabold text-emerald-600 dark:text-emerald-400">R$ 100.000</div>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-1 max-w-xl justify-center flex-wrap">
          <div class="min-w-[80px]">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Reputação</span>
              <span id="hud-rep-val">50%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div id="hud-rep-bar" class="h-full bg-blue-500 transition-all duration-300" style="width: 50%"></div>
            </div>
          </div>

          <div class="min-w-[80px]">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Satisfação</span>
              <span id="hud-sat-val">50%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div id="hud-sat-bar" class="h-full bg-emerald-500 transition-all duration-300" style="width: 50%"></div>
            </div>
          </div>

          <div class="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5">
            <span>👥 Fila:</span>
            <span id="hud-queue" class="text-sky-600 dark:text-sky-400">0</span>
          </div>

          <button id="btn-open-staff" class="min-h-[44px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
            <span>👨‍⚕️ Equipe:</span>
            <span id="hud-staff-count" class="text-emerald-600 dark:text-emerald-400">2</span>
          </button>

          <button id="btn-open-pharmacy" class="min-h-[44px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
            <span>💊 Farmácia:</span>
            <span id="hud-pharmacy-stock" class="text-emerald-600 dark:text-emerald-400">0 un</span>
          </button>

          <button id="btn-request-grant" title="Solicitar verba extraordinária imediata com a Secretaria de Saúde" class="min-h-[44px] px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95">
            <span>🏛️ Verba Reforma</span>
          </button>

          <button id="btn-open-finances" title="Demonstrativo Orçamentário e Tabela SIGTAP" class="min-h-[44px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
            <span>📊 Finanças</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span id="hud-day" class="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">Dia 1</span>
          <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button id="btn-pause" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">⏸️</button>
            <button id="btn-1x" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 shadow-sm active:scale-95">1x</button>
            <button id="btn-2x" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">2x</button>
            <button id="btn-3x" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">3x</button>
          </div>
        </div>
      </header>
    `;
    this.bindButtons();
  }

  private bindButtons(): void {
    const bind = (id: string, spd: number) => {
      document.getElementById(id)?.addEventListener('click', () => this.simulation.setSpeed(spd));
    };
    document.getElementById('btn-pause')?.addEventListener('click', () => this.simulation.togglePause());
    document.getElementById('btn-open-staff')?.addEventListener('click', () => {
      this.callbacks?.onOpenStaff?.();
    });
    document.getElementById('btn-open-pharmacy')?.addEventListener('click', () => {
      this.callbacks?.onOpenPharmacy?.();
    });
    document.getElementById('btn-open-finances')?.addEventListener('click', () => {
      this.callbacks?.onOpenFinances?.();
    });
    document.getElementById('btn-request-grant')?.addEventListener('click', () => {
      this.callbacks?.onRequestGrant?.();
    });
    bind('btn-1x', 1);
    bind('btn-2x', 2);
    bind('btn-3x', 3);
  }

  public update(state: GameState): void {
    const cashEl = document.getElementById('hud-cash');
    if (cashEl) cashEl.textContent = `R$ ${state.cash.toLocaleString('pt-BR')}`;

    const repVal = document.getElementById('hud-rep-val');
    const repBar = document.getElementById('hud-rep-bar');
    if (repVal && repBar) {
      repVal.textContent = `${Math.round(state.reputation)}%`;
      repBar.style.width = `${Math.max(0, Math.min(100, state.reputation))}%`;
    }

    const satVal = document.getElementById('hud-sat-val');
    const satBar = document.getElementById('hud-sat-bar');
    if (satVal && satBar) {
      satVal.textContent = `${Math.round(state.satisfactionAverage)}%`;
      satBar.style.width = `${Math.max(0, Math.min(100, state.satisfactionAverage))}%`;
    }

    const queueEl = document.getElementById('hud-queue');
    if (queueEl) queueEl.textContent = `${state.queueIds.length}`;

    const staffEl = document.getElementById('hud-staff-count');
    if (staffEl) staffEl.textContent = `${state.staff.size}`;

    const pharmacyStockEl = document.getElementById('hud-pharmacy-stock');
    if (pharmacyStockEl) {
      let totalStock = 0;
      let hasZero = false;
      for (const count of Object.values(state.pharmacyStock)) {
        totalStock += count;
        if (count === 0) hasZero = true;
      }
      pharmacyStockEl.textContent = `${totalStock} un`;
      if (hasZero) {
        pharmacyStockEl.className = 'text-rose-500 font-extrabold animate-pulse';
      } else {
        pharmacyStockEl.className = 'text-emerald-600 dark:text-emerald-400 font-bold';
      }
    }

    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = `Dia ${state.day}`;
  }
}
