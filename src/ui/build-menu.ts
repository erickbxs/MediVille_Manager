/**
 * Arquivo: src/ui/build-menu.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o Dock Inferior Colapsável e a Gaveta de Obras (Build Drawer) com cartões limpos e minimalistas
 * (ícone grande, nome simples de 1 palavra, preço curto, dimensão e tooltip com o nome formal completo),
 * além de rolagem horizontal fluida e suporte a troca reativa instantânea de idioma.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 15, simplificando os nomes dos setores para caberem com ergonomia nos cartões do menu,
 * além de manter mais de 80% da tela livre para interação no mobile e tablet.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Rótulos e cartões são gerados em renderRoomsHtml() usando getRoomShortName() e t(). A rolagem horizontal é gerida por horizontal-scroll.ts.
 *
 * Importa: src/core/config.ts, src/ui/horizontal-scroll.ts, src/i18n/i18n.ts, src/core/event-bus.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts, src/render/room-renderer-3d.ts
 */

import { ROOMS_CATALOG, type RoomDefinition } from '../core/config';
import { enableHorizontalScroll } from './horizontal-scroll';
import { getRoomShortName, t } from '../i18n/i18n';
import { globalBus } from '../core/event-bus';
import { getNextExpansion } from '../systems/map-expansion-system';
import type { GameState } from '../state/game-state';

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
  onExpandMap?: () => void;
  getState?: () => GameState;
}

export class BuildMenu {
  private container: HTMLElement;
  private callbacks: BuildMenuCallbacks;
  private isDrawerOpen = false;
  private isDemolishActive = false;
  private isMoveActive = false;
  private pendingCasesCount = 0;
  private hasPharmacyAlert = false;
  private scrollCleanup?: () => void;

  constructor(container: HTMLElement, callbacks: BuildMenuCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.setupI18nSubscription();
  }

