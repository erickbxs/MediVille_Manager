/**
 * Arquivo: tests/scroll-i18n-seo-and-ranking.test.ts
 *
 * 1. O que este arquivo faz?
 * Suíte de testes automatizados para validar a rolagem horizontal ergonômica, paridade 100% de i18n (PT/ES/EN),
 * filtro de apelido e privacidade (LGPD), aviso pré-derrota no dia 5/6, fim de jogo e regras estritas de SEO.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com a Parte 6 do Prompt 14 e impedir regressões de interface, tradução e conformidade legal.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via Vitest: 'npx vitest run tests/scroll-i18n-seo-and-ranking.test.ts'.
 *
 * Importa: src/ui/horizontal-scroll.ts, src/i18n/*, src/utils/nickname-filter.ts, src/systems/defeat-system.ts, src/services/ranking-service.ts
 * Conecta-se com: vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { enableHorizontalScroll } from '../src/ui/horizontal-scroll';
import { validateNickname, canSubmitToGlobalRanking } from '../src/utils/nickname-filter';
import { savePlayerAgeVerification } from '../src/systems/player-profile';
import { RankingService } from '../src/services/ranking-service';
import {
  checkDefeatAndWarnings,
  calculateFinalScore,
  executeEmergencyTransferRescue,
  executeDemolishIdleRoomRescue,
} from '../src/systems/defeat-system';
import { createInitialGameState } from '../src/core/new-game';
import { globalBus } from '../src/core/event-bus';
import { t, setLocale } from '../src/i18n/i18n';
import ptJson from '../src/i18n/pt.json';
import esJson from '../src/i18n/es.json';
import enJson from '../src/i18n/en.json';

// --- Mocks para ambiente Node.js ---
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

class MockBaseEvent {
  public defaultPrevented = false;
  public propagationStopped = false;
  constructor(public type: string) {}
  preventDefault(): void { this.defaultPrevented = true; }
  stopPropagation(): void { this.propagationStopped = true; }
}

class MockWheelEventNode extends MockBaseEvent {
  public deltaX: number;
  public deltaY: number;
  constructor(type: string, init?: { deltaX?: number; deltaY?: number }) {
    super(type);
    this.deltaX = init?.deltaX ?? 0;
    this.deltaY = init?.deltaY ?? 0;
  }
}

class MockKeyboardEventNode extends MockBaseEvent {
  public key: string;
  constructor(type: string, init?: { key?: string }) {
    super(type);
    this.key = init?.key ?? '';
  }
}

class MockDomElement {
  public listeners: Record<string, Array<(e: unknown) => void>> = {};
  public scrollLeft = 0;
  public scrollWidth = 1000;
  public clientWidth = 300;
  public offsetLeft = 0;
  public style: Record<string, string> = {};
  public classList = {
    toggle: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  };

  addEventListener(type: string, fn: (e: unknown) => void): void {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type]!.push(fn);
  }

  removeEventListener(type: string, fn: (e: unknown) => void): void {
    this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn);
  }

  dispatchEvent(event: MockBaseEvent): void {
    for (const fn of this.listeners[event.type] || []) {
      fn(event);
    }
  }

  scrollBy = vi.fn((opts: { left?: number }) => {
    this.scrollLeft += opts.left ?? 0;
  });

  contains(): boolean {
    return false;
  }
}

const windowListeners: Record<string, Array<(e: unknown) => void>> = {};
const windowMock = {
  addEventListener: (type: string, fn: (e: unknown) => void) => {
    if (!windowListeners[type]) windowListeners[type] = [];
    windowListeners[type]!.push(fn);
  },
  removeEventListener: (type: string, fn: (e: unknown) => void) => {
    windowListeners[type] = (windowListeners[type] || []).filter((f) => f !== fn);
  },
  dispatchEvent: (event: MockBaseEvent) => {
    for (const fn of windowListeners[event.type] || []) {
      fn(event);
    }
  },
};

Object.defineProperty(globalThis, 'window', {
  value: windowMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: () => new MockDomElement(),
    activeElement: null,
  },
  writable: true,
  configurable: true,
});

describe('Prompt 14 — Rolagem Horizontal, i18n, Ranking e SEO', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.restoreAllMocks();
  });

  describe('1. Rolagem Horizontal Fluida (Wheel, Setas, Botões)', () => {
    it('converte giro vertical da rodinha em incremento de scrollLeft com preventDefault e stopPropagation', () => {
      const container = new MockDomElement();
      container.scrollLeft = 0;

      const cleanup = enableHorizontalScroll(container as unknown as HTMLElement, { wheelMultiplier: 1.2 });

      const event = new MockWheelEventNode('wheel', { deltaX: 0, deltaY: 50 });
      container.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(event.propagationStopped).toBe(true);
      expect(container.scrollLeft).toBeCloseTo(60);

      cleanup();
    });

    it('intercepta teclas ArrowLeft e ArrowRight rolando o container suavemente', () => {
      const container = new MockDomElement();
      const cleanup = enableHorizontalScroll(container as unknown as HTMLElement, { step: 240 });

      // Simula mouse dentro do container para ativar hover
      container.dispatchEvent(new MockBaseEvent('mouseenter'));

      const rightKey = new MockKeyboardEventNode('keydown', { key: 'ArrowRight' });
      windowMock.dispatchEvent(rightKey);

      expect(container.scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
      expect(rightKey.propagationStopped).toBe(true);

      const leftKey = new MockKeyboardEventNode('keydown', { key: 'ArrowLeft' });
      windowMock.dispatchEvent(leftKey);

      expect(container.scrollBy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' });
      expect(leftKey.propagationStopped).toBe(true);

      cleanup();
    });
  });

  describe('2. Paridade Estrita de i18n (PT / ES / EN)', () => {
    function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        if (k === '_meta') continue;
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getAllKeys(v as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    }

    it('garante que 100% das chaves existentes em pt.json existem em es.json e en.json', () => {
      const ptKeys = getAllKeys(ptJson as Record<string, unknown>);
      const esKeys = getAllKeys(esJson as Record<string, unknown>);
      const enKeys = getAllKeys(enJson as Record<string, unknown>);

      expect(ptKeys.length).toBeGreaterThan(30);
      expect(esKeys).toEqual(ptKeys);
      expect(enKeys).toEqual(ptKeys);
    });

    it('substitui parâmetros dinâmicos na tradução via função t()', async () => {
      await setLocale('pt');
      const textPt = t('defeat.daysRemaining', { days: 2 });
      expect(textPt).toBe('Restam apenas 2 dias para o colapso!');

      await setLocale('es');
      const textEs = t('defeat.daysRemaining', { days: 2 });
      expect(textEs).toBe('¡Quedan solo 2 días para el cierre!');

      await setLocale('en');
      const textEn = t('defeat.daysRemaining', { days: 2 });
      expect(textEn).toBe('Only 2 day(s) remaining before total collapse!');
    });
  });

  describe('3. Filtro de Apelido, Privacidade e Modo Convidado (< 13 anos)', () => {
    it('valida limites de caracteres e formato alfanumérico', () => {
      expect(validateNickname('ab').valid).toBe(false);
      expect(validateNickname('UmApelidoMuitoLongoQuePassaDeDezesseis').valid).toBe(false);
      expect(validateNickname('Dr_Carlos-10').valid).toBe(true);
      expect(validateNickname('Dr@Carlos!').valid).toBe(false);
    });

    it('bloqueia dados sensíveis (e-mails, CPFs, telefones) para conformidade com a LGPD', () => {
      expect(validateNickname('user@test.com').valid).toBe(false);
      expect(validateNickname('123.456.789-00').valid).toBe(false);
      expect(validateNickname('11987654321').valid).toBe(false);
    });

    it('bloqueia palavras ofensivas e termos reservados', () => {
      expect(validateNickname('admin').valid).toBe(false);
      expect(validateNickname('moderator').valid).toBe(false);
      expect(validateNickname('porra_doc').valid).toBe(false);
    });

    it('desativa submissão de rede no Modo Convidado (< 13 anos) e salva localmente', async () => {
      const birthYear = new Date().getFullYear() - 10; // 10 anos
      savePlayerAgeVerification(birthYear);

      expect(canSubmitToGlobalRanking()).toBe(false);

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const result = await RankingService.submitScore({
        nickname: 'Jogador_Mirim',
        score: 5000,
        days: 10,
        patientsTreated: 40,
        unitType: 'ubs',
      });

      expect(result.success).toBe(true);
      expect(result.localOnly).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Aviso Pré-Derrota, Marcos e Fim de Jogo', () => {
    it('dispara evento defeat:warning aos 5 e 6 dias consecutivos de caixa negativo', () => {
      const state = createInitialGameState();
      state.cash = -500;

      let warningCount = 0;
      let lastDaysRemaining = 0;
      const unsubscribe = globalBus.on('defeat:warning', (w) => {
        warningCount += 1;
        lastDaysRemaining = w.daysRemaining;
      });

      // Dias 1 a 4: sem aviso
      for (let i = 0; i < 4; i++) {
        checkDefeatAndWarnings(state);
      }
      expect(warningCount).toBe(0);

      // Dia 5: faltam 2 dias
      checkDefeatAndWarnings(state);
      expect(warningCount).toBe(1);
      expect(lastDaysRemaining).toBe(2);

      // Dia 6: falta 1 dia
      checkDefeatAndWarnings(state);
      expect(warningCount).toBe(2);
      expect(lastDaysRemaining).toBe(1);

      unsubscribe();
    });

    it('muda para isDefeated e emite game:over no 7º dia consecutivo de caixa negativo', () => {
      const state = createInitialGameState();
      state.cash = -1000;
      state.consecutiveNegativeCashDays = 6;

      let gameOverTriggered = false;
      const unsubscribe = globalBus.on('game:over', (payload) => {
        gameOverTriggered = true;
        expect(payload.stats.score).toBeGreaterThan(0);
      });

      const defeated = checkDefeatAndWarnings(state);
      expect(defeated).toBe(true);
      expect(state.isDefeated).toBe(true);
      expect(state.isGameOver).toBe(true);
      expect(gameOverTriggered).toBe(true);

      unsubscribe();
    });

    it('opção de resgate com repasse emergencial de R$ 15.000 reseta os dias de falência', () => {
      const state = createInitialGameState();
      state.cash = -5000;
      state.consecutiveNegativeCashDays = 5;

      const res = executeEmergencyTransferRescue(state);
      expect(res.success).toBe(true);
      expect(res.amount).toBe(15000);
      expect(state.cash).toBe(10000);
      expect(state.consecutiveNegativeCashDays).toBe(0);
    });

    it('opção de resgate com venda de sala ociosa devolve 50% do valor da sala', () => {
      const state = createInitialGameState();
      const firstRoom = Array.from(state.rooms.values())[0]!;
      const originalCost = firstRoom.definition.cost;
      const initialCash = state.cash;

      const res = executeDemolishIdleRoomRescue(state, firstRoom.id);
      expect(res.success).toBe(true);
      expect(res.refund).toBe(Math.round(originalCost * 0.5));
      expect(state.cash).toBe(initialCash + res.refund);
      expect(state.rooms.has(firstRoom.id)).toBe(false);
    });

    it('calcula a pontuação final com base em dias, pacientes, protocolos e reputação', () => {
      const state = createInitialGameState();
      state.day = 15;
      state.stats.treatedCount = 80;
      state.masteredCaseIds = ['case_1', 'case_2', 'case_3'];
      state.reputation = 90;

      const summary = calculateFinalScore(state);
      // (15 * 100) + (80 * 50) + (3 * 200) + (90 * 10) = 1500 + 4000 + 600 + 900 = 7000
      expect(summary.score).toBe(7000);
    });
  });

  describe('5. Auditoria de SEO Técnico das Páginas Estáticas', () => {
    const staticDirs = ['pt', 'es', 'en'];
    const pageFiles = ['index.html', 'catalogo-de-salas.html', 'guia-de-doencas.html', 'como-jogar.html'];

    it('valida checklist estrito de SEO: title <= 60, description <= 155, h1 único e canonical', () => {
      for (const lang of staticDirs) {
        for (const file of pageFiles) {
          const filePath = path.resolve(process.cwd(), 'public', lang, file);
          expect(fs.existsSync(filePath), `Arquivo ausente: ${filePath}`).toBe(true);

          const html = fs.readFileSync(filePath, 'utf-8');

          // 1. Tag <title> única e <= 60 caracteres
          const titleMatch = /<title>(.*?)<\/title>/i.exec(html);
          expect(titleMatch, `Título ausente em ${lang}/${file}`).not.toBeNull();
          const titleText = titleMatch![1]!;
          expect(titleText.length).toBeLessThanOrEqual(60);

          // 2. Tag <meta name="description"> única e <= 155 caracteres
          const descMatch = /<meta\s+name="description"\s+content="(.*?)"/i.exec(html);
          expect(descMatch, `Meta description ausente em ${lang}/${file}`).not.toBeNull();
          const descText = descMatch![1]!;
          expect(descText.length).toBeLessThanOrEqual(155);

          // 3. Uma única tag <h1>
          const h1Matches = html.match(/<h1[\s>]/gi);
          expect(h1Matches?.length, `Deve haver exatamente um <h1> em ${lang}/${file}`).toBe(1);

          // 4. Canonical e Hreflangs
          expect(html).toContain('<link rel="canonical"');
          expect(html).toContain('hreflang="pt"');
          expect(html).toContain('hreflang="es"');
          expect(html).toContain('hreflang="en"');
          expect(html).toContain('hreflang="x-default"');
        }
      }
    });

    it('garante que guia-de-doencas.html contém o aviso médico obrigatório', () => {
      for (const lang of staticDirs) {
        const filePath = path.resolve(process.cwd(), 'public', lang, 'guia-de-doencas.html');
        const html = fs.readFileSync(filePath, 'utf-8');
        expect(html.toLowerCase()).toMatch(/educativo|educat/);
        expect(html.toLowerCase()).toMatch(/médic|medic/);
      }
    });

    it('valida existência de robots.txt e sitemap.xml canônico', () => {
      const robotsPath = path.resolve(process.cwd(), 'public', 'robots.txt');
      const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');

      expect(fs.existsSync(robotsPath)).toBe(true);
      expect(fs.existsSync(sitemapPath)).toBe(true);

      const robots = fs.readFileSync(robotsPath, 'utf-8');
      expect(robots).toContain('sitemap.xml');

      const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).toContain('https://mediville-manager.pages.dev/pt/');
      expect(sitemap).toContain('https://mediville-manager.pages.dev/es/');
      expect(sitemap).toContain('https://mediville-manager.pages.dev/en/');
    });
  });
});
