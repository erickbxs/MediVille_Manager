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
    this.graphics.roundPixels = true;
    this.container.sortableChildren = true;
    this.graphics.zIndex = 10;
    this.textContainer.zIndex = 1000;
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

      if (pat) {
        if (pat.state === 'ready_for_treatment' || pat.state === 'needs_decision') {
          const isMastered = state.masteredCaseIds.includes(pat.clinicalCase.definition.id);
          const label = isMastered ? '🩺 Atender' : '🆕 Novo Caso! 🩺';
          this.drawSpeechBubble(agent.x, agent.y - 26, label, !isMastered);
        } else if (pat.state === 'in_consultation') {
          const progress = Math.min(1.0, pat.consultationTimeSec / Math.max(0.1, pat.consultationDurationSec));
          this.drawAutoProtocolProgress(agent.x, agent.y - 28, progress);
        }
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
      } else if (patient.state === 'ready_for_treatment' || patient.state === 'needs_decision') {
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
      } else if (patient.state === 'in_consultation' && patient.currentRoomId) {
        const room = rooms.get(patient.currentRoomId);
        if (room) {
          const progress = Math.min(1.0, patient.consultationTimeSec / Math.max(0.1, patient.consultationDurationSec));
          this.drawAutoProtocolProgress(room.col * tileSize + (room.width * tileSize) / 2, room.row * tileSize - 8, progress);
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

  private drawAutoProtocolProgress(x: number, y: number, progress: number): void {
    const width = 84;
    const height = 10;
    const halfW = width / 2;

    this.graphics.roundRect(x - halfW, y - height / 2, width, height, 4)
      .fill({ color: 0x0f172a, alpha: 0.85 })
      .stroke({ color: 0x334155, width: 1 });

    const fillWidth = Math.max(2, (width - 4) * Math.min(1.0, Math.max(0, progress)));
    this.graphics.roundRect(x - halfW + 2, y - height / 2 + 2, fillWidth, height - 4, 2)
      .fill({ color: 0x10b981 });

    const label = new Text({
      text: '⚡ Protocolo...',
      style: {
        fontSize: 8,
        fontWeight: 'bold',
        align: 'center',
        fill: 0xffffff,
        fontFamily: "'Fredoka', system-ui, sans-serif",
      },
      anchor: 0.5,
      x,
      y: y - 8,
    });
    this.textContainer.addChild(label);
  }

  private drawSpeechBubble(x: number, y: number, text: string, isNewCase = false): void {
    const pulse = isNewCase ? 1 + 0.08 * Math.sin(Date.now() / 150) : 1;
    const halfW = (isNewCase ? 48 : 32) * pulse;
    const halfH = 12 * pulse;
    const strokeColor = isNewCase ? 0xf59e0b : 0x10b981;

    this.graphics.roundRect(x - halfW, y - halfH, halfW * 2, halfH * 2, 7)
      .fill({ color: 0xffffff })
      .stroke({ color: strokeColor, width: 2 });
    this.graphics.moveTo(x - 3, y + halfH).lineTo(x + 3, y + halfH).lineTo(x, y + halfH + 4).fill({ color: 0xffffff });

    const iconText = new Text({
      text,
      style: {
        fontSize: isNewCase ? 9 : 11,
        fontWeight: 'bold',
        align: 'center',
        fill: 0x0f172a,
        fontFamily: "'Fredoka', system-ui, sans-serif",
      },
      anchor: 0.5,
      x,
      y: y - 1,
    });
    this.textContainer.addChild(iconText);
  }

}
