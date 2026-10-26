/**
 * Arquivo: src/render/map-expansion-handles.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a sinalização de agrimensura e placas interativas táteis de expansão do terreno hospitalar
 * exclusivamente nas bordas traseira (norte) e laterais (leste/oeste), sem invadir ou sobrepor a rua frontal.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 21, garantindo que o jogador expanda o hospital intuitivamente para trás e lados
 * com 1 clique direto no canvas PixiJS, sem nunca colocar placas na avenida principal.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O posicionamento das placas baseia-se em w e h da grade. A detecção de cliques usa eventMode = 'static'
 * e repassa ao callback onExpand.
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
    const lateralShift = addedPixels / 2;
    const offset = 4;

    // Faixa tracejada amarela/verde do novo loteamento expandindo PARA TRÁS (topo, y < 0) e LATERAIS
    this.graphics.rect(-lateralShift - offset, -addedPixels - offset, w + addedPixels + offset * 2, h + addedPixels + offset * 2)
      .stroke({ color: 0xfacc15, width: 2, alpha: 0.65 });

    // Cantoneiras estéticas de agrimensura no topo e laterais
    const markerLen = 16;
    const left = -lateralShift - offset;
    const right = w + lateralShift + offset;
    const top = -addedPixels - offset;

    this.graphics.roundRect(left - 4, top - 4, markerLen + 8, markerLen + 8, 3)
      .fill({ color: 0x10b981, alpha: 0.85 });
    this.graphics.roundRect(right - markerLen, top - 4, markerLen + 8, markerLen + 8, 3)
      .fill({ color: 0x10b981, alpha: 0.85 });
  }

  private drawExpansionPill(w: number, _h: number, tier: ExpansionTier): void {
    const pillW = 230;
    const pillH = 34;
    // Borda Traseira (Norte, acima de y = 0) - NUNCA na frente/sul da rua
    const pillX = w / 2 - pillW / 2;
    const pillY = -44;

    // Placa interativa 3D de expansão posicionada no fundo do terreno
    this.graphics.roundRect(pillX, pillY, pillW, pillH, 17)
      .fill({ color: 0x0f172a, alpha: 0.95 })
      .stroke({ color: 0x10b981, width: 2.5 });

    const costLabel = `R$ ${Math.round(tier.cost / 1000)}k`;
    const label = new Text({
      text: `➕ Expandir Lote (+4x4) — ${costLabel}`,
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
