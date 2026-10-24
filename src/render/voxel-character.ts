/**
 * Arquivo: src/render/voxel-character.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza personagens humanos em arte procedural blocky/voxel 2.5D (estilo Crossy Road / Minecraft)
 * utilizando PIXI.Graphics, com partes articuladas (cabeça, torso, braços, pernas), sombras no chão,
 * 5 papéis clínicos distinguíveis (médico, enfermeiro, farmacêutico, recepcionista e paciente) e animações determinísticas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar vida e profundidade estética ao hospital sem usar sprites ou texturas externas, mantendo o bundle abaixo de 2 MB.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para testar proporções ou adicionar novas roupas/papéis, modifique drawCharacterVoxel ou execute tests/voxel-and-mobile-evolution.test.ts.
 *
 * Importa: pixi.js (Container, Graphics), src/render/voxel.ts
 * Conecta-se com: src/render/patients-view.ts, src/systems/npc-movement-system.ts, src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import { shadeColor } from './voxel';

export type CharacterRole = 'doctor' | 'nurse' | 'pharmacist' | 'receptionist' | 'patient';
export type AnimationState = 'IDLE' | 'WALKING' | 'WORKING';

export interface VoxelCharacterConfig {
  role: CharacterRole;
  gender: 'female' | 'male';
  skinToneIndex?: number;
  hairColorIndex?: number;
  hairStyleIndex?: number;
  patienceRatio?: number;
}

const SKIN_TONES = [0xffdfc4, 0xf0c8a0, 0xd4a373, 0xaa724b, 0x8c5332, 0x5a3825];
const HAIR_COLORS = [0x1e293b, 0x451a03, 0xb45309, 0xf59e0b, 0x94a3b8];
const CASUAL_SHIRTS = [0x3b82f6, 0xef4444, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899];

export class VoxelCharacter {
  public container = new Container();
  private g = new Graphics();
  public config: VoxelCharacterConfig;
  public animState: AnimationState = 'IDLE';
  public facing: 'left' | 'right' = 'right';

  constructor(config: VoxelCharacterConfig) {
    this.config = config;
    this.container.addChild(this.g);
  }

  public update(timeSec: number, animState: AnimationState = this.animState): void {
    this.animState = animState;
    this.g.clear();

    const skinColor = SKIN_TONES[(this.config.skinToneIndex ?? 0) % SKIN_TONES.length]!;
    const hairColor = HAIR_COLORS[(this.config.hairColorIndex ?? 0) % HAIR_COLORS.length]!;

    const isWalking = animState === 'WALKING';
    const isWorking = animState === 'WORKING';

    const walkSpeed = 9;
    const walkSwing = isWalking ? Math.sin(timeSec * walkSpeed) : 0;
    const bobbing = isWalking ? Math.abs(Math.sin(timeSec * walkSpeed)) * 2 : 0;
    const breath = animState === 'IDLE' ? Math.sin(timeSec * 2.5) * 0.5 : 0;

    // Sombra projetada no piso
    this.g.ellipse(0, 10, 8, 3.5).fill({ color: 0x0f172a, alpha: 0.22 });

    // Pernas (Blocky Legs)
    const legW = 3;
    const legH = 7;
    const leftLegY = 2 + (isWalking ? walkSwing * 2 : 0);
    const rightLegY = 2 - (isWalking ? walkSwing * 2 : 0);
    const pantsColor = this.getPantsColor();

    this.drawBox(-3.5, leftLegY, legW, legH, pantsColor);
    this.drawBox(0.5, rightLegY, legW, legH, pantsColor);

    // Torso (Vestimenta por Papel)
    const torsoY = -6 - bobbing + breath;
    this.drawTorso(-4.5, torsoY, 9, 8);

    // Braços (Arm Swing / Working)
    const armW = 2.5;
    const armH = 7;
    const leftArmOffset = isWalking ? -walkSwing * 3 : (isWorking ? Math.sin(timeSec * 6) * 3 : 0);
    const rightArmOffset = isWalking ? walkSwing * 3 : (isWorking ? -Math.sin(timeSec * 6) * 3 : 0);

    const sleeveColor = this.getSleeveColor();
    this.drawBox(-7.5, torsoY + 1 + leftArmOffset, armW, armH, sleeveColor);
    this.drawBox(5, torsoY + 1 + rightArmOffset, armW, armH, sleeveColor);
    // Mãos (tons de pele)
    this.drawBox(-7.5, torsoY + 1 + armH + leftArmOffset, armW, 2, skinColor);
    this.drawBox(5, torsoY + 1 + armH + rightArmOffset, armW, 2, skinColor);

    // Cabeça Cúbica 2.5D
    const headY = torsoY - 8.5;
    this.drawHead(0, headY, skinColor, hairColor);
  }

  private drawBox(x: number, y: number, w: number, h: number, baseColor: number): void {
    const depth = 2.5;
    // Face superior iluminada
    this.g.rect(x, y - depth, w, depth).fill({ color: shadeColor(baseColor, 1.25) });
    // Face frontal base
    this.g.rect(x, y, w, h).fill({ color: baseColor });
    // Face lateral direita sombreada
    this.g.rect(x + w, y - depth * 0.5, depth, h).fill({ color: shadeColor(baseColor, 0.75) });
  }

  private drawTorso(x: number, y: number, w: number, h: number): void {
    const role = this.config.role;
    if (role === 'doctor') {
      // Jaleco branco com camisa celeste no centro e estetoscópio pixelado
      this.drawBox(x, y, w, h, 0xffffff);
      this.g.rect(x + 3, y + 1, 3, h - 2).fill({ color: 0x38bdf8 });
      // Estetoscópio
      this.g.rect(x + 2, y + 1, 1, 4).fill({ color: 0x0284c7 });
      this.g.rect(x + 6, y + 1, 1, 4).fill({ color: 0x0284c7 });
      this.g.rect(x + 3, y + 4, 3, 1).fill({ color: 0x0284c7 });
    } else if (role === 'nurse') {
      // Uniforme Verde Água / Teal com cruz branca no peito
      this.drawBox(x, y, w, h, 0x0d9488);
      this.g.rect(x + 3.5, y + 2, 2, 4).fill({ color: 0xffffff });
      this.g.rect(x + 2.5, y + 3, 4, 2).fill({ color: 0xffffff });
    } else if (role === 'pharmacist') {
      // Jaleco branco sobre camisa azul royal
      this.drawBox(x, y, w, h, 0xffffff);
      this.g.rect(x + 3, y + 1, 3, h - 2).fill({ color: 0x2563eb });
    } else if (role === 'receptionist') {
      // Camisa âmbar com crachá
      this.drawBox(x, y, w, h, 0xd97706);
      this.g.rect(x + 2, y + 2, 2.5, 3).fill({ color: 0xffffff });
      this.g.rect(x + 2.5, y + 2.5, 1.5, 1).fill({ color: 0x0284c7 });
    } else {
      // Paciente com roupas casuais
      const shirt = CASUAL_SHIRTS[(this.config.skinToneIndex ?? 0) % CASUAL_SHIRTS.length]!;
      this.drawBox(x, y, w, h, shirt);
    }
  }

  private drawHead(cx: number, cy: number, skinColor: number, hairColor: number): void {
    const size = 7.5;
    const x = cx - size / 2;
    const y = cy;

    // Cabeça base (bloco de pele)
    this.drawBox(x, y, size, size, skinColor);

    // Cabelo blocky estilizado
    this.g.rect(x - 0.5, y - 3, size + 1, 3).fill({ color: hairColor });
    if (this.config.gender === 'female') {
      // Mechas laterais / franja
      this.g.rect(x - 1, y, 1.5, size * 0.7).fill({ color: hairColor });
      this.g.rect(x + size - 0.5, y, 1.5, size * 0.7).fill({ color: hairColor });
    }

    // Olhos pixelados
    const eyeOffsetX = this.facing === 'left' ? -0.5 : 0.5;
    this.g.rect(x + 2 + eyeOffsetX, y + 2.5, 1.2, 1.5).fill({ color: 0x0f172a });
    this.g.rect(x + 4.5 + eyeOffsetX, y + 2.5, 1.2, 1.5).fill({ color: 0x0f172a });

    // Expressão facial e indicador de paciência para paciente
    if (this.config.role === 'patient') {
      const ratio = this.config.patienceRatio ?? 1.0;
      if (ratio >= 0.7) {
        // Boca calma / sorriso
        this.g.rect(x + 2.5, y + 5, 2.5, 0.8).fill({ color: 0x334155 });
      } else if (ratio >= 0.3) {
        // Boca tensa + gota de suor
        this.g.rect(x + 2.5, y + 5, 2.5, 0.8).fill({ color: 0x334155 });
        this.g.circle(x + size + 1, y + 2, 1.2).fill({ color: 0x38bdf8 });
      } else {
        // Alerta: rosto corado e boca zangada
        this.g.rect(x + 1, y + 3.5, 1.5, 1).fill({ color: 0xef4444, alpha: 0.6 });
        this.g.rect(x + 5, y + 3.5, 1.5, 1).fill({ color: 0xef4444, alpha: 0.6 });
        this.g.rect(x + 2.5, y + 5.5, 2.5, 1).fill({ color: 0xb91c1c });
      }
    }
  }

  private getPantsColor(): number {
    if (this.config.role === 'nurse') return 0x0f766e;
    if (this.config.role === 'doctor') return 0x0284c7;
    return 0x1e293b;
  }

  private getSleeveColor(): number {
    if (this.config.role === 'doctor') return 0xffffff;
    if (this.config.role === 'nurse') return 0x0d9488;
    if (this.config.role === 'pharmacist') return 0xffffff;
    if (this.config.role === 'receptionist') return 0xd97706;
    return CASUAL_SHIRTS[(this.config.skinToneIndex ?? 0) % CASUAL_SHIRTS.length]!;
  }
}
