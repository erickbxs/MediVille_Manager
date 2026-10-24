/**
 * Arquivo: src/systems/npc-movement-system.ts
 *
 * 1. O que este arquivo faz?
 * Coordena as rotas, waypoints e interpolação de posições dos profissionais de saúde (Médico, Enfermeiro,
 * Farmacêutico, Recepcionista) e dos pacientes através das salas da unidade básica de saúde na grade 12x12.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar dinamismo orgânico ao hospital, permitindo que a equipe caminhe entre balcões, estantes e macas
 * e que os pacientes percorram fisicamente o fluxo SUS (Entrada -> Recepção -> Espera -> Consultório -> Farmácia).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para ajustar rotas ou tempos de permanência em cada waypoint, altere MOVEMENT_CONSTANTS ou execute tests/voxel-and-mobile-evolution.test.ts.
 *
 * Importa: src/state/game-state.ts, src/entities/patient.ts, src/render/theme-config.ts, src/render/voxel-character.ts
 * Conecta-se com: src/render/patients-view.ts, src/core/simulation.ts
 */

import type { GameState } from '../state/game-state';
import type { PatientInstance } from '../entities/patient';
import type { RoomInstance } from '../entities/room';
import { THEME } from '../render/theme-config';
import type { AnimationState } from '../render/voxel-character';

export interface Waypoint {
  x: number;
  y: number;
  pauseSec: number;
  animState: AnimationState;
}

export interface NpcAgent {
  id: string;
  role: 'doctor' | 'nurse' | 'pharmacist' | 'receptionist' | 'patient';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  currentWaypointIndex: number;
  pauseTimerSec: number;
  animState: AnimationState;
  facing: 'left' | 'right';
}

const NAV = {
  MIN_DIST_ARRIVED: 2,
  PATIENT_DIST_ARRIVED: 3,
  SPAWN_COL: 3,
  SPAWN_ROW: 11,
  STAFF_SPEED: 48,
  PATIENT_SPEED: 42,
  SHORT_PAUSE_SEC: 2,
  MED_PAUSE_SEC: 3,
  LONG_PAUSE_SEC: 4,
  PATIENT_ROOM_OFFSET_X: 22,
  PATIENT_ROOM_OFFSET_Y: 34,
  WAITING_ROOM_OFFSET_X: 20,
  WAITING_ROOM_OFFSET_Y: 24,
  DOCTOR_DESK_X: 22,
  DOCTOR_DESK_Y: 34,
  DOCTOR_BED_OFFSET_X: 20,
  NURSE_WAITING_OFFSET: 28,
  NURSE_CONSULT_OFFSET: 16,
  PHARM_SHELF_X: 24,
  PHARM_SHELF_Y: 20,
  PHARM_DESK_OFFSET_X: 20,
  PHARM_DESK_OFFSET_Y: 30,
  RECEPT_DESK_OFFSET: 26,
  RECEPT_STEP_X: 14,
  RECEPT_STEP_Y: 8,
} as const;

function getDoctorWaypoints(agent: NpcAgent, rooms: RoomInstance[]): Waypoint[] {
  const consult = rooms.find((r) => r.definition.role === 'treatment');
  if (!consult) return [{ x: agent.x, y: agent.y, pauseSec: NAV.SHORT_PAUSE_SEC, animState: 'IDLE' }];
  const { tileSize } = THEME;
  return [
    { x: consult.col * tileSize + NAV.DOCTOR_DESK_X, y: consult.row * tileSize + NAV.DOCTOR_DESK_Y, pauseSec: NAV.MED_PAUSE_SEC, animState: 'WORKING' },
    { x: consult.col * tileSize + consult.width * tileSize - NAV.DOCTOR_BED_OFFSET_X, y: consult.row * tileSize + NAV.DOCTOR_DESK_Y, pauseSec: NAV.SHORT_PAUSE_SEC, animState: 'WORKING' },
  ];
}

