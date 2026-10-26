/**
 * Arquivo: src/systems/map-expansion-system.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia o sistema de expansão progressiva paga do terreno hospitalar (12x12 -> 16x16 -> 20x20 -> 24x24),
 * calculando custos, validando saldo em caixa, atualizando o tamanho da grade no estado e emitindo o evento 'map:expanded'.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 16, permitindo que hospitais em crescimento expandam seu espaço físico ordenadamente
 * pagando valores balanceados de investimento imobiliário sem perda de salas ou progresso.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para alterar custos ou tamanhos das etapas, ajuste a tabela EXPANSION_TIERS. Para verificar permissões, use canExpandMap().
 *
 * Importa: src/state/game-state.ts, src/core/event-bus.ts, src/systems/save-system.ts
 * Conecta-se com: src/ui/build-menu.ts, src/ui/finances-modal.ts, src/render/renderer.ts, src/systems/grid-system.ts
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

export type ExpansionTier = { nextSize: number; cost: number; title: string };

export const EXPANSION_TIERS: Record<number, ExpansionTier> = {
  12: { nextSize: 16, cost: 45000, title: 'Terreno Ampliado (16x16)' },
  16: { nextSize: 20, cost: 95000, title: 'Quadra Hospitalar (20x20)' },
  20: { nextSize: 24, cost: 180000, title: 'Complexo Metropolitano (24x24)' },
};

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

export function expandMap(state: GameState): boolean {
  const next = getNextExpansion(state);
  if (!next || state.cash < next.cost) return false;

  state.cash -= next.cost;
  state.gridSize = next.nextSize;

  saveGameState(state);
  globalBus.emit('map:expanded', { newGridSize: next.nextSize, cost: next.cost });
  globalBus.emit('cash:changed', { cash: state.cash, delta: -next.cost, reason: 'Expansão de Terreno Hospitalar' });

  return true;
}
