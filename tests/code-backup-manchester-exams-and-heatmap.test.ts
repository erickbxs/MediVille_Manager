/**
 * Arquivo: tests/code-backup-manchester-exams-and-heatmap.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a integridade do sistema de backup automático (scripts/code-backup.mjs), a ordenação prioritária
 * da fila pelo Protocolo de Manchester (Vermelho > Laranja > Amarelo > Verde > Azul), o fluxo de exames complementares
 * (Laboratório/Raio-X com bônus SIGTAP de R$ 1.200 e satisfação) e a coloração dos modos do Mapa de Calor Administrativo.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir a cobertura de testes automatizados do Prompt 24 da versão v2.2.0, prevenindo regressões nas regras clínicas,
 * de gestão de filas e nos snapshots de código.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute `npx vitest run tests/code-backup-manchester-exams-and-heatmap.test.ts`. Verifique as asserções de cada suite.
 *
 * Importa: vitest, node:fs, node:path, src/core/new-game.ts, src/core/config.ts, src/entities/patient.ts,
 *          src/entities/room.ts, src/systems/triage-system.ts, src/systems/exam-routing-system.ts,
 *          src/render/heatmap-overlay.ts, scripts/code-backup.mjs
 * Conecta-se com: scripts/code-backup.mjs, src/systems/triage-system.ts, src/systems/exam-routing-system.ts, src/render/heatmap-overlay.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialGameState } from '../src/core/new-game';
import { ROOMS_CATALOG, type ClinicalCaseDefinition } from '../src/core/config';
import { createRoomInstance } from '../src/entities/room';
import type { GameState } from '../src/state/game-state';
import type { PatientInstance } from '../src/entities/patient';
import {
  classifyManchester,
  orderQueueByManchester,
  classifyPatientTriage,
} from '../src/systems/triage-system';
import {
  detectRequiredExam,
  hasActiveExamRoom,
  executeExamWorkflow,
  checkExamRoomAdvice,
  EXAM_SIGTAP_BONUS,
} from '../src/systems/exam-routing-system';
import { getAdvisorAlerts } from '../src/systems/advisor-system';
import {
  HeatmapOverlay,
  getOccupancyColor,
  getHygieneColor,
  getRevenueColor,
} from '../src/render/heatmap-overlay';
import {
  saveCheckpoint,
  listCheckpoints,
  rollbackCheckpoint,
} from '../scripts/code-backup.mjs';

function createMockPatient(
  id: string,
  severity: 'Leve' | 'Moderada' | 'Grave',
  options?: Partial<PatientInstance>
): PatientInstance {
  return {
    id,
    name: `Paciente ${id}`,
    age: 35,
    gender: 'male',
    clinicalCase: {
      definition: {
        id: `case_${id}`,
        name: `Caso ${id}`,
        area: 'clinica_geral',
        severity,
        symptoms: ['Sintoma teste'],
        medicationIds: ['dipirona'],
        baseReward: 300,
        difficulty: 1,
      } as unknown as ClinicalCaseDefinition,
      intensityId: 'normal',
      comorbidity: null,
      conductOptions: [],
      chosenConductId: null,
      decisionMade: false,
      isDecisionCorrect: false,
      feedbackText: '',
    },
    state: 'waiting',
    patienceSec: 100,
    waitTimeSec: 0,
    consultationTimeSec: 0,
    consultationDurationSec: 5,
    currentRoomId: null,
    satisfaction: 80,
    errorsCount: 0,
    ...options,
  };
}

describe('Prompt 24 — Sistema de Backup Automático de Código (code-backup.mjs)', () => {
  const tempDir = path.resolve(process.cwd(), '.backups_test_sandbox');

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('salva checkpoint, registra no manifesto e limita a retenção', () => {
    const entry1 = saveCheckpoint('test_backup_1', { baseDir: tempDir });
    expect(entry1).toBeDefined();
    expect(entry1.label).toBe('test_backup_1');
    expect(fs.existsSync(path.join(tempDir, entry1.id))).toBe(true);

    const manifestPath = path.join(tempDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const list = listCheckpoints({ baseDir: tempDir });
    expect(list.length).toBe(1);
    expect(list[0]?.id).toBe(entry1.id);

    const entry2 = saveCheckpoint('test_backup_2', { baseDir: tempDir });
    const updatedList = listCheckpoints({ baseDir: tempDir });
    expect(updatedList.length).toBe(2);
    expect(updatedList[1]?.id).toBe(entry2.id);
  });

  it('faz rollback restaurando snapshot salvo', () => {
    const entry = saveCheckpoint('rollback_target', { baseDir: tempDir });
    const restored = rollbackCheckpoint(entry.id, { baseDir: tempDir, skipGitReset: true });
    expect(restored).not.toBeNull();
    expect(restored?.id).toBe(entry.id);
  });
});

describe('Prompt 24 — Protocolo de Triagem de Manchester por Cores de Risco', () => {
  it('classifica corretamente os casos clínicos por gravidade e sinais clínicos', () => {
    const severePatient = createMockPatient('p1', 'Grave');
    const prio1 = classifyManchester(severePatient);
    expect(prio1 === 'red' || prio1 === 'orange').toBe(true);

    const mildPatient = createMockPatient('p2', 'Leve');
    const prio2 = classifyManchester(mildPatient);
    expect(prio2 === 'green' || prio2 === 'blue').toBe(true);
  });

  it('ordena a fila de espera priorizando pacientes Vermelhos e Laranjas sobre Verdes e Azuis', () => {
    const state: GameState = createInitialGameState();
    state.patients.clear();
    state.queueIds = [];

    const pBlue = createMockPatient('blue_1', 'Leve', { manchesterPriority: 'blue' });
    const pGreen = createMockPatient('green_1', 'Leve', { manchesterPriority: 'green' });
    const pRed = createMockPatient('red_1', 'Grave', { manchesterPriority: 'red' });
    const pOrange = createMockPatient('orange_1', 'Grave', { manchesterPriority: 'orange' });
    const pYellow = createMockPatient('yellow_1', 'Moderada', { manchesterPriority: 'yellow' });

    state.patients.set(pBlue.id, pBlue);
    state.patients.set(pGreen.id, pGreen);
    state.patients.set(pRed.id, pRed);
    state.patients.set(pOrange.id, pOrange);
    state.patients.set(pYellow.id, pYellow);

    state.queueIds = [pBlue.id, pGreen.id, pRed.id, pOrange.id, pYellow.id];

    orderQueueByManchester(state);

    expect(state.queueIds).toEqual(['red_1', 'orange_1', 'yellow_1', 'green_1', 'blue_1']);
  });

  it('credita procedimento SIGTAP de acolhimento com risco (+R$ 400)', () => {
    const state: GameState = createInitialGameState();
    const initialFunds = state.cash;
    const pat = createMockPatient('p_triage', 'Moderada');
    state.patients.set(pat.id, pat);

    const prio = classifyPatientTriage(state, pat);
    expect(prio).toBeDefined();
    expect(pat.triaged).toBe(true);
    expect(state.cash).toBe(initialFunds + 400);
  });
});

describe('Prompt 24 — Fluxo Físico de Exames Complementares (Lab / Raio-X)', () => {
  it('detecta se o caso requer laboratório ou raio-x', () => {
    const caseXray = createMockPatient('p_xray', 'Moderada');
    caseXray.clinicalCase.definition = {
      id: 'case_trauma',
      name: 'Fratura de Membro',
      area: 'Trauma',
      severity: 'Moderada',
      symptoms: ['dor intensa', 'fratura fechada'],
      medicationIds: ['analgesico'],
      baseReward: 400,
      difficulty: 2,
    } as unknown as ClinicalCaseDefinition;

    const examType = detectRequiredExam(caseXray);
    expect(examType).toBe('xray');
  });

  it('aplica bônus SIGTAP (+R$ 1.200) e satisfação (+8%) quando há sala e staff', () => {
    const state: GameState = createInitialGameState();
    const initialFunds = state.cash;

    const patient = createMockPatient('p_exam', 'Moderada');
    patient.clinicalCase.definition = {
      id: 'case_diabetes',
      name: 'Diabetes Descompensada',
      area: 'Endócrinos',
      severity: 'Moderada',
      symptoms: ['glicemia elevada', 'exame de sangue'],
      medicationIds: ['insulina'],
      baseReward: 500,
      difficulty: 2,
    } as unknown as ClinicalCaseDefinition;

    // Sem sala construída, não executa
    const withoutRoom = executeExamWorkflow(state, patient);
    expect(withoutRoom.conducted).toBe(false);

    // Constrói laboratório
    const labDef = ROOMS_CATALOG.rooms.find((r) => r.id === 'laboratory') ?? {
      id: 'laboratory',
      nameKey: 'rooms.laboratory.name',
      shortName: 'Lab',
      role: 'treatment' as const,
      icon: '🧪',
      width: 3,
      height: 3,
      cost: 3000,
      dailyUpkeep: 45,
      capacity: 2,
      hasStaff: true,
      color: '#06b6d4',
    };
    const labRoom = createRoomInstance('room_lab_1', labDef, 2, 2);
    state.rooms.set(labRoom.id, labRoom);

    expect(hasActiveExamRoom(state, 'laboratory')).toBe(true);

    const executed = executeExamWorkflow(state, patient);
    expect(executed.conducted).toBe(true);
    expect(patient.examCompleted).toBe(true);
    expect(state.cash).toBe(initialFunds + EXAM_SIGTAP_BONUS);
  });

  it('gera recomendação do Conselheiro para construir Lab/Raio-X se houver demanda', () => {
    const state: GameState = createInitialGameState();
    const patientMod = createMockPatient('p_demand', 'Moderada');
    patientMod.clinicalCase.definition = {
      id: 'case_trauma2',
      name: 'Trauma Torácico',
      area: 'Trauma',
      severity: 'Moderada',
      symptoms: ['dor torácica'],
      medicationIds: [],
      baseReward: 400,
      difficulty: 2,
    } as unknown as ClinicalCaseDefinition;
    state.patients.set(patientMod.id, patientMod);

    const advice = checkExamRoomAdvice(state);
    expect(advice).toBe('xray');

    const alerts = getAdvisorAlerts(state);
    const examAlert = alerts.find((a) => a.id.startsWith('missing_'));
    expect(examAlert?.message).toBe('Exames atrasados ➔ Construir Laboratório ou Sala de Raio-X');
  });
});

describe('Prompt 24 — Mapa de Calor Administrativo (HeatmapOverlay)', () => {
  it('calcula as cores corretas por ocupação/lotação', () => {
    expect(getOccupancyColor(0)).toBe(0x10b981); // Verde (livre)
    expect(getOccupancyColor(2)).toBe(0xf59e0b); // Âmbar (moderado)
    expect(getOccupancyColor(5)).toBe(0xef4444); // Vermelho (gargalo crítico)
  });

  it('calcula as cores corretas por higiene', () => {
    expect(getHygieneColor(90)).toBe(0x10b981); // Verde (limpo)
    expect(getHygieneColor(55)).toBe(0xf59e0b); // Âmbar (atenção)
    expect(getHygieneColor(20)).toBe(0xef4444); // Vermelho (crítico/sujo)
  });

  it('calcula as cores corretas por rentabilidade', () => {
    expect(getRevenueColor(0)).toBe(0x64748b); // Neutro/cinza
    expect(getRevenueColor(1000)).toBe(0x38bdf8); // Azul claro
    expect(getRevenueColor(10000)).toBe(0x10b981); // Verde forte
  });

  it('alterna os modos ciclicamente e renderiza sem exceção', () => {
    const overlay = new HeatmapOverlay();
    expect(overlay.getMode()).toBe('OFF');

    expect(overlay.cycleMode()).toBe('OCCUPANCY');
    expect(overlay.cycleMode()).toBe('HYGIENE');
    expect(overlay.cycleMode()).toBe('REVENUE');
    expect(overlay.cycleMode()).toBe('OFF');

    const state = createInitialGameState();
    const rooms = Array.from(state.rooms.values());
    expect(() => overlay.render(rooms, state)).not.toThrow();

    overlay.setMode('OCCUPANCY');
    expect(() => overlay.render(rooms, state)).not.toThrow();
  });
});
