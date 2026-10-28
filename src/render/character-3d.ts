/**
 * Arquivo: src/render/character-3d.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza personagens e avatares hospitalares 3D sobre ambiente 2.5D (estilo Two Point Hospital / Theme Hospital)
 * utilizando PIXI.Graphics procedural, com volume arredondado (cilindros e cápsulas 3D), sombreamento suave de múltiplas
 * faces com gradientes de luz especular, oclusão ambiental (AO) entre cabeça/tronco, olhos expressivos com catchlight,
 * sobrancelhas animadas, cabelos volumosos em camadas e vestimentas/adereços fiéis aos 7 cargos de saúde e pacientes com postura variável.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 15, elevando a riqueza gráfica e sensação de profundidade 3D dos personagens sem carregar
 * texturas ou modelos externos pesados, mantendo o bundle leve (< 5 MB) e fluidez em 60 FPS no mobile.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Parâmetros de iluminação e proporções estão definidos em LIGHT_VECTORS e DIMENSIONS. Cada papel possui métodos dedicados
 * de vestimentas (drawDoctorAttire, drawNurseAttire, drawPatientAttire, etc.).
 *
 * Importa: pixi.js, src/render/voxel.ts
 * Conecta-se com: src/render/patients-view.ts, src/render/voxel-character.ts, src/systems/npc-movement-system.ts
 */

import { Container, Graphics } from 'pixi.js';
import { shadeColor } from './voxel';

export type Character3DRole =
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'receptionist'
  | 'tech'
  | 'janitor'
  | 'manager'
  | 'patient';

export type AnimationState = 'IDLE' | 'WALKING' | 'WORKING';

export interface Character3DConfig {
  role: Character3DRole;
  gender: 'female' | 'male';
  skinToneIndex?: number;
  hairColorIndex?: number;
  /** 0 curto, 1 raspado, 2 boné, 3 cacheado/black power (mulheres mantêm o cabelo longo nas laterais). */
  hairStyleIndex?: number;
  /** Cor da roupa (antes vinha do tom de pele, e todo mundo com a mesma pele usava a mesma roupa). */
  clothesColorIndex?: number;
  pantsColorIndex?: number;
  patienceRatio?: number;
  inSpecializedRoom?: 'surgery' | 'icu' | 'normal';
  patientAgeGroup?: 'child' | 'adult' | 'elderly';
  severity?: 'green' | 'yellow' | 'red';
}

const SKIN_TONES = [0xffdfc4, 0xf0c8a0, 0xd4a373, 0xaa724b, 0x8c5332, 0x5a3825];
const HAIR_COLORS = [0x1e293b, 0x451a03, 0xb45309, 0xf59e0b, 0x94a3b8, 0x334155, 0x9a3412, 0xe5e7eb];
const CASUAL_CLOTHES = [0x3b82f6, 0xef4444, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899, 0x14b8a6, 0xf97316, 0x84cc16, 0xe11d48, 0x0ea5e9, 0xfafafa];
const CASUAL_PANTS = [0x1e293b, 0x1d4ed8, 0x78716c, 0x0f172a, 0xa16207];
const CAP_COLORS = [0xdc2626, 0x2563eb, 0x16a34a, 0xf59e0b];

export class Character3D {
  public container = new Container();
  private g = new Graphics();
  public config: Character3DConfig;
  public animState: AnimationState = 'IDLE';
  public facing: 'left' | 'right' = 'right';

  constructor(config: Character3DConfig) {
    this.config = config;
    this.container.addChild(this.g);
  }

