/**
 * Arquivo: src/render/renderer.ts
 * O que faz: Inicializa o PixiJS v8, orquestra a câmera, o contêiner do mundo 2D e atualiza as camadas gráficas a cada quadro.
 * Para que foi criado: Ponto central de renderização do jogo, mantendo a camada de desenho desacoplada da simulação.
 * Como modificar/debugar: Para adicionar novos efeitos visuais ou filtros, adicione contêineres filhos a worldContainer.
 * Importa: pixi.js, src/render/camera.ts, src/render/grid-view.ts, src/render/rooms-view.ts, src/render/patients-view.ts, src/render/ghost-view.ts
 * Conecta-se com: src/main.ts, src/core/game-loop.ts
 */

import { Application, Container } from 'pixi.js';
import { Camera } from './camera';
import { GridView } from './grid-view';
import { RoomsView } from './rooms-view';
import { PatientsView } from './patients-view';
import { GhostView } from './ghost-view';
import { THEME } from './theme-config';
import type { GameState } from '../state/game-state';
import type { RoomDefinition } from '../core/config';

export interface GhostState {
  def: RoomDefinition | null;
  col: number;
  row: number;
  rotated: boolean;
  isValid: boolean;
}

export class HospitalRenderer {
  public app = new Application();
  public camera = new Camera();
  private world = new Container();
  private gridView!: GridView;
  private roomsView!: RoomsView;
  private patientsView!: PatientsView;
  private ghostView!: GhostView;

  public async init(containerElement: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: THEME.palettes.light.background,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, THEME.maxResolution),
    });

    containerElement.appendChild(this.app.canvas);
    this.camera.resize(this.app.screen.width, this.app.screen.height);
    this.camera.centerOnGrid();

    this.gridView = new GridView();
    this.roomsView = new RoomsView();
    this.patientsView = new PatientsView();
    this.ghostView = new GhostView();

    this.world.addChild(this.gridView.container);
    this.world.addChild(this.roomsView.container);
    this.world.addChild(this.patientsView.container);
    this.world.addChild(this.ghostView.container);
    this.app.stage.addChild(this.world);

    window.addEventListener('resize', () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
    });
  }

  public render(state: GameState, ghost: GhostState, selectedRoomId: string | null): void {
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.zoom);

    this.roomsView.render(Array.from(state.rooms.values()), selectedRoomId);
    this.patientsView.render(Array.from(state.patients.values()), state.rooms);
    this.ghostView.render(ghost.def, ghost.col, ghost.row, ghost.rotated, ghost.isValid);
  }
}
