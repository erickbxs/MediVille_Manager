/**
 * Arquivo: tests/render-3d.test.ts
 *
 * 1. O que este arquivo faz?
 * Testa as funções puras do renderizador 2.5D: rotação de salas (0°, 90°, 180°, 270°) com cálculo de portas
 * e waypoints de mobília, gerenciamento de memória e destruição no DisplayCache, reação visual da ambulância SAMU
 * e estantes da farmácia, ciclo de iluminação diária e utilitários de sombreamento de voxel.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos do Prompt 10 sem depender de ambiente WebGL no runner de testes (Vitest).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar testes de novas mobílias ou ângulos de rotação, consulte src/render/room-layout.ts
 * e src/render/environment-state.ts.
 *
 * Importa: vitest, src/render/room-layout.ts, src/render/environment-state.ts, src/render/render-cache.ts, src/render/voxel.ts
 * Conecta-se com: vitest runner
 */

import { describe, it, expect, vi } from 'vitest';
import {
  rotateUnitPoint,
  getDoorSide,
  getDoorPosition,
  getFurnitureWaypoints,
  splitSpanAroundGap,
  type RoomRotation,
} from '../src/render/room-layout';
import {
  isAmbulanceAlertActive,
  getPharmacyStockRatio,
  getShelfBoxCount,
  getDayLighting,
} from '../src/render/environment-state';
import { DisplayCache, type Destroyable } from '../src/render/render-cache';
import { hexToNumber, shadeColor } from '../src/render/voxel';

