/**
 * Arquivo: src/entities/room.ts
 * O que faz: Representa uma sala construída na grade hospitalar com posição, dimensões, ocupação e metadados.
 * Para que foi criado: Permitir o rastreamento individual de salas como componentes de entidade na simulação.
 * Como modificar/debugar: Caso precise de novas propriedades de sala (ex: nível de melhoria), adicione aqui e atualize rooms.json.
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/grid-system.ts, src/state/game-state.ts, src/render/rooms-view.ts
 */

import type { RoomDefinition } from '../core/config';

export interface RoomInstance {
  id: string;
  typeId: string;
  col: number;
  row: number;
  width: number;
  height: number;
  rotated: boolean;
  definition: RoomDefinition;
  occupantIds: string[];
}

export function createRoomInstance(
  id: string,
  definition: RoomDefinition,
  col: number,
  row: number,
  rotated = false
): RoomInstance {
  const width = rotated ? definition.height : definition.width;
  const height = rotated ? definition.width : definition.height;

  return {
    id,
    typeId: definition.id,
    col,
    row,
    width,
    height,
    rotated,
    definition,
    occupantIds: [],
  };
}

export function isRoomOccupied(room: RoomInstance): boolean {
  return room.occupantIds.length >= room.definition.capacity;
}

export function addOccupant(room: RoomInstance, patientId: string): boolean {
  if (isRoomOccupied(room)) {
    return false;
  }
  room.occupantIds.push(patientId);
  return true;
}

export function removeOccupant(room: RoomInstance, patientId: string): boolean {
  const index = room.occupantIds.indexOf(patientId);
  if (index === -1) return false;
  room.occupantIds.splice(index, 1);
  return true;
}
