/**
 * Arquivo: src/render/ghost-view.ts
 * O que faz: Desenha a pré-visualização (fantasma) da sala durante a ação de construção/posicionamento na grade.
 * Para que foi criado: Dar feedback visual imediato (< 100ms) ao jogador se a posição pretendida é válida ou colide com outra sala.
 * Como modificar/debugar: Cores de validação (verde/vermelho) e transparência são definidas em src/data/theme.json.
 * Importa: pixi.js, src/core/config.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import type { RoomDefinition } from '../core/config';
import { THEME } from './theme-config';

export class GhostView {
  public container = new Container();
  private graphics = new Graphics();

  constructor() {
    this.container.addChild(this.graphics);
  }

  private drawHighlight(col: number, row: number, cols: number, rows: number, touchOffsetY: number, isValid: boolean): void {
    const { tileSize } = THEME;
    const margin = 1;
    const hX = (col - margin) * tileSize;
    const hY = (row - margin) * tileSize + touchOffsetY;
    const hW = (cols + margin * 2) * tileSize;
    const hH = (rows + margin * 2) * tileSize;
    const color = isValid ? 0x10b981 : 0xef4444;

    this.graphics.rect(hX, hY, hW, hH)
      .fill({ color, alpha: 0.08 })
      .stroke({ color, width: 1, alpha: 0.35 });
  }

  private drawInternalGrid(x: number, y: number, cols: number, rows: number, color: number): void {
    const { tileSize } = THEME;
    const width = cols * tileSize;
    const height = rows * tileSize;

    for (let c = 1; c < cols; c++) {
      this.graphics.moveTo(x + c * tileSize, y).lineTo(x + c * tileSize, y + height).stroke({ color, width: 1, alpha: 0.4 });
    }
    for (let r = 1; r < rows; r++) {
      this.graphics.moveTo(x, y + r * tileSize).lineTo(x + width, y + r * tileSize).stroke({ color, width: 1, alpha: 0.4 });
    }
  }

  public render(
    def: RoomDefinition | null,
    col: number,
    row: number,
    rotated: boolean,
    isValid: boolean,
    touchOffsetY = 0
  ): void {
    this.graphics.clear();
    if (!def || col < 0 || row < 0 || !Number.isFinite(col) || !Number.isFinite(row)) return;

    const { tileSize } = THEME;
    const roomCols = rotated ? def.height : def.width;
    const roomRows = rotated ? def.width : def.height;
    const x = col * tileSize;
    const y = row * tileSize + touchOffsetY;
    const mainColor = isValid ? 0x10b981 : 0xef4444;

    this.drawHighlight(col, row, roomCols, roomRows, touchOffsetY, isValid);

    this.graphics.roundRect(x, y, roomCols * tileSize, roomRows * tileSize, THEME.room.cornerRadius)
      .fill({ color: mainColor, alpha: 0.28 })
      .stroke({ color: mainColor, width: 3 });

    this.drawInternalGrid(x, y, roomCols, roomRows, mainColor);
  }

  public clear(): void {
    this.graphics.clear();
  }
}