describe('Renderizador 2.5D Volumétrico & Layout de Salas', () => {
  it('calcula rotação correta de pontos normalizados (0°, 90°, 180°, 270°)', () => {
    const p = { u: 0.2, v: 0.3 };

    expect(rotateUnitPoint(p.u, p.v, 0)).toEqual({ u: 0.2, v: 0.3 });
    expect(rotateUnitPoint(p.u, p.v, 90)).toEqual({ u: 0.7, v: 0.2 });
    expect(rotateUnitPoint(p.u, p.v, 180)).toEqual({ u: 0.8, v: 0.7 });
    expect(rotateUnitPoint(p.u, p.v, 270)).toEqual({ u: 0.3, v: 0.8 });
  });

  it('determina o lado e coordenadas do vão da porta conforme a rotação', () => {
    expect(getDoorSide(0)).toBe('south');
    expect(getDoorSide(90)).toBe('west');
    expect(getDoorSide(180)).toBe('north');
    expect(getDoorSide(270)).toBe('east');

    const rect = { x: 100, y: 200, w: 96, h: 96 };

    const door0 = getDoorPosition(rect, 0);
    expect(door0.side).toBe('south');
    expect(door0.x).toBe(148);
    expect(door0.y).toBe(296);

    const door90 = getDoorPosition(rect, 90);
    expect(door90.side).toBe('west');
    expect(door90.x).toBe(100);
    expect(door90.y).toBe(248);

    const door180 = getDoorPosition(rect, 180);
    expect(door180.side).toBe('north');
    expect(door180.x).toBe(148);
    expect(door180.y).toBe(200);

    const door270 = getDoorPosition(rect, 270);
    expect(door270.side).toBe('east');
    expect(door270.x).toBe(196);
    expect(door270.y).toBe(248);
  });

  it('rotaciona waypoints da mobília para todas as salas suportadas', () => {
    const rect = { x: 0, y: 0, w: 100, h: 100 };
    const rotations: RoomRotation[] = [0, 90, 180, 270];

    for (const rot of rotations) {
      const receptionWp = getFurnitureWaypoints('reception', rect, rot);
      expect(receptionWp.length).toBeGreaterThanOrEqual(3);
      for (const wp of receptionWp) {
        expect(wp.x).toBeGreaterThanOrEqual(0);
        expect(wp.x).toBeLessThanOrEqual(100);
        expect(wp.y).toBeGreaterThanOrEqual(0);
        expect(wp.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('divide vãos de parede preservando aberturas de portas sem sobreposição', () => {
    const spansWithDoor = splitSpanAroundGap(0, 100, 50, 20);
    expect(spansWithDoor).toEqual([[0, 40], [60, 100]]);

    const spansNoDoor = splitSpanAroundGap(0, 100, null, 20);
    expect(spansNoDoor).toEqual([[0, 100]]);
  });
});

describe('Gerenciamento de Memória & DisplayCache (Anti-Leak)', () => {
  class MockDisplayObject implements Destroyable {
    public destroyed = false;
    public options?: { children?: boolean };

    public destroy(options?: { children?: boolean }): void {
      this.destroyed = true;
      this.options = options;
    }
  }

  it('recicla objeto quando assinatura é idêntica', () => {
    const cache = new DisplayCache<MockDisplayObject>();
    const factory = vi.fn(() => new MockDisplayObject());

    const first = cache.getOrCreate('room_1', 'sig_A', factory);
    expect(first.created).toBe(true);

    const second = cache.getOrCreate('room_1', 'sig_A', factory);
    expect(second.created).toBe(false);
    expect(second.value).toBe(first.value);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('destrói com destroy({ children: true }) quando assinatura muda por rotação ou movimento', () => {
    const cache = new DisplayCache<MockDisplayObject>();
    const oldObj = new MockDisplayObject();
    const newObj = new MockDisplayObject();
    const factory = vi.fn()
      .mockReturnValueOnce(oldObj)
      .mockReturnValueOnce(newObj);

    cache.getOrCreate('room_1', 'rot_0', factory);
    expect(oldObj.destroyed).toBe(false);

    cache.getOrCreate('room_1', 'rot_90', factory);
    expect(oldObj.destroyed).toBe(true);
    expect(oldObj.options).toEqual({ children: true });
    expect(newObj.destroyed).toBe(false);
  });

  it('faz prune e destrói salas demolidas que não constam mais nos IDs ativos', () => {
    const cache = new DisplayCache<MockDisplayObject>();
    const obj1 = new MockDisplayObject();
    const obj2 = new MockDisplayObject();

    cache.getOrCreate('room_1', 'sig', () => obj1);
    cache.getOrCreate('room_2', 'sig', () => obj2);

    expect(cache.size).toBe(2);

    const removed = cache.prune(new Set(['room_1']));
    expect(removed).toBe(1);
    expect(cache.size).toBe(1);
    expect(obj2.destroyed).toBe(true);
    expect(obj2.options).toEqual({ children: true });
    expect(obj1.destroyed).toBe(false);
  });
});

describe('Reatividade do Ambiente Urbano & Estoque da Farmácia', () => {
  it('ativa alerta do giroflex da ambulância SAMU para eventos de acidente ou surto', () => {
    expect(isAmbulanceAlertActive([])).toBe(false);

    expect(isAmbulanceAlertActive([
      { definition: { type: 'crisis', id: 'c1', title: 'Crise', icon: '⚡', description: '', durationSec: 10, arrivalMultiplier: 1 } },
    ])).toBe(false);

    expect(isAmbulanceAlertActive([
      { definition: { type: 'accident', id: 'a1', title: 'Acidente', icon: '🚨', description: '', durationSec: 10, arrivalMultiplier: 2 } },
    ])).toBe(true);

    expect(isAmbulanceAlertActive([
      { definition: { type: 'epidemic', id: 'e1', title: 'Surto', icon: '🦠', description: '', durationSec: 10, arrivalMultiplier: 2 } },
    ])).toBe(true);
  });

  it('ajusta quantidade de caixas na estante conforme o estoque da farmácia RENAME', () => {
    const initial = { amoxicilina: 10, paracetamol: 20 };

    expect(getPharmacyStockRatio({ amoxicilina: 10, paracetamol: 20 }, initial)).toBe(1);
    expect(getShelfBoxCount(1, 12)).toBe(12);

    expect(getPharmacyStockRatio({ amoxicilina: 5, paracetamol: 10 }, initial)).toBe(0.5);
    expect(getShelfBoxCount(0.5, 12)).toBe(6);

    expect(getPharmacyStockRatio({ amoxicilina: 0, paracetamol: 0 }, initial)).toBe(0);
    expect(getShelfBoxCount(0, 12)).toBe(0);
  });

  it('calcula transições do ciclo de iluminação (manhã, tarde e entardecer)', () => {
    const morning = getDayLighting(0.1);
    expect(morning.phase).toBe('morning');
    expect(morning.lampsOn).toBe(false);
    expect(morning.interiorGlow).toBe(0);

    const afternoon = getDayLighting(0.5);
    expect(afternoon.phase).toBe('afternoon');
    expect(afternoon.lampsOn).toBe(false);

    const dusk = getDayLighting(0.9);
    expect(dusk.phase).toBe('dusk');
    expect(dusk.lampsOn).toBe(true);
    expect(dusk.interiorGlow).toBeGreaterThan(0);
  });

  it('converte e sombreia cores hexadecimais para primitivas de voxel', () => {
    expect(hexToNumber('#ffffff')).toBe(0xffffff);
    expect(hexToNumber(0x123456)).toBe(0x123456);

    const shaded = shadeColor(0xffffff, 0.5);
    expect(shaded).toBe(0x808080);
  });
});
