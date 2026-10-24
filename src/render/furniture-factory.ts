/**
 * Arquivo: src/render/furniture-factory.ts
 *
 * 1. O que este arquivo faz?
 * Desenha proceduralmente (PIXI.Graphics) a mobília hospitalar 2.5D de cada sala: balcão em "L" com monitor,
 * totem de senhas e placa do SUS (Recepção); cadeiras, bebedouro, planta e TV (Espera); mesa, cadeira, maca,
 * biombo e pia cirúrgica (Consultório); estantes de remédios e balcão de dispensação (Farmácia RENAME);
 * além de Triagem e Leitos.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar leitura imediata da função de cada sala com estética voxel, sem sprites externos (bundle < 2 MB).
 * As estantes da farmácia mostram menos caixas quando o estoque RENAME está crítico ou zerado.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Cada tipo de móvel tem uma função própria registrada em FURNITURE_DRAWERS. As posições vêm de
 * FURNITURE_LAYOUTS (room-layout.ts). Para novo móvel: adicione o tipo em FurnitureKind, o slot no layout
 * e uma função aqui.
 *
 * Importa: pixi.js, src/render/voxel.ts, src/render/room-layout.ts, src/render/environment-state.ts
 * Conecta-se com: src/render/room-renderer-3d.ts
 */

import type { Graphics } from 'pixi.js';
import { drawBlockCentered, drawShadow } from './voxel';
import type { FurnitureKind, FurnitureWaypoint } from './room-layout';
import { getShelfBoxCount } from './environment-state';

export interface FurnitureContext {
  stockRatio: number;
  timeSeed: number;
}

type Drawer = (g: Graphics, x: number, y: number, ctx: FurnitureContext) => void;

const WOOD = 0xd6b98c;
const WHITE = 0xf8fafc;
const STEEL = 0x94a3b8;
const SCREEN_ON = 0x38bdf8;
const SUS_BLUE = 0x1d4ed8;
const BOX_COLORS = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0xa855f7, 0xec4899];
const SHELF_MAX_BOXES = 12;

function drawCounterL(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 56, 12, 9, WOOD);
  drawBlockCentered(g, x + 22, y + 12, 12, 16, 9, WOOD);
  g.rect(x - 22, y - 15, 52, 2).fill({ color: WHITE });
  drawBlockCentered(g, x - 6, y - 12, 12, 3, 9, 0x1e293b, false);
  g.rect(x - 11, y - 20, 10, 6).fill({ color: SCREEN_ON });
}

function drawTotem(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 9, 6, 20, 0x0ea5e9);
  g.rect(x - 3, y - 20, 6, 5).fill({ color: WHITE });
  g.rect(x - 2, y - 12, 4, 1.5).fill({ color: 0x1e293b });
}

function drawSusSign(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 22, 4, 18, SUS_BLUE);
  g.rect(x - 2, y - 21, 4, 12).fill({ color: WHITE });
  g.rect(x - 6, y - 17, 12, 4).fill({ color: WHITE });
}

function drawChairRow(g: Graphics, x: number, y: number): void {
  const seats = 4;
  const seatW = 11;
  const startX = x - (seats * (seatW + 2)) / 2;
  drawShadow(g, startX, y - 4, seats * (seatW + 2), 10);
  for (let i = 0; i < seats; i++) {
    const sx = startX + i * (seatW + 2) + seatW / 2;
    drawBlockCentered(g, sx, y - 4, seatW, 4, 10, 0x2563eb, false);
    drawBlockCentered(g, sx, y + 2, seatW, 8, 5, 0x3b82f6, false);
  }
}

function drawWaterCooler(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 9, 8, 14, WHITE);
  g.roundRect(x - 4, y - 24, 8, 9, 3).fill({ color: 0x7dd3fc, alpha: 0.85 });
}

function drawPlant(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 9, 9, 7, 0xb45309);
  g.circle(x, y - 13, 7).fill({ color: 0x16a34a });
  g.circle(x - 3, y - 17, 4).fill({ color: 0x22c55e });
}

