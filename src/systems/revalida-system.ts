/**
 * Arquivo: src/systems/revalida-system.ts
 * O que faz: Mantém o banco de questões do Revalida em memória, escolhe a questão de cada paciente
 * (novas, ainda não dominadas, e revisão das que o jogador errou) e converte a questão em um "caso clínico" do jogo.
 * Para que foi criado: Modo Revalida — estudo leve em que cada paciente traz uma questão oficial do INEP.
 * Como modificar/debugar: Parâmetros em src/data/balance.json (seção "revalida"). Se o banco não carregar,
 * isRevalidaActive() retorna false e o jogo volta a usar os casos clínicos antigos (src/data/cases.json).
 * Importa: src/core/config.ts, src/entities/revalida-question.ts, src/state/game-state.ts
 * Conecta-se com: src/services/revalida-bank.ts, src/systems/case-system.ts, src/systems/arrival-system.ts,
 *                 src/core/simulation.ts, src/ui/decision-modal.ts, src/ui/revalida-bank-modal.ts
 */

import { BALANCE, type ClinicalCaseDefinition } from '../core/config';
import type { RevalidaArea, RevalidaQuestion } from '../entities/revalida-question';
import type { GameState } from '../state/game-state';

export const REVALIDA_AREAS: RevalidaArea[] = [
  'clinica_medica',
  'medicina_familia_comunidade',
  'pediatria',
  'cirurgia',
  'ginecologia_obstetricia',
];

const bank = {
  questions: [] as RevalidaQuestion[],
  byId: new Map<string, RevalidaQuestion>(),
  comments: new Map<string, string>(),
  lastPickedId: '' as string,
};

export function setRevalidaBank(questions: RevalidaQuestion[], comments: Record<string, string>): void {
  bank.questions = questions;
  bank.byId = new Map(questions.map((q) => [q.id, q]));
  bank.comments = new Map(Object.entries(comments));
}

export function getRevalidaQuestions(): RevalidaQuestion[] {
  return bank.questions;
}

export function getRevalidaQuestion(id: string): RevalidaQuestion | undefined {
  return bank.byId.get(id);
}

export function getRevalidaCommentary(id: string): string | null {
  return bank.comments.get(id) ?? null;
}

export function isRevalidaActive(): boolean {
  return BALANCE.revalida.enabled && bank.questions.length > 0;
}

export function isCalmModeFlag(flag: keyof typeof BALANCE.revalida.calmMode): boolean {
  return isRevalidaActive() && BALANCE.revalida.calmMode[flag];
}

export function getAreaRoomId(area: RevalidaArea): string {
  return BALANCE.revalida.areaRooms[area] ?? 'consultation';
}

export function getUnlockedAreas(state: GameState): RevalidaArea[] {
  const builtTypes = new Set(Array.from(state.rooms.values()).map((r) => r.typeId));
  return REVALIDA_AREAS.filter((area) => builtTypes.has(getAreaRoomId(area)));
}

export function formatRevalidaReference(q: RevalidaQuestion): string {
  return `Revalida/INEP ${q.editionLabel} — Questão ${q.number}`;
}

