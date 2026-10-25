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

const TOTAL_CHANCE_BASE = 0.05;
const TOTAL_CHANCE_MAX = 0.7;
const TOTAL_REP_FACTOR = 0.0035;
const TOTAL_MASTERED_FACTOR = 0.003;
const TOTAL_TREATED_FACTOR = 0.001;
const PARTIAL_CHANCE_BASE = 0.2;
const PARTIAL_CHANCE_MAX = 0.4;
const PARTIAL_REP_FACTOR = 0.002;
const DENIED_CHANCE_MIN = 0.05;
const PERCENT_TOTAL_ACCEPT = 40;
const PERCENT_PARTIAL_ACCEPT = 20;
const PERCENT_SCALE = 100;
const DEFAULT_MANAGER_NEGOTIATION_BONUS = 0.15;
const MAX_EXPENSIVE_FEE_PENALTY = 0.4;
const CONTRACT_BONUS_DEMAND_RATIO = 0.05;
const MIN_DEMAND_FLOOR = 0.2;
const HOSPITAL_CONTRACT_CHANCE = 0.3;

export interface NegotiationChances {
  totalAcceptChance: number;
  partialAcceptChance: number;
  deniedChance: number;
}

export type NegotiationOutcome = 'total' | 'partial' | 'denied';

export interface NegotiationResult {
  success: boolean;
  outcome: NegotiationOutcome;
  bonusPercent: number;
  message: string;
  error?: string;
}

export function getManagerNegotiationBonus(state: GameState): number {
  const manager = Array.from(state.staff.values()).find((s) => s.roleId === 'manager');
  if (!manager) return 0;
  const bonusPerSkill = BALANCE.staffPerks?.managerNegotiationBonusPerSkill ?? DEFAULT_MANAGER_NEGOTIATION_BONUS;
  return manager.skill * bonusPerSkill;
}

export function calculateNegotiationChances(state: GameState): NegotiationChances {
  const rep = state.reputation;
  const mastered = state.masteredCaseIds ? state.masteredCaseIds.length : 0;
  const treated = state.stats.treatedCount;
  const managerBonus = getManagerNegotiationBonus(state);

  const rawTotal = TOTAL_CHANCE_BASE + rep * TOTAL_REP_FACTOR + mastered * TOTAL_MASTERED_FACTOR + treated * TOTAL_TREATED_FACTOR + managerBonus;
  const totalAcceptChance = Math.min(TOTAL_CHANCE_MAX, Math.max(TOTAL_CHANCE_BASE, Math.round(rawTotal * PERCENT_SCALE) / PERCENT_SCALE));

  const rawPartial = PARTIAL_CHANCE_BASE + rep * PARTIAL_REP_FACTOR + managerBonus * 0.5;
  const partialAcceptChance = Math.min(PARTIAL_CHANCE_MAX, Math.max(PARTIAL_CHANCE_BASE, Math.round(rawPartial * PERCENT_SCALE) / PERCENT_SCALE));

  const remaining = 1 - (totalAcceptChance + partialAcceptChance);
  const deniedChance = Math.max(DENIED_CHANCE_MIN, Math.round(remaining * PERCENT_SCALE) / PERCENT_SCALE);

  return { totalAcceptChance, partialAcceptChance, deniedChance };
}

export function executeGovernmentNegotiation(state: GameState, forcedRoll?: number): NegotiationResult {
  if (state.governmentNegotiationCooldownDays > 0) {
    return {
      success: false,
      outcome: 'denied',
      bonusPercent: 0,
      message: `Aguarde ${state.governmentNegotiationCooldownDays} dias para nova negociação com o Ministério da Saúde.`,
      error: 'Cooldown ativo',
    };
  }

  const chances = calculateNegotiationChances(state);
  const roll = forcedRoll !== undefined ? forcedRoll : Math.random();
  state.governmentNegotiationCooldownDays = BALANCE.governmentNegotiation.cooldownDays;

  if (roll < chances.totalAcceptChance) {
    const bonus = BALANCE.governmentNegotiation.totalAcceptBonus;
    state.governmentGrantBonusMultiplier += bonus;
    const msg = 'Aceite Total (+40%) concedido pelo Ministério da Saúde devido à alta qualidade técnica!';
    globalBus.emit('economy:negotiation_completed', { outcome: 'total', bonus, message: msg });
    return { success: true, outcome: 'total', bonusPercent: PERCENT_TOTAL_ACCEPT, message: msg };
  }

  if (roll < chances.totalAcceptChance + chances.partialAcceptChance) {
    const bonus = BALANCE.governmentNegotiation.partialAcceptBonus;
    state.governmentGrantBonusMultiplier += bonus;
    const msg = 'Aceite Parcial (+20%) aprovado pela comissão tripartite de repasses SUS.';
    globalBus.emit('economy:negotiation_completed', { outcome: 'partial', bonus, message: msg });
    return { success: true, outcome: 'partial', bonusPercent: PERCENT_PARTIAL_ACCEPT, message: msg };
  }

  const deniedMsg = 'Pedido negado pela Secretaria de Saúde. Melhore a reputação e domine protocolos para o próximo ciclo.';
  globalBus.emit('economy:negotiation_completed', { outcome: 'denied', bonus: 0, message: deniedMsg });
  return { success: false, outcome: 'denied', bonusPercent: 0, message: deniedMsg };
}

