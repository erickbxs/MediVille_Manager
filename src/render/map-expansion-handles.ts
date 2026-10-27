/**
 * Arquivo: src/render/map-expansion-handles.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza placas interativas táteis e discretas de expansão do terreno hospitalar exclusivamente na borda traseira (norte),
 * com perímetro e meio-fio limpos de pedra, sem traçado de linhas amarelas no chão e sem invadir a rua frontal.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 22, mantendo a ampliação do terreno intuitiva e despoluída visualmente, sem linhas amarelas no mapa.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O posicionamento da placa pill baseia-se em w e h da grade. A detecção de cliques usa eventMode = 'static' e repassa ao callback onExpand.
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

    // Borda limpa e natural sem traçado de linha amarela no perímetro
    this.drawExpansionPill(mapW, mapH, nextTier);
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
