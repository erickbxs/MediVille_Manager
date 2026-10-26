/**
 * Arquivo: src/ui/room-context-menu.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza um menu contextual rápido e ergonômico sobre uma sala hospitalar existente selecionada pelo jogador no mapa.
 * Exibe 3 ações diretas e confortáveis para mobile e desktop: "Mover Sala", "Girar 90°" e "Demolir (+50%)".
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atende à Parte 2 do Prompt 17, permitindo realocar, girar e gerenciar salas já construídas diretamente com 1 toque no mapa,
 * sem depender de ferramentas ocultas na gaveta inferior.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O posicionamento e callbacks são definidos no método show(). O layout visual dos botões (>= 48x48px) está em renderHtml().
 *
 * Importa: src/entities/room.ts, src/i18n/i18n.ts
 * Conecta-se com: src/main.ts, src/ui/build-controller.ts
 */

import type { RoomInstance } from '../entities/room';
import { t } from '../i18n/i18n';

export interface RoomContextMenuCallbacks {
  onMove: (room: RoomInstance) => void;
  onRotate: (room: RoomInstance) => void;
  onDemolish: (room: RoomInstance) => void;
  onClose?: () => void;
}

export class RoomContextMenu {
  private container: HTMLElement;
  private callbacks: RoomContextMenuCallbacks;
  private currentRoom: RoomInstance | null = null;
  private active = false;

  constructor(container: HTMLElement, callbacks: RoomContextMenuCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public isActive(): boolean {
    return this.active;
  }

  public show(room: RoomInstance, screenX: number, screenY: number): void {
    this.currentRoom = room;
    this.active = true;
    this.render(screenX, screenY);
  }

  public hide(): void {
    if (!this.active) return;
    this.active = false;
    this.currentRoom = null;
    this.container.innerHTML = '';
  }

  private render(screenX: number, screenY: number): void {
    if (!this.currentRoom) return;
    const room = this.currentRoom;
    const refund = Math.floor(room.definition.cost * 0.5);

    this.container.innerHTML = `
      <div id="room-context-overlay" class="fixed inset-0 z-30 pointer-events-auto bg-black/20 backdrop-blur-[2px]">
        <div id="room-context-pill" class="absolute pointer-events-auto flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl text-white animate-in zoom-in-95 duration-150"
             style="left: ${Math.max(16, Math.min(window.innerWidth - 300, screenX - 140))}px; top: ${Math.max(70, screenY - 70)}px;">
          <!-- Título Curto da Sala -->
          <div class="w-full text-center text-xs font-black text-amber-400 pb-1 border-b border-slate-800 flex items-center justify-between px-2">
            <span>${room.definition.icon} ${room.definition.shortName}</span>
            <button id="btn-room-ctx-close" class="text-slate-400 hover:text-white text-sm font-bold px-1.5 py-0.5">✕</button>
          </div>

          <!-- Mover Sala -->
          <button id="btn-room-ctx-move" class="min-w-[48px] min-h-[48px] px-3 h-12 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 flex items-center gap-1.5 font-bold text-xs shadow-md">
            <span class="text-lg">✋</span>
            <span>${t('room.move') || 'Mover'}</span>
          </button>

          <!-- Girar 90° -->
          <button id="btn-room-ctx-rotate" class="min-w-[48px] min-h-[48px] px-3 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 flex items-center gap-1.5 font-bold text-xs shadow-md">
            <span class="text-lg">🔄</span>
            <span>Girar 90°</span>
          </button>

          <!-- Demolir com Reembolso -->
          <button id="btn-room-ctx-demolish" class="min-w-[48px] min-h-[48px] px-3 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center gap-1.5 font-bold text-xs shadow-md">
            <span class="text-lg">🗑️</span>
            <span>+R$ ${refund.toLocaleString('pt-BR')}</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents(room);
  }

  private bindEvents(room: RoomInstance): void {
    document.getElementById('btn-room-ctx-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      this.callbacks.onClose?.();
    });

    document.getElementById('room-context-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hide();
        this.callbacks.onClose?.();
      }
    });

    document.getElementById('btn-room-ctx-move')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = this.currentRoom;
      this.hide();
      if (r) this.callbacks.onMove(r);
    });

    document.getElementById('btn-room-ctx-rotate')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onRotate(room);
    });

    document.getElementById('btn-room-ctx-demolish')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = this.currentRoom;
      this.hide();
      if (r) this.callbacks.onDemolish(r);
    });
  }
}
