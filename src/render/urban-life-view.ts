/**
 * Arquivo: src/render/urban-life-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza visualmente o ecossistema urbano ao redor do hospital no PixiJS: NPCs cidadãos passeando, cão voxel,
 * balões de conversa/música/café na praça, quiosque de café, semáforo com luzes funcionais e fonte de água animada.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 6 do Prompt 17, dando vida, movimento e rica ambientação estética 2.5D aos arredores do hospital.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Elementos visuais são renderizados em render(). As animações de onda e semáforo utilizam o tempo atual e UrbanLifeSystem.
 *
 * Importa: pixi.js, src/systems/urban-life-system.ts, src/render/character-3d.ts
 * Conecta-se com: src/render/renderer.ts, src/systems/urban-life-system.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { UrbanLifeSystem, UrbanCitizen } from '../systems/urban-life-system';
import { Character3D } from './character-3d';

export class UrbanLifeView {
  public container = new Container();
  private g = new Graphics();
  private textContainer = new Container();
  private characters = new Map<string, Character3D>();

  constructor() {
    this.container.addChild(this.g);
    this.container.addChild(this.textContainer);
  }

  public render(urbanSystem: UrbanLifeSystem, timeSec: number): void {
    this.g.clear();
    for (const child of this.textContainer.removeChildren()) child.destroy();

    this.drawKiosk();
    this.drawWaterFountain(timeSec);
    this.drawTrafficLight(urbanSystem.trafficLightState);
    this.drawCitizens(urbanSystem.citizens, timeSec);
  }

  private drawKiosk(): void {
    const kX = -75;
    const kY = 12 * 48 + 36;
    // Quiosque de Café / Banca
    this.g.roundRect(kX, kY - 26, 36, 26, 3).fill({ color: 0x451a03 });
    this.g.rect(kX + 2, kY - 14, 32, 12).fill({ color: 0xfde047 });
    // Toldo listrado vermelho e branco
    this.g.roundRect(kX - 4, kY - 30, 44, 7, 2).fill({ color: 0xdc2626 });
    for (let i = 0; i < 4; i++) {
      this.g.rect(kX - 2 + i * 11, kY - 30, 5, 7).fill({ color: 0xffffff });
    }
  }

  private drawWaterFountain(timeSec: number): void {
    const fX = 340;
    const fY = -70;
    // Base da fonte de água
    this.g.ellipse(fX, fY, 24, 14).fill({ color: 0x94a3b8 });
    this.g.ellipse(fX, fY, 20, 11).fill({ color: 0x0284c7 });

    // Anéis de água pulsantes
    const wave = (timeSec * 3) % 1;
    this.g.ellipse(fX, fY, 6 + wave * 13, 3 + wave * 7).stroke({ color: 0xbae6fd, width: 1.5, alpha: 1 - wave });
    this.g.circle(fX, fY - 4, 3.5).fill({ color: 0x38bdf8 });
  }

  private drawTrafficLight(state: 'RED' | 'YELLOW' | 'GREEN'): void {
    const tX = 145;
    const tY = 12 * 48 + 20;

    // Poste do semáforo
    this.g.rect(tX, tY, 3, 24).fill({ color: 0x334155 });
    // Caixa do semáforo
    this.g.roundRect(tX - 4, tY - 22, 11, 24, 2).fill({ color: 0x0f172a });

    // Luzes
    this.g.circle(tX + 1.5, tY - 17, 2.5).fill({ color: state === 'RED' ? 0xef4444 : 0x450a0a });
    this.g.circle(tX + 1.5, tY - 10, 2.5).fill({ color: state === 'YELLOW' ? 0xfacc15 : 0x713f12 });
    this.g.circle(tX + 1.5, tY - 3, 2.5).fill({ color: state === 'GREEN' ? 0x22c55e : 0x052e16 });
  }

  private drawCitizens(citizens: UrbanCitizen[], timeSec: number): void {
    for (const c of citizens) {
      let char = this.characters.get(c.id);
      if (!char) {
        char = new Character3D({
          role: 'patient',
          gender: c.colorIndex % 2 === 0 ? 'female' : 'male',
          skinToneIndex: c.colorIndex,
          hairColorIndex: (c.colorIndex + 2) % 6,
          hairStyleIndex: c.colorIndex % 4,
          clothesColorIndex: (c.colorIndex * 7) % 12,
        });
        this.characters.set(c.id, char);
        this.container.addChild(char.container);
      }

      char.facing = c.facing;
      char.container.position.set(c.x, c.y);
      char.update(timeSec, c.animState);

      if (c.hasDog) {
        this.drawDog(c.x + (c.facing === 'right' ? -14 : 14), c.y + 4, c.facing, timeSec);
      }

      if (c.bubbleIcon) {
        this.drawIconBubble(c.x, c.y - 24, c.bubbleIcon, timeSec);
      }
    }
  }

  private drawDog(x: number, y: number, facing: 'left' | 'right', timeSec: number): void {
    const bob = Math.sin(timeSec * 8) * 1;
    const dir = facing === 'right' ? 1 : -1;

    // Corpo e patas do cãozinho voxel
    this.g.roundRect(x - 5, y + bob, 10, 6, 2).fill({ color: 0xd97706 });
    this.g.circle(x + dir * 5, y - 2 + bob, 3).fill({ color: 0xb45309 }); // Cabeça
    this.g.rect(x - dir * 5, y - 3 + bob, 2, 4).fill({ color: 0x92400e }); // Rabo
    this.g.rect(x - 3, y + 6 + bob, 2, 3).fill({ color: 0x78350f });
    this.g.rect(x + 2, y + 6 + bob, 2, 3).fill({ color: 0x78350f });
  }

  private drawIconBubble(x: number, y: number, icon: string, timeSec: number): void {
    const floatY = Math.sin(timeSec * 2.5 + x) * 1.5;
    this.g.circle(x, y + floatY, 8.5).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ color: 0x94a3b8, width: 1 });
    this.g.moveTo(x - 2, y + floatY + 8).lineTo(x + 2, y + floatY + 8).lineTo(x, y + floatY + 11).fill({ color: 0xffffff });

    const txt = new Text({
      text: icon,
      style: { fontSize: 9, align: 'center' },
      anchor: 0.5,
      x,
      y: y + floatY,
    });
    this.textContainer.addChild(txt);
  }
}
