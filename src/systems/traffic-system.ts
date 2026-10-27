/**
 * Arquivo: src/systems/traffic-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a física, movimentação contínua, desaceleração na faixa de pedestres e desembarque de passageiros (carros, ônibus e SAMU)
 * na avenida frontal, sincronizando as coordenadas dinamicamente com a expansão do hospital através de getUrbanGeometry.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 23, garantindo que ao expandir o hospital (12x12 até 24x24) todos os veículos e faixas
 * sejam realinhados instantaneamente para a nova posição da rua, sem jamais atravessar as salas construídas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * As posições da avenida provêm de getUrbanGeometry(gridSize). Chame realignToNewStreetGeometry(gridSize) para forçar atualização.
 *
 * Importa: src/core/event-bus.ts, src/render/voxel-vehicles.ts, src/core/urban-geometry.ts
 * Conecta-se com: src/render/traffic-view.ts, src/systems/npc-movement-system.ts, src/render/renderer.ts
 */

import { globalBus } from '../core/event-bus';
import type { VehicleType, VehicleDirection } from '../render/voxel-vehicles';
import { getUrbanGeometry, type UrbanGeometry } from '../core/urban-geometry';

export type VehicleBehaviorState = 'CRUISING' | 'DECELERATING' | 'DROPPING_OFF' | 'ACCELERATING';

export interface TrafficVehicleInstance {
  id: string;
  type: VehicleType;
  colorIndex: number;
  direction: VehicleDirection;
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  state: VehicleBehaviorState;
  dropoffTimerSec: number;
  doorOpenFactor: number;
  patientIdToDropoff?: string;
}

const CRUISE_SPEED = 95;
const BUS_SPEED = 70;
const ACCELERATION_RATE = 60;
const DECELERATION_RATE = 110;
const DECEL_SPEED = 20;
const CROSSWALK_SAFE_DIST = 55;
const DROPOFF_STOP_TIME_SEC = 1.5;
const MIN_SPAWN_INTERVAL_SEC = 3.5;
const BUS_CHANCE = 0.25;
const COLOR_PALETTE_COUNT = 6;
const DOOR_SPEED_FACTOR = 2;
const DROPOFF_DIST_THRESHOLD = 12;
const DECEL_DIST_THRESHOLD = 80;
const BOUND_MARGIN_PX = 100;
const SPAWN_WEST_OFFSET = 350;
const SPAWN_EAST_OFFSET = 350;
const DEFAULT_GRID_SIZE = 12;

export class TrafficSystem {
  public vehicles: TrafficVehicleInstance[] = [];
  public currentGridSize = DEFAULT_GRID_SIZE;
  private geo: UrbanGeometry = getUrbanGeometry(DEFAULT_GRID_SIZE);
  private spawnTimerSec = 0;
  private pendingDropoffPatientIds: string[] = [];
  private nextId = 1;

  constructor() {
    this.realignToNewStreetGeometry(this.currentGridSize);
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    globalBus.on('patient:spawned', ({ patientId }) => {
      this.pendingDropoffPatientIds.push(patientId);
    });

    globalBus.on('map:expanded', ({ newGridSize }) => {
      this.realignToNewStreetGeometry(newGridSize);
    });
  }

  public getGeometry(): UrbanGeometry {
    return this.geo;
  }

  public realignToNewStreetGeometry(newGridSize: number): void {
    this.currentGridSize = newGridSize;
    this.geo = getUrbanGeometry(newGridSize);

    // Reposiciona todos os veículos ativos para as novas faixas da avenida
    for (const v of this.vehicles) {
      v.y = v.direction === 'east' ? this.geo.street.laneEastboundY : this.geo.street.laneWestboundY;
    }
  }

  public reset(): void {
    this.vehicles = [];
    this.spawnTimerSec = 0;
    this.pendingDropoffPatientIds = [];
  }


