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
  gridCols?: number;
  gridRows?: number;
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
  const cols = options?.gridCols ?? BALANCE.grid.cols;
  const rows = options?.gridRows ?? BALANCE.grid.rows;
  const gridPxWidth = cols * THEME.tileSize;
  const gridPxHeight = rows * THEME.tileSize;

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

/**
 * Calcula o enquadramento ideal descontando a Top Bar de 48px e o Dock Inferior de 56px,
 * liberando mais de 82% da tela para visualização e toque direto do hospital.
 */
export function fitMapToViewport(
  viewportWidth: number,
  viewportHeight: number,
  options?: { topHeight?: number; bottomHeight?: number; sidePadding?: number; gridCols?: number; gridRows?: number }
): FitMapResult {
  return fitMapToScreen(viewportWidth, viewportHeight, {
    topMargin: options?.topHeight ?? 48,
    bottomMargin: options?.bottomHeight ?? 56,
    sidePadding: options?.sidePadding ?? 12,
    gridCols: options?.gridCols,
    gridRows: options?.gridRows,
  });
}

/** Zoom mínimo pelos botões ➖ (deixa ver o bairro ao redor do hospital). */
const MIN_BUTTON_ZOOM = 0.3;

/** Espaço acima/abaixo do lote para as placas do mapa não ficarem atrás das barras. */
const SIGN_CLEARANCE_PX = 48;

/**
 * Mede a altura real da barra do topo (HUD) e da barra inferior (dock) quando estão visíveis.
 * Antes o enquadramento usava 48 px fixos e as placas acima do lote ficavam atrás do HUD.
 */
function measureUiMargins(): { top?: number; bottom?: number } {
  if (typeof document === 'undefined') return {};
  const hud = document.getElementById('hud-container')?.getBoundingClientRect();
  const dock = document.getElementById('build-menu-container')?.getBoundingClientRect();
  return {
    top: hud && hud.bottom > 0 ? hud.bottom + SIGN_CLEARANCE_PX : undefined,
    bottom: dock && dock.height > 0 ? window.innerHeight - dock.top + SIGN_CLEARANCE_PX : undefined,
  };
}

export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1.0;
  public viewportWidth = 800;
  public viewportHeight = 600;
  public gridCols = BALANCE.grid.cols;
  public gridRows = BALANCE.grid.rows;
  public panLocked = false;

  public setGridSize(cols: number, rows = cols): void {
    this.gridCols = cols;
    this.gridRows = rows;
  }

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
    if (this.panLocked) return;
    this.x += dx;
    this.y += dy;
  }

  public zoomAt(screenX: number, screenY: number, factor: number): void {
    const prevZoom = this.zoom;
    const minLimit = Math.min(MIN_BUTTON_ZOOM, (this.viewportWidth / (this.gridCols * THEME.tileSize)) * 0.95);
    const nextZoom = Math.max(minLimit, Math.min(2.0, prevZoom * factor));
    if (nextZoom === prevZoom) return;

    this.x = screenX - (screenX - this.x) * (nextZoom / prevZoom);
    this.y = screenY - (screenY - this.y) * (nextZoom / prevZoom);
    this.zoom = nextZoom;
  }

  public fitMapToScreen(options?: FitMapOptions): FitMapResult {
    const ui = measureUiMargins();
    const result = fitMapToViewport(this.viewportWidth, this.viewportHeight, {
      topHeight: options?.topMargin ?? ui.top,
      bottomHeight: options?.bottomMargin ?? ui.bottom,
      sidePadding: options?.sidePadding,
      gridCols: options?.gridCols ?? this.gridCols,
      gridRows: options?.gridRows ?? this.gridRows,
    });
    this.zoom = result.scale;
    this.x = result.x;
    this.y = result.y;
    return result;
  }

  public centerOnGrid(): void {
    this.fitMapToScreen();
  }
}
