/**
 * Arquivo: src/systems/urban-life-system.ts
 *
 * 1. O que este arquivo faz?
 * Simula a vida urbana ao redor do hospital com 12 a 16 cidadãos NPCs ambientais (pedestres, corredores, donos de cães,
 * pessoas nos bancos da praça com balões animados, passageiros no ponto de ônibus e clientes do quiosque de café).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 6 do Prompt 17, transformando a calçada e arredores em um ambiente dinâmico e vivo, sem interferir
 * na fila clínica, nos médicos ou nas estatísticas do hospital.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O ciclo de movimentação e estados são calculados em update(). As coordenadas das calçadas baseiam-se em SIDEWALK_Y e AVENUE_Y.
 *
 * Importa: src/core/config.ts
 * Conecta-se com: src/render/city-environment.ts, src/render/renderer.ts, src/main.ts
 */

import { BALANCE } from '../core/config';

export type UrbanNpcRole = 'pedestrian' | 'jogger' | 'dog_walker' | 'bench_sitter' | 'bus_waiter' | 'kiosk_customer';

export interface UrbanCitizen {
  id: string;
  role: UrbanNpcRole;
  x: number;
  y: number;
  targetX: number;
  speed: number;
  facing: 'left' | 'right';
  animState: 'IDLE' | 'WALKING';
  bubbleIcon?: '💬' | '🎵' | '☕' | null;
  hasDog?: boolean;
  colorIndex: number;
}

const TILE_PX = 48;
const SIDEWALK_BASE_OFFSET = 36;
const PARK_Y = -50;
const JOGGER_2_Y_OFFSET = 20;
const DOG_Y_OFFSET = 8;
const BUS_Y_OFFSET = 4;
const KIOSK_Y_OFFSET = 4;
const DIVISION_FACTOR = 2;

export class UrbanLifeSystem {
  public citizens: UrbanCitizen[] = [];
  public trafficLightState: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  private trafficLightTimer = 0;

  constructor() {
    this.initCitizens();
  }

  private initCitizens(): void {
    const sidewalkY = BALANCE.grid.rows * TILE_PX + SIDEWALK_BASE_OFFSET;

    // Pedestres e Corredores nas Calçadas e Parque
    this.citizens.push(
      { id: 'c_jogger_1', role: 'jogger', x: -100, y: PARK_Y, targetX: 800, speed: 65, facing: 'right', animState: 'WALKING', colorIndex: 0 },
      { id: 'c_jogger_2', role: 'jogger', x: 750, y: PARK_Y - JOGGER_2_Y_OFFSET, targetX: -150, speed: 60, facing: 'left', animState: 'WALKING', colorIndex: 1 },
      { id: 'c_walker_1', role: 'pedestrian', x: 50, y: sidewalkY, targetX: 900, speed: 32, facing: 'right', animState: 'WALKING', colorIndex: 2 },
      { id: 'c_walker_2', role: 'pedestrian', x: 600, y: sidewalkY, targetX: -100, speed: 30, facing: 'left', animState: 'WALKING', colorIndex: 3 },
      { id: 'c_dog_1', role: 'dog_walker', x: 200, y: sidewalkY + DOG_Y_OFFSET, targetX: 850, speed: 28, facing: 'right', animState: 'WALKING', hasDog: true, colorIndex: 4 },
      // NPCs sentados nos Bancos da Praça
      { id: 'c_bench_1', role: 'bench_sitter', x: 260, y: -40, targetX: 260, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 5 },
      { id: 'c_bench_2', role: 'bench_sitter', x: 420, y: -40, targetX: 420, speed: 0, facing: 'left', animState: 'IDLE', bubbleIcon: '🎵', colorIndex: 0 },
      // Ponto de Ônibus
      { id: 'c_bus_1', role: 'bus_waiter', x: 650, y: sidewalkY + BUS_Y_OFFSET, targetX: 650, speed: 0, facing: 'right', animState: 'IDLE', colorIndex: 1 },
      { id: 'c_bus_2', role: 'bus_waiter', x: 665, y: sidewalkY + BUS_Y_OFFSET, targetX: 665, speed: 0, facing: 'left', animState: 'IDLE', colorIndex: 2 },
      // Quiosque de Café
      { id: 'c_kiosk_1', role: 'kiosk_customer', x: -60, y: sidewalkY + KIOSK_Y_OFFSET, targetX: -60, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '☕', colorIndex: 3 },
      { id: 'c_kiosk_2', role: 'kiosk_customer', x: -45, y: sidewalkY + KIOSK_Y_OFFSET, targetX: -45, speed: 0, facing: 'left', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 4 },
      // Pedestre extra
      { id: 'c_walker_3', role: 'pedestrian', x: 400, y: sidewalkY, targetX: -120, speed: 34, facing: 'left', animState: 'WALKING', colorIndex: 5 }
    );
  }

  public reset(): void {
    this.citizens = [];
    this.trafficLightTimer = 0;
    this.trafficLightState = 'GREEN';
    this.initCitizens();
  }

  public getCitizens(): UrbanCitizen[] {
    return this.citizens;
  }

  public getTrafficLightPhase(): 'RED' | 'YELLOW' | 'GREEN' {
    return this.trafficLightState;
  }

  public update(deltaSec: number): void {
    if (deltaSec <= 0) return;
    this.updateTrafficLight(deltaSec);
    this.updateCitizensMovement(deltaSec);
  }

  private updateTrafficLight(deltaSec: number): void {
    this.trafficLightTimer += deltaSec;
    const greenDuration = 12;
    const yellowDuration = 3;
    const redDuration = 8;
    const cycle = greenDuration + yellowDuration + redDuration;
    const timeInCycle = this.trafficLightTimer % cycle;

    if (timeInCycle < greenDuration) {
      this.trafficLightState = 'GREEN';
    } else if (timeInCycle < greenDuration + yellowDuration) {
      this.trafficLightState = 'YELLOW';
    } else {
      this.trafficLightState = 'RED';
    }
  }

  private updateCitizensMovement(deltaSec: number): void {
    const minBoundX = -200;
    const maxBoundX = 950;

    for (const c of this.citizens) {
      if (c.speed === 0) continue;

      const dx = c.targetX - c.x;
      const step = c.speed * deltaSec;

      if (Math.abs(dx) <= step) {
        c.x = c.targetX;
        // Inverter direção ao chegar ao limite
        c.targetX = c.targetX > (minBoundX + maxBoundX) / DIVISION_FACTOR ? minBoundX : maxBoundX;
        c.facing = c.targetX > c.x ? 'right' : 'left';
      } else {
        c.x += Math.sign(dx) * step;
        c.facing = dx > 0 ? 'right' : 'left';
      }
    }
  }
}

export const urbanLifeSystem = new UrbanLifeSystem();

