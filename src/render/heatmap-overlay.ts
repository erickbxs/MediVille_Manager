/**
 * Arquivo: src/render/heatmap-overlay.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a sobreposição gráfica do Mapa de Calor Administrativo (Heatmap Overlay) sobre as salas hospitalares
 * em 3 modos executivos (Fluxo & Lotação, Higiene & Biossegurança e Rentabilidade Financeira) e o efeito de Falta de Energia.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 4 do Prompt 24, permitindo ao gestor identificar gargalos clínicos, salas sujas e desempenho
 * econômico de cada setor diretamente na visualização 2.5D.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O ciclo de alternância está em cycleMode(). Paletas de cores e transparências são configuradas em HEATMAP_COLORS.
 *
 * Importa: pixi.js, src/entities/room.ts, src/state/game-state.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts, src/render/camera-controller.ts, src/main.ts
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import type { GameState } from '../state/game-state';
import { THEME } from './theme-config';

export type HeatmapMode = 'OFF' | 'OCCUPANCY' | 'HYGIENE' | 'REVENUE';

export const HEATMAP_COLORS = {
  free: 0x22c55e,
  busy: 0xf59e0b,
  bottleneck: 0xef4444,
  clean: 0x06b6d4,
  dirtyWarning: 0xf59e0b,
  dirtyCritical: 0xb45309,
  revenueHigh: 0x8b5cf6,
  revenueMedium: 0x10b981,
  revenueLow: 0x64748b,
  emergencyCrisis: 0x1e3a8a,
};

const ALPHA_OVERLAY = 0.45;
const ALPHA_CRITICAL = 0.60;
const ALPHA_CRISIS = 0.28;
const CORNER_RADIUS = 6;
const LABEL_FONT_SIZE = 11;

export function getOccupancyColor(occupants: number): number {
  if (occupants === 0) return 0x10b981;
  if (occupants <= 2) return 0xf59e0b;
  return 0xef4444;
}

export function getHygieneColor(hygiene: number): number {
  if (hygiene >= 80) return 0x10b981;
  if (hygiene >= 50) return 0xf59e0b;
  return 0xef4444;
}

export function getRevenueColor(revenue: number): number {
  if (revenue <= 0) return 0x64748b;
  if (revenue < 5000) return 0x38bdf8;
  return 0x10b981;
}

export class HeatmapOverlay {
  public container = new Container();
  private graphics = new Graphics();
  private labelContainer = new Container();
  public currentMode: HeatmapMode = 'OFF';

  constructor() {
    this.container.zIndex = 40;
    this.container.sortableChildren = true;
    this.container.addChild(this.graphics);
    this.container.addChild(this.labelContainer);
  }

  public getMode(): HeatmapMode {
    return this.currentMode;
  }

  public setMode(mode: HeatmapMode): void {
    this.currentMode = mode;
  }

  public cycleMode(): HeatmapMode {
    if (this.currentMode === 'OFF') this.currentMode = 'OCCUPANCY';
    else if (this.currentMode === 'OCCUPANCY') this.currentMode = 'HYGIENE';
    else if (this.currentMode === 'HYGIENE') this.currentMode = 'REVENUE';
    else this.currentMode = 'OFF';
    return this.currentMode;
  }

  public render(rooms: RoomInstance[], state: GameState, isPowerCrisis = false): void {
    this.graphics.clear();
    for (const child of this.labelContainer.removeChildren()) {
      child.destroy();
    }

    if (isPowerCrisis) {
      this.drawPowerCrisisEffect(state);
    }

    if (this.currentMode === 'OFF') return;

    for (const room of rooms) {
      this.drawRoomHeatmap(room);
    }
  }

  private drawPowerCrisisEffect(state: GameState): void {
    const size = (state.gridSize ?? 12) * THEME.tileSize;
    this.graphics.roundRect(0, 0, size, size, 0);
    this.graphics.fill({ color: HEATMAP_COLORS.emergencyCrisis, alpha: ALPHA_CRISIS });
  }

  private getRoomHeatmapStyle(room: RoomInstance): { color: number; alpha: number; labelText: string } {
    if (this.currentMode === 'OCCUPANCY') return this.getOccupancyStyle(room.occupantIds.length);
    if (this.currentMode === 'HYGIENE') return this.getHygieneStyle(room.hygiene ?? 100);
    if (this.currentMode === 'REVENUE') return this.getRevenueStyle(room);
    return { color: HEATMAP_COLORS.free, alpha: ALPHA_OVERLAY, labelText: '' };
  }

  private getOccupancyStyle(occupants: number): { color: number; alpha: number; labelText: string } {
    if (occupants === 0) return { color: HEATMAP_COLORS.free, alpha: ALPHA_OVERLAY, labelText: 'Livre' };
    if (occupants === 1) return { color: HEATMAP_COLORS.busy, alpha: ALPHA_OVERLAY, labelText: 'Ocupado' };
    return { color: HEATMAP_COLORS.bottleneck, alpha: ALPHA_CRITICAL, labelText: 'Gargalo!' };
  }

  private getHygieneStyle(hygiene: number): { color: number; alpha: number; labelText: string } {
    if (hygiene >= 80) return { color: HEATMAP_COLORS.clean, alpha: ALPHA_OVERLAY, labelText: `${hygiene}% Limpo` };
    if (hygiene >= 50) return { color: HEATMAP_COLORS.dirtyWarning, alpha: ALPHA_OVERLAY, labelText: `${hygiene}% Atenção` };
    return { color: HEATMAP_COLORS.dirtyCritical, alpha: ALPHA_CRITICAL, labelText: `${hygiene}% Sujo!` };
  }

  private getRevenueStyle(room: RoomInstance): { color: number; alpha: number; labelText: string } {
    const role = room.definition.role;
    if (role === 'treatment' || room.typeId === 'laboratory' || room.typeId === 'xray') {
      return { color: HEATMAP_COLORS.revenueHigh, alpha: ALPHA_OVERLAY, labelText: 'Alta Rentab.' };
    }
    if (role === 'dispense' || role === 'entry') {
      return { color: HEATMAP_COLORS.revenueMedium, alpha: ALPHA_OVERLAY, labelText: 'Média Rentab.' };
    }
    return { color: HEATMAP_COLORS.revenueLow, alpha: ALPHA_OVERLAY, labelText: 'Apoio' };
  }

  private drawRoomHeatmap(room: RoomInstance): void {
    const x = room.col * THEME.tileSize;
    const y = room.row * THEME.tileSize;
    const w = room.width * THEME.tileSize;
    const h = room.height * THEME.tileSize;

    const { color, alpha, labelText } = this.getRoomHeatmapStyle(room);

    this.graphics.roundRect(x + 2, y + 2, w - 4, h - 4, CORNER_RADIUS);
    this.graphics.fill({ color, alpha });

    if (labelText) {
      this.drawBadgeText(labelText, x + w / 2, y + h / 2);
    }
  }

  private drawBadgeText(textStr: string, centerX: number, centerY: number): void {
    const style = new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: LABEL_FONT_SIZE,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x0f172a, width: 3 },
      align: 'center',
    });
    const label = new Text({ text: textStr, style });
    label.anchor.set(0.5, 0.5);
    label.position.set(centerX, centerY);
    this.labelContainer.addChild(label);
  }
}
