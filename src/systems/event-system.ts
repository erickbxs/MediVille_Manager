/**
 * Arquivo: src/systems/event-system.ts
 * O que faz: Simula o disparo de eventos dinâmicos (acidentes, surtos, crises e sazonais) e aplica seus efeitos no fluxo do hospital.
 * Para que foi criado: Implementar o Prompt 8 do GDD com os 12 eventos oficiais e duração em tempo real.
 * Como modificar/debugar: Ajuste intervalBetweenEventsSec em src/data/balance.json ou adicione novos eventos em events.json.
 * Importa: src/core/config.ts, src/entities/event.ts, src/state/game-state.ts, src/core/event-bus.ts, src/systems/revalida-system.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/arrival-system.ts, src/ui/event-banner.ts
 */

import { BALANCE, EVENTS_CATALOG } from '../core/config';
import type { ActiveEvent } from '../entities/event';
import type { GameState } from '../state/game-state';
import { isCalmModeFlag } from './revalida-system';
import { globalBus } from '../core/event-bus';

function spawnRandomEvent(state: GameState): void {
  if (state.activeEvents.length >= BALANCE.events.maxActiveEvents) return;

  const randomIndex = Math.floor(Math.random() * EVENTS_CATALOG.events.length);
  const def = EVENTS_CATALOG.events[randomIndex]!;
  const instanceId = `evt_${Date.now()}_${def.id}`;

  const active: ActiveEvent = {
    instanceId,
    definition: def,
    remainingSec: def.durationSec,
    elapsedSec: 0,
  };
  state.activeEvents.push(active);

  globalBus.emit('event:started', {
    eventId: def.id,
    title: def.title,
    icon: def.icon,
    description: def.description,
    durationSec: def.durationSec,
  });
}

export function updateEventSystem(state: GameState, deltaSec: number): void {
  state.eventTimerSec += deltaSec;
  const eventsAllowed = !isCalmModeFlag('disableRandomEvents');
  if (eventsAllowed && state.eventTimerSec >= BALANCE.events.intervalBetweenEventsSec) {
    state.eventTimerSec = 0;
    spawnRandomEvent(state);
  }

  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    const ev = state.activeEvents[i]!;
    ev.remainingSec -= deltaSec;
    ev.elapsedSec += deltaSec;

    if (ev.remainingSec <= 0) {
      state.activeEvents.splice(i, 1);
      globalBus.emit('event:ended', { eventId: ev.definition.id, title: ev.definition.title });
    }
  }
}

export function getActiveArrivalMultiplier(state: GameState): number {
  let mult = 1.0;
  for (const ev of state.activeEvents) {
    mult *= ev.definition.arrivalMultiplier;
  }
  return mult;
}

export function getActiveConsultationFactor(state: GameState): number {
  let factor = 1.0;
  for (const ev of state.activeEvents) {
    if (ev.definition.consultationDurationFactor) {
      factor *= ev.definition.consultationDurationFactor;
    }
  }
  return factor;
}
