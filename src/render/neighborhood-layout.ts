/**
 * Arquivo: src/render/neighborhood-layout.ts
 * O que faz: Calcula (sem desenhar) o bairro ao redor do hospital: 4 ruas verticais e 3 horizontais formando
 * quarteirões, os lotes com casas, prédios e pontos especiais (escola, igreja, mercado, praça, campo de futebol),
 * os circuitos de carros nas ruas novas e os percursos de moradores nas calçadas.
 * Para que foi criado: Dar vida à cidade em volta do hospital sem mexer na simulação (é só ambientação visual).
 * Como modificar/debugar: As distâncias ficam nas constantes abaixo; tudo é relativo ao tamanho do lote do hospital,
 * então o bairro se reorganiza sozinho quando o mapa é expandido. A geração é determinística (mesmo bairro sempre).
 * Importa: src/core/urban-geometry.ts
 * Conecta-se com: src/render/neighborhood-view.ts, tests/neighborhood-layout.test.ts
 */

import type { UrbanGeometry } from '../core/urban-geometry';

export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export type BuildingKind = 'house' | 'apartment' | 'school' | 'church' | 'market' | 'bakery';

export interface Building extends Rect {
  kind: BuildingKind;
  height: number;
  color: number;
  roofColor: number;
  label?: string;
}

export type PlazaKind = 'square' | 'soccer';

export interface Plaza extends Rect {
  kind: PlazaKind;
  label: string;
}

export interface NeighborhoodLayout {
  roads: Rect[];
  sidewalks: Rect[];
  crossings: Point[];
  buildings: Building[];
  plazas: Plaza[];
  trees: Point[];
  lamps: Point[];
  carLoops: Point[][];
  walkLoops: Point[][];
  bounds: Rect;
}

export const ROAD_WIDTH = 64;
export const SIDEWALK_WIDTH = 16;
const INNER_GAP_WEST = 420;
const INNER_GAP_EAST = 340;
const INNER_GAP_NORTH = 320;
const OUTER_STEP_X = 620;
const OUTER_STEP_NORTH = 560;
const SOUTH_STREET_GAP = 300;
const LOT_W = 96;
const LOT_H = 92;
const LOT_MARGIN = 26;
const SPECIAL_LOTS = 2;
const HALF = 2;
const LANE_OFFSET = 15;
const WALK_OFFSET = 8;
const TREE_EVERY = 3;
const SPECIAL_INSET = 30;
/** Parte dos lotes vira jardim com árvores, para o bairro respirar. */
const GARDEN_LOT_CHANCE = 0.16;
const SPECIAL_DEPTH_FACTOR = 1.15;

const HOUSE_COLORS = [0xfde68a, 0xfca5a5, 0x93c5fd, 0xa7f3d0, 0xfdba74, 0xc4b5fd, 0xf9a8d4, 0xe7e5e4, 0xbef264, 0x99f6e4];
const ROOF_COLORS = [0xb91c1c, 0x9a3412, 0x7c2d12, 0x475569, 0x0f766e, 0x92400e];
const APARTMENT_COLORS = [0x94a3b8, 0xcbd5e1, 0xa8a29e, 0x7dd3fc];

