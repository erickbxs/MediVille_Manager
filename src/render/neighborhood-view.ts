/**
 * Arquivo: src/render/neighborhood-view.ts
 * O que faz: Desenha o bairro ao redor do hospital (ruas, calçadas, faixas, casas, prédios, escola, igreja, mercado,
 * padaria, praça e campo) e anima a vida nele: carros circulando nas ruas novas, moradores caminhando pelas
 * calçadas com pausas, crianças jogando bola e janelas e postes acesos à noite.
 * Para que foi criado: Ambientação — quem abre o jogo vê uma microcidade viva, não só o lote do hospital.
 * Não interfere na simulação (pacientes, trânsito da avenida e pedestres antigos continuam iguais).
 * Como modificar/debugar: A planta vem de buildNeighborhood() (neighborhood-layout.ts). A quantidade de moradores
 * cai pela metade em telas pequenas. Para desligar o bairro, remova o container em src/render/renderer.ts.
 * Importa: pixi.js, src/core/urban-geometry.ts, src/render/theme-config.ts, src/render/voxel.ts,
 *          src/render/character-3d.ts, src/render/neighborhood-layout.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics, Text } from 'pixi.js';
import { getUrbanGeometry, type UrbanGeometry } from '../core/urban-geometry';
import { THEME } from './theme-config';
import { drawBlock, shadeColor } from './voxel';
import { Character3D } from './character-3d';
import { buildNeighborhood, seeded, type Building, type NeighborhoodLayout, type Plaza, type Point, type Rect } from './neighborhood-layout';

const RESIDENTS_DESKTOP = 28;
const RESIDENTS_PHONE = 14;
const PHONE_WIDTH = 768;
const CARS_PER_LOOP = 3;
const SOCCER_KIDS = 4;
const CAR_SPEED_MIN = 60;
const CAR_SPEED_RANGE = 40;
const WALK_SPEED_MIN = 14;
const WALK_SPEED_RANGE = 14;
const PAUSE_CHANCE_PER_SEC = 0.04;
const PAUSE_MIN_SEC = 2;
const PAUSE_RANGE_SEC = 4;
const MAX_DELTA_SEC = 0.1;
const CAR_COLORS = [0xef4444, 0x3b82f6, 0xf8fafc, 0x22c55e, 0xfacc15, 0x0f172a, 0xa855f7, 0xf97316];
const WINDOW_ON = 0xfde68a;
const WINDOW_OFF = 0x1e293b;
const HALF = 2;
const SIDEWALK_GAP_PX = 6;
const AVENUE_BAND_EXTRA = 46;

interface Walker {
  ch: Character3D;
  loop: Point[];
  perimeter: number;
  dist: number;
  speed: number;
  pause: number;
}

interface Car {
  loop: Point[];
  perimeter: number;
  dist: number;
  speed: number;
  color: number;
}

interface Kid {
  ch: Character3D;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  phase: number;
}

function perimeterOf(loop: Point[]): number {
  let total = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]!;
    const b = loop[(i + 1) % loop.length]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Ponto e direção a uma distância `d` ao longo do circuito. */
export function pointOnLoop(loop: Point[], d: number): { x: number; y: number; dx: number; dy: number } {
  let rest = d;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i]!;
    const b = loop[(i + 1) % loop.length]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (rest <= len && len > 0) {
      const t = rest / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len };
    }
    rest -= len;
  }
  const first = loop[0]!;
  return { x: first.x, y: first.y, dx: 1, dy: 0 };
}

/** Áreas da cidade original onde o bairro não constrói nada. */
function reservedAreas(geo: UrbanGeometry): Rect[] {
  const w = geo.hospitalBounds.widthPx;
  const h = geo.hospitalBounds.heightPx;
  const opp = geo.surroundings.oppositeSidewalkY;
  const avenueTop = geo.surroundings.sidewalkTopY - SIDEWALK_GAP_PX;
  return [
    { x: -360, y: -240, w: w + 640, h: h + 240 },
    { x: -100000, y: avenueTop, w: 200000, h: opp + AVENUE_BAND_EXTRA - avenueTop },
    { x: w / HALF - 300, y: opp, w: 600, h: 150 },
  ];
}


