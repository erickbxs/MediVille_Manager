/**
 * Arquivo: src/render/rooms-view.ts
 * O que faz: Renderiza todas as salas construídas no hospital, incluindo bordas estilizadas, ícones, rótulos e capacidade.
 * Para que foi criado: Apresentar visualmente o hospital construído de forma caricata, limpa e responsiva.
 * Como modificar/debugar: Ajuste fontes, recuos e espessuras em src/data/theme.json.
 * Importa: pixi.js, src/entities/room.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import { THEME } from './theme-config';

export class RoomsView {
  public container = new Container();
  private graphics = new Graphics();
  private textContainer = new Container();

  constructor() {
    this.container.addChild(this.graphics);
    this.container.addChild(this.textContainer);
  }

  public render(rooms: RoomInstance[], selectedRoomId: string | null): void {
    this.graphics.clear();
    this.textContainer.removeChildren();

    for (const room of rooms) {
      this.drawRoom(room, room.id === selectedRoomId);
    }
  }

  private drawRoom(room: RoomInstance, isSelected: boolean): void {
    const { tileSize } = THEME;
    const x = room.col * tileSize + THEME.room.inset;
    const y = room.row * tileSize + THEME.room.inset;
    const w = room.width * tileSize - THEME.room.inset * 2;
    const h = room.height * tileSize - THEME.room.inset * 2;

    this.graphics.roundRect(x, y, w, h, THEME.room.cornerRadius)
      .fill({ color: room.definition.color, alpha: THEME.room.fillAlpha })
      .stroke({ color: room.definition.color, width: THEME.room.borderWidth });

    if (isSelected) {
      this.graphics.roundRect(x - 2, y - 2, w + 4, h + 4, THEME.room.cornerRadius + 2)
        .stroke({ color: 0x0ea5e9, width: THEME.room.selectionWidth });
    }

    this.addRoomLabel(room, x + w / 2, y + h / 2);
  }

  private addRoomLabel(room: RoomInstance, centerX: number, centerY: number): void {
    const label = new Text({
      text: `${room.definition.icon}\n${room.definition.nameKey.replace('room.', '')}`,
      style: {
        fontFamily: THEME.fontFamily,
        fontSize: THEME.room.labelFontSize,
        fill: THEME.palettes.light.text,
        align: 'center',
        fontWeight: 'bold',
      },
      anchor: 0.5,
      x: centerX,
      y: centerY,
    });
    this.textContainer.addChild(label);
  }
}
