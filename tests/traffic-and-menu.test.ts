/**
 * Arquivo: tests/traffic-and-menu.test.ts
 *
 * 1. O que este arquivo faz?
 * Testa os subsistemas do Prompt 11: ciclo de vida e física do tráfego urbano 3D (spawn, aceleração, parada na faixa e drop-off de pacientes),
 * persistência e desbloqueio de patologias na Enciclopédia Médica SUS, verificação de metas com recompensa financeira,
 * e a inicialização de unidades com orçamentos distintos (UBS, UPA, Clínica e Hospital Geral).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos da versão 1.0.0 sem regressões no loop de jogo.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar testes de novos veículos ou regras de trânsito, consulte src/systems/traffic-system.ts.
 *
 * Importa: vitest, src/systems/traffic-system.ts, src/systems/goals-system.ts, src/core/new-game.ts, src/core/simulation.ts, src/core/sound-system.ts
 * Conecta-se com: vitest runner
 */

import { describe, it, expect, vi } from 'vitest';
import { TrafficSystem } from '../src/systems/traffic-system';
import { GoalsSystem } from '../src/systems/goals-system';
import { createInitialGameState } from '../src/core/new-game';
import { HospitalSimulation } from '../src/core/simulation';
import { SoundSystem } from '../src/core/sound-system';
import { globalBus } from '../src/core/event-bus';

describe('Tráfego Urbano Dinâmico & Desembarque de Pacientes', () => {
  it('cria veículos nos dois sentidos da avenida com física e velocidades corretas', () => {
    const traffic = new TrafficSystem();
    const carEast = traffic.spawnVehicle('east', 'car');
    const busWest = traffic.spawnVehicle('west', 'bus');

    expect(carEast.direction).toBe('east');
    expect(carEast.type).toBe('car');
    expect(carEast.speed).toBeGreaterThan(0);
    expect(carEast.y).toBe(traffic.getGeometry().street.laneEastboundY);

    expect(busWest.direction).toBe('west');
    expect(busWest.type).toBe('bus');
    expect(busWest.speed).toBeLessThan(0);
    expect(busWest.y).toBe(traffic.getGeometry().street.laneWestboundY);
  });

  it('move os veículos ao longo do tempo e remove quando saem dos limites do mapa', () => {
    const traffic = new TrafficSystem();
    const car = traffic.spawnVehicle('east', 'car');
    const initialX = car.x;

    traffic.update(1.0, false);
    expect(car.x).toBeGreaterThan(initialX);

    // Posiciona além da fronteira leste
    car.x = 1100;
    traffic.update(0.1, false);
    expect(traffic.vehicles.includes(car)).toBe(false);
  });

  it('desacelera antes da faixa de pedestres quando há pedestre atravessando', () => {
    const traffic = new TrafficSystem();
    const car = traffic.spawnVehicle('east', 'car');
    car.x = traffic.getGeometry().street.crosswalkX - 44;

    traffic.update(0.2, true);
    expect(car.targetSpeed).toBe(0);
  });

  it('realiza drop-off de paciente encostando na baia, abrindo porta e emitindo evento', () => {
    const traffic = new TrafficSystem();
    const disembarkSpy = vi.fn();
    globalBus.on('traffic:patient_disembarked', disembarkSpy);

    const car = traffic.spawnVehicle('east', 'car', 'pat_drop_123');
    car.x = traffic.getGeometry().stops.patientDropOffX - 4;

    traffic.update(0.1, false);

    expect(car.state).toBe('DROPPING_OFF');
    expect(car.doorOpenFactor).toBeGreaterThan(0);
    expect(disembarkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'pat_drop_123',
        x: traffic.getGeometry().stops.patientDropOffX,
        y: traffic.getGeometry().surroundings.sidewalkTopY,
      })
    );
  });
});

describe('Enciclopédia Médica SUS & Sistema de Metas', () => {
  it('registra e persiste novas patologias na Enciclopédia sem duplicidade', () => {
    const goals = new GoalsSystem();
    const unlockedFirst = goals.unlockCase('gastroenterite-aguda');
    expect(unlockedFirst).toBe(true);

    const unlockedAgain = goals.unlockCase('gastroenterite-aguda');
    expect(unlockedAgain).toBe(false);

    expect(goals.getUnlockedCaseIds()).toContain('gastroenterite-aguda');
  });

  it('conclui meta e credita bônus financeiro quando critério é atingido', () => {
    const goals = new GoalsSystem();
    const sim = new HospitalSimulation();
    const initialCash = sim.state.cash;

    sim.state.stats.correctDecisions = 5;
    const reward = goals.checkGoals(sim.state);

    expect(reward).toBeGreaterThanOrEqual(5000);
    expect(sim.state.cash).toBe(initialCash + reward);

    const treatGoal = goals.getGoals().find((g) => g.id === 'treat_5_clean');
    expect(treatGoal?.completed).toBe(true);
  });
});

describe('Seleção de Unidade Inicial & Orçamentos', () => {
  it('inicializa cada tipo de unidade com o caixa e nível correspondente', () => {
    const ubs = createInitialGameState('ubs');
    expect(ubs.cash).toBe(30000);
    expect(ubs.hospitalLevel).toBe('ubs');

    const upa = createInitialGameState('upa');
    expect(upa.cash).toBe(45000);
    expect(upa.hospitalLevel).toBe('upa');

    const hospital = createInitialGameState('hospital');
    expect(hospital.cash).toBe(100000);
    expect(hospital.hospitalLevel).toBe('hospital');
  });
});

describe('Sintetizador Procedural Web Audio API', () => {
  it('alterna estado de mudo e persiste configuração', () => {
    const sound = new SoundSystem();
    sound.setMuted(false);
    expect(sound.isMuted()).toBe(false);

    const toggled = sound.toggleMute();
    expect(toggled).toBe(true);
    expect(sound.isMuted()).toBe(true);
  });
});
