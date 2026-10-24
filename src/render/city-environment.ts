/**
 * Arquivo: src/render/city-environment.ts
 *
 * 1. O que este arquivo faz?
 * Gera proceduralmente o lote urbano ao redor da grade 12x12 do hospital (estilo City Builder/CityRT):
 * gramado, avenida asfaltada com faixa de pedestres, meio-fio extrudado 2.5D, calçadas, baia de ambulância com
 * sinalização "AMBULÂNCIA / SUS", ambulância SAMU voxel (com giroflex piscando durante eventos de Acidentes ou
 * Surtos), árvores voxel, bancos de praça, postes de luz e ponto de ônibus.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar vida ao entorno do hospital sem nenhum asset externo (bundle < 2 MB). A camada estática é desenhada uma
 * única vez; apenas as luzes da ambulância são redesenhadas, e somente enquanto o alerta está ativo.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Posições estão nas constantes do topo (AMBULANCE_POS, TREE_POSITIONS, LAMP_POSITIONS...). O alerta é decidido
 * por isAmbulanceAlertActive() em environment-state.ts, a partir de state.activeEvents (alimentado pelo EventBus
 * via event-system.ts).
 *
 * Importa: pixi.js, src/core/config.ts, src/render/theme-config.ts, src/render/voxel.ts
 * Conecta-se com: src/render/renderer.ts, src/render/day-lighting-view.ts, src/render/environment-state.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import { BALANCE } from '../core/config';
import { THEME } from './theme-config';
import { drawBlock, drawBlockCentered, drawShadow } from './voxel';

const GRID_W = BALANCE.grid.cols * THEME.tileSize;
const GRID_H = BALANCE.grid.rows * THEME.tileSize;
const LOT_MARGIN = 20;
const SIDEWALK_Y = GRID_H + LOT_MARGIN;
const SIDEWALK_H = 36;
const AVENUE_Y = SIDEWALK_Y + SIDEWALK_H + 4;
const AVENUE_H = 100;
const WORLD_EXTENT = 2400;
const STREET_X0 = -WORLD_EXTENT;
const STREET_X1 = GRID_W + WORLD_EXTENT;
const CROSSWALK_X = 3 * THEME.tileSize;
const BAY = { x: -170, y: GRID_H - 210, w: 140, h: 230 };

export const AMBULANCE_POS = { x: BAY.x + BAY.w / 2, y: BAY.y + 120 };
export const LAMP_POSITIONS: ReadonlyArray<{ x: number; y: number }> = Array.from({ length: 7 }, (_, i) => ({
  x: -180 + i * 150,
  y: SIDEWALK_Y + 8,
}));
const TREE_POSITIONS: ReadonlyArray<[number, number]> = [
  [-110, 30], [-60, 120], [-120, 210], [-70, 300],
  [GRID_W + 60, 40], [GRID_W + 130, 150], [GRID_W + 70, 260], [GRID_W + 140, 380], [GRID_W + 60, 480],
  [60, -90], [190, -70], [330, -95], [470, -70], [GRID_W - 20, -100],
];
const BENCHES: ReadonlyArray<[number, number]> = [[GRID_W + 110, 320], [260, -40], [420, -40]];
const BUS_STOP = { x: GRID_W + 70, y: SIDEWALK_Y + 4 };

function drawGround(g: Graphics): void {
  g.rect(-WORLD_EXTENT, -WORLD_EXTENT, GRID_W + WORLD_EXTENT * 2, GRID_H + WORLD_EXTENT * 2).fill({ color: 0x86c96b });
  for (let i = 0; i < 260; i++) {
    const x = ((i * 137) % 1400) - 420;
    const y = ((i * 251) % 1100) - 360;
    g.circle(x, y, 2 + (i % 3)).fill({ color: i % 2 === 0 ? 0x7dbf61 : 0x93d277, alpha: 0.7 });
  }
}

function drawSidewalkAndCurb(g: Graphics): void {
  g.rect(STREET_X0, SIDEWALK_Y, STREET_X1 - STREET_X0, SIDEWALK_H).fill({ color: 0xe5e7eb });
  for (let x = -400; x < GRID_W + 400; x += 24) {
    g.moveTo(x, SIDEWALK_Y).lineTo(x, SIDEWALK_Y + SIDEWALK_H).stroke({ color: 0xd1d5db, width: 1 });
  }
  drawBlock(g, STREET_X0, SIDEWALK_Y + SIDEWALK_H, STREET_X1 - STREET_X0, 4, 3, 0xcbd5e1, false);
  g.rect(-LOT_MARGIN, GRID_H, GRID_W + LOT_MARGIN * 2, LOT_MARGIN).fill({ color: 0xd6d3d1 });
}

function drawAvenue(g: Graphics): void {
  g.rect(STREET_X0, AVENUE_Y, STREET_X1 - STREET_X0, AVENUE_H).fill({ color: 0x3f4652 });
  const mid = AVENUE_Y + AVENUE_H / 2;
  for (let x = -600; x < GRID_W + 600; x += 40) {
    g.rect(x, mid - 1.5, 22, 3).fill({ color: 0xfacc15 });
  }
  for (let i = 0; i < 8; i++) {
    g.rect(CROSSWALK_X - 30 + i * 8, AVENUE_Y + 6, 5, AVENUE_H - 12).fill({ color: 0xf8fafc, alpha: 0.92 });
  }
  g.rect(STREET_X0, AVENUE_Y + AVENUE_H, STREET_X1 - STREET_X0, 6).fill({ color: 0xcbd5e1 });
}

function drawAmbulanceBay(g: Graphics): void {
  g.rect(BAY.x, BAY.y, BAY.w, BAY.h).fill({ color: 0x9ca3af });
  g.rect(BAY.x + 6, BAY.y + 6, BAY.w - 12, BAY.h - 12).stroke({ color: 0xfacc15, width: 3 });
  for (let i = 0; i < 6; i++) {
    g.moveTo(BAY.x + 10 + i * 22, BAY.y + BAY.h - 40).lineTo(BAY.x + 30 + i * 22, BAY.y + BAY.h - 10)
      .stroke({ color: 0xfacc15, width: 3, alpha: 0.85 });
  }
  g.rect(BAY.x + BAY.w, BAY.y + BAY.h - 50, 30, 50).fill({ color: 0x9ca3af });
}

function drawAmbulanceBody(g: Graphics): void {
  const { x, y } = AMBULANCE_POS;
  drawShadow(g, x - 20, y - 34, 40, 72, 5);
  drawBlockCentered(g, x, y, 38, 70, 20, 0xffffff, false);
  g.rect(x - 19, y - 18, 38, 6).fill({ color: 0xdc2626 });
  g.rect(x - 3, y - 50, 6, 18).fill({ color: 0xdc2626 });
  g.rect(x - 9, y - 44, 18, 6).fill({ color: 0xdc2626 });
  g.rect(x - 15, y + 20, 30, 10).fill({ color: 0x7dd3fc });
  for (const [wx, wy] of [[-20, -26], [16, -26], [-20, 26], [16, 26]]) {
    g.rect(x + wx!, y + wy!, 4, 10).fill({ color: 0x111827 });
  }
}

function drawVoxelTree(g: Graphics, x: number, y: number, scale: number): void {
  g.ellipse(x + 6, y + 6, 18 * scale, 7 * scale).fill({ color: 0x14532d, alpha: 0.25 });
  drawBlockCentered(g, x, y, 6 * scale, 6 * scale, 14 * scale, 0x92400e, false);
  drawBlockCentered(g, x, y - 14 * scale, 28 * scale, 24 * scale, 14 * scale, 0x15803d, false);
  drawBlockCentered(g, x, y - 28 * scale, 18 * scale, 16 * scale, 10 * scale, 0x22c55e, false);
}

function drawBench(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 30, 8, 6, 0xa16207);
  drawBlockCentered(g, x, y - 5, 30, 3, 8, 0x854d0e, false);
}

function drawLampPost(g: Graphics, x: number, y: number): void {
  drawShadow(g, x - 2, y - 2, 6, 6, 4);
  g.rect(x - 1.5, y - 34, 3, 34).fill({ color: 0x334155 });
  g.rect(x - 1.5, y - 36, 12, 3).fill({ color: 0x334155 });
  g.roundRect(x + 6, y - 35, 7, 5, 2).fill({ color: 0xfef3c7 });
}

function drawBusStop(g: Graphics): void {
  const { x, y } = BUS_STOP;
  drawBlock(g, x, y + 6, 64, 14, 4, 0x64748b);
  drawBlock(g, x, y - 14, 64, 20, 4, 0x0284c7, false);
  g.rect(x + 2, y - 14, 60, 18).fill({ color: 0xbae6fd, alpha: 0.35 });
  g.rect(x + 70, y - 30, 3, 40).fill({ color: 0x334155 });
  g.roundRect(x + 64, y - 40, 16, 12, 3).fill({ color: 0x0284c7 });
}

function makeLabel(text: string, x: number, y: number, color: string, size: number): Text {
  return new Text({
    text,
    style: { fontFamily: THEME.fontFamily, fontSize: size, fill: color, fontWeight: 'bold', align: 'center' },
    anchor: 0.5,
    x,
    y,
    resolution: THEME.textResolution,
  });
}

export class CityEnvironment {
  public container = new Container();
  private staticLayer = new Graphics();
  private sirenLights = new Graphics();
  private lastAlert: boolean | null = null;

  constructor() {
    this.container.addChild(this.staticLayer);
    this.drawStatic();
    this.container.addChild(makeLabel('AMBULÂNCIA / SUS', BAY.x + BAY.w / 2, BAY.y + 24, '#facc15', 11));
    this.container.addChild(makeLabel('🚌 Ponto de Ônibus', BUS_STOP.x + 32, BUS_STOP.y - 26, '#0f172a', 8));
    this.container.addChild(this.sirenLights);
  }

  private drawStatic(): void {
    const g = this.staticLayer;
    drawGround(g);
    drawSidewalkAndCurb(g);
    drawAvenue(g);
    drawAmbulanceBay(g);
    drawAmbulanceBody(g);
    for (const [x, y] of TREE_POSITIONS) drawVoxelTree(g, x, y, 0.9 + ((x + y) % 3) * 0.1);
    for (const [x, y] of BENCHES) drawBench(g, x, y);
    drawBusStop(g);
    for (const lamp of LAMP_POSITIONS) drawLampPost(g, lamp.x, lamp.y);
  }

  /** Giroflex: redesenha apenas quando o alerta está ativo ou acabou de mudar. */
  public update(alertActive: boolean, timeMs: number): void {
    if (!alertActive && this.lastAlert === false) return;
    this.lastAlert = alertActive;
    const g = this.sirenLights;
    g.clear();
    const { x, y } = AMBULANCE_POS;
    const phase = Math.floor(timeMs / 220) % 2 === 0;
    const left = alertActive && phase ? 0xef4444 : 0x7f1d1d;
    const right = alertActive && !phase ? 0xffffff : 0x9ca3af;
    g.rect(x - 12, y - 58, 10, 5).fill({ color: left });
    g.rect(x + 2, y - 58, 10, 5).fill({ color: right });
    if (alertActive) {
      g.circle(x + (phase ? -7 : 7), y - 56, 26).fill({ color: phase ? 0xef4444 : 0xffffff, alpha: 0.22 });
    }
  }
}
