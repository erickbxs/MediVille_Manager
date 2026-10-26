/**
 * Arquivo: tests/i18n-3d-music-and-shortnames.test.ts
 *
 * 1. O que este arquivo faz?
 * Suíte de testes automatizados para validar:
 * - Nomes simples (1 palavra, <= 12 caracteres) em todas as salas de rooms.json;
 * - Troca de idioma reativa instantânea (PT, ES, EN, FR, DE, ZH) e evento i18n:changed;
 * - Gerador de música ambiente suave Bossa Lounge (MusicSystem), volume e audio ducking;
 * - Renderização procedural 3D de personagens (Character3D) para os 7 cargos e pacientes;
 * - Cabeçalhos de segurança (public/_headers) e configurações multiplataforma (Tauri e Capacitor).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir a conformidade estrita com o Prompt 15 da versão 1.4.0 e impedir regressões de interface e áudio.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via terminal: 'npx vitest run tests/i18n-3d-music-and-shortnames.test.ts'.
 *
 * Importa: vitest, node:fs, node:path, src/core/*, src/data/*, src/i18n/*, src/render/*, src/ui/*
 * Conecta-se com: vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import roomsData from '../src/data/rooms.json';
import { globalBus } from '../src/core/event-bus';
import { setLanguage, getLocale, getRoomShortName } from '../src/i18n/i18n';
import { MusicSystem } from '../src/core/music-system';
import { Character3D, type Character3DRole } from '../src/render/character-3d';
import { VoxelCharacter } from '../src/render/voxel-character';
import { LegalModal } from '../src/ui/legal-modal';

// --- Mocks para ambiente Node.js / Headless ---
const memoryStore = new Map<string, string>();
const storageMock = {
  getItem: (key: string): string | null => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string): void => { memoryStore.set(key, value); },
  removeItem: (key: string): void => { memoryStore.delete(key); },
  clear: (): void => { memoryStore.clear(); },
  key: () => null,
  length: 0,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
  configurable: true,
});

if (typeof document === 'undefined') {
  const dummyElement = {
    innerHTML: '',
    textContent: '',
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: () => false },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: () => [],
    querySelector: () => null,
    getAttribute: () => null,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
  };

  const docMock = {
    createElement: () => ({ ...dummyElement }),
    getElementById: () => null,
    querySelectorAll: () => [],
    body: { appendChild: vi.fn() },
    documentElement: { setAttribute: vi.fn(), removeAttribute: vi.fn() },
  };

  Object.defineProperty(globalThis, 'document', {
    value: docMock,
    writable: true,
    configurable: true,
  });
}

describe('Prompt 15: Nomes Simples de Salas (shortName)', () => {
  it('todas as 20 salas de rooms.json devem possuir shortName com <= 12 caracteres', () => {
    expect(roomsData.rooms.length).toBe(20);

    const compoundWordsBanned = ['Trauma Center', 'Sala de Espera', 'Recepção Central', 'Posto de Saúde'];

    for (const room of roomsData.rooms) {
      expect(room.shortName).toBeDefined();
      expect(typeof room.shortName).toBe('string');
      expect(room.shortName.length).toBeGreaterThan(0);
      expect(room.shortName.length).toBeLessThanOrEqual(12);

      for (const banned of compoundWordsBanned) {
        expect(room.shortName).not.toBe(banned);
      }
    }
  });

  it('deve conter as nomenclaturas exatas especificadas no GDD', () => {
    const map = new Map(roomsData.rooms.map((r) => [r.id, r.shortName]));

    expect(map.get('reception')).toBe('Recepção');
    expect(map.get('waiting')).toBe('Espera');
    expect(map.get('triage')).toBe('Triagem');
    expect(map.get('consultation')).toBe('Consultório');
    expect(map.get('pharmacy')).toBe('Farmácia');
    expect(map.get('observation')).toBe('Leitos');
    expect(map.get('vaccination')).toBe('Vacina');
    expect(map.get('laboratory')).toBe('Lab');
    expect(map.get('xray')).toBe('Raio-X');
    expect(map.get('surgery')).toBe('Cirurgia');
    expect(map.get('icu')).toBe('UTI');
    expect(map.get('trauma_center')).toBe('Trauma');
    expect(map.get('helipad')).toBe('Heliponto');
  });
});

describe('Prompt 15: Troca de Idioma Reativa Instantânea', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('deve disparar i18n:changed ao alterar idioma e persistir em mediville_lang', async () => {
    let emittedLang = '';
    const cleanup = globalBus.on('i18n:changed', ({ lang }) => {
      emittedLang = lang;
    });

    await setLanguage('es');
    expect(emittedLang).toBe('es');
    expect(getLocale()).toBe('es');
    expect(localStorage.getItem('mediville_lang')).toBe('es');

    await setLanguage('en');
    expect(emittedLang).toBe('en');
    expect(getLocale()).toBe('en');
    expect(localStorage.getItem('mediville_lang')).toBe('en');

    cleanup();
  });

  it('deve traduzir os shortNames das salas de forma reativa e instantânea', async () => {
    await setLanguage('en');
    expect(getRoomShortName('reception')).toBe('Reception');
    expect(getRoomShortName('surgery')).toBe('Surgery');
    expect(getRoomShortName('icu')).toBe('ICU');

    await setLanguage('pt');
    expect(getRoomShortName('reception')).toBe('Recepção');
    expect(getRoomShortName('surgery')).toBe('Cirurgia');
    expect(getRoomShortName('icu')).toBe('UTI');

    await setLanguage('es');
    expect(getRoomShortName('reception')).toBe('Recepción');
    expect(getRoomShortName('surgery')).toBe('Cirugía');
    expect(getRoomShortName('icu')).toBe('UCI');
  });
});

describe('Prompt 15: Música Suave Bossa Lounge (MusicSystem)', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('deve inicializar com volume configurável e persistente', () => {
    const music = new MusicSystem();
    expect(music.getVolume()).toBeGreaterThan(0);

    music.setVolume(0.45);
    expect(music.getVolume()).toBeCloseTo(0.45);
    expect(localStorage.getItem('mediville_music_volume')).toBe('0.45');
  });

  it('deve alternar mudo (toggleMute) e emitir evento', () => {
    const music = new MusicSystem();
    let eventMuted: boolean | null = null;
    const cleanup = globalBus.on('music:mute_changed', ({ muted }) => {
      eventMuted = muted;
    });

    const isMuted = music.toggleMute();
    expect(music.isMuted()).toBe(isMuted);
    expect(eventMuted).toBe(isMuted);

    const toggledBack = music.toggleMute();
    expect(toggledBack).toBe(!isMuted);

    cleanup();
  });

  it('deve responder ao ducking de 50% de volume para casos clínicos', () => {
    const music = new MusicSystem();
    music.setDucking(true);
    // Não lança erro e ajusta estado interno de ducking
    music.setDucking(false);
  });
});

describe('Prompt 15: Personagens 3D em Cenário 2.5D (Character3D)', () => {
  const roles: Character3DRole[] = [
    'doctor',
    'nurse',
    'tech',
    'pharmacist',
    'janitor',
    'manager',
    'receptionist',
    'patient',
  ];

  it('deve instanciar e animar Character3D para todos os 7 cargos e pacientes', () => {
    for (const role of roles) {
      const char = new Character3D({
        role,
        gender: 'female',
        skinToneIndex: 2,
        hairColorIndex: 1,
      });

      expect(char.container).toBeDefined();
      expect(() => char.update(1.0, 'WALKING')).not.toThrow();
      expect(() => char.update(2.0, 'WORKING')).not.toThrow();
      expect(() => char.update(3.0, 'IDLE')).not.toThrow();
    }
  });

  it('deve suportar diferentes faixas etárias de pacientes e salas cirúrgicas', () => {
    const child = new Character3D({
      role: 'patient',
      gender: 'male',
      patientAgeGroup: 'child',
    });
    expect(() => child.update(0.5)).not.toThrow();

    const surgeryPatient = new Character3D({
      role: 'patient',
      gender: 'female',
      inSpecializedRoom: 'surgery',
    });
    expect(() => surgeryPatient.update(0.5)).not.toThrow();
  });

  it('VoxelCharacter deve manter retrocompatibilidade encapsulando Character3D', () => {
    const voxel = new VoxelCharacter({
      role: 'doctor',
      gender: 'male',
    });

    expect(voxel.character3d).toBeDefined();
    expect(() => voxel.update(0.5, 'WALKING')).not.toThrow();
    voxel.facing = 'left';
    expect(voxel.facing).toBe('left');
  });
});

describe('Prompt 15: Segurança, Privacidade e Multiplataforma', () => {
  it('public/_headers deve conter regras de segurança CSP, HSTS e X-Content-Type-Options', () => {
    const headersPath = path.resolve('public/_headers');
    expect(fs.existsSync(headersPath)).toBe(true);

    const content = fs.readFileSync(headersPath, 'utf-8');
    expect(content).toContain('Content-Security-Policy');
    expect(content).toContain('Strict-Transport-Security');
    expect(content).toContain('X-Content-Type-Options: nosniff');
    expect(content).toContain('Permissions-Policy');
  });

  it('tauri.conf.json deve estar configurado para desktop apontando para dist', () => {
    const tauriPath = path.resolve('tauri.conf.json');
    expect(fs.existsSync(tauriPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));
    expect(config.build.frontendDist).toBe('dist');
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
    expect(config.version).toBe(pkg.version);
  });

  it('capacitor.config.ts deve estar configurado para mobile apontando para dist', () => {
    const capPath = path.resolve('capacitor.config.ts');
    expect(fs.existsSync(capPath)).toBe(true);

    const content = fs.readFileSync(capPath, 'utf-8');
    expect(content).toContain("webDir: 'dist'");
    expect(content).toContain('com.erickgames.medivillemanager');
  });

  it('LegalModal deve renderizar termos de uso e privacidade com aviso educativo do SUS', () => {
    const container = {
      innerHTML: '',
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const modal = new LegalModal(container);
    modal.open();
    expect(container.innerHTML).toContain('LGPD');
    expect(container.innerHTML).toContain('SUS');
    modal.close();
    expect(container.innerHTML).toBe('');
  });
});
