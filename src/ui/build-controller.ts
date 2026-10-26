/**
 * Arquivo: src/ui/build-controller.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia o modo de construção ergonômica tátil "Tap, Nudge & Confirm" (BUILD_PREVIEW) para celulares, tablets e PCs,
 * com feedback de erro em shake de 200ms na tentativa inválida (Lei de Murphy) e botões táteis confortáveis >= 48x48px (Lei de Fitts).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Evitar posicionamento acidental e frustração do jogador em telas touch, permitindo micro-ajustes e prevenção tolerante de erros.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O cálculo de posições e colisões passa pelo callback onValidate. Animação de erro e mensagens são controladas por triggerShakeError().
 *
 * Importa: src/core/config.ts, src/i18n/i18n.ts
 * Conecta-se com: src/main.ts, src/ui/build-menu.ts, src/render/ghost-view.ts, tests/ux-20-laws-and-aesthetics.test.ts
 */

import type { RoomDefinition } from '../core/config';
import { t } from '../i18n/i18n';

export interface BuildControllerCallbacks {
  onValidate: (col: number, row: number, rotated: boolean, def: RoomDefinition, isMove: boolean, movingRoomId: string | null) => boolean;
  onConfirm: (col: number, row: number, rotated: boolean, def: RoomDefinition, isMove: boolean, movingRoomId: string | null) => void;
  onCancel: () => void;
  onChange: (col: number, row: number, rotated: boolean, isValid: boolean) => void;
}

