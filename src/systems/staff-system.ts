/**
 * Arquivo: src/systems/staff-system.ts
 * O que faz: Gerencia a equipe de saúde (contratação, demissão, atribuição de salas e cálculo da folha salarial diária).
 * Para que foi criado: Implementar o Prompt 5 do GDD (gestão de funcionários com habilidades e salários).
 * Como modificar/debugar: Cargos e salários base são definidos em src/data/staff.json e balance.json.
 * Importa: src/core/config.ts, src/entities/staff.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/consultation-system.ts, src/ui/staff-modal.ts
 */

import { BALANCE, STAFF_CATALOG, NAMES_CATALOG } from '../core/config';
import { calculateStaffDailySalary, type StaffMember } from '../entities/staff';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

function generateStaffName(): string {
  const isFemale = Math.random() < BALANCE.population.femaleChance;
  const firstPool = isFemale ? NAMES_CATALOG.pools.female : NAMES_CATALOG.pools.male;
  const first = firstPool[Math.floor(Math.random() * firstPool.length)]!;
  const last = NAMES_CATALOG.pools.lastNames[Math.floor(Math.random() * NAMES_CATALOG.pools.lastNames.length)]!;
  return `Dr(a). ${first} ${last}`;
}

export function createStaffMember(roleId: string, customSkill?: number): StaffMember | null {
  const role = STAFF_CATALOG.roles.find((r) => r.id === roleId);
  if (!role) return null;

  const min = BALANCE.staff.minSkill;
  const max = BALANCE.staff.maxSkill;
  const skill = customSkill !== undefined
    ? Math.max(min, Math.min(max, customSkill))
    : Math.floor(Math.random() * (max - min + 1)) + min;

  const id = `staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    name: generateStaffName(),
    roleId,
    role,
    skill,
    dailySalary: calculateStaffDailySalary(role, skill),
    assignedRoomId: null,
  };
}

export function hireStaff(state: GameState, roleId: string, skill?: number): StaffMember | null {
  const member = createStaffMember(roleId, skill);
  if (!member) return null;

  state.staff.set(member.id, member);
  globalBus.emit('staff:hired', { staffId: member.id, roleId: member.roleId, name: member.name });
  globalBus.emit('state:changed', undefined);
  return member;
}

export function fireStaff(state: GameState, staffId: string): boolean {
  const member = state.staff.get(staffId);
  if (!member) return false;

  state.staff.delete(staffId);
  globalBus.emit('staff:fired', { staffId: member.id, name: member.name });
  globalBus.emit('state:changed', undefined);
  return true;
}

export function calculateTotalDailyStaffSalaries(state: GameState): number {
  let total = 0;
  for (const member of state.staff.values()) {
    total += member.dailySalary;
  }
  return total;
}

export function getBestDoctorSkill(state: GameState): number {
  let best = BALANCE.staff.minSkill;
  for (const member of state.staff.values()) {
    if (member.roleId === 'doctor' && member.skill > best) {
      best = member.skill;
    }
  }
  return best;
}
