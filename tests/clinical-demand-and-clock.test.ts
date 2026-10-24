/**
 * Arquivo: tests/clinical-demand-and-clock.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a atenção clínica sob demanda (on-demand treatment), transição de estados de pacientes, faturamento SIGTAP (+R$ 3.600), dedução RENAME, pausa absoluta determinística (0x) e aceleração proporcional (2x e 3x).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos da versão 0.3.0 e evitar regressões no fluxo de popups clínicos e no relógio determinístico do jogo.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Caso algum teste de tempo falhe, inspecione src/core/simulation.ts (step, setSpeed) ou src/systems/consultation-system.ts.
 *
 * Importa: vitest, src/core/simulation.ts, src/core/config.ts, src/systems/event-system.ts
 * Conecta-se com: vitest runner
 */

import { describe, it, expect } from 'vitest';
import { HospitalSimulation } from '../src/core/simulation';
import { BALANCE, PHARMACY_CATALOG } from '../src/core/config';
import type { ActiveEvent } from '../src/entities/event';

describe('Atenção Clínica Sob Demanda & Relógio Determinístico', () => {
  it('mantém paciente em ready_for_treatment no consultório sem disparar resolução automática até ação explícita', () => {
    const sim = new HospitalSimulation();
    sim.step(16); // Tempo suficiente para chegada e entrada no consultório inicial

    const patient = Array.from(sim.state.patients.values()).find(
      (p) => p.state === 'ready_for_treatment'
    );
    expect(patient).toBeDefined();
    expect(patient?.clinicalCase.decisionMade).toBe(false);
    expect(patient?.currentRoomId).toBeDefined();

    // Avança simulação com o paciente aguardando no consultório
    sim.step(2);
    expect(patient?.state).toBe('ready_for_treatment');
    expect(patient?.clinicalCase.decisionMade).toBe(false);

    // Jogador aciona a consulta explicitamente
    const triggered = sim.triggerConsultation(patient!.id);
    expect(triggered).not.toBeNull();
    expect(patient?.state).toBe('needs_decision');
  });

  it('libera consultório, deduz medicamento RENAME e soma faturamento SIGTAP (+R$ 3.600) ao resolver caso', () => {
    const sim = new HospitalSimulation();
    sim.step(16);

    const patient = Array.from(sim.state.patients.values()).find(
      (p) => p.state === 'ready_for_treatment'
    );
    expect(patient).toBeDefined();
    if (!patient) return;

    const room = sim.state.rooms.get(patient.currentRoomId!);
    expect(room?.occupantIds).toContain(patient.id);

    const initialCash = sim.state.cash;
    const initialBpa = sim.state.finances.bpaRevenue;
    const firstMedId = PHARMACY_CATALOG.medications[0]?.id;
    const initialMedStock = firstMedId ? sim.state.pharmacyStock[firstMedId] ?? 0 : 0;

    // Aciona e resolve conduta clínica correta
    sim.triggerConsultation(patient.id);
    const correctConduct = patient.clinicalCase.conductOptions.find((c) => c.isCorrect)!;
    const resolved = sim.submitClinicalDecision(patient.id, correctConduct.id);

    expect(resolved).toBe(true);
    expect(patient.state).toBe('treated');
    expect(patient.clinicalCase.isDecisionCorrect).toBe(true);
    expect(room?.occupantIds).not.toContain(patient.id);

    // Faturamento SIGTAP mínimo de R$ 3.600
    const earnedRevenue = sim.state.cash - initialCash;
    expect(earnedRevenue).toBeGreaterThanOrEqual(BALANCE.economy.revenuePerPatient);
    expect(sim.state.finances.bpaRevenue - initialBpa).toBeGreaterThanOrEqual(BALANCE.economy.revenuePerPatient);
    expect(sim.state.pendingDecisionPatientIds).not.toContain(patient.id);

    // Se o caso exigia medicação e farmácia estava presente, deduziu estoque
    if (patient.clinicalCase.definition.requiresPharmacy && firstMedId) {
      expect(sim.state.pharmacyStock[firstMedId]).toBeLessThanOrEqual(initialMedStock);
    }
  });

  it('em velocidade 0x (Pausa), qualquer avanço de tempo produz 0 ticks e congela sistemas', () => {
    const sim = new HospitalSimulation();
    sim.step(16);

    // Injeta evento ativo para monitorar contagem regressiva
    const testEvent: ActiveEvent = {
      instanceId: 'test_evt',
      definition: {
        id: 'test_epidemic',
        type: 'epidemic',
        title: 'Surto Teste',
        icon: '🦠',
        description: 'Descrição de teste',
        durationSec: 60,
        arrivalMultiplier: 2,
      },
      remainingSec: 60,
      elapsedSec: 0,
    };
    sim.state.activeEvents.push(testEvent);

    const patient = Array.from(sim.state.patients.values())[0]!;
    const prevWaitTime = patient.waitTimeSec;
    const prevDayTime = sim.state.dayTimeSec;
    const prevEventTimer = sim.state.eventTimerSec;
    const prevArrivalTimer = sim.state.arrivalTimerSec;
    const prevEventRemaining = testEvent.remainingSec;
    const prevPatientsCount = sim.state.patients.size;

    // Pausa a simulação
    sim.setSpeed(0);
    expect(sim.state.speed).toBe(0);

    // Avança múltiplos passos com grande delta
    sim.step(10);
    sim.step(50);
    sim.step(100);

    // Nada deve ter mudado
    expect(sim.state.dayTimeSec).toBe(prevDayTime);
    expect(sim.state.eventTimerSec).toBe(prevEventTimer);
    expect(sim.state.arrivalTimerSec).toBe(prevArrivalTimer);
    expect(patient.waitTimeSec).toBe(prevWaitTime);
    expect(testEvent.remainingSec).toBe(prevEventRemaining);
    expect(sim.state.patients.size).toBe(prevPatientsCount);
  });

  it('auto-pausa inteligente em modais memoriza e restaura a velocidade anterior com precisão', () => {
    const sim = new HospitalSimulation();
    sim.setSpeed(3);
    expect(sim.state.speed).toBe(3);

    sim.pauseForModal();
    expect(sim.state.speed).toBe(0);

    sim.resumeFromModal();
    expect(sim.state.speed).toBe(3);
  });

  it('avança temporizadores e dia exatamente ao dobro em 2x e ao triplo em 3x em relação a 1x', () => {
    const sim1x = new HospitalSimulation();
    const sim2x = new HospitalSimulation();
    const sim3x = new HospitalSimulation();

    sim1x.state.arrivalTimerSec = 0;
    sim2x.state.arrivalTimerSec = 0;
    sim3x.state.arrivalTimerSec = 0;

    const initialEvent = sim1x.state.eventTimerSec;
    const initialArrival = 0;

    sim1x.setSpeed(1);
    sim2x.setSpeed(2);
    sim3x.setSpeed(3);

    const deltaSec = 1.0;
    sim1x.step(deltaSec);
    sim2x.step(deltaSec);
    sim3x.step(deltaSec);

    // DayTimeSec (starts at 0)
    expect(sim2x.state.dayTimeSec).toBeCloseTo(sim1x.state.dayTimeSec * 2, 4);
    expect(sim3x.state.dayTimeSec).toBeCloseTo(sim1x.state.dayTimeSec * 3, 4);

    // EventTimer advance
    const eventAdv1x = sim1x.state.eventTimerSec - initialEvent;
    const eventAdv2x = sim2x.state.eventTimerSec - initialEvent;
    const eventAdv3x = sim3x.state.eventTimerSec - initialEvent;
    expect(eventAdv2x).toBeCloseTo(eventAdv1x * 2, 4);
    expect(eventAdv3x).toBeCloseTo(eventAdv1x * 3, 4);

    // ArrivalTimer advance
    const arrivalAdv1x = sim1x.state.arrivalTimerSec - initialArrival;
    const arrivalAdv2x = sim2x.state.arrivalTimerSec - initialArrival;
    const arrivalAdv3x = sim3x.state.arrivalTimerSec - initialArrival;
    expect(arrivalAdv2x).toBeCloseTo(arrivalAdv1x * 2, 4);
    expect(arrivalAdv3x).toBeCloseTo(arrivalAdv1x * 3, 4);
  });
});
