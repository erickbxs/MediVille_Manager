/**
 * Arquivo: src/systems/urban-life-system.ts
 *
 * 1. O que este arquivo faz?
 * Simula a vida urbana ao redor do hospital com 28 a 35 cidadãos NPCs ambientais (pedestres, famílias, idosos,
 * corredores no parque, donos de cães, clientes na cafeteria e quiosque, pessoas nos bancos da praça e passageiros no ponto de ônibus).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 4 do Prompt 22, povoando massivamente as calçadas e arredores para transformar o hospital
 * em uma minicidade viva a 60 FPS, sem onerar o loop clínico central.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O ciclo de movimentação e estados são calculados em update(). As coordenadas das calçadas baseiam-se em SIDEWALK_Y e PARK_Y.
 *
 * Importa: src/core/config.ts
 * Conecta-se com: src/render/city-environment.ts, src/render/urban-life-view.ts, src/render/renderer.ts, src/main.ts
 */

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
const OPPOSITE_SIDEWALK_OFFSET = 124;
const FAMILY_WALKER_OFFSET = 4;
const PARK_Y = -50;
const JOGGER_2_Y_OFFSET = 20;
const PARK_JOGGER_3_OFFSET = 10;
const DOG_Y_OFFSET = 8;
const BUS_Y_OFFSET = 4;
const KIOSK_Y_OFFSET = 4;
const DIVISION_FACTOR = 2;
const DEFAULT_INITIAL_GRID = 12;

export class UrbanLifeSystem {
  public citizens: UrbanCitizen[] = [];
  public trafficLightState: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
  private trafficLightTimer = 0;

  private currentGridSize = DEFAULT_INITIAL_GRID;

  constructor() {
    this.initCitizens(this.currentGridSize);
  }

  public updateGridSize(gridSize: number): void {
    if (this.currentGridSize === gridSize) return;
    this.currentGridSize = gridSize;
    const sidewalkY = gridSize * TILE_PX + SIDEWALK_BASE_OFFSET;

    for (const c of this.citizens) {
      if (c.role === 'pedestrian' || c.role === 'dog_walker' || c.role === 'bus_waiter' || c.role === 'kiosk_customer') {
        const offset = c.role === 'dog_walker' ? DOG_Y_OFFSET : (c.role === 'bus_waiter' ? BUS_Y_OFFSET : (c.role === 'kiosk_customer' ? KIOSK_Y_OFFSET : 0));
        c.y = sidewalkY + offset;
      }
    }
  }

  private buildFrontSidewalkCitizens(sidewalkY: number): UrbanCitizen[] {
    return [
      { id: 'c_jogger_1', role: 'jogger', x: -100, y: PARK_Y, targetX: 850, speed: 65, facing: 'right', animState: 'WALKING', colorIndex: 0 },
      { id: 'c_jogger_2', role: 'jogger', x: 750, y: PARK_Y - JOGGER_2_Y_OFFSET, targetX: -150, speed: 60, facing: 'left', animState: 'WALKING', colorIndex: 1 },
      { id: 'c_jogger_3', role: 'jogger', x: 200, y: PARK_Y - PARK_JOGGER_3_OFFSET, targetX: 900, speed: 62, facing: 'right', animState: 'WALKING', colorIndex: 2 },
      { id: 'c_walker_1', role: 'pedestrian', x: 50, y: sidewalkY, targetX: 900, speed: 32, facing: 'right', animState: 'WALKING', colorIndex: 2 },
      { id: 'c_walker_2', role: 'pedestrian', x: 600, y: sidewalkY, targetX: -100, speed: 30, facing: 'left', animState: 'WALKING', colorIndex: 3 },
      { id: 'c_walker_3', role: 'pedestrian', x: 400, y: sidewalkY, targetX: -120, speed: 34, facing: 'left', animState: 'WALKING', colorIndex: 5 },
      { id: 'c_walker_fam_1', role: 'pedestrian', x: 180, y: sidewalkY - FAMILY_WALKER_OFFSET, targetX: 800, speed: 28, facing: 'right', animState: 'WALKING', colorIndex: 0 },
      { id: 'c_walker_fam_2', role: 'pedestrian', x: 195, y: sidewalkY + FAMILY_WALKER_OFFSET, targetX: 815, speed: 28, facing: 'right', animState: 'WALKING', colorIndex: 1 },
      { id: 'c_walker_elder_1', role: 'pedestrian', x: 320, y: sidewalkY, targetX: -80, speed: 22, facing: 'left', animState: 'WALKING', colorIndex: 4 },
      { id: 'c_dog_1', role: 'dog_walker', x: 200, y: sidewalkY + DOG_Y_OFFSET, targetX: 850, speed: 28, facing: 'right', animState: 'WALKING', hasDog: true, colorIndex: 4 },
      { id: 'c_dog_2', role: 'dog_walker', x: 700, y: sidewalkY + DOG_Y_OFFSET, targetX: -140, speed: 26, facing: 'left', animState: 'WALKING', hasDog: true, colorIndex: 2 },
    ];
  }