export class NeighborhoodView {
  public container = new Container();
  private ground = new Graphics();
  private nightLayer = new Graphics();
  private carsLayer = new Graphics();
  private people = new Container();
  private labels = new Container();
  private layout!: NeighborhoodLayout;
  private walkers: Walker[] = [];
  private cars: Car[] = [];
  private kids: Kid[] = [];
  private gridSize = 0;
  private lastNight: boolean | null = null;
  private lastTimeSec = 0;

  constructor(gridSize = 12) {
    this.people.sortableChildren = true;
    this.container.addChild(this.ground, this.nightLayer, this.carsLayer, this.people, this.labels);
    this.updateGridSize(gridSize);
  }

  public updateGridSize(gridSize: number): void {
    if (gridSize === this.gridSize) return;
    this.gridSize = gridSize;
    const geo = getUrbanGeometry(gridSize, THEME.tileSize);
    this.layout = buildNeighborhood(geo, reservedAreas(geo));
    this.drawStatic();
    this.spawnLife();
    this.lastNight = null;
  }

  public getLayout(): NeighborhoodLayout {
    return this.layout;
  }

  // ---------- desenho estático ----------

  private drawStatic(): void {
    const g = this.ground;
    g.clear();
    for (const t of this.labels.removeChildren()) t.destroy();
    for (const s of this.layout.sidewalks) g.rect(s.x, s.y, s.w, s.h).fill({ color: 0xd6d3d1 });
    for (const r of this.layout.roads) this.drawRoad(g, r);
    for (const c of this.layout.crossings) this.drawCrossing(g, c);
    for (const p of this.layout.plazas) this.drawPlaza(g, p);
    for (const t of this.layout.trees) this.drawTree(g, t.x, t.y);
    const sorted = [...this.layout.buildings].sort((a, b) => a.y - b.y);
    for (const b of sorted) this.drawBuilding(g, b);
    for (const l of this.layout.lamps) this.drawLampPost(g, l);
  }

  private drawRoad(g: Graphics, r: Rect): void {
    g.rect(r.x, r.y, r.w, r.h).fill({ color: 0x3f3f46 });
    const horizontal = r.w > r.h;
    const dash = 22;
    if (horizontal) {
      const y = r.y + r.h / HALF - 1.5;
      for (let x = r.x; x < r.x + r.w; x += dash * HALF) g.rect(x, y, dash, 3).fill({ color: 0xfacc15, alpha: 0.85 });
    } else {
      const x = r.x + r.w / HALF - 1.5;
      for (let y = r.y; y < r.y + r.h; y += dash * HALF) g.rect(x, y, 3, dash).fill({ color: 0xfacc15, alpha: 0.85 });
    }
  }

  private drawCrossing(g: Graphics, c: Point): void {
    const half = 32;
    g.rect(c.x - half, c.y - half, half * HALF, half * HALF).fill({ color: 0x3f3f46 });
    for (let i = -half + 4; i < half - 4; i += 9) {
      g.rect(c.x + i, c.y - half - 14, 5, 12).fill({ color: 0xf8fafc, alpha: 0.9 });
      g.rect(c.x - half - 14, c.y + i, 12, 5).fill({ color: 0xf8fafc, alpha: 0.9 });
    }
  }

  private drawTree(g: Graphics, x: number, y: number): void {
    g.ellipse(x + 3, y + 3, 12, 6).fill({ color: 0x0f172a, alpha: 0.18 });
    g.rect(x - 2, y - 10, 4, 12).fill({ color: 0x78350f });
    g.circle(x, y - 18, 12).fill({ color: 0x16a34a });
    g.circle(x - 5, y - 22, 7).fill({ color: 0x22c55e, alpha: 0.9 });
  }

  private drawLampPost(g: Graphics, p: Point): void {
    g.rect(p.x - 1.5, p.y - 26, 3, 26).fill({ color: 0x334155 });
    g.roundRect(p.x - 5, p.y - 30, 10, 5, 2).fill({ color: 0x475569 });
  }

