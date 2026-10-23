/**
 * Arquivo: src/render/patients-view.ts
 * O que faz: Renderiza os pacientes e profissionais de saúde com arte caricata estilizada, sombras no chão, jalecos médicos e balões visuais de status clínico.
 * Para que foi criado: Aprimorar a imersão e expressividade visual dos personagens conforme solicitado pelo usuário.
 * Como modificar/debugar: Ajuste tamanhos de avatares ou cores em drawCharacter().
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
    this.textContainer.removeChildren();

    const waitingPatients = patients.filter((p) => p.state === 'waiting');
    const waitingRooms = Array.from(rooms.values()).filter(
      (r) => r.definition.role === 'entry' || r.definition.role === 'queue'
    );
    this.drawWaitingPatients(waitingPatients, waitingRooms);

    const inConsultation = patients.filter(
      (p) => p.state === 'in_consultation' || p.state === 'needs_decision'
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
      // Desenha o médico da sala de jaleco branco
      this.drawCharacter(doctorX, doctorY, 0xffffff, true);

      // Desenha o paciente atendido
      const patientX = room.col * tileSize + room.width * tileSize - 22;
      const patientY = room.row * tileSize + 34;
      this.drawCharacter(patientX, patientY, this.getPatienceColor(patient), false);

      // Balão de decisão médica pendente
      if (patient.state === 'needs_decision') {
        this.drawSpeechBubble(patientX, patientY - 18, '🩺');
      }
    }
  }

  private drawCharacter(x: number, y: number, color: number, isDoctor: boolean): void {
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

    // Cabelo ou estetoscópio
    if (isDoctor) {
      this.graphics.arc(x, y - 4, 4, 0, Math.PI).stroke({ color: 0x0284c7, width: 1.5 });
    }
  }

  private drawSpeechBubble(x: number, y: number, icon: string): void {
    this.graphics.roundRect(x - 10, y - 10, 20, 16, 5)
      .fill({ color: 0xffffff })
      .stroke({ color: 0xef4444, width: 1.5 });
    this.graphics.moveTo(x - 2, y + 6).lineTo(x + 2, y + 6).lineTo(x, y + 9).fill({ color: 0xffffff });

    const iconText = new Text({
      text: icon,
      style: { fontSize: 10, align: 'center' },
      anchor: 0.5,
      x,
      y: y - 2,
    });
    this.textContainer.addChild(iconText);
  }
}
