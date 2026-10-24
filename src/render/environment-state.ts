/**
 * Arquivo: src/render/environment-state.ts
 *
 * 1. O que este arquivo faz?
 * Funções puras que traduzem o estado da simulação em parâmetros visuais: alerta da ambulância SAMU
 * (eventos 'accident' e 'epidemic'), nível das prateleiras da farmácia conforme o estoque RENAME e a
 * iluminação do ciclo diurno (manhã, tarde e fim do expediente).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Manter as regras de "como o mundo reage" testáveis no Vitest sem PixiJS, e garantir que o render apenas leia
 * o estado (desacoplamento simulação ↔ render exigido pelo GDD).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ajuste as faixas de horário em LIGHT_PHASES ou os tipos de evento em ALERT_EVENT_TYPES.
 * Se as prateleiras não esvaziarem, confira getPharmacyStockRatio() com os valores de pharmacy.json.
 *
 * Importa: src/entities/event.ts (tipo)
 * Conecta-se com: src/render/renderer.ts, src/render/city-environment.ts, src/render/day-lighting-view.ts,
 *                 src/render/furniture-factory.ts, tests/render-3d.test.ts
 */

import type { ActiveEvent } from '../entities/event';

const ALERT_EVENT_TYPES = new Set(['accident', 'epidemic']);

export function isAmbulanceAlertActive(activeEvents: ReadonlyArray<Pick<ActiveEvent, 'definition'>>): boolean {
  return activeEvents.some((ev) => ALERT_EVENT_TYPES.has(ev.definition.type));
}

/** Razão 0..1 entre o estoque atual total e o estoque inicial total do catálogo RENAME. */
export function getPharmacyStockRatio(stock: Record<string, number>, initialStock: Record<string, number>): number {
  let current = 0;
  let initial = 0;
  for (const [id, base] of Object.entries(initialStock)) {
    initial += base;
    current += Math.max(0, stock[id] ?? 0);
  }
  if (initial <= 0) return 0;
  return Math.max(0, Math.min(1, current / initial));
}

/** Quantidade de caixas desenhadas na estante (0 quando o estoque zerou). */
export function getShelfBoxCount(ratio: number, maxBoxes: number): number {
  if (ratio <= 0) return 0;
  return Math.max(1, Math.round(Math.min(1, ratio) * maxBoxes));
}

export interface DayLighting {
  phase: 'morning' | 'afternoon' | 'dusk';
  overlayColor: number;
  overlayAlpha: number;
  interiorGlow: number;
  lampsOn: boolean;
}

const MORNING_END = 0.4;
const AFTERNOON_END = 0.75;
const WARM_COLOR = 0xffb347;
const DUSK_COLOR = 0x2e1f5e;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getDayLighting(dayProgress: number): DayLighting {
  const p = Math.max(0, Math.min(1, dayProgress));
  if (p < MORNING_END) {
    return { phase: 'morning', overlayColor: 0xfff8e1, overlayAlpha: 0.02, interiorGlow: 0, lampsOn: false };
  }
  if (p < AFTERNOON_END) {
    const t = (p - MORNING_END) / (AFTERNOON_END - MORNING_END);
    return { phase: 'afternoon', overlayColor: WARM_COLOR, overlayAlpha: lerp(0.03, 0.1, t), interiorGlow: 0, lampsOn: false };
  }
  const t = (p - AFTERNOON_END) / (1 - AFTERNOON_END);
  return {
    phase: 'dusk',
    overlayColor: DUSK_COLOR,
    overlayAlpha: lerp(0.1, 0.32, t),
    interiorGlow: lerp(0.08, 0.3, t),
    lampsOn: true,
  };
}