export class BuildController {
  private container: HTMLElement;
  private callbacks: BuildControllerCallbacks;
  private active = false;
  private def: RoomDefinition | null = null;
  private col = 0;
  private row = 0;
  private rotated = false;
  private isMove = false;
  private movingRoomId: string | null = null;
  private isValid = false;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, callbacks: BuildControllerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
  }

  public isActive(): boolean {
    return this.active;
  }

  public getPreviewState(): { def: RoomDefinition | null; col: number; row: number; rotated: boolean; isValid: boolean } {
    return { def: this.def, col: this.col, row: this.row, rotated: this.rotated, isValid: this.isValid };
  }

  public startPreview(
    def: RoomDefinition,
    startCol: number,
    startRow: number,
    isMove = false,
    movingRoomId: string | null = null,
    startRotated = false
  ): void {
    this.active = true;
    this.def = def;
    this.col = Math.max(0, startCol);
    this.row = Math.max(0, startRow);
    this.rotated = startRotated;
    this.isMove = isMove;
    this.movingRoomId = movingRoomId;
    this.validateAndNotify();
    this.render();
  }

  public setPosition(col: number, row: number): void {
    if (!this.active || (this.col === col && this.row === row)) return;
    this.col = Math.max(0, col);
    this.row = Math.max(0, row);
    this.validateAndNotify();
    this.updateBarState();
  }

  public nudge(dCol: number, dRow: number): void {
    if (!this.active) return;
    this.col = Math.max(0, this.col + dCol);
    this.row = Math.max(0, this.row + dRow);
    this.validateAndNotify();
    this.updateBarState();
  }

  public toggleRotate(): void {
    if (!this.active) return;
    this.rotated = !this.rotated;
    this.validateAndNotify();
    this.updateBarState();
  }

  public triggerShakeError(message: string): void {
    const bar = document.getElementById('build-confirm-bar');
    if (!bar) return;
    bar.classList.remove('animate-shake');
    // Força reflow para reiniciar animação CSS de 200ms
    void bar.offsetWidth;
    bar.classList.add('animate-shake');

    let badge = document.getElementById('build-error-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'build-error-badge';
      badge.className = 'w-full text-center text-xs font-bold text-rose-300 bg-rose-950/90 border border-rose-700/80 px-3 py-1.5 rounded-xl transition-all';
      bar.appendChild(badge);
    }
    badge.textContent = `⚠️ ${message}`;
    setTimeout(() => {
      bar.classList.remove('animate-shake');
    }, 250);
  }

  public confirm(): void {
    if (!this.active || !this.def) return;
    if (!this.isValid) {
      this.triggerShakeError(t('build.invalid_space') || 'Espaço ocupado ou fora dos limites!');
      return;
    }
    this.callbacks.onConfirm(this.col, this.row, this.rotated, this.def, this.isMove, this.movingRoomId);
    this.close();
  }

  public cancel(): void {
    if (!this.active) return;
    this.callbacks.onCancel();
    this.close();
  }

  public close(): void {
    this.active = false;
    this.def = null;
    this.movingRoomId = null;
    this.isMove = false;
    this.container.innerHTML = '';
  }

  private validateAndNotify(): void {
    if (!this.def) return;
    this.isValid = this.callbacks.onValidate(
      this.col,
      this.row,
      this.rotated,
      this.def,
      this.isMove,
      this.movingRoomId
    );
    this.callbacks.onChange(this.col, this.row, this.rotated, this.isValid);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      this.nudge(0, -1);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.nudge(0, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      this.nudge(-1, 0);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      this.nudge(1, 0);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.toggleRotate();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.confirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cancel();
    }
  }

  private renderBarHtml(): string {
    const costText = this.isMove ? '' : ` (R$ ${this.def ? this.def.cost.toLocaleString('pt-BR') : 0})`;
    const confirmLabel = this.isMove ? '✅ Mover' : `✅ ${t('room.build') || 'Construir'}${costText}`;
    const btnConfirmClass = this.isValid
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
      : 'bg-slate-700/80 text-slate-300 border border-rose-500/50 hover:bg-slate-700/90 active:scale-95';

    return `
      <div id="build-confirm-bar" class="pointer-events-auto flex flex-wrap items-center justify-center gap-2 p-2 sm:p-3 rounded-3xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom duration-150">
        <!-- D-Pad Ajuste Fino (Lei de Fitts >= 48x48px) -->
        <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button id="btn-nudge-left" title="Mover para esquerda" class="btn-interactive min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 flex items-center justify-center text-lg font-bold">⬅️</button>
          <div class="flex flex-col gap-1">
            <button id="btn-nudge-up" title="Mover para cima" class="btn-interactive min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 flex items-center justify-center text-lg font-bold">⬆️</button>
            <button id="btn-nudge-down" title="Mover para baixo" class="btn-interactive min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 flex items-center justify-center text-lg font-bold">⬇️</button>
          </div>
          <button id="btn-nudge-right" title="Mover para direita" class="btn-interactive min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 flex items-center justify-center text-lg font-bold">➡️</button>
        </div>

        <!-- Girar 90° -->
        <button id="btn-preview-rotate" title="Girar 90° (R)" class="btn-interactive min-w-[48px] min-h-[48px] px-3 h-12 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-95 flex items-center gap-1.5 font-bold text-sm shadow-md">
          <span class="text-xl">🔄</span>
          <span class="hidden sm:inline">Girar 90°</span>
        </button>

        <!-- Confirmar Construção / Movimento (Lei de Fitts & Murphy) -->
        <button id="btn-preview-confirm" class="btn-interactive min-w-[48px] min-h-[48px] px-4 h-12 rounded-2xl font-black text-sm active:scale-95 flex items-center gap-1.5 shadow-lg ${btnConfirmClass}">
          <span>${confirmLabel}</span>
        </button>

        <!-- Cancelar -->
        <button id="btn-preview-cancel" title="Cancelar seleção (Esc)" class="btn-interactive min-w-[48px] min-h-[48px] px-3.5 h-12 rounded-2xl bg-rose-600/90 hover:bg-rose-500 active:scale-95 font-bold text-sm text-white flex items-center gap-1 shadow-md">
          <span>❌</span>
          <span class="hidden sm:inline">${t('common.cancel') || 'Cancelar'}</span>
        </button>
      </div>
    `;
  }

  private render(): void {
    this.container.innerHTML = this.renderBarHtml();
    this.bindBarEvents();
  }

  private updateBarState(): void {
    const confirmBtn = document.getElementById('btn-preview-confirm');
    if (!confirmBtn) {
      this.render();
      return;
    }
    const costText = this.isMove ? '' : ` (R$ ${this.def ? this.def.cost.toLocaleString('pt-BR') : 0})`;
    const confirmLabel = this.isMove ? '✅ Mover' : `✅ ${t('room.build') || 'Construir'}${costText}`;
    confirmBtn.innerHTML = `<span>${confirmLabel}</span>`;

    const badge = document.getElementById('build-error-badge');
    if (this.isValid) {
      if (badge && typeof badge.remove === 'function') {
        badge.remove();
      }
      confirmBtn.className = 'btn-interactive min-w-[48px] min-h-[48px] px-4 h-12 rounded-2xl font-black text-sm active:scale-95 flex items-center gap-1.5 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30';
    } else {
      confirmBtn.className = 'btn-interactive min-w-[48px] min-h-[48px] px-4 h-12 rounded-2xl font-black text-sm active:scale-95 flex items-center gap-1.5 shadow-lg bg-slate-700/80 text-slate-300 border border-rose-500/50 hover:bg-slate-700/90';
    }
  }

  private bindBarEvents(): void {
    document.getElementById('btn-nudge-left')?.addEventListener('click', () => this.nudge(-1, 0));
    document.getElementById('btn-nudge-right')?.addEventListener('click', () => this.nudge(1, 0));
    document.getElementById('btn-nudge-up')?.addEventListener('click', () => this.nudge(0, -1));
    document.getElementById('btn-nudge-down')?.addEventListener('click', () => this.nudge(0, 1));
    document.getElementById('btn-preview-rotate')?.addEventListener('click', () => this.toggleRotate());
    document.getElementById('btn-preview-confirm')?.addEventListener('click', () => this.confirm());
    document.getElementById('btn-preview-cancel')?.addEventListener('click', () => this.cancel());
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
  }
}
