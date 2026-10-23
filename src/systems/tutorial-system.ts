/**
 * Arquivo: src/systems/tutorial-system.ts
 * O que faz: Monitora ações e estados do jogo para disparar as 15 dicas contextuais do GDD (Prompt 10) na primeira vez que cada situação ocorre.
 * Para que foi criado: Permitir micro-aprendizado suave do jogador sem interromper a fluidez da partida.
 * Como modificar/debugar: Textos e gatilhos das dicas estão centralizados em src/data/tutorial.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts
 * Conecta-se com: src/core/simulation.ts, src/ui/tutorial-view.ts
 */

import { TUTORIAL_CATALOG } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';

export function triggerTutorialTip(state: GameState, trigger: string): boolean {
  const tip = TUTORIAL_CATALOG.tips.find((t) => t.trigger === trigger);
  if (!tip) return false;

  if (state.seenTutorialTips.includes(tip.id)) return false;

  state.seenTutorialTips.push(tip.id);
  globalBus.emit('tutorial:tip_triggered', {
    tipId: tip.id,
    title: tip.title,
    message: tip.message,
  });

  return true;
}