  private buildSurroundingCitizens(sidewalkY: number, oppositeSidewalkY: number): UrbanCitizen[] {
    return [
      { id: 'c_bench_1', role: 'bench_sitter', x: 260, y: -40, targetX: 260, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 5 },
      { id: 'c_bench_2', role: 'bench_sitter', x: 420, y: -40, targetX: 420, speed: 0, facing: 'left', animState: 'IDLE', bubbleIcon: '🎵', colorIndex: 0 },
      { id: 'c_bench_3', role: 'bench_sitter', x: 140, y: -40, targetX: 140, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 3 },
      { id: 'c_bus_1', role: 'bus_waiter', x: 650, y: sidewalkY + BUS_Y_OFFSET, targetX: 650, speed: 0, facing: 'right', animState: 'IDLE', colorIndex: 1 },
      { id: 'c_bus_2', role: 'bus_waiter', x: 665, y: sidewalkY + BUS_Y_OFFSET, targetX: 665, speed: 0, facing: 'left', animState: 'IDLE', colorIndex: 2 },
      { id: 'c_bus_3', role: 'bus_waiter', x: 680, y: sidewalkY + BUS_Y_OFFSET, targetX: 680, speed: 0, facing: 'right', animState: 'IDLE', colorIndex: 3 },
      { id: 'c_kiosk_1', role: 'kiosk_customer', x: -60, y: sidewalkY + KIOSK_Y_OFFSET, targetX: -60, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '☕', colorIndex: 3 },
      { id: 'c_kiosk_2', role: 'kiosk_customer', x: -45, y: sidewalkY + KIOSK_Y_OFFSET, targetX: -45, speed: 0, facing: 'left', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 4 },
      { id: 'c_kiosk_3', role: 'kiosk_customer', x: -30, y: sidewalkY + KIOSK_Y_OFFSET, targetX: -30, speed: 0, facing: 'right', animState: 'IDLE', colorIndex: 1 },
      { id: 'c_opp_1', role: 'pedestrian', x: 100, y: oppositeSidewalkY, targetX: 850, speed: 30, facing: 'right', animState: 'WALKING', colorIndex: 0 },
      { id: 'c_opp_2', role: 'pedestrian', x: 550, y: oppositeSidewalkY, targetX: -150, speed: 32, facing: 'left', animState: 'WALKING', colorIndex: 1 },
      { id: 'c_opp_cafe_1', role: 'kiosk_customer', x: 280, y: oppositeSidewalkY, targetX: 280, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '☕', colorIndex: 4 },
      { id: 'c_opp_cafe_2', role: 'kiosk_customer', x: 295, y: oppositeSidewalkY, targetX: 295, speed: 0, facing: 'left', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 5 },
      { id: 'c_opp_pharm_1', role: 'pedestrian', x: 480, y: oppositeSidewalkY, targetX: -100, speed: 28, facing: 'left', animState: 'WALKING', colorIndex: 2 },
      { id: 'c_opp_pharm_2', role: 'pedestrian', x: 440, y: oppositeSidewalkY, targetX: 800, speed: 29, facing: 'right', animState: 'WALKING', colorIndex: 3 },
      { id: 'c_garden_walker_1', role: 'pedestrian', x: 620, y: 150, targetX: 620, speed: 0, facing: 'right', animState: 'IDLE', bubbleIcon: '💬', colorIndex: 0 },
      { id: 'c_garden_walker_2', role: 'pedestrian', x: 640, y: 220, targetX: 640, speed: 0, facing: 'left', animState: 'IDLE', colorIndex: 4 },
      { id: 'c_bike_1', role: 'jogger', x: 740, y: 80, targetX: 740, speed: 0, facing: 'right', animState: 'IDLE', colorIndex: 5 },
      { id: 'c_bike_2', role: 'jogger', x: 740, y: 260, targetX: 740, speed: 0, facing: 'left', animState: 'IDLE', colorIndex: 1 },
    ];
  }

  private initCitizens(gridSize = 12): void {
    const sidewalkY = gridSize * TILE_PX + SIDEWALK_BASE_OFFSET;
    const oppositeSidewalkY = sidewalkY + OPPOSITE_SIDEWALK_OFFSET;

    this.citizens = [
      ...this.buildFrontSidewalkCitizens(sidewalkY),
      ...this.buildSurroundingCitizens(sidewalkY, oppositeSidewalkY),
    ];
  }

  public reset(): void {
    this.citizens = [];
    this.trafficLightTimer = 0;
    this.trafficLightState = 'GREEN';
    this.initCitizens(this.currentGridSize);
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
