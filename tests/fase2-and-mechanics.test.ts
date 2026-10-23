/**
 * Arquivo: tests/fase2-and-mechanics.test.ts
 * O que faz: Testa as novas mecânicas da Fase 2 (movimentação de salas, fila de espera de decisões clínicas, progressão hospitalar e dicas contextuais de tutorial).
 * Para que foi criado: Garantir estabilidade e regressão zero nas funcionalidades solicitadas pelo usuário para a Fase 2.
 * Como modificar/debugar: Execute `npx vitest run tests/fase2-and-mechanics.test.ts`.
 * Importa: vitest, src/core/*, src/systems/*
 */

import { describe, it, expect } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import { canMoveRoom } from '../src/systems/grid-system';
import { getNextPendingDecision, finishPatientDecision } from '../src/systems/consultation-system';
import { checkHospitalProgression } from '../src/systems/progression-system';
import { triggerTutorialTip } from '../src/systems/tutorial-system';
import { CASES_CATALOG } from '../src/core/config';

describe('Mecânicas da Fase 2 e Melhorias de Jogabilidade', () => {
  it('permite mover uma sala para uma posição livre sem gerar custo extra', () => {
    const sim = new HospitalSimulation();
    const room = Array.from(sim.state.rooms.values())[0]!;
    const prevCash = sim.state.cash;

    // Tenta mover para uma posição livre na grade (tamanho 12x10)
    const valid = canMoveRoom(sim.state, room.id, 6, 6, false);
    expect(valid).toBe(true);

    const moved = sim.moveRoom(room.id, 6, 6, false);
    expect(moved).toBe(true);
    expect(sim.state.cash).toBe(prevCash); // Mover não cobra dinheiro adicional

    const updated = sim.state.rooms.get(room.id);
    expect(updated?.col).toBe(6);
    expect(updated?.row).toBe(6);
  });

  it('impede mover uma sala para uma coordenada ocupada por outra sala', () => {
    const sim = new HospitalSimulation();
    const rooms = Array.from(sim.state.rooms.values());
    const r1 = rooms[0]!;
    const r2 = rooms[1]!;

    // Tentar mover r1 exatamente em cima de r2
    const canOverlap = canMoveRoom(sim.state, r1.id, r2.col, r2.row, false);
    expect(canOverlap).toBe(false);

    const moved = sim.moveRoom(r1.id, r2.col, r2.row, false);
    expect(moved).toBe(false);
  });

  it('gerencia fila de espera de decisões clínicas sem perder pacientes', () => {
    const sim = new HospitalSimulation();
    sim.step(16);

    const patient = Array.from(sim.state.patients.values())[0]!;
    patient.state = 'needs_decision';
    sim.state.pendingDecisionPatientIds.push(patient.id);

    const next = getNextPendingDecision(sim.state);
    expect(next?.id).toBe(patient.id);

    // Conclui atendimento
    finishPatientDecision(sim.state, patient.id);
    expect(sim.state.pendingDecisionPatientIds).not.toContain(patient.id);
  });

  it('evolui o nível do hospital de UBS para UPA 24h ao bater metas de reputação e pacientes', () => {
    const sim = new HospitalSimulation();
    expect(sim.state.hospitalLevel).toBe('ubs');

    sim.state.stats.treatedCount = 15;
    sim.state.reputation = 60;

    checkHospitalProgression(sim.state);

    expect(sim.state.hospitalLevel).toBe('upa');
    expect(sim.state.unlockedRoomIds).toContain('triage');
    expect(sim.state.unlockedRoomIds).toContain('observation');
  });

  it('dispara dicas de tutorial sem repeti-las indevidamente', () => {
    const sim = new HospitalSimulation();
    expect(sim.state.seenTutorialTips).not.toContain('game_start');

    const firstTrigger = triggerTutorialTip(sim.state, 'game_start');
    expect(firstTrigger).toBe(true);
    expect(sim.state.seenTutorialTips).toContain('welcome_ubs');

    const secondTrigger = triggerTutorialTip(sim.state, 'game_start');
    expect(secondTrigger).toBe(false); // Já foi exibida
  });

  it('contém os 10 casos clínicos com condutas do SUS catalogados', () => {
    expect(CASES_CATALOG.cases.length).toBeGreaterThanOrEqual(10);
    for (const c of CASES_CATALOG.cases) {
      expect(c.suggestedConduct.id).toBeTruthy();
      expect(c.distractorConducts.length).toBeGreaterThanOrEqual(1);
      expect(c.symptoms.length).toBeGreaterThan(0);
      expect(c.explanation).toBeTruthy();
    }
  });
});
