/**
 * Arquivo: tests/revalida-difficulty.test.ts
 * O que faz: Testa os níveis Fácil/Médio/Difícil do Modo Revalida (alternativa errada riscada, texto oficial intacto,
 * alternativa riscada não pode ser escolhida e faturamento proporcional ao nível).
 * Importa: vitest, node:fs, node:path, src/systems/revalida-difficulty.ts, src/systems/revalida-system.ts,
 *          src/systems/case-system.ts, src/core/simulation.ts, src/core/event-bus.ts, src/entities/revalida-question.ts
 * Conecta-se com: public/revalida/questions.json, src/data/balance.json
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { applyDifficulty, optionSimilarity, setRevalidaDifficulty, getDifficultyRewardMultiplier } from '../src/systems/revalida-difficulty';
import { setRevalidaBank } from '../src/systems/revalida-system';
import { createPatient } from '../src/systems/case-system';
import { HospitalSimulation } from '../src/core/simulation';
import { globalBus } from '../src/core/event-bus';
import type { RevalidaQuestion } from '../src/entities/revalida-question';

const bank = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/revalida/questions.json'), 'utf8')) as { questions: RevalidaQuestion[] };

const options = [
  { id: 'q-A', text: 'Administrar atropina e monitorizar o paciente', isCorrect: true },
  { id: 'q-B', text: 'Administrar atropina e dar alta ao paciente', isCorrect: false },
  { id: 'q-C', text: 'Solicitar colonoscopia eletiva', isCorrect: false },
  { id: 'q-D', text: 'Monitorizar o paciente e administrar dopamina', isCorrect: false },
];

describe('Níveis do Modo Revalida', () => {
  afterEach(() => setRevalidaDifficulty('medio'));

  it('Difícil não risca nada', () => {
    expect(applyDifficulty(options, 'dificil').filter((o) => o.eliminated)).toHaveLength(0);
  });

  it('Fácil risca a errada mais parecida com a certa (pegadinha); Médio risca a mais óbvia', () => {
    const tricky = [...options.filter((o) => !o.isCorrect)].sort((a, b) => optionSimilarity(b.text, options[0]!.text) - optionSimilarity(a.text, options[0]!.text))[0]!;
    expect(applyDifficulty(options, 'facil').find((o) => o.eliminated)?.id).toBe(tricky.id);
    expect(applyDifficulty(options, 'medio').find((o) => o.eliminated)?.id).toBe('q-C');
  });

  it('nunca risca a certa e não muda textos nem a ordem A–D', () => {
    for (const level of ['facil', 'medio'] as const) {
      const out = applyDifficulty(options, level);
      expect(out.map((o) => o.text)).toEqual(options.map((o) => o.text));
      expect(out.find((o) => o.isCorrect)?.eliminated).toBe(false);
      expect(out.filter((o) => o.eliminated)).toHaveLength(1);
    }
  });

  it('nas questões reais, Fácil e Médio deixam 3 alternativas e a certa disponível', () => {
    setRevalidaBank(bank.questions, {});
    setRevalidaDifficulty('facil');
    const sim = new HospitalSimulation('ubs');
    for (let i = 0; i < 20; i++) {
      const p = createPatient(`p${i}`, [], 'ubs', sim.state);
      const visible = p.clinicalCase.conductOptions.filter((o) => !o.eliminated);
      expect(visible).toHaveLength(3);
      expect(visible.some((o) => o.isCorrect)).toBe(true);
    }
  });

  it('alternativa riscada não pode ser escolhida', () => {
    setRevalidaBank(bank.questions, {});
    setRevalidaDifficulty('facil');
    const sim = new HospitalSimulation('ubs');
    const p = createPatient('p_x', [], 'ubs', sim.state);
    p.state = 'ready_for_treatment';
    sim.state.patients.set(p.id, p);
    const crossed = p.clinicalCase.conductOptions.find((o) => o.eliminated)!;
    expect(sim.submitClinicalDecision(p.id, crossed.id)).toBe(false);
  });

  it('Fácil fatura menos que Difícil', () => {
    setRevalidaBank(bank.questions, {});
    const revenue = (level: 'facil' | 'dificil'): number => {
      setRevalidaDifficulty(level);
      const sim = new HospitalSimulation('ubs');
      const p = createPatient(`p_${level}`, [], 'ubs', sim.state);
      p.state = 'ready_for_treatment';
      sim.state.patients.set(p.id, p);
      let got = 0;
      const off = globalBus.on('patient:treated', ({ revenue: r }) => { got = r; });
      sim.submitClinicalDecision(p.id, p.clinicalCase.conductOptions.find((o) => o.isCorrect)!.id);
      off();
      return got;
    };
    expect(getDifficultyRewardMultiplier('facil')).toBeLessThan(getDifficultyRewardMultiplier('dificil'));
    expect(revenue('facil')).toBeLessThan(revenue('dificil'));
  });
});
