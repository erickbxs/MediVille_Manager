/**
 * Arquivo: src/core/game-loop.ts
 * O que faz: Executa o laço principal desacoplado (simulação em passos fixos de tempo e renderização fluida via requestAnimationFrame).
 * Para que foi criado: Garantir estabilidade e determinismo físico/econômico mesmo em aparelhos com oscilação de taxa de quadros (30 a 60 fps).
 * Como modificar/debugar: Parâmetros fixedStepSec e maxFrameDeltaSec são lidos de src/data/balance.json.
 * Importa: src/core/config.ts, src/core/simulation.ts
 * Conecta-se com: src/main.ts, src/render/renderer.ts
 */

import { BALANCE } from './config';
import type { HospitalSimulation } from './simulation';

export type RenderCallback = (interpolationAlpha: number) => void;

export class GameLoop {
  private simulation: HospitalSimulation;
  private onRender: RenderCallback;
  private running = false;
  private lastTimeMs = 0;
  private accumulatorSec = 0;
  private animationFrameId: number | null = null;

  constructor(simulation: HospitalSimulation, onRender: RenderCallback) {
    this.simulation = simulation;
    this.onRender = onRender;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimeMs = performance.now();
    this.accumulatorSec = 0;
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTimeMs: number): void {
    if (!this.running) return;

    const frameDeltaSec = Math.min(
      (currentTimeMs - this.lastTimeMs) / 1000,
      BALANCE.time.maxFrameDeltaSec
    );
    this.lastTimeMs = currentTimeMs;
    this.accumulatorSec += frameDeltaSec;

    const fixedStep = BALANCE.time.fixedStepSec;
    while (this.accumulatorSec >= fixedStep) {
      this.simulation.step(fixedStep);
      this.accumulatorSec -= fixedStep;
    }

    const alpha = this.accumulatorSec / fixedStep;
    this.onRender(alpha);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
