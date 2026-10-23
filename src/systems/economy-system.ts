/**
 * Arquivo: src/systems/economy-system.ts
 * O que faz: Gerencia as finanças avançadas do hospital: repasses federais do Ministério da Saúde, verba emergencial da Secretaria, faturamento BPA/SIGTAP e compra/consumo de medicamentos da RENAME.
 * Para que foi criado: Implementar o Prompt 6 do GDD com ciclo econômico fidedigno ao SUS e atendimento às diretrizes solicitadas pelo usuário.
 * Como modificar/debugar: Valores de repasses, lotes e verbas são configurados em src/data/balance.json, sigtap.json e pharmacy.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/systems/day-system.ts, src/ui/pharmacy-modal.ts, src/ui/hud.ts
 */

import { BALANCE, PHARMACY_CATALOG } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';

export function requestEmergencyGrant(state: GameState): { success: boolean; amount: number } {
  const grantAmount = BALANCE.emergencyGrant.amount;
  state.cash += grantAmount;
  state.finances.emergencyGrants += grantAmount;

  globalBus.emit('economy:grant_received', {
    amount: grantAmount,
    reason: BALANCE.emergencyGrant.description,
  });
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: grantAmount,
    reason: 'Verba da Secretaria de Saúde creditada',
  });

  return { success: true, amount: grantAmount };
}

export function buyMedicationBatch(state: GameState, medId: string): { success: boolean; error?: string } {
  const med = PHARMACY_CATALOG.medications.find((m) => m.id === medId);
  if (!med) return { success: false, error: 'Medicamento não catalogado' };

  if (state.cash < med.batchCost) {
    return { success: false, error: 'Saldo insuficiente em caixa' };
  }

  state.cash -= med.batchCost;
  state.finances.medicationPurchases += med.batchCost;
  const currentStock = state.pharmacyStock[medId] ?? 0;
  const updatedStock = currentStock + med.batchSize;
  state.pharmacyStock[medId] = updatedStock;

  globalBus.emit('pharmacy:stock_changed', { medId, newStock: updatedStock, delta: med.batchSize });
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: -med.batchCost,
    reason: `Compra de lote: ${med.genericName}`,
  });

  return { success: true };
}

export function processMinistryDailyTransfer(state: GameState): { fixedPab: number; bonus: number; total: number } {
  const { dailyFixedPab, performanceBonusThreshold, performanceBonusPerPoint } = BALANCE.ministryOfHealth;
  let bonus = 0;
  if (state.satisfactionAverage >= performanceBonusThreshold) {
    const diff = state.satisfactionAverage - performanceBonusThreshold;
    bonus = Math.round(diff * performanceBonusPerPoint);
  }
  const total = dailyFixedPab + bonus;

  state.cash += total;
  state.finances.ministryTransfers += total;

  globalBus.emit('economy:transfer_received', { amount: total, fixedPab: dailyFixedPab, bonus });
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: total,
    reason: 'Repasse diário do Ministério da Saúde (PAB + Desempenho)',
  });

  return { fixedPab: dailyFixedPab, bonus, total };
}

export function getRequiredMedicationsForCase(caseId: string): string[] {
  switch (caseId) {
    case 'resfriado-comum':
      return ['paracetamol', 'soro-fisiologico'];
    case 'gripe-influenza':
      return ['paracetamol', 'oseltamivir'];
    case 'dengue-grupo-a':
      return ['paracetamol', 'sais-reidratacao'];
    case 'amigdalite-estreptococica':
      return ['amoxicilina'];
    case 'cistite-itu':
      return ['nitrofurantoina'];
    default:
      return ['paracetamol'];
  }
}

export function consumeMedicationsForCase(state: GameState, caseId: string): { success: boolean; missingMedName?: string } {
  const required = getRequiredMedicationsForCase(caseId);

  for (const medId of required) {
    const stock = state.pharmacyStock[medId] ?? 0;
    if (stock <= 0) {
      const def = PHARMACY_CATALOG.medications.find((m) => m.id === medId);
      const medName = def ? def.genericName : medId;
      globalBus.emit('pharmacy:stock_out', { medId, medName });
      return { success: false, missingMedName: medName };
    }
  }

  for (const medId of required) {
    const current = state.pharmacyStock[medId] ?? 0;
    const next = current - 1;
    state.pharmacyStock[medId] = next;
    globalBus.emit('pharmacy:stock_changed', { medId, newStock: next, delta: -1 });
  }

  return { success: true };
}
