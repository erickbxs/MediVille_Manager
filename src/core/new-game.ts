/**
 * Arquivo: src/core/new-game.ts
 * O que faz: Inicializa uma nova partida do MediVille Manager com as salas iniciais, caixa, reputação e parâmetros do GDD.
 * Para que foi criado: Criação de estado limpo e reprodutível para início de jogo e testes automatizados.
 * Como modificar/debugar: Ajuste starterRooms ou startingCash em src/data/balance.json.
 * Importa: src/core/config.ts, src/entities/room.ts, src/state/game-state.ts
 * Conecta-se com: src/core/simulation.ts, tests/simulation.test.ts
 */

import { BALANCE, ROOMS_CATALOG } from './config';
import { createRoomInstance, type RoomInstance } from '../entities/room';
import type { GameState } from '../state/game-state';

function buildStarterRoomsMap(): Map<string, RoomInstance> {
  const rooms = new Map<string, RoomInstance>();
  for (const starter of BALANCE.starterRooms) {
    const def = ROOMS_CATALOG.rooms.find((r) => r.id === starter.typeId);
    if (!def) continue;
    const roomId = `room_starter_${starter.typeId}_${starter.col}_${starter.row}`;
    const instance = createRoomInstance(roomId, def, starter.col, starter.row, starter.rotated);
    rooms.set(roomId, instance);
  }
  return rooms;
}

export function createInitialGameState(): GameState {
  return {
    day: 1,
    dayTimeSec: 0,
    speed: BALANCE.time.initialSpeed,
    previousSpeed: BALANCE.time.initialSpeed,
    cash: BALANCE.economy.startingCash,
    reputation: BALANCE.reputation.initial,
    satisfactionAverage: BALANCE.satisfaction.initial,
    consecutiveNegativeCashDays: 0,
    consecutiveLowReputationDays: 0,
    isDefeated: false,
    defeatReason: null,
    rooms: buildStarterRoomsMap(),
    patients: new Map(),
    queueIds: [],
    activeDecisionPatientId: null,
    stats: { treatedCount: 0, abandonedCount: 0, totalDecisions: 0, correctDecisions: 0 },
    arrivalTimerSec: BALANCE.arrival.baseIntervalSec * BALANCE.arrival.initialProgress,
  };
}