  public update(timeSec: number, animState: AnimationState = this.animState): void {
    this.animState = animState;
    this.g.clear();

    const skin = SKIN_TONES[(this.config.skinToneIndex ?? 0) % SKIN_TONES.length]!;
    const hair = HAIR_COLORS[(this.config.hairColorIndex ?? 0) % HAIR_COLORS.length]!;
    const isWalking = animState === 'WALKING';
    const isWorking = animState === 'WORKING';

    // Fatores de escala por faixa etária
    const scaleY = this.config.patientAgeGroup === 'child' ? 0.75 : 1.0;
    const isElderly = this.config.patientAgeGroup === 'elderly';

    // Dinâmica de caminhada e respiração
    const walkSpeed = 9;
    const swing = isWalking ? Math.sin(timeSec * walkSpeed) : 0;
    const bob = isWalking ? Math.abs(Math.sin(timeSec * walkSpeed)) * 2 : 0;
    const breath = animState === 'IDLE' ? Math.sin(timeSec * 2.4) * 0.5 : 0;
    const postureSlump = isElderly || this.config.severity === 'red' ? 2 : 0;

    // Sombra de oclusão no piso
    this.g.ellipse(0, 10, 8.5, 4).fill({ color: 0x0f172a, alpha: 0.28 });

    // Pernas / Cápsulas 3D
    this.drawLegs(swing, isWalking, scaleY);

    // Tronco Cilíndrico 3D com Ambient Occlusion e Roupas
    const torsoY = (-6 - bob + breath + postureSlump) * scaleY;
    this.drawCylindricalTorso(torsoY, skin, isElderly);

    // Braços e Acessórios Profissionais (estetoscópio, prancheta, mop, etc.)
    this.drawArmsAndEquipment(torsoY, skin, swing, isWalking, isWorking, timeSec);

    // Cabeça Esférica 3D Arredondada
    const headY = torsoY - 8.5 * scaleY;
    this.drawSphericalHead(headY, skin, hair, timeSec);
  }

  private drawLegs(swing: number, isWalking: boolean, scaleY: number): void {
    const pantsColor = this.getPantsColor();
    const legYLeft = (2 + (isWalking ? swing * 2 : 0)) * scaleY;
    const legYRight = (2 - (isWalking ? swing * 2 : 0)) * scaleY;

    // Perna esquerda (cápsula 3D sombreada)
    this.drawCapsule3D(-3.8, legYLeft, 3.2, 7.5 * scaleY, pantsColor);
    // Perna direita
    this.drawCapsule3D(0.6, legYRight, 3.2, 7.5 * scaleY, pantsColor);

    // Sapatos com brilho
    this.g.roundRect(-4.2, legYLeft + 6 * scaleY, 3.8, 2.5, 1).fill({ color: 0x0f172a });
    this.g.roundRect(0.2, legYRight + 6 * scaleY, 3.8, 2.5, 1).fill({ color: 0x0f172a });
  }

  private drawCapsule3D(x: number, y: number, w: number, h: number, baseColor: number): void {
    const highlight = shadeColor(baseColor, 1.25);
    const shadow = shadeColor(baseColor, 0.72);

    // Face base com cantos arredondados
    this.g.roundRect(x, y, w, h, 1.5).fill({ color: baseColor });
    // Destaque de luz vertical (lado esquerdo)
    this.g.rect(x + 0.3, y + 0.8, w * 0.35, h - 1.6).fill({ color: highlight, alpha: 0.6 });
    // Sombreamento lateral direito
    this.g.rect(x + w * 0.7, y + 0.8, w * 0.3, h - 1.6).fill({ color: shadow, alpha: 0.65 });
  }

  private drawCylindricalTorso(y: number, skin: number, isElderly: boolean): void {
    const w = 9.5;
    const h = 8.5;
    const x = -w / 2;

    // Oclusão de contato inferior
    this.g.ellipse(0, y + h, w * 0.45, 1.8).fill({ color: 0x020617, alpha: 0.3 });

    // Renderizar vestimenta específica do papel
    switch (this.config.role) {
      case 'doctor':
        this.drawDoctorTorso(x, y, w, h);
        break;
      case 'nurse':
      case 'tech':
        this.drawNurseOrTechTorso(x, y, w, h);
        break;
      case 'pharmacist':
        this.drawPharmacistTorso(x, y, w, h);
        break;
      case 'janitor':
        this.drawJanitorTorso(x, y, w, h);
        break;
      case 'manager':
      case 'receptionist':
        this.drawAdministrativeTorso(x, y, w, h);
        break;
      default:
        this.drawPatientTorso(x, y, w, h, skin, isElderly);
    }
  }