function getNurseWaypoints(agent: NpcAgent, rooms: RoomInstance[]): Waypoint[] {
  const { tileSize } = THEME;
  const waiting = rooms.find((r) => r.definition.role === 'queue');
  const consult = rooms.find((r) => r.definition.role === 'treatment');
  const wx = waiting ? waiting.col * tileSize + NAV.NURSE_WAITING_OFFSET : agent.x;
  const wy = waiting ? waiting.row * tileSize + NAV.NURSE_WAITING_OFFSET : agent.y;
  const cx = consult ? consult.col * tileSize + NAV.NURSE_CONSULT_OFFSET : wx;
  const cy = consult ? consult.row * tileSize + NAV.NURSE_CONSULT_OFFSET : wy;
  return [
    { x: wx, y: wy, pauseSec: NAV.MED_PAUSE_SEC, animState: 'WORKING' },
    { x: cx, y: cy, pauseSec: NAV.SHORT_PAUSE_SEC, animState: 'IDLE' },
  ];
}

function getPharmacistWaypoints(agent: NpcAgent, rooms: RoomInstance[]): Waypoint[] {
  const pharm = rooms.find((r) => r.definition.role === 'dispense');
  if (!pharm) return [{ x: agent.x, y: agent.y, pauseSec: NAV.SHORT_PAUSE_SEC, animState: 'IDLE' }];
  const { tileSize } = THEME;
  return [
    { x: pharm.col * tileSize + NAV.PHARM_SHELF_X, y: pharm.row * tileSize + NAV.PHARM_SHELF_Y, pauseSec: NAV.MED_PAUSE_SEC, animState: 'WORKING' },
    { x: pharm.col * tileSize + pharm.width * tileSize - NAV.PHARM_DESK_OFFSET_X, y: pharm.row * tileSize + NAV.PHARM_DESK_OFFSET_Y, pauseSec: NAV.MED_PAUSE_SEC, animState: 'WORKING' },
  ];
}

function getReceptionistWaypoints(agent: NpcAgent, rooms: RoomInstance[]): Waypoint[] {
  const recept = rooms.find((r) => r.definition.role === 'entry');
  const { tileSize } = THEME;
  const rx = recept ? recept.col * tileSize + NAV.RECEPT_DESK_OFFSET : agent.x;
  const ry = recept ? recept.row * tileSize + NAV.RECEPT_DESK_OFFSET : agent.y;
  return [
    { x: rx, y: ry, pauseSec: NAV.LONG_PAUSE_SEC, animState: 'WORKING' },
    { x: rx + NAV.RECEPT_STEP_X, y: ry - NAV.RECEPT_STEP_Y, pauseSec: NAV.SHORT_PAUSE_SEC, animState: 'IDLE' },
  ];
}

export class NpcMovementSystem {
  public staffAgents = new Map<string, NpcAgent>();
  public patientAgents = new Map<string, NpcAgent>();

  public update(state: GameState, deltaSec: number): void {
    if (state.speed === 0 || deltaSec <= 0) return;

    this.syncStaffAgents(state);
    this.syncPatientAgents(state);

    for (const agent of this.staffAgents.values()) {
      this.updateAgentMovement(agent, this.getWaypointsForStaff(agent, state), deltaSec);
    }

    for (const [id, agent] of this.patientAgents.entries()) {
      const patient = state.patients.get(id);
      if (!patient || patient.state === 'abandoned') {
        this.patientAgents.delete(id);
        continue;
      }
      this.updatePatientAgent(agent, patient, state, deltaSec);
    }
  }

  private updateAgentMovement(agent: NpcAgent, waypoints: Waypoint[], deltaSec: number): void {
    if (waypoints.length === 0) return;

    if (agent.pauseTimerSec > 0) {
      agent.pauseTimerSec -= deltaSec;
      return;
    }

    const currentWp = waypoints[agent.currentWaypointIndex % waypoints.length]!;
    agent.targetX = currentWp.x;
    agent.targetY = currentWp.y;

    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.hypot(dx, dy);

    if (dist < NAV.MIN_DIST_ARRIVED) {
      agent.x = agent.targetX;
      agent.y = agent.targetY;
      agent.pauseTimerSec = currentWp.pauseSec;
      agent.animState = currentWp.animState;
      agent.currentWaypointIndex = (agent.currentWaypointIndex + 1) % waypoints.length;
    } else {
      const step = agent.speed * deltaSec;
      agent.x += (dx / dist) * Math.min(step, dist);
      agent.y += (dy / dist) * Math.min(step, dist);
      agent.animState = 'WALKING';
      agent.facing = dx < 0 ? 'left' : 'right';
    }
  }

