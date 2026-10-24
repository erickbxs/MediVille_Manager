/**
 * Arquivo: src/render/patients-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza pacientes e profissionais com arte caricata estilizada, sombras dinâmicas, jalecos e balão pulsante 🩺 indicando pacientes prontos para consulta médica.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Permitir que o jogador visualize claramente o fluxo de pacientes na fila e nos consultórios, identificando prontamente quem aguarda atendimento on-demand.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste tamanhos, cores ou animações em drawCharacter e drawSpeechBubble.
 *
 * Importa: pixi.js, src/entities/patient.ts, src/entities/room.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { PatientInstance } from '../entities/patient';
import type { RoomInstance } from '../entities/room';
import { THEME } from './theme-config';

export class PatientsView {
  public container = new Container();
  private graphics = new Graphics();
  private textContainer = new Container();

  constructor() {
    this.container.addChild(this.graphics);
    this.container.addChild(this.textContainer);
  }

  public render(patients: PatientInstance[], rooms: Map<string, RoomInstance>): void {
    this.graphics.clear();
    for (const child of this.textContainer.removeChildren()) child.destroy();

    const waitingPatients = patients.filter((p) => p.state === 'waiting');
    const waitingRooms = Array.from(rooms.values()).filter(
      (r) => r.definition.role === 'entry' || r.definition.role === 'queue'
    );
    this.drawWaitingPatients(waitingPatients, waitingRooms);

    const inConsultation = patients.filter(
      (p) => p.state === 'in_consultation' || p.state === 'needs_decision' || p.state === 'ready_for_treatment'
    );
    this.drawConsultationPatients(inConsultation, rooms);
  }

  private getPatienceColor(patient: PatientInstance): number {
    const ratio = patient.patienceSec > 0 ? patient.waitTimeSec / patient.patienceSec : 0;
    if (ratio >= THEME.patient.angryRatio) return 0xef4444; // Vermelho
    if (ratio >= THEME.patient.worriedRatio) return 0xf59e0b; // Laranja
    return 0x3b82f6; // Azul
  }

  private drawWaitingPatients(patients: PatientInstance[], rooms: RoomInstance[]): void {
    if (rooms.length === 0) return;
    const { tileSize } = THEME;

    patients.forEach((patient, index) => {
      const room = rooms[index % rooms.length]!;
      const rowOffset = Math.floor(index / rooms.length);
      const px = room.col * tileSize + 16 + (index % 3) * 18;
      const py = room.row * tileSize + room.height * tileSize - 18 - rowOffset * 16;

      this.drawCharacter(px, py, this.getPatienceColor(patient), false);
    });
  }

  private drawConsultationPatients(patients: PatientInstance[], rooms: Map<string, RoomInstance>): void {
    const { tileSize } = THEME;
    for (const patient of patients) {
      if (!patient.currentRoomId) continue;
      const room = rooms.get(patient.currentRoomId);
      if (!room) continue;

      const doctorX = room.col * tileSize + 20;
      const doctorY = room.row * tileSize + 34;
      this.drawCharacter(doctorX, doctorY, 0xffffff, true);

      const patientX = room.col * tileSize + room.width * tileSize - 22;
      const patientY = room.row * tileSize + 34;
      this.drawCharacter(patientX, patientY, this.getPatienceColor(patient), false);

      if (patient.state === 'ready_for_treatment' || patient.state === 'needs_decision') {
        const centerX = room.col * tileSize + (room.width * tileSize) / 2;
        this.drawSpeechBubble(centerX, room.row * tileSize - 6, '🩺 Atender');
      }
    }
  }

  private drawCharacter(x: number, y: number, color: number, isDoctor: boolean): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) return;

    // Sombra no chão
    this.graphics.ellipse(x, y + 8, 7, 3).fill({ color: 0x000000, alpha: 0.18 });

    // Tronco / roupa
    const bodyColor = isDoctor ? 0xffffff : color;
    this.graphics.roundRect(x - 5, y, 10, 8, 3)
      .fill({ color: bodyColor })
      .stroke({ color: isDoctor ? 0x0ea5e9 : 0x1e293b, width: 1 });

    // Cabeça caricata
    this.graphics.circle(x, y - 4, 6)
      .fill({ color: 0xfde047 }) // Tom de pele caricato
      .stroke({ color: 0x1e293b, width: 1 });

    // Cabelo ou estetoscópio (moveTo explícito antes do arc para evitar linha espúria até (0,0))
    if (isDoctor) {
      this.graphics.moveTo(x + 4, y - 4);
      this.graphics.arc(x, y - 4, 4, 0, Math.PI).stroke({ color: 0x0284c7, width: 1.5 });
    }
  }

  private drawSpeechBubble(x: number, y: number, icon: string): void {
    const pulse = 1 + 0.1 * Math.sin(Date.now() / 150);
    const baseW = icon.length > 2 ? 30 : 12;
    const halfW = baseW * pulse;
    const halfH = 10 * pulse;
    this.graphics.roundRect(x - halfW, y - halfH, halfW * 2, halfH * 2, 6)
      .fill({ color: 0xffffff })
      .stroke({ color: 0x10b981, width: 2 });
    this.graphics.moveTo(x - 2, y + halfH).lineTo(x + 2, y + halfH).lineTo(x, y + halfH + 3).fill({ color: 0xffffff });

    const iconText = new Text({
      text: icon,
      style: { fontSize: 11, align: 'center' },
      anchor: 0.5,
      x,
      y: y - 1,
    });
    this.textContainer.addChild(iconText);
  }
}