  private drawDoctorTorso(x: number, y: number, w: number, h: number): void {
    this.drawCapsule3D(x, y, w, h, 0xf8fafc); // Jaleco branco 3D
    // Camisa clínica interna azul claro
    this.g.rect(x + 3, y + 1.2, 3.5, h - 1.5).fill({ color: 0x38bdf8 });
    // Gola 3D em V do jaleco
    this.g.poly([x + 1.5, y, x + 3.2, y + 3.5, x + 3.2, y]).fill({ color: 0xe2e8f0 });
    this.g.poly([x + w - 1.5, y, x + w - 3.2, y + 3.5, x + w - 3.2, y]).fill({ color: 0xe2e8f0 });
    // Estetoscópio metálico no pescoço (formas fechadas preenchidas sem stroke)
    this.g.roundRect(-2.2, y + 2.2, 1.2, 3.2, 0.6).fill({ color: 0x64748b });
    this.g.roundRect(1.0, y + 2.2, 1.2, 3.2, 0.6).fill({ color: 0x64748b });
    this.g.roundRect(-1.4, y + 4.8, 2.8, 1.1, 0.5).fill({ color: 0x64748b });
    this.g.circle(1.6, y + 5.4, 1.2).fill({ color: 0x94a3b8 }); // Diafragma metálico
  }

  private drawNurseOrTechTorso(x: number, y: number, w: number, h: number): void {
    const isTech = this.config.role === 'tech';
    const scrubColor = isTech ? 0x0284c7 : 0x0d9488;
    this.drawCapsule3D(x, y, w, h, scrubColor);
    // Gola em V do scrub
    this.g.poly([x + 3, y, x + 4.75, y + 2.5, x + 6.5, y]).fill({ color: 0xffffff, alpha: 0.35 });
    // Crachá hospitalar pendurado
    this.g.rect(x + 2, y + 3, 2.5, 3.2).fill({ color: 0xffffff });
    this.g.rect(x + 2.3, y + 4.2, 1.9, 1.2).fill({ color: isTech ? 0x0284c7 : 0x0d9488 });
  }

  private drawPharmacistTorso(x: number, y: number, w: number, h: number): void {
    this.drawCapsule3D(x, y, w, h, 0xf1f5f9);
    this.g.rect(x + 3.2, y + 1, 3.2, h - 2).fill({ color: 0x2563eb }); // Gravata / camisa
    this.g.roundRect(x + 1.6, y + 4.3, 2.4, 2.7, 0.4).fill({ color: 0xe2e8f0 }); // Bolso do jaleco
    this.g.roundRect(x + 1.8, y + 4.5, 2.0, 2.3, 0.4).fill({ color: 0xf8fafc });
    this.g.rect(x + 2.3, y + 3.8, 0.8, 1.5).fill({ color: 0xef4444 }); // Caneta vermelha
  }

  private drawJanitorTorso(x: number, y: number, w: number, h: number): void {
    this.drawCapsule3D(x, y, w, h, 0x334155);
    // Faixa reflexiva verde no peito
    this.g.rect(x + 1, y + 3, w - 2, 2).fill({ color: 0x22c55e });
  }

  private drawAdministrativeTorso(x: number, y: number, w: number, h: number): void {
    const isManager = this.config.role === 'manager';
    const suitColor = isManager ? 0x0f172a : 0xd97706;
    this.drawCapsule3D(x, y, w, h, suitColor);
    this.g.poly([x + 3.5, y, x + 4.75, y + 3, x + 6, y]).fill({ color: 0xffffff }); // Camisa social
    if (isManager) {
      this.g.rect(x + 4.2, y + 2, 1.2, 4.5).fill({ color: 0xdc2626 }); // Gravata vermelha
    }
  }

  private drawPatientTorso(x: number, y: number, w: number, h: number, _skin: number, isElderly: boolean): void {
    const shirtColor = isElderly
      ? 0x64748b
      : CASUAL_CLOTHES[(this.config.clothesColorIndex ?? this.config.skinToneIndex ?? 0) % CASUAL_CLOTHES.length]!;
    this.drawCapsule3D(x, y, w, h, shirtColor);
  }

