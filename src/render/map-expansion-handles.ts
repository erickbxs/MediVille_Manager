/**
 * Arquivo: src/render/map-expansion-handles.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza faixas tracejadas de loteamento e placas/botões interativos clicáveis nas 4 bordas externas da grade do hospital,
 * permitindo ao jogador expandir o terreno (12x12 -> 16x16 -> 20x20 -> 24x24) com apenas 1 clique direto no canvas PixiJS.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 17, tornando a expansão de terreno altamente visível e intuitiva tanto em touchscreens
 * quanto no mouse, eliminando a dependência de menus escondidos.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O cálculo das bordas usa gridSize e THEME.tileSize. A detecção de cliques usa eventMode = 'static' e repassa ao callback onExpand.
 *
 * Importa: pixi.js, src/render/theme-config.ts, src/systems/map-expansion-system.ts
 * Conecta-se com: src/render/renderer.ts, src/main.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import { THEME } from './theme-config';
import { getNextExpansion, type ExpansionTier } from '../systems/map-expansion-system';
import type { GameState } from '../state/game-state';

export interface MapExpansionHandlesCallbacks {
  onExpand: (tier: ExpansionTier) => void;
}

export class MapExpansionHandles {
  public container = new Container();
  private graphics = new Graphics();
  private textContainer = new Container();
  private callbacks: MapExpansionHandlesCallbacks;
  private currentTier: ExpansionTier | null = null;

  constructor(callbacks: MapExpansionHandlesCallbacks) {
    this.callbacks = callbacks;
    this.container.addChild(this.graphics);
    this.container.addChild(this.textContainer);
    this.graphics.eventMode = 'static';
    this.graphics.cursor = 'pointer';
    this.graphics.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.currentTier) {
        this.callbacks.onExpand(this.currentTier);
      }
    });
  }

  public update(state: GameState): void {
    this.graphics.clear();
    for (const child of this.textContainer.removeChildren()) child.destroy();

    const nextTier = getNextExpansion(state);
    this.currentTier = nextTier;
    if (!nextTier) return; // Limite máximo 24x24 já atingido

    const gridSize = state.gridSize ?? 12;
    const { tileSize } = THEME;
    const mapW = gridSize * tileSize;
    const mapH = gridSize * tileSize;

    this.drawLotBorders(mapW, mapH, nextTier.nextSize);
    this.drawExpansionPill(mapW, mapH, nextTier);
  }

  private drawLotBorders(w: number, h: number, nextSize: number): void {
    const { tileSize } = THEME;
    const addedPixels = (nextSize - (w / tileSize)) * tileSize;
    const offset = 4;

    // Faixa tracejada amarela/verde do novo loteamento
    this.graphics.rect(-offset, -offset, w + offset * 2 + addedPixels, h + offset * 2 + addedPixels)
      .stroke({ color: 0xfacc15, width: 2, alpha: 0.65 });

    // Cantoneiras estéticas de agrimensura
    const markerLen = 16;
    const right = w + addedPixels;
    const bottom = h + addedPixels;

    this.graphics.roundRect(right - markerLen, -offset - 4, markerLen + 8, markerLen + 8, 3)
      .fill({ color: 0x10b981, alpha: 0.85 });
    this.graphics.roundRect(right - markerLen, bottom - markerLen, markerLen + 8, markerLen + 8, 3)
      .fill({ color: 0x10b981, alpha: 0.85 });
    this.graphics.roundRect(-offset - 4, bottom - markerLen, markerLen + 8, markerLen + 8, 3)
      .fill({ color: 0x10b981, alpha: 0.85 });
  }

  private drawExpansionPill(w: number, h: number, tier: ExpansionTier): void {
    const pillW = 210;
    const pillH = 34;
    const pillX = w / 2 - pillW / 2;
    const pillY = h + 14;

    // Placa interativa 3D de expansão
    this.graphics.roundRect(pillX, pillY, pillW, pillH, 17)
      .fill({ color: 0x0f172a, alpha: 0.95 })
      .stroke({ color: 0x10b981, width: 2.5 });

    const costLabel = `R$ ${Math.round(tier.cost / 1000)}k`;
    const label = new Text({
      text: `➕ Expandir (+4x4) — ${costLabel}`,
      style: {
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xffffff,
        fontFamily: "'Fredoka', system-ui, sans-serif",
      },
      anchor: 0.5,
      x: pillX + pillW / 2,
      y: pillY + pillH / 2,
    });
    this.textContainer.addChild(label);
  }
}
