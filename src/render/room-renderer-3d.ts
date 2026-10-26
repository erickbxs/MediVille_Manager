/**
 * Arquivo: src/render/room-renderer-3d.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza salas hospitalares como arquitetura 2.5D em corte (estilo Two Point Hospital / Theme Hospital):
 * pisos texturizados por setor clínico com oclusão ambiental (AO) no encontro das paredes e móveis,
 * paredes extrudadas em corte, batentes de porta, etiquetas com nomes curtos simplificados e reatividade instantânea ao i18n.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 e Parte 3 do Prompt 15, garantindo que as etiquetas sobre as salas no mapa usem exclusivamente
 * nomes curtos de 1 palavra e atualizem instantaneamente quando o idioma mudar, com iluminação e oclusão ambiental.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para calibrar pisos e cores, veja FLOOR_STYLES. A criação da etiqueta ocorre em createLabel() com getRoomShortName().
 *
 * Importa: pixi.js, src/entities/room.ts, src/render/theme-config.ts, src/render/voxel.ts,
 *          src/render/room-layout.ts, src/render/furniture-factory.ts, src/render/render-cache.ts,
 *          src/render/environment-state.ts, src/i18n/i18n.ts, src/core/event-bus.ts
 * Conecta-se com: src/render/renderer.ts, src/main.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import { THEME } from './theme-config';
import { hexToNumber, shadeColor } from './voxel';
import {
  getDoorPosition, getFurnitureWaypoints, getRoomPixelRect, rotationFromRoom, splitSpanAroundGap,
  type DoorPosition, type PixelRect,
} from './room-layout';
import { drawFurniture } from './furniture-factory';
import { DisplayCache } from './render-cache';
import { getShelfBoxCount } from './environment-state';
import { getRoomShortName } from '../i18n/i18n';
import { globalBus } from '../core/event-bus';

const WALL_T = 5;
const WALL_H = 13;
const FRONT_T = 4;
const DOOR_GAP = 24;
const SHELF_SIGNATURE_STEPS = 12;
const WALL_CAP = 0xf8fafc;

interface FloorStyle { base: number; line: number; tile: number }

const FLOOR_STYLES: Record<string, FloorStyle> = {
  reception: { base: 0xf1f5f9, line: 0xe2e8f0, tile: 24 },
  waiting: { base: 0xfdebd0, line: 0xf5d6a8, tile: 16 },
  consultation: { base: 0xecfeff, line: 0xcffafe, tile: 24 },
  pharmacy: { base: 0xe5e7eb, line: 0xd1d5db, tile: 12 },
  triage: { base: 0xfff1e6, line: 0xfde0c5, tile: 16 },
  observation: { base: 0xe0f7fa, line: 0xc4eef3, tile: 24 },
  vaccination: { base: 0xecfdf5, line: 0xa7f3d0, tile: 20 },
  laboratory: { base: 0xf5f3ff, line: 0xddd6fe, tile: 24 },
  xray: { base: 0x334155, line: 0x1e293b, tile: 24 },
  surgery: { base: 0xccfbf1, line: 0x99f6e4, tile: 20 },
  icu: { base: 0xffedd5, line: 0xfed7aa, tile: 20 },
  staff_room: { base: 0xfef3c7, line: 0xfde68a, tile: 20 },
  wound_care: { base: 0xf0fdfa, line: 0xccfbf1, tile: 16 },
  dental: { base: 0xf0f9ff, line: 0xbae6fd, tile: 20 },
  medication_room: { base: 0xeff6ff, line: 0xbfdbfe, tile: 20 },
  emergency_room: { base: 0xfef2f2, line: 0xfecaca, tile: 20 },
  maternity: { base: 0xfff1f2, line: 0xfecdd3, tile: 24 },
  trauma_center: { base: 0xfee2e2, line: 0xfca5a5, tile: 20 },
  blood_bank: { base: 0xfdf2f8, line: 0xfbcfe8, tile: 16 },
  helipad: { base: 0x1e293b, line: 0x0f172a, tile: 32 },
};

function drawFloorTiles(g: Graphics, r: PixelRect, style: FloorStyle): void {
  g.rect(r.x, r.y, r.w, r.h).fill({ color: style.base });
  for (let x = r.x + style.tile; x < r.x + r.w; x += style.tile) {
    g.moveTo(x, r.y).lineTo(x, r.y + r.h).stroke({ color: style.line, width: 1 });
  }
  for (let y = r.y + style.tile; y < r.y + r.h; y += style.tile) {
    g.moveTo(r.x, y).lineTo(r.x + r.w, y).stroke({ color: style.line, width: 1 });
  }

  // Oclusão ambiental (Ambient Occlusion) suave sob paredes
  g.rect(r.x + WALL_T, r.y + WALL_T + WALL_H - 2, r.w - WALL_T * 2, 4).fill({ color: 0x0f172a, alpha: 0.16 });
  g.rect(r.x + WALL_T, r.y + WALL_T + WALL_H, 4, r.h - WALL_T * 2 - WALL_H).fill({ color: 0x0f172a, alpha: 0.12 });
  g.rect(r.x + r.w - WALL_T - 4, r.y + WALL_T + WALL_H, 4, r.h - WALL_T * 2 - WALL_H).fill({ color: 0x0f172a, alpha: 0.12 });
}

function drawFloorDetails(g: Graphics, typeId: string, r: PixelRect, door: DoorPosition): void {
  if (typeId === 'reception') {
    g.roundRect(door.x - 14, door.y - 9, 28, 18, 3).fill({ color: 0x1d4ed8, alpha: 0.85 });
    g.rect(door.x - 1.5, door.y - 6, 3, 12).fill({ color: 0xffffff });
    g.rect(door.x - 6, door.y - 1.5, 12, 3).fill({ color: 0xffffff });
  } else if (typeId === 'waiting') {
    g.roundRect(r.x + r.w * 0.1, r.y + r.h * 0.3, r.w * 0.6, r.h * 0.45, 6)
      .stroke({ color: 0xd97706, width: 1.5, alpha: 0.45 });
  } else if (typeId === 'consultation') {
    g.poly([r.x + r.w * 0.3, r.y, r.x + r.w * 0.5, r.y, r.x + r.w * 0.25, r.y + r.h, r.x + r.w * 0.05, r.y + r.h])
      .fill({ color: 0xffffff, alpha: 0.35 });
  } else if (typeId === 'pharmacy') {
    g.rect(r.x, r.y + r.h * 0.6, r.w, 6).fill({ color: 0x3b82f6, alpha: 0.75 });
  } else if (typeId === 'helipad') {
    g.circle(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.35).stroke({ color: 0xfacc15, width: 3 });
    g.rect(r.x + r.w / 2 - 10, r.y + r.h / 2 - 14, 4, 28).fill({ color: 0xfacc15 });
    g.rect(r.x + r.w / 2 + 6, r.y + r.h / 2 - 14, 4, 28).fill({ color: 0xfacc15 });
    g.rect(r.x + r.w / 2 - 10, r.y + r.h / 2 - 2, 20, 4).fill({ color: 0xfacc15 });
  }
}

function drawHorizontalWall(g: Graphics, spans: Array<[number, number]>, y: number, inner: number, isBack: boolean): void {
  for (const [a, b] of spans) {
    if (isBack) {
      g.rect(a, y + WALL_T, b - a, WALL_H).fill({ color: inner });
      g.rect(a, y + WALL_T + WALL_H - 3, b - a, 3).fill({ color: shadeColor(inner, 0.7) });
      g.rect(a, y, b - a, WALL_T).fill({ color: WALL_CAP }).stroke({ color: 0x94a3b8, width: 0.8 });
      // Reflexo translúcido de vidro clínico
      g.poly([a + 4, y + WALL_T + 2, a + 12, y + WALL_T + 2, a + 8, y + WALL_T + WALL_H - 2, a, y + WALL_T + WALL_H - 2])
        .fill({ color: 0xffffff, alpha: 0.18 });
    } else {
      g.rect(a, y - FRONT_T, b - a, FRONT_T).fill({ color: WALL_CAP }).stroke({ color: 0x94a3b8, width: 0.8 });
      g.rect(a, y - 1.5, b - a, 1.5).fill({ color: shadeColor(inner, 0.55) });
    }
  }
}

function drawVerticalWall(g: Graphics, spans: Array<[number, number]>, x: number, inner: number, isLeft: boolean): void {
  for (const [a, b] of spans) {
    const wx = isLeft ? x : x - WALL_T;
    g.rect(wx, a, WALL_T, b - a).fill({ color: WALL_CAP }).stroke({ color: 0x94a3b8, width: 0.8 });
    g.rect(isLeft ? x + WALL_T : x - WALL_T - 2, a, 2, b - a).fill({ color: shadeColor(inner, 0.8), alpha: 0.8 });
  }
}

function drawDoorFrame(g: Graphics, door: DoorPosition): void {
  const half = DOOR_GAP / 2;
  const horizontal = door.side === 'south' || door.side === 'north';
  const posts = horizontal
    ? [[door.x - half - 2, door.y], [door.x + half - 1, door.y]]
    : [[door.x, door.y - half - 2], [door.x, door.y + half - 1]];
  for (const [px, py] of posts) {
    const w = horizontal ? 3 : WALL_T + 1;
    const h = horizontal ? WALL_T + 2 : 3;
    g.rect(px! - (horizontal ? 0 : w / 2), py! - (horizontal ? h / 2 : 0), w, h).fill({ color: 0x64748b });
  }
}

function drawWalls(g: Graphics, r: PixelRect, door: DoorPosition, color: number): void {
  const inner = shadeColor(color, 1.45);
  const gapFor = (side: DoorPosition['side'], center: number): number | null => (door.side === side ? center : null);
  drawHorizontalWall(g, splitSpanAroundGap(r.x, r.x + r.w, gapFor('north', door.x), DOOR_GAP), r.y, inner, true);
  drawVerticalWall(g, splitSpanAroundGap(r.y, r.y + r.h, gapFor('west', door.y), DOOR_GAP), r.x, inner, true);
  drawVerticalWall(g, splitSpanAroundGap(r.y, r.y + r.h, gapFor('east', door.y), DOOR_GAP), r.x + r.w, inner, false);
  drawHorizontalWall(g, splitSpanAroundGap(r.x, r.x + r.w, gapFor('south', door.x), DOOR_GAP), r.y + r.h, inner, false);
  drawDoorFrame(g, door);
}

function createLabel(room: RoomInstance, r: PixelRect): Text {
  const shortName = getRoomShortName(room.definition.id);
  const label = new Text({
    text: `${room.definition.icon} ${shortName}`,
    style: { fontFamily: THEME.fontFamily, fontSize: 10, fill: '#0f172a', fontWeight: 'bold', align: 'center' },
    anchor: { x: 0.5, y: 0 },
    x: r.x + r.w / 2,
    y: r.y + WALL_T + 2,
    resolution: THEME.textResolution,
  });
  return label;
}

export class RoomRenderer3D {
  public container = new Container();
  private cache = new DisplayCache<Container>();
  private selection = new Graphics();

  constructor() {
    this.container.sortableChildren = true;
    this.selection.zIndex = Number.MAX_SAFE_INTEGER;
    this.container.addChild(this.selection);
    this.setupI18nSubscription();
  }

  private setupI18nSubscription(): void {
    globalBus.on('i18n:changed', () => {
      this.clearCache();
    });
  }

  public clearCache(): void {
    this.cache.prune(new Set(), (old) => this.container.removeChild(old));
  }

  public static buildSignature(room: RoomInstance, stockRatio: number): string {
    const shelf = room.definition.id === 'pharmacy' ? getShelfBoxCount(stockRatio, SHELF_SIGNATURE_STEPS) : 0;
    return `${room.typeId}|${room.col},${room.row}|${room.width}x${room.height}|${room.rotated ? 1 : 0}|${shelf}`;
  }

  public render(rooms: RoomInstance[], selectedRoomId: string | null, stockRatio: number): void {
    const active = new Set<string>();
    for (const room of rooms) {
      active.add(room.id);
      const sig = RoomRenderer3D.buildSignature(room, stockRatio);
      const { value, created } = this.cache.getOrCreate(room.id, sig, () => this.buildRoom(room, stockRatio), (old) => this.container.removeChild(old));
      if (created) this.container.addChild(value);
    }
    this.cache.prune(active, (old) => this.container.removeChild(old));
    this.drawSelection(rooms.find((r) => r.id === selectedRoomId) ?? null);
  }

  private buildRoom(room: RoomInstance, stockRatio: number): Container {
    const root = new Container();
    const g = new Graphics();
    const r = getRoomPixelRect(room, THEME.tileSize);
    const rotation = rotationFromRoom(room);
    const door = getDoorPosition(r, rotation);
    const style = FLOOR_STYLES[room.definition.id] ?? { base: 0xf8fafc, line: 0xe2e8f0, tile: 24 };

    // Sombra de contato suave externa (Ambient Occlusion)
    g.roundRect(r.x + 2, r.y + 3, r.w, r.h, 4).fill({ color: 0x0f172a, alpha: 0.14 });
    g.roundRect(r.x + 4, r.y + 6, r.w - 2, r.h - 2, 6).fill({ color: 0x0f172a, alpha: 0.08 });
    drawFloorTiles(g, r, style);
    drawFloorDetails(g, room.definition.id, r, door);
    drawWalls(g, r, door, hexToNumber(room.definition.color));
    drawFurniture(g, getFurnitureWaypoints(room.definition.id, r, rotation), { stockRatio, timeSeed: Date.now() });

    root.addChild(g);
    root.addChild(createLabel(room, r));
    root.zIndex = r.y + r.h;
    return root;
  }

  private drawSelection(room: RoomInstance | null): void {
    this.selection.clear();
    if (!room) return;
    const r = getRoomPixelRect(room, THEME.tileSize);
    this.selection.roundRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 6).stroke({ color: 0x38bdf8, width: 3, alpha: 0.95 });
  }
}
