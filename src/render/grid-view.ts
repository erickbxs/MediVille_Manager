/**
 * Arquivo: src/render/grid-view.ts
 *
 * 1. O que este arquivo faz?
 * Desenha o terreno livre da grade 12x12 do hospital como uma laje de concreto limpa com quadrícula sutil,
 * borda extrudada do lote e marcação central, facilitando o modo construção.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Servir de base visual entre o entorno urbano (city-environment.ts) e as salas 2.5D (room-renderer-3d.ts).
 * É desenhado uma única vez (estático) para não custar nada por quadro.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste cores/espessuras em draw(). Se a grade não alinhar com os cliques, confira THEME.tileSize e
 * camera.screenToGrid().
 *
 * Importa: pixi.js, src/core/config.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import { BALANCE } from '../core/config';
import { THEME } from './theme-config';

export class GridView {
  public container = new Container();
  private graphics = new Graphics();

  constructor() {
    this.container.addChild(this.graphics);
    this.draw();
  }

  public draw(): void {
    const { cols, rows } = BALANCE.grid;
    const { tileSize } = THEME;
    const width = cols * tileSize;
    const height = rows * tileSize;
    const g = this.graphics;

    g.clear();
    g.rect(-20, -20, width + 40, height + 40).fill({ color: 0xd6d3d1 });
    g.rect(0, height, width, 5).fill({ color: 0x9ca3af });
    g.rect(0, 0, width, height).fill({ color: 0xeceae6 }).stroke({ color: 0xa8a29e, width: 2 });

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if ((c * 7 + r * 13) % 5 === 0) {
          g.rect(c * tileSize + 2, r * tileSize + 2, tileSize - 4, tileSize - 4).fill({ color: 0xe4e1dc, alpha: 0.8 });
        }
      }
    }
    for (let c = 1; c < cols; c++) {
      g.moveTo(c * tileSize, 0).lineTo(c * tileSize, height).stroke({ color: 0xd4d0ca, width: 1 });
    }
    for (let r = 1; r < rows; r++) {
      g.moveTo(0, r * tileSize).lineTo(width, r * tileSize).stroke({ color: 0xd4d0ca, width: 1 });
    }
  }
}
