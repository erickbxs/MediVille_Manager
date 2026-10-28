/**
 * Arquivo: tests/report-pending-fixes.test.ts
 * O que faz: Testa as correções pendentes do relatório da v2.2.0 feitas na v3.1.0 (modo antigo e polimento):
 * filtro de categorias da Enciclopédia, título do caso sem o tratamento, remédio relacionado à conduta,
 * metas de estudo e "Fila Zero" e primeiro evento aleatório adiado.
 * Importa: vitest, src/ui/encyclopedia-modal.ts, src/ui/decision-modal.ts, src/core/config.ts,
 *          src/core/new-game.ts, src/systems/goals-system.ts
 * Conecta-se com: src/data/cases.json, src/data/balance.json
 */

import { describe, it, expect } from 'vitest';
import { startsAnyWord } from '../src/ui/encyclopedia-modal';
import { displayCaseName, findCaseMedication } from '../src/ui/decision-modal';
import { BALANCE, CASES_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { goalsSystem } from '../src/systems/goals-system';

describe('Enciclopédia — categorias', () => {
  it('"ist" só conta no começo de palavra (não pega cistite, autista ou sistêmico)', () => {
    expect(startsAnyWord('cistite aguda', 'ist')).toBe(false);
    expect(startsAnyWord('transtorno do espectro autista', 'ist')).toBe(false);
    expect(startsAnyWord('lupus eritematoso sistemico', 'ist')).toBe(false);
    expect(startsAnyWord('ists e tropicais', 'ist')).toBe(true);
  });
});

describe('Atendimento — título e remédio do caso', () => {
  it('remove do título o parêntese que repete o tratamento', () => {
    const name = displayCaseName('Hipocalemia Moderada a Grave (Reposição de Cloreto de Potássio)', 'Reposição intravenosa lenta de Cloreto de Potássio diluído');
    expect(name).toBe('Hipocalemia Moderada a Grave');
    expect(displayCaseName('Síndrome Gripal (Influenza)', 'Oseltamivir e sintomáticos')).toBe('Síndrome Gripal (Influenza)');
  });

  it('nenhum caso mostra no título uma palavra do tratamento entre parênteses', () => {
    for (const c of CASES_CATALOG.cases) {
      const shown = displayCaseName(c.name, c.suggestedConduct.text);
      const inner = shown.match(/\(([^)]*)\)/g)?.join(' ').toLowerCase() ?? '';
      const words = c.suggestedConduct.text.toLowerCase().split(/[^a-zà-ú]+/).filter((w) => w.length >= 5);
      expect(words.some((w) => inner.split(/[^a-zà-ú]+/).includes(w))).toBe(false);
    }
  });

  it('só mostra remédio da farmácia quando a conduta cita esse remédio', () => {
    expect(findCaseMedication('Reposição intravenosa lenta de Cloreto de Potássio')).toBeNull();
    expect(findCaseMedication('Prescrever paracetamol se febre')?.id).toBe('paracetamol');
  });
});

describe('Metas e primeiros dias', () => {
  it('"Fila Zero" exige pelo menos 10 atendimentos', () => {
    const goal = goalsSystem.getGoals().find((g) => g.id === 'clear_queue')!;
    expect(goal.target).toBeGreaterThanOrEqual(10);
    const state = createInitialGameState('ubs');
    state.stats.treatedCount = 1;
    expect(goalsSystem.checkGoals(state)).toBe(0);
  });

  it('primeiro evento aleatório só depois de 3 dias de jogo', () => {
    expect(BALANCE.events.firstEventDelaySec).toBeGreaterThanOrEqual(BALANCE.time.dayDurationSec * 3);
  });
});
