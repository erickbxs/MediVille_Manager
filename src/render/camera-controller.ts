/**
 * Arquivo: src/render/camera-controller.ts
 *
 * 1. O que este arquivo faz?
 * Controla os gestos tátil e de ponteiro da câmera (Focal Pinch-to-Zoom de 2 dedos com ponto focal cravado,
 * pan de 1 dedo com inércia, transição suave 2->1 dedos com cooldown anti-salto de 80ms e botões de zoom discretos).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 23, eliminando saltos bruscos no mobile e garantindo que o zoom de pinça
 * aumente/diminua exatamente ao redor do centro geométrico dos dois dedos do jogador.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * A função matemática pura computeFocalPinchZoom calcula os valores de escala e posição.
 *
 * Importa: src/render/camera.ts, src/render/theme-config.ts
 * Conecta-se com: src/input/canvas-input.ts, src/render/renderer.ts, src/main.ts, tests/traffic-expansion-pinch-and-inspector.test.ts
 */

import type { Camera } from './camera';
import { THEME } from './theme-config';

export interface Point {
  x: number;
  y: number;
}

export interface FocalZoomInput {
  currentScale: number;
  cameraX: number;
  cameraY: number;
  p1: Point;
  p2: Point;
  prevDistance: number;
  prevMidpoint: Point;
  minScale?: number;
  maxScale?: number;
}

export interface FocalZoomResult {
  newScale: number;
  newCameraX: number;
  newCameraY: number;
  newDistance: number;
  newMidpoint: Point;
}

export const MIN_CAMERA_ZOOM = 0.45;
export const MAX_CAMERA_ZOOM = 2.4;
export const PINCH_COOLDOWN_MS = 80;
const BUTTON_ZOOM_STEP = 1.25;

/**
 * Calcula matematicamente o zoom de pinça preservando o ponto do mundo cravado sob o ponto médio dos dois dedos.
 */
export function computeFocalPinchZoom(input: FocalZoomInput): FocalZoomResult {
  const minScale = input.minScale ?? MIN_CAMERA_ZOOM;
  const maxScale = input.maxScale ?? MAX_CAMERA_ZOOM;
  const { p1, p2, prevDistance, prevMidpoint, currentScale, cameraX, cameraY } = input;

  const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const currentMid: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  if (prevDistance <= 0) {
    return {
      newScale: currentScale,
      newCameraX: cameraX,
      newCameraY: cameraY,
      newDistance: currentDist,
      newMidpoint: currentMid,
    };
  }

  // Coordenada do mundo sob o ponto médio ANTES do zoom
  const worldX = (currentMid.x - cameraX) / currentScale;
  const worldY = (currentMid.y - cameraY) / currentScale;

  const ratio = currentDist / prevDistance;
  const rawScale = currentScale * ratio;
  const newScale = Math.max(minScale, Math.min(maxScale, rawScale));

  // Ponto médio novo ancorado no ponto do mundo original + movimento do centro dos dedos
  const newCameraX = currentMid.x - worldX * newScale + (currentMid.x - prevMidpoint.x);
  const newCameraY = currentMid.y - worldY * newScale + (currentMid.y - prevMidpoint.y);

  return {
    newScale,
    newCameraX,
    newCameraY,
    newDistance: currentDist,
    newMidpoint: currentMid,
  };
}

export function clampCameraBounds(
  cameraX: number,
  cameraY: number,
  zoom: number,
  gridSize: number,
  viewportW: number,
  viewportH: number
): { x: number; y: number } {
  const mapW = gridSize * THEME.tileSize * zoom;
  const mapH = gridSize * THEME.tileSize * zoom;
  const marginW = viewportW * 0.4;
  const marginH = viewportH * 0.4;

  const minX = viewportW - mapW - marginW;
  const maxX = marginW;
  const minY = viewportH - mapH - marginH;
  const maxY = marginH;

  return {
    x: Math.max(minX, Math.min(maxX, cameraX)),
    y: Math.max(minY, Math.min(maxY, cameraY)),
  };
}

