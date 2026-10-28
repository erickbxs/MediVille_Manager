/**
 * Arquivo: tests/neighborhood-layout.test.ts
 * O que faz: Garante que o bairro ao redor do hospital é coerente: nenhuma construção em cima de rua,
 * do hospital ou da avenida; carros andam sobre as ruas; geração determinística e que acompanha a expansão do mapa.
 * Importa: vitest, src/render/neighborhood-layout.ts, src/core/urban-geometry.ts
 * Conecta-se com: src/render/neighborhood-view.ts
 */

import { describe, it, expect } from 'vitest';
import { buildNeighborhood, ROAD_WIDTH, type Rect } from '../src/render/neighborhood-layout';
import { getUrbanGeometry } from '../src/core/urban-geometry';

const overlap = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function build(gridSize: number) {
  const geo = getUrbanGeometry(gridSize, 48);
  const w = geo.hospitalBounds.widthPx;
  const reserved: Rect[] = [
    { x: -360, y: -240, w: w + 640, h: geo.hospitalBounds.heightPx + 240 },
    { x: -100000, y: geo.surroundings.sidewalkTopY - 6, w: 200000, h: geo.surroundings.oppositeSidewalkY + 46 - (geo.surroundings.sidewalkTopY - 6) },
  ];
  return { geo, reserved, layout: buildNeighborhood(geo, reserved) };
}

describe('Bairro ao redor do hospital', () => {
  it('tem ruas, dezenas de construções, escola, igreja, mercado, padaria, praça e campo', () => {
    const { layout } = build(12);
    expect(layout.roads.length).toBeGreaterThanOrEqual(7);
    expect(layout.buildings.length).toBeGreaterThan(60);
    const kinds = new Set(layout.buildings.map((b) => b.kind));
    for (const k of ['school', 'church', 'market', 'bakery', 'house', 'apartment']) expect(kinds.has(k as never)).toBe(true);
    expect(layout.plazas.map((p) => p.kind).sort()).toEqual(['soccer', 'square']);
  });

  it('nenhuma construção fica sobre ruas ou áreas reservadas (hospital, parque, avenida)', () => {
    for (const size of [12, 16, 24]) {
      const { layout, reserved } = build(size);
      for (const b of layout.buildings) {
        for (const r of layout.roads) expect(overlap(b, r)).toBe(false);
        for (const z of reserved) expect(overlap(b, z)).toBe(false);
      }
    }
  });

  it('carros circulam sobre o asfalto', () => {
    const { layout } = build(12);
    const onRoad = (x: number, y: number): boolean => layout.roads.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    for (const loop of layout.carLoops) for (const p of loop) expect(onRoad(p.x, p.y)).toBe(true);
    expect(ROAD_WIDTH).toBeGreaterThan(40);
  });

  it('é determinístico (mesmo bairro sempre)', () => {
    expect(JSON.stringify(build(12).layout)).toBe(JSON.stringify(build(12).layout));
  });
});
