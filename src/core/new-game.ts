/**
 * Arquivo: src/core/new-game.ts
 * O que faz: Inicializa uma nova partida do MediVille Manager com as salas iniciais, equipe médica, caixa, reputação e parâmetros do GDD.
 * Para que foi criado: Criação de estado limpo e reprodutível para início de jogo e testes automatizados.
 * Como modificar/debugar: Ajuste starterRooms, staff ou startingCash em src/data/balance.json.
 * Importa: src/core/config.ts, src/entities/room.ts, src/entities/staff.ts, src/state/game-state.ts, src/systems/staff-system.ts
 * Conecta-se com: src/core/simulation.ts, tests/simulation.test.ts
 */

import { BALANCE, ROOMS_CATALOG, PHARMACY_CATALOG } from './config';
import { createRoomInstance, type RoomInstance } from '../entities/room';
import type { StaffMember } from '../entities/staff';
import type { GameState } from '../state/game-state';
import { createStaffMember } from '../systems/staff-system';

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

function buildStarterStaffMap(): Map<string, StaffMember> {
  const staff = new Map<string, StaffMember>();
  const doc = createStaffMember('doctor', BALANCE.staff.minSkill);
  if (doc) staff.set(doc.id, doc);
  const nurse = createStaffMember('nurse', 1);
  if (nurse) staff.set(nurse.id, nurse);
  return staff;
}

function buildStarterPharmacyStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const med of PHARMACY_CATALOG.medications) {
    stock[med.id] = med.initialStock;
  }
  return stock;
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
    staff: buildStarterStaffMap(),
    activeEvents: [],
    eventTimerSec: BALANCE.events.firstEventDelaySec,
    pharmacyStock: buildStarterPharmacyStock(),
    finances: {
      bpaRevenue: 0,
      aihRevenue: 0,
      ministryTransfers: 0,
      emergencyGrants: 0,
      medicationPurchases: 0,
    },
  };
}
