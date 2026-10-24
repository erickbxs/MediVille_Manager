/**
 * Arquivo: src/render/renderer.ts
 *
 * 1. O que este arquivo faz?
 * Inicializa o PixiJS v8 e orquestra as camadas do mundo com Y-sorting (sortableChildren): entorno urbano,
 * laje da grade, salas 2.5D em corte, iluminação diurna, pacientes/indicadores e fantasma de construção.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Ponto central de renderização, apenas LÊ o GameState (nunca o altera), mantendo o desacoplamento
 * simulação ↔ render. Deriva do estado: progresso do dia, alerta SAMU e razão de estoque RENAME.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para mudar a ordem de profundidade, ajuste LAYER_Z. Para novas camadas, crie um Container e adicione em init().
 * Se a ambulância não piscar, confira isAmbulanceAlertActive(state.activeEvents).
 *
 * Importa: pixi.js, src/core/config.ts, src/render/camera.ts, src/render/grid-view.ts,
 *          src/render/room-renderer-3d.ts, src/render/patients-view.ts, src/render/ghost-view.ts,
 *          src/render/city-environment.ts, src/render/day-lighting-view.ts, src/render/environment-state.ts
 * Conecta-se com: src/main.ts, src/core/game-loop.ts
 */

import { Application, Container } from 'pixi.js';
import { Camera } from './camera';
import { GridView } from './grid-view';
import { RoomRenderer3D } from './room-renderer-3d';
import { PatientsView } from './patients-view';
import { GhostView } from './ghost-view';
import { CityEnvironment } from './city-environment';
import { DayLightingView } from './day-lighting-view';
import { getPharmacyStockRatio, isAmbulanceAlertActive } from './environment-state';
import { TrafficView } from './traffic-view';
import { trafficSystem } from '../systems/traffic-system';
import { THEME } from './theme-config';
import { BALANCE, PHARMACY_CATALOG, type RoomDefinition } from '../core/config';
import type { GameState } from '../state/game-state';

export interface GhostState {
  def: RoomDefinition | null;
  col: number;
  row: number;
  rotated: boolean;
  isValid: boolean;
}

const LAYER_Z = { city: 0, traffic: 5, grid: 10, rooms: 20, lighting: 30, patients: 40, ghost: 50 };

const INITIAL_STOCK: Record<string, number> = Object.fromEntries(
  PHARMACY_CATALOG.medications.map((m) => [m.id, m.initialStock])
);

export class HospitalRenderer {
  public app = new Application();
  public camera = new Camera();
  private world = new Container();
  private cityEnv!: CityEnvironment;
  private gridView!: GridView;
  private roomsView!: RoomRenderer3D;
  private lightingView!: DayLightingView;
  private trafficView!: TrafficView;
  private patientsView!: PatientsView;
  private ghostView!: GhostView;

  public async init(containerElement: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: 0x86c96b,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, THEME.maxResolution),
    });

    containerElement.appendChild(this.app.canvas);
    this.camera.resize(this.app.screen.width, this.app.screen.height);
    this.camera.fitMapToScreen();
    this.createLayers();
    this.app.stage.addChild(this.world);

    const onResize = () => {
      this.camera.resize(this.app.screen.width, this.app.screen.height);
      this.camera.fitMapToScreen();
    };

    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => onResize());
      observer.observe(containerElement);
    }
  }

  public recenter(): void {
    this.camera.resize(this.app.screen.width, this.app.screen.height);
    this.camera.fitMapToScreen();
  }

  private createLayers(): void {
    this.cityEnv = new CityEnvironment();
    this.trafficView = new TrafficView();
    this.gridView = new GridView();
    this.roomsView = new RoomRenderer3D();
    this.lightingView = new DayLightingView();
    this.patientsView = new PatientsView();
    this.ghostView = new GhostView();

    this.world.sortableChildren = true;
    this.cityEnv.container.zIndex = LAYER_Z.city;
    this.trafficView.container.zIndex = LAYER_Z.traffic;
    this.gridView.container.zIndex = LAYER_Z.grid;
    this.roomsView.container.zIndex = LAYER_Z.rooms;
    this.lightingView.container.zIndex = LAYER_Z.lighting;
    this.patientsView.container.zIndex = LAYER_Z.patients;
    this.ghostView.container.zIndex = LAYER_Z.ghost;
    this.world.addChild(
      this.cityEnv.container, this.trafficView.container, this.gridView.container,
      this.roomsView.container, this.lightingView.container, this.patientsView.container,
      this.ghostView.container,
    );
  }

  public render(state: GameState, ghost: GhostState, selectedRoomId: string | null): void {
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.zoom);

    const rooms = Array.from(state.rooms.values());
    const stockRatio = getPharmacyStockRatio(state.pharmacyStock, INITIAL_STOCK);
    const dayProgress = state.dayTimeSec / BALANCE.time.dayDurationSec;
    const isNight = dayProgress > 0.75 || dayProgress < 0.2;

    this.cityEnv.update(isAmbulanceAlertActive(state.activeEvents), performance.now());
    this.trafficView.render(trafficSystem.vehicles, state.dayTimeSec, isNight);
    this.roomsView.render(rooms, selectedRoomId, stockRatio);
    this.lightingView.render(dayProgress, rooms);
    this.patientsView.render(state);
    this.ghostView.render(ghost.def, ghost.col, ghost.row, ghost.rotated, ghost.isValid);
  }
}
