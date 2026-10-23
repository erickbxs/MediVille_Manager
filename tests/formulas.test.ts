/**
 * Arquivo: tests/formulas.test.ts
 * O que faz: Testa as fórmulas matemáticas centrais do GDD (satisfação do paciente e progressão de reputação).
 * Para que foi criado: Garantir que nenhuma alteração de código ou balanceamento quebre as regras matemáticas do documento.
 * Como modificar/debugar: Execute `npm run test` para validar.
 * Importa: vitest, src/systems/satisfaction-system.ts, src/systems/reputation-system.ts, src/systems/arrival-system.ts, src/systems/case-system.ts
 */

import { describe, it, expect } from 'vitest';
import { calculatePatientSatisfaction } from '../src/systems/satisfaction-system';
import { calculateNewReputation } from '../src/systems/reputation-system';
import { calculateArrivalInterval } from '../src/systems/arrival-system';
import { createPatient } from '../src/systems/case-system';

describe('Fórmulas Matemáticas do GDD', () => {
  it('calcula a satisfação do paciente segundo a fórmula S = 100 - 20*(T_esp/T_pac) - 15*N_erros', () => {
    const patient = createPatient('pat_test');
    patient.patienceSec = 100;
    patient.waitTimeSec = 50; // T_espera / T_paciencia = 0.5 -> penalidade = 10
    patient.errorsCount = 0;

    // 100 - 10 = 90
    const sat = calculatePatientSatisfaction(patient, true);
    expect(sat).toBe(90);

    // Com 1 erro de conduta: 90 - 15 = 75
    patient.errorsCount = 1;
    const satWithError = calculatePatientSatisfaction(patient, true);
    expect(satWithError).toBe(75);
  });

  it('limita a satisfação entre 0 e 100', () => {
    const patient = createPatient('pat_min');
    patient.patienceSec = 100;
    patient.waitTimeSec = 200;
    patient.errorsCount = 10;

    const sat = calculatePatientSatisfaction(patient, false);
    expect(sat).toBeGreaterThanOrEqual(0);
    expect(sat).toBeLessThanOrEqual(100);
  });

  it('atualiza a reputação diária segundo R_{dia+1} = R_{dia} + 0.1*(S_media - R_dia)', () => {
    const currentRep = 50;
    const averageSat = 80;
    // delta = 0.1 * (80 - 50) = 3 -> novo = 53
    const newRep = calculateNewReputation(currentRep, averageSat);
    expect(newRep).toBe(53);
  });

  it('calcula o intervalo de chegada de pacientes reduzindo conforme o número de setores', () => {
    const int0 = calculateArrivalInterval(0);
    const int5 = calculateArrivalInterval(5);
    expect(int5).toBeLessThan(int0);
  });
});
