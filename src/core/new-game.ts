/**
 * Arquivo: src/core/new-game.ts
 *
 * 1. O que este arquivo faz?
 * Inicializa uma nova partida do MediVille Manager com as salas iniciais, equipe médica, caixa, reputação, timers e parâmetros do GDD.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Criação de estado limpo e reprodutível para início de jogo, reinicialização e testes automatizados.
 *
 * Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste starterRooms, staff, startingCash ou novos timers em src/data/balance.json.
 *
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

function buildInitialFinances() {
  return {
    bpaRevenue: 0,
    aihRevenue: 0,
    ministryTransfers: 0,
    emergencyGrants: 0,
    medicationPurchases: 0,
    privateRevenue: 0,
    contractsRevenue: 0,
  };
}

const UNIT_CASH = {
  ubs: 30000,
  upa: 45000,
  clinica: 60000,
  hospital: 100000,
} as const;

function resolveUnitType(choice?: 'ubs' | 'upa' | 'clinica' | 'hospital'): 'private_clinic' | 'ubs' | 'upa' | 'hospital' {
  if (choice === 'clinica') return 'private_clinic';
  if (choice === 'upa' || choice === 'hospital') return choice;
  return 'ubs';
}

function getInitialUnlockedRooms(level: 'ubs' | 'upa' | 'hospital'): string[] {
  const found = BALANCE.progression.levels.find((l) => l.id === level);
  return found ? [...found.unlockedRooms] : ['reception', 'waiting', 'consultation', 'pharmacy'];
}

function buildInitialNegotiationState() {
  return {
    masteredCaseIds: [],
    governmentNegotiationCooldownDays: 0,
    governmentGrantBonusMultiplier: 0,
    dismissedAdvisorAlertIds: [],
  };
}

function buildInitialEconomyState(unitChoice?: 'ubs' | 'upa' | 'clinica' | 'hospital') {
  return {
    unitType: resolveUnitType(unitChoice),
    privateConsultationFee: BALANCE.mixedEconomy.defaultConsultationFee,
    activeContracts: [] as string[],
    cleanlinessRating: 100,
    helipadTimerSec: 0,
    busArrivalTimerSec: 0,
  };
}

function buildCoreProgressState() {
  return {
    day: 1,
    dayTimeSec: 0,
    speed: BALANCE.time.initialSpeed,
    previousSpeed: BALANCE.time.initialSpeed,
    isDefeated: false,
    defeatReason: null,
    consecutiveNegativeCashDays: 0,
    consecutiveLowReputationDays: 0,
  };
}

export function createInitialGameState(unitChoice?: 'ubs' | 'upa' | 'clinica' | 'hospital'): GameState {
  const chosenCash = unitChoice ? UNIT_CASH[unitChoice] : BALANCE.economy.startingCash;
  const level = unitChoice === 'upa' || unitChoice === 'hospital' ? unitChoice : 'ubs';

  return {
    ...buildCoreProgressState(),
    cash: chosenCash,
    reputation: BALANCE.reputation.initial,
    satisfactionAverage: BALANCE.satisfaction.initial,
    gridSize: BALANCE.grid.cols,
    rooms: buildStarterRoomsMap(),
    patients: new Map(),
    queueIds: [],
    activeDecisionPatientId: null,
    pendingDecisionPatientIds: [],
    hospitalLevel: level,
    unlockedRoomIds: getInitialUnlockedRooms(level),
    seenTutorialTips: [],
    movingRoomId: null,
    stats: { treatedCount: 0, abandonedCount: 0, totalDecisions: 0, correctDecisions: 0 },
    arrivalTimerSec: BALANCE.arrival.baseIntervalSec * BALANCE.arrival.initialProgress,
    staff: buildStarterStaffMap(),
    activeEvents: [],
    eventTimerSec: BALANCE.events.firstEventDelaySec,
    pharmacyStock: buildStarterPharmacyStock(),
    finances: buildInitialFinances(),
    ...buildInitialEconomyState(unitChoice),
    ...buildInitialNegotiationState(),
  };
}


