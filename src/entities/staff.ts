/**
 * Arquivo: src/entities/staff.ts
 *
 * 1. O que este arquivo faz?
 * Representa a entidade de um membro da equipe (médico, enfermeiro, técnico, etc.) com nome, cargo,
 * nível de habilidade (1 a 5 estrelas), energia/fadiga (0 a 100%) e rotina de descanso.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a gestão de folha salarial, produtividade e a mecânica de fadiga e Sala de Descanso (Prompt 19).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Taxas de redução de tempo e parâmetros de fadiga são lidos de src/data/balance.json.
 *
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/staff-system.ts, src/systems/staff-fatigue-system.ts, src/ui/staff-modal.ts
 */

import { BALANCE, type StaffRoleDefinition } from '../core/config';

export interface StaffMember {
  id: string;
  name: string;
  roleId: string;
  role: StaffRoleDefinition;
  skill: number;
  dailySalary: number;
  assignedRoomId: string | null;
  energy?: number;
  isResting?: boolean;
  restTimerSec?: number;
}

export function calculateConsultationDuration(baseTimeSec: number, skill: number): number {
  const { skillReductionFactor, minSkill, maxSkill } = BALANCE.staff;
  const clampedSkill = Math.max(minSkill, Math.min(maxSkill, skill));
  const factor = 1 - skillReductionFactor * (clampedSkill - 1);
  return Math.max(1, Math.round(baseTimeSec * factor));
}

export function calculateStaffDailySalary(role: StaffRoleDefinition, skill: number): number {
  return role.baseSalaryDaily + (skill - 1) * role.skillSalaryBonus;
}
