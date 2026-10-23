/**
 * Arquivo: tests/economy-and-pharmacy.test.ts
 * O que faz: Testa o ciclo econômico do SUS: solicitação de verba emergencial da secretaria, repasses diários do Ministério da Saúde, controle de estoque da RENAME e faturamento BPA/SIGTAP quadruplicado.
 * Para que foi criado: Validar o Prompt 6 do GDD e assegurar integridade matemática e comportamental do sistema financeiro.
 * Como modificar/debugar: Execute 'npx vitest run tests/economy-and-pharmacy.test.ts'. Valores de referência vêm de src/data/balance.json.
 * Importa: src/core/simulation.ts, src/systems/economy-system.ts, src/core/config.ts, src/systems/consultation-system.ts
 * Conecta-se com: src/state/game-state.ts, src/systems/day-system.ts
 */

import { describe, it, expect } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import { BALANCE, PHARMACY_CATALOG } from '../src/core/config';
import {
  requestEmergencyGrant,
  buyMedicationBatch,
  consumeMedicationsForCase,
  processMinistryDailyTransfer,
} from '../src/systems/economy-system';
import { dischargePatient } from '../src/systems/consultation-system';
import { createPatient } from '../src/systems/case-system';

describe('Sistema Econômico SUS & Farmácia RENAME (Prompt 6)', () => {
  it('concede imediatamente verba emergencial da secretaria de saúde para reformas', () => {
    const sim = new HospitalSimulation();
    const initialCash = sim.state.cash;
    const grantAmount = BALANCE.emergencyGrant.amount;

    const res = requestEmergencyGrant(sim.state);
    expect(res.success).toBe(true);
    expect(res.amount).toBe(grantAmount);
    expect(sim.state.cash).toBe(initialCash + grantAmount);
    expect(sim.state.finances.emergencyGrants).toBe(grantAmount);
  });

  it('permite comprar lote de medicamentos da RENAME e deduz custo do caixa', () => {
    const sim = new HospitalSimulation();
    const med = PHARMACY_CATALOG.medications[0]!;
    const initialStock = sim.state.pharmacyStock[med.id] ?? 0;
    const initialCash = sim.state.cash;

    const res = buyMedicationBatch(sim.state, med.id);
    expect(res.success).toBe(true);
    expect(sim.state.pharmacyStock[med.id]).toBe(initialStock + med.batchSize);
    expect(sim.state.cash).toBe(initialCash - med.batchCost);
    expect(sim.state.finances.medicationPurchases).toBe(med.batchCost);
  });

  it('processa o repasse diário do Ministério da Saúde com PAB fixo e bônus de desempenho', () => {
    const sim = new HospitalSimulation();
    const initialCash = sim.state.cash;
    sim.state.satisfactionAverage = 80;

    const transfer = processMinistryDailyTransfer(sim.state);
    expect(transfer.fixedPab).toBe(BALANCE.ministryOfHealth.dailyFixedPab);
    expect(transfer.bonus).toBeGreaterThan(0);
    expect(sim.state.cash).toBe(initialCash + transfer.total);
    expect(sim.state.finances.ministryTransfers).toBe(transfer.total);
  });

  it('consome estoque de medicamento por caso clínico e alerta desabastecimento se zerar', () => {
    const sim = new HospitalSimulation();
    const caseId = 'resfriado-comum';
    const initialParacetamol = sim.state.pharmacyStock['paracetamol']!;

    const res = consumeMedicationsForCase(sim.state, caseId);
    expect(res.success).toBe(true);
    expect(sim.state.pharmacyStock['paracetamol']).toBe(initialParacetamol - 1);

    sim.state.pharmacyStock['paracetamol'] = 0;
    const outOfStockRes = consumeMedicationsForCase(sim.state, caseId);
    expect(outOfStockRes.success).toBe(false);
    expect(outOfStockRes.missingMedName).toBeDefined();
  });

  it('fatura consulta médica com valor quadruplicado (R$ 3.600) na alta do paciente', () => {
    const sim = new HospitalSimulation();
    const patient = createPatient('pat_test');
    patient.state = 'in_consultation';
    sim.state.patients.set(patient.id, patient);

    const initialCash = sim.state.cash;
    dischargePatient(sim.state, patient.id);

    expect(sim.state.cash).toBeGreaterThanOrEqual(initialCash + BALANCE.economy.revenuePerPatient);
    expect(BALANCE.economy.revenuePerPatient).toBe(3600);
    expect(sim.state.finances.bpaRevenue).toBeGreaterThanOrEqual(3600);
  });
});