export function processMinistryDailyTransfer(state: GameState): { fixedPab: number; bonus: number; total: number } {
  if (state.unitType === 'private_clinic') {
    return { fixedPab: 0, bonus: 0, total: 0 };
  }

  const { dailyFixedPab, performanceBonusThreshold, performanceBonusPerPoint } = BALANCE.ministryOfHealth;
  let bonus = 0;
  if (state.satisfactionAverage >= performanceBonusThreshold) {
    const diff = state.satisfactionAverage - performanceBonusThreshold;
    bonus = Math.round(diff * performanceBonusPerPoint);
  }
  const multiplier = 1 + (state.governmentGrantBonusMultiplier || 0);
  const total = Math.round((dailyFixedPab + bonus) * multiplier);

  state.cash += total;
  state.finances.ministryTransfers += total;

  globalBus.emit('economy:transfer_received', { amount: total, fixedPab: dailyFixedPab, bonus });
  globalBus.emit('cash:changed', {
    cash: state.cash,
    delta: total,
    reason: 'Repasse diário do Ministério da Saúde (PAB + Desempenho + Negociação)',
  });

  return { fixedPab: dailyFixedPab, bonus, total };
}

export function setPrivateConsultationFee(state: GameState, fee: number): boolean {
  const minFee = BALANCE.mixedEconomy.minConsultationFee;
  const maxFee = BALANCE.mixedEconomy.maxConsultationFee;
  if (fee < minFee || fee > maxFee) return false;
  state.privateConsultationFee = fee;
  globalBus.emit('cash:changed', { cash: state.cash, delta: 0, reason: `Preço da consulta particular ajustado para R$ ${fee.toLocaleString('pt-BR')}` });
  return true;
}

export function toggleContract(state: GameState, planId: string): boolean {
  const plans = BALANCE.mixedEconomy.plans;
  const exists = plans.some((p) => p.id === planId);
  if (!exists) return false;

  const current = state.activeContracts ?? [];
  const idx = current.indexOf(planId);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(planId);
  }
  state.activeContracts = current;
  return true;
}

export function calculateDemandMultiplier(state: GameState): number {
  let mult = 1.0;
  if (state.unitType === 'private_clinic' || state.unitType === 'hospital') {
    const fee = state.privateConsultationFee ?? BALANCE.mixedEconomy.defaultConsultationFee;
    if (fee <= BALANCE.mixedEconomy.lowPriceThreshold) {
      mult += BALANCE.mixedEconomy.lowPriceDemandBonus;
    } else if (fee > BALANCE.mixedEconomy.highPriceThreshold && state.reputation < BALANCE.mixedEconomy.requiredReputationForHighPrice) {
      const penalty = Math.min(
        MAX_EXPENSIVE_FEE_PENALTY,
        ((fee - BALANCE.mixedEconomy.highPriceThreshold) / (BALANCE.mixedEconomy.maxConsultationFee - BALANCE.mixedEconomy.highPriceThreshold)) *
          MAX_EXPENSIVE_FEE_PENALTY
      );
      mult -= penalty;
    }
  }

  const contracts = state.activeContracts ?? [];
  for (const cId of contracts) {
    const plan = BALANCE.mixedEconomy.plans.find((p) => p.id === cId);
    if (plan) mult += plan.dailyBonusArrival * CONTRACT_BONUS_DEMAND_RATIO;
  }
  return Math.max(MIN_DEMAND_FLOOR, mult);
}

export function calculatePatientConsultationRevenue(
  state: GameState,
  baseRevenue: number
): { amount: number; source: 'bpa' | 'private' | 'contract' } {
  if (state.unitType === 'private_clinic') {
    if (state.activeContracts && state.activeContracts.length > 0 && Math.random() < 0.5) {
      const randomPlanId = state.activeContracts[Math.floor(Math.random() * state.activeContracts.length)]!;
      const plan = BALANCE.mixedEconomy.plans.find((p) => p.id === randomPlanId);
      const fee = plan ? plan.feePerPatient : state.privateConsultationFee;
      state.finances.contractsRevenue = (state.finances.contractsRevenue ?? 0) + fee;
      return { amount: fee, source: 'contract' };
    }
    const fee = state.privateConsultationFee ?? BALANCE.mixedEconomy.defaultConsultationFee;
    state.finances.privateRevenue = (state.finances.privateRevenue ?? 0) + fee;
    return { amount: fee, source: 'private' };
  }

  if (state.unitType === 'hospital') {
    const roll = Math.random();
    if (roll < HOSPITAL_CONTRACT_CHANCE && state.activeContracts && state.activeContracts.length > 0) {
      const randomPlanId = state.activeContracts[Math.floor(Math.random() * state.activeContracts.length)]!;
      const plan = BALANCE.mixedEconomy.plans.find((p) => p.id === randomPlanId);
      const fee = plan ? plan.feePerPatient : baseRevenue;
      state.finances.contractsRevenue = (state.finances.contractsRevenue ?? 0) + fee;
      return { amount: fee, source: 'contract' };
    }
    if (roll < 0.5) {
      const fee = state.privateConsultationFee ?? BALANCE.mixedEconomy.defaultConsultationFee;
      state.finances.privateRevenue = (state.finances.privateRevenue ?? 0) + fee;
      return { amount: fee, source: 'private' };
    }
  }

  state.finances.bpaRevenue += baseRevenue;
  return { amount: baseRevenue, source: 'bpa' };
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
