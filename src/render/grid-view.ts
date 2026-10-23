/**
 * Arquivo: src/render/grid-view.ts
 * O que faz: Desenha a grade e o piso hospitalar estilizado com padrão de ladrilhos claros, calçada externa e marcação de piso em PixiJS.
 * Para que foi criado: Elevar a qualidade gráfica do MediVille Manager para visual profissional e atraente.
 * Como modificar/debugar: Ajuste as cores ou dimensões dos ladrilhos em drawTiles().
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
    const margin = 20;

    this.graphics.clear();
    this.graphics.roundRect(-margin, -margin, width + margin * 2, height + margin * 2, 24)
      .fill({ color: 0xe2e8f0, alpha: 0.85 });
    this.graphics.roundRect(0, 4, width, height, THEME.grid.cornerRadius)
      .fill({ color: 0x94a3b8, alpha: 0.35 });
    this.graphics.roundRect(0, 0, width, height, THEME.grid.cornerRadius)
      .fill({ color: 0xf8fafc, alpha: 1 })
      .stroke({ color: 0xcfd8dc, width: 2.5 });

    this.drawTiles(cols, rows, tileSize);
    this.drawGridLines(cols, rows, tileSize, width, height);
    this.drawCentralEmblem(cols, rows, tileSize);
  }

  private drawTiles(cols: number, rows: number, tileSize: number): void {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * tileSize;
        const y = r * tileSize;
        const isAlternate = (c + r) % 2 === 0;
        const tileColor = isAlternate ? 0xffffff : 0xf1f5f9;
        this.graphics.rect(x + 1, y + 1, tileSize - 2, tileSize - 2)
          .fill({ color: tileColor, alpha: 0.7 });
      }
    }
  }

  private drawGridLines(cols: number, rows: number, tileSize: number, width: number, height: number): void {
    for (let c = 1; c < cols; c++) {
      const x = c * tileSize;
      this.graphics.moveTo(x, 0).lineTo(x, height).stroke({ color: 0xe2e8f0, width: 1, alpha: 0.8 });
    }
    for (let r = 1; r < rows; r++) {
      const y = r * tileSize;
      this.graphics.moveTo(0, y).lineTo(width, y).stroke({ color: 0xe2e8f0, width: 1, alpha: 0.8 });
    }
  }

  private drawCentralEmblem(cols: number, rows: number, tileSize: number): void {
    const midX = (cols / 2) * tileSize;
    const midY = (rows / 2) * tileSize;
    const arm = 16;
    const thick = 6;
    this.graphics.rect(midX - thick / 2, midY - arm, thick, arm * 2).fill({ color: 0x38bdf8, alpha: 0.25 });
    this.graphics.rect(midX - arm, midY - thick / 2, arm * 2, thick).fill({ color: 0x38bdf8, alpha: 0.25 });
  }
}