  private drawArmsAndEquipment(
    torsoY: number, skin: number, swing: number, isWalking: boolean, isWorking: boolean, timeSec: number,
  ): void {
    const armW = 2.8;
    const armH = 7.2;
    const leftArmOffset = isWalking ? -swing * 3 : (isWorking ? Math.sin(timeSec * 6) * 3 : 0);
    const rightArmOffset = isWalking ? swing * 3 : (isWorking ? -Math.sin(timeSec * 6) * 3 : 0);
    const sleeveColor = this.getSleeveColor();

    // Braço esquerdo
    this.drawCapsule3D(-7.5, torsoY + 1 + leftArmOffset, armW, armH, sleeveColor);
    this.g.circle(-6.1, torsoY + 1 + armH + leftArmOffset, 1.5).fill({ color: skin });

    // Braço direito
    this.drawCapsule3D(4.8, torsoY + 1 + rightArmOffset, armW, armH, sleeveColor);
    this.g.circle(6.2, torsoY + 1 + armH + rightArmOffset, 1.5).fill({ color: skin });

    // Acessórios e Itens nas mãos
    this.drawHeldItems(torsoY, rightArmOffset);
  }

  private drawHeldItems(torsoY: number, rightArmOffset: number): void {
    if (this.config.role === 'doctor') {
      // Tablet / Prancheta médica
      this.g.roundRect(5.5, torsoY + 4 + rightArmOffset, 4.5, 6, 1).fill({ color: 0x0f172a });
      this.g.rect(6.2, torsoY + 5 + rightArmOffset, 3.1, 4).fill({ color: 0x38bdf8, alpha: 0.85 });
    } else if (this.config.role === 'janitor') {
      // Cabo do mop e esfregão
      this.g.rect(-9.5, torsoY - 8, 1.5, 22).fill({ color: 0xb45309 });
      this.g.ellipse(-8.8, torsoY + 13, 3.5, 2.5).fill({ color: 0xfacc15 });
    } else if (this.config.role === 'pharmacist' && this.animState === 'WORKING') {
      // Caixa de medicamento 3D RENAME
      this.g.roundRect(5.5, torsoY + 4 + rightArmOffset, 5, 3.5, 1).fill({ color: 0xef4444 });
      this.g.rect(6.5, torsoY + 5 + rightArmOffset, 3, 1).fill({ color: 0xffffff });
      // Bengala de apoio (formas fechadas preenchidas sem stroke)
      this.g.roundRect(7.5, torsoY + 3, 1.5, 14, 0.5).fill({ color: 0x78350f });
      this.g.roundRect(7.0, torsoY + 1.2, 3.2, 1.8, 0.8).fill({ color: 0x78350f });
      this.g.roundRect(9.0, torsoY + 1.8, 1.2, 2.4, 0.6).fill({ color: 0x78350f });
    }
  }

  private drawSphericalHead(y: number, skin: number, hair: number, timeSec: number): void {
    const r = 4.8;
    // Oclusão de contato entre cabeça e pescoço
    this.g.ellipse(0, y + r, 4, 1.5).fill({ color: 0x0f172a, alpha: 0.32 });

    // Esfera 3D da cabeça com luz especular
    this.g.circle(0, y, r).fill({ color: skin });
    this.g.ellipse(-1.2, y - 1.5, 2.2, 1.6).fill({ color: shadeColor(skin, 1.3), alpha: 0.45 });

    this.drawHairStyle(y, r, hair);
    if (this.config.gender === 'female') {
      this.g.roundRect(-r - 0.8, y - 1, 1.8, 6.5, 1).fill({ color: hair });
      this.g.roundRect(r - 1.0, y - 1, 1.8, 6.5, 1).fill({ color: hair });
    }

    // Olhos Expressivos com Catchlight
    this.drawEyes(y, timeSec);

    // Máscara Cirúrgica se em sala estéril
    if (this.config.inSpecializedRoom === 'surgery' || this.config.inSpecializedRoom === 'icu') {
      this.g.roundRect(-3.5, y + 1, 7, 3.8, 1.5).fill({ color: 0x93c5fd });
      this.g.rect(-3.2, y + 2, 6.4, 0.8).fill({ color: 0x60a5fa, alpha: 0.6 });
    }
  }

