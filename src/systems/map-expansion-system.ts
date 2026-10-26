/**
 * Arquivo: src/systems/map-expansion-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a expansão progressiva paga do terreno hospitalar (12x12 -> 16x16 -> 20x20 -> 24x24) com crescimento
 * exclusivamente para trás (fundo do lote) e para as laterais, preservando a fachada frontal e a linha da rua
 * sem sobreposição de asfalto, calculando custos, atualizando a grade e emitindo o evento 'map:expanded'.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 21, garantindo que o hospital jamais invada a avenida principal frontal
 * e que os novos lotes construíveis surjam de forma realista atrás e aos lados da unidade de saúde.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Use isTileOverlappingStreet() para validar colisões com a rua. Os custos e tamanhos estão em EXPANSION_TIERS.
 *
 * Importa: src/state/game-state.ts, src/core/event-bus.ts, src/systems/save-system.ts
 * Conecta-se com: src/ui/build-menu.ts, src/render/renderer.ts, src/render/city-environment.ts,
 *                 src/render/map-expansion-handles.ts, src/systems/grid-system.ts
 */

import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';
import { saveGameState } from './save-system';

export interface ExpansionOption {
  currentSize: number;
  nextSize: number;
  cost: number;
  title: string;
}

export const MIN_GRID_SIZE = 12;
export const MAX_GRID_SIZE = 24;
export const FRONT_STREET_ANCHOR = 'south';
const LATERAL_EXPANSION_DIVISOR = 2;

export type ExpansionTier = { nextSize: number; cost: number; title: string };

export const EXPANSION_TIERS: Record<number, ExpansionTier> = {
  12: { nextSize: 16, cost: 45000, title: 'Terreno Ampliado (16x16)' },
  16: { nextSize: 20, cost: 95000, title: 'Quadra Hospitalar (20x20)' },
  20: { nextSize: 24, cost: 180000, title: 'Complexo Metropolitano (24x24)' },
};

/**
 * Validação estrita: verifica se um tile da grade ultrapassa os limites ou sobrepõe a rua frontal.
 * A rua frontal localiza-se estritamente ao sul (row >= gridSize).
 */
export function isTileOverlappingStreet(col: number, row: number, gridSize: number = MIN_GRID_SIZE): boolean {
  return row >= gridSize || row < 0 || col < 0 || col >= gridSize;
}

export function getCurrentGridSize(state: GameState): number {
  return state.gridSize ?? MIN_GRID_SIZE;
}

export function getNextExpansion(state: GameState): ExpansionOption | null {
  const current = getCurrentGridSize(state);
  const tier = EXPANSION_TIERS[current];
  if (!tier) return null;
  return {
    currentSize: current,
    nextSize: tier.nextSize,
    cost: tier.cost,
    title: tier.title,
  };
}

export function canExpandMap(state: GameState): boolean {
  const next = getNextExpansion(state);
  if (!next) return false;
  return state.cash >= next.cost;
}

/**
 * Expande o mapa hospitalar exclusivamente para trás (fundo) e laterais:
 * - A borda frontal do terreno permanece na mesma distância da calçada e da rua.
 * - As salas existentes são transladadas preservando a posição relativa da recepção e fachada frontal.
 * - As novas linhas construíveis surgem atrás (norte) e aos lados (leste/oeste).
 */
export function expandMap(state: GameState): boolean {
  const next = getNextExpansion(state);
  if (!next || state.cash < next.cost) return false;

  const oldSize = getCurrentGridSize(state);
  const newSize = next.nextSize;
  const deltaRow = newSize - oldSize;
  const deltaCol = Math.floor((newSize - oldSize) / LATERAL_EXPANSION_DIVISOR);

  state.cash -= next.cost;
  state.gridSize = newSize;

  for (const room of state.rooms.values()) {
    room.row += deltaRow;
    room.col += deltaCol;
  }

  saveGameState(state);
  globalBus.emit('map:expanded', { newGridSize: newSize, cost: next.cost, deltaRow, deltaCol });
  globalBus.emit('cash:changed', { cash: state.cash, delta: -next.cost, reason: 'Expansão de Terreno Hospitalar' });

  return true;
}
