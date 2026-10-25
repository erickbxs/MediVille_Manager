/**
 * Arquivo: tests/auto-protocol-and-100-cases.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a existência de exatamente 100 casos clínicos reais com integridade referencial estrita para pharmacy.json,
 * a mecânica de protocolo dominado (caso inédito em ready_for_treatment vs auto-resolução de caso dominado com R$ 3.600),
 * e o ciclo de tráfego com desembarque de pacientes.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos de qualidade e de arquitetura do Prompt 11 do MediVille Manager.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute `npx vitest run tests/auto-protocol-and-100-cases.test.ts`.
 *
 * Importa: vitest, src/core/config.ts, src/core/simulation.ts, src/core/new-game.ts, src/systems/consultation-system.ts, src/systems/traffic-system.ts
 * Conecta-se com: src/data/cases.json, src/data/pharmacy.json
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CASES_CATALOG, PHARMACY_CATALOG } from '../src/core/config';
import { HospitalSimulation } from '../src/core/simulation';
import { createInitialGameState } from '../src/core/new-game';
import { createPatient } from '../src/systems/case-system';
import { updateConsultationSystem } from '../src/systems/consultation-system';
import { TrafficSystem } from '../src/systems/traffic-system';

describe('Prompt 11 & 12 — Catálogo de Casos Clínicos do SUS e Integridade RENAME', () => {
  it('deve conter catálogo de casos clínicos únicos e com todos os campos obrigatórios', () => {
    const cases = CASES_CATALOG.cases;
    expect(cases.length).toBe(150);


    const ids = new Set<string>();
    for (const c of cases) {
      expect(c.id).toBeTruthy();
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);

      expect(c.name).toBeTruthy();
      expect(c.area).toBeTruthy();
      expect(c.typicalUnit).toBeTruthy();
      expect(c.severity).toBeTruthy();
      expect(c.symptoms.length).toBeGreaterThanOrEqual(2);
      expect(c.suggestedConduct.id).toBeTruthy();
      expect(c.suggestedConduct.text).toBeTruthy();
      expect(c.distractorConducts.length).toBe(2);
      expect(c.distractorConducts[0]!.whyWrong).toBeTruthy();
      expect(c.distractorConducts[1]!.whyWrong).toBeTruthy();
      expect(c.explanation).toBeTruthy();
    }
  });

  it('deve manter integridade referencial estrita para todos os medicationIds em pharmacy.json', () => {
    const validMedIds = new Set(PHARMACY_CATALOG.medications.map((m) => m.id));

    for (const c of CASES_CATALOG.cases) {
      expect(c.medicationIds).toBeDefined();
      expect(c.medicationIds!.length).toBeGreaterThan(0);
      for (const medId of c.medicationIds!) {
        expect(validMedIds.has(medId)).toBe(true);
      }
    }
  });
});

describe('Prompt 11 — Mecânica de Protocolo Dominado (masteredCaseIds) e Auto-Resolução', () => {
  let sim: HospitalSimulation;

  beforeEach(() => {
    sim = new HospitalSimulation(createInitialGameState());
  });

  it('caso inédito deve entrar em ready_for_treatment exigindo decisão manual e adicionar ao masteredCaseIds após acerto', () => {
    const state = sim.state;
    state.masteredCaseIds = [];

    // Paciente com caso inédito
    const patient = createPatient('pat_inedito_1');
    const caseId = patient.clinicalCase.definition.id;
    patient.state = 'waiting';
    state.patients.set(patient.id, patient);
    state.queueIds.push(patient.id);

    // Avança consulta
    updateConsultationSystem(state, 0.5);

    expect(patient.state).toBe('ready_for_treatment');
    expect(state.pendingDecisionPatientIds).toContain(patient.id);
    expect(state.masteredCaseIds).not.toContain(caseId);

    // Jogador escolhe conduta correta
    const correctConductId = patient.clinicalCase.definition.suggestedConduct.id;
    const ok = sim.submitClinicalDecision(patient.id, correctConductId);
    expect(ok).toBe(true);

    // Deve estar no masteredCaseIds agora
    expect(state.masteredCaseIds).toContain(caseId);
    expect(patient.state).toBe('treated');
  });

  it('caso dominado em masteredCaseIds deve ser auto-resolvido sem travar no pendente e creditar receita', () => {
    const state = sim.state;
    const initialCash = state.cash;

    // Forçar caso pré-dominado
    const patient = createPatient('pat_dominado_1');
    const caseId = patient.clinicalCase.definition.id;
    state.masteredCaseIds = [caseId];

    patient.state = 'waiting';
    state.patients.set(patient.id, patient);
    state.queueIds.push(patient.id);

    // Inicia atendimento automático
    updateConsultationSystem(state, 0.1);

    expect(patient.state).toBe('in_consultation');
    expect(state.pendingDecisionPatientIds).not.toContain(patient.id);

    // Simula a passagem do tempo da consulta rápida automática
    const duration = patient.consultationDurationSec;
    expect(duration).toBeGreaterThan(0);

    updateConsultationSystem(state, duration + 0.1);

    // Deve ter finalizado automaticamente como tratado
    expect(patient.state).toBe('treated');
    expect(patient.clinicalCase.isDecisionCorrect).toBe(true);
    expect(state.cash).toBeGreaterThan(initialCash);
  });
});

describe('Prompt 11 — Ciclo de Tráfego e Ausência de Artefatos', () => {
  it('TrafficSystem deve instanciar carros, atualizar posições e permitir desembarque sem erros', () => {
    const traffic = new TrafficSystem();
    const veh = traffic.spawnVehicle('east', 'car', 'pat_drop_1');

    expect(traffic.vehicles.length).toBeGreaterThan(0);
    expect(veh.patientIdToDropoff).toBe('pat_drop_1');

    const initialX = veh.x;
    traffic.update(0.1);

    expect(veh.x).not.toBe(initialX);
  });
});
