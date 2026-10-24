/**
 * Arquivo: src/render/patients-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza personagens Voxel 2.5D articulados (pacientes e profissionais de saúde: Médico, Enfermeiro, Farmacêutico,
 * Recepcionista) com sombras suaves no chão, roupas diferenciadas do SUS, animações determinísticas e balão interativo 🩺 Atender.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Integrar a fábrica de avatares voxel com o sistema de movimentação por waypoints, permitindo visualização rica do fluxo de pacientes.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para calibrar posições ou balões de atendimento, edite drawVoxelAgent ou drawSpeechBubble.
 *
 * Importa: pixi.js, src/entities/patient.ts, src/entities/room.ts, src/render/voxel-character.ts, src/systems/npc-movement-system.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { PatientInstance } from '../entities/patient';
import type { RoomInstance } from '../entities/room';
import type { GameState } from '../state/game-state';
import { VoxelCharacter, type CharacterRole } from './voxel-character';
import { NpcMovementSystem } from '../systems/npc-movement-system';
import { THEME } from './theme-config';

export class PatientsView {
  public container = new Container();
  private graphics = new Graphics();
  private textContainer = new Container();
  private characterPool = new Map<string, VoxelCharacter>();
  public npcMovementSystem = new NpcMovementSystem();
  private lastTimeSec = 0;

  constructor() {
    this.container.addChild(this.graphics);
    this.container.addChild(this.textContainer);
  }

  public render(
    patientsOrState: PatientInstance[] | GameState,
    rooms?: Map<string, RoomInstance>
  ): void {
    this.graphics.clear();
    for (const child of this.textContainer.removeChildren()) child.destroy();

    const isFullState = !Array.isArray(patientsOrState) && 'rooms' in patientsOrState;
    if (isFullState) {
      this.renderFullState(patientsOrState);
      return;
    }

    const patients = patientsOrState as PatientInstance[];
    const roomMap = rooms ?? new Map<string, RoomInstance>();
    this.renderLegacyFallback(patients, roomMap);
  }

  private renderFullState(state: GameState): void {
    const now = performance.now() / 1000;
    const deltaSec = this.lastTimeSec > 0 ? Math.min(0.1, now - this.lastTimeSec) : 0.016;
    this.lastTimeSec = now;

    this.npcMovementSystem.update(state, state.speed === 0 ? 0 : deltaSec * state.speed);

    // Renderizar Staff Voxel
    for (const agent of this.npcMovementSystem.staffAgents.values()) {
      this.drawVoxelAgent(agent.id, agent.role, agent.x, agent.y, agent.facing, agent.animState, now);
    }

    // Renderizar Pacientes Voxel
    for (const agent of this.npcMovementSystem.patientAgents.values()) {
      const pat = state.patients.get(agent.id);
      const ratio = pat && pat.patienceSec > 0 ? 1 - pat.waitTimeSec / pat.patienceSec : 1.0;
      this.drawVoxelAgent(agent.id, 'patient', agent.x, agent.y, agent.facing, agent.animState, now, ratio);

      if (pat && (pat.state === 'ready_for_treatment' || pat.state === 'needs_decision')) {
        this.drawSpeechBubble(agent.x, agent.y - 24, '🩺 Atender');
      }
    }
  }

  private renderLegacyFallback(patients: PatientInstance[], rooms: Map<string, RoomInstance>): void {
    const { tileSize } = THEME;
    const now = performance.now() / 1000;

    for (const patient of patients) {
      if (patient.state === 'waiting') {
        const waitingRooms = Array.from(rooms.values()).filter(
          (r) => r.definition.role === 'entry' || r.definition.role === 'queue'
        );
        if (waitingRooms.length > 0) {
          const r = waitingRooms[0]!;
          this.drawVoxelAgent(patient.id, 'patient', r.col * tileSize + 20, r.row * tileSize + 26, 'right', 'IDLE', now);
        }
      } else if (patient.state === 'ready_for_treatment' || patient.state === 'needs_decision' || patient.state === 'in_consultation') {
        if (patient.currentRoomId) {
          const room = rooms.get(patient.currentRoomId);
          if (room) {
            const docX = room.col * tileSize + 20;
            const docY = room.row * tileSize + 34;
            const patX = room.col * tileSize + room.width * tileSize - 22;
            const patY = room.row * tileSize + 34;

            this.drawVoxelAgent(`doc_${room.id}`, 'doctor', docX, docY, 'right', 'WORKING', now);
            this.drawVoxelAgent(patient.id, 'patient', patX, patY, 'left', 'IDLE', now);
            this.drawSpeechBubble(room.col * tileSize + (room.width * tileSize) / 2, room.row * tileSize - 6, '🩺 Atender');
          }
        }
      }
    }
  }

  private drawVoxelAgent(
    id: string,
    role: CharacterRole,
    x: number,
    y: number,
    facing: 'left' | 'right',
    animState: 'IDLE' | 'WALKING' | 'WORKING',
    timeSec: number,
    patienceRatio = 1.0
  ): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) return;

    let char = this.characterPool.get(id);
    if (!char) {
      const charIndex = Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
      char = new VoxelCharacter({
        role,
        gender: charIndex % 2 === 0 ? 'female' : 'male',
        skinToneIndex: charIndex % 6,
        hairColorIndex: charIndex % 5,
        patienceRatio,
      });
      this.characterPool.set(id, char);
      this.container.addChild(char.container);
    }

    char.config.role = role;
    char.config.patienceRatio = patienceRatio;
    char.facing = facing;
    char.container.position.set(x, y);
    char.update(timeSec, animState);
  }

  private drawSpeechBubble(x: number, y: number, icon: string): void {
    const pulse = 1 + 0.08 * Math.sin(Date.now() / 150);
    const halfW = 28 * pulse;
    const halfH = 12 * pulse;

    this.graphics.roundRect(x - halfW, y - halfH, halfW * 2, halfH * 2, 7)
      .fill({ color: 0xffffff })
      .stroke({ color: 0x10b981, width: 2 });
    this.graphics.moveTo(x - 3, y + halfH).lineTo(x + 3, y + halfH).lineTo(x, y + halfH + 4).fill({ color: 0xffffff });

    const iconText = new Text({
      text: icon,
      style: { fontSize: 11, fontWeight: 'bold', align: 'center', fill: 0x0f172a },
      anchor: 0.5,
      x,
      y: y - 1,
    });
    this.textContainer.addChild(iconText);
  }
}