  private drawPlaza(g: Graphics, p: Plaza): void {
    if (p.kind === 'soccer') {
      g.roundRect(p.x, p.y, p.w, p.h, 6).fill({ color: 0x4ade80 });
      for (let i = 0; i < 6; i++) g.rect(p.x + (i * p.w) / 6, p.y, p.w / 12, p.h).fill({ color: 0x22c55e, alpha: 0.5 });
      g.rect(p.x + 8, p.y + 8, p.w - 16, p.h - 16).stroke({ color: 0xffffff, width: 2 });
      g.moveTo(p.x + p.w / HALF, p.y + 8).lineTo(p.x + p.w / HALF, p.y + p.h - 8).stroke({ color: 0xffffff, width: 2 });
      g.circle(p.x + p.w / HALF, p.y + p.h / HALF, 18).stroke({ color: 0xffffff, width: 2 });
      g.rect(p.x + 2, p.y + p.h / HALF - 14, 8, 28).stroke({ color: 0xffffff, width: 2 });
      g.rect(p.x + p.w - 10, p.y + p.h / HALF - 14, 8, 28).stroke({ color: 0xffffff, width: 2 });
    } else {
      g.roundRect(p.x, p.y, p.w, p.h, 10).fill({ color: 0xe7e5e4 });
      g.roundRect(p.x + 12, p.y + 12, p.w - 24, p.h - 24, 8).fill({ color: 0x86efac });
      const cx = p.x + p.w / HALF;
      const cy = p.y + p.h / HALF;
      drawBlock(g, cx - 26, cy - 10, 52, 30, 10, 0xfef3c7, true);
      g.poly([cx - 32, cy - 20, cx, cy - 44, cx + 32, cy - 20]).fill({ color: 0xb91c1c });
      for (const [dx, dy] of [[-40, -30], [40, -30], [-40, 34], [40, 34]] as const) this.drawTree(g, cx + dx, cy + dy);
    }
    this.addLabel(p.label, p.x + p.w / HALF, p.y - 8);
  }

  private drawBuilding(g: Graphics, b: Building): void {
    drawBlock(g, b.x, b.y, b.w, b.h, b.height, b.color, true);
    const top = b.y - b.height;
    if (b.kind === 'house' || b.kind === 'bakery' || b.kind === 'school') {
      g.poly([b.x - 4, top + 6, b.x + b.w / HALF, top - 14, b.x + b.w + 4, top + 6, b.x + b.w + 4, top + 14, b.x - 4, top + 14])
        .fill({ color: b.roofColor });
      g.poly([b.x - 4, top + 6, b.x + b.w / HALF, top - 14, b.x + b.w + 4, top + 6]).fill({ color: shadeColor(b.roofColor, 1.25) });
    } else if (b.kind === 'church') {
      this.drawChurch(g, b, top);
    } else {
      g.rect(b.x - 2, top - 4, b.w + 4, 6).fill({ color: b.roofColor });
    }
    this.decorateSpecial(g, b, top);
    const doorX = b.x + b.w / HALF - 5;
    g.roundRect(doorX, b.y + b.h - 16, 10, 16, 2).fill({ color: 0x78350f });
    if (b.label) this.addLabel(b.label, b.x + b.w / HALF, top - (b.kind === 'church' ? 92 : 22));
  }

  private drawChurch(g: Graphics, b: Building, top: number): void {
    g.poly([b.x - 4, top + 8, b.x + b.w / HALF, top - 18, b.x + b.w + 4, top + 8]).fill({ color: b.roofColor });
    const tx = b.x + 18;
    drawBlock(g, tx - 14, b.y + b.h - 30, 28, 30, b.height + 36, 0xfefce8, false);
    const towerTop = b.y + b.h - 30 - (b.height + 36);
    g.poly([tx - 16, towerTop + 2, tx, towerTop - 22, tx + 16, towerTop + 2]).fill({ color: b.roofColor });
    g.rect(tx - 1.5, towerTop - 36, 3, 14).fill({ color: 0xfacc15 });
    g.rect(tx - 6, towerTop - 31, 12, 3).fill({ color: 0xfacc15 });
    g.circle(tx, towerTop + 14, 5).fill({ color: 0x38bdf8 });
    const glass = [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e];
    for (let i = 0; i < 4; i++) g.roundRect(b.x + 44 + i * 26, b.y + b.h - b.height + 14, 10, 20, 5).fill({ color: glass[i]!, alpha: 0.9 });
  }

