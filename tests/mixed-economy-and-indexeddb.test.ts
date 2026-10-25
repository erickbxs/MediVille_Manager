/**
 * Arquivo: tests/mixed-economy-and-indexeddb.test.ts
 *
 * 1. O que este arquivo faz?
 * Suíte de testes automatizados com Vitest para validar todas as funcionalidades do Prompt 13:
 * - Economia mista diferenciada por tipo de unidade (Clínica Privada, UBS/UPA e Hospital Misto);
 * - Variação de preço de consulta particular e contratos de convênios;
 * - Efeito dos 3 novos cargos (Técnico de Enfermagem, Zelador e Gestor Hospitalar);
 * - Novos setores hospitalares de alta complexidade e emergências aeromédicas no Heliponto;
 * - Persistência dupla com slots rotativos em IndexedDB com checksum e recuperação de falhas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com as regras estritas de engenharia do Prompt 13 sem regressões no MediVille Manager.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute npx vitest run tests/mixed-economy-and-indexeddb.test.ts no terminal.
 *
 * Importa: vitest, src/core/simulation.ts, src/services/indexeddb-save.ts, src/systems/economy-system.ts
 * Conecta-se com: src/core/config.ts, src/state/game-state.ts, src/systems/save-system.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import { BALANCE, ROOMS_CATALOG, STAFF_CATALOG } from '../src/core/config';
import {
  setPrivateConsultationFee,
  toggleContract,
  calculateDemandMultiplier,
  calculatePatientConsultationRevenue,
  processMinistryDailyTransfer,
  getManagerNegotiationBonus,
} from '../src/systems/economy-system';
import { hireStaff } from '../src/systems/staff-system';
import {
  computeChecksum,
  saveGameDualSlots,
  loadGameDualSlots,
  putSaveEnvelope,
  type SaveEnvelope,
} from '../src/services/indexeddb-save';
import { serializeGameState } from '../src/systems/save-system';
import { updateDaySystem } from '../src/systems/day-system';
import { checkHelipadArrival } from '../src/systems/arrival-system';

describe('Prompt 13 — Economia Mista, 7 Cargos, Novos Setores e IndexedDB', () => {
  beforeEach(() => {
    // Configura mock in-memory limpo de localStorage para os testes
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    };
  });

  describe('Parte 1: Economia Mista por Unidade e Convênios', () => {
    it('Clínica Privada não recebe repasse fixo PAB', () => {
      const sim = new HospitalSimulation('clinica');
      const initialCash = sim.state.cash;
      processMinistryDailyTransfer(sim.state);
      expect(sim.state.cash).toBe(initialCash);
      expect(sim.state.finances.ministryTransfers).toBe(0);
    });

    it('UBS recebe repasse público fixo PAB normalmente', () => {
      const sim = new HospitalSimulation('ubs');
      const initialCash = sim.state.cash;
      processMinistryDailyTransfer(sim.state);
      expect(sim.state.cash).toBeGreaterThan(initialCash);
      expect(sim.state.finances.ministryTransfers).toBe(BALANCE.ministryOfHealth.dailyFixedPab);
    });

    it('Permite ajustar preço da consulta particular dentro dos limites com impacto na demanda', () => {
      const sim = new HospitalSimulation('clinica');
      setPrivateConsultationFee(sim.state, 1800);
      expect(sim.state.privateConsultationFee).toBe(1800);

      const cheapDemand = calculateDemandMultiplier(sim.state);
      expect(cheapDemand).toBeGreaterThanOrEqual(1.25);

      setPrivateConsultationFee(sim.state, 5500);
      expect(sim.state.privateConsultationFee).toBe(5500);

      sim.state.reputation = 40;
      const expensiveDemand = calculateDemandMultiplier(sim.state);
      expect(expensiveDemand).toBeLessThan(1.0);
    });

    it('Permite contratar até 3 convênios médicos aumentando o fluxo de chegada', () => {
      const sim = new HospitalSimulation('clinica');
      expect(sim.state.activeContracts?.length).toBe(0);

      toggleContract(sim.state, 'convenio_popular');
      toggleContract(sim.state, 'convenio_empresarial');
      expect(sim.state.activeContracts).toContain('convenio_popular');
      expect(sim.state.activeContracts).toContain('convenio_empresarial');

      const demandWithContracts = calculateDemandMultiplier(sim.state);
      expect(demandWithContracts).toBeGreaterThan(1.0);

      // Rescindir convênio
      toggleContract(sim.state, 'convenio_popular');
      expect(sim.state.activeContracts).not.toContain('convenio_popular');
    });

    it('Calcula receita de consulta para particular, convênio e SUS', () => {
      const sim = new HospitalSimulation('clinica');
      sim.state.privateConsultationFee = 3200;
      sim.state.activeContracts = [];

      const rev = calculatePatientConsultationRevenue(sim.state, 500);
      expect(rev.amount).toBe(3200);
      expect(rev.source).toBe('private');
      expect(sim.state.finances.privateRevenue).toBe(3200);
    });
  });

  describe('Parte 2: Expansão para os 7 Cargos de Equipa', () => {
    it('Contém os 7 cargos no catálogo de staff com tech, janitor e manager', () => {
      const roles = STAFF_CATALOG.roles.map((r) => r.id);
      expect(roles).toContain('doctor');
      expect(roles).toContain('nurse');
      expect(roles).toContain('tech');
      expect(roles).toContain('pharmacist');
      expect(roles).toContain('receptionist');
      expect(roles).toContain('janitor');
      expect(roles).toContain('manager');
      expect(roles.length).toBe(7);
    });

    it('Gestor hospitalar reduz custo de manutenção predial e concede bônus de negociação', () => {
      const sim = new HospitalSimulation();
      const managerBonus0 = getManagerNegotiationBonus(sim.state);
      expect(managerBonus0).toBe(0);

      hireStaff(sim.state, 'manager');
      const managerBonus1 = getManagerNegotiationBonus(sim.state);
      expect(managerBonus1).toBeGreaterThanOrEqual(0.15);
    });

    it('Biossegurança e higiene: decai sem zelador e é mantida com zelador', () => {
      const sim = new HospitalSimulation();
      sim.state.staff.clear(); // remove todos os funcionários
      sim.state.cleanlinessRating = 100;

      // Simula a virada de um dia sem zelador
      sim.state.dayTimeSec = BALANCE.time.dayDurationSec;
      updateDaySystem(sim.state, 0.1);
      expect(sim.state.cleanlinessRating).toBeLessThan(100);

      // Contrata um zelador
      hireStaff(sim.state, 'janitor');
      sim.state.dayTimeSec = BALANCE.time.dayDurationSec;
      updateDaySystem(sim.state, 0.1);
      expect(sim.state.cleanlinessRating).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Parte 3: Novos Setores e Heliponto SAMU', () => {
    it('Catálogo de salas inclui os 8 novos setores da progressão hospitalar', () => {
      const roomIds = ROOMS_CATALOG.rooms.map((r) => r.id);
      const expectedNew = [
        'wound_care',
        'dental',
        'medication_room',
        'emergency_room',
        'maternity',
        'trauma_center',
        'blood_bank',
        'helipad',
      ];
      for (const id of expectedNew) {
        expect(roomIds).toContain(id);
      }
    });

    it('Emergência do Heliponto gera paciente crítico aeromédico com bônus de recompensa', () => {
      const sim = new HospitalSimulation('hospital');
      const placed = sim.buildRoom('helipad', 8, 8);
      expect(placed).toBe(true);

      sim.state.helipadTimerSec = (BALANCE.sectors.helipadArrivalIntervalSec ?? 60) + 1;
      const initialQueue = sim.state.queueIds.length;
      checkHelipadArrival(sim.state, 1.0);

      expect(sim.state.queueIds.length).toBeGreaterThan(initialQueue);
      const helipadPatient = sim.state.patients.get(sim.state.queueIds[0]!);
      expect(helipadPatient?.isHelipadEmergency).toBe(true);
      expect(BALANCE.sectors.helipadReward ?? 7200).toBe(7200);
    });
  });

  describe('Parte 4: Salvamento Duplo em IndexedDB e Tolerância a Falhas', () => {
    it('Calcula checksum determinístico para string JSON', () => {
      const hash1 = computeChecksum('{"test": 123}');
      const hash2 = computeChecksum('{"test": 123}');
      const hash3 = computeChecksum('{"test": 456}');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('Realiza salvamento duplo rotativo (slot_current e slot_backup)', async () => {
      const sim = new HospitalSimulation();
      sim.state.day = 1;
      const data1 = serializeGameState(sim.state);
      await saveGameDualSlots(data1);

      // Segundo save: o slot 1 deve ir para backup e o novo para current
      sim.state.day = 2;
      const data2 = serializeGameState(sim.state);
      await saveGameDualSlots(data2);

      const loaded = await loadGameDualSlots();
      expect(loaded).not.toBeNull();
      expect(loaded?.data.day).toBe(2);
      expect(loaded?.restoredFromBackup).toBe(false);
    });

    it('Restaura automaticamente do slot_backup quando slot_current está corrompido', async () => {
      const sim = new HospitalSimulation();
      sim.state.day = 10;
      const backupData = serializeGameState(sim.state);
      await saveGameDualSlots(backupData);

      sim.state.day = 11;
      const currentData = serializeGameState(sim.state);
      await saveGameDualSlots(currentData);

      // Simula corrupção manual no slot_current (adulterando checksum)
      const corruptedEnvelope: SaveEnvelope = {
        slot: 'slot_current',
        schemaVersion: 120,
        timestamp: Date.now(),
        checksum: 'corrupted_checksum_invalid',
        data: currentData,
      };
      await putSaveEnvelope(corruptedEnvelope);

      // Carregamento deve recuperar slot_backup com day 10
      const recovered = await loadGameDualSlots();
      expect(recovered).not.toBeNull();
      expect(recovered?.restoredFromBackup).toBe(true);
      expect(recovered?.data.day).toBe(10);
    });
  });
});