function pickRandom<T>(list: T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

function pickReviewQuestion(state: GameState, areas: Set<RevalidaArea>): RevalidaQuestion | undefined {
  const due = state.revalidaReviewIds
    .map((id) => bank.byId.get(id))
    .filter((q): q is RevalidaQuestion => !!q && areas.has(q.area) && q.id !== bank.lastPickedId);
  return due[0];
}

/** Escolhe a próxima questão: a cada N pacientes traz uma revisão; senão, uma questão nova da área liberada. */
export function pickRevalidaQuestion(state: GameState): RevalidaQuestion | undefined {
  const unlocked = getUnlockedAreas(state);
  const areas = new Set<RevalidaArea>(unlocked.length ? unlocked : ['clinica_medica']);
  state.revalidaPatientCounter = (state.revalidaPatientCounter ?? 0) + 1;

  const isReviewTurn = state.revalidaPatientCounter % BALANCE.revalida.reviewEveryNthPatient === 0;
  const review = isReviewTurn ? pickReviewQuestion(state, areas) : undefined;
  if (review) return remember(review);

  const mastered = new Set(state.masteredCaseIds);
  const fresh = bank.questions.filter((q) => areas.has(q.area) && !mastered.has(q.id) && q.id !== bank.lastPickedId);
  const chosen = pickRandom(fresh) ?? pickReviewQuestion(state, areas) ?? pickRandom(bank.questions.filter((q) => areas.has(q.area)));
  return chosen ? remember(chosen) : undefined;
}

function remember(q: RevalidaQuestion): RevalidaQuestion {
  bank.lastPickedId = q.id;
  return q;
}

/** Idade citada no enunciado ("Homem de 62 anos"), para o paciente do jogo combinar com a questão. */
export function extractPatientAge(stem: string): number | null {
  const match = stem.match(/(\d{1,3})\s+(anos|meses|dias|semanas)/);
  if (!match) return null;
  if (match[2] !== 'anos') return 0;
  const age = Number(match[1]);
  return age >= 0 && age <= MAX_PLAUSIBLE_AGE ? age : null;
}

const MAX_PLAUSIBLE_AGE = 119;
const GENDER_SCAN_CHARS = 160;
const FEMALE_WORDS = /\b(mulher|menina|gestante|primigesta|secundigesta|tercigesta|multípara|nulípara|puérpera|lactante|idosa|uma paciente|uma adolescente|uma criança do sexo feminino|sexo feminino)\b/;
const MALE_WORDS = /\b(homem|menino|idoso|um paciente|um adolescente|sexo masculino)\b/;
// Sem \b porque "útero" começa com letra acentuada (o \b do JavaScript não reconhece).
const FEMALE_ANATOMY = /(?<![a-zà-ú])(útero|uterin[oa]|ovári[oa]s?|vagina[l]?|menstrua[a-zà-ú]*|gravidez|gestação)(?![a-zà-ú])/;
const MALE_ANATOMY = /\b(escroto|escrotal|hemiescroto|testículos?|próstata|prostátic[oa]|pênis|peniana|glande)\b/;

/** Sexo do paciente conforme o enunciado ("Mulher de 30 anos", "Um paciente... testículo"). */
export function inferRevalidaPatientGender(stem: string): 'female' | 'male' | null {
  const start = stem.slice(0, GENDER_SCAN_CHARS).toLowerCase();
  if (FEMALE_WORDS.test(start)) return 'female';
  if (MALE_WORDS.test(start)) return 'male';
  const full = stem.toLowerCase();
  if (MALE_ANATOMY.test(full)) return 'male';
  if (FEMALE_ANATOMY.test(full)) return 'female';
  return null;
}

export function buildRevalidaCaseDefinition(q: RevalidaQuestion): ClinicalCaseDefinition {
  const age = extractPatientAge(q.stem);
  const fallback = BALANCE.revalida.defaultPatientAge;
  const correct = q.options.find((o) => o.key === q.answer);
  return {
    id: q.id,
    name: formatRevalidaReference(q),
    area: q.area,
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 1,
    ageRange: age !== null ? { min: age, max: age } : fallback,
    symptoms: [],
    suggestedExams: [],
    suggestedConduct: { id: `${q.id}-${q.answer}`, text: correct?.text ?? '' },
    distractorConducts: q.options.filter((o) => o.key !== q.answer).map((o) => ({ id: `${q.id}-${o.key}`, text: o.text, whyWrong: '' })),
    medications: [],
    requiresPharmacy: false,
    explanation: getRevalidaCommentary(q.id) ?? '',
    possibleComorbidities: [],
    sources: [{ name: formatRevalidaReference(q), url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos', accessedOn: '2026-10-28' }],
    version: '1.0.0',
    reviewedOn: '2026-10-28',
    reviewStatus: 'official',
    revalida: { question: q, reference: formatRevalidaReference(q), commentary: getRevalidaCommentary(q.id) },
  };
}

/** Atualiza a fila de revisão: erro entra na fila; acerto sai dela. */
export function registerRevalidaAnswer(state: GameState, questionId: string, isCorrect: boolean): void {
  const without = state.revalidaReviewIds.filter((id) => id !== questionId);
  state.revalidaReviewIds = isCorrect ? without : [...without, questionId];
  const delta = isCorrect ? BALANCE.revalida.correctReputationGain : -BALANCE.revalida.wrongReputationPenalty;
  state.reputation = Math.max(0, Math.min(BALANCE.revalida.reputationCap, state.reputation + delta));
}
