/**
 * Arquivo: src/ui/hud.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza e atualiza o HUD superior do jogo, exibindo caixa, reputação, satisfação, fila, estoque de medicamentos, dia e controles de velocidade sincronizados, além do botão de ação rápida para atendimento clínico sob demanda.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Criado para seguir as diretrizes do GDD (pág. 11), fornecendo ao jogador a visão do estado geral do hospital e permitindo pausar, acelerar e acionar consultas de pacientes prontos sem popups invasivos.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novos indicadores, ajuste os métodos parciais de atualização (updateStats, updateBars, updateCasesButton). Caso os botões de velocidade não reflitam o estado, verifique o evento 'simulation:speed_changed' emitido pela simulação.
 *
 * Importa: src/core/simulation.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/main.ts
 */

import type { HospitalSimulation } from '../core/simulation';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

export interface HudCallbacks {
  onOpenStaff?: () => void;
  onOpenPharmacy?: () => void;
  onOpenFinances?: () => void;
  onRequestGrant?: () => void;
  onOpenPendingCase?: () => void;
  onOpenSettings?: () => void;
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
    globalBus.on('simulation:speed_changed', ({ speed }) => {
      this.updateSpeedButtons(speed);
    });
  }

  private renderInitial(): void {
    this.container.innerHTML = `
      <header class="pointer-events-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-100 max-w-full overflow-x-hidden">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <div class="flex items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-lg sm:text-xl">
            🏥
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">MediVille</span>
              <span id="hud-unit-level" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">UBS</span>
            </div>
            <div id="hud-cash" class="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">R$ 100.000</div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 sm:gap-2.5 flex-1 max-w-2xl justify-center flex-wrap">
          <div class="min-w-[70px]">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Reputação</span>
              <span id="hud-rep-val">50%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div id="hud-rep-bar" class="h-full bg-blue-500 transition-all duration-300" style="width: 50%"></div>
            </div>
          </div>

          <div class="min-w-[70px]">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Satisfação</span>
              <span id="hud-sat-val">50%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div id="hud-sat-bar" class="h-full bg-emerald-500 transition-all duration-300" style="width: 50%"></div>
            </div>
          </div>

          <button id="btn-pending-cases" title="Atender próximo paciente pronto no consultório" class="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95">
            <span class="text-base">🩺</span>
            <span class="font-extrabold">Atender:</span>
            <span id="hud-cases-count" class="text-sky-600 dark:text-sky-400 font-extrabold">0</span>
          </button>

          <div class="min-h-[44px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5">
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
            <button id="btn-pause" title="Pausar jogo" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">⏸️</button>
            <button id="btn-1x" title="Velocidade normal" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all bg-white dark:bg-slate-700 shadow-sm active:scale-95">1x</button>
            <button id="btn-2x" title="Velocidade rápida (2x)" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">2x</button>
            <button id="btn-3x" title="Velocidade ultra rápida (3x)" class="min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold transition-all hover:bg-white dark:hover:bg-slate-700 active:scale-95">3x</button>
          </div>
          <button id="btn-open-settings" title="Configurações & Salvamento" class="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
            ⚙️
          </button>
        </div>
      </header>
    `;
    this.bindButtons();
    this.updateSpeedButtons(this.simulation.state.speed);
  }

  private bindButtons(): void {
    const bind = (id: string, spd: number) => {
      document.getElementById(id)?.addEventListener('click', () => this.simulation.setSpeed(spd));
    };
    document.getElementById('btn-pause')?.addEventListener('click', () => this.simulation.togglePause());
    document.getElementById('btn-open-staff')?.addEventListener('click', () => this.callbacks?.onOpenStaff?.());
    document.getElementById('btn-open-pharmacy')?.addEventListener('click', () => this.callbacks?.onOpenPharmacy?.());
    document.getElementById('btn-open-finances')?.addEventListener('click', () => this.callbacks?.onOpenFinances?.());
    document.getElementById('btn-request-grant')?.addEventListener('click', () => this.callbacks?.onRequestGrant?.());
    document.getElementById('btn-pending-cases')?.addEventListener('click', () => this.callbacks?.onOpenPendingCase?.());
    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.callbacks?.onOpenSettings?.());
    bind('btn-1x', 1);
    bind('btn-2x', 2);
    bind('btn-3x', 3);
  }

  public updateSpeedButtons(speed: number): void {
    const map: Record<string, number> = {
      'btn-pause': 0,
      'btn-1x': 1,
      'btn-2x': 2,
      'btn-3x': 3,
    };
    for (const [id, btnSpeed] of Object.entries(map)) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      if (speed === btnSpeed) {
        btn.className = id === 'btn-pause'
          ? 'min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-extrabold bg-amber-500 text-white shadow-sm active:scale-95 transition-all'
          : 'min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-extrabold bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400 active:scale-95 transition-all';
      } else {
        btn.className = 'min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all';
      }
    }
  }

  private updateStats(state: GameState): void {
    const cashEl = document.getElementById('hud-cash');
    if (cashEl) cashEl.textContent = `R$ ${state.cash.toLocaleString('pt-BR')}`;

    const unitLevelEl = document.getElementById('hud-unit-level');
    if (unitLevelEl) {
      const names = { ubs: 'UBS', upa: 'UPA 24h', hospital: 'Hospital' };
      unitLevelEl.textContent = names[state.hospitalLevel] || 'UBS';
    }

    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = `Dia ${state.day}`;
  }

  private updateBars(state: GameState): void {
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
  }

  private updateCasesButton(count: number): void {
    const casesEl = document.getElementById('hud-cases-count');
    const casesBtn = document.getElementById('btn-pending-cases');
    if (!casesEl || !casesBtn) return;

    casesEl.textContent = `${count}`;
    if (count > 0) {
      casesBtn.className = 'min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 text-xs font-extrabold flex items-center gap-1.5 animate-pulse active:scale-95 transition-all shadow-md cursor-pointer';
    } else {
      casesBtn.className = 'min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 opacity-60 cursor-default transition-all';
    }
  }

  private updateStock(stock: Record<string, number>): void {
    const pharmacyStockEl = document.getElementById('hud-pharmacy-stock');
    if (!pharmacyStockEl) return;

    let totalStock = 0;
    let hasZero = false;
    for (const count of Object.values(stock)) {
      totalStock += count;
      if (count === 0) hasZero = true;
    }
    pharmacyStockEl.textContent = `${totalStock} un`;
    pharmacyStockEl.className = hasZero
      ? 'text-rose-500 font-extrabold animate-pulse'
      : 'text-emerald-600 dark:text-emerald-400 font-bold';
  }

  public update(state: GameState): void {
    this.updateStats(state);
    this.updateBars(state);
    this.updateCasesButton(state.pendingDecisionPatientIds.length);
    this.updateStock(state.pharmacyStock);

    const queueEl = document.getElementById('hud-queue');
    if (queueEl) queueEl.textContent = `${state.queueIds.length}`;

    const staffEl = document.getElementById('hud-staff-count');
    if (staffEl) staffEl.textContent = `${state.staff.size}`;

    this.updateSpeedButtons(state.speed);
  }
}
