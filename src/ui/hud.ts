/**
 * Arquivo: src/ui/hud.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a Top Bar ultra-compacta (pílula única de 48px de altura) com caixa abreviado, reputação,
 * estoque RENAME, dia/velocidade determinística e menu flutuante colapsável de detalhes com verba SUS e controles.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Liberar mais de 82% da área útil do canvas em dispositivos móveis e tablets para visão fluida do hospital 3D.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novos indicadores, ajuste formatShortCash ou o painel em renderInitial.
 *
 * Importa: src/core/simulation.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/main.ts
 */

import type { HospitalSimulation } from '../core/simulation';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';
import { soundSystem } from '../core/sound-system';
import { musicSystem } from '../core/music-system';
import { t } from '../i18n/i18n';

export interface HudCallbacks {
  onOpenStaff?: () => void;
  onOpenPharmacy?: () => void;
  onOpenFinances?: () => void;
  onRequestGrant?: () => void;
  onOpenPendingCase?: () => void;
  onOpenSettings?: () => void;
  onOpenEncyclopedia?: () => void;
  onOpenGoals?: () => void;
  onOpenExpandMap?: () => void;
}

export function formatShortCash(amount: number): string {
  if (amount >= 1_000_000) {
    return `R$ ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `R$ ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `R$ ${amount}`;
}

export class HospitalHUD {
  private container: HTMLElement;
  private simulation: HospitalSimulation;
  private callbacks?: HudCallbacks;
  private isDetailsOpen = false;

  constructor(container: HTMLElement, simulation: HospitalSimulation, callbacks?: HudCallbacks | (() => void)) {
    this.container = container;
    this.simulation = simulation;
    this.callbacks = typeof callbacks === 'function' ? { onOpenStaff: callbacks } : callbacks;
    this.renderInitial();
    globalBus.on('simulation:speed_changed', ({ speed }) => this.updateSpeedButtons(speed));
    globalBus.on('i18n:changed', () => {
      this.renderInitial();
      this.update(this.simulation.state);
    });
  }

  private renderInitial(): void {
    this.container.innerHTML = `
      <header class="pointer-events-auto relative w-full max-w-3xl mx-auto">
        <!-- Pílula Única Ultra-Compacta (48px de alto) -->
        <div class="h-12 px-3 sm:px-4 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-slate-800 dark:text-slate-100 text-xs font-bold gap-2">
          
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-base">🏥</span>
            <span id="hud-unit-level" class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">UBS</span>
            <span id="hud-cash" class="tabular-nums text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">R$ 100k</span>
          </div>

          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <span id="hud-reputation" class="tabular-nums flex items-center gap-0.5 text-amber-500 font-extrabold">⭐ 50%</span>
            <span id="hud-pharmacy-pill" class="tabular-nums flex items-center gap-1 text-slate-600 dark:text-slate-300">💊 <span id="hud-pharmacy-stock" class="tabular-nums">0</span></span>
            <span id="hud-clock-pill" class="tabular-nums hidden xs:inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">Dia 1 • 1x</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button id="btn-topbar-expand-map" title="${t('map.expand') || 'Expandir Mapa (+4x4)'}" class="min-h-[36px] px-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1 text-[11px] font-black active:scale-95 shadow-sm">
              <span>📐</span>
              <span class="hidden sm:inline">+Mapa</span>
            </button>
            <button id="btn-toggle-music" title="${t('music.on') || 'Ligar / Desligar Música'}" class="relative min-w-[36px] min-h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-xs">
              <span id="btn-toggle-music-icon">${musicSystem.isMuted() ? '🔇' : '🎵'}</span>
              <span id="btn-toggle-music-indicator" class="${musicSystem.isMuted() ? 'hidden' : ''} absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
            <button id="btn-toggle-sound" title="Ligar / Desligar Efeitos Sonoros" class="min-w-[36px] min-h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-xs">
              ${soundSystem.isMuted() ? '🔇' : '🔊'}
            </button>
            <button id="btn-toggle-details" title="Ver detalhes financeiros e controles" class="min-h-[36px] px-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 text-[11px] font-bold active:scale-95">
              <span>▾ Detalhes</span>
            </button>
            <button id="btn-quick-pause" title="Pausar / Retomar" class="min-w-[36px] min-h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-xs">
              ⏸️
            </button>
          </div>
        </div>

        <!-- Painel Flutuante Colapsável de Detalhes -->
        <div id="hud-details-panel" class="hidden absolute top-14 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 text-xs z-40 space-y-2.5">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span class="text-[10px] text-slate-400 font-semibold block">Satisfação</span>
              <strong id="hud-sat-val" class="tabular-nums text-emerald-500 font-extrabold">50%</strong>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span class="text-[10px] text-slate-400 font-semibold block">Fila Geral</span>
              <strong id="hud-queue" class="tabular-nums text-sky-500 font-extrabold">0 pac.</strong>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span class="text-[10px] text-slate-400 font-semibold block">Repasse PAB Fixo</span>
              <strong class="tabular-nums text-emerald-600 font-extrabold">R$ 4.000/dia</strong>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span class="text-[10px] text-slate-400 font-semibold block">Equipe Ativa</span>
              <strong id="hud-staff-count" class="tabular-nums text-indigo-500 font-extrabold">2 prof.</strong>
            </div>
          </div>


          <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <button id="btn-request-grant" class="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-1.5 transition-all active:scale-95">
                <span>🏛️ Verba</span>
              </button>
              <button id="btn-hud-encyclopedia" class="min-h-[44px] px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 transition-all active:scale-95">
                <span>📖 Enciclopédia</span>
              </button>
              <button id="btn-hud-goals" class="min-h-[44px] px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 transition-all active:scale-95">
                <span>🏆 Metas</span>
              </button>
            </div>
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button id="btn-1x" class="min-w-[36px] min-h-[36px] px-2 rounded-lg font-bold">1x</button>
              <button id="btn-2x" class="min-w-[36px] min-h-[36px] px-2 rounded-lg font-bold">2x</button>
              <button id="btn-3x" class="min-w-[36px] min-h-[36px] px-2 rounded-lg font-bold">3x</button>
            </div>
            <button id="btn-open-settings" class="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold">
              ⚙️ Ajustes
            </button>
          </div>
        </div>
      </header>
    `;
    this.bindButtons();
    this.updateSpeedButtons(this.simulation.state.speed);
  }

  private bindButtons(): void {
    const bind = (id: string, spd: number) => {
      document.getElementById(id)?.addEventListener('click', () => {
        soundSystem.playClick();
        this.simulation.setSpeed(spd);
      });
    };
    bind('btn-1x', 1);
    bind('btn-2x', 2);
    bind('btn-3x', 3);

    document.getElementById('btn-topbar-expand-map')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks?.onOpenExpandMap?.();
    });

    document.getElementById('btn-toggle-music')?.addEventListener('click', () => {
      musicSystem.start();
      const isMuted = musicSystem.toggleMute();
      const icon = document.getElementById('btn-toggle-music-icon');
      const ind = document.getElementById('btn-toggle-music-indicator');
      if (icon) icon.textContent = isMuted ? '🔇' : '🎵';
      if (ind) ind.classList.toggle('hidden', isMuted);
      globalBus.emit('toast:show', {
        text: isMuted ? '🔇 Música Ambiente: Desativada' : '🎵 Música Ambiente: Ativada',
      });
    });

    document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
      const isMuted = soundSystem.toggleMute();
      const btn = document.getElementById('btn-toggle-sound');
      if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
    });

    document.getElementById('btn-quick-pause')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.simulation.togglePause();
    });
    document.getElementById('btn-request-grant')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks?.onRequestGrant?.();
      this.closeDetails();
    });
    document.getElementById('btn-hud-encyclopedia')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks?.onOpenEncyclopedia?.();
      this.closeDetails();
    });
    document.getElementById('btn-hud-goals')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks?.onOpenGoals?.();
      this.closeDetails();
    });
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks?.onOpenSettings?.();
      this.closeDetails();
    });

    document.getElementById('btn-toggle-details')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.isDetailsOpen = !this.isDetailsOpen;
      const panel = document.getElementById('hud-details-panel');
      if (panel) panel.classList.toggle('hidden', !this.isDetailsOpen);
    });
  }

  public closeDetails(): void {
    this.isDetailsOpen = false;
    document.getElementById('hud-details-panel')?.classList.add('hidden');
  }

  public updateSpeedButtons(speed: number): void {
    const quickPauseBtn = document.getElementById('btn-quick-pause');
    if (quickPauseBtn) {
      quickPauseBtn.textContent = speed === 0 ? '▶️' : '⏸️';
    }

    const clockPill = document.getElementById('hud-clock-pill');
    if (clockPill) {
      const spdText = speed === 0 ? '⏸️' : `${speed}x`;
      clockPill.textContent = `Dia ${this.simulation.state.day} • ${spdText}`;
    }

    const map: Record<string, number> = { 'btn-1x': 1, 'btn-2x': 2, 'btn-3x': 3 };
    for (const [id, btnSpeed] of Object.entries(map)) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      btn.className = speed === btnSpeed
        ? 'min-w-[36px] min-h-[36px] px-2 rounded-lg font-extrabold bg-sky-500 text-white shadow-sm'
        : 'min-w-[36px] min-h-[36px] px-2 rounded-lg font-bold text-slate-500 hover:text-slate-800';
    }
  }

  public update(state: GameState): void {
    const cashEl = document.getElementById('hud-cash');
    if (cashEl) cashEl.textContent = formatShortCash(state.cash);

    const repEl = document.getElementById('hud-reputation');
    if (repEl) repEl.textContent = `⭐ ${Math.round(state.reputation)}%`;

    const satVal = document.getElementById('hud-sat-val');
    if (satVal) satVal.textContent = `${Math.round(state.satisfactionAverage)}%`;

    const queueEl = document.getElementById('hud-queue');
    if (queueEl) queueEl.textContent = `${state.queueIds.length} pac.`;

    const staffEl = document.getElementById('hud-staff-count');
    if (staffEl) staffEl.textContent = `${state.staff.size} prof.`;

    let totalStock = 0;
    let hasZero = false;
    for (const count of Object.values(state.pharmacyStock)) {
      totalStock += count;
      if (count === 0) hasZero = true;
    }

    const pharmacyStockEl = document.getElementById('hud-pharmacy-stock');
    if (pharmacyStockEl) {
      pharmacyStockEl.textContent = `${totalStock}`;
      pharmacyStockEl.className = hasZero ? 'text-rose-500 font-extrabold animate-pulse' : '';
    }

    this.updateSpeedButtons(state.speed);
  }
}
