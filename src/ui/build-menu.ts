/**
 * Arquivo: src/ui/build-menu.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o Dock Inferior Colapsável de 56px no mobile e tablet, com navegação rápida de ações (Construir,
 * Atender com badge, Equipe, Farmácia, Finanças, Centralizar) e gaveta sob demanda (Build Drawer) deslizante.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter mais de 82% da tela livre para interação no mobile, escondendo as cartas de salas até que o jogador queira construir.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar botões no dock ou novas salas, altere render() e bindEvents().
 *
 * Importa: src/core/config.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts
 */

import { ROOMS_CATALOG, type RoomDefinition } from '../core/config';

export interface BuildMenuCallbacks {
  onSelectRoom: (def: RoomDefinition) => void;
  onToggleRotate: () => void;
  onToggleDemolish: () => void;
  onToggleMove: () => void;
  onCancelSelection: () => void;
  onRecenterMap?: () => void;
  onOpenPendingCase?: () => void;
  onOpenStaff?: () => void;
  onOpenPharmacy?: () => void;
  onOpenFinances?: () => void;
}

const ROOM_FRIENDLY_NAMES: Record<string, string> = {
  reception: 'Recepção',
  waiting: 'Espera',
  consultation: 'Consultório',
  pharmacy: 'Farmácia',
  triage: 'Triagem',
  observation: 'Leitos',
};

export class BuildMenu {
  private container: HTMLElement;
  private callbacks: BuildMenuCallbacks;
  private isDrawerOpen = false;
  private isDemolishActive = false;
  private isMoveActive = false;
  private pendingCasesCount = 0;
  private hasPharmacyAlert = false;

  constructor(container: HTMLElement, callbacks: BuildMenuCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
  }

  public updateBadges(pendingCases: number, hasZeroStock = false): void {
    this.pendingCasesCount = pendingCases;
    this.hasPharmacyAlert = hasZeroStock;

    const badge = document.getElementById('dock-atender-badge');
    if (badge) {
      badge.textContent = `${pendingCases}`;
      badge.classList.toggle('hidden', pendingCases === 0);
    }

    const dot = document.getElementById('dock-pharmacy-alert');
    if (dot) {
      dot.classList.toggle('hidden', !hasZeroStock);
    }
  }

  public closeDrawer(): void {
    this.isDrawerOpen = false;
    document.getElementById('build-drawer')?.classList.add('hidden');
    document.getElementById('btn-dock-build')?.classList.remove('bg-sky-500', 'text-white');
  }

