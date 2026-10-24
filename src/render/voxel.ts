/**
 * Arquivo: src/render/voxel.ts
 *
 * 1. O que este arquivo faz?
 * Primitivas procedurais 2.5D (estilo voxel/oblíquo de cima): blocos extrudados com face superior e face frontal,
 * sombra projetada suave e utilitários de cor (hex → número, escurecer/clarear).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Toda a geometria do mapa (paredes, móveis, árvores, ambulância) é gerada 100% com PIXI.Graphics para manter o
 * bundle abaixo de 2 MB, sem sprites ou texturas externas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para mudar a "altura aparente" dos objetos, ajuste o parâmetro h de drawBlock(). Para sombras mais fortes,
 * altere SHADOW_ALPHA. As funções de cor são puras e cobertas em tests/render-3d.test.ts.
 *
 * Importa: pixi.js (tipo Graphics)
 * Conecta-se com: src/render/furniture-factory.ts, src/render/room-renderer-3d.ts, src/render/city-environment.ts
 */

import type { Graphics } from 'pixi.js';

const SHADOW_ALPHA = 0.16;
const SHADOW_COLOR = 0x0f172a;
const OUTLINE_COLOR = 0x1e293b;

export function hexToNumber(color: string | number): number {
  if (typeof color === 'number') return color;
  const parsed = Number.parseInt(color.replace('#', ''), 16);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** factor < 1 escurece, factor > 1 clareia (mistura com branco). */
export function shadeColor(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const apply = (c: number): number => {
    const v = factor <= 1 ? c * factor : c + (255 - c) * (factor - 1);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  return (apply(r) << 16) | (apply(g) << 8) | apply(b);
}

export function drawShadow(g: Graphics, x: number, y: number, w: number, d: number, offset = 3): void {
  g.roundRect(x + offset, y + offset, w, d, 2).fill({ color: SHADOW_COLOR, alpha: SHADOW_ALPHA });
}

/**
 * Bloco 2.5D: pegada (x, y, w, d) no piso, elevado h pixels.
 * Face frontal = cor escurecida; face superior = cor base.
 */
export function drawBlock(g: Graphics, x: number, y: number, w: number, d: number, h: number, color: number, shadow = true): void {
  if (shadow) drawShadow(g, x, y, w, d);
  g.rect(x, y + d - h, w, h).fill({ color: shadeColor(color, 0.72) });
  g.rect(x, y - h, w, d).fill({ color }).stroke({ color: OUTLINE_COLOR, width: 0.6, alpha: 0.25 });
}

/** Bloco centrado em (cx, cy). */
export function drawBlockCentered(g: Graphics, cx: number, cy: number, w: number, d: number, h: number, color: number, shadow = true): void {
  drawBlock(g, cx - w / 2, cy - d / 2, w, d, h, color, shadow);
}
