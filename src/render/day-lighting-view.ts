/**
 * Arquivo: src/render/day-lighting-view.ts
 *
 * 1. O que este arquivo faz?
 * Aplica a iluminação dinâmica do ciclo diário sobre o mapa: luz fresca pela manhã, tom quente à tarde e
 * entardecer no fim do expediente, acendendo o brilho dos postes externos e a luz interna das salas construídas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Conectar visualmente o relógio do dia (day-system.ts → state.dayTimeSec) ao mapa, reforçando a sensação de
 * turno de trabalho sem afetar a simulação. Redesenha somente quando a fase/intensidade muda (cache por chave).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * As faixas e cores vêm de getDayLighting() (environment-state.ts). Se a tela ficar escura demais, reduza
 * overlayAlpha lá. Se o brilho não acender, verifique lampsOn e LAMP_POSITIONS (city-environment.ts).
 *
 * Importa: pixi.js, src/render/environment-state.ts, src/render/city-environment.ts, src/render/room-layout.ts,
 *          src/render/theme-config.ts, src/entities/room.ts
 * Conecta-se com: src/render/renderer.ts
 */

import { Container, Graphics } from 'pixi.js';
import type { RoomInstance } from '../entities/room';
import { getDayLighting } from './environment-state';
import { LAMP_POSITIONS } from './city-environment';
import { getRoomPixelRect } from './room-layout';
import { THEME } from './theme-config';

const OVERLAY_EXTENT = 2400;

export class DayLightingView {
  public container = new Container();
  private overlay = new Graphics();
  private glows = new Graphics();
  private lastKey = '';

  constructor() {
    this.container.addChild(this.overlay);
    this.container.addChild(this.glows);
    this.container.eventMode = 'none';
  }

  public render(dayProgress: number, rooms: RoomInstance[]): void {
    const light = getDayLighting(dayProgress);
    const roomsKey = rooms.map((r) => `${r.col},${r.row},${r.width},${r.height}`).join(';');
    const key = `${light.phase}|${light.overlayAlpha.toFixed(2)}|${light.interiorGlow.toFixed(2)}|${roomsKey}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.overlay.clear();
    this.overlay.rect(-OVERLAY_EXTENT, -OVERLAY_EXTENT, OVERLAY_EXTENT * 2.5, OVERLAY_EXTENT * 2.5)
      .fill({ color: light.overlayColor, alpha: light.overlayAlpha });

    this.glows.clear();
    if (light.interiorGlow > 0) {
      for (const room of rooms) {
        const r = getRoomPixelRect(room, THEME.tileSize);
        this.glows.rect(r.x + 5, r.y + 5, r.w - 10, r.h - 10).fill({ color: 0xffe9a8, alpha: light.interiorGlow });
      }
    }
    if (light.lampsOn) {
      for (const lamp of LAMP_POSITIONS) {
        this.glows.circle(lamp.x + 9, lamp.y - 30, 30).fill({ color: 0xfde68a, alpha: 0.28 });
        this.glows.circle(lamp.x + 9, lamp.y - 30, 12).fill({ color: 0xfffbeb, alpha: 0.6 });
      }
    }
  }
}
