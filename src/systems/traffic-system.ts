/**
 * Arquivo: src/systems/traffic-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a física, aceleração, detecção de pedestres na faixa e o fluxo contínuo de veículos (carros, ônibus e SAMU)
 * na avenida frontal, além da orquestração do desembarque (drop-off) de pacientes que chegam de carro ou ônibus ao hospital.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 11, tornando a chegada de pacientes orgânica e visualmente conectada ao tráfego urbano.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste TRAFFIC_CONFIG para velocidades e intervalos de geração de carros. O sistema emite traffic:patient_disembarked.
 *
 * Importa: src/core/event-bus.ts, src/render/voxel-vehicles.ts
 * Conecta-se com: src/render/renderer.ts, src/systems/npc-movement-system.ts, src/main.ts
 */

import { globalBus } from '../core/event-bus';
import type { VehicleType, VehicleDirection } from '../render/voxel-vehicles';

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

const TRAFFIC_CONFIG = {
  SPAWN_X_WEST: -350,
  SPAWN_X_EAST: 950,
  OUT_OF_BOUND_MARGIN: 50,
  LANE_EAST_Y: 660,
  LANE_WEST_Y: 710,
  CRUISE_SPEED: 95,
  BUS_SPEED: 70,
  ACCELERATION: 60,
  DECELERATION: 110,
  CROSSWALK_X: 144,
  CROSSWALK_MIN_X: 120,
  CROSSWALK_MAX_X: 170,
  CROSSWALK_SAFE_DIST: 55,
  DROPOFF_STOP_TIME: 1.5,
  MIN_SPAWN_INTERVAL_SEC: 3.5,
  BUS_CHANCE: 0.25,
  COLOR_COUNT: 6,
  DOOR_SPEED_FACTOR: 2,
  DROPOFF_DISTANCE_THRESHOLD: 12,
  DECEL_DISTANCE_THRESHOLD: 80,
  DECEL_SPEED: 20,
  SIDEWALK_Y: 596,
} as const;

export class TrafficSystem {
  public vehicles: TrafficVehicleInstance[] = [];
  private spawnTimerSec = 0;
  private pendingDropoffPatientIds: string[] = [];
  private nextId = 1;

  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    globalBus.on('patient:spawned', ({ patientId }) => {
      this.pendingDropoffPatientIds.push(patientId);
    });
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
    return v.direction === 'east'
      ? v.x > TRAFFIC_CONFIG.SPAWN_X_EAST + TRAFFIC_CONFIG.OUT_OF_BOUND_MARGIN
      : v.x < TRAFFIC_CONFIG.SPAWN_X_WEST - TRAFFIC_CONFIG.OUT_OF_BOUND_MARGIN;
  }

  private updateSpawning(deltaSec: number): void {
    this.spawnTimerSec += deltaSec;
    if (this.spawnTimerSec >= TRAFFIC_CONFIG.MIN_SPAWN_INTERVAL_SEC) {
      this.spawnTimerSec = 0;
      const isEast = Math.random() > 0.5;
      const isBus = Math.random() < TRAFFIC_CONFIG.BUS_CHANCE;
      const patientId = this.pendingDropoffPatientIds.shift();
      this.spawnVehicle(isEast ? 'east' : 'west', isBus ? 'bus' : 'car', patientId);
    }
  }

  public spawnVehicle(direction: VehicleDirection, type: VehicleType = 'car', patientId?: string): TrafficVehicleInstance {
    const isEast = direction === 'east';
    const baseSpeed = type === 'bus' ? TRAFFIC_CONFIG.BUS_SPEED : TRAFFIC_CONFIG.CRUISE_SPEED;
    const vehicle: TrafficVehicleInstance = {
      id: `veh_${this.nextId++}`,
      type,
      colorIndex: Math.floor(Math.random() * TRAFFIC_CONFIG.COLOR_COUNT),
      direction,
      x: isEast ? TRAFFIC_CONFIG.SPAWN_X_WEST : TRAFFIC_CONFIG.SPAWN_X_EAST,
      y: isEast ? TRAFFIC_CONFIG.LANE_EAST_Y : TRAFFIC_CONFIG.LANE_WEST_Y,
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
    v.doorOpenFactor = v.dropoffTimerSec > 0.5 ? 1 : Math.max(0, v.dropoffTimerSec * TRAFFIC_CONFIG.DOOR_SPEED_FACTOR);

    if (v.dropoffTimerSec <= 0) {
      v.state = 'ACCELERATING';
      v.doorOpenFactor = 0;
      const baseSpeed = v.type === 'bus' ? TRAFFIC_CONFIG.BUS_SPEED : TRAFFIC_CONFIG.CRUISE_SPEED;
      v.targetSpeed = v.direction === 'east' ? baseSpeed : -baseSpeed;
    }
  }

  private checkCrosswalkSlowdown(v: TrafficVehicleInstance, isPedestrianOnCrosswalk: boolean): void {
    if (!isPedestrianOnCrosswalk) return;
    const distToCrosswalk = v.direction === 'east'
      ? TRAFFIC_CONFIG.CROSSWALK_X - v.x
      : v.x - TRAFFIC_CONFIG.CROSSWALK_X;

    if (distToCrosswalk > 0 && distToCrosswalk < TRAFFIC_CONFIG.CROSSWALK_SAFE_DIST) {
      v.targetSpeed = 0;
    }
  }

  private checkDropoffTrigger(v: TrafficVehicleInstance): void {
    if (!v.patientIdToDropoff || v.state !== 'CRUISING') return;
    const distToDropoff = Math.abs(v.x - TRAFFIC_CONFIG.CROSSWALK_X);
    if (distToDropoff < TRAFFIC_CONFIG.DROPOFF_DISTANCE_THRESHOLD) {
      v.state = 'DROPPING_OFF';
      v.speed = 0;
      v.dropoffTimerSec = TRAFFIC_CONFIG.DROPOFF_STOP_TIME;
      v.doorOpenFactor = 1;
      const pId = v.patientIdToDropoff;
      v.patientIdToDropoff = undefined;
      globalBus.emit('traffic:patient_disembarked', {
        patientId: pId,
        x: TRAFFIC_CONFIG.CROSSWALK_X,
        y: TRAFFIC_CONFIG.SIDEWALK_Y,
      });
    } else if (distToDropoff < TRAFFIC_CONFIG.DECEL_DISTANCE_THRESHOLD) {
      v.state = 'DECELERATING';
      v.targetSpeed = v.direction === 'east' ? TRAFFIC_CONFIG.DECEL_SPEED : -TRAFFIC_CONFIG.DECEL_SPEED;
    }
  }

  private applySpeedInterpolation(v: TrafficVehicleInstance, deltaSec: number): void {
    if (v.speed < v.targetSpeed) {
      v.speed = Math.min(v.targetSpeed, v.speed + TRAFFIC_CONFIG.ACCELERATION * deltaSec);
    } else if (v.speed > v.targetSpeed) {
      v.speed = Math.max(v.targetSpeed, v.speed - TRAFFIC_CONFIG.DECELERATION * deltaSec);
    }
  }
}

export const trafficSystem = new TrafficSystem();
