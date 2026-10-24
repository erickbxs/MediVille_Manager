/**
 * Arquivo: src/render/room-layout.ts
 *
 * 1. O que este arquivo faz?
 * Calcula, de forma pura (sem PixiJS/DOM), a geometria das salas em pixels: retângulo, rotação (0°, 90°, 180°, 270°),
 * posição do vão da porta, waypoints da mobília e divisão de segmentos de parede ao redor do vão da porta.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Separar a matemática de layout da arquitetura 2.5D do desenho em si, permitindo testes unitários (Vitest)
 * da posição de portas e móveis ao girar salas, sem depender de WebGL.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Os móveis são definidos em FURNITURE_LAYOUTS em coordenadas normalizadas (u, v ∈ [0,1]) na orientação canônica
 * (porta ao sul). Se um móvel aparecer no lugar errado após girar, verifique rotateUnitPoint().
 *
 * Importa: src/entities/room.ts (tipo)
 * Conecta-se com: src/render/room-renderer-3d.ts, src/render/furniture-factory.ts, tests/render-3d.test.ts
 */

import type { RoomInstance } from '../entities/room';

export type RoomRotation = 0 | 90 | 180 | 270;
export type WallSide = 'south' | 'west' | 'north' | 'east';

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DoorPosition {
  x: number;
  y: number;
  side: WallSide;
}

export type FurnitureKind =
  | 'counterL' | 'totem' | 'susSign'
  | 'chairRow' | 'waterCooler' | 'plant' | 'wallTv'
  | 'desk' | 'officeChair' | 'examBed' | 'screen' | 'sink'
  | 'shelves' | 'dispenseCounter'
  | 'bpMonitor' | 'wardBed';

export interface FurnitureSlot {
  kind: FurnitureKind;
  u: number;
  v: number;
}

export interface FurnitureWaypoint {
  kind: FurnitureKind;
  x: number;
  y: number;
}

/** Layouts canônicos (porta ao sul). u = horizontal, v = vertical, normalizados no retângulo da sala. */
export const FURNITURE_LAYOUTS: Record<string, FurnitureSlot[]> = {
  reception: [
    { kind: 'susSign', u: 0.82, v: 0.26 },
    { kind: 'counterL', u: 0.45, v: 0.45 },
    { kind: 'totem', u: 0.14, v: 0.72 },
  ],
  waiting: [
    { kind: 'wallTv', u: 0.62, v: 0.2 },
    { kind: 'waterCooler', u: 0.88, v: 0.32 },
    { kind: 'chairRow', u: 0.38, v: 0.4 },
    { kind: 'chairRow', u: 0.38, v: 0.64 },
    { kind: 'plant', u: 0.88, v: 0.78 },
  ],
  consultation: [
    { kind: 'desk', u: 0.3, v: 0.4 },
    { kind: 'screen', u: 0.58, v: 0.62 },
    { kind: 'officeChair', u: 0.3, v: 0.6 },
    { kind: 'examBed', u: 0.8, v: 0.55 },
    { kind: 'sink', u: 0.13, v: 0.82 },
  ],
  pharmacy: [
    { kind: 'shelves', u: 0.5, v: 0.3 },
    { kind: 'dispenseCounter', u: 0.5, v: 0.72 },
  ],
  triage: [
    { kind: 'desk', u: 0.35, v: 0.42 },
    { kind: 'bpMonitor', u: 0.72, v: 0.42 },
    { kind: 'officeChair', u: 0.35, v: 0.64 },
  ],
  observation: [
    { kind: 'wardBed', u: 0.2, v: 0.5 },
    { kind: 'wardBed', u: 0.5, v: 0.5 },
    { kind: 'wardBed', u: 0.8, v: 0.5 },
  ],
};

/** O modelo de simulação atual guarda rotação binária; mapeamos para graus. */
export function rotationFromRoom(room: Pick<RoomInstance, 'rotated'>): RoomRotation {
  return room.rotated ? 90 : 0;
}

export function getRoomPixelRect(room: Pick<RoomInstance, 'col' | 'row' | 'width' | 'height'>, tileSize: number): PixelRect {
  return { x: room.col * tileSize, y: room.row * tileSize, w: room.width * tileSize, h: room.height * tileSize };
}

/** Gira um ponto normalizado no sentido horário em torno do centro da sala. */
export function rotateUnitPoint(u: number, v: number, rotation: RoomRotation): { u: number; v: number } {
  switch (rotation) {
    case 90: return { u: 1 - v, v: u };
    case 180: return { u: 1 - u, v: 1 - v };
    case 270: return { u: v, v: 1 - u };
    default: return { u, v };
  }
}

const SIDE_BY_ROTATION: Record<RoomRotation, WallSide> = { 0: 'south', 90: 'west', 180: 'north', 270: 'east' };

export function getDoorSide(rotation: RoomRotation): WallSide {
  return SIDE_BY_ROTATION[rotation];
}

export function getDoorPosition(rect: PixelRect, rotation: RoomRotation): DoorPosition {
  const p = rotateUnitPoint(0.5, 1, rotation);
  return { x: rect.x + p.u * rect.w, y: rect.y + p.v * rect.h, side: getDoorSide(rotation) };
}

export function getFurnitureWaypoints(typeId: string, rect: PixelRect, rotation: RoomRotation): FurnitureWaypoint[] {
  const slots = FURNITURE_LAYOUTS[typeId] ?? [];
  return slots.map((slot) => {
    const p = rotateUnitPoint(slot.u, slot.v, rotation);
    return { kind: slot.kind, x: rect.x + p.u * rect.w, y: rect.y + p.v * rect.h };
  });
}

/** Divide o intervalo [start, end] removendo o vão [gapCenter ± gapSize/2]. */
export function splitSpanAroundGap(start: number, end: number, gapCenter: number | null, gapSize: number): Array<[number, number]> {
  if (gapCenter === null) return [[start, end]];
  const a = Math.max(start, gapCenter - gapSize / 2);
  const b = Math.min(end, gapCenter + gapSize / 2);
  const parts: Array<[number, number]> = [];
  if (a > start) parts.push([start, a]);
  if (b < end) parts.push([b, end]);
  return parts;
}
