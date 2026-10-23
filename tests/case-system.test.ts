/**
 * Arquivo: tests/case-system.test.ts
 * O que faz: Valida a geração de casos clínicos, respeito às fontes da RENAME e limites de idade dos pacientes.
 * Para que foi criado: Garantir a integridade do conteúdo médico educativo do SUS.
 * Como modificar/debugar: Execute `npm run test` para validar.
 * Importa: vitest, src/systems/case-system.ts, src/core/config.ts
 */

import { describe, it, expect } from 'vitest';
import { createPatient, generatePatientCase } from '../src/systems/case-system';
import { CASES_CATALOG } from '../src/core/config';

describe('Sistema de Casos Clínicos do SUS', () => {
  it('carrega os 5 casos clínicos base oficiais', () => {
    expect(CASES_CATALOG.cases.length).toBeGreaterThanOrEqual(5);
    for (const c of CASES_CATALOG.cases) {
      expect(c.sources.length).toBeGreaterThan(0);
      expect(c.reviewStatus).toBe('pending');
      expect(c.medications.length).toBeGreaterThan(0);
    }
  });

  it('gera pacientes com nome completo, sexo e idade dentro do limite do caso', () => {
    const patient = createPatient('pat_case_test');
    expect(patient.name.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(patient.age).toBeGreaterThanOrEqual(patient.clinicalCase.definition.ageRange.min);
    expect(patient.age).toBeLessThanOrEqual(patient.clinicalCase.definition.ageRange.max);
  });

  it('gera opções de conduta com exatamente uma conduta correta', () => {
    const pCase = generatePatientCase();
    const correctOptions = pCase.conductOptions.filter((c) => c.isCorrect);
    expect(correctOptions.length).toBe(1);
    expect(pCase.conductOptions.length).toBeGreaterThanOrEqual(2);
  });
});
