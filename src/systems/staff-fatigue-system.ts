/**
 * Arquivo: src/systems/staff-fatigue-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a energia, fadiga e recuperação da equipe hospitalar:
 * - Redução gradual de energia por atendimento realizado (-8%).
 * - Queda de desempenho de 25% na velocidade quando a energia fica abaixo de 40%.
 * - Roteamento automático de pausa para o café na Sala de Descanso (staff_room) por 8 segundos.
 * - Fornecimento de café emergencial pago para energizar toda a equipe.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a mecânica do GDD da versão 1.8.0, valorizando a construção da Sala de Descanso (staff_room)
 * e o bem-estar dos profissionais de saúde do SUS.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Todos os limites e penalidades provêm de BALANCE.fatigue em src/data/balance.json.
 *
 * Importa: src/core/config.ts, src/entities/staff.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/ui/staff-modal.ts, src/core/simulation.ts
 */

import { BALANCE } from '../core/config';
import type { StaffMember } from '../entities/staff';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

export function getStaffEnergy(member: StaffMember): number {
  return member.energy ?? BALANCE.fatigue.energyInitial;
}

export function isStaffTired(member: StaffMember): boolean {
  return getStaffEnergy(member) < BALANCE.fatigue.tiredThreshold;
}

export function getStaffFatigueSpeedPenalty(member: StaffMember): number {
  if (isStaffTired(member)) {
    return BALANCE.fatigue.tiredSpeedPenalty;
  }
  return 0;
}

export function deductStaffEnergyOnConsultation(state: GameState, staffId?: string): void {
  const loss = BALANCE.fatigue.lossPerPatient;
  let targetStaff: StaffMember | undefined;

  if (staffId) {
    targetStaff = state.staff.get(staffId);
  } else {
    // Busca o primeiro médico ou enfermeiro disponível
    targetStaff = Array.from(state.staff.values()).find(
      (s) => s.roleId === 'doctor' || s.roleId === 'nurse'
    );
  }

  if (!targetStaff) return;

  const current = getStaffEnergy(targetStaff);
  targetStaff.energy = Math.max(0, current - loss);

  if (targetStaff.energy < BALANCE.fatigue.tiredThreshold) {
    globalBus.emit('advisor:alert', {
      id: `tired_${targetStaff.id}`,
      message: 'Equipe cansada e com queda de desempenho ➔ Construir Sala de Descanso ou contratar mais pessoal',
    });
  }
}

export function hasStaffRoom(state: GameState): boolean {
  return Array.from(state.rooms.values()).some((r) => r.typeId === 'staff_room');
}

export function energizeAllStaffWithCoffee(state: GameState): { success: boolean; cost: number; error?: string } {
  const cost = BALANCE.fatigue.coffeeBoostCost;
  if (state.cash < cost) {
    return { success: false, cost, error: 'Saldo insuficiente para a rodada de café.' };
  }

  state.cash -= cost;
  for (const member of state.staff.values()) {
    member.energy = BALANCE.fatigue.energyInitial;
    member.isResting = false;
    member.restTimerSec = 0;
  }

  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: -cost,
    reason: 'Rodada de Café e Pausa para a Equipe de Saúde',
  });

  return { success: true, cost };
}

export function updateStaffFatigueSystem(state: GameState, deltaSec: number): void {
  const roomAvailable = hasStaffRoom(state);
  const breakDuration = BALANCE.fatigue.breakDurationSec;
  const restThreshold = BALANCE.fatigue.restThreshold;

  for (const member of state.staff.values()) {
    if (member.isResting) {
      member.restTimerSec = (member.restTimerSec ?? 0) + deltaSec;
      if (member.restTimerSec >= breakDuration) {
        member.energy = BALANCE.fatigue.energyInitial;
        member.isResting = false;
        member.restTimerSec = 0;
      }
    } else if (roomAvailable && getStaffEnergy(member) < restThreshold) {
      // Inicia a pausa para o café se houver Sala de Descanso
      member.isResting = true;
      member.restTimerSec = deltaSec;
    }
  }
}
