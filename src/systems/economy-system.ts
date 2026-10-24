/**
 * Arquivo: src/systems/economy-system.ts
 * O que faz: Gerencia as finanças avançadas do hospital: repasses federais do Ministério da Saúde, verba emergencial da Secretaria, faturamento BPA/SIGTAP e compra/consumo de medicamentos da RENAME.
 * Para que foi criado: Implementar o Prompt 6 do GDD com ciclo econômico fidedigno ao SUS e atendimento às diretrizes solicitadas pelo usuário.
 * Como modificar/debugar: Valores de repasses, lotes e verbas são configurados em src/data/balance.json, sigtap.json e pharmacy.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/systems/day-system.ts, src/ui/pharmacy-modal.ts, src/ui/hud.ts
 */

import { BALANCE, CASES_CATALOG, PHARMACY_CATALOG } from '../core/config';
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

const DEFAULT_CASE_MEDS: Record<string, string[]> = {
  'resfriado-comum': ['soro-fisiologico', 'paracetamol'],
  'gripe-influenza': ['oseltamivir', 'dipirona'],
  'gripe-influenza-risco': ['oseltamivir', 'dipirona'],
  'dengue-grupo-a': ['sais-reidratacao', 'dipirona'],
  'amigdalite-estreptococica': ['amoxicilina', 'paracetamol'],
  'infeccao-urinaria': ['nitrofurantoina'],
  'infeccao-urinaria-cistite': ['nitrofurantoina'],
  'cistite-itu': ['nitrofurantoina'],
  'sifilis-primaria-secundaria': ['benzilpenicilina'],
  'febre-reumatica-profilaxia': ['benzilpenicilina'],
  'gastroenterite-aguda': ['sais-reidratacao'],
  'rinossinusite-bacteriana': ['amoxicilina', 'soro-fisiologico'],
  'otite-media-aguda': ['amoxicilina', 'dipirona'],
  'pneumonia-comunitaria': ['amoxicilina', 'dipirona'],
  'cefaleia-tensional': ['dipirona'],
  'desidratacao-moderada-plano-b': ['sais-reidratacao', 'soro-fisiologico'],
  'exantema-subito-pediatrico': ['paracetamol'],
};

export function getRequiredMedicationsForCase(caseId: string): string[] {
  const found = CASES_CATALOG.cases.find((c) => c.id === caseId);
  if (found?.medicationIds && found.medicationIds.length > 0) {
    return found.medicationIds;
  }
  return DEFAULT_CASE_MEDS[caseId] ?? ['paracetamol'];
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
