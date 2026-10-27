/**
 * Arquivo: src/input/canvas-input.ts
 *
 * 1. O que este arquivo faz?
 * Captura e coordena eventos táteis, mouse e teclado para movimentação de câmera (Focal Pinch-to-Zoom e Pan com CameraController),
 * conversão exata Screen-to-World com offset tátil de 36px, travamento de câmera durante o posicionamento de obras e long-press de 250ms para mover salas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 22 e Prompt 23, proporcionando pegada e arraste tátil nativo em celulares e tablets
 * sem conflito entre scroll, zoom de pinça focal e movimentação de salas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O cálculo de grade usa camera.screenToGrid. O atraso do long-press é calibrado em LONG_PRESS_DELAY_MS.
 *
 * Importa: src/render/camera.ts, src/render/camera-controller.ts
 * Conecta-se com: src/main.ts, src/render/renderer.ts, src/ui/build-controller.ts
 */

import type { Camera } from '../render/camera';
import { CameraController } from '../render/camera-controller';

export interface InputHandlers {
  onGridClick: (col: number, row: number) => void;
  onGridHover: (col: number, row: number) => void;
  onRotateKey: () => void;
  isBuildPreviewActive?: () => boolean;
  onPreviewDrag?: (col: number, row: number) => void;
  onRoomLongPress?: (col: number, row: number) => void;
  onToggleHeatmap?: () => void;
}

const TOUCH_OFFSET_Y = 36;
const DRAG_THRESHOLD_PX = 8;
const LONG_PRESS_DELAY_MS = 250;

export class CanvasInputManager {
  private element: HTMLElement;
  private camera: Camera;
  private handlers: InputHandlers;
  public cameraController: CameraController;
  private isDragging = false;
  private isDragMoved = false;
  private startX = 0;
  private startY = 0;
  private longPressTimer: number | null = null;
  private isLongPressed = false;
  private hadMultiplePointers = false;

  constructor(element: HTMLElement, camera: Camera, handlers: InputHandlers) {
    this.element = element;
    this.camera = camera;
    this.handlers = handlers;
    this.cameraController = new CameraController(camera, element, {
      onToggleHeatmap: handlers.onToggleHeatmap,
    });
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('pointercancel', this.onPointerUp.bind(this));
    this.element.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onPointerDown(e: PointerEvent): void {
    this.cameraController.handlePointerDown(e);
    this.isDragging = true;
    this.isDragMoved = false;
    this.isLongPressed = false;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.cameraController.isPinching()) {
      this.hadMultiplePointers = true;
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      return;
    }

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
        if (!this.cameraController.isPinching()) {
          this.isLongPressed = true;
          this.camera.panLocked = true;
          this.handlers.onRoomLongPress?.(grid.col, grid.row);
        }
      }, LONG_PRESS_DELAY_MS);
    }
  }

  private onPointerMove(e: PointerEvent): void {
    const isPinchAction = this.cameraController.handlePointerMove(e);
    if (isPinchAction || this.cameraController.isPinching()) {
      this.hadMultiplePointers = true;
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      return;
    }

    const isTouch = e.pointerType === 'touch';
    const isBuildPreview = this.handlers.isBuildPreviewActive?.() ?? false;

    if (this.isDragging) {
      const totalMoved = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
      if (totalMoved > DRAG_THRESHOLD_PX && this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (isBuildPreview || this.isLongPressed) {
        this.handlePreviewOrLongPressDrag(e, isTouch);
        return;
      }
      if (totalMoved > DRAG_THRESHOLD_PX) {
        this.isDragMoved = true;
      }
    } else {
      const rect = this.element.getBoundingClientRect();
      const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      this.handlers.onGridHover(grid.col, grid.row);
    }
  }

  private handlePreviewOrLongPressDrag(e: PointerEvent, isTouch: boolean): void {
    this.camera.panLocked = true;
    const rect = this.element.getBoundingClientRect();
    const touchOffsetY = isTouch ? -TOUCH_OFFSET_Y : 0;
    const grid = this.camera.screenToGrid(e.clientX - rect.left, e.clientY - rect.top + touchOffsetY);
    if (this.handlers.onPreviewDrag) {
      this.handlers.onPreviewDrag(grid.col, grid.row);
    } else {
      this.handlers.onGridHover(grid.col, grid.row);
    }
  }


  private onPointerUp(e: PointerEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const wasPinch = this.cameraController.isPinching() || this.hadMultiplePointers;
    this.cameraController.handlePointerUp(e);

    if (this.cameraController.getActivePointerCount() === 0) {
      this.hadMultiplePointers = false;
    }

    const isBuildPreview = this.handlers.isBuildPreviewActive?.() ?? false;
    const isTouch = e.pointerType === 'touch';
    const wasPan = this.isDragMoved || Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > DRAG_THRESHOLD_PX;
    this.isDragging = false;
    this.isDragMoved = false;

    if (isBuildPreview) {
      this.camera.panLocked = false;
    }

    if (!wasPinch && (!wasPan || (isBuildPreview && isTouch))) {
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

  public destroy(): void {
    this.cameraController.destroy();
  }
}
