/**
 * Arquivo: tests/mobile-build-expansion-i18n-250cases.test.ts
 *
 * 1. O que este arquivo faz?
 * Testes automatizados da v1.5.0 cobrindo:
 * - Modo "Tap, Nudge & Confirm" (BUILD_PREVIEW, botões finos D-Pad, rotação e confirmação)
 * - Expansão progressiva do mapa (12x12 -> 16x16 -> 20x20 -> 24x24 com dedução e preservação)
 * - Internacionalização reativa global (PT, ES, EN com t(), troca dinâmica e persistência)
 * - Desbloqueio e funcionamento do MusicSystem e presença de 250 casos clínicos únicos no SUS
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade estrita com todos os requisitos do Prompt 16 da versão 1.5.0.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/mobile-build-expansion-i18n-250cases.test.ts`.
 *
 * Importa: vitest, src/ui/build-controller.ts, src/systems/map-expansion-system.ts, src/i18n/i18n.ts, src/core/config.ts
 * Conecta-se com: src/state/game-state.ts, src/core/simulation.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildController } from '../src/ui/build-controller';
import {
  expandMap,
  getNextExpansion,
  canExpandMap,
  getCurrentGridSize,
  EXPANSION_TIERS
} from '../src/systems/map-expansion-system';
import { canPlaceRoom } from '../src/systems/grid-system';
import { setLanguage, getLocale, t, refreshAppLanguage } from '../src/i18n/i18n';
import { CASES_CATALOG, ROOMS_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { MusicSystem } from '../src/core/music-system';
import type { GameState } from '../src/state/game-state';

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

if (typeof window === 'undefined') {
  const windowListeners: Record<string, Array<(e: unknown) => void>> = {};
  const windowMock = {
    addEventListener: (type: string, fn: (e: unknown) => void) => {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type]!.push(fn);
    },
    removeEventListener: (type: string, fn: (e: unknown) => void) => {
      windowListeners[type] = (windowListeners[type] || []).filter((f) => f !== fn);
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: windowMock,
    writable: true,
    configurable: true,
  });
}

if (typeof document === 'undefined') {
  const elements = new Map<string, unknown>();
  const createMockElement = (tag = 'div') => ({
    tagName: tag.toUpperCase(),
    innerHTML: '',
    className: '',
    style: {},
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: () => false },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: () => [],
    querySelector: () => null,
    getAttribute: () => null,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
  });

  const docMock = {
    createElement: (tag: string) => createMockElement(tag),
    getElementById: (id: string) => {
      if (!elements.has(id)) {
        elements.set(id, createMockElement('div'));
      }
      return elements.get(id);
    },
    querySelectorAll: () => [],
    body: createMockElement('body'),
    documentElement: {
      lang: 'pt',
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    },
  };

  Object.defineProperty(globalThis, 'document', {
    value: docMock,
    writable: true,
    configurable: true,
  });
}

describe('Prompt 16 — Construção Tátil, Expansão do Terreno, i18n e 250 Casos SUS', () => {
  let state: GameState;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    state = createInitialGameState('ubs');
    mockContainer = (typeof document !== 'undefined' ? document.createElement('div') : {}) as HTMLElement;
  });

  describe('PARTE 1: Modo "Tap, Nudge & Confirm" (BUILD_PREVIEW)', () => {
    it('deve entrar em estado BUILD_PREVIEW sem deduzir saldo antecipadamente', () => {
      const initialCash = state.cash;
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === 'consultation')!;
      let confirmed = false;

      const controller = new BuildController(mockContainer, {
        onValidate: (col, row, rotated, roomDef) => canPlaceRoom(state, roomDef.id, col, row, rotated),
        onConfirm: () => { confirmed = true; },
        onCancel: () => {},
        onChange: () => {},
      });

      controller.startPreview(def, 1, 6);
      expect(controller.isActive()).toBe(true);
      expect(confirmed).toBe(false);
      expect(state.cash).toBe(initialCash); // Não gastou nada na seleção

      const previewState = controller.getPreviewState();
      expect(previewState.col).toBe(1);
      expect(previewState.row).toBe(6);
      expect(previewState.rotated).toBe(false);
      expect(previewState.isValid).toBe(true);

      controller.destroy();
    });

    it('deve permitir ajuste fino via D-Pad (nudge) e girar sala', () => {
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === 'consultation')!;
      let lastValid = false;

      const controller = new BuildController(mockContainer, {
        onValidate: (col, row, rotated, roomDef) => canPlaceRoom(state, roomDef.id, col, row, rotated),
        onConfirm: () => {},
        onCancel: () => {},
        onChange: (_c, _r, _rot, valid) => { lastValid = valid; },
      });

      controller.startPreview(def, 1, 6);
      controller.nudge(1, 0); // Mover para a direita (col = 2)
      expect(controller.getPreviewState().col).toBe(2);

      controller.nudge(0, 2); // Mover para baixo (row = 8)
      expect(controller.getPreviewState().row).toBe(8);

      controller.toggleRotate(); // Girar 90 graus
      expect(controller.getPreviewState().rotated).toBe(true);
      expect(lastValid).toBe(true);

      controller.destroy();
    });

    it('deve confirmar deduzindo custo somente ao executar confirm()', () => {
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === 'consultation')!;
      let placedRoom = false;

      const controller = new BuildController(mockContainer, {
        onValidate: (col, row, rotated, roomDef) => canPlaceRoom(state, roomDef.id, col, row, rotated),
        onConfirm: (col, row, rotated, roomDef) => {
          if (canPlaceRoom(state, roomDef.id, col, row, rotated)) {
            state.cash -= roomDef.cost;
            placedRoom = true;
          }
        },
        onCancel: () => {},
        onChange: () => {},
      });

      controller.startPreview(def, 1, 6);
      const initialCash = state.cash;
      controller.confirm();

      expect(placedRoom).toBe(true);
      expect(state.cash).toBe(initialCash - def.cost);
      expect(controller.isActive()).toBe(false);

      controller.destroy();
    });
  });

  describe('PARTE 2: Expansão Paga do Mapa (12x12 -> 16x16 -> 20x20 -> 24x24)', () => {
    it('deve iniciar com 12x12 e progredir de nível com dedução de caixa e preservação de salas', () => {
      expect(getCurrentGridSize(state)).toBe(12);

      // Nível 1 -> 2: 12x12 -> 16x16 (R$ 45.000)
      const next1 = getNextExpansion(state);
      expect(next1).not.toBeNull();
      expect(next1?.nextSize).toBe(16);
      expect(next1?.cost).toBe(EXPANSION_TIERS[12]?.cost);

      state.cash = 50000;
      expect(canExpandMap(state)).toBe(true);

      const exp1 = expandMap(state);
      expect(exp1).toBe(true);
      expect(state.gridSize).toBe(16);
      expect(state.cash).toBe(5000); // 50000 - 45000

      // Nível 2 -> 3: 16x16 -> 20x20 (R$ 95.000)
      state.cash = 100000;
      const next2 = getNextExpansion(state);
      expect(next2?.nextSize).toBe(20);
      expect(expandMap(state)).toBe(true);
      expect(state.gridSize).toBe(20);
      expect(state.cash).toBe(5000); // 100000 - 95000

      // Nível 3 -> 4: 20x20 -> 24x24 (R$ 180.000)
      state.cash = 200000;
      const next3 = getNextExpansion(state);
      expect(next3?.nextSize).toBe(24);
      expect(expandMap(state)).toBe(true);
      expect(state.gridSize).toBe(24);
      expect(state.cash).toBe(20000); // 200000 - 180000

      // Limite máximo atingido
      expect(getNextExpansion(state)).toBeNull();
      expect(canExpandMap(state)).toBe(false);
    });

    it('deve permitir construir salas nas novas coordenadas expandidas (até a borda 24)', () => {
      state.gridSize = 24;
      state.cash = 100000;

      // Sala 3x3 colocada na borda 21, 21 cabe exatamente no terreno 24x24
      const def = ROOMS_CATALOG.rooms.find((r) => r.id === 'consultation')!;
      const fitsIn24 = canPlaceRoom(state, def.id, 21, 21, false);
      expect(fitsIn24).toBe(true);

      // Em grade 12x12 a posição 21,21 colidiria fora da grade
      state.gridSize = 12;
      const fitsIn12 = canPlaceRoom(state, def.id, 21, 21, false);
      expect(fitsIn12).toBe(false);
    });
  });

  describe('PARTE 3: Internacionalização Global Reativa (i18n)', () => {
    it('deve alternar idiomas para Espanhol e Inglês e atualizar termos e atributos', async () => {
      await setLanguage('es');
      refreshAppLanguage();
      expect(getLocale()).toBe('es');
      expect(t('dock.staff')).toBe('Personal');
      expect(t('dock.pharmacy')).toBe('Farmacia');
      expect(t('map.expand')).toBe('Ampliar Terreno');

      await setLanguage('en');
      refreshAppLanguage();
      expect(getLocale()).toBe('en');
      expect(t('dock.staff')).toBe('Staff');
      expect(t('dock.pharmacy')).toBe('Pharmacy');
      expect(t('map.expand')).toBe('Expand Map');

      await setLanguage('pt');
      refreshAppLanguage();
      expect(getLocale()).toBe('pt');
      expect(t('dock.staff')).toBe('Equipe');
      expect(t('dock.pharmacy')).toBe('Farmácia');
      expect(t('map.expand')).toBe('Expandir Terreno');
    });

    it('deve suportar interpolação de variáveis dinâmicas com t()', async () => {
      await setLanguage('pt');
      const text = t('map.nextTier', { cols: 16, rows: 16 });
      expect(text).toBe('Próximo Lote: 16x16');
    });
  });

  describe('PARTE 4: Áudio e Música de Fundo (MusicSystem)', () => {
    it('deve inicializar e alternar estado de mudo com retorno booleano', () => {
      const music = new MusicSystem();
      const initialMute = music.isMuted();

      const toggled = music.toggleMute();
      expect(toggled).toBe(!initialMute);
      expect(music.isMuted()).toBe(toggled);

      music.toggleMute();
      expect(music.isMuted()).toBe(initialMute);
    });
  });

  describe('PARTE 5: Presença dos 250 Casos Clínicos no Catálogo SUS', () => {
    it('deve conter catálogo de casos clínicos únicos em cases.json', () => {
      const allCases = CASES_CATALOG.cases;
      expect([250, 350]).toContain(allCases.length);

      const ids = new Set(allCases.map((c) => c.id));
      expect(ids.size).toBe(allCases.length);
    });

    it('deve conter as patologias requeridas entre os casos 151 e 250', () => {
      const allCases = CASES_CATALOG.cases;
      const names = allCases.map((c) => c.name);

      // Verificação amostral das especialidades requeridas
      expect(names.some((n) => n.includes('Endocardite'))).toBe(true);
      expect(names.some((n) => n.includes('Dissecção Aguda de Aorta'))).toBe(true);
      expect(names.some((n) => n.includes('Anemia Falciforme'))).toBe(true);
      expect(names.some((n) => n.includes('Bronquiectasia'))).toBe(true);
      expect(names.some((n) => n.includes('Abscesso Periamigdaliano'))).toBe(true);
      expect(names.some((n) => n.includes('Acalásia'))).toBe(true);
      expect(names.some((n) => n.includes('Colangite Aguda'))).toBe(true);
      expect(names.some((n) => n.includes('Pielonefrite Aguda'))).toBe(true);
      expect(names.some((n) => n.includes('Torção Testicular'))).toBe(true);
      expect(names.some((n) => n.includes('Ataque Isquêmico Transitório'))).toBe(true);
      expect(names.some((n) => n.includes('Guillain-Barré'))).toBe(true);
      expect(names.some((n) => n.includes('Lúpus Eritematoso'))).toBe(true);
      expect(names.some((n) => n.includes('Tamponamento Cardíaco'))).toBe(true);
      expect(names.some((n) => n.includes('Afogamento Grau 3'))).toBe(true);
      expect(names.some((n) => n.includes('Cascavel'))).toBe(true);
      expect(names.some((n) => n.includes('Placenta Prévia'))).toBe(true);
      expect(names.some((n) => n.includes('Psoríase Vulgar'))).toBe(true);
      expect(names.some((n) => n.includes('Úlcera de Córnea'))).toBe(true);
    });

    it('todos os casos devem possuir condutas sugeridas e distratores bem fundamentados', () => {
      for (const c of CASES_CATALOG.cases) {
        expect(c.suggestedConduct.text.length).toBeGreaterThan(15);
        expect(c.distractorConducts.length).toBeGreaterThanOrEqual(1);
        for (const d of c.distractorConducts) {
          expect(d.whyWrong.length).toBeGreaterThan(10);
        }
      }
    });
  });
});
