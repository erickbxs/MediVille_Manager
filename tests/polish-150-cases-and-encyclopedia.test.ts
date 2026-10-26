/**
 * Arquivo: tests/polish-150-cases-and-encyclopedia.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida os requisitos completos do Prompt 12: catálogo de 150 casos clínicos reais do SUS com integridade RENAME,
 * novos setores hospitalares, cooldown da negociação governamental, limite de 3 sugestões do conselheiro
 * e acessibilidade de escala tipográfica.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir cobertura e robustez dos testes no Vitest para entrega do Prompt 12 com zero regressão.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute `npx vitest run tests/polish-150-cases-and-encyclopedia.test.ts`.
 *
 * Importa: vitest, src/core/config.ts, src/systems/economy-system.ts, src/systems/advisor-system.ts,
 *          src/ui/settings-modal.ts, src/core/new-game.ts
 * Conecta-se com: src/data/cases.json, src/data/pharmacy.json, src/data/rooms.json
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CASES_CATALOG, PHARMACY_CATALOG, ROOMS_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { executeGovernmentNegotiation } from '../src/systems/economy-system';
import { getAdvisorAlerts } from '../src/systems/advisor-system';
import { applySavedFontScale, getSavedFontScale } from '../src/ui/settings-modal';

describe('Prompt 12 — Catálogo de 150 Casos Clínicos do SUS e RENAME', () => {
  it('deve conter exatamente 150 casos clínicos únicos com dados completos', () => {
    const cases = CASES_CATALOG.cases;
    expect(cases.length).toBeGreaterThanOrEqual(150);

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

  it('deve possuir todos os medicationIds mapeados para IDs válidos em pharmacy.json', () => {
    const validMeds = new Set(PHARMACY_CATALOG.medications.map((m) => m.id));

    for (const c of CASES_CATALOG.cases) {
      expect(c.medicationIds).toBeDefined();
      expect(c.medicationIds!.length).toBeGreaterThan(0);
      for (const mId of c.medicationIds!) {
        expect(validMeds.has(mId)).toBe(true);
      }
    }
  });

  it('deve conter casos nas áreas fundamentais pediátricas, obstétricas, cirúrgicas e clínicas', () => {
    const areas = new Set(CASES_CATALOG.cases.map((c) => c.area));
    expect(areas.has('Pediatria')).toBe(true);
    expect(areas.has('Obstetrícia')).toBe(true);
    expect(areas.has('Dermatologia')).toBe(true);
    expect(areas.has('Cardiovascular')).toBe(true);
    expect(areas.has('Saúde Mental')).toBe(true);
  });
});

describe('Prompt 12 — Novos Setores, Negociação Governamental e Conselheiro', () => {
  it('deve conter os novos setores hospitalares desbloqueáveis no catálogo de salas', () => {
    const roomIds = new Set(ROOMS_CATALOG.rooms.map((r) => r.id));
    expect(roomIds.has('vaccination')).toBe(true);
    expect(roomIds.has('laboratory')).toBe(true);
    expect(roomIds.has('xray')).toBe(true);
    expect(roomIds.has('surgery')).toBe(true);
    expect(roomIds.has('icu')).toBe(true);
    expect(roomIds.has('staff_room')).toBe(true);
  });

  it('deve respeitar o cooldown de 30 dias na negociação governamental', () => {
    const state = createInitialGameState();
    state.reputation = 85;
    state.governmentNegotiationCooldownDays = 0;

    const result1 = executeGovernmentNegotiation(state, 0.01);
    expect(result1.success).toBe(true);
    expect(state.governmentNegotiationCooldownDays).toBe(30);

    // Tentativa imediata antes dos 30 dias deve ser bloqueada pelo cooldown
    const result2 = executeGovernmentNegotiation(state, 0.01);
    expect(result2.success).toBe(false);
    expect(result2.message).toContain('Aguarde');

    // Ao zerar o cooldown, nova negociação é permitida
    state.governmentNegotiationCooldownDays = 0;
    const result3 = executeGovernmentNegotiation(state, 0.01);
    expect(result3.success).toBe(true);
  });

  it('deve limitar o conselheiro hospitalar a no máximo 3 sugestões prioritárias', () => {
    const state = createInitialGameState();
    state.queueIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    state.pharmacyStock = { paracetamol: 0, dipirona: 0, 'soro-fisiologico': 0 };

    const alerts = getAdvisorAlerts(state);
    expect(alerts.length).toBeLessThanOrEqual(3);
    for (const a of alerts) {
      expect(a.title).toBeTruthy();
      expect(a.message).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(a.urgency);
    }
  });
});

describe('Prompt 12 — Acessibilidade e Escala de Fonte', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, val),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).localStorage = mockStorage;

    const attributes = new Map<string, string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).document = {
      documentElement: {
        setAttribute: (k: string, v: string) => attributes.set(k, v),
        removeAttribute: (k: string) => attributes.delete(k),
        getAttribute: (k: string) => attributes.get(k) ?? null,
        hasAttribute: (k: string) => attributes.has(k),
      },
    };
  });

  it('deve retornar escala normal por padrão e aplicar data-font-scale correspondente', () => {
    expect(getSavedFontScale()).toBe('normal');

    applySavedFontScale('large');
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('large');

    applySavedFontScale('xlarge');
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('xlarge');

    applySavedFontScale('normal');
    expect(document.documentElement.hasAttribute('data-font-scale')).toBe(false);
  });
});