/** Número pseudoaleatório estável a partir de uma semente (o bairro é sempre o mesmo). */
export function seeded(seed: number): number {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function pick<T>(list: readonly T[], seed: number): T {
  return list[Math.floor(seeded(seed) * list.length) % list.length]!;
}

interface StreetGrid {
  xs: number[];
  ys: number[];
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function buildStreetGrid(geo: UrbanGeometry): StreetGrid {
  const w = geo.hospitalBounds.widthPx;
  const westX = -INNER_GAP_WEST;
  const eastX = w + INNER_GAP_EAST;
  const northY = -INNER_GAP_NORTH;
  const avenueCenter = geo.street.avenueY + geo.street.avenueH / HALF;
  const southY = geo.surroundings.oppositeSidewalkY + SOUTH_STREET_GAP;
  const xs = [westX - OUTER_STEP_X, westX, eastX, eastX + OUTER_STEP_X];
  const ys = [northY - OUTER_STEP_NORTH, northY, avenueCenter, southY];
  return { xs, ys, top: ys[0]!, bottom: ys[3]!, left: xs[0]!, right: xs[3]! };
}

function buildRoads(grid: StreetGrid): { roads: Rect[]; sidewalks: Rect[]; crossings: Point[] } {
  const roads: Rect[] = [];
  const sidewalks: Rect[] = [];
  const crossings: Point[] = [];
  const half = ROAD_WIDTH / HALF;
  const span = { x: grid.left - half, w: grid.right - grid.left + ROAD_WIDTH };
  // Ruas horizontais (a avenida, ys[2], já existe na cidade e não é redesenhada)
  for (const y of [grid.ys[0]!, grid.ys[1]!, grid.ys[3]!]) {
    roads.push({ x: span.x, y: y - half, w: span.w, h: ROAD_WIDTH });
    sidewalks.push({ x: span.x, y: y - half - SIDEWALK_WIDTH, w: span.w, h: SIDEWALK_WIDTH });
    sidewalks.push({ x: span.x, y: y + half, w: span.w, h: SIDEWALK_WIDTH });
  }
  const vSpan = { y: grid.top - half, h: grid.bottom - grid.top + ROAD_WIDTH };
  for (const x of grid.xs) {
    roads.push({ x: x - half, y: vSpan.y, w: ROAD_WIDTH, h: vSpan.h });
    sidewalks.push({ x: x - half - SIDEWALK_WIDTH, y: vSpan.y, w: SIDEWALK_WIDTH, h: vSpan.h });
    sidewalks.push({ x: x + half, y: vSpan.y, w: SIDEWALK_WIDTH, h: vSpan.h });
    for (const y of grid.ys) crossings.push({ x, y });
  }
  return { roads, sidewalks, crossings };
}

/** Área útil de um quarteirão (entre as calçadas das ruas que o cercam). */
function blockArea(grid: StreetGrid, col: number, row: number): Rect {
  const inset = ROAD_WIDTH / HALF + SIDEWALK_WIDTH + LOT_MARGIN;
  const x0 = grid.xs[col]! + inset;
  const x1 = grid.xs[col + 1]! - inset;
  const y0 = grid.ys[row]! + inset;
  const y1 = grid.ys[row + 1]! - inset;
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
}

const SPECIALS: Record<string, BuildingKind | PlazaKind> = {
  '0,0': 'soccer',
  '1,0': 'school',
  '2,0': 'square',
  '0,1': 'church',
  '2,1': 'market',
  '0,2': 'bakery',
};

const SPECIAL_LABELS: Record<string, string> = {
  soccer: '⚽ Campo do Bairro',
  school: '🏫 Escola Municipal',
  square: '⛲ Praça da Matriz',
  church: '⛪ Igreja',
  market: '🛒 Mercado',
  bakery: '🥖 Padaria',
};

function specialBuilding(kind: BuildingKind, area: Rect, seed: number): Building {
  const w = LOT_W * SPECIAL_LOTS - SPECIAL_INSET;
  const h = Math.round(LOT_H * SPECIAL_DEPTH_FACTOR);
  const style: Record<string, { color: number; roof: number; height: number }> = {
    school: { color: 0xfef3c7, roof: 0xea580c, height: 46 },
    church: { color: 0xfef9c3, roof: 0x1e3a8a, height: 52 },
    market: { color: 0xdcfce7, roof: 0x15803d, height: 38 },
    bakery: { color: 0xffedd5, roof: 0xb45309, height: 34 },
  };
  const s = style[kind] ?? { color: pick(HOUSE_COLORS, seed), roof: pick(ROOF_COLORS, seed + 1), height: 40 };
  return { x: area.x + SPECIAL_INSET / HALF, y: area.y + LOT_H * SPECIAL_LOTS - h - SPECIAL_INSET / HALF, w, h, kind, height: s.height, color: s.color, roofColor: s.roof, label: SPECIAL_LABELS[kind] };
}

/** Casas e prédios em grade dentro do quarteirão; o canto superior esquerdo pode ser um ponto especial. */
function fillBlock(area: Rect, key: string, skip: (r: Rect) => boolean, out: { buildings: Building[]; plazas: Plaza[]; trees: Point[] }): void {
  const cols = Math.floor(area.w / LOT_W);
  const rows = Math.floor(area.h / LOT_H);
  const special = SPECIALS[key];
  let seed = key.length * 101 + cols * 7 + rows * 13 + (key.charCodeAt(0) + key.charCodeAt(2)) * 31;
  if (special === 'square' || special === 'soccer') {
    out.plazas.push({ x: area.x, y: area.y, w: LOT_W * SPECIAL_LOTS * (special === 'soccer' ? 1.5 : 1), h: LOT_H * SPECIAL_LOTS, kind: special, label: SPECIAL_LABELS[special]! });
  } else if (special) {
    out.buildings.push(specialBuilding(special, area, seed));
  }
  const spanCols = special === 'soccer' ? 3 : SPECIAL_LOTS;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seed += 17;
      if (special && r < SPECIAL_LOTS && c < spanCols) continue;
      const lot = { x: area.x + c * LOT_W, y: area.y + r * LOT_H, w: LOT_W, h: LOT_H };
      if (skip(lot)) continue;
      if (seeded(seed + 99) < GARDEN_LOT_CHANCE) {
        out.trees.push({ x: lot.x + LOT_W * 0.3, y: lot.y + LOT_H * 0.55 }, { x: lot.x + LOT_W * 0.7, y: lot.y + LOT_H * 0.75 });
        continue;
      }
      if ((r * cols + c) % TREE_EVERY === 1) out.trees.push({ x: lot.x + LOT_W - 6, y: lot.y + LOT_H - 10 });
      out.buildings.push(lotBuilding(lot, seed));
    }
  }
}