  private render(): void {
    const roomsHtml = ROOMS_CATALOG.rooms.map((room) => `
      <button data-room-id="${room.id}" class="build-card snap-start pointer-events-auto flex flex-col items-center justify-center min-w-[70px] min-h-[56px] px-2.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md transition-all active:scale-95 hover:border-sky-500">
        <span class="text-xl">${room.icon}</span>
        <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200">${ROOM_FRIENDLY_NAMES[room.id] || room.id}</span>
        <span class="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">R$ ${(room.cost / 1000).toFixed(0)}k</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="pointer-events-auto flex flex-col items-center gap-2 max-w-full pb-safe">
        
        <!-- Cajón de Construção Sob Demanda (Build Drawer) -->
        <div id="build-drawer" class="hidden w-full max-w-xl mx-auto p-2 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 animate-in slide-in-from-bottom duration-200">
          <div class="flex items-center justify-between pb-1 px-2 border-b border-slate-200/60 dark:border-slate-800/60 mb-2">
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🏗️ Obras & Instalações</span>
            <button id="btn-close-drawer" class="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold">✕</button>
          </div>
          
          <div class="flex items-center gap-2 overflow-x-auto p-1 scrollbar-none snap-x touch-pan-x">
            ${roomsHtml}
            <div class="w-px h-10 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0"></div>
            <button id="btn-move" title="Mover sala" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[56px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-amber-500 active:scale-95">
              <span class="text-lg">✋</span>
              <span class="text-[9px] font-bold mt-0.5">Mover</span>
            </button>
            <button id="btn-rotate" title="Girar sala (R)" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[56px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-sky-500 active:scale-95">
              <span class="text-lg">🔄</span>
              <span class="text-[9px] font-bold mt-0.5">Girar</span>
            </button>
            <button id="btn-demolish" title="Vender sala" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[56px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-rose-500 active:scale-95">
              <span class="text-lg">🗑️</span>
              <span class="text-[9px] font-bold mt-0.5">Vender</span>
            </button>
          </div>
        </div>

        <!-- Dock Inferior Compacto (56px) com 5 Ações Principais -->
        <nav aria-label="Ações Principais" class="h-14 px-3 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 sm:gap-3 text-slate-700 dark:text-slate-200">
          
          <button id="btn-dock-build" title="Abrir menu de construção" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <span class="text-base">🏗️</span>
            <span class="text-[10px]">Obras</span>
          </button>

          <button id="btn-dock-atender" title="Atender paciente pronto no consultório" class="relative min-w-[52px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-emerald-600 dark:text-emerald-400">
            <span class="text-base">🩺</span>
            <span class="text-[10px]">Atender</span>
            <span id="dock-atender-badge" class="${this.pendingCasesCount > 0 ? '' : 'hidden'} absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-md">
              ${this.pendingCasesCount}
            </span>
          </button>

          <button id="btn-dock-staff" title="Equipe médica e salários" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <span class="text-base">👥</span>
            <span class="text-[10px]">Equipe</span>
          </button>

          <button id="btn-dock-pharmacy" title="Farmácia RENAME" class="relative min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <span class="text-base">💊</span>
            <span class="text-[10px]">Farmácia</span>
            <span id="dock-pharmacy-alert" class="${this.hasPharmacyAlert ? '' : 'hidden'} absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </button>

          <button id="btn-dock-finances" title="Finanças SIGTAP" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
            <span class="text-base">💰</span>
            <span class="text-[10px]">Finanças</span>
          </button>

          <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto"></div>

          <button id="btn-recenter" title="Centralizar Mapa" class="min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-sm">
            🎯
          </button>
        </nav>
      </div>
    `;
    this.bindEvents();
  }

  private bindEvents(): void {
    document.getElementById('btn-dock-build')?.addEventListener('click', () => {
      this.isDrawerOpen = !this.isDrawerOpen;
      const drawer = document.getElementById('build-drawer');
      if (drawer) drawer.classList.toggle('hidden', !this.isDrawerOpen);
    });

    document.getElementById('btn-close-drawer')?.addEventListener('click', () => this.closeDrawer());

    document.getElementById('btn-dock-atender')?.addEventListener('click', () => {
      this.closeDrawer();
      this.callbacks.onOpenPendingCase?.();
    });

    document.getElementById('btn-dock-staff')?.addEventListener('click', () => {
      this.closeDrawer();
      this.callbacks.onOpenStaff?.();
    });

    document.getElementById('btn-dock-pharmacy')?.addEventListener('click', () => {
      this.closeDrawer();
      this.callbacks.onOpenPharmacy?.();
    });

    document.getElementById('btn-dock-finances')?.addEventListener('click', () => {
      this.closeDrawer();
      this.callbacks.onOpenFinances?.();
    });

    document.getElementById('btn-recenter')?.addEventListener('click', () => {
      this.callbacks.onRecenterMap?.();
    });

    this.container.querySelectorAll('.build-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.roomId;
        const def = ROOMS_CATALOG.rooms.find((r) => r.id === id);
        if (def) {
          this.isDemolishActive = false;
          this.isMoveActive = false;
          this.callbacks.onSelectRoom(def);
        }
      });
    });

    document.getElementById('btn-rotate')?.addEventListener('click', () => this.callbacks.onToggleRotate());
    document.getElementById('btn-move')?.addEventListener('click', () => {
      this.isMoveActive = !this.isMoveActive;
      this.isDemolishActive = false;
      this.callbacks.onToggleMove();
    });
    document.getElementById('btn-demolish')?.addEventListener('click', () => {
      this.isDemolishActive = !this.isDemolishActive;
      this.isMoveActive = false;
      this.callbacks.onToggleDemolish();
    });
  }
}