  public update(deltaSec: number, isPedestrianOnCrosswalk = false): void {
    if (deltaSec <= 0) return;
    this.updateSpawning(deltaSec);

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i]!;
      this.updateSingleVehicle(v, deltaSec, isPedestrianOnCrosswalk);
      if (this.isOutOfBound(v)) {
        this.vehicles.splice(i, 1);
      }
    }
  }

  private isOutOfBound(v: TrafficVehicleInstance): boolean {
    const maxX = this.geo.hospitalBounds.maxX + SPAWN_EAST_OFFSET + BOUND_MARGIN_PX;
    const minX = -SPAWN_WEST_OFFSET - BOUND_MARGIN_PX;
    return v.direction === 'east' ? v.x > maxX : v.x < minX;
  }

  private updateSpawning(deltaSec: number): void {
    this.spawnTimerSec += deltaSec;
    if (this.spawnTimerSec >= MIN_SPAWN_INTERVAL_SEC) {
      this.spawnTimerSec = 0;
      const isEast = Math.random() > 0.5;
      const isBus = Math.random() < BUS_CHANCE;
      const patientId = this.pendingDropoffPatientIds.shift();
      this.spawnVehicle(isEast ? 'east' : 'west', isBus ? 'bus' : 'car', patientId);
    }
  }

  public spawnVehicle(direction: VehicleDirection, type: VehicleType = 'car', patientId?: string): TrafficVehicleInstance {
    const isEast = direction === 'east';
    const baseSpeed = type === 'bus' ? BUS_SPEED : CRUISE_SPEED;
    const spawnWestX = -SPAWN_WEST_OFFSET;
    const spawnEastX = this.geo.hospitalBounds.maxX + SPAWN_EAST_OFFSET;

    const vehicle: TrafficVehicleInstance = {
      id: `veh_${this.nextId++}`,
      type,
      colorIndex: Math.floor(Math.random() * COLOR_PALETTE_COUNT),
      direction,
      x: isEast ? spawnWestX : spawnEastX,
      y: isEast ? this.geo.street.laneEastboundY : this.geo.street.laneWestboundY,
      speed: isEast ? baseSpeed : -baseSpeed,
      targetSpeed: isEast ? baseSpeed : -baseSpeed,
      state: 'CRUISING',
      dropoffTimerSec: 0,
      doorOpenFactor: 0,
      patientIdToDropoff: patientId,
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  private updateSingleVehicle(
    v: TrafficVehicleInstance,
    deltaSec: number,
    isPedestrianOnCrosswalk: boolean
  ): void {
    if (v.state === 'DROPPING_OFF') {
      this.handleDropoffState(v, deltaSec);
      return;
    }

    this.checkCrosswalkSlowdown(v, isPedestrianOnCrosswalk);
    this.checkDropoffTrigger(v);
    this.applySpeedInterpolation(v, deltaSec);
    v.x += v.speed * deltaSec;
  }

  private handleDropoffState(v: TrafficVehicleInstance, deltaSec: number): void {
    v.dropoffTimerSec -= deltaSec;
    v.doorOpenFactor = v.dropoffTimerSec > 0.5 ? 1 : Math.max(0, v.dropoffTimerSec * DOOR_SPEED_FACTOR);

    if (v.dropoffTimerSec <= 0) {
      v.state = 'ACCELERATING';
      v.doorOpenFactor = 0;
      const baseSpeed = v.type === 'bus' ? BUS_SPEED : CRUISE_SPEED;
      v.targetSpeed = v.direction === 'east' ? baseSpeed : -baseSpeed;
    }
  }

  private checkCrosswalkSlowdown(v: TrafficVehicleInstance, isPedestrianOnCrosswalk: boolean): void {
    if (!isPedestrianOnCrosswalk) return;
    const crossX = this.geo.street.crosswalkX;
    const distToCrosswalk = v.direction === 'east' ? crossX - v.x : v.x - crossX;

    if (distToCrosswalk > 0 && distToCrosswalk < CROSSWALK_SAFE_DIST) {
      v.targetSpeed = 0;
    }
  }

  private checkDropoffTrigger(v: TrafficVehicleInstance): void {
    if (!v.patientIdToDropoff || v.state !== 'CRUISING') return;
    const dropX = this.geo.stops.patientDropOffX;
    const distToDropoff = Math.abs(v.x - dropX);

    if (distToDropoff < DROPOFF_DIST_THRESHOLD) {
      v.state = 'DROPPING_OFF';
      v.speed = 0;
      v.dropoffTimerSec = DROPOFF_STOP_TIME_SEC;
      v.doorOpenFactor = 1;
      const pId = v.patientIdToDropoff;
      v.patientIdToDropoff = undefined;
      globalBus.emit('traffic:patient_disembarked', {
        patientId: pId,
        x: dropX,
        y: this.geo.surroundings.sidewalkTopY,
      });
    } else if (distToDropoff < DECEL_DIST_THRESHOLD) {
      v.state = 'DECELERATING';
      v.targetSpeed = v.direction === 'east' ? DECEL_SPEED : -DECEL_SPEED;
    }
  }

  private applySpeedInterpolation(v: TrafficVehicleInstance, deltaSec: number): void {
    if (v.speed < v.targetSpeed) {
      v.speed = Math.min(v.targetSpeed, v.speed + ACCELERATION_RATE * deltaSec);
    } else if (v.speed > v.targetSpeed) {
      v.speed = Math.max(v.targetSpeed, v.speed - DECELERATION_RATE * deltaSec);
    }
  }
}

export const trafficSystem = new TrafficSystem();
