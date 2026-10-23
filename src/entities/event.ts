/**
 * Arquivo: src/entities/event.ts
 * O que faz: Representa a entidade de um evento dinâmico em andamento (acidente, epidemia, crise ou evento sazonal).
 * Para que foi criado: Permitir que o hospital responda a picos de demanda e crises temporárias conforme o GDD (Prompt 8).
 * Como modificar/debugar: Caso queira novos efeitos nos eventos, estenda a interface ActiveEvent e GameEventDefinition.
 * Importa: src/core/config.ts
 * Conecta-se com: src/systems/event-system.ts, src/ui/event-banner.ts
 */

import type { GameEventDefinition } from '../core/config';

export interface ActiveEvent {
  instanceId: string;
  definition: GameEventDefinition;
  remainingSec: number;
  elapsedSec: number;
}

export function isEventExpired(event: ActiveEvent): boolean {
  return event.remainingSec <= 0;
}
