/**
 * Arquivo: src/render/city-environment.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a vizinhança urbana completa ao redor do lote do hospital em estilo 2.5D/3D (CityRT / Two Point):
 * - Frente (Sul): Avenida movimentada, calçada frontal, semáforos, baia do SAMU e quarteirão oposto com Cafeteria,
 *   Farmácia Comunitária, Edifícios com janelas iluminadas, Ponto de Táxi e canteiros.
 * - Esquerda (Oeste): Estacionamento asfaltado do hospital com vagas PCD/médicos, guarita com cancela e carros Voxel.
 * - Direita (Leste): Jardim terapêutico com pergolado, bancos, chafariz animado, canteiros floridos e ciclovia vermelha.
 * - Fundo (Norte): Parque municipal arborizado com bosque de árvores Voxel e pista de cooper que recua dinamicamente.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 21, enriquecendo os 4 lados do hospital com estética vibrante sem assets externos pesados,
 * adaptando-se proceduralmente a qualquer tamanho do terreno (12x12, 16x16, 20x20, 24x24).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O método updateGridSize(gridSize) reconstrói a malha estática urbana quando o mapa expande.
 * O método update(alertActive, timeMs) anima o giroflex do SAMU e o chafariz da praça.
 *
 * Importa: pixi.js, src/render/theme-config.ts, src/render/voxel.ts
 * Conecta-se com: src/render/renderer.ts, src/systems/urban-life-system.ts, src/systems/map-expansion-system.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import { THEME } from './theme-config';
import { drawBlock, drawBlockCentered, drawShadow } from './voxel';

const WORLD_EXTENT = 2400;

export const LAMP_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 120, y: 550 },
  { x: 260, y: 550 },
  { x: 400, y: 550 },
  { x: -60, y: 550 },
  { x: 540, y: 550 },
];

export class CityEnvironment {
  public container = new Container();
  private staticLayer = new Graphics();
  private animatedLayer = new Graphics();
  private labelsContainer = new Container();

  private currentGridSize = 12;
  private lastAlert: boolean | null = null;
  private ambulancePos = { x: -80, y: 560 };

  constructor(initialGridSize = 12) {
    this.currentGridSize = initialGridSize;
    this.container.addChild(this.staticLayer);
    this.container.addChild(this.animatedLayer);
    this.container.addChild(this.labelsContainer);
    this.rebuildEnvironment(this.currentGridSize);
  }

  public updateGridSize(newGridSize: number): void {
    if (this.currentGridSize === newGridSize) return;
    this.currentGridSize = newGridSize;
    this.rebuildEnvironment(newGridSize);
  }

  public getGridSize(): number {
    return this.currentGridSize;
  }

  private rebuildEnvironment(gridSize: number): void {
    this.staticLayer.clear();
    for (const label of this.labelsContainer.removeChildren()) label.destroy();

    const tileSize = THEME.tileSize;
    const gridW = gridSize * tileSize;
    const gridH = gridSize * tileSize;

    const sidewalkY = gridH + 16;
    const sidewalkH = 36;
    const avenueY = sidewalkY + sidewalkH + 4;
    const avenueH = 100;
    const oppositeSidewalkY = avenueY + avenueH + 4;

    this.ambulancePos = { x: -80, y: sidewalkY + 20 };

    this.drawWorldGround(gridW, gridH);
    this.drawNorthPark(gridW);
    this.drawWestParking(gridH);
    this.drawEastGarden(gridW, gridH);
    this.drawFrontStreet(gridW, sidewalkY, sidewalkH, avenueY, avenueH, oppositeSidewalkY);
    this.drawOppositeNeighborhood(gridW, oppositeSidewalkY);
  }

  private drawWorldGround(gridW: number, gridH: number): void {
    const g = this.staticLayer;
    // Gramado verde natural ao redor do mundo
    g.rect(-WORLD_EXTENT, -WORLD_EXTENT, gridW + WORLD_EXTENT * 2, gridH + WORLD_EXTENT * 2).fill({ color: 0x86c96b });
    // Textura sutil de grama
    for (let i = 0; i < 280; i++) {
      const x = ((i * 137) % (gridW + 800)) - 400;
      const y = ((i * 251) % (gridH + 800)) - 300;
      g.circle(x, y, 2 + (i % 3)).fill({ color: i % 2 === 0 ? 0x7dbf61 : 0x93d277, alpha: 0.65 });
    }
  }

  private drawNorthPark(gridW: number): void {
    const g = this.staticLayer;
    // Parque Municipal Traseiro (atrás de y = 0)
    g.rect(-100, -220, gridW + 200, 210).fill({ color: 0x65a30d, alpha: 0.35 });
    // Pista de Cooper de terra batida contornando o parque
    g.roundRect(-80, -200, gridW + 160, 180, 24).stroke({ color: 0xd97706, width: 8, alpha: 0.45 });

    // Quiosque de madeira central
    const kx = gridW / 2;
    const ky = -110;
    drawBlockCentered(g, kx, ky, 44, 44, 8, 0x78350f, false);
    drawBlockCentered(g, kx, ky - 8, 52, 52, 12, 0xb45309, false);

    // Bosque de árvores Voxel no parque norte
    const treeOffsets: Array<[number, number]> = [
      [30, -160], [110, -140], [220, -170], [330, -150], [gridW - 50, -165],
      [-50, -100], [gridW + 40, -100], [70, -60], [gridW - 80, -60],
    ];
    for (const [tx, ty] of treeOffsets) {
      if (tx >= -80 && tx <= gridW + 80) {
        this.drawVoxelTree(g, tx, ty, 1.0);
      }
    }
  }

  private drawWestParking(gridH: number): void {
    const g = this.staticLayer;
    const parkX = -240;
    const parkW = 210;
    const parkH = Math.max(380, gridH - 40);

    // Pátio asfaltado do estacionamento
    g.roundRect(parkX, 20, parkW, parkH, 12).fill({ color: 0x334155 });
    g.roundRect(parkX + 4, 24, parkW - 8, parkH - 8, 8).stroke({ color: 0x64748b, width: 2 });

    // Vagas demarcadas
    for (let y = 50; y < parkH - 40; y += 42) {
      // Linha branca divisória
      g.rect(parkX + 16, y, 70, 3).fill({ color: 0xf8fafc, alpha: 0.85 });
      g.rect(parkX + 120, y, 70, 3).fill({ color: 0xf8fafc, alpha: 0.85 });
    }

    // Demarcação azul PCD na primeira vaga
    g.rect(parkX + 22, 56, 32, 28).fill({ color: 0x0284c7, alpha: 0.9 });

    // Carros Voxel estacionados
    const carColors = [0x2563eb, 0xdc2626, 0x475569, 0x16a34a, 0xf8fafc];
    for (let i = 0; i < 4; i++) {
      const cy = 68 + i * 84;
      if (cy + 40 < parkH) {
        const color = carColors[i % carColors.length] ?? 0x2563eb;
        drawBlockCentered(g, parkX + 50, cy, 32, 54, 14, color, false);
      }
    }

    // Guarita com cancela
    const gx = parkX + parkW - 30;
    const gy = parkH - 20;
    drawBlockCentered(g, gx, gy, 28, 28, 20, 0x475569, false);
    g.rect(gx - 35, gy - 2, 35, 4).fill({ color: 0xef4444 }); // Cancela
  }

  private drawEastGarden(gridW: number, gridH: number): void {
    const g = this.staticLayer;
    const gardenX = gridW + 24;
    const gardenW = 220;
    const gardenH = Math.max(380, gridH - 40);

    // Gramado tratado do jardim
    g.roundRect(gardenX, 20, gardenW, gardenH, 14).fill({ color: 0x4ade80, alpha: 0.4 });

    // Caminho sinuoso de pedra
    g.moveTo(gardenX + 40, 30).bezierCurveTo(gardenX + 120, 120, gardenX + 30, 240, gardenX + 110, gardenH)
      .stroke({ color: 0xd6d3d1, width: 22 });

    // Pergolado de madeira
    const px = gardenX + 110;
    const py = 70;
    drawBlockCentered(g, px, py, 60, 40, 18, 0x78350f, false);
    g.rect(px - 32, py - 20, 64, 40).stroke({ color: 0x15803d, width: 4 }); // Trepadeiras

    // Bancos de madeira
    this.drawBench(g, gardenX + 45, 140);
    this.drawBench(g, gardenX + 130, 220);

    // Chafariz / Fonte de pedra circular
    const fx = gardenX + 80;
    const fy = 290;
    g.circle(fx, fy, 28).fill({ color: 0x94a3b8 });
    g.circle(fx, fy, 24).fill({ color: 0x38bdf8 });

    this.drawGardenFlora(g, gardenX, gardenW, gardenH);

    // Ciclovia vermelha lateral
    const bikeX = gardenX + gardenW - 32;
    g.rect(bikeX, 20, 26, gardenH).fill({ color: 0xb91c1c, alpha: 0.85 });
    g.rect(bikeX + 11, 20, 4, gardenH).fill({ color: 0xfef2f2, alpha: 0.8 });
  }

  private drawGardenFlora(g: Graphics, gardenX: number, gardenW: number, gardenH: number): void {
    const flowerColors = [0xf43f5e, 0xfacc15, 0xec4899, 0xa855f7, 0x38bdf8];
    for (let i = 0; i < 18; i++) {
      const flX = gardenX + 30 + ((i * 37) % (gardenW - 70));
      const flY = 50 + ((i * 43) % (gardenH - 90));
      const flColor = flowerColors[i % flowerColors.length] ?? 0xf43f5e;
      g.circle(flX, flY, 3.2).fill({ color: flColor });
      g.circle(flX, flY, 1.2).fill({ color: 0xffffff, alpha: 0.8 });
    }

    for (let b = 0; b < 4; b++) {
      const bX = gardenX + 45 + b * 38;
      const bY = 90 + b * 55;
      g.ellipse(bX - 2, bY - 2, 2.5, 1.5).fill({ color: 0x38bdf8, alpha: 0.85 });
      g.ellipse(bX + 2, bY - 2, 2.5, 1.5).fill({ color: 0x38bdf8, alpha: 0.85 });
    }
  }

  private drawSidewalkProps(g: Graphics, gridW: number, sidewalkY: number): void {
    // Hidrantes vermelhos 3D na calçada
    drawBlock(g, -35, sidewalkY + 8, 8, 8, 14, 0xef4444, false);
    g.circle(-31, sidewalkY + 8, 4).fill({ color: 0xdc2626 });
    drawBlock(g, gridW + 35, sidewalkY + 8, 8, 8, 14, 0xef4444, false);
    g.circle(gridW + 39, sidewalkY + 8, 4).fill({ color: 0xdc2626 });

    // Lixeiras de coleta seletiva (Verde, Azul, Amarela)
    drawBlock(g, 65, sidewalkY + 10, 6, 6, 11, 0x22c55e, false);
    drawBlock(g, 74, sidewalkY + 10, 6, 6, 11, 0x3b82f6, false);
    drawBlock(g, 83, sidewalkY + 10, 6, 6, 11, 0xfacc15, false);

    // Placa de Trânsito PARE (Stop) 3D
    drawBlock(g, -12, sidewalkY + 2, 4, 4, 28, 0x64748b, false);
    g.poly([-16, sidewalkY - 26, -8, sidewalkY - 26, -4, sidewalkY - 22, -4, sidewalkY - 14, -8, sidewalkY - 10, -16, sidewalkY - 10, -20, sidewalkY - 14, -20, sidewalkY - 22]).fill({ color: 0xdc2626 });
    g.rect(-14, sidewalkY - 19, 8, 2).fill({ color: 0xffffff });

    // Placa de Trânsito HOSPITAL 🏥 3D
    const signX = gridW / 2 + 75;
    drawBlock(g, signX, sidewalkY + 2, 4, 4, 30, 0x64748b, false);
    drawBlock(g, signX - 6, sidewalkY - 24, 16, 4, 16, 0x2563eb, false);
    g.rect(signX + 1, sidewalkY - 22, 2, 10).fill({ color: 0xffffff });
    g.rect(signX - 3, sidewalkY - 18, 10, 2).fill({ color: 0xffffff });
  }

  private drawFrontStreet(
    gridW: number,
    sidewalkY: number,
    sidewalkH: number,
    avenueY: number,
    avenueH: number,
    oppositeSidewalkY: number
  ): void {
    const g = this.staticLayer;
    const streetX0 = -WORLD_EXTENT;
    const streetX1 = gridW + WORLD_EXTENT;

    g.rect(streetX0, sidewalkY, streetX1 - streetX0, sidewalkH).fill({ color: 0xe2e8f0 });
    for (let x = -300; x < gridW + 300; x += 30) {
      g.moveTo(x, sidewalkY).lineTo(x, sidewalkY + sidewalkH).stroke({ color: 0xcbd5e1, width: 1.5 });
    }
    drawBlock(g, streetX0, sidewalkY + sidewalkH, streetX1 - streetX0, 4, 3, 0x94a3b8, false);

    this.drawSidewalkProps(g, gridW, sidewalkY);

    // Baia de ambulância do SAMU
    const bayX = -130;
    const bayW = 100;
    g.rect(bayX, sidewalkY - 8, bayW, sidewalkH + 12).fill({ color: 0x64748b });
    g.rect(bayX + 4, sidewalkY - 4, bayW - 8, sidewalkH + 4).stroke({ color: 0xfacc15, width: 2.5 });
    this.drawAmbulanceBody(g, this.ambulancePos.x, this.ambulancePos.y);

    this.drawAvenueRoad(g, streetX0, streetX1, avenueY, avenueH, gridW);
    this.drawCrosswalkAndSignal(g, gridW / 2 - 20, sidewalkY, avenueY, avenueH);

    g.rect(streetX0, oppositeSidewalkY, streetX1 - streetX0, 44).fill({ color: 0xe2e8f0 });
  }

  private drawAvenueRoad(g: Graphics, x0: number, x1: number, avenueY: number, avenueH: number, gridW: number): void {
    g.rect(x0, avenueY, x1 - x0, avenueH).fill({ color: 0x1e293b });
    const midY = avenueY + avenueH / 2;
    for (let x = -600; x < gridW + 600; x += 44) {
      g.rect(x, midY - 2, 24, 4).fill({ color: 0xfacc15 });
    }
  }

  private drawCrosswalkAndSignal(g: Graphics, crossX: number, sidewalkY: number, avenueY: number, avenueH: number): void {
    for (let i = 0; i < 9; i++) {
      g.rect(crossX - 36 + i * 9, avenueY + 8, 6, avenueH - 16).fill({ color: 0xf8fafc, alpha: 0.95 });
    }
    drawBlock(g, crossX + 60, sidewalkY + 2, 8, 8, 36, 0x334155, false);
    g.circle(crossX + 64, sidewalkY + 8, 3).fill({ color: 0xef4444 });
    g.circle(crossX + 64, sidewalkY + 15, 3).fill({ color: 0x22c55e });
  }

  private drawOppositeShops(g: Graphics, cafeX: number, pharmX: number, baseY: number): void {
    // 1. Cafeteria / Bistrô 2.5D com mesinhas e guarda-sóis coloridos
    drawBlock(g, cafeX, baseY, 84, 56, 44, 0xd97706, false);
    g.rect(cafeX - 4, baseY + 46, 92, 14).fill({ color: 0xb91c1c });
    for (let i = 0; i < 5; i++) {
      g.rect(cafeX + i * 18, baseY + 46, 9, 14).fill({ color: 0xfef08a });
    }
    // Mesinhas e guarda-sóis na calçada
    g.circle(cafeX + 20, baseY + 70, 7).fill({ color: 0x475569 });
    g.circle(cafeX + 20, baseY + 70, 14).fill({ color: 0x38bdf8, alpha: 0.85 });
    g.circle(cafeX + 64, baseY + 70, 7).fill({ color: 0x475569 });
    g.circle(cafeX + 64, baseY + 70, 14).fill({ color: 0xfacc15, alpha: 0.85 });

    // 2. Farmácia Comunitária / Posto de Apoio SUS
    drawBlock(g, pharmX, baseY, 78, 54, 40, 0x0284c7, false);
    g.rect(pharmX + 34, baseY + 18, 10, 22).fill({ color: 0x22c55e });
    g.rect(pharmX + 28, baseY + 24, 22, 10).fill({ color: 0x22c55e });
  }

  private drawOppositeBuildings(g: Graphics, bldg1X: number, bldg2X: number, taxiX: number, baseY: number, oppY: number): void {
    drawBlock(g, bldg1X, baseY, 90, 60, 68, 0x64748b, false);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        g.rect(bldg1X + 14 + c * 24, baseY + 8 + r * 16, 12, 10).fill({ color: 0xfef08a });
      }
    }
    drawBlock(g, bldg2X, baseY, 80, 56, 52, 0x475569, false);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        g.rect(bldg2X + 16 + c * 28, baseY + 10 + r * 18, 14, 12).fill({ color: 0xfef08a });
      }
    }
    // Ponto de Táxi
    g.rect(taxiX, oppY + 4, 60, 24).fill({ color: 0xfacc15, alpha: 0.35 });
    g.rect(taxiX + 4, oppY + 6, 52, 20).stroke({ color: 0xfacc15, width: 1.5 });
    drawBlockCentered(g, taxiX + 30, oppY + 16, 26, 44, 12, 0xfacc15, false);
  }

  private drawOppositeNeighborhood(gridW: number, oppositeY: number): void {
    const g = this.staticLayer;
    const baseY = oppositeY + 14;
    const cafeX = gridW / 2 - 160;
    const pharmX = gridW / 2 - 50;
    const bldg1X = gridW / 2 + 50;
    const bldg2X = gridW / 2 + 160;
    const taxiX = cafeX - 90;

    this.drawOppositeShops(g, cafeX, pharmX, baseY);
    this.drawOppositeBuildings(g, bldg1X, bldg2X, taxiX, baseY, oppositeY);

    this.labelsContainer.addChild(
      this.createLabel('☕ Café & Lanches', cafeX + 42, baseY + 36, '#ffffff', 8),
      this.createLabel('💊 Farmácia Popular', pharmX + 39, baseY + 36, '#ffffff', 8),
      this.createLabel('🚕 Ponto de Táxi', taxiX + 30, oppositeY - 8, '#0f172a', 8),
      this.createLabel('🌳 Parque Municipal', gridW / 2, -180, '#ffffff', 10),
      this.createLabel('🅿️ Estacionamento SUS', -135, 12, '#ffffff', 9),
      this.createLabel('🌸 Jardim Terapêutico', gridW + 120, 12, '#ffffff', 9)
    );
  }

  private drawAmbulanceBody(g: Graphics, x: number, y: number): void {
    drawShadow(g, x - 18, y - 28, 36, 58, 4);
    drawBlockCentered(g, x, y, 32, 54, 18, 0xffffff, false);
    g.rect(x - 16, y - 14, 32, 5).fill({ color: 0xdc2626 });
    g.rect(x - 3, y - 38, 6, 14).fill({ color: 0xdc2626 });
    g.rect(x - 7, y - 34, 14, 6).fill({ color: 0xdc2626 });
  }

  private drawVoxelTree(g: Graphics, x: number, y: number, scale: number): void {
    g.ellipse(x + 4, y + 4, 16 * scale, 6 * scale).fill({ color: 0x14532d, alpha: 0.25 });
    drawBlockCentered(g, x, y, 5 * scale, 5 * scale, 12 * scale, 0x78350f, false);
    drawBlockCentered(g, x, y - 12 * scale, 26 * scale, 22 * scale, 12 * scale, 0x15803d, false);
    drawBlockCentered(g, x, y - 24 * scale, 16 * scale, 14 * scale, 9 * scale, 0x22c55e, false);
  }

  private drawBench(g: Graphics, x: number, y: number): void {
    drawBlockCentered(g, x, y, 26, 7, 5, 0xa16207);
    drawBlockCentered(g, x, y - 4, 26, 3, 7, 0x854d0e, false);
  }

  private createLabel(text: string, x: number, y: number, color: string, size: number): Text {
    return new Text({
      text,
      style: {
        fontFamily: THEME.fontFamily,
        fontSize: size,
        fill: color,
        fontWeight: 'bold',
        align: 'center',
      },
      anchor: 0.5,
      x,
      y,
      resolution: THEME.textResolution,
    });
  }

  public update(alertActive: boolean, timeMs: number): void {
    const g = this.animatedLayer;
    g.clear();

    // 1. Giroflex da ambulância SAMU
    if (alertActive || this.lastAlert !== false) {
      this.lastAlert = alertActive;
      const { x, y } = this.ambulancePos;
      const phase = Math.floor(timeMs / 220) % 2 === 0;
      const left = alertActive && phase ? 0xef4444 : 0x7f1d1d;
      const right = alertActive && !phase ? 0xffffff : 0x9ca3af;
      g.rect(x - 10, y - 46, 8, 4).fill({ color: left });
      g.rect(x + 2, y - 46, 8, 4).fill({ color: right });
      if (alertActive) {
        g.circle(x + (phase ? -6 : 6), y - 44, 22).fill({ color: phase ? 0xef4444 : 0xffffff, alpha: 0.22 });
      }
    }

    // 2. Animação da água do chafariz
    const fx = this.currentGridSize * THEME.tileSize + 104;
    const fy = 290;
    const pulse = 1 + Math.sin(timeMs / 300) * 0.15;
    g.circle(fx, fy, 8 * pulse).fill({ color: 0xbae6fd, alpha: 0.75 });
    g.circle(fx, fy, 4).fill({ color: 0xffffff, alpha: 0.9 });
  }
}
