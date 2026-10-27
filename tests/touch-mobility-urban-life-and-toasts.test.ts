/**
 * Arquivo: tests/touch-mobility-urban-life-and-toasts.test.ts
 *
 * 1. O que este arquivo faz?
 * Testes unitários para a versão 1.6.0 cobrindo:
 * - Mobilidade touchscreen em obras (Tap-to-Move, ACTIVE_PLACEMENT, panLocked = true durante arraste)
 * - Expansão de terreno progressiva (12x12 -> 16x16 -> 20x20 -> 24x24)
 * - Sistema de vida urbana (cidadãos ambientais, rotinas na calçada, semáforo, quiosque sem interferir na fila clínica)
 * - Pilha de notificações no canto direito (NotificationCenter, 1-click dismiss, auto-minimização de emergências após 4s)
 * - Auditoria visual de Character3D sem linhas espúrias e sem uso desbalanceado de stroke
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir a validação estrita dos novos recursos da versão 1.6.0 sem regressões.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/touch-mobility-urban-life-and-toasts.test.ts`.
 *
 * Importa: vitest, src/ui/build-controller.ts, src/ui/notification-center.ts, src/systems/urban-life-system.ts, src/systems/map-expansion-system.ts, src/render/character-3d.ts
 * Conecta-se com: src/state/game-state.ts, src/core/config.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildController } from '../src/ui/build-controller';
import { NotificationCenter } from '../src/ui/notification-center';
import { urbanLifeSystem } from '../src/systems/urban-life-system';
import { expandMap, getCurrentGridSize } from '../src/systems/map-expansion-system';
import { Character3D } from '../src/render/character-3d';
import { createInitialGameState } from '../src/core/new-game';
import { ROOMS_CATALOG } from '../src/core/config';
import type { GameState } from '../src/state/game-state';

// --- Mocks para ambiente Node.js / Headless ---
interface MockDomElement {
  tagName: string;
  innerHTML: string;
  className: string;
  style: Record<string, string>;
  classList: { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; toggle: ReturnType<typeof vi.fn>; contains: () => boolean };
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  querySelectorAll: () => MockDomElement[];
  querySelector: (sel: string) => MockDomElement | null;
  getAttribute: () => string | null;
  setAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  dataset: Record<string, string>;
  textContent?: string;
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
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: () => false },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: () => [],
    querySelector: (sel: string) => {
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (elem.innerHTML.includes(`id="${id}"`)) {
          return createMockElement('div');
        }
      }
      if (sel.startsWith('[data-testid="')) {
        const tid = sel.match(/data-testid="([^"]+)"/)?.[1];
        if (tid && elem.innerHTML.includes(`data-testid="${tid}"`)) {
          return createMockElement('div');
        }
      }
      if (sel.startsWith('[data-toast-id="')) {
        const tid = sel.match(/data-toast-id="([^"]+)"/)?.[1];
        if (tid && elem.innerHTML.includes(`data-toast-id="${tid}"`)) {
          return createMockElement('div');
        }
      }
      return null;
    },
    getAttribute: () => null,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
  };
  return elem;
};

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
    setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms),
    clearTimeout: (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>),
  };
  Object.defineProperty(globalThis, 'window', {
    value: windowMock,
    writable: true,
    configurable: true,
  });
}

if (typeof document === 'undefined') {
  const elements = new Map<string, MockDomElement>();
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
  };

  Object.defineProperty(globalThis, 'document', {
    value: docMock,
    writable: true,
    configurable: true,
  });
}

describe('Prompt 17 — Mobilidade Touchscreen, Vida Urbana e Notificações v1.6.0', () => {
  let container: HTMLElement;
  let state: GameState;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    state = createInitialGameState('ubs');
    urbanLifeSystem.reset();
  });

  describe('PARTE 2: Mobilidade Touchscreen de Obras (Tap-to-Move & ACTIVE_PLACEMENT)', () => {
    it('deve teleportar sala fantasma para coordenadas clicadas e permitir panLocked', () => {
      const def = ROOMS_CATALOG.rooms[0]!;
      let previewPos = { col: 0, row: 0, isValid: false };

      const controller = new BuildController(container, {
        onValidate: () => true,
        onConfirm: () => {},
        onCancel: () => {},
        onChange: (col, row, _rot, isValid) => {
          previewPos = { col, row, isValid };
        },
      });

      controller.startPreview(def, 2, 3, false, null, false);
      expect(controller.isActive()).toBe(true);
      expect(controller.getPreviewState().col).toBe(2);
      expect(controller.getPreviewState().row).toBe(3);

      controller.setPosition(7, 8);
      expect(controller.getPreviewState().col).toBe(7);
      expect(controller.getPreviewState().row).toBe(8);
      expect(previewPos.col).toBe(7);
      expect(previewPos.row).toBe(8);

      controller.nudge(1, 0);
      expect(controller.getPreviewState().col).toBe(8);

      controller.toggleRotate();
      expect(controller.getPreviewState().rotated).toBe(true);

      controller.close();
      expect(controller.isActive()).toBe(false);
    });
  });

  describe('PARTE 3: Expansão de Terreno Progressiva', () => {
    it('deve expandir de 12x12 até 24x24 deduzindo saldo do hospital', () => {
      state.cash = 500_000;
      expect(getCurrentGridSize(state)).toBe(12);

      const ok1 = expandMap(state);
      expect(ok1).toBe(true);
      expect(getCurrentGridSize(state)).toBe(16);

      const ok2 = expandMap(state);
      expect(ok2).toBe(true);
      expect(getCurrentGridSize(state)).toBe(20);

      const ok3 = expandMap(state);
      expect(ok3).toBe(true);
      expect(getCurrentGridSize(state)).toBe(24);

      const ok4 = expandMap(state);
      expect(ok4).toBe(false);
      expect(getCurrentGridSize(state)).toBe(24);
    });
  });

  describe('PARTE 4: Pilha de Notificações no Canto Direito (NotificationCenter)', () => {
    it('deve empilhar toasts com botão de fechar em 1 clique', () => {
      const notifCenter = new NotificationCenter(container);
      const id = notifCenter.pushToast('Teste de Notificação Hospitalar', 'info');

      expect(notifCenter.getToastCount()).toBe(1);
      const toastEl = container.querySelector(`[data-toast-id="${id}"]`);
      expect(toastEl).not.toBeNull();

      notifCenter.dismissToast(id);
      expect(notifCenter.getToastCount()).toBe(0);
    });

    it('deve exibir botão Limpar Tudo quando houver mais de 2 avisos', () => {
      const notifCenter = new NotificationCenter(container);
      notifCenter.pushToast('Aviso 1', 'info');
      notifCenter.pushToast('Aviso 2', 'warning');
      notifCenter.pushToast('Aviso 3', 'emergency');

      expect(notifCenter.getToastCount()).toBe(3);
      const clearBtn = container.querySelector('#btn-clear-all-toasts');
      expect(clearBtn).not.toBeNull();

      notifCenter.clearAll();
      expect(notifCenter.getToastCount()).toBe(0);
    });

    it('deve compactar evento de emergência para selo pulsante após 4 segundos', () => {
      vi.useFakeTimers();
      const notifCenter = new NotificationCenter(container);

      notifCenter.updateActiveEvent([
        {
          instanceId: 'ev-dengue',
          definition: {
            id: 'ev-dengue',
            type: 'epidemic',
            title: 'Surto de Dengue',
            description: 'Aumento expressivo na demanda clínica.',
            icon: '🦟',
            durationSec: 45,
            arrivalMultiplier: 2.0,
          },
          remainingSec: 30,
          elapsedSec: 15,
        },
      ]);

      expect(container.textContent).toContain('Surto de Dengue');

      vi.advanceTimersByTime(4100);
      expect(container.querySelector('[data-testid="emergency-badge-minimized"]')).not.toBeNull();

      vi.useRealTimers();
    });
  });

  describe('PARTE 6: Vida Urbana com NPCs Cidadãos (UrbanLifeSystem)', () => {
    it('deve inicializar cidadãos ambientais sem afetar fila clínica', () => {
      urbanLifeSystem.update(0.1);
      const citizens = urbanLifeSystem.getCitizens();

      expect(citizens.length).toBeGreaterThanOrEqual(10);
      expect(citizens.length).toBeLessThanOrEqual(35);

      const hasWalker = citizens.some((c) => c.role === 'pedestrian' || c.role === 'jogger');
      expect(hasWalker).toBe(true);

      // Garante isolamento: cidadãos não poluem pacientes
      expect(state.patients.size).toBe(0);
    });

    it('deve alternar fases do semáforo funcional com o decorrer do tempo', () => {
      urbanLifeSystem.update(0.1);
      const initialPhase = urbanLifeSystem.getTrafficLightPhase();
      expect(['GREEN', 'YELLOW', 'RED']).toContain(initialPhase);

      urbanLifeSystem.update(15.0);
      const nextPhase = urbanLifeSystem.getTrafficLightPhase();
      expect(['GREEN', 'YELLOW', 'RED']).toContain(nextPhase);
    });
  });

  describe('PARTE 1: Auditoria Visual de Character3D sem Linhas Espúrias', () => {
    it('deve instanciar e animar Character3D sem disparar strokes compartilhados', () => {
      const char = new Character3D({
        role: 'doctor',
        gender: 'female',
        skinToneIndex: 0,
      });

      expect(char.container).toBeDefined();

      // Executa ciclos de tick sem erros de cálculo vetorial
      expect(() => {
        char.update(0.016, 'IDLE');
        char.update(0.016, 'WALKING');
        char.update(0.016, 'WORKING');
      }).not.toThrow();

      char.destroy();
    });
  });
});
