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

  public render(
    def: RoomDefinition | null,
    col: number,
    row: number,
    rotated: boolean,
    isValid: boolean
  ): void {
    this.graphics.clear();
    if (!def || col < 0 || row < 0 || !Number.isFinite(col) || !Number.isFinite(row)) return;

    const { tileSize } = THEME;
    const width = (rotated ? def.height : def.width) * tileSize;
    const height = (rotated ? def.width : def.height) * tileSize;
    const x = col * tileSize;
    const y = row * tileSize;
    const color = isValid ? THEME.palettes.light.ghostValid : THEME.palettes.light.ghostInvalid;

    this.graphics.roundRect(x, y, width, height, THEME.room.cornerRadius)
      .fill({ color, alpha: THEME.ghost.alpha })
      .stroke({ color, width: THEME.ghost.borderWidth });
  }

  public clear(): void {
    this.graphics.clear();
  }
}