  private updatePatientAgent(
    agent: NpcAgent,
    patient: PatientInstance,
    state: GameState,
    deltaSec: number
  ): void {
    const targetPos = this.getPatientTargetPosition(patient, state);
    const dx = targetPos.x - agent.x;
    const dy = targetPos.y - agent.y;
    const dist = Math.hypot(dx, dy);

    if (dist > NAV.PATIENT_DIST_ARRIVED) {
      const step = agent.speed * deltaSec;
      agent.x += (dx / dist) * Math.min(step, dist);
      agent.y += (dy / dist) * Math.min(step, dist);
      agent.animState = 'WALKING';
      agent.facing = dx < 0 ? 'left' : 'right';
    } else {
      agent.x = targetPos.x;
      agent.y = targetPos.y;
      agent.animState = patient.state === 'ready_for_treatment' || patient.state === 'in_consultation'
        ? 'WORKING'
        : 'IDLE';
    }
  }

  private getPatientTargetPosition(
    patient: PatientInstance,
    state: GameState
  ): { x: number; y: number } {
    const { tileSize } = THEME;
    if (patient.currentRoomId) {
      const room = state.rooms.get(patient.currentRoomId);
      if (room) {
        return {
          x: room.col * tileSize + room.width * tileSize - NAV.PATIENT_ROOM_OFFSET_X,
          y: room.row * tileSize + NAV.PATIENT_ROOM_OFFSET_Y,
        };
      }
    }

    const waitingRooms = Array.from(state.rooms.values()).filter(
      (r) => r.definition.role === 'entry' || r.definition.role === 'queue'
    );
    if (waitingRooms.length > 0) {
      const r = waitingRooms[0]!;
      return {
        x: r.col * tileSize + NAV.WAITING_ROOM_OFFSET_X,
        y: r.row * tileSize + NAV.WAITING_ROOM_OFFSET_Y,
      };
    }

    return { x: NAV.SPAWN_COL * tileSize, y: NAV.SPAWN_ROW * tileSize };
  }

  private getWaypointsForStaff(agent: NpcAgent, state: GameState): Waypoint[] {
    const rooms = Array.from(state.rooms.values());
    if (agent.role === 'doctor') return getDoctorWaypoints(agent, rooms);
    if (agent.role === 'nurse') return getNurseWaypoints(agent, rooms);
    if (agent.role === 'pharmacist') return getPharmacistWaypoints(agent, rooms);
    return getReceptionistWaypoints(agent, rooms);
  }

  private syncStaffAgents(state: GameState): void {
    const currentStaffIds = new Set(state.staff.keys());

    for (const id of this.staffAgents.keys()) {
      if (!currentStaffIds.has(id)) this.staffAgents.delete(id);
    }

    for (const [id, member] of state.staff.entries()) {
      if (!this.staffAgents.has(id)) {
        const role = member.roleId as NpcAgent['role'];
        const startX = NAV.SPAWN_COL * THEME.tileSize;
        const startY = NAV.SPAWN_ROW * THEME.tileSize;
        this.staffAgents.set(id, {
          id,
          role,
          x: startX,
          y: startY,
          targetX: startX,
          targetY: startY,
          speed: NAV.STAFF_SPEED,
          currentWaypointIndex: 0,
          pauseTimerSec: 0,
          animState: 'IDLE',
          facing: 'right',
        });
      }
    }
  }

  private syncPatientAgents(state: GameState): void {
    for (const patient of state.patients.values()) {
      if (!this.patientAgents.has(patient.id) && patient.state !== 'abandoned' && patient.state !== 'treated') {
        const startX = NAV.SPAWN_COL * THEME.tileSize;
        const startY = NAV.SPAWN_ROW * THEME.tileSize;
        this.patientAgents.set(patient.id, {
          id: patient.id,
          role: 'patient',
          x: startX,
          y: startY,
          targetX: startX,
          targetY: startY,
          speed: NAV.PATIENT_SPEED,
          currentWaypointIndex: 0,
          pauseTimerSec: 0,
          animState: 'IDLE',
          facing: 'right',
        });
      }
    }
  }
}
