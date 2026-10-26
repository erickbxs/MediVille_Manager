/**
 * Arquivo: src/systems/grid-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a grade hospitalar: posicionamento de salas, detecção de colisões, limites do terreno,
 * validação estrita anti-sobreposição com a rua frontal e remoção/demolição com reembolso.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir construção livre e correta no hospital conforme o GDD, impedindo que salas invadam a avenida ou calçadas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * canPlaceRoom() valida saldo, limites e ausência de colisão com outras salas e com a rua frontal.
 *
 * Importa: src/core/config.ts, src/entities/room.ts, src/state/game-state.ts, src/systems/map-expansion-system.ts
 * Conecta-se com: src/core/simulation.ts, src/render/ghost-view.ts, src/ui/build-menu.ts
 */

import { BALANCE, ROOMS_CATALOG } from '../core/config';
import { createRoomInstance, type RoomInstance } from '../entities/room';
import type { GameState } from '../state/game-state';
import { isTileOverlappingStreet } from './map-expansion-system';

export function isWithinGrid(
  col: number,
  row: number,
  width: number,
  height: number,
  maxCols = BALANCE.grid.cols,
  maxRows = BALANCE.grid.rows
): boolean {
  return col >= 0 && row >= 0 && col + width <= maxCols && row + height <= maxRows;
}

export function roomsOverlap(a: { col: number; row: number; width: number; height: number },
                             b: { col: number; row: number; width: number; height: number }): boolean {
  return !(
    a.col + a.width <= b.col ||
    b.col + b.width <= a.col ||
    a.row + a.height <= b.row ||
    b.row + b.height <= a.row
  );
}

export function canPlaceRoom(
  state: GameState,
  typeId: string,
  col: number,
  row: number,
  rotated = false
): boolean {
  const def = ROOMS_CATALOG.rooms.find((r) => r.id === typeId);
  if (!def) return false;

  const width = rotated ? def.height : def.width;
  const height = rotated ? def.width : def.height;
  const maxGrid = state.gridSize ?? BALANCE.grid.cols;

  if (!isWithinGrid(col, row, width, height, maxGrid, maxGrid)) return false;
  if (isTileOverlappingStreet(col, row, maxGrid) || isTileOverlappingStreet(col + width - 1, row + height - 1, maxGrid)) {
    return false;
  }
  if (state.cash < def.cost) return false;

  for (const room of state.rooms.values()) {
    if (roomsOverlap({ col, row, width, height }, room)) {
      return false;
    }
  }
  return true;
}

export function placeRoom(
  state: GameState,
  typeId: string,
  col: number,
  row: number,
  rotated = false
): RoomInstance | null {
  if (!canPlaceRoom(state, typeId, col, row, rotated)) {
    return null;
  }
  const def = ROOMS_CATALOG.rooms.find((r) => r.id === typeId)!;
  const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const instance = createRoomInstance(roomId, def, col, row, rotated);

  state.rooms.set(roomId, instance);
  state.cash -= def.cost;
  return instance;
}

export function removeRoom(state: GameState, roomId: string): number {
  const room = state.rooms.get(roomId);
  if (!room) return 0;

  const refund = Math.floor(room.definition.cost * BALANCE.economy.removeRefundRatio);
  state.cash += refund;
  state.rooms.delete(roomId);
  return refund;
}

export function canMoveRoom(
  state: GameState,
  roomId: string,
  newCol: number,
  newRow: number,
  newRotated = false
): boolean {
  const room = state.rooms.get(roomId);
  if (!room) return false;

  const width = newRotated ? room.definition.height : room.definition.width;
  const height = newRotated ? room.definition.width : room.definition.height;
  const maxGrid = state.gridSize ?? BALANCE.grid.cols;

  if (!isWithinGrid(newCol, newRow, width, height, maxGrid, maxGrid)) return false;

  for (const other of state.rooms.values()) {
    if (other.id === roomId) continue;
    if (roomsOverlap({ col: newCol, row: newRow, width, height }, other)) {
      return false;
    }
  }
  return true;
}

export function moveRoom(
  state: GameState,
  roomId: string,
  newCol: number,
  newRow: number,
  newRotated = false
): boolean {
  if (!canMoveRoom(state, roomId, newCol, newRow, newRotated)) return false;
  const room = state.rooms.get(roomId);
  if (!room) return false;

  room.col = newCol;
  room.row = newRow;
  room.rotated = newRotated;
  room.width = newRotated ? room.definition.height : room.definition.width;
  room.height = newRotated ? room.definition.width : room.definition.height;
  return true;
}
