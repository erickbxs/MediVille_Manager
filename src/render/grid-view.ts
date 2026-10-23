/**
 * Arquivo: src/render/grid-view.ts
 * O que faz: Desenha a grade base do hospital (células 12x12) utilizando a API de Graphics do PixiJS.
 * Para que foi criado: Fornecer a referência visual do terreno para o jogador posicionar e organizar as salas.
 * Como modificar/debugar: Altere a espessura de linha ou cores em src/data/theme.json.
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
    const palette = THEME.palettes.light;

    this.graphics.clear();
    this.graphics.roundRect(0, 0, width, height, THEME.grid.cornerRadius)
      .fill({ color: palette.gridFill, alpha: 0.95 })
      .stroke({ color: palette.gridLine, width: THEME.grid.lineWidth });

    for (let c = 1; c < cols; c++) {
      const x = c * tileSize;
      this.graphics.moveTo(x, 0).lineTo(x, height).stroke({ color: palette.gridLine, width: 1, alpha: 0.6 });
    }

    for (let r = 1; r < rows; r++) {
      const y = r * tileSize;
      this.graphics.moveTo(0, y).lineTo(width, y).stroke({ color: palette.gridLine, width: 1, alpha: 0.6 });
    }
  }
}
