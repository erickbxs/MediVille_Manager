/**
 * Arquivo: src/systems/save-system.ts
 * O que faz: Gerencia a persistência do estado do hospital (salvamento automático e manual, carregamento, exportação e importação JSON) usando LocalStorage.
 * Para que foi criado: Cumprir os requisitos da Fase 3 (Prompt 12 do GDD) permitindo que o progresso do jogador seja preservado entre sessões e dispositivos.
 * Como modificar/debugar: Caso adicione novos campos no GameState, atualize serializeGameState e deserializeGameState para garantir compatibilidade.
 * Importa: src/core/config.ts, src/entities/*, src/state/game-state.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/settings-modal.ts, src/main.ts
 */

import { ROOMS_CATALOG, STAFF_CATALOG } from '../core/config';
import type { GameState, HospitalStats, FinancialStats } from '../state/game-state';
import type { RoomInstance } from '../entities/room';
import type { StaffMember } from '../entities/staff';
import type { PatientInstance } from '../entities/patient';

const SAVE_KEY = 'mediville_manager_save_v1';
const JSON_INDENT_SPACES = 2;

export interface SerializedRoom {
  id: string;
  typeId: string;
  col: number;
  row: number;
  rotated: boolean;
  occupantIds: string[];
}

export interface SerializedStaff {
  id: string;
  name: string;
  roleId: string;
  skill: number;
  dailySalary: number;
  assignedRoomId: string | null;
}

export interface SerializedGameState {
  version: number;
  timestamp: number;
  day: number;
  dayTimeSec: number;
  speed: number;
  cash: number;
  reputation: number;
  satisfactionAverage: number;
  consecutiveNegativeCashDays: number;
  consecutiveLowReputationDays: number;
  isDefeated: boolean;
  defeatReason: string | null;
  rooms: SerializedRoom[];
  patients: PatientInstance[];
  queueIds: string[];
  activeDecisionPatientId: string | null;
  pendingDecisionPatientIds: string[];
  hospitalLevel: 'ubs' | 'upa' | 'hospital';
  unlockedRoomIds: string[];
  seenTutorialTips: string[];
  movingRoomId: string | null;
  stats: HospitalStats;
  arrivalTimerSec: number;
  staff: SerializedStaff[];
  activeEvents: GameState['activeEvents'];
  eventTimerSec: number;
  pharmacyStock: Record<string, number>;
  finances: FinancialStats;
}

function serializeRooms(rooms: Map<string, RoomInstance>): SerializedRoom[] {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    typeId: r.typeId,
    col: r.col,
    row: r.row,
    rotated: r.rotated,
    occupantIds: [...r.occupantIds],
  }));
}

function serializeStaff(staff: Map<string, StaffMember>): SerializedStaff[] {
  return Array.from(staff.values()).map((s) => ({
    id: s.id,
    name: s.name,
    roleId: s.roleId,
    skill: s.skill,
    dailySalary: s.dailySalary,
    assignedRoomId: s.assignedRoomId,
  }));
}

export function serializeGameState(state: GameState): SerializedGameState {
  return {
    version: 1,
    timestamp: Date.now(),
    day: state.day,
    dayTimeSec: state.dayTimeSec,
    speed: state.speed,
    cash: state.cash,
    reputation: state.reputation,
    satisfactionAverage: state.satisfactionAverage,
    consecutiveNegativeCashDays: state.consecutiveNegativeCashDays,
    consecutiveLowReputationDays: state.consecutiveLowReputationDays,
    isDefeated: state.isDefeated,
    defeatReason: state.defeatReason,
    rooms: serializeRooms(state.rooms),
    patients: Array.from(state.patients.values()),
    queueIds: [...state.queueIds],
    activeDecisionPatientId: state.activeDecisionPatientId,
    pendingDecisionPatientIds: [...state.pendingDecisionPatientIds],
    hospitalLevel: state.hospitalLevel,
    unlockedRoomIds: [...state.unlockedRoomIds],
    seenTutorialTips: [...state.seenTutorialTips],
    movingRoomId: null,
    stats: { ...state.stats },
    arrivalTimerSec: state.arrivalTimerSec,
    staff: serializeStaff(state.staff),
    activeEvents: [...state.activeEvents],
    eventTimerSec: state.eventTimerSec,
    pharmacyStock: { ...state.pharmacyStock },
    finances: { ...state.finances },
  };
}