function lotBuilding(lot: Rect, seed: number): Building {
  const isApartment = seeded(seed) > 0.78;
  if (isApartment) {
    return { x: lot.x + 10, y: lot.y + 8, w: LOT_W - 26, h: LOT_H - 28, kind: 'apartment', height: 54 + Math.round(seeded(seed + 3) * 34), color: pick(APARTMENT_COLORS, seed + 5), roofColor: 0x475569 };
  }
  const w = 52 + Math.round(seeded(seed + 7) * 18);
  const h = 40 + Math.round(seeded(seed + 9) * 12);
  return { x: lot.x + (LOT_W - w) / HALF, y: lot.y + (LOT_H - h) / HALF, w, h, kind: 'house', height: 22 + Math.round(seeded(seed + 11) * 10), color: pick(HOUSE_COLORS, seed + 13), roofColor: pick(ROOF_COLORS, seed + 15) };
}

/**
 * Circuito retangular com deslocamento por lado (topo, direita, base, esquerda).
 * Deslocamento positivo = para dentro do retângulo.
 */
function loopEdges(x0: number, y0: number, x1: number, y1: number, top: number, right: number, bottom: number, left: number): Point[] {
  return [
    { x: x0 + left, y: y0 + top },
    { x: x1 - right, y: y0 + top },
    { x: x1 - right, y: y1 - bottom },
    { x: x0 + left, y: y1 - bottom },
  ];
}

/**
 * Circuito de carro na mão direita: no sentido horário a faixa da direita fica para dentro;
 * quando o circuito usa a faixa de fora, ele é percorrido no sentido anti-horário.
 */
function carLoop(x0: number, y0: number, x1: number, y1: number, inside: boolean): Point[] {
  const o = inside ? LANE_OFFSET : -LANE_OFFSET;
  const pts = loopEdges(x0, y0, x1, y1, o, o, o, o);
  return inside ? pts : pts.reverse();
}

function buildLoops(grid: StreetGrid, avenueHalf: number): { carLoops: Point[][]; walkLoops: Point[][] } {
  const [x0, x1, x2, x3] = grid.xs as [number, number, number, number];
  const [y0, y1, y2, y3] = grid.ys as [number, number, number, number];
  const carLoops = [
    carLoop(x0, y0, x3, y3, false),
    carLoop(x0, y0, x1, y1, true),
    carLoop(x2, y0, x3, y1, true),
    carLoop(x1, y0, x2, y1, false),
  ];
  // Calçada de rua comum fica a meia pista + margem; ao lado da avenida (mais larga), mais longe.
  const street = ROAD_WIDTH / HALF + WALK_OFFSET;
  const avenue = avenueHalf + SIDEWALK_WIDTH * HALF + WALK_OFFSET;
  const walkLoops: Point[][] = [];
  for (let c = 0; c < 3; c++) {
    for (const r of [0, 1, 2]) {
      if (c === 1 && r === 1) continue;
      const top = grid.ys[r] === y2 ? avenue : street;
      const bottom = grid.ys[r + 1] === y2 ? avenue : street;
      walkLoops.push(loopEdges(grid.xs[c]!, grid.ys[r]!, grid.xs[c + 1]!, grid.ys[r + 1]!, top, street, bottom, street));
    }
  }
  return { carLoops, walkLoops };
}

/**
 * Monta o bairro inteiro. `reserved` são áreas já ocupadas pela cidade original
 * (hospital, parque, estacionamento, jardim, lojas em frente) onde nada é construído.
 */
export function buildNeighborhood(geo: UrbanGeometry, reserved: Rect[]): NeighborhoodLayout {
  const grid = buildStreetGrid(geo);
  const { roads, sidewalks, crossings } = buildRoads(grid);
  const out = { buildings: [] as Building[], plazas: [] as Plaza[], trees: [] as Point[] };
  const overlaps = (r: Rect): boolean => reserved.some((z) => r.x < z.x + z.w && r.x + r.w > z.x && r.y < z.y + z.h && r.y + r.h > z.y);
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) {
      if (c === 1 && r === 1) continue;
      fillBlock(blockArea(grid, c, r), `${c},${r}`, overlaps, out);
    }
  }
  const lamps = crossings.map((p) => ({ x: p.x + ROAD_WIDTH / HALF + SIDEWALK_WIDTH / HALF, y: p.y - ROAD_WIDTH / HALF - SIDEWALK_WIDTH / HALF }));
  const half = ROAD_WIDTH / HALF + SIDEWALK_WIDTH;
  return {
    roads, sidewalks, crossings, lamps, ...out, ...buildLoops(grid, geo.street.avenueH / HALF),
    bounds: { x: grid.left - half, y: grid.top - half, w: grid.right - grid.left + half * HALF, h: grid.bottom - grid.top + half * HALF },
  };
}
