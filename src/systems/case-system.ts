/**
 * Arquivo: src/systems/case-system.ts
 *
 * 1. O que este arquivo faz?
 * Gera instâncias de pacientes e casos clínicos sorteados a partir do catálogo expandido do SUS (15 casos reais da APS),
 * utilizando seleção aleatória ponderada (weight) e garantindo que o mesmo caso clínico nunca se repita duas vezes consecutivas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Implementar o micro-aprendizado em saúde pública com condutas e distratores fidedignos às diretrizes do Ministério da Saúde e da RENAME.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar ou alterar pesos de casos, edite src/data/cases.json. Para validar a distribuição e não-repetição, execute tests/cases-and-mobile.test.ts.
 *
 * Importa: src/core/config.ts, src/entities/clinical-case.ts, src/entities/patient.ts
 * Conecta-se com: src/systems/arrival-system.ts, src/core/simulation.ts
 */

import { BALANCE, CASES_CATALOG, NAMES_CATALOG, type ClinicalCaseDefinition } from '../core/config';
import type { ConductOption, PatientCase } from '../entities/clinical-case';
import type { PatientInstance } from '../entities/patient';

let lastGeneratedCaseId: string | undefined;

function getRandomItem<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index]!;
}

function generatePatientName(gender: 'female' | 'male'): string {
  const firstName = gender === 'female'
    ? getRandomItem(NAMES_CATALOG.pools.female)
    : getRandomItem(NAMES_CATALOG.pools.male);
  const lastName = getRandomItem(NAMES_CATALOG.pools.lastNames);
  return `${firstName} ${lastName}`;
}

function buildConductOptions(def: ClinicalCaseDefinition): ConductOption[] {
  const options: ConductOption[] = [
    {
      id: def.suggestedConduct.id,
      text: def.suggestedConduct.text,
      isCorrect: true,
    },
    ...def.distractorConducts.map((d) => ({
      id: d.id,
      text: d.text,
      isCorrect: false,
      whyWrong: d.whyWrong,
    })),
  ];
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Seleciona um caso clínico da lista usando sorteio ponderado (weight)
 * e evitando estritamente a repetição do caso anterior (lastCaseId).
 */
export function selectWeightedCase(
  cases: ClinicalCaseDefinition[],
  lastCaseId?: string
): ClinicalCaseDefinition {
  if (cases.length === 0) {
    throw new Error('Nenhum caso clínico disponível no catálogo.');
  }

  const pool = (lastCaseId && cases.length > 1)
    ? cases.filter((c) => c.id !== lastCaseId)
    : cases;

  const totalWeight = pool.reduce((sum, c) => sum + (c.weight > 0 ? c.weight : 1), 0);
  let randomVal = Math.random() * totalWeight;

  for (const item of pool) {
    const w = item.weight > 0 ? item.weight : 1;
    if (randomVal < w) {
      return item;
    }
    randomVal -= w;
  }

  return pool[pool.length - 1]!;
}

export function generatePatientCase(overrideLastId?: string): PatientCase {
  const def = selectWeightedCase(CASES_CATALOG.cases, overrideLastId ?? lastGeneratedCaseId);
  lastGeneratedCaseId = def.id;

  const intensity = getRandomItem(BALANCE.queue.intensityLevels);
  const hasComorbidity = Math.random() < BALANCE.population.comorbidityChance;
  const comorbidity = hasComorbidity && def.possibleComorbidities.length > 0
    ? getRandomItem(def.possibleComorbidities)
    : null;

  return {
    definition: def,
    intensityId: intensity.id,
    comorbidity,
    conductOptions: buildConductOptions(def),
    chosenConductId: null,
    decisionMade: false,
    isDecisionCorrect: false,
    feedbackText: '',
  };
}

export function createPatient(id: string): PatientInstance {
  const gender = Math.random() < BALANCE.population.femaleChance ? 'female' : 'male';
  const name = generatePatientName(gender);
  const pCase = generatePatientCase();
  const minAge = pCase.definition.ageRange.min;
  const maxAge = pCase.definition.ageRange.max;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

  const intensity = BALANCE.queue.intensityLevels.find((i) => i.id === pCase.intensityId);
  const factor = intensity ? intensity.patienceFactor : 1;
  const patienceSec = Math.round(BALANCE.queue.patienceSec * factor);

  return {
    id,
    name,
    age,
    gender,
    state: 'arrived',
    clinicalCase: pCase,
    patienceSec,
    waitTimeSec: 0,
    consultationTimeSec: 0,
    consultationDurationSec: BALANCE.consultation.baseTimeSec,
    currentRoomId: null,
    satisfaction: BALANCE.satisfaction.initial,
    errorsCount: 0,
  };
}
