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
 * Importa: src/core/config.ts, src/entities/clinical-case.ts, src/entities/patient.ts, src/state/game-state.ts, src/systems/revalida-system.ts, src/systems/revalida-difficulty.ts
 * Conecta-se com: src/systems/arrival-system.ts, src/core/simulation.ts
 */

import { BALANCE, CASES_CATALOG, NAMES_CATALOG, type ClinicalCaseDefinition } from '../core/config';
import type { ConductOption, PatientCase } from '../entities/clinical-case';
import type { PatientInstance } from '../entities/patient';
import type { GameState } from '../state/game-state';
import { applyDifficulty } from './revalida-difficulty';
import { buildRevalidaCaseDefinition, inferRevalidaPatientGender, isRevalidaActive, pickRevalidaQuestion } from './revalida-system';

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

const UNIT_MATCH_WEIGHT_MULTIPLIER = 1.5;
const UNMASTERED_CASE_WEIGHT_MULTIPLIER = 2.0;

function calculateCaseEffectiveWeight(
  c: ClinicalCaseDefinition,
  masteredCaseIds?: string[],
  hospitalLevel?: string
): number {
  let w = c.weight > 0 ? c.weight : 1;

  if (hospitalLevel) {
    const levelLower = hospitalLevel.toLowerCase();
    const unitLower = c.typicalUnit.toLowerCase();
    if (unitLower.includes(levelLower)) {
      w *= UNIT_MATCH_WEIGHT_MULTIPLIER;
    }
  }

  if (masteredCaseIds && !masteredCaseIds.includes(c.id)) {
    w *= UNMASTERED_CASE_WEIGHT_MULTIPLIER;
  }

  return w;
}

/**
 * Seleciona um caso clínico da lista usando sorteio ponderado (weight)
 * priorizando o nível da unidade e casos ainda não dominados,
 * evitando a repetição do caso anterior (lastCaseId).
 */
export function selectWeightedCase(
  cases: ClinicalCaseDefinition[],
  lastCaseId?: string,
  masteredCaseIds?: string[],
  hospitalLevel?: string
): ClinicalCaseDefinition {
  if (cases.length === 0) {
    throw new Error('Nenhum caso clínico disponível no catálogo.');
  }

  const pool = (lastCaseId && cases.length > 1)
    ? cases.filter((c) => c.id !== lastCaseId)
    : cases;

  const totalWeight = pool.reduce(
    (sum, c) => sum + calculateCaseEffectiveWeight(c, masteredCaseIds, hospitalLevel),
    0
  );
  let randomVal = Math.random() * totalWeight;

  for (const item of pool) {
    const w = calculateCaseEffectiveWeight(item, masteredCaseIds, hospitalLevel);
    if (randomVal < w) {
      return item;
    }
    randomVal -= w;
  }

  return pool[pool.length - 1]!;
}

/** Alternativas da questão do Revalida na ordem oficial (A–D), sem embaralhar. */
function buildRevalidaOptions(def: ClinicalCaseDefinition): ConductOption[] {
  const q = def.revalida!.question;
  return applyDifficulty(q.options.map((o) => ({ id: `${q.id}-${o.key}`, text: o.text, isCorrect: o.key === q.answer })));
}

function selectCaseDefinition(
  overrideLastId: string | undefined,
  masteredCaseIds: string[] | undefined,
  hospitalLevel: string | undefined,
  state: GameState | undefined
): ClinicalCaseDefinition {
  const question = state && isRevalidaActive() ? pickRevalidaQuestion(state) : undefined;
  if (question) return buildRevalidaCaseDefinition(question);
  const pool = hospitalLevel ? filterCasesForUnit(CASES_CATALOG.cases, hospitalLevel) : CASES_CATALOG.cases;
  return selectWeightedCase(pool, overrideLastId ?? lastGeneratedCaseId, masteredCaseIds, hospitalLevel);
}

/** Casos clínicos antigos: só sorteia casos compatíveis com o porte da unidade (UBS não recebe caso de UTI). */
export function filterCasesForUnit(cases: ClinicalCaseDefinition[], hospitalLevel: string): ClinicalCaseDefinition[] {
  const level = hospitalLevel.toLowerCase();
  const allowed = level === 'hospital' ? ['ubs', 'upa', 'hospital'] : level === 'upa' ? ['ubs', 'upa'] : ['ubs'];
  const matching = cases.filter((c) => allowed.some((u) => c.typicalUnit.toLowerCase().includes(u)));
  return matching.length > 0 ? matching : cases;
}

export function generatePatientCase(
  overrideLastId?: string,
  masteredCaseIds?: string[],
  hospitalLevel?: string,
  state?: GameState
): PatientCase {
  const def = selectCaseDefinition(overrideLastId, masteredCaseIds, hospitalLevel, state);
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
    conductOptions: def.revalida ? buildRevalidaOptions(def) : buildConductOptions(def),
    chosenConductId: null,
    decisionMade: false,
    isDecisionCorrect: false,
    feedbackText: '',
  };
}

/** No Modo Revalida, o sexo do paciente acompanha o enunciado ("Mulher de 30 anos", "Homem de 62 anos"). */
function inferGender(def: ClinicalCaseDefinition): 'female' | 'male' | null {
  return def.revalida ? inferRevalidaPatientGender(def.revalida.question.stem) : null;
}

export function createPatient(
  id: string,
  masteredCaseIds?: string[],
  hospitalLevel?: string,
  state?: GameState
): PatientInstance {
  const pCase = generatePatientCase(undefined, masteredCaseIds, hospitalLevel, state);
  const gender = inferGender(pCase.definition) ?? (Math.random() < BALANCE.population.femaleChance ? 'female' : 'male');
  const name = generatePatientName(gender);
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
