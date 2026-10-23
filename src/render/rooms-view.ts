/**
 * Arquivo: src/render/rooms-view.ts
 * O que faz: Renderiza salas construídas no hospital com paredes espessas, profundidade 3D ortogonal, mobília interna vetorial e rótulos nítidos.
 * Para que foi criado: Transformar os gráficos do jogo em uma experiência visual caricata charmosa, rica em detalhes e profissional.
 * Como modificar/debugar: Ajuste mobílias em drawRoomFurniture() ou cores em src/data/theme.json.
 * Importa: pixi.js, src/entities/room.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import { THEME } from './theme-config';

const ROOM_NAMES_MAP: Record<string, string> = {
  reception: 'Recepção',
  waiting: 'Espera',
  consultation: 'Consultório',
  pharmacy: 'Farmácia',
  triage: 'Triagem',
  observation: 'Leitos Clínicos',
};

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
    const x = room.col * tileSize;
    const y = room.row * tileSize;
    const w = room.width * tileSize;
    const h = room.height * tileSize;
    const inset = 3;
    const wallThick = 5;

    // Sombra projetada no piso
    this.graphics.roundRect(x + inset + 2, y + inset + 4, w - inset * 2, h - inset * 2, 8)
      .fill({ color: 0x64748b, alpha: 0.22 });

    // Piso interno da sala com cor suave
    this.graphics.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2, 8)
      .fill({ color: room.definition.color, alpha: 0.35 });

    // Paredes externas com volume (borda espessa)
    this.graphics.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2, 8)
      .stroke({ color: room.definition.color, width: wallThick, alpha: 0.95 });

    // Porta de entrada indicada com capacho
    const doorW = 20;
    const doorX = x + w / 2 - doorW / 2;
    const doorY = y + h - inset - 2;
    this.graphics.rect(doorX, doorY, doorW, 4).fill({ color: 0x475569, alpha: 0.8 });

    // Mobília interna temática
    this.drawRoomFurniture(room, x + inset + wallThick, y + inset + wallThick, w - (inset + wallThick) * 2);

    if (isSelected) {
      this.graphics.roundRect(x + 1, y + 1, w - 2, h - 2, 10)
        .stroke({ color: 0x38bdf8, width: 3, alpha: 0.9 });
    }

    this.addRoomLabel(room, x + w / 2, y + 16);
  }

  private drawRoomFurniture(room: RoomInstance, rx: number, ry: number, rw: number): void {
    const type = room.definition.id;

    if (type === 'consultation') {
      // Mesa do médico com computador
      this.graphics.roundRect(rx + 4, ry + 16, 26, 14, 3).fill({ color: 0x94a3b8, alpha: 0.9 });
      this.graphics.rect(rx + 8, ry + 18, 10, 6).fill({ color: 0x334155 }); // monitor
      // Maca com travesseiro
      this.graphics.roundRect(rx + rw - 22, ry + 16, 18, 36, 4).fill({ color: 0xf1f5f9, alpha: 0.95 }).stroke({ color: 0x94a3b8, width: 1.5 });
      this.graphics.roundRect(rx + rw - 20, ry + 18, 14, 8, 2).fill({ color: 0x38bdf8, alpha: 0.6 }); // travesseiro
    } else if (type === 'reception') {
      // Balcão de atendimento
      this.graphics.roundRect(rx + 10, ry + 20, rw - 20, 12, 4).fill({ color: 0x64748b, alpha: 0.9 });
      this.graphics.rect(rx + rw / 2 - 6, ry + 22, 12, 7).fill({ color: 0x0284c7 }); // tela
    } else if (type === 'waiting') {
      // Cadeiras de espera em fileira
      const chairCount = 3;
      for (let i = 0; i < chairCount; i++) {
        const cx = rx + 8 + i * 22;
        this.graphics.roundRect(cx, ry + 24, 16, 16, 3).fill({ color: 0x6366f1, alpha: 0.75 });
      }
    } else if (type === 'pharmacy') {
      // Prateleiras de remédios
      this.graphics.rect(rx + 4, ry + 14, rw - 8, 8).fill({ color: 0xd97706, alpha: 0.8 });
      this.graphics.circle(rx + 12, ry + 18, 2.5).fill({ color: 0xef4444 });
      this.graphics.circle(rx + 22, ry + 18, 2.5).fill({ color: 0x10b981 });
      this.graphics.circle(rx + 32, ry + 18, 2.5).fill({ color: 0x3b82f6 });
    } else if (type === 'observation') {
      // Leito com grades hospitalares
      this.graphics.roundRect(rx + 8, ry + 18, 28, 44, 4).fill({ color: 0xffffff }).stroke({ color: 0x0891b2, width: 1.5 });
      this.graphics.roundRect(rx + 10, ry + 20, 24, 10, 2).fill({ color: 0x06b6d4, alpha: 0.5 });
    } else if (type === 'triage') {
      // Mesa com tensiômetro e prancheta
      this.graphics.roundRect(rx + 8, ry + 18, 24, 16, 3).fill({ color: 0xe2e8f0 });
      this.graphics.rect(rx + 12, ry + 22, 8, 8).fill({ color: 0xf97316, alpha: 0.8 });
    }
  }

  private addRoomLabel(room: RoomInstance, centerX: number, topY: number): void {
    const friendlyName = ROOM_NAMES_MAP[room.definition.id] || room.definition.id;
    const label = new Text({
      text: `${room.definition.icon} ${friendlyName}`,
      style: {
        fontFamily: THEME.fontFamily,
        fontSize: 10,
        fill: '#0f172a',
        align: 'center',
        fontWeight: 'bold',
      },
      anchor: { x: 0.5, y: 0 },
      x: centerX,
      y: topY,
    });
    this.textContainer.addChild(label);
  }
}
