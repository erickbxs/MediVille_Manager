/**
 * Arquivo: src/ui/build-menu.ts
 * O que faz: Renderiza a barra inferior de construção (dock) com as salas disponíveis, botão de rotação e modo de demolição.
 * Para que foi criado: Permitir ao jogador escolher salas e expandir o hospital tanto em desktop quanto em telas de toque (botões >= 44px).
 * Como modificar/debugar: Caso crie novos tipos de salas, atualize rooms.json e este catálogo.
 * Importa: src/core/config.ts
 * Conecta-se com: src/main.ts
 */

import { ROOMS_CATALOG, type RoomDefinition } from '../core/config';

export interface BuildMenuCallbacks {
  onSelectRoom: (def: RoomDefinition) => void;
  onToggleRotate: () => void;
  onToggleDemolish: () => void;
  onToggleMove: () => void;
  onCancelSelection: () => void;
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
  private activeRoomId: string | null = null;
  private isDemolishActive = false;
  private isMoveActive = false;

  constructor(container: HTMLElement, callbacks: BuildMenuCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
  }

  private render(): void {
    const roomsHtml = ROOMS_CATALOG.rooms.map((room) => `
      <button data-room-id="${room.id}" class="build-btn pointer-events-auto flex flex-col items-center justify-center min-w-[76px] min-h-[56px] px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md transition-all active:scale-95 hover:border-sky-500">
        <span class="text-2xl">${room.icon}</span>
        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">${ROOM_FRIENDLY_NAMES[room.id] || room.id}</span>
        <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">R$ ${(room.cost / 1000).toFixed(0)}k</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <nav aria-label="Menu de Construção" class="flex items-center gap-2 max-w-full overflow-x-auto p-2">
        <div class="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-lg p-2 rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800/60">
          ${roomsHtml}
          <div class="w-px h-10 bg-slate-300 dark:bg-slate-700 mx-1"></div>
          <button id="btn-move" title="Reposicionar sala já existente" class="pointer-events-auto flex flex-col items-center justify-center min-w-[56px] min-h-[56px] px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md transition-all active:scale-95 hover:border-amber-500 border border-slate-200 dark:border-slate-800">
            <span class="text-xl">✋</span>
            <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">Mover</span>
          </button>
          <button id="btn-rotate" title="Girar sala (Tecla R)" class="pointer-events-auto flex flex-col items-center justify-center min-w-[56px] min-h-[56px] px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md transition-all active:scale-95 hover:border-sky-500 border border-slate-200 dark:border-slate-800">
            <span class="text-xl">🔄</span>
            <span class="text-[10px] font-bold mt-0.5">Girar (R)</span>
          </button>
          <button id="btn-demolish" title="Vender sala com 50% de reembolso" class="pointer-events-auto flex flex-col items-center justify-center min-w-[56px] min-h-[56px] px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md transition-all active:scale-95 hover:border-rose-500 border border-slate-200 dark:border-slate-800">
            <span class="text-xl">🗑️</span>
            <span class="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">Vender</span>
          </button>
        </div>
      </nav>
    `;
    this.bindEvents();
  }

  private updateButtonHighlights(): void {
    this.container.querySelectorAll('.build-btn').forEach((btn) => {
      const id = (btn as HTMLElement).dataset.roomId;
      const isSelected = id === this.activeRoomId;
      btn.classList.toggle('border-sky-500', isSelected);
      btn.classList.toggle('scale-105', isSelected);
    });

    const demolishBtn = document.getElementById('btn-demolish');
    if (demolishBtn) {
      demolishBtn.classList.toggle('border-rose-500', this.isDemolishActive);
      demolishBtn.classList.toggle('bg-rose-50', this.isDemolishActive);
      demolishBtn.classList.toggle('dark:bg-rose-950/40', this.isDemolishActive);
    }

    const moveBtn = document.getElementById('btn-move');
    if (moveBtn) {
      moveBtn.classList.toggle('border-amber-500', this.isMoveActive);
      moveBtn.classList.toggle('bg-amber-50', this.isMoveActive);
      moveBtn.classList.toggle('dark:bg-amber-950/40', this.isMoveActive);
    }
  }

  private bindEvents(): void {
    this.container.querySelectorAll('.build-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.roomId;
        const def = ROOMS_CATALOG.rooms.find((r) => r.id === id);
        if (def) {
          this.activeRoomId = def.id;
          this.isDemolishActive = false;
          this.isMoveActive = false;
          this.updateButtonHighlights();
          this.callbacks.onSelectRoom(def);
        }
      });
    });

    document.getElementById('btn-rotate')?.addEventListener('click', () => {
      this.callbacks.onToggleRotate();
    });

    document.getElementById('btn-move')?.addEventListener('click', () => {
      this.isMoveActive = !this.isMoveActive;
      this.isDemolishActive = false;
      this.activeRoomId = null;
      this.updateButtonHighlights();
      this.callbacks.onToggleMove();
    });

    document.getElementById('btn-demolish')?.addEventListener('click', () => {
      this.isDemolishActive = !this.isDemolishActive;
      this.isMoveActive = false;
      this.activeRoomId = null;
      this.updateButtonHighlights();
      this.callbacks.onToggleDemolish();
    });
  }
}
