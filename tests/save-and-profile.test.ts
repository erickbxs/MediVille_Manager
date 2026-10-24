/**
 * Arquivo: tests/save-and-profile.test.ts
 * O que faz: Testa o sistema de salvamento (serialização/desserialização, exportação e importação JSON) e a verificação neutra de idade/privacidade da Fase 3.
 * Para que foi criado: Garantir que o progresso do jogador nunca seja corrompido e que as diretrizes do GDD de proteção a menores sejam respeitadas.
 * Como modificar/debugar: Execute `npx vitest run tests/save-and-profile.test.ts`.
 * Importa: vitest, src/core/simulation.ts, src/systems/save-system.ts, src/systems/player-profile.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import {
  serializeGameState,
  deserializeGameState,
  exportSaveJson,
  importSaveJson,
} from '../src/systems/save-system';
import {
  savePlayerAgeVerification,
  getPlayerProfile,
  isAgeVerificationRequired,
} from '../src/systems/player-profile';

const memoryStore = new Map<string, string>();

const storageMock = {
  getItem: (key: string): string | null => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
  },
  clear: (): void => {
    memoryStore.clear();
  },
  key: () => null,
  length: 0,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
});

describe('Fase 3: Sistema de Salvamento & Perfil de Privacidade', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('serializa e desserializa o estado do jogo mantendo todas as entidades e valores intactos', () => {
    const sim = new HospitalSimulation();
    sim.state.cash = 150000;
    sim.state.reputation = 75;
    sim.state.day = 4;

    const serialized = serializeGameState(sim.state);
    expect(serialized.cash).toBe(150000);
    expect(serialized.reputation).toBe(75);
    expect(serialized.day).toBe(4);
    expect(serialized.rooms.length).toBe(sim.state.rooms.size);
    expect(serialized.staff.length).toBe(sim.state.staff.size);

    const restored = deserializeGameState(serialized);
    expect(restored.cash).toBe(150000);
    expect(restored.reputation).toBe(75);
    expect(restored.day).toBe(4);
    expect(restored.rooms.size).toBe(sim.state.rooms.size);
    expect(restored.staff.size).toBe(sim.state.staff.size);
  });

  it('exporta backup JSON válido e importa com fidelidade total', () => {
    const sim = new HospitalSimulation();
    sim.state.cash = 99999;
    sim.state.hospitalLevel = 'upa';

    const jsonStr = exportSaveJson(sim.state);
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('99999');

    const imported = importSaveJson(jsonStr);
    expect(imported).not.toBeNull();
    expect(imported?.cash).toBe(99999);
    expect(imported?.hospitalLevel).toBe('upa');
  });

  it('rejeita JSON corrompido ou sem estrutura na importação', () => {
    const corrupted = '{"invalid": true, "corrupted": 123}';
    const result = importSaveJson(corrupted);
    expect(result).toBeNull();

    const notJson = 'invalid_string_not_json';
    const resultInvalid = importSaveJson(notJson);
    expect(resultInvalid).toBeNull();
  });

  it('classifica jogadores menores de 13 anos automaticamente no Modo Convidado local', () => {
    const currentYear = new Date().getFullYear();
    const minorBirthYear = currentYear - 10; // 10 anos de idade

    const profile = savePlayerAgeVerification(minorBirthYear);
    expect(profile.isUnderAge).toBe(true);
    expect(profile.guestMode).toBe(true);

    const stored = getPlayerProfile();
    expect(stored?.guestMode).toBe(true);
    expect(isAgeVerificationRequired()).toBe(false);
  });

  it('permite modo padrão para jogadores maiores ou iguais a 13 anos', () => {
    const currentYear = new Date().getFullYear();
    const adultBirthYear = currentYear - 20; // 20 anos de idade

    const profile = savePlayerAgeVerification(adultBirthYear);
    expect(profile.isUnderAge).toBe(false);
    expect(profile.guestMode).toBe(false);

    const stored = getPlayerProfile();
    expect(stored?.guestMode).toBe(false);
  });
});
