/**
 * Arquivo: src/systems/exam-routing-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia o encaminhamento físico e diagnóstico de exames complementares (Laboratório e Raio-X),
 * concedendo bônus financeiro SIGTAP (+R$ 1.200), incremento de satisfação (+8%) e detecção de carência de salas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 24, conectando as salas de Laboratório (laboratory) e Raio-X (xray)
 * ao fluxo clínico dos pacientes, valorizando a infraestrutura diagnóstica da unidade básica ou hospitalar.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Bônus e durações são configurados nas constantes EXAM_SIGTAP_BONUS e EXAM_DURATION_SEC.
 *
 * Importa: src/entities/patient.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/systems/advisor-system.ts, src/ui/entity-inspector.ts
 */

import type { PatientInstance } from '../entities/patient';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

export const EXAM_DURATION_SEC = 4;
export const EXAM_SIGTAP_BONUS = 1200;
export const EXAM_SATISFACTION_BONUS = 8;
export const MAX_SATISFACTION_PCT = 100;

export type ExamType = 'laboratory' | 'xray';

const XRAY_KEYWORDS = ['raio', 'rx', 'imagem', 'radiografia', 'tomografia', 'fratura', 'trauma', 'pulmão'];
const LAB_KEYWORDS = ['hemograma', 'sangue', 'glicemia', 'urina', 'bioquimica', 'sorologia', 'cultura', 'laboratorio'];

export function detectRequiredExam(patient: PatientInstance): ExamType | null {
  const def = patient.clinicalCase.definition;
  const exams = def.suggestedExams?.join(' ').toLowerCase() ?? '';
  const symptoms = def.symptoms?.join(' ').toLowerCase() ?? '';
  const fullText = `${def.name} ${exams} ${symptoms}`.toLowerCase();

  for (const kw of XRAY_KEYWORDS) {
    if (fullText.includes(kw)) return 'xray';
  }
  for (const kw of LAB_KEYWORDS) {
    if (fullText.includes(kw)) return 'laboratory';
  }

  const severity = def.severity || 'Leve';
  if (severity === 'Grave') {
    return def.area === 'Trauma' ? 'xray' : 'laboratory';
  }
  if (severity === 'Moderada') {
    if (def.area === 'Trauma' || def.area === 'Respiratórios') return 'xray';
    if (def.area === 'Infecciosos' || def.area === 'Endócrinos') return 'laboratory';
  }

  return null;
}

export function hasActiveExamRoom(state: GameState, examType: ExamType): boolean {
  return Array.from(state.rooms.values()).some((r) => r.definition.id === examType);
}

export function executeExamWorkflow(
  state: GameState,
  patient: PatientInstance
): { conducted: boolean; bonus: number; examType: ExamType | null } {
  const needed = detectRequiredExam(patient);
  patient.examRequired = needed;

  if (!needed || !hasActiveExamRoom(state, needed)) {
    return { conducted: false, bonus: 0, examType: needed };
  }

  state.cash += EXAM_SIGTAP_BONUS;
  state.finances.bpaRevenue += EXAM_SIGTAP_BONUS;
  patient.satisfaction = Math.min(MAX_SATISFACTION_PCT, patient.satisfaction + EXAM_SATISFACTION_BONUS);
  patient.examCompleted = true;

  globalBus.emit('exam:completed', {
    patientId: patient.id,
    examType: needed,
    bonus: EXAM_SIGTAP_BONUS,
  });

  return { conducted: true, bonus: EXAM_SIGTAP_BONUS, examType: needed };
}

export function checkExamRoomAdvice(state: GameState): 'laboratory' | 'xray' | null {
  const hasLab = hasActiveExamRoom(state, 'laboratory');
  const hasXray = hasActiveExamRoom(state, 'xray');

  for (const pat of state.patients.values()) {
    if (pat.state === 'waiting' || pat.state === 'in_consultation') {
      const exam = detectRequiredExam(pat);
      if (exam === 'laboratory' && !hasLab) return 'laboratory';
      if (exam === 'xray' && !hasXray) return 'xray';
    }
  }
  return null;
}
