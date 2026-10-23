/**
 * Arquivo: src/input/canvas-input.ts
 * O que faz: Captura eventos de mouse, teclado e toque mobile na tela do jogo (pan, zoom por pinça, clique na grade e rotação).
 * Para que foi criado: Permitir jogabilidade idêntica em PC (mouse) e celulares/tablets (toque multitoque).
 * Como modificar/debugar: Ajuste sensibilidade de arraste e limites de zoom em camera.ts ou aqui.
 * Importa: src/render/camera.ts, src/render/theme-config.ts
 * Conecta-se com: src/main.ts, src/render/renderer.ts
 */

import type { Camera } from '../render/camera';

export interface InputHandlers {
  onGridClick: (col: number, row: number) => void;
  onGridHover: (col: number, row: number) => void;
  onRotateKey: () => void;
}

export class CanvasInputManager {
  private element: HTMLElement;
  private camera: Camera;
  private handlers: InputHandlers;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private touchDistance = 0;

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
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.isDragging) {
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.camera.pan(dx, dy);
    } else {
      const rect = this.element.getBoundingClientRect();
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      this.handlers.onGridHover(grid.col, grid.row);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    const wasDraggingLong = Math.hypot(e.clientX - this.lastX, e.clientY - this.lastY) > 8;
    this.isDragging = false;

    if (!wasDraggingLong) {
      const rect = this.element.getBoundingClientRect();
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
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
