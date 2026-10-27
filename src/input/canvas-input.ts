/**
 * Arquivo: src/input/canvas-input.ts
 *
 * 1. O que este arquivo faz?
 * Captura eventos táteis, mouse e teclado para movimentação de câmera (pan e zoom), conversão exata Screen-to-World
 * com offset de toque de 36px, travamento de câmera durante o posicionamento de obras e long-press de 250ms para mover salas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 22, proporcionando pegada e arraste tátil nativo em celulares e tablets sem conflito de pan.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O cálculo de grade usa camera.screenToGrid. O atraso do long-press é calibrado em LONG_PRESS_DELAY_MS.
 *
 * Importa: src/render/camera.ts
 * Conecta-se com: src/main.ts, src/render/renderer.ts, src/ui/build-controller.ts
 */

import type { Camera } from '../render/camera';

export interface InputHandlers {
  onGridClick: (col: number, row: number) => void;
  onGridHover: (col: number, row: number) => void;
  onRotateKey: () => void;
  isBuildPreviewActive?: () => boolean;
  onPreviewDrag?: (col: number, row: number) => void;
  onRoomLongPress?: (col: number, row: number) => void;
}

const TOUCH_OFFSET_Y = 36;
const DRAG_THRESHOLD_PX = 8;
const LONG_PRESS_DELAY_MS = 250;

export class CanvasInputManager {
  private element: HTMLElement;
  private camera: Camera;
  private handlers: InputHandlers;
  private isDragging = false;
  private isDragMoved = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private touchDistance = 0;
  private longPressTimer: number | null = null;
  private isLongPressed = false;

  constructor(element: HTMLElement, camera: Camera, handlers: InputHandlers) {
    this.element = element;
    this.camera = camera;
    this.handlers = handlers;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.element.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    this.bindTouchEvents();
  }

  private onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.isDragMoved = false;
    this.isLongPressed = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    const isBuildPreview = this.handlers.isBuildPreviewActive?.() ?? false;
    if (isBuildPreview) {
      this.camera.panLocked = true;
      const rect = this.element.getBoundingClientRect();
      const touchOffsetY = e.pointerType === 'touch' ? -TOUCH_OFFSET_Y : 0;
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top + touchOffsetY);
      this.handlers.onPreviewDrag?.(grid.col, grid.row);
    } else if (this.handlers.onRoomLongPress) {
      const rect = this.element.getBoundingClientRect();
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      this.longPressTimer = window.setTimeout(() => {
        this.isLongPressed = true;
        this.camera.panLocked = true;
        this.handlers.onRoomLongPress?.(grid.col, grid.row);
      }, LONG_PRESS_DELAY_MS);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    const isTouch = e.pointerType === 'touch';
    const isBuildPreview = this.handlers.isBuildPreviewActive?.() ?? false;

    if (this.isDragging) {
      const totalMoved = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
      if (totalMoved > DRAG_THRESHOLD_PX && this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (isBuildPreview || this.isLongPressed) {
        this.camera.panLocked = true;
        const rect = this.element.getBoundingClientRect();
        const touchOffsetY = isTouch ? -TOUCH_OFFSET_Y : 0;
        const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top + touchOffsetY);
        if (this.handlers.onPreviewDrag) {
          this.handlers.onPreviewDrag(grid.col, grid.row);
        } else {
          this.handlers.onGridHover(grid.col, grid.row);
        }
        return;
      }

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      if (!this.isDragMoved && totalMoved > DRAG_THRESHOLD_PX) {
        this.isDragMoved = true;
      }
      this.camera.pan(dx, dy);
    } else {
      const rect = this.element.getBoundingClientRect();
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      this.handlers.onGridHover(grid.col, grid.row);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const isBuildPreview = this.handlers.isBuildPreviewActive?.() ?? false;
    const isTouch = e.pointerType === 'touch';
    const wasPan = this.isDragMoved || Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > DRAG_THRESHOLD_PX;
    this.isDragging = false;
    this.isDragMoved = false;

    if (isBuildPreview) {
      this.camera.panLocked = false;
    }

    if (!wasPan || (isBuildPreview && isTouch)) {
      const rect = this.element.getBoundingClientRect();
      const touchOffsetY = isBuildPreview && isTouch ? -TOUCH_OFFSET_Y : 0;
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top + touchOffsetY);
      this.handlers.onGridClick(grid.col, grid.row);
    }
  }


  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const rect = this.element.getBoundingClientRect();
    this.camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'r' || e.key === 'R') {
      this.handlers.onRotateKey();
    }
  }

  private bindTouchEvents(): void {
    this.element.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (this.touchDistance > 0) {
          const factor = dist / this.touchDistance;
          const cx = (t1.clientX + t2.clientX) / 2;
          const cy = (t1.clientY + t2.clientY) / 2;
          this.camera.zoomAt(cx, cy, factor);
        }
        this.touchDistance = dist;
      }
    }, { passive: false });

    this.element.addEventListener('touchend', () => {
      this.touchDistance = 0;
    });
  }
}