export class CameraController {
  private camera: Camera;
  private canvas: HTMLElement;
  private activePointers = new Map<number, Point>();
  private prevPinchDistance = 0;
  private prevMidpoint: Point = { x: 0, y: 0 };
  private pinchCooldownUntil = 0;
  private lastPanPoint: Point | null = null;
  private uiContainer: HTMLElement | null = null;

  constructor(camera: Camera, canvas: HTMLElement) {
    this.camera = camera;
    this.canvas = canvas;
    this.setupGestureLock();
    this.createZoomButtons();
  }

  private setupGestureLock(): void {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  }

  public handlePointerDown(e: PointerEvent): void {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values()) as [Point, Point];
      this.prevPinchDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.prevMidpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      this.lastPanPoint = null;
    } else if (this.activePointers.size === 1) {
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
    }
  }

  public handlePointerMove(e: PointerEvent): boolean {
    if (!this.activePointers.has(e.pointerId)) return false;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const now = performance.now();
    if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values()) as [Point, Point];
      const result = computeFocalPinchZoom({
        currentScale: this.camera.zoom,
        cameraX: this.camera.x,
        cameraY: this.camera.y,
        p1,
        p2,
        prevDistance: this.prevPinchDistance,
        prevMidpoint: this.prevMidpoint,
      });

      this.camera.zoom = result.newScale;
      this.camera.x = result.newCameraX;
      this.camera.y = result.newCameraY;
      this.prevPinchDistance = result.newDistance;
      this.prevMidpoint = result.newMidpoint;
      return true; // Pinch consumido
    }

    if (this.activePointers.size === 1 && now > this.pinchCooldownUntil && !this.camera.panLocked) {
      if (this.lastPanPoint) {
        const dx = e.clientX - this.lastPanPoint.x;
        const dy = e.clientY - this.lastPanPoint.y;
        this.camera.pan(dx, dy);
      }
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
    }

    return false;
  }

  public handlePointerUp(e: PointerEvent): void {
    const hadTwo = this.activePointers.size === 2;
    this.activePointers.delete(e.pointerId);

    if (hadTwo && this.activePointers.size === 1) {
      // Transição suave 2 -> 1 dedo: define cooldown e sincroniza o dedo restante
      this.pinchCooldownUntil = performance.now() + PINCH_COOLDOWN_MS;
      const remaining = Array.from(this.activePointers.values())[0]!;
      this.lastPanPoint = { x: remaining.x, y: remaining.y };
      this.prevPinchDistance = 0;
    } else if (this.activePointers.size === 0) {
      this.lastPanPoint = null;
      this.prevPinchDistance = 0;
    }
  }

  public isPinching(): boolean {
    return this.activePointers.size >= 2;
  }

  public getActivePointerCount(): number {
    return this.activePointers.size;
  }

  private createZoomButtons(): void {
    const existing = document.getElementById('camera-zoom-controls');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'camera-zoom-controls';
    container.className = 'fixed bottom-20 right-4 z-40 flex flex-col gap-2 select-none pointer-events-auto';

    const btnStyle = 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-center font-bold text-lg active:scale-95 transition-transform backdrop-blur-md';

    container.innerHTML = `
      <button id="btn-zoom-in" class="${btnStyle}" aria-label="Aumentar Zoom">➕</button>
      <button id="btn-zoom-out" class="${btnStyle}" aria-label="Diminuir Zoom">➖</button>
      <button id="btn-zoom-center" class="${btnStyle}" aria-label="Centralizar Hospital">🎯</button>
    `;

    document.body.appendChild(container);
    this.uiContainer = container;

    container.querySelector('#btn-zoom-in')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.camera.zoomAt(this.camera.viewportWidth / 2, this.camera.viewportHeight / 2, BUTTON_ZOOM_STEP);
    });

    container.querySelector('#btn-zoom-out')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.camera.zoomAt(this.camera.viewportWidth / 2, this.camera.viewportHeight / 2, 1 / BUTTON_ZOOM_STEP);
    });

    container.querySelector('#btn-zoom-center')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.camera.fitMapToScreen();
    });
  }

  public destroy(): void {
    this.uiContainer?.remove();
    this.activePointers.clear();
  }
}