function restoreRooms(serialized: SerializedRoom[]): Map<string, RoomInstance> {
  const map = new Map<string, RoomInstance>();
  for (const s of serialized) {
    const def = ROOMS_CATALOG.rooms.find((r) => r.id === s.typeId);
    if (!def) continue;
    map.set(s.id, {
      id: s.id,
      typeId: s.typeId,
      col: s.col,
      row: s.row,
      width: s.rotated ? def.height : def.width,
      height: s.rotated ? def.width : def.height,
      rotated: s.rotated,
      definition: def,
      occupantIds: s.occupantIds,
    });
  }
  return map;
}

function restoreStaff(serialized: SerializedStaff[]): Map<string, StaffMember> {
  const map = new Map<string, StaffMember>();
  for (const s of serialized) {
    const roleDef = STAFF_CATALOG.roles.find((r) => r.id === s.roleId);
    if (!roleDef) continue;
    map.set(s.id, {
      id: s.id,
      name: s.name,
      roleId: s.roleId,
      role: roleDef,
      skill: s.skill,
      dailySalary: s.dailySalary,
      assignedRoomId: s.assignedRoomId,
    });
  }
  return map;
}

function restorePatients(list: PatientInstance[]): Map<string, PatientInstance> {
  const map = new Map<string, PatientInstance>();
  for (const p of list) {
    map.set(p.id, p);
  }
  return map;
}

export function deserializeGameState(data: SerializedGameState): GameState {
  return {
    day: data.day,
    dayTimeSec: data.dayTimeSec,
    speed: data.speed,
    previousSpeed: data.speed,
    cash: data.cash,
    reputation: data.reputation,
    satisfactionAverage: data.satisfactionAverage,
    consecutiveNegativeCashDays: data.consecutiveNegativeCashDays,
    consecutiveLowReputationDays: data.consecutiveLowReputationDays,
    isDefeated: data.isDefeated,
    defeatReason: data.defeatReason,
    rooms: restoreRooms(data.rooms),
    patients: restorePatients(data.patients),
    queueIds: data.queueIds,
    activeDecisionPatientId: data.activeDecisionPatientId,
    pendingDecisionPatientIds: data.pendingDecisionPatientIds,
    hospitalLevel: data.hospitalLevel,
    unlockedRoomIds: data.unlockedRoomIds,
    seenTutorialTips: data.seenTutorialTips,
    movingRoomId: null,
    stats: data.stats,
    arrivalTimerSec: data.arrivalTimerSec,
    staff: restoreStaff(data.staff),
    activeEvents: data.activeEvents,
    eventTimerSec: data.eventTimerSec,
    pharmacyStock: data.pharmacyStock,
    finances: data.finances,
  };
}

function getStorage(): Storage | null {
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function saveGameState(state: GameState): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const serialized = serializeGameState(state);
    storage.setItem(SAVE_KEY, JSON.stringify(serialized));
    return true;
  } catch (err: unknown) {
    console.error('[SaveSystem] Erro ao salvar estado:', err);
    return false;
  }
}

export function loadGameState(): GameState | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SerializedGameState;
    if (!data.version || !data.rooms) return null;
    return deserializeGameState(data);
  } catch (err: unknown) {
    console.error('[SaveSystem] Erro ao carregar estado salvo:', err);
    return null;
  }
}

export function hasSavedGame(): boolean {
  const storage = getStorage();
  return storage !== null && storage.getItem(SAVE_KEY) !== null;
}

export function clearSavedGame(): void {
  getStorage()?.removeItem(SAVE_KEY);
}

export function exportSaveJson(state: GameState): string {
  const serialized = serializeGameState(state);
  return JSON.stringify(serialized, null, JSON_INDENT_SPACES);
}

export function importSaveJson(jsonString: string): GameState | null {
  try {
    const data = JSON.parse(jsonString) as SerializedGameState;
    if (!data.version || !data.rooms) return null;
    return deserializeGameState(data);
  } catch {
    return null;
  }
}