function drawWallTv(g: Graphics, x: number, y: number, ctx: FurnitureContext): void {
  drawBlockCentered(g, x, y, 26, 3, 16, 0x0f172a);
  const blink = Math.floor(ctx.timeSeed / 900) % 2 === 0;
  g.rect(x - 11, y - 16, 22, 11).fill({ color: blink ? 0x0ea5e9 : 0x22c55e });
  g.rect(x - 8, y - 12, 16, 2).fill({ color: WHITE });
}

function drawDesk(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 30, 14, 10, WOOD);
  drawBlockCentered(g, x - 5, y - 4, 11, 3, 8, 0x1e293b, false);
  g.rect(x - 9, y - 21, 9, 6).fill({ color: SCREEN_ON });
  g.rect(x + 4, y - 13, 8, 4).fill({ color: WHITE });
}

function drawOfficeChair(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 10, 9, 5, 0x334155);
  drawBlockCentered(g, x, y - 5, 10, 3, 9, 0x475569, false);
}

function drawExamBed(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 18, 34, 9, STEEL);
  g.rect(x - 8, y - 25, 16, 30).fill({ color: WHITE });
  g.roundRect(x - 6, y - 24, 12, 7, 2).fill({ color: 0xbae6fd });
}

function drawScreen(g: Graphics, x: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    drawBlockCentered(g, x - 7 + i * 7, y, 6, 2, 18, i % 2 === 0 ? 0x99f6e4 : 0x5eead4, i === 0);
  }
}

function drawSink(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 14, 9, 10, WHITE);
  g.ellipse(x, y - 10, 5, 2.5).fill({ color: 0xcbd5e1 });
  g.rect(x - 0.75, y - 16, 1.5, 5).fill({ color: STEEL });
}

function drawShelves(g: Graphics, x: number, y: number, ctx: FurnitureContext): void {
  const w = 64;
  drawBlockCentered(g, x, y, w, 8, 24, 0xe2e8f0);
  const boxes = getShelfBoxCount(ctx.stockRatio, SHELF_MAX_BOXES);
  const perRow = SHELF_MAX_BOXES / 2;
  for (let i = 0; i < boxes; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    g.rect(x - w / 2 + 4 + col * 10, y - 25 + row * 10, 7, 7).fill({ color: BOX_COLORS[i % BOX_COLORS.length]! });
  }
  if (boxes === 0) g.rect(x - 14, y - 20, 28, 6).fill({ color: 0xef4444, alpha: 0.85 });
}

function drawDispenseCounter(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 60, 12, 11, WHITE);
  g.rect(x - 30, y - 6, 60, 3).fill({ color: 0x3b82f6 });
  drawBlockCentered(g, x, y - 6, 18, 2, 12, 0xbae6fd, false);
}

function drawBpMonitor(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 10, 10, 6, STEEL);
  drawBlockCentered(g, x, y - 6, 12, 4, 10, 0x0f172a, false);
  g.rect(x - 4, y - 19, 8, 5).fill({ color: 0x22c55e });
}

function drawWardBed(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 22, 40, 9, 0x0891b2);
  g.rect(x - 10, y - 28, 20, 36).fill({ color: WHITE });
  g.roundRect(x - 8, y - 27, 16, 8, 2).fill({ color: 0xa5f3fc });
  g.rect(x - 10, y - 4, 20, 12).fill({ color: 0x67e8f9, alpha: 0.6 });
}

function drawPniFridge(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 16, 12, 22, 0xe2e8f0);
  g.rect(x - 6, y - 24, 12, 10).fill({ color: WHITE });
  g.rect(x - 6, y - 12, 12, 12).fill({ color: 0xf1f5f9 });
  g.rect(x - 4, y - 22, 5, 2).fill({ color: 0x0284c7 });
  g.rect(x + 4, y - 18, 1.5, 4).fill({ color: STEEL });
}

function drawVaxBed(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 16, 26, 8, STEEL);
  g.rect(x - 7, y - 20, 14, 22).fill({ color: 0x059669 });
  g.roundRect(x - 5, y - 19, 10, 5, 2).fill({ color: 0x34d399 });
}

