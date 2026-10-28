/**
 * Arquivo: tests/revalida-mode-and-report-fixes.test.ts
 * O que faz: Testa o Modo Revalida (questões oficiais do INEP como casos dos pacientes) e as correções
 * do relatório de teste da v2.2.0 (hospital novo parado, erro sem faturamento, sugestões de salas bloqueadas).
 * Importa: vitest, node:fs, node:path, src/core/simulation.ts, src/core/new-game.ts, src/core/config.ts,
 *          src/systems/revalida-system.ts, src/systems/case-system.ts, src/systems/advisor-system.ts,
 *          src/systems/staff-system.ts, src/entities/revalida-question.ts
 * Conecta-se com: public/revalida/questions.json, src/data/balance.json
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { HospitalSimulation } from '../src/core/simulation';
import { createInitialGameState } from '../src/core/new-game';
import {
  setRevalidaBank,
  isRevalidaActive,
  pickRevalidaQuestion,
  getUnlockedAreas,
  extractPatientAge,
  inferRevalidaPatientGender,
  formatRevalidaReference,
} from '../src/systems/revalida-system';
import { createPatient, filterCasesForUnit } from '../src/systems/case-system';
import { getAdvisorAlerts } from '../src/systems/advisor-system';
import { createStaffMember } from '../src/systems/staff-system';
import { CASES_CATALOG } from '../src/core/config';
import { globalBus } from '../src/core/event-bus';
import type { RevalidaQuestion } from '../src/entities/revalida-question';

const BANK_PATH = path.resolve(__dirname, '../public/revalida/questions.json');
const bankFile = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8')) as { _meta: { license: string }; questions: RevalidaQuestion[] };

describe('Banco de questões do Revalida (public/revalida/questions.json)', () => {
  it('tem _meta com fonte/licença e questões válidas, sem IDs repetidos', () => {
    expect(bankFile._meta.license).toContain('CC BY-ND');
    const ids = bankFile.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bankFile.questions.length).toBeGreaterThan(900);
  });

  it('toda questão tem 4 alternativas A–D e gabarito entre elas', () => {
    for (const q of bankFile.questions) {
      expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.answer);
      expect(q.stem.length).toBeGreaterThan(20);
    }
  });

  it('comentários (public/revalida/comments.json) apontam para questões existentes', () => {
    const comments = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/revalida/comments.json'), 'utf8')) as { comments: Record<string, string> };
    const ids = new Set(bankFile.questions.map((q) => q.id));
    const keys = Object.keys(comments.comments);
    expect(keys.length).toBeGreaterThan(90);
    for (const k of keys) {
      expect(ids.has(k)).toBe(true);
      expect(comments.comments[k]!.length).toBeGreaterThan(40);
    }
  });

  it('toda figura citada no enunciado existe em public/revalida/img', () => {
    for (const q of bankFile.questions) {
      const markers = q.stem.match(/\[\[FIG:\d+\]\]/g) ?? [];
      expect(markers.length).toBe(q.images?.length ?? 0);
      for (const img of q.images ?? []) {
        expect(fs.existsSync(path.resolve(__dirname, '../public/revalida/img', img))).toBe(true);
      }
    }
  });
});

describe('Modo Revalida — seleção de questões e paciente', () => {
  beforeAll(() => setRevalidaBank(bankFile.questions, {}));

  it('fica ativo quando o banco é carregado', () => {
    expect(isRevalidaActive()).toBe(true);
  });

  it('UBS inicial libera só as áreas das salas construídas (Clínica Médica no consultório)', () => {
    const state = createInitialGameState('ubs');
    expect(getUnlockedAreas(state)).toEqual(['clinica_medica']);
    expect(pickRevalidaQuestion(state)?.area).toBe('clinica_medica');
  });

  it('paciente traz a questão com alternativas na ordem oficial e referência do INEP', () => {
    const state = createInitialGameState('ubs');
    const patient = createPatient('p1', state.masteredCaseIds, state.hospitalLevel, state);
    const payload = patient.clinicalCase.definition.revalida!;
    expect(payload.reference).toMatch(/^Revalida\/INEP \d{4}(\/\d)? — Questão \d+$/);
    expect(patient.clinicalCase.conductOptions.map((o) => o.id.slice(-1))).toEqual(['A', 'B', 'C', 'D']);
    expect(patient.clinicalCase.conductOptions.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('lê idade e sexo do enunciado', () => {
    expect(extractPatientAge('Homem de 62 anos vai a uma UPA')).toBe(62);
    expect(extractPatientAge('Lactente de 4 meses é levado')).toBe(0);
    expect(inferRevalidaPatientGender('Mulher de 30 anos, gestante')).toBe('female');
    expect(inferRevalidaPatientGender('Homem de 62 anos')).toBe('male');
    expect(inferRevalidaPatientGender('Um paciente com 20 anos, com aumento de hemiescroto direito')).toBe('male');
    expect(inferRevalidaPatientGender('Paciente de 30 anos com atraso menstrual')).toBe('female');
  });

  it('formata a referência com edição e número', () => {
    const q = bankFile.questions.find((x) => x.editionLabel === '2025/1')!;
    expect(formatRevalidaReference(q)).toBe(`Revalida/INEP 2025/1 — Questão ${q.number}`);
  });
});

describe('Correções do relatório de teste (v2.2.0)', () => {
  beforeAll(() => setRevalidaBank(bankFile.questions, {}));

  it('Novo Hospital troca a partida sem trocar o objeto da simulação (hospital não fica parado)', () => {
    const sim = new HospitalSimulation('hospital');
    const ref = sim;
    sim.resetTo('ubs');
    expect(ref.state.cash).toBe(30000);
    expect(ref.state.unitType).toBe('ubs');
  });

  it('resposta errada não fatura e manda a questão para revisão; acerto fatura e domina', () => {
    const sim = new HospitalSimulation('ubs');
    const patient = createPatient('p_wrong', [], 'ubs', sim.state);
    patient.state = 'ready_for_treatment';
    sim.state.patients.set(patient.id, patient);
    const revenues: number[] = [];
    globalBus.on('patient:treated', ({ revenue }) => revenues.push(revenue));
    const wrong = patient.clinicalCase.conductOptions.find((o) => !o.isCorrect)!;
    sim.submitClinicalDecision(patient.id, wrong.id);
    expect(revenues[0]).toBe(0);
    expect(sim.state.revalidaReviewIds).toContain(patient.clinicalCase.definition.revalida!.question.id);

    const again = createPatient('p_right', [], 'ubs', sim.state);
    again.state = 'ready_for_treatment';
    sim.state.patients.set(again.id, again);
    const right = again.clinicalCase.conductOptions.find((o) => o.isCorrect)!;
    sim.submitClinicalDecision(again.id, right.id);
    expect(revenues[1]).toBeGreaterThan(0);
    expect(sim.state.masteredCaseIds).toContain(again.clinicalCase.definition.id);
  });

  it('Conselheiro não sugere salas bloqueadas para o porte da unidade', () => {
    const state = createInitialGameState('ubs');
    for (const a of getAdvisorAlerts(state)) {
      if (a.actionType === 'build_room' && a.targetRoomType) {
        expect(state.unlockedRoomIds).toContain(a.targetRoomType);
      }
    }
  });

  it('casos clínicos antigos de UBS não incluem casos só de hospital', () => {
    const ubsCases = filterCasesForUnit(CASES_CATALOG.cases, 'ubs');
    expect(ubsCases.every((c) => c.typicalUnit.toLowerCase().includes('ubs'))).toBe(true);
  });

  it('enfermagem não recebe o título "Dr(a)."', () => {
    expect(createStaffMember('nurse', 1)?.name.startsWith('Enf. ')).toBe(true);
    expect(createStaffMember('doctor', 1)?.name.startsWith('Dr(a). ')).toBe(true);
  });
});
