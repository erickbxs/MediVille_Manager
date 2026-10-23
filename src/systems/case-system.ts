/**
 * Arquivo: src/systems/case-system.ts
 * O que faz: Gera pacientes individuais sorteando casos clínicos reais do SUS, variando idade, sexo, comorbidades e opções de conduta.
 * Para que foi criado: Implementar o micro-aprendizado do GDD baseado em diretrizes médicas oficiais da RENAME e Ministério da Saúde.
 * Como modificar/debugar: Para adicionar mais opções distratoras ou alterar probabilidades, consulte src/data/cases.json e balance.json.
 * Importa: src/core/config.ts, src/entities/clinical-case.ts, src/entities/patient.ts
 * Conecta-se com: src/systems/arrival-system.ts, src/entities/patient.ts
 */

import { BALANCE, CASES_CATALOG, NAMES_CATALOG } from '../core/config';
import type { ConductOption, PatientCase } from '../entities/clinical-case';
import type { PatientInstance } from '../entities/patient';

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

function buildConductOptions(def: typeof CASES_CATALOG.cases[0]): ConductOption[] {
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

export function generatePatientCase(): PatientCase {
  const def = getRandomItem(CASES_CATALOG.cases);
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