function drawCardArchive(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 14, 10, 20, 0x475569);
  for (let i = 0; i < 3; i++) {
    g.rect(x - 5, y - 20 + i * 6.5, 10, 5).fill({ color: 0x64748b });
    g.rect(x - 2, y - 18 + i * 6.5, 4, 1.5).fill({ color: WHITE });
  }
}

function drawLabBench(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 52, 14, 11, STEEL);
  g.rect(x - 24, y - 14, 48, 2).fill({ color: WHITE });
  for (let i = 0; i < 4; i++) {
    const color = BOX_COLORS[i % BOX_COLORS.length]!;
    g.rect(x - 18 + i * 5, y - 19, 2.5, 6).fill({ color });
  }
}

function drawMicroscope(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 12, 10, 5, 0x0f172a);
  drawBlockCentered(g, x, y - 5, 4, 4, 14, STEEL, false);
  g.rect(x - 4, y - 21, 6, 4).fill({ color: 0x1e293b });
  g.rect(x - 2, y - 25, 3, 5).fill({ color: 0x38bdf8 });
}

function drawCentrifuge(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 14, 12, 8, WHITE);
  g.ellipse(x, y - 10, 6, 3.5).fill({ color: 0xf59e0b, alpha: 0.85 });
  g.rect(x - 3, y - 7, 6, 2).fill({ color: 0x0f172a });
}

function drawXrayMachine(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x - 10, y, 8, 8, 26, 0x334155);
  drawBlockCentered(g, x + 6, y, 22, 16, 8, WHITE, false);
  drawBlockCentered(g, x - 2, y - 16, 18, 4, 5, STEEL, false);
  drawBlockCentered(g, x + 6, y - 14, 7, 7, 7, 0x475569, false);
}

function drawLeadScreen(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 20, 4, 22, 0x475569);
  g.rect(x - 6, y - 23, 12, 7).fill({ color: 0xfbbf24, alpha: 0.8 });
  drawBlockCentered(g, x, y, 22, 6, 2, 0x1e293b, false);
}

function drawNegatoscope(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 20, 3, 16, 0x0f172a);
  g.rect(x - 8, y - 16, 16, 11).fill({ color: 0xe0f2fe });
  g.rect(x - 5, y - 13, 10, 6).fill({ color: 0x64748b, alpha: 0.6 });
}

function drawSurgeryTable(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 12, 12, 10, STEEL);
  drawBlockCentered(g, x, y - 8, 32, 16, 4, 0x1e293b, false);
  g.rect(x - 14, y - 19, 28, 12).fill({ color: 0x0284c7 });
}

function drawSurgicalLight(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 4, 4, 22, STEEL);
  g.circle(x - 5, y - 22, 6).fill({ color: WHITE });
  g.circle(x - 5, y - 22, 3.5).fill({ color: 0xfef08a });
  g.circle(x + 5, y - 22, 6).fill({ color: WHITE });
  g.circle(x + 5, y - 22, 3.5).fill({ color: 0xfef08a });
}

function drawSurgeryMonitor(g: Graphics, x: number, y: number, ctx: FurnitureContext): void {
  drawBlockCentered(g, x, y, 6, 6, 18, STEEL);
  drawBlockCentered(g, x, y - 16, 16, 4, 12, 0x0f172a, false);
  const pulse = Math.floor(ctx.timeSeed / 400) % 2 === 0;
  g.rect(x - 6, y - 22, 12, 7).fill({ color: 0x0f172a });
  g.rect(x - 5, y - 20, pulse ? 10 : 8, 1.5).fill({ color: 0x22c55e });
  g.rect(x - 5, y - 17, 6, 1.5).fill({ color: 0x38bdf8 });
}

function drawIcuBed(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 22, 38, 9, STEEL);
  g.rect(x - 10, y - 26, 20, 32).fill({ color: WHITE });
  g.roundRect(x - 8, y - 25, 16, 8, 2).fill({ color: 0x93c5fd });
  g.rect(x - 11, y - 22, 2, 24).fill({ color: 0x475569 });
  g.rect(x + 9, y - 22, 2, 24).fill({ color: 0x475569 });
}

