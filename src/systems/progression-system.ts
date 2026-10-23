/**
 * Arquivo: src/systems/progression-system.ts
 * O que faz: Gerencia a progressão e evolução da unidade de saúde (UBS -> UPA 24h -> Hospital Geral) conforme metas de pacientes atendidos e reputação do SUS.
 * Para que foi criado: Cumprir o Prompt 9 do GDD com desbloqueio gradual de setores e crescimento da complexidade do hospital.
 * Como modificar/debugar: Ajuste os limiares de treatedCount e reputation em src/data/balance.json.
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/day-system.ts, src/ui/hud.ts
 */

import { BALANCE } from '../core/config';
import { globalBus } from '../core/event-bus';
import type { GameState } from '../state/game-state';

export function checkHospitalProgression(state: GameState): boolean {
  const current = state.hospitalLevel;
  const treated = state.stats.treatedCount;
  const rep = state.reputation;

  if (current === 'ubs') {
    const upaConfig = BALANCE.progression.levels.find((l) => l.id === 'upa');
    if (upaConfig && treated >= upaConfig.minTreatedCount && rep >= upaConfig.minReputation) {
      state.hospitalLevel = 'upa';
      state.unlockedRoomIds = Array.from(new Set([...state.unlockedRoomIds, ...upaConfig.unlockedRooms]));
      globalBus.emit('progression:level_up', { levelId: 'upa', name: upaConfig.name });
      return true;
    }
  } else if (current === 'upa') {
    const hospConfig = BALANCE.progression.levels.find((l) => l.id === 'hospital');
    if (hospConfig && treated >= hospConfig.minTreatedCount && rep >= hospConfig.minReputation) {
      state.hospitalLevel = 'hospital';
      state.unlockedRoomIds = Array.from(new Set([...state.unlockedRoomIds, ...hospConfig.unlockedRooms]));
      globalBus.emit('progression:level_up', { levelId: 'hospital', name: hospConfig.name });
      return true;
    }
  }

  return false;
}
