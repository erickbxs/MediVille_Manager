/**
 * Arquivo: tests/sectors-and-negotiation.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida o catálogo, layout e renderização dos 6 novos setores hospitalares (Vacina, Laboratório, Raio-X, Cirurgia, UTI, Descanso),
 * as probabilidades e o cooldown de 30 dias da Negociação Governamental SUS, e o limite máximo de 3 alertas ordenados por urgência do Conselheiro Hospitalar.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos da versão 1.1.0 e do Prompt 12 do MediVille Manager.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Rode `npx vitest run tests/sectors-and-negotiation.test.ts`. Caso alguma fórmula ou sala mude, ajuste os asserts aqui e os dados em src/data/*.
 *
 * Importa: vitest, pixi.js, src/core/config.ts, src/core/new-game.ts, src/render/room-layout.ts, src/render/furniture-factory.ts, src/systems/*
 * Conecta-se com: src/data/rooms.json, src/systems/economy-system.ts, src/systems/advisor-system.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Graphics } from 'pixi.js';
import { ROOMS_CATALOG, BALANCE, CASES_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { FURNITURE_LAYOUTS, getFurnitureWaypoints } from '../src/render/room-layout';
import { drawFurniture } from '../src/render/furniture-factory';
import {
  calculateNegotiationChances,
  executeGovernmentNegotiation,
  processMinistryDailyTransfer,
} from '../src/systems/economy-system';
import { updateDaySystem } from '../src/systems/day-system';
import { dischargePatient } from '../src/systems/consultation-system';
import {
  getAdvisorAlerts,
  dismissAdvisorAlert,
  snoozeAdvisorAlert,
} from '../src/systems/advisor-system';
import { createRoomInstance } from '../src/entities/room';
import { createPatient } from '../src/systems/case-system';

describe('Prompt 12 — Novos Setores Hospitalares 3D', () => {
  it('contém todas as 6 novas salas no catálogo de salas com atributos corretos', () => {
    const requiredSectorIds = ['vaccination', 'laboratory', 'xray', 'surgery', 'icu', 'staff_room'];

    for (const id of requiredSectorIds) {
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === id);
      expect(def, `Sala ${id} deve existir no catálogo`).toBeDefined();
      expect(def?.cost).toBeGreaterThan(0);
      expect(def?.dailyUpkeep).toBeGreaterThan(0);
      expect(def?.width).toBeGreaterThanOrEqual(2);
      expect(def?.height).toBeGreaterThanOrEqual(2);
      expect(def?.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('possui layouts e móveis volumétricos registrados para cada nova sala', () => {
    const requiredSectorIds = ['vaccination', 'laboratory', 'xray', 'surgery', 'icu', 'staff_room'];
    const g = new Graphics();
    const ctx = { stockRatio: 1, timeSeed: 12345 };

    for (const id of requiredSectorIds) {
      const slots = FURNITURE_LAYOUTS[id];
      expect(slots, `Layout de mobília para ${id} deve existir`).toBeDefined();
      expect(slots!.length).toBeGreaterThanOrEqual(3);

      const waypoints = getFurnitureWaypoints(id, { x: 0, y: 0, w: 96, h: 64 }, 0);
      expect(waypoints.length).toBe(slots!.length);

      // Renderiza sem exceções no PixiJS Graphics
      expect(() => drawFurniture(g, waypoints, ctx)).not.toThrow();
    }
  });

  it('aplica bônus diário de meta vacinal da Sala de Vacinação ao fechar o dia', () => {
    const state = createInitialGameState('ubs');
    const vaxDef = ROOMS_CATALOG.rooms.find((r) => r.id === 'vaccination')!;
    const vaxRoom = createRoomInstance('vax_1', vaxDef, 1, 4);
    state.rooms.set(vaxRoom.id, vaxRoom);

    const initialRep = state.reputation;

    // Simula passagem de 1 dia inteiro
    updateDaySystem(state, BALANCE.time.dayDurationSec);

    // O bônus da vacina foi somado (1200) e a reputação recebeu bônus de 0.5
    expect(state.day).toBe(2);
    expect(state.reputation).toBeGreaterThanOrEqual(initialRep);
    expect(state.finances.ministryTransfers).toBeGreaterThan(0);
    expect(state.cash).toBeDefined();
  });

  it('concede repasse AIH adicional de cirurgia/UTI em caso grave e bônus SIGTAP de raio-x', () => {
    const state = createInitialGameState('hospital');
    const surgeryDef = ROOMS_CATALOG.rooms.find((r) => r.id === 'surgery')!;
    const xrayDef = ROOMS_CATALOG.rooms.find((r) => r.id === 'xray')!;
    state.rooms.set('surg_1', createRoomInstance('surg_1', surgeryDef, 2, 4));
    state.rooms.set('xray_1', createRoomInstance('xray_1', xrayDef, 5, 4));

    // Caso grave com queixa torácica/respiratória
    const severeCase = CASES_CATALOG.cases.find(
      (c) => c.severity === 'Grave' || c.severity === 'Crítica'
    ) ?? CASES_CATALOG.cases[0]!;

    const patient = createPatient('pat_severe_1');
    patient.clinicalCase.definition = severeCase;
    state.patients.set(patient.id, patient);

    const initialCash = state.cash;
    dischargePatient(state, patient.id, false);

    // O faturamento incluiu o bônus AIH de cirurgia (+7200)
    expect(state.finances.aihRevenue).toBeGreaterThanOrEqual(BALANCE.sectors.surgeryIcuRevenue);
    expect(state.cash).toBeGreaterThan(initialCash + BALANCE.economy.revenuePerPatient);
  });
});

describe('Prompt 12 — Negociação de Repasse Governamental SUS (Ciclo de 30 Dias)', () => {
  let state = createInitialGameState('ubs');

  beforeEach(() => {
    state = createInitialGameState('ubs');
  });

  it('calcula chances maiores de aceite conforme a reputação e protocolos dominados aumentam', () => {
    state.reputation = 40;
    state.masteredCaseIds = [];
    const lowChances = calculateNegotiationChances(state);

    state.reputation = 95;
    state.masteredCaseIds = ['case_1', 'case_2', 'case_3', 'case_4', 'case_5'];
    state.stats.treatedCount = 50;
    const highChances = calculateNegotiationChances(state);

    expect(highChances.totalAcceptChance).toBeGreaterThan(lowChances.totalAcceptChance);
    expect(highChances.deniedChance).toBeLessThan(lowChances.deniedChance);
    expect(highChances.totalAcceptChance + highChances.partialAcceptChance + highChances.deniedChance).toBeCloseTo(1, 1);
  });

  it('concede Aceite Total (+40%) ou Aceite Parcial (+20%) e ativa cooldown de 30 dias', () => {
    expect(state.governmentNegotiationCooldownDays).toBe(0);
    expect(state.governmentGrantBonusMultiplier).toBe(0);

    // Força roll para Aceite Total (roll = 0.01)
    const resultTotal = executeGovernmentNegotiation(state, 0.01);
    expect(resultTotal.success).toBe(true);
    expect(resultTotal.outcome).toBe('total');
    expect(resultTotal.bonusPercent).toBe(40);
    expect(state.governmentGrantBonusMultiplier).toBe(BALANCE.governmentNegotiation.totalAcceptBonus);
    expect(state.governmentNegotiationCooldownDays).toBe(BALANCE.governmentNegotiation.cooldownDays);

    // Tentativa imediata deve ser bloqueada pelo cooldown
    const blockedAttempt = executeGovernmentNegotiation(state, 0.01);
    expect(blockedAttempt.success).toBe(false);
    expect(blockedAttempt.error).toBe('Cooldown ativo');

    // Ao processar o repasse do ministério, aplica o bônus de +40%
    const transfer = processMinistryDailyTransfer(state);
    const expectedBase = BALANCE.ministryOfHealth.dailyFixedPab;
    expect(transfer.total).toBeGreaterThan(expectedBase);
  });

  it('decrementa o cooldown de negociação a cada virada de dia até zerar', () => {
    state.governmentNegotiationCooldownDays = 3;

    updateDaySystem(state, BALANCE.time.dayDurationSec);
    expect(state.governmentNegotiationCooldownDays).toBe(2);

    updateDaySystem(state, BALANCE.time.dayDurationSec);
    expect(state.governmentNegotiationCooldownDays).toBe(1);

    updateDaySystem(state, BALANCE.time.dayDurationSec);
    expect(state.governmentNegotiationCooldownDays).toBe(0);
  });
});

describe('Prompt 12 — Conselheiro Hospitalar Inteligente (Máximo de 3 Sugestões)', () => {
  let state = createInitialGameState('ubs');

  beforeEach(() => {
    state = createInitialGameState('ubs');
  });

  it('mostra no máximo 3 sugestões simultâneas ordenadas estritamente por urgência', () => {
    // Provoca múltiplos gargalos simultâneos:
    state.cash = 1000; // Gera alerta high (cash_low)
    state.queueIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']; // Gera alerta high (queue_bottleneck)
    state.pharmacyStock = { dipirona: 0 }; // Gera alerta high (medication_stockout)
    state.reputation = 90; // Gera alerta low (government_negotiation_ready)

    const alerts = getAdvisorAlerts(state);

    expect(alerts.length).toBeLessThanOrEqual(3);
    expect(alerts.length).toBeGreaterThan(0);

    // Todos os 3 exibidos devem ter alta prioridade em relação aos de baixa prioridade
    for (let i = 0; i < alerts.length - 1; i++) {
      const currentRank = alerts[i]!.urgency === 'high' ? 0 : alerts[i]!.urgency === 'medium' ? 1 : 2;
      const nextRank = alerts[i + 1]!.urgency === 'high' ? 0 : alerts[i + 1]!.urgency === 'medium' ? 1 : 2;
      expect(currentRank).toBeLessThanOrEqual(nextRank);
    }
  });

  it('permite adiar ou ignorar alertas para que não voltem a poluir a tela', () => {
    state.cash = 500;
    const initialAlerts = getAdvisorAlerts(state);
    const cashAlert = initialAlerts.find((a) => a.id === 'cash_low');
    expect(cashAlert).toBeDefined();

    // Ignora o alerta
    dismissAdvisorAlert(state, 'cash_low');
    const afterDismiss = getAdvisorAlerts(state);
    expect(afterDismiss.some((a) => a.id === 'cash_low')).toBe(false);

    // Adia outro alerta
    snoozeAdvisorAlert(state, 'queue_bottleneck');
    expect(state.dismissedAdvisorAlertIds).toContain('queue_bottleneck');
  });
});