function drawVentilator(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 8, 8, 18, STEEL);
  drawBlockCentered(g, x, y - 14, 12, 8, 10, WHITE, false);
  g.rect(x - 4, y - 24, 8, 5).fill({ color: 0x0284c7 });
  g.rect(x + 4, y - 20, 3, 10).stroke({ width: 1.5, color: 0x94a3b8 });
}

function drawIcuMonitor(g: Graphics, x: number, y: number, ctx: FurnitureContext): void {
  drawBlockCentered(g, x, y, 6, 6, 16, STEEL);
  drawBlockCentered(g, x, y - 14, 14, 4, 10, 0x0f172a, false);
  const pulse = Math.floor(ctx.timeSeed / 350) % 2 === 0;
  g.rect(x - 5, y - 19, 10, 6).fill({ color: 0x022c22 });
  g.rect(x - 4, y - 17, pulse ? 8 : 6, 1.5).fill({ color: 0x22c55e });
}

function drawStaffSofa(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 32, 16, 8, 0x334155);
  drawBlockCentered(g, x, y - 4, 32, 6, 10, 0x1e293b, false);
  drawBlockCentered(g, x - 14, y, 4, 16, 10, 0x475569, false);
  drawBlockCentered(g, x + 14, y, 4, 16, 10, 0x475569, false);
}

function drawCoffeeMachine(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 14, 12, 10, WOOD);
  drawBlockCentered(g, x, y - 6, 8, 6, 9, 0xb91c1c, false);
  g.rect(x - 2, y - 18, 4, 2).fill({ color: 0x0f172a });
  g.rect(x + 4, y - 12, 2.5, 2.5).fill({ color: WHITE });
}

function drawStaffLockers(g: Graphics, x: number, y: number): void {
  drawBlockCentered(g, x, y, 22, 10, 24, 0x64748b);
  g.rect(x - 9, y - 24, 8, 22).stroke({ width: 1, color: 0x334155 });
  g.rect(x + 1, y - 24, 8, 22).stroke({ width: 1, color: 0x334155 });
  g.rect(x - 3, y - 14, 1.5, 3).fill({ color: WHITE });
  g.rect(x + 7, y - 14, 1.5, 3).fill({ color: WHITE });
}

const FURNITURE_DRAWERS: Record<FurnitureKind, Drawer> = {
  counterL: drawCounterL,
  totem: drawTotem,
  susSign: drawSusSign,
  chairRow: drawChairRow,
  waterCooler: drawWaterCooler,
  plant: drawPlant,
  wallTv: drawWallTv,
  desk: drawDesk,
  officeChair: drawOfficeChair,
  examBed: drawExamBed,
  screen: drawScreen,
  sink: drawSink,
  shelves: drawShelves,
  dispenseCounter: drawDispenseCounter,
  bpMonitor: drawBpMonitor,
  wardBed: drawWardBed,
  pniFridge: drawPniFridge,
  vaxBed: drawVaxBed,
  cardArchive: drawCardArchive,
  labBench: drawLabBench,
  microscope: drawMicroscope,
  centrifuge: drawCentrifuge,
  xrayMachine: drawXrayMachine,
  leadScreen: drawLeadScreen,
  negatoscope: drawNegatoscope,
  surgeryTable: drawSurgeryTable,
  surgicalLight: drawSurgicalLight,
  surgeryMonitor: drawSurgeryMonitor,
  icuBed: drawIcuBed,
  ventilator: drawVentilator,
  icuMonitor: drawIcuMonitor,
  staffSofa: drawStaffSofa,
  coffeeMachine: drawCoffeeMachine,
  staffLockers: drawStaffLockers,
};

/** Desenha os móveis em ordem de Y (de trás para frente) para profundidade correta. */
export function drawFurniture(g: Graphics, waypoints: FurnitureWaypoint[], ctx: FurnitureContext): void {
  const sorted = [...waypoints].sort((a, b) => a.y - b.y);
  for (const wp of sorted) FURNITURE_DRAWERS[wp.kind](g, wp.x, wp.y, ctx);
}
