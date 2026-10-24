/**
 * Arquivo: tests/simulation.test.ts
 * O que faz: Testa o fluxo completo da simulação (início do jogo, posicionamento de salas, ciclo de atendimento e decisões clínicas).
 * Para que foi criado: Validar a mecânica central do jogo (Vertical Slice) sem depender do navegador ou PixiJS.
 * Como modificar/debugar: Execute `npm run test` para validar.
 * Importa: vitest, src/core/simulation.ts, src/core/config.ts
 */

import { describe, it, expect } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import { BALANCE } from '../src/core/config';

describe('Simulação Central do Hospital', () => {
  it('inicializa com o caixa inicial e as salas configuradas no GDD', () => {
    const sim = new HospitalSimulation();
    expect(sim.state.cash).toBe(BALANCE.economy.startingCash);
    expect(sim.state.reputation).toBe(BALANCE.reputation.initial);
    expect(sim.state.rooms.size).toBe(BALANCE.starterRooms.length);
  });

  it('permite construir uma sala válida e desconta o custo do caixa', () => {
    const sim = new HospitalSimulation();
    const prevCash = sim.state.cash;
    const success = sim.buildRoom('waiting', 1, 4);

    expect(success).toBe(true);
    expect(sim.state.cash).toBeLessThan(prevCash);
  });

  it('impede a construção sobreposta (colisão na grade)', () => {
    const sim = new HospitalSimulation();
    // A recepção inicial já ocupa col 1, row 1
    const overlapSuccess = sim.buildRoom('waiting', 1, 1);
    expect(overlapSuccess).toBe(false);
  });

  it('demole uma sala e reembolsa 50% do valor gasto', () => {
    const sim = new HospitalSimulation();
    sim.buildRoom('waiting', 1, 5);
    const room = Array.from(sim.state.rooms.values()).find((r) => r.typeId === 'waiting')!;

    const prevCash = sim.state.cash;
    const refundSuccess = sim.demolishRoom(room.id);

    expect(refundSuccess).toBe(true);
    expect(sim.state.cash).toBe(prevCash + Math.floor(room.definition.cost * BALANCE.economy.removeRefundRatio));
  });

  it('processa tomada de decisão médica correta e encerra consulta', () => {
    const sim = new HospitalSimulation();
    // Simula a chegada e alocação de um paciente
    sim.step(16); // Intervalo base para gerar paciente e iniciar consulta

    const inConsult = Array.from(sim.state.patients.values()).find(
      (p) => p.state === 'ready_for_treatment' || p.state === 'in_consultation' || p.state === 'waiting'
    );
    expect(inConsult).toBeDefined();

    if (inConsult) {
      inConsult.state = 'needs_decision';
      const correctConduct = inConsult.clinicalCase.conductOptions.find((c) => c.isCorrect)!;
      const res = sim.submitClinicalDecision(inConsult.id, correctConduct.id);

      expect(res).toBe(true);
      expect(inConsult.clinicalCase.isDecisionCorrect).toBe(true);
      expect(inConsult.state).toBe('treated');
      expect(sim.state.stats.correctDecisions).toBe(1);
    }
  });
});
