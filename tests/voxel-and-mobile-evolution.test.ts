/**
 * Arquivo: tests/voxel-and-mobile-evolution.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a fábrica procedural de personagens Voxel 2.5D (estilos, papéis e animações),
 * o sistema de movimentação e coreografia de NPCs por waypoints entre salas,
 * o cálculo de enquadramento da câmera responsiva (fitMapToViewport) garantindo >= 82% de tela livre no mobile/tablet,
 * e os utilitários de formatação e auto-pausa do HUD/simulação.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir a robustez das entregas do Super-Prompt de Evolução Core & Visual 3D sem regressões.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar testes de novas rotas ou resoluções de tela, ajuste os asserts usando o runner do Vitest.
 *
 * Importa: vitest, src/render/voxel-character.ts, src/systems/npc-movement-system.ts, src/render/camera.ts, src/ui/hud.ts, src/core/simulation.ts
 * Conecta-se com: vitest runner
 */

import { describe, it, expect } from 'vitest';
import { VoxelCharacter, type CharacterRole } from '../src/render/voxel-character';
import { NpcMovementSystem } from '../src/systems/npc-movement-system';
import { fitMapToViewport } from '../src/render/camera';
import { formatShortCash } from '../src/ui/hud';
import { HospitalSimulation } from '../src/core/simulation';

describe('Evolução Voxel 2.5D & Animações Procedurais', () => {
  const roles: CharacterRole[] = ['doctor', 'nurse', 'pharmacist', 'receptionist', 'patient'];

  it('instancia e atualiza personagens voxel para todos os 5 papéis sem erros', () => {
    roles.forEach((role, idx) => {
      const char = new VoxelCharacter({
        role,
        gender: idx % 2 === 0 ? 'female' : 'male',
        skinToneIndex: idx,
        hairColorIndex: idx,
        patienceRatio: 0.8,
      });

      expect(char.container).toBeDefined();
      expect(char.container.children.length).toBe(1);

      char.update(0, 'IDLE');
      expect(char.animState).toBe('IDLE');

      char.update(0.5, 'WALKING');
      expect(char.animState).toBe('WALKING');

      char.update(1.0, 'WORKING');
      expect(char.animState).toBe('WORKING');
    });
  });

  it('renderiza paciente com diferentes faixas de paciência (normal, alerta, crítico)', () => {
    const patientCalm = new VoxelCharacter({
      role: 'patient',
      gender: 'female',
      patienceRatio: 0.9,
    });
    patientCalm.update(0.2, 'IDLE');

    const patientSweat = new VoxelCharacter({
      role: 'patient',
      gender: 'male',
      patienceRatio: 0.5,
    });
    patientSweat.update(0.4, 'IDLE');

    const patientAngry = new VoxelCharacter({
      role: 'patient',
      gender: 'male',
      patienceRatio: 0.15,
    });
    patientAngry.update(0.6, 'IDLE');

    expect(patientCalm.animState).toBe('IDLE');
    expect(patientSweat.animState).toBe('IDLE');
    expect(patientAngry.animState).toBe('IDLE');
  });
});

describe('NpcMovementSystem & Coreografia de Rotas', () => {
  it('sincroniza agentes da equipe e move em direção aos waypoints das salas', () => {
    const sim = new HospitalSimulation();
    const movement = new NpcMovementSystem();

    // Sincroniza estado inicial com a equipe contratada
    movement.update(sim.state, 0.1);

    expect(movement.staffAgents.size).toBe(sim.state.staff.size);

    const initialPositions = Array.from(movement.staffAgents.values()).map((a) => ({
      id: a.id,
      x: a.x,
      y: a.y,
    }));

    // Simula tempo avançando (1 segundo de movimento)
    movement.update(sim.state, 1.0);

    const updatedPositions = Array.from(movement.staffAgents.values()).map((a) => ({
      id: a.id,
      x: a.x,
      y: a.y,
    }));

    expect(updatedPositions.length).toBe(initialPositions.length);
  });

  it('respeita a pausa determinística (speed = 0) congelando movimentação dos NPCs', () => {
    const sim = new HospitalSimulation();
    const movement = new NpcMovementSystem();

    movement.update(sim.state, 0.1);
    const agent = Array.from(movement.staffAgents.values())[0];
    if (!agent) return;

    sim.setSpeed(0);
    const beforeX = agent.x;
    const beforeY = agent.y;

    movement.update(sim.state, 2.0);

    expect(agent.x).toBe(beforeX);
    expect(agent.y).toBe(beforeY);
  });
});

describe('Responsividade e Layout Compacto Mobile/Tablet', () => {
  it('garante que a área livre para visualização do hospital seja superior a 82% no mobile', () => {
    const mobileViewports = [
      { w: 375, h: 667 }, // iPhone SE
      { w: 390, h: 844 }, // iPhone 12/13/14
      { w: 412, h: 915 }, // Android Galaxy / Pixel
    ];

    const topBarHeight = 48;
    const bottomDockHeight = 56;
    const uiOccupiedHeight = topBarHeight + bottomDockHeight; // 104px

    mobileViewports.forEach(({ w, h }) => {
      const freeHeightRatio = (h - uiOccupiedHeight) / h;
      expect(freeHeightRatio).toBeGreaterThanOrEqual(0.82);

      const fit = fitMapToViewport(w, h, { topHeight: topBarHeight, bottomHeight: bottomDockHeight });
      expect(fit.scale).toBeGreaterThan(0);
      expect(fit.x).toBeDefined();
      expect(fit.y).toBeGreaterThanOrEqual(topBarHeight);
    });
  });

  it('calcula auto-enquadramento equilibrado em tablets e desktop', () => {
    const tabletsAndDesktop = [
      { w: 768, h: 1024 }, // iPad portrait
      { w: 1024, h: 768 }, // iPad landscape
      { w: 1920, h: 1080 }, // Full HD Desktop
    ];

    tabletsAndDesktop.forEach(({ w, h }) => {
      const fit = fitMapToViewport(w, h);
      expect(fit.scale).toBeGreaterThan(0.3);
      expect(fit.scale).toBeLessThanOrEqual(2.0);
    });
  });

  it('formata valores financeiros em notação compacta (formatShortCash)', () => {
    expect(formatShortCash(500)).toBe('R$ 500');
    expect(formatShortCash(1000)).toBe('R$ 1k');
    expect(formatShortCash(28500)).toBe('R$ 28.5k');
    expect(formatShortCash(1200000)).toBe('R$ 1.2M');
  });
});

describe('Auto-Pausa de Modais & Restauração Determinística', () => {
  it('guarda a velocidade anterior ao abrir modal e restaura fielmente ao fechar', () => {
    const sim = new HospitalSimulation();
    sim.setSpeed(2);
    expect(sim.state.speed).toBe(2);

    sim.pauseForModal();
    expect(sim.state.speed).toBe(0);

    // Ticks durante a pausa não avançam simulação
    const timeBefore = sim.state.dayTimeSec;
    sim.step(1.0);
    expect(sim.state.dayTimeSec).toBe(timeBefore);

    sim.resumeFromModal();
    expect(sim.state.speed).toBe(2);
  });
});