  /** Detalhes que identificam escola, mercado e padaria de longe. */
  private decorateSpecial(g: Graphics, b: Building, top: number): void {
    const front = b.y + b.h - b.height;
    if (b.kind === 'school') {
      g.rect(b.x + b.w - 8, top - 40, 2, 40).fill({ color: 0x64748b });
      g.rect(b.x + b.w - 6, top - 40, 16, 10).fill({ color: 0x16a34a });
      g.circle(b.x + b.w + 2, top - 35, 3).fill({ color: 0xfacc15 });
      g.rect(b.x, front + 4, b.w, 5).fill({ color: 0x2563eb, alpha: 0.7 });
    } else if (b.kind === 'market' || b.kind === 'bakery') {
      const stripe = b.kind === 'market' ? 0x16a34a : 0xb91c1c;
      for (let x = b.x - 4; x < b.x + b.w + 4; x += 12) g.rect(x, front + 2, 6, 10).fill({ color: stripe }).rect(x + 6, front + 2, 6, 10).fill({ color: 0xffffff });
      g.roundRect(b.x + b.w / HALF - 28, front - 14, 56, 12, 3).fill({ color: 0x0f172a });
    }
  }

  /** Janelas de cada prédio (posições usadas para acender à noite). */
  private windowsOf(b: Building): Rect[] {
    const out: Rect[] = [];
    const rows = b.kind === 'apartment' ? Math.max(2, Math.floor(b.height / 18)) : 1;
    const cols = Math.max(2, Math.floor(b.w / 22));
    const front = b.y + b.h - b.height;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = b.x + 6 + c * ((b.w - 12) / cols);
        if (Math.abs(x + 4 - (b.x + b.w / HALF)) < 8 && r === rows - 1) continue;
        out.push({ x, y: front + 6 + r * 16, w: 8, h: 8 });
      }
    }
    return out;
  }

  private drawWindows(isNight: boolean): void {
    const g = this.nightLayer;
    g.clear();
    this.layout.buildings.forEach((b, bi) => {
      this.windowsOf(b).forEach((w, wi) => {
        const lit = isNight && seeded(bi * 31 + wi) > 0.35;
        g.rect(w.x, w.y, w.w, w.h).fill({ color: lit ? WINDOW_ON : (isNight ? WINDOW_OFF : 0x7dd3fc), alpha: lit ? 1 : 0.85 });
        if (lit) g.rect(w.x - 2, w.y - 2, w.w + 4, w.h + 4).fill({ color: WINDOW_ON, alpha: 0.18 });
      });
    });
    if (!isNight) return;
    for (const l of this.layout.lamps) g.circle(l.x, l.y - 24, 22).fill({ color: 0xfde68a, alpha: 0.22 });
  }

  private addLabel(text: string, x: number, y: number): void {
    const label = new Text({ text, style: { fontFamily: 'Fredoka, sans-serif', fontSize: 10, fill: '#ffffff', fontWeight: '700', stroke: { color: '#0f172a', width: 3 } } });
    label.anchor.set(0.5, 1);
    label.position.set(x, y);
    this.labels.addChild(label);
  }

  // ---------- vida: moradores, carros e crianças ----------

  private spawnLife(): void {
    for (const p of this.people.removeChildren()) p.destroy({ children: true });
    this.walkers = [];
    this.kids = [];
    const phone = typeof window !== 'undefined' && window.innerWidth < PHONE_WIDTH;
    const count = phone ? RESIDENTS_PHONE : RESIDENTS_DESKTOP;
    const loops = this.layout.walkLoops;
    for (let i = 0; i < count && loops.length > 0; i++) {
      const loop = loops[i % loops.length]!;
      const perimeter = perimeterOf(loop);
      const ch = this.makeResident(i);
      this.people.addChild(ch.container);
      this.walkers.push({ ch, loop, perimeter, dist: seeded(i * 7 + 1) * perimeter, speed: WALK_SPEED_MIN + seeded(i * 7 + 2) * WALK_SPEED_RANGE, pause: 0 });
    }
    this.cars = this.layout.carLoops.flatMap((loop, li) => {
      const perimeter = perimeterOf(loop);
      return Array.from({ length: CARS_PER_LOOP }, (_, k) => ({
        loop, perimeter, dist: (perimeter * k) / CARS_PER_LOOP + seeded(li * 13 + k) * 60,
        speed: CAR_SPEED_MIN + seeded(li * 17 + k) * CAR_SPEED_RANGE,
        color: CAR_COLORS[(li * CARS_PER_LOOP + k) % CAR_COLORS.length]!,
      }));
    });
    this.spawnSoccerKids();
  }

  private makeResident(i: number): Character3D {
    const age = seeded(i * 3 + 5);
    return new Character3D({
      role: 'patient',
      gender: seeded(i * 3 + 6) > 0.5 ? 'female' : 'male',
      skinToneIndex: Math.floor(seeded(i * 3 + 7) * 6),
      hairColorIndex: Math.floor(seeded(i * 3 + 8) * 8),
      hairStyleIndex: Math.floor(seeded(i * 3 + 9) * 4),
      clothesColorIndex: Math.floor(seeded(i * 3 + 10) * 12),
      pantsColorIndex: Math.floor(seeded(i * 3 + 11) * 5),
      patientAgeGroup: age < 0.18 ? 'child' : age > 0.82 ? 'elderly' : 'adult',
    });
  }

  private spawnSoccerKids(): void {
    const field = this.layout.plazas.find((p) => p.kind === 'soccer');
    if (!field) return;
    for (let k = 0; k < SOCCER_KIDS; k++) {
      const ch = new Character3D({ role: 'patient', gender: k % 2 === 0 ? 'male' : 'female', skinToneIndex: k + 1, clothesColorIndex: k < 2 ? 1 : 2, hairStyleIndex: k, patientAgeGroup: 'child' });
      this.people.addChild(ch.container);
      this.kids.push({ ch, cx: field.x + field.w / HALF, cy: field.y + field.h / HALF, rx: field.w * 0.32, ry: field.h * 0.25, phase: k * 1.7 });
    }
  }

  public update(timeSec: number, isNight: boolean, paused: boolean): void {
    const delta = paused ? 0 : Math.min(MAX_DELTA_SEC, Math.max(0, timeSec - this.lastTimeSec));
    this.lastTimeSec = timeSec;
    if (isNight !== this.lastNight) {
      this.drawWindows(isNight);
      this.lastNight = isNight;
    }
    this.updateWalkers(delta, timeSec);
    this.updateKids(timeSec, paused);
    this.drawCars(delta);
  }

  private updateWalkers(delta: number, timeSec: number): void {
    for (const w of this.walkers) {
      if (w.pause > 0) {
        w.pause -= delta;
      } else {
        w.dist = (w.dist + w.speed * delta) % w.perimeter;
        if (delta > 0 && Math.random() < PAUSE_CHANCE_PER_SEC * delta) w.pause = PAUSE_MIN_SEC + Math.random() * PAUSE_RANGE_SEC;
      }
      const p = pointOnLoop(w.loop, w.dist);
      w.ch.container.position.set(p.x, p.y);
      w.ch.container.zIndex = p.y;
      if (Math.abs(p.dx) > 0.1) w.ch.facing = p.dx < 0 ? 'left' : 'right';
      w.ch.update(timeSec, w.pause > 0 || delta === 0 ? 'IDLE' : 'WALKING');
    }
  }

  private updateKids(timeSec: number, paused: boolean): void {
    for (const k of this.kids) {
      const t = paused ? k.phase : timeSec * 0.8 + k.phase;
      const x = k.cx + Math.cos(t) * k.rx;
      k.ch.container.position.set(x, k.cy + Math.sin(t * 1.3) * k.ry);
      k.ch.container.zIndex = k.ch.container.y;
      k.ch.facing = -Math.sin(t) < 0 ? 'left' : 'right';
      k.ch.update(timeSec, paused ? 'IDLE' : 'WALKING');
    }
  }

  private drawCars(delta: number): void {
    const g = this.carsLayer;
    g.clear();
    for (const c of this.cars) {
      c.dist = (c.dist + c.speed * delta) % c.perimeter;
      const p = pointOnLoop(c.loop, c.dist);
      const horizontal = Math.abs(p.dx) >= Math.abs(p.dy);
      const w = horizontal ? 30 : 16;
      const h = horizontal ? 16 : 30;
      g.roundRect(p.x - w / HALF + 2, p.y - h / HALF + 3, w, h, 4).fill({ color: 0x0f172a, alpha: 0.25 });
      g.roundRect(p.x - w / HALF, p.y - h / HALF, w, h, 4).fill({ color: c.color }).stroke({ color: 0x0f172a, width: 1, alpha: 0.4 });
      const fx = horizontal ? p.x + p.dx * 7 : p.x;
      const fy = horizontal ? p.y : p.y + p.dy * 7;
      g.roundRect(fx - (horizontal ? 3 : 6), fy - (horizontal ? 6 : 3), horizontal ? 6 : 12, horizontal ? 12 : 6, 2).fill({ color: 0x93c5fd, alpha: 0.9 });
    }
  }
}
