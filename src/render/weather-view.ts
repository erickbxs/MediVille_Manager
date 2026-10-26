/**
 * Arquivo: src/render/weather-view.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza efeitos climáticos e sazonais sincronizados com eventos ativos da simulação:
 * - Chuva / Surto de Dengue / Inverno: gotas diagonais suaves e poças reflexivas no asfalto.
 * - Onda de Calor / Verão: iluminação solar vibrante e brilho dourado suave.
 * - Carnaval / Feriado: bandeirolas festivas coloridas nas vias públicas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 19, conectando os surtos epidemiológicos e eventos do SUS ao ambiente externo 2.5D.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O clima é detectado reativamente via detectWeather(events). A animação de chuva é calculada com timeSec.
 *
 * Importa: pixi.js, src/entities/event.ts, src/render/theme-config.ts
 * Conecta-se com: src/render/renderer.ts, tests/fatigue-weather-balance-and-6langs.test.ts
 */

import { Container, Graphics } from 'pixi.js';
import type { ActiveEvent } from '../entities/event';
import { THEME } from './theme-config';

export type WeatherType = 'rain' | 'sunny' | 'festive' | 'clear';

export function detectWeather(activeEvents: ActiveEvent[]): WeatherType {
  for (const ev of activeEvents) {
    const text = `${ev.definition.id} ${ev.definition.title} ${ev.definition.description}`.toLowerCase();
    if (text.includes('dengue') || text.includes('chuva') || text.includes('inverno') || text.includes('gripe')) {
      return 'rain';
    }
    if (text.includes('calor') || text.includes('verao') || text.includes('verão') || text.includes('seca')) {
      return 'sunny';
    }
    if (text.includes('carnaval') || text.includes('feriado') || text.includes('festa')) {
      return 'festive';
    }
  }
  return 'clear';
}

export class WeatherView {
  public container = new Container();
  private gfx = new Graphics();
  private currentWeather: WeatherType = 'clear';

  constructor() {
    this.container.addChild(this.gfx);
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  public render(activeEvents: ActiveEvent[], gridSize = 12, timeSec = 0): void {
    this.currentWeather = detectWeather(activeEvents);
    this.gfx.clear();

    const worldWidth = gridSize * THEME.tileSize;
    const worldHeight = gridSize * THEME.tileSize;

    if (this.currentWeather === 'rain') {
      this.renderRain(worldWidth, worldHeight, timeSec);
    } else if (this.currentWeather === 'sunny') {
      this.renderSunny(worldWidth, worldHeight);
    } else if (this.currentWeather === 'festive') {
      this.renderFestive(worldWidth, worldHeight, timeSec);
    }
  }

  private renderRain(width: number, height: number, timeSec: number): void {
    const dropCount = 45;
    for (let i = 0; i < dropCount; i += 1) {
      const seedX = (i * 73) % (width + 120) - 60;
      const speed = 250 + (i % 5) * 40;
      const y = ((timeSec * speed + i * 45) % (height + 100)) - 50;
      const x = seedX - (y * 0.25);

      this.gfx.moveTo(x, y)
        .lineTo(x - 3, y + 8)
        .stroke({ color: 0x93c5fd, width: 1.2, alpha: 0.5 });
    }

    // Poças reflexivas na calçada / asfalto
    const puddleY = height + 15;
    this.gfx.ellipse(width * 0.2, puddleY, 14, 4).fill({ color: 0x60a5fa, alpha: 0.2 });
    this.gfx.ellipse(width * 0.5, puddleY + 5, 20, 5).fill({ color: 0x60a5fa, alpha: 0.25 });
    this.gfx.ellipse(width * 0.8, puddleY, 16, 4).fill({ color: 0x60a5fa, alpha: 0.2 });
  }

  private renderSunny(width: number, height: number): void {
    this.gfx.rect(-100, -100, width + 200, height + 200).fill({ color: 0xfef08a, alpha: 0.08 });
  }

  private renderFestive(width: number, height: number, timeSec: number): void {
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899];
    const poleY = height + 10;
    const wave = Math.sin(timeSec * 3) * 2;

    for (let i = 0; i < 6; i += 1) {
      const bx = (width / 5) * i;
      const col = colors[i % colors.length]!;
      this.gfx.poly([bx, poleY, bx + 10, poleY + wave, bx + 5, poleY + 8 + wave])
        .fill({ color: col, alpha: 0.9 });
    }
  }
}
