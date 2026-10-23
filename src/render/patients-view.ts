/**
 * Arquivo: src/render/patients-view.ts
 * O que faz: Renderiza os pacientes no hospital (na recepção, salas de espera e consultórios), com cor indicativa de paciência.
 * Para que foi criado: Permitir visualização imediata da lotação do hospital e do nível de estresse da fila.
 * Como modificar/debugar: Cores e tamanhos dos avatares de pacientes são lidos de src/data/theme.json.
 * Importa: pixi.js, src/entities/patient.ts, src/entities/room.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import type { PatientInstance } from '../entities/patient';
import type { RoomInstance } from '../entities/room';
import { THEME } from './theme-config';

export class PatientsView {
  public container = new Container();
  private graphics = new Graphics();

  constructor() {
    this.container.addChild(this.graphics);
  }

  public render(patients: PatientInstance[], rooms: Map<string, RoomInstance>): void {
    this.graphics.clear();

    const waitingPatients = patients.filter((p) => p.state === 'waiting');
    const waitingRooms = Array.from(rooms.values()).filter((r) => r.definition.role === 'entry' || r.definition.role === 'queue');
    this.drawWaitingPatients(waitingPatients, waitingRooms);

    const inConsultationPatients = patients.filter((p) => p.state === 'in_consultation' || p.state === 'needs_decision');
    this.drawConsultationPatients(inConsultationPatients, rooms);
  }

  private getPatienceColor(patient: PatientInstance): string {
    const ratio = patient.patienceSec > 0 ? patient.waitTimeSec / patient.patienceSec : 0;
    if (ratio >= THEME.patient.angryRatio) return THEME.palettes.light.patientAngry;
    if (ratio >= THEME.patient.worriedRatio) return THEME.palettes.light.patientWorried;
    return THEME.palettes.light.patientCalm;
  }

  private drawWaitingPatients(patients: PatientInstance[], rooms: RoomInstance[]): void {
    if (rooms.length === 0) return;
    const { tileSize } = THEME;

    patients.forEach((patient, index) => {
      const room = rooms[index % rooms.length]!;
      const rowOffset = Math.floor(index / rooms.length);
      const px = room.col * tileSize + THEME.patient.padding + (index % 3) * THEME.patient.spacing;
      const py = room.row * tileSize + room.height * tileSize - THEME.patient.padding - rowOffset * 14;

      this.drawPatientAvatar(px, py, this.getPatienceColor(patient));
    });
  }

  private drawConsultationPatients(patients: PatientInstance[], rooms: Map<string, RoomInstance>): void {
    const { tileSize } = THEME;
    for (const patient of patients) {
      if (!patient.currentRoomId) continue;
      const room = rooms.get(patient.currentRoomId);
      if (!room) continue;

      const px = (room.col + room.width / 2) * tileSize;
      const py = (room.row + room.height / 2) * tileSize + 10;
      this.drawPatientAvatar(px, py, this.getPatienceColor(patient));

      if (patient.state === 'needs_decision') {
        this.graphics.circle(px, py - 18, 5).fill({ color: 0xef4444 });
      }
    }
  }

  private drawPatientAvatar(x: number, y: number, color: string): void {
    this.graphics.circle(x, y, THEME.patient.radius + 1)
      .fill({ color: THEME.palettes.light.patientOutline });
    this.graphics.circle(x, y, THEME.patient.radius)
      .fill({ color });
  }
}
