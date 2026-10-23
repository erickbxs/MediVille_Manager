/**
 * Arquivo: src/render/camera.ts
 * O que faz: Gerencia a visualização do mapa 2D com pan (arrastar), zoom suave (roda do mouse e gesto pinça) e conversão de coordenadas tela <-> grade.
 * Para que foi criado: Permitir navegação fluida em celulares e monitores de qualquer resolução.
 * Como modificar/debugar: Limites de zoom e velocidade são ajustáveis em src/data/theme.json.
 * Importa: src/render/theme-config.ts, src/core/config.ts
 * Conecta-se com: src/render/renderer.ts, src/input/canvas-input.ts
 */

import { BALANCE } from '../core/config';
import { THEME } from './theme-config';

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
    const nextZoom = Math.max(0.4, Math.min(2.5, prevZoom * factor));
    if (nextZoom === prevZoom) return;

    this.x = screenX - (screenX - this.x) * (nextZoom / prevZoom);
    this.y = screenY - (screenY - this.y) * (nextZoom / prevZoom);
    this.zoom = nextZoom;
  }

  public centerOnGrid(): void {
    const gridPxWidth = BALANCE.grid.cols * THEME.tileSize;
    const gridPxHeight = BALANCE.grid.rows * THEME.tileSize;

    const scaleX = (this.viewportWidth * 0.85) / gridPxWidth;
    const scaleY = (this.viewportHeight * 0.85) / gridPxHeight;
    this.zoom = Math.max(0.5, Math.min(1.4, Math.min(scaleX, scaleY)));

    this.x = (this.viewportWidth - gridPxWidth * this.zoom) / 2;
    this.y = (this.viewportHeight - gridPxHeight * this.zoom) / 2;
  }
}