  private setupI18nSubscription(): void {
    globalBus.on('i18n:changed', () => {
      const wasOpen = this.isDrawerOpen;
      this.render();
      if (wasOpen) this.openDrawerForRoom();
    });
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

  private renderRoomsHtml(): string {
    return ROOMS_CATALOG.rooms.map((room) => {
      const shortName = getRoomShortName(room.id);
      const fullName = t(room.nameKey);
      const costK = (room.cost / 1000).toFixed(0);
      const dimensions = `${room.width}x${room.height}`;

      return `
        <button data-room-id="${room.id}"
          title="${fullName} — ${dimensions} — R$ ${room.cost}"
          class="build-card snap-start pointer-events-auto flex flex-col items-center justify-between min-w-[76px] h-[76px] px-2 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md transition-all active:scale-95 hover:border-sky-500">
          <span class="text-2xl">${room.icon}</span>
          <span class="w-full text-center font-semibold text-sm truncate text-slate-800 dark:text-slate-100">${shortName}</span>
          <div class="flex items-center justify-between w-full text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span class="font-bold text-emerald-600 dark:text-emerald-400">R$ ${costK}k</span>
            <span>${dimensions}</span>
          </div>
        </button>
      `;
    }).join('');
  }

  private renderExpandMapCardHtml(): string {
    const state = this.callbacks.getState?.();
    if (!state) return '';
    const next = getNextExpansion(state);
    if (!next) return '';
    const costK = (next.cost / 1000).toFixed(0);
    const canAfford = state.cash >= next.cost;

    return `
      <button id="btn-build-expand-map"
        title="Expandir Terreno para ${next.nextSize}x${next.nextSize} (R$ ${next.cost.toLocaleString('pt-BR')})"
        class="snap-start shrink-0 flex flex-col items-center justify-between min-w-[84px] h-[76px] px-2 py-1.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/90 border-2 border-indigo-400 dark:border-indigo-500 shadow-md transition-all active:scale-95 ${canAfford ? 'hover:border-indigo-600' : 'opacity-60 cursor-not-allowed'}">
        <span class="text-xl">📐</span>
        <span class="w-full text-center font-bold text-xs truncate text-indigo-700 dark:text-indigo-300">Expandir</span>
        <div class="flex items-center justify-between w-full text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
          <span>+4x4</span>
          <span>R$ ${costK}k</span>
        </div>
      </button>
      <div class="w-px h-10 bg-indigo-200 dark:bg-indigo-800 mx-0.5 shrink-0"></div>
    `;
  }

  private renderDrawerHtml(): string {
    return `
      <div id="build-drawer" class="hidden w-full max-w-xl mx-auto p-2 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 animate-in slide-in-from-bottom duration-200">
        <div class="flex items-center justify-between pb-1 px-2 border-b border-slate-200/60 dark:border-slate-800/60 mb-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🏗️ ${t('dock.build') || 'Obras'} & ${t('game.unitName') || 'Instalações'}</span>
          <button id="btn-close-drawer" class="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold">✕</button>
        </div>
        <div class="relative flex items-center">
          <button id="btn-build-scroll-prev" aria-label="Rolar esquerda" class="opacity-0 pointer-events-none transition-opacity absolute left-0 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95">◀</button>
          <div id="build-drawer-carousel" class="flex items-center gap-2 overflow-x-auto p-1 scrollbar-none snap-x touch-pan-x w-full">
            ${this.renderExpandMapCardHtml()}
            ${this.renderRoomsHtml()}
            <div class="w-px h-10 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0"></div>
            <button id="btn-move" title="Mover sala" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[76px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-amber-500 active:scale-95">
              <span class="text-xl">✋</span>
              <span class="text-[10px] font-bold mt-1">Mover</span>
            </button>
            <button id="btn-rotate" title="Girar sala (R)" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[76px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-sky-500 active:scale-95">
              <span class="text-xl">🔄</span>
              <span class="text-[10px] font-bold mt-1">Girar</span>
            </button>
            <button id="btn-demolish" title="Vender sala" class="snap-start flex flex-col items-center justify-center min-w-[54px] min-h-[76px] px-2 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-slate-800 text-rose-500 active:scale-95">
              <span class="text-xl">🗑️</span>
              <span class="text-[10px] font-bold mt-1">${t('room.remove') || 'Vender'}</span>
            </button>
          </div>
          <button id="btn-build-scroll-next" aria-label="Rolar direita" class="transition-opacity absolute right-0 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95">▶</button>
        </div>
      </div>
    `;
  }

  private renderDockHtml(): string {
    return `
      <nav aria-label="Ações Principais" class="h-14 px-3 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 sm:gap-3 text-slate-700 dark:text-slate-200">
        <button id="btn-dock-build" title="Abrir menu de obras" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
          <span class="text-base">🏗️</span>
          <span class="text-[10px]">${t('dock.build') || 'Obras'}</span>
        </button>
        <button id="btn-dock-atender" title="Atender paciente pronto" class="relative min-w-[52px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-emerald-600 dark:text-emerald-400">
          <span class="text-base">🩺</span>
          <span class="text-[10px]">${t('dock.treat') || 'Atender'}</span>
          <span id="dock-atender-badge" class="${this.pendingCasesCount > 0 ? '' : 'hidden'} absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-md">${this.pendingCasesCount}</span>
        </button>
        <button id="btn-dock-staff" title="Equipe médica e salários" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
          <span class="text-base">👥</span>
          <span class="text-[10px]">${t('dock.staff') || 'Equipe'}</span>
        </button>
        <button id="btn-dock-pharmacy" title="Farmácia RENAME" class="relative min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
          <span class="text-base">💊</span>
          <span class="text-[10px]">${t('dock.pharmacy') || 'Farmácia'}</span>
          <span id="dock-pharmacy-alert" class="${this.hasPharmacyAlert ? '' : 'hidden'} absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
        </button>
        <button id="btn-dock-finances" title="Finanças SIGTAP" class="min-w-[48px] min-h-[44px] px-2.5 py-1.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
          <span class="text-base">💰</span>
          <span class="text-[10px]">${t('dock.finances') || 'Finanças'}</span>
        </button>
        <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 my-auto"></div>
        <button id="btn-recenter" title="Centralizar Mapa" class="min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-sm">🎯</button>
      </nav>
    `;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="pointer-events-auto flex flex-col items-center gap-2 max-w-full pb-safe">
        ${this.renderDrawerHtml()}
        ${this.renderDockHtml()}
      </div>
    `;
    this.bindEvents();
    this.setupScroll();
  }

  private setupScroll(): void {
    const carousel = document.getElementById('build-drawer-carousel');
    const prevBtn = document.getElementById('btn-build-scroll-prev');
    const nextBtn = document.getElementById('btn-build-scroll-next');
    if (carousel) {
      this.scrollCleanup?.();
      this.scrollCleanup = enableHorizontalScroll(carousel, {
        prevButton: prevBtn,
        nextButton: nextBtn,
        step: 220,
      });
    }
  }

  private bindActionButtons(): void {
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
  }

  private bindEvents(): void {
    document.getElementById('btn-dock-build')?.addEventListener('click', () => {
      this.isDrawerOpen = !this.isDrawerOpen;
      const drawer = document.getElementById('build-drawer');
      if (drawer) drawer.classList.toggle('hidden', !this.isDrawerOpen);
    });

    this.bindActionButtons();

    document.getElementById('btn-build-expand-map')?.addEventListener('click', () => {
      this.callbacks.onExpandMap?.();
      this.render();
      this.openDrawerForRoom();
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

  public openDrawerForRoom(typeId?: string): void {
    this.isDrawerOpen = true;
    const drawer = document.getElementById('build-drawer');
    if (drawer) drawer.classList.remove('hidden');
    if (typeId) {
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === typeId);
      if (def) {
        this.isDemolishActive = false;
        this.isMoveActive = false;
        this.callbacks.onSelectRoom(def);
      }
    }
  }
}
