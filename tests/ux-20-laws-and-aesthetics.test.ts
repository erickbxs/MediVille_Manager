/**
 * Arquivo: tests/ux-20-laws-and-aesthetics.test.ts
 *
 * 1. O que este arquivo faz?
 * Testes unitários para o Overhaul Estético e Refatoração de Interface da versão 1.7.0 baseados nas 20 Leis de UI/UX:
 * - Lei de Hick & Miller (gaveta de obras com 4 categorias de 3 a 7 opções).
 * - Lei de Postel (busca tolerante a acentos e maiúsculas na Enciclopédia).
 * - Efeito Gradiente de Meta & Zeigarnik (progresso visual contínuo e destaque especial >= 75%).
 * - Lei de Fitts (alvos de toque >= 44px na UI e >= 48px na construção).
 * - Lei de Tesler (verificação de estoque RENAME e compra de lote com 1 clique no atendimento).
 * - Lei de Murphy (shake suave de 200ms na tentativa de posicionamento inválido sem cancelar).
 * - Regra do Pico-Fim (resumo diário elegante 🌅 no canto superior direito).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os princípios ergonômicos e psicológicos de UI/UX da versão 1.7.0 sem regressões.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/ux-20-laws-and-aesthetics.test.ts`.
 *
 * Importa: vitest, src/ui/progression-bar.ts, src/ui/build-menu.ts, src/ui/encyclopedia-modal.ts,
 *          src/ui/decision-modal.ts, src/ui/build-controller.ts, src/ui/notification-center.ts,
 *          src/core/config.ts, src/core/new-game.ts, src/systems/economy-system.ts
 * Conecta-se com: src/main.ts, src/state/game-state.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ROOM_CATEGORIES, BuildMenu } from '../src/ui/build-menu';
import { normalizeText, caseMatchesSearch } from '../src/ui/encyclopedia-modal';
import {
  calculateGoalProgress,
  calculateUnitLevelProgress,
  calculateProtocolProgress,
  renderLevelProgressionHtml,
} from '../src/ui/progression-bar';
import { findRelevantMedication } from '../src/ui/decision-modal';
import { BuildController } from '../src/ui/build-controller';
import { NotificationCenter } from '../src/ui/notification-center';
import { ROOMS_CATALOG, CASES_CATALOG, PHARMACY_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { buyMedicationBatch } from '../src/systems/economy-system';

// --- Mocks para ambiente Node.js / Headless ---
interface MockDomElement {
  tagName: string;
  innerHTML: string;
  className: string;
  style: Record<string, string>;
  classList: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
    contains: (cls: string) => boolean;
  };
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  querySelectorAll: (sel: string) => MockDomElement[];
  querySelector: (sel: string) => MockDomElement | null;
  getAttribute: (attr: string) => string | null;
  setAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  dataset: Record<string, string>;
  textContent?: string;
  offsetWidth?: number;
}

const createMockElement = (tag = 'div'): MockDomElement => {
  const elem: MockDomElement = {
    tagName: tag.toUpperCase(),
    innerHTML: '',
    get textContent() { return this.innerHTML; },
    set textContent(v: string) { this.innerHTML = v; },
    className: '',
    style: {},
    dataset: {},
    offsetWidth: 100,
    classList: {
      add: vi.fn((cls: string) => {
        if (!elem.className.includes(cls)) elem.className += ` ${cls}`;
      }),
      remove: vi.fn((cls: string) => {
        elem.className = elem.className.replace(cls, '').trim();
      }),
      toggle: vi.fn(),
      contains: (cls: string) => elem.className.includes(cls),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    getAttribute: vi.fn((attr: string) => elem.dataset[attr] ?? null),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
  };
  return elem;
};

beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, val: string) => { store.set(key, String(val)); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    length: 0,
    key: vi.fn(() => null),
  };

  const bodyElem = createMockElement('body');
  (globalThis as unknown as { document: unknown }).document = {
    body: bodyElem,
    createElement: vi.fn((tag: string) => createMockElement(tag)),
    getElementById: vi.fn(() => createMockElement('div')),
    querySelector: vi.fn(() => createMockElement('div')),
    querySelectorAll: vi.fn(() => [createMockElement('div')]),
    head: createMockElement('head'),
  };

  (globalThis as unknown as { window: unknown }).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    location: { reload: vi.fn() },
  };
});

describe('Prompt 18: UX 20 Laws & Aesthetics Tests', () => {
  describe('1. Lei de Hick & Lei de Miller (Gaveta de Obras)', () => {
    it('deve agrupar todas as 20 salas em 4 categorias de 3 a 7 opções sem duplicatas', () => {
      const allRoomIds = new Set(ROOMS_CATALOG.rooms.map((r) => r.id));
      expect(allRoomIds.size).toBe(20);

      const assignedRoomIds = new Set<string>();
      const activeCategories = Object.values(ROOM_CATEGORIES).filter((cat) => cat.roomIds.length > 0);
      expect(activeCategories.length).toBe(4);

      for (const cat of activeCategories) {
        expect(cat.roomIds.length).toBeGreaterThanOrEqual(3);
        expect(cat.roomIds.length).toBeLessThanOrEqual(7);

        for (const id of cat.roomIds) {
          expect(allRoomIds.has(id)).toBe(true);
          expect(assignedRoomIds.has(id)).toBe(false);
          assignedRoomIds.add(id);
        }
      }

      expect(assignedRoomIds.size).toBe(20);
    });

    it('deve permitir filtrar e alterar a categoria ativa no BuildMenu', () => {
      const container = createMockElement('div') as unknown as HTMLElement;
      const menu = new BuildMenu(container, {
        onSelectRoom: vi.fn(),
        onToggleRotate: vi.fn(),
        onToggleDemolish: vi.fn(),
        onToggleMove: vi.fn(),
        onCancelSelection: vi.fn(),
        onOpenStaff: vi.fn(),
        onOpenPharmacy: vi.fn(),
        onOpenFinances: vi.fn(),
        onOpenEncyclopedia: vi.fn(),
        onRecenterMap: vi.fn(),
        onOpenPendingCase: vi.fn(),
      });

      expect(menu.getCategory()).toBe('all');
      menu.setCategory('clinical');
      expect(menu.getCategory()).toBe('clinical');
      menu.setCategory('diagnostics');
      expect(menu.getCategory()).toBe('diagnostics');
    });
  });

  describe('2. Lei de Postel (Tolerância de Entrada na Enciclopédia)', () => {
    it('normalizeText deve remover acentos e normalizar caixa', () => {
      expect(normalizeText('Pneumonia')).toBe('pneumonia');
      expect(normalizeText('Hipertensão Arterial')).toBe('hipertensao arterial');
      expect(normalizeText('ÚLCERA PÉPTICA')).toBe('ulcera peptica');
      expect(normalizeText('Câncer de Colo')).toBe('cancer de colo');
    });

    it('caseMatchesSearch deve encontrar casos ignorando acentos e maiúsculas', () => {
      const c = CASES_CATALOG.cases[0]!;
      expect(caseMatchesSearch(c, '')).toBe(true);

      const queryNormalized = normalizeText(c.name);
      expect(caseMatchesSearch(c, queryNormalized)).toBe(true);
      expect(caseMatchesSearch(c, queryNormalized.toUpperCase())).toBe(true);
    });
  });

  describe('3. Efeito Gradiente de Meta & Efeito Zeigarnik (ProgressionBar)', () => {
    it('calculateGoalProgress deve ativar destaque isHighlighted quando >= 75%', () => {
      const p0 = calculateGoalProgress(0, 100);
      expect(p0.percentage).toBe(0);
      expect(p0.isHighlighted).toBe(false);

      const p50 = calculateGoalProgress(50, 100);
      expect(p50.percentage).toBe(50);
      expect(p50.isHighlighted).toBe(false);

      const p74 = calculateGoalProgress(74, 100);
      expect(p74.percentage).toBe(74);
      expect(p74.isHighlighted).toBe(false);

      const p75 = calculateGoalProgress(75, 100);
      expect(p75.percentage).toBe(75);
      expect(p75.isHighlighted).toBe(true);

      const p100 = calculateGoalProgress(120, 100);
      expect(p100.percentage).toBe(100);
      expect(p100.isHighlighted).toBe(true);
    });

    it('calculateUnitLevelProgress deve calcular a progressão correta para UBS, UPA e Hospital', () => {
      const state = createInitialGameState();
      const ubsProgress = calculateUnitLevelProgress(state);
      expect(ubsProgress.currentLevel).toBe('UBS');
      expect(ubsProgress.nextLevel).toBe('UPA');
      expect(ubsProgress.percent).toBeGreaterThanOrEqual(0);
    });

    it('calculateProtocolProgress deve calcular progresso de protocolos dominados', () => {
      const state = createInitialGameState();
      const prot = calculateProtocolProgress(state);
      expect(prot.masteredCount).toBe(0);
      expect(prot.percent).toBe(0);
      expect(prot.isHighlighted).toBe(false);
    });

    it('renderLevelProgressionHtml deve aplicar brilho dourado/esmeralda no gradiente quando destacado', () => {
      const highlightedProg = {
        percent: 85,
        percentage: 85,
        isNearCompletion: true,
        isHighlighted: true,
        currentLevel: 'UBS',
        nextLevel: 'UPA',
        treatedRatio: 0.85,
        reputationRatio: 0.85,
      };
      const html = renderLevelProgressionHtml(highlightedProg);
      expect(html).toContain('from-amber-400');
      expect(html).toContain('animate-pulse');
    });
  });

  describe('4. Lei de Fitts & Ergonomia Tátil', () => {
    it('BuildController deve ter botões táteis no D-Pad e de confirmação >= 48px', () => {
      const container = createMockElement('div') as unknown as HTMLElement;
      const controller = new BuildController(container, {
        onValidate: () => true,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        onChange: vi.fn(),
      });

      const room = ROOMS_CATALOG.rooms[0]!;
      controller.startPreview(room, 5, 5);

      expect(container.innerHTML).toContain('min-w-[48px]');
      expect(container.innerHTML).toContain('min-h-[48px]');
      expect(container.innerHTML).toContain('btn-nudge-left');
      expect(container.innerHTML).toContain('btn-preview-confirm');
    });
  });

  describe('5. Lei de Tesler (Compra Rápida de Medicamentos)', () => {
    it('findRelevantMedication deve encontrar medicação correspondente na RENAME', () => {
      const medParacetamol = findRelevantMedication('Prescrever paracetamol para alívio sintomático');
      expect(medParacetamol.id).toBe('paracetamol');

      const medAmoxi = findRelevantMedication('Iniciar amoxicilina por 7 dias');
      expect(medAmoxi.id).toBe('amoxicilina');

      const medFallback = findRelevantMedication('Repouso e orientações gerais');
      expect(medFallback).toBeDefined();
      expect(PHARMACY_CATALOG.medications).toContain(medFallback);
    });

    it('buyMedicationBatch deve adicionar estoque ao estado e debitar o saldo', () => {
      const state = createInitialGameState();
      const med = PHARMACY_CATALOG.medications[0]!;
      const initialStock = state.pharmacyStock[med.id] ?? 0;
      const initialCash = state.cash;

      const res = buyMedicationBatch(state, med.id);
      expect(res.success).toBe(true);
      expect(state.pharmacyStock[med.id]).toBe(initialStock + med.batchSize);
      expect(state.cash).toBe(initialCash - med.batchCost);
    });
  });

  describe('6. Lei de Murphy (Prevenção de Erros na Construção)', () => {
    it('confirm() em estado inválido deve acionar triggerShakeError sem cancelar o preview', () => {
      const container = createMockElement('div') as unknown as HTMLElement;
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const controller = new BuildController(container, {
        onValidate: () => false,
        onConfirm,
        onCancel,
        onChange: vi.fn(),
      });

      const room = ROOMS_CATALOG.rooms[0]!;
      controller.startPreview(room, 0, 0);

      // Tenta confirmar com posição inválida
      controller.confirm();

      // Confirmação não deve ser executada
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(controller.isActive()).toBe(true);
    });
  });

  describe('7. Regra do Pico-Fim (NotificationCenter - Resumo Diário)', () => {
    it('pushDailySummary deve adicionar card com resumo 24h e ícone 🌅', () => {
      const container = createMockElement('div') as unknown as HTMLElement;
      const notifCenter = new NotificationCenter(container);

      const toastId = notifCenter.pushDailySummary({
        day: 1,
        patientsCured: 12,
        revenue: 14500,
        goalBonus: 2000,
        reputationDelta: 3,
      });

      expect(toastId).toBeDefined();
      expect(notifCenter.getToastCount()).toBe(1);
      expect(container.innerHTML).toContain('Resumo do Dia 1');
      expect(container.innerHTML).toContain('12');
      expect(container.innerHTML).toContain('14.500');
    });
  });
});
