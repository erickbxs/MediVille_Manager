/**
 * Arquivo: src/render/camera.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a câmera de visualização do hospital (pan, zoom suave de 0.6 a 1.8 e auto-fit responsivo),
 * calculando posições e escalas para que a grade 12x12 nunca fique cortada pelo HUD em celulares (360px-430px) ou monitores.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir experiência fluida e sem cortes tanto no mobile quanto no desktop, fornecendo a função matemática fitMapToScreen e suporte a toque.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para testar cálculos de auto-fit em diferentes resoluções, use a suíte de testes em tests/cases-and-mobile.test.ts.
 *
 * Importa: src/render/theme-config.ts, src/core/config.ts
 * Conecta-se com: src/render/renderer.ts, src/input/canvas-input.ts, src/main.ts
 */

import { BALANCE } from '../core/config';
import { THEME } from './theme-config';

export interface FitMapOptions {
  topMargin?: number;
  bottomMargin?: number;
  sidePadding?: number;
}

export interface FitMapResult {
  scale: number;
  zoom: number;
  x: number;
  y: number;
}

/**
 * Calcula a escala e o posicionamento ideal do mapa hospitalar para caber
 * perfeitamente na tela, descontando o espaço ocupado pelo HUD superior e barra de construção inferior.
 */
export function fitMapToScreen(
  viewportWidth: number,
  viewportHeight: number,
  options?: FitMapOptions
): FitMapResult {
  const gridPxWidth = BALANCE.grid.cols * THEME.tileSize;
  const gridPxHeight = BALANCE.grid.rows * THEME.tileSize;

  const topMargin = options?.topMargin ?? 64;
  const bottomMargin = options?.bottomMargin ?? 84;
  const sidePadding = options?.sidePadding ?? 16;

  const usableWidth = Math.max(100, viewportWidth - sidePadding * 2);
  const usableHeight = Math.max(100, viewportHeight - topMargin - bottomMargin);

  const scaleX = usableWidth / gridPxWidth;
  const scaleY = usableHeight / gridPxHeight;
  const rawScale = Math.min(scaleX, scaleY);

  const scale = Number.isFinite(rawScale) && rawScale > 0 ? Math.max(0.2, rawScale) : 0.8;
  const x = (viewportWidth - gridPxWidth * scale) / 2;
  const y = topMargin + (usableHeight - gridPxHeight * scale) / 2;

  return {
    scale,
    zoom: scale,
    x,
    y,
  };
}

export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1.0;
  public viewportWidth = 800;
  public viewportHeight = 600;

  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.x) / this.zoom,
      y: (screenY - this.y) / this.zoom,
    };
  }

  public screenToGrid(screenX: number, screenY: number): { col: number; row: number } {
    const world = this.screenToWorld(screenX, screenY);
    const col = Math.floor(world.x / THEME.tileSize);
    const row = Math.floor(world.y / THEME.tileSize);
    return { col, row };
  }

  public gridToScreen(col: number, row: number): { x: number; y: number } {
    return {
      x: this.x + col * THEME.tileSize * this.zoom,
      y: this.y + row * THEME.tileSize * this.zoom,
    };
  }

  public pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public zoomAt(screenX: number, screenY: number, factor: number): void {
    const prevZoom = this.zoom;
    const minLimit = Math.min(0.6, (this.viewportWidth / (BALANCE.grid.cols * THEME.tileSize)) * 0.95);
    const nextZoom = Math.max(minLimit, Math.min(1.8, prevZoom * factor));
    if (nextZoom === prevZoom) return;

    this.x = screenX - (screenX - this.x) * (nextZoom / prevZoom);
    this.y = screenY - (screenY - this.y) * (nextZoom / prevZoom);
    this.zoom = nextZoom;
  }

  public fitMapToScreen(options?: FitMapOptions): FitMapResult {
    const result = fitMapToScreen(this.viewportWidth, this.viewportHeight, options);
    this.zoom = result.scale;
    this.x = result.x;
    this.y = result.y;
    return result;
  }

  public centerOnGrid(): void {
    this.fitMapToScreen();
  }
}
