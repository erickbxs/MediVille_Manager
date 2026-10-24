/**
 * Arquivo: tests/cases-and-mobile.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a integridade referencial dos 15 casos clínicos reais do SUS com os 8 medicamentos da RENAME,
 * a regra de seleção aleatória ponderada sem repetição consecutiva e o cálculo matemático puro de fitMapToScreen.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos de estabilização e responsividade da versão 0.8.0 de MediVille Manager.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute `npx vitest run tests/cases-and-mobile.test.ts`. Caso algum medicamento falte, verifique src/data/pharmacy.json.
 *
 * Importa: vitest, src/core/config.ts, src/systems/case-system.ts, src/systems/economy-system.ts, src/render/camera.ts
 */

import { describe, it, expect } from 'vitest';
import { CASES_CATALOG, PHARMACY_CATALOG } from '../src/core/config';
import clinicalCasesRaw from '../src/data/clinical-cases.json';
import { selectWeightedCase } from '../src/systems/case-system';
import { getRequiredMedicationsForCase } from '../src/systems/economy-system';
import { fitMapToScreen } from '../src/render/camera';

describe('Expansão de Casos Clínicos SUS/RENAME (15 Casos Reais)', () => {
  const validMedicationIds = new Set(PHARMACY_CATALOG.medications.map((m) => m.id));

  it('possui pelo menos 15 casos clínicos reais no catálogo cases.json', () => {
    expect(CASES_CATALOG.cases.length).toBeGreaterThanOrEqual(15);
  });

  it('possui paridade com o arquivo clinical-cases.json', () => {
    expect(clinicalCasesRaw.cases.length).toBe(CASES_CATALOG.cases.length);
  });

  it('garante integridade referencial 100% de medicationIds com pharmacy.json', () => {
    for (const c of CASES_CATALOG.cases) {
      expect(c.medicationIds, `Caso ${c.id} deve definir medicationIds`).toBeDefined();
      expect(c.medicationIds!.length).toBeGreaterThan(0);

      for (const medId of c.medicationIds!) {
        expect(
          validMedicationIds.has(medId),
          `Medicamento '${medId}' do caso '${c.id}' deve existir em pharmacy.json`
        ).toBe(true);
      }
    }
  });

  it('getRequiredMedicationsForCase retorna medicamentos válidos para todos os 15 casos', () => {
    for (const c of CASES_CATALOG.cases) {
      const required = getRequiredMedicationsForCase(c.id);
      expect(required.length).toBeGreaterThan(0);
      for (const medId of required) {
        expect(validMedicationIds.has(medId)).toBe(true);
      }
    }
  });
});

describe('Seleção Ponderada e Prevenção de Repetição Consecutiva', () => {
  it('nunca repete o caso imediatamente anterior se houver mais de 1 caso disponível', () => {
    const cases = CASES_CATALOG.cases;
    let lastCaseId = cases[0]!.id;

    for (let i = 0; i < 60; i++) {
      const nextCase = selectWeightedCase(cases, lastCaseId);
      expect(nextCase.id).not.toBe(lastCaseId);
      lastCaseId = nextCase.id;
    }
  });

  it('respeita os pesos (weight) relativos dos casos clínicos', () => {
    const mockCases = [
      { ...CASES_CATALOG.cases[0]!, id: 'raro', weight: 1 },
      { ...CASES_CATALOG.cases[1]!, id: 'comum', weight: 9 },
    ];

    let countComum = 0;
    const trials = 600;
    for (let i = 0; i < trials; i++) {
      const selected = selectWeightedCase(mockCases);
      if (selected.id === 'comum') countComum++;
    }

    // Com peso 9 vs 1, o caso comum deve ser sorteado aproximadamente 90% das vezes (> 70%)
    expect(countComum).toBeGreaterThan(trials * 0.7);
  });
});

describe('Responsividade e Auto-Fit do Mapa (fitMapToScreen)', () => {
  it('calcula escalas e posições finitas e válidas em resolução mobile (375x667)', () => {
    const res = fitMapToScreen(375, 667);

    expect(Number.isFinite(res.scale)).toBe(true);
    expect(Number.isFinite(res.zoom)).toBe(true);
    expect(Number.isFinite(res.x)).toBe(true);
    expect(Number.isFinite(res.y)).toBe(true);
    expect(res.scale).toBeGreaterThan(0);
    expect(res.scale).toBeLessThanOrEqual(1.5);
  });

  it('calcula dimensões válidas em tela estreita mobile (360x740)', () => {
    const res = fitMapToScreen(360, 740);

    expect(res.scale).toBeGreaterThan(0);
    expect(res.zoom).toBe(res.scale);
    expect(Number.isFinite(res.x)).toBe(true);
    expect(Number.isFinite(res.y)).toBe(true);
  });

  it('calcula escalas e posições válidas em resolução desktop (1920x1080)', () => {
    const res = fitMapToScreen(1920, 1080);

    expect(Number.isFinite(res.scale)).toBe(true);
    expect(Number.isFinite(res.x)).toBe(true);
    expect(Number.isFinite(res.y)).toBe(true);
    expect(res.scale).toBeGreaterThan(0.5);
  });

  it('aceita margens personalizadas de HUD superior e inferior', () => {
    const custom = fitMapToScreen(800, 600, {
      topMargin: 50,
      bottomMargin: 70,
      sidePadding: 20,
    });

    expect(Number.isFinite(custom.scale)).toBe(true);
    expect(custom.scale).toBeGreaterThan(0);
    expect(custom.y).toBeGreaterThanOrEqual(50);
  });
});
