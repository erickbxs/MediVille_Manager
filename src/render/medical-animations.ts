/**
 * Arquivo: src/render/medical-animations.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza animações médicas procedurais 2.5D dentro das salas hospitalares ativas em atendimento (WORKING):
 * - Raio-X: lâmpada vermelha de aviso na porta, varredura azul-celeste e negatoscópio aceso.
 * - Laboratório: centrífuga giratória e tubos fluorescentes de ensaio.
 * - Cirurgia / Trauma / Emergência / UTI: cone de luz do foco cirúrgico de teto e traçado rápido de ECG.
 * - Consultório / Triagem: prancheta animada e micro-ícones flutuantes (🩺, 📋, ❤️).
 * - Maternidade: partículas celebratórias azuis/rosas e ícone 👶.
 * - Vacina e Curativo: selos visuais procedurais (💉, 🩹).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 19, dando vida hospitalar vívida e caricata (Two Point Hospital) sem sangue.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O loop de animação é alimentado pelo tempo decorrido timeSec. A geometria das salas é calculada via getRoomPixelRect.
 *
 * Importa: pixi.js, src/entities/room.ts, src/entities/patient.ts, src/render/theme-config.ts, src/render/room-layout.ts
 * Conecta-se com: src/render/renderer.ts, tests/fatigue-weather-balance-and-6langs.test.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import type { PatientInstance } from '../entities/patient';
import { THEME } from './theme-config';
import { getRoomPixelRect } from './room-layout';

export class MedicalAnimationsView {
  public container = new Container();
  private gfx = new Graphics();
  private badgeContainer = new Container();

  constructor() {
    this.container.addChild(this.gfx);
    this.container.addChild(this.badgeContainer);
  }

  public render(rooms: RoomInstance[], patients: Map<string, PatientInstance>, timeSec: number): void {
    this.gfx.clear();
    this.badgeContainer.removeChildren();

    for (const room of rooms) {
      const activePatient = room.occupantIds
        .map((id) => patients.get(id))
        .find((p) => p && (p.state === 'in_consultation' || p.state === 'ready_for_treatment'));

      if (!activePatient) continue;

      const r = getRoomPixelRect(room, THEME.tileSize);
      const type = room.typeId;

      if (type === 'consultation' || type === 'triage') {
        this.renderConsultationAnim(r, timeSec);
      } else if (type === 'xray') {
        this.renderXrayAnim(r, timeSec);
      } else if (type === 'laboratory') {
        this.renderLabAnim(r, timeSec);
      } else if (type === 'surgery' || type === 'trauma_center' || type === 'emergency_room' || type === 'icu') {
        this.renderSurgeryAnim(r, timeSec);
      } else if (type === 'maternity') {
        this.renderMaternityAnim(r, timeSec);
      } else if (type === 'vaccination' || type === 'wound_care') {
        this.renderProcAnim(r, type, timeSec);
      }
    }
  }

  private renderConsultationAnim(r: { x: number; y: number; w: number; h: number }, timeSec: number): void {
    const floatY = Math.sin(timeSec * 3) * 4;
    const alpha = 0.6 + Math.sin(timeSec * 2) * 0.3;

    // Prancheta com micro-ícone flutuante
    this.gfx.roundRect(r.x + r.w * 0.65, r.y + r.h * 0.35 + floatY, 14, 18, 2)
      .fill({ color: 0xf8fafc, alpha: 0.95 })
      .stroke({ color: 0x94a3b8, width: 1 });
    this.gfx.rect(r.x + r.w * 0.65 + 3, r.y + r.h * 0.35 + floatY + 4, 8, 2).fill({ color: 0x0284c7 });
    this.gfx.rect(r.x + r.w * 0.65 + 3, r.y + r.h * 0.35 + floatY + 8, 6, 2).fill({ color: 0x64748b });

    // Pulso de coração flutuante
    this.gfx.circle(r.x + r.w * 0.5, r.y + r.h * 0.25 + floatY, 3).fill({ color: 0xe11d48, alpha });
  }

  private renderXrayAnim(r: { x: number; y: number; w: number; h: number }, timeSec: number): void {
    // Lâmpada de aviso vermelha acesa
    this.gfx.circle(r.x + r.w / 2, r.y + 4, 4).fill({ color: 0xe11d48 });
    this.gfx.circle(r.x + r.w / 2, r.y + 4, 8).fill({ color: 0xe11d48, alpha: 0.25 });

    // Varredura azul-clara na mesa de exame
    const scanPos = (timeSec % 1.5) / 1.5;
    const scanY = r.y + r.h * 0.3 + scanPos * (r.h * 0.4);
    this.gfx.rect(r.x + r.w * 0.25, scanY, r.w * 0.5, 3).fill({ color: 0x38bdf8, alpha: 0.85 });
    this.gfx.rect(r.x + r.w * 0.25, r.y + r.h * 0.3, r.w * 0.5, r.h * 0.4).fill({ color: 0x0284c7, alpha: 0.12 });
  }

  private renderLabAnim(r: { x: number; y: number; w: number; h: number }, timeSec: number): void {
    // Centrífuga giratória
    const cx = r.x + r.w * 0.7;
    const cy = r.y + r.h * 0.4;
    const angle = timeSec * 8;
    this.gfx.circle(cx, cy, 8).fill({ color: 0x334155 });
    const p1x = cx + Math.cos(angle) * 5;
    const p1y = cy + Math.sin(angle) * 5;
    const p2x = cx - Math.cos(angle) * 5;
    const p2y = cy - Math.sin(angle) * 5;
    this.gfx.circle(p1x, p1y, 2.5).fill({ color: 0x38bdf8 });
    this.gfx.circle(p2x, p2y, 2.5).fill({ color: 0xec4899 });

    // Tubos de ensaio brilhantes na bancada
    this.gfx.rect(r.x + r.w * 0.2, r.y + r.h * 0.6, 4, 10).fill({ color: 0x10b981, alpha: 0.85 });
    this.gfx.rect(r.x + r.w * 0.2 + 6, r.y + r.h * 0.6, 4, 10).fill({ color: 0x8b5cf6, alpha: 0.85 });
  }

  private renderSurgeryAnim(r: { x: number; y: number; w: number; h: number }, timeSec: number): void {
    // Foco cirúrgico de teto projetando cone de luz brilhante
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    this.gfx.circle(cx, cy, 18).fill({ color: 0xfef08a, alpha: 0.22 });
    this.gfx.circle(cx, cy, 10).fill({ color: 0xffffff, alpha: 0.35 });

    // Monitor multiparamétrico com linha de ECG pulsante
    const ecgX = r.x + r.w * 0.2;
    const ecgY = r.y + r.h * 0.25;
    const ecgPulse = Math.sin(timeSec * 10) * 3;
    this.gfx.rect(ecgX, ecgY, 18, 12).fill({ color: 0x0f172a }).stroke({ color: 0x334155, width: 1 });
    this.gfx.moveTo(ecgX + 2, ecgY + 6)
      .lineTo(ecgX + 6, ecgY + 6)
      .lineTo(ecgX + 9, ecgY + 6 + ecgPulse)
      .lineTo(ecgX + 12, ecgY + 6 - ecgPulse)
      .lineTo(ecgX + 16, ecgY + 6)
      .stroke({ color: 0x10b981, width: 1.5 });
  }

  private renderMaternityAnim(r: { x: number; y: number; w: number; h: number }, timeSec: number): void {
    const floatY = Math.sin(timeSec * 2.5) * 3;
    // Estrelas e berço acolhedor
    this.gfx.circle(r.x + r.w * 0.4, r.y + r.h * 0.35 + floatY, 3).fill({ color: 0x38bdf8, alpha: 0.8 });
    this.gfx.circle(r.x + r.w * 0.6, r.y + r.h * 0.35 - floatY, 3).fill({ color: 0xf472b6, alpha: 0.8 });

    const txt = new Text({
      text: '👶',
      style: { fontSize: 13 },
      x: r.x + r.w / 2 - 6,
      y: r.y + r.h * 0.4 + floatY,
    });
    this.badgeContainer.addChild(txt);
  }

  private renderProcAnim(r: { x: number; y: number; w: number; h: number }, type: string, timeSec: number): void {
    const floatY = Math.sin(timeSec * 3) * 3;
    const icon = type === 'vaccination' ? '💉' : '🩹';
    const txt = new Text({
      text: icon,
      style: { fontSize: 12 },
      x: r.x + r.w * 0.7,
      y: r.y + r.h * 0.3 + floatY,
    });
    this.badgeContainer.addChild(txt);
  }
}
