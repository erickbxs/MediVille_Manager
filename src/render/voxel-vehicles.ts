/**
 * Arquivo: src/render/voxel-vehicles.ts
 *
 * 1. O que este arquivo faz?
 * Cria proceduralmente veículos urbanos 2.5D/3D (carros de passeio com cores variadas, ônibus municipal e ambulância
 * do SAMU com sirene e giroflex reativo) utilizando PIXI.Graphics, com sombras no asfalto, faróis sincronizados
 * com o ciclo diurno/noturno e animação de abertura de portas para desembarque de pacientes.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar vida e atmosfera de cidade ao redor do hospital SUS, cumprindo a Parte 2 do Prompt 11 sem dependências externas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novos modelos ou ajustar proporções volumétricas dos blocos, modifique os métodos de desenho interno.
 *
 * Importa: pixi.js, src/render/voxel.ts
 * Conecta-se com: src/systems/traffic-system.ts, src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import { drawBlockCentered, drawShadow } from './voxel';

export type VehicleType = 'car' | 'bus' | 'ambulance' | 'helicopter';
export type VehicleDirection = 'east' | 'west';

export interface VehicleRenderConfig {
  type: VehicleType;
  colorIndex?: number;
  direction: 'east' | 'west';
  isNight?: boolean;
  isSirenActive?: boolean;
  doorOpenFactor?: number; // 0 = fechada, 1 = aberta
}

const CAR_COLORS = [0x2563eb, 0xdc2626, 0xd1d5db, 0xeab308, 0xf8fafc, 0x334155];
const TIRES = 0x0f172a;
const GLASS = 0xbae6fd;
const HEADLIGHT_COLOR = 0xfef08a;
const TAILLIGHT_COLOR = 0xef4444;

export class VoxelVehicle {
  public container = new Container();
  private g = new Graphics();
  public config: VehicleRenderConfig;

  constructor(config: VehicleRenderConfig) {
    this.config = config;
    this.container.addChild(this.g);
    this.render();
  }

  public setConfig(config: Partial<VehicleRenderConfig>): void {
    Object.assign(this.config, config);
    this.render();
  }

  public render(timeSec = 0): void {
    this.g.clear();
    const isEast = this.config.direction === 'east';
    const mult = isEast ? 1 : -1;

    if (this.config.type === 'car') {
      this.drawCar(mult);
    } else if (this.config.type === 'bus') {
      this.drawBus(mult);
    } else if (this.config.type === 'ambulance') {
      this.drawAmbulance(mult, timeSec);
    } else {
      this.drawHelicopter(mult, timeSec);
    }
  }

  private drawCar(mult: number): void {
    const color = CAR_COLORS[(this.config.colorIndex ?? 0) % CAR_COLORS.length]!;
    drawShadow(this.g, -24, -12, 48, 24);

    // Rodas
    drawBlockCentered(this.g, -14 * mult, -10, 8, 3, 5, TIRES, false);
    drawBlockCentered(this.g, 14 * mult, -10, 8, 3, 5, TIRES, false);
    drawBlockCentered(this.g, -14 * mult, 10, 8, 3, 5, TIRES, false);
    drawBlockCentered(this.g, 14 * mult, 10, 8, 3, 5, TIRES, false);

    // Carroceria principal
    drawBlockCentered(this.g, 0, 0, 42, 18, 9, color);

    // Cabine/Teto
    drawBlockCentered(this.g, -2 * mult, 0, 22, 15, 8, color);
    // Para-brisa frontal e traseiro
    this.g.rect(10 * mult - (mult > 0 ? 3 : 0), -6, 3, 12).fill({ color: GLASS });
    this.g.rect(-13 * mult - (mult > 0 ? 0 : 3), -6, 3, 12).fill({ color: GLASS });

    // Faróis dianteiros e traseiros
    this.drawLights(21 * mult, -21 * mult, mult);

    // Efeito de porta aberta no drop-off
    if (this.config.doorOpenFactor && this.config.doorOpenFactor > 0) {
      const openOffset = this.config.doorOpenFactor * 5;
      this.g.rect(-2 * mult, -9 - openOffset, 10, 2).fill({ color });
    }
  }

  private drawBus(mult: number): void {
    drawShadow(this.g, -42, -14, 84, 28);

    // 6 rodas
    [-28, 0, 28].forEach((rx) => {
      drawBlockCentered(this.g, rx * mult, -12, 9, 3, 6, TIRES, false);
      drawBlockCentered(this.g, rx * mult, 12, 9, 3, 6, TIRES, false);
    });

    // Carroceria
    drawBlockCentered(this.g, 0, 0, 78, 22, 18, 0xf8fafc);
    this.g.rect(-38, 2, 76, 4).fill({ color: 0x0284c7 });

    // Janelas
    for (let i = 0; i < 5; i++) {
      this.g.rect(-32 + i * 14, -14, 10, 6).fill({ color: GLASS });
    }

    // Para-brisa frontal do ônibus
    this.g.rect(38 * mult - (mult > 0 ? 4 : 0), -15, 4, 16).fill({ color: GLASS });
    this.drawLights(39 * mult, -39 * mult, mult);
  }

  private drawAmbulance(mult: number, timeSec: number): void {
    drawShadow(this.g, -28, -13, 56, 26);

    [-16, 16].forEach((rx) => {
      drawBlockCentered(this.g, rx * mult, -11, 8, 3, 5, TIRES, false);
      drawBlockCentered(this.g, rx * mult, 11, 8, 3, 5, TIRES, false);
    });

    // Corpo da ambulância
    drawBlockCentered(this.g, 0, 0, 52, 20, 14, 0xffffff);
    // Faixa laranja e vermelha do SAMU
    this.g.rect(-25, 0, 50, 3).fill({ color: 0xf97316 });
    this.g.rect(-25, 3, 50, 2).fill({ color: 0xdc2626 });

    // Cruz do SAMU na lateral
    this.g.rect(-2, -5, 4, 10).fill({ color: 0xdc2626 });
    this.g.rect(-5, -2, 10, 4).fill({ color: 0xdc2626 });

    // Faróis
    this.drawLights(26 * mult, -26 * mult, mult);

    // Giroflex no teto
    const blink = Math.floor(timeSec * 8) % 2 === 0;
    const sirenColor = blink ? 0xef4444 : 0x38bdf8;
    drawBlockCentered(this.g, 2 * mult, 0, 6, 8, 4, sirenColor);

    if (this.config.isSirenActive) {
      this.g.circle(2 * mult, -18, 14).fill({ color: sirenColor, alpha: 0.25 });
    }
  }

  private drawHelicopter(mult: number, timeSec: number): void {
    drawShadow(this.g, -26, -14, 52, 28);

    // Esquis de pouso metálicos
    this.g.rect(-22, -12, 44, 2).fill({ color: 0x94a3b8 });
    this.g.rect(-22, 10, 44, 2).fill({ color: 0x94a3b8 });
    this.g.rect(-10, -12, 2, 24).fill({ color: 0x64748b });
    this.g.rect(10, -12, 2, 24).fill({ color: 0x64748b });

    // Fuselagem da cabine
    drawBlockCentered(this.g, 0, 0, 40, 22, 16, 0xffffff);
    this.g.rect(-18, 0, 36, 4).fill({ color: 0xf97316 });
    this.g.rect(-18, 4, 36, 2).fill({ color: 0xdc2626 });

    // Cauda aeromédica
    drawBlockCentered(this.g, -28 * mult, 0, 20, 6, 8, 0xffffff);
    drawBlockCentered(this.g, -38 * mult, 0, 6, 3, 14, 0xdc2626);

    // Cabine envidraçada
    this.g.rect(14 * mult - (mult > 0 ? 4 : 0), -8, 6, 16).fill({ color: GLASS });

    // Mastro e Rotor Principal animado
    drawBlockCentered(this.g, 2 * mult, 0, 4, 4, 18, 0x334155);
    const bladeAngle = timeSec * 25;
    const bladeLen = 32;
    const bx = 2 * mult;
    const by = -18;
    this.g.ellipse(bx, by, bladeLen, 3).stroke({ width: 1.5, color: 0x94a3b8, alpha: 0.7 });
    const cosA = Math.cos(bladeAngle) * bladeLen;
    const sinA = Math.sin(bladeAngle) * (bladeLen * 0.35);
    this.g.poly([bx - cosA, by - sinA, bx + cosA, by + sinA]).stroke({ width: 2.5, color: 0x0f172a });

    // Luz estroboscópica anticolisão
    const strobe = Math.floor(timeSec * 6) % 2 === 0;
    if (strobe) {
      this.g.circle(bx, by - 4, 2.5).fill({ color: 0xef4444 });
    }
  }

  private drawLights(frontX: number, rearX: number, mult: number): void {
    // Faróis dianteiros
    this.g.rect(frontX - (mult > 0 ? 2 : 0), -6, 2, 4).fill({ color: HEADLIGHT_COLOR });
    this.g.rect(frontX - (mult > 0 ? 2 : 0), 2, 2, 4).fill({ color: HEADLIGHT_COLOR });

    // Lanternas traseiras
    this.g.rect(rearX - (mult > 0 ? 0 : 2), -6, 2, 3).fill({ color: TAILLIGHT_COLOR });
    this.g.rect(rearX - (mult > 0 ? 0 : 2), 3, 2, 3).fill({ color: TAILLIGHT_COLOR });

    // Facho de luz à noite
    if (this.config.isNight) {
      this.g.poly([
        frontX, -5,
        frontX + 45 * mult, -14,
        frontX + 45 * mult, 14,
        frontX, 5,
      ]).fill({ color: 0xfef08a, alpha: 0.18 });
    }
  }
}
