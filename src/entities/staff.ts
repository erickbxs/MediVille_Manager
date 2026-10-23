/**
 * Arquivo: src/entities/staff.ts
 * O que faz: Representa a entidade de um membro da equipe (médico, enfermeiro, farmacêutico) com nome, cargo, nível de habilidade e cálculo de tempo de atendimento.
 * Para que foi criado: Cumprir o Prompt 5 do GDD (equipe com habilidades e salários) e aplicar a fórmula T_{atend} = T_{base} * (1 - 0.05 * (H - 1)).
 * Como modificar/debugar: Altere a taxa de redução de tempo em src/data/balance.json.
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/staff-system.ts, src/systems/consultation-system.ts, src/ui/staff-modal.ts
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
