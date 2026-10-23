/**
 * Arquivo: tests/staff-and-events.test.ts
 * O que faz: Testa o sistema de equipe (habilidades, salários e fórmula de tempo de consulta) e o sistema de eventos dinâmicos do GDD.
 * Para que foi criado: Validar a implementação dos Prompts 5 e 8 do GDD.
 * Como modificar/debugar: Execute `npm run test` para validar.
 * Importa: vitest, src/systems/staff-system.ts, src/entities/staff.ts, src/systems/event-system.ts, src/core/simulation.ts
 */

import { describe, it, expect } from 'vitest';
import { calculateConsultationDuration } from '../src/entities/staff';
import { hireStaff, fireStaff, calculateTotalDailyStaffSalaries } from '../src/systems/staff-system';
import { updateEventSystem, getActiveArrivalMultiplier } from '../src/systems/event-system';
import { HospitalSimulation } from '../src/core/simulation';
import { BALANCE } from '../src/core/config';

describe('Sistema de Equipe (Prompt 5)', () => {
  it('reduz o tempo de consulta em 5% por nível de habilidade adicional acima de 1', () => {
    const baseTime = 20;
    // Habilidade 1: 20 * (1 - 0.05 * 0) = 20s
    expect(calculateConsultationDuration(baseTime, 1)).toBe(20);
    // Habilidade 3: 20 * (1 - 0.05 * 2) = 20 * 0.90 = 18s
    expect(calculateConsultationDuration(baseTime, 3)).toBe(18);
    // Habilidade 5: 20 * (1 - 0.05 * 4) = 20 * 0.80 = 16s
    expect(calculateConsultationDuration(baseTime, 5)).toBe(16);
  });

  it('permite contratar e demitir profissionais atualizando a folha salarial', () => {
    const sim = new HospitalSimulation();
    const initialStaffCount = sim.state.staff.size;
    const initialSalaries = calculateTotalDailyStaffSalaries(sim.state);

    const newDoc = hireStaff(sim.state, 'doctor', 3);
    expect(newDoc).not.toBeNull();
    expect(sim.state.staff.size).toBe(initialStaffCount + 1);
    expect(calculateTotalDailyStaffSalaries(sim.state)).toBeGreaterThan(initialSalaries);

    const fired = fireStaff(sim.state, newDoc!.id);
    expect(fired).toBe(true);
    expect(sim.state.staff.size).toBe(initialStaffCount);
    expect(calculateTotalDailyStaffSalaries(sim.state)).toBe(initialSalaries);
  });
});

describe('Sistema de Eventos Dinâmicos (Prompt 8)', () => {
  it('dispara eventos após o temporizador e atualiza o multiplicador de chegada', () => {
    const sim = new HospitalSimulation();
    expect(sim.state.activeEvents.length).toBe(0);

    // Avança o temporizador até a borda e dá 1 segundo para disparar o evento
    sim.state.eventTimerSec = BALANCE.events.intervalBetweenEventsSec;
    updateEventSystem(sim.state, 1);
    expect(sim.state.activeEvents.length).toBe(1);

    const mult = getActiveArrivalMultiplier(sim.state);
    expect(mult).toBeGreaterThan(0);
  });

  it('encerra o evento quando a duração expira', () => {
    const sim = new HospitalSimulation();
    sim.state.eventTimerSec = BALANCE.events.intervalBetweenEventsSec;
    updateEventSystem(sim.state, 1);
    expect(sim.state.activeEvents.length).toBe(1);
    const active = sim.state.activeEvents[0]!;

    // Avança tempo superior à duração do evento
    updateEventSystem(sim.state, active.definition.durationSec + 5);
    expect(sim.state.activeEvents.length).toBe(0);
  });
});