  /** Estilos de cabelo para dar variedade aos moradores e pacientes. */
  private drawHairStyle(y: number, r: number, hair: number): void {
    const style = (this.config.hairStyleIndex ?? 0) % 4;
    if (style === 1) {
      this.g.ellipse(0, y - r * 0.6, r * 0.9, r * 0.45).fill({ color: hair, alpha: 0.55 });
      return;
    }
    if (style === 2) {
      const cap = CAP_COLORS[(this.config.clothesColorIndex ?? 0) % CAP_COLORS.length]!;
      this.g.ellipse(0, y - r * 0.5, r + 0.6, r * 0.75).fill({ color: cap });
      const visor = this.facing === 'left' ? -1 : 1;
      this.g.roundRect(visor > 0 ? 1 : -r - 2.5, y - r * 0.35, r + 1.5, 1.8, 0.8).fill({ color: shadeColor(cap, 0.75) });
      return;
    }
    if (style === 3) {
      this.g.circle(0, y - r * 0.55, r + 1.8).fill({ color: hair });
      this.g.circle(-r * 0.6, y - r * 0.9, r * 0.6).fill({ color: shadeColor(hair, 1.15) });
      return;
    }
    this.g.ellipse(0, y - r * 0.45, r + 0.6, r * 0.8).fill({ color: hair });
    this.g.ellipse(0, y - r * 0.7, r * 0.85, 2.4).fill({ color: hair });
  }

  private drawEyes(y: number, timeSec: number): void {
    const eyeOffsetX = this.facing === 'left' ? -0.8 : 0.8;
    const isBlinking = Math.floor(timeSec * 2.5) % 12 === 0;

    if (isBlinking) {
      // Olho fechado preenchido suave
      this.g.roundRect(-2.8 + eyeOffsetX, y + 0.8, 2.2, 0.8, 0.4).fill({ color: 0x0f172a });
      this.g.roundRect(1.2 + eyeOffsetX, y + 0.8, 2.2, 0.8, 0.4).fill({ color: 0x0f172a });
      return;
    }

    // Olhos abertos com brilho (catchlight)
    this.g.ellipse(-2 + eyeOffsetX, y + 0.5, 1.2, 1.6).fill({ color: 0x0f172a });
    this.g.ellipse(2 + eyeOffsetX, y + 0.5, 1.2, 1.6).fill({ color: 0x0f172a });
    // Catchlight branco especular
    this.g.circle(-2.4 + eyeOffsetX, y - 0.2, 0.55).fill({ color: 0xffffff });
    this.g.circle(1.6 + eyeOffsetX, y - 0.2, 0.55).fill({ color: 0xffffff });

    // Sobrancelhas expressivas
    const browTilt = this.config.patienceRatio !== undefined && this.config.patienceRatio < 0.4 ? 0.6 : 0;
    this.g.rect(-3 + eyeOffsetX, y - 2 + browTilt, 2.2, 0.7).fill({ color: 0x334155 });
    this.g.rect(1 + eyeOffsetX, y - 2 - browTilt, 2.2, 0.7).fill({ color: 0x334155 });
  }

  private getPantsColor(): number {
    switch (this.config.role) {
      case 'nurse': return 0x0f766e;
      case 'doctor': return 0x0284c7;
      case 'tech': return 0x1e3a8a;
      case 'janitor': return 0x334155;
      case 'manager': return 0x020617;
      default: return CASUAL_PANTS[(this.config.pantsColorIndex ?? 0) % CASUAL_PANTS.length]!;
    }
  }

  private getSleeveColor(): number {
    switch (this.config.role) {
      case 'doctor': return 0xf8fafc;
      case 'nurse': return 0x0d9488;
      case 'tech': return 0x0284c7;
      case 'janitor': return 0x334155;
      case 'manager': return 0x0f172a;
      case 'pharmacist': return 0xf1f5f9;
      case 'receptionist': return 0xd97706;
      default: return CASUAL_CLOTHES[(this.config.clothesColorIndex ?? this.config.skinToneIndex ?? 0) % CASUAL_CLOTHES.length]!;
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
