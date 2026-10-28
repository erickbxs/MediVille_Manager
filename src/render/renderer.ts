/**
 * Arquivo: src/render/renderer.ts
 *
 * 1. O que este arquivo faz?
 * Inicializa o PixiJS v8 e orquestra as camadas do mundo com Y-sorting: entorno urbano,
 * laje da grade, salas 2.5D, animações médicas ativas por setor (WORKING), iluminação diurna,
 * clima sazonal sincronizado com eventos (chuva, sol, carnaval), pacientes e fantasma de obra.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Ponto central de renderização, apenas LÊ o GameState (nunca o altera), mantendo o desacoplamento
 * simulação ↔ render com estética premium estilo Two Point Hospital.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para mudar a ordem de profundidade, ajuste LAYER_Z. As animações médicas são tratadas em MedicalAnimationsView
 * e os efeitos de clima em WeatherView.
 *
 * Importa: pixi.js, src/core/config.ts, src/render/camera.ts, src/render/grid-view.ts,, src/render/neighborhood-view.ts
 *          src/render/room-renderer-3d.ts, src/render/patients-view.ts, src/render/ghost-view.ts,
 *          src/render/city-environment.ts, src/render/day-lighting-view.ts, src/render/environment-state.ts,
 *          src/render/medical-animations.ts, src/render/weather-view.ts
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
import { globalBus } from '../core/event-bus';
import { MapExpansionHandles } from './map-expansion-handles';
import { UrbanLifeView } from './urban-life-view';
import { urbanLifeSystem } from '../systems/urban-life-system';
import { MedicalAnimationsView } from './medical-animations';
import { WeatherView } from './weather-view';
import { HeatmapOverlay } from './heatmap-overlay';
import { NeighborhoodView } from './neighborhood-view';
import type { ExpansionTier } from '../systems/map-expansion-system';

export interface GhostState {
  def: RoomDefinition | null;
  col: number;
  row: number;
  rotated: boolean;
  isValid: boolean;
  touchOffsetY?: number;
}

export interface HospitalRendererCallbacks {
  onExpandMap?: (tier: ExpansionTier) => void;
}

const LAYER_Z = {
  city: 0,
  neighborhood: 1,
  urban: 3,
  traffic: 5,
  grid: 10,
  handles: 15,
  rooms: 20,
  medical: 25,
  lighting: 30,
  weather: 35,
  patients: 40,
  heatmap: 45,
  ghost: 50,
};

const INITIAL_STOCK: Record<string, number> = Object.fromEntries(
  PHARMACY_CATALOG.medications.map((m) => [m.id, m.initialStock])
);

export class HospitalRenderer {
  public app = new Application();
  public camera = new Camera();
  public heatmapOverlay!: HeatmapOverlay;
  private world = new Container();
  private callbacks?: HospitalRendererCallbacks;
  private cityEnv!: CityEnvironment;
  private gridView!: GridView;
  private expansionHandles!: MapExpansionHandles;
  private roomsView!: RoomRenderer3D;
  private medicalAnimView!: MedicalAnimationsView;
  private lightingView!: DayLightingView;
  private weatherView!: WeatherView;
  private trafficView!: TrafficView;
  private urbanLifeView!: UrbanLifeView;
  private neighborhoodView!: NeighborhoodView;
  private patientsView!: PatientsView;
  private ghostView!: GhostView;
  private lastTime = performance.now();

  constructor(callbacks?: HospitalRendererCallbacks) {
    this.callbacks = callbacks;
  }

  public async init(containerElement: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: containerElement,
      backgroundColor: 0x86c96b,
      antialias: true,
      autoDensity: true,
      roundPixels: true,
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

    globalBus.on('map:expanded', ({ newGridSize }: { newGridSize: number }) => {
      this.camera.setGridSize(newGridSize);
      this.gridView.updateSize(newGridSize);
      this.cityEnv.updateGridSize(newGridSize);
      this.neighborhoodView.updateGridSize(newGridSize);
      urbanLifeSystem.updateGridSize(newGridSize);
      this.camera.fitMapToScreen();
    });
  }

  public recenter(): void {
    this.camera.resize(this.app.screen.width, this.app.screen.height);
    this.camera.fitMapToScreen();
  }

  public getWeatherView(): WeatherView {
    return this.weatherView;
  }

  public getMedicalAnimView(): MedicalAnimationsView {
    return this.medicalAnimView;
  }

  private createLayers(): void {
    this.cityEnv = new CityEnvironment();
    this.neighborhoodView = new NeighborhoodView();
    this.urbanLifeView = new UrbanLifeView();
    this.trafficView = new TrafficView();
    this.gridView = new GridView();
    this.expansionHandles = new MapExpansionHandles({
      onExpand: (tier) => this.callbacks?.onExpandMap?.(tier),
    });
    this.roomsView = new RoomRenderer3D();
    this.medicalAnimView = new MedicalAnimationsView();
    this.lightingView = new DayLightingView();
    this.weatherView = new WeatherView();
    this.patientsView = new PatientsView();
    this.heatmapOverlay = new HeatmapOverlay();
    this.ghostView = new GhostView();

    this.setupLayerIndices();
    this.world.addChild(
      this.cityEnv.container, this.neighborhoodView.container, this.urbanLifeView.container, this.trafficView.container,
      this.gridView.container, this.expansionHandles.container, this.roomsView.container,
      this.medicalAnimView.container, this.lightingView.container, this.weatherView.container,
      this.patientsView.container, this.heatmapOverlay.container, this.ghostView.container,
    );
  }

  private setupLayerIndices(): void {
    this.world.sortableChildren = true;
    this.cityEnv.container.zIndex = LAYER_Z.city;
    this.neighborhoodView.container.zIndex = LAYER_Z.neighborhood;
    this.urbanLifeView.container.zIndex = LAYER_Z.urban;
    this.trafficView.container.zIndex = LAYER_Z.traffic;
    this.gridView.container.zIndex = LAYER_Z.grid;
    this.expansionHandles.container.zIndex = LAYER_Z.handles;
    this.roomsView.container.zIndex = LAYER_Z.rooms;
    this.medicalAnimView.container.zIndex = LAYER_Z.medical;
    this.lightingView.container.zIndex = LAYER_Z.lighting;
    this.weatherView.container.zIndex = LAYER_Z.weather;
    this.patientsView.container.zIndex = LAYER_Z.patients;
    this.heatmapOverlay.container.zIndex = LAYER_Z.heatmap;
    this.ghostView.container.zIndex = LAYER_Z.ghost;
  }

  public render(state: GameState, ghost: GhostState, selectedRoomId: string | null): void {
    const currentGrid = state.gridSize ?? BALANCE.grid.cols;
    if (this.camera.gridCols !== currentGrid) {
      this.camera.setGridSize(currentGrid);
      this.gridView.updateSize(currentGrid);
    }
    this.world.position.set(this.camera.x, this.camera.y);
    this.world.scale.set(this.camera.zoom);

    const now = performance.now();
    const deltaSec = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    urbanLifeSystem.update(state.speed === 0 ? 0 : deltaSec * state.speed);

    const rooms = Array.from(state.rooms.values());
    const stockRatio = getPharmacyStockRatio(state.pharmacyStock, INITIAL_STOCK);
    const dayProgress = state.dayTimeSec / BALANCE.time.dayDurationSec;
    const isNight = dayProgress > 0.75 || dayProgress < 0.2;
    const isPowerCrisis = state.activeEvents.some(
      (e) =>
        e.definition.id.includes('blackout') ||
        e.definition.id.includes('power') ||
        e.definition.type === 'crisis'
    );

    this.cityEnv.update(isAmbulanceAlertActive(state.activeEvents), now);
    this.urbanLifeView.render(urbanLifeSystem, now / 1000);
    this.neighborhoodView.update(now / 1000, isNight, state.speed === 0);
    this.trafficView.render(trafficSystem.vehicles, state.dayTimeSec, isNight);
    this.roomsView.render(rooms, selectedRoomId, stockRatio);
    this.medicalAnimView.render(rooms, state.patients, now / 1000);
    this.expansionHandles.update(state);
    this.lightingView.render(dayProgress, rooms);
    this.weatherView.render(state.activeEvents, currentGrid, now / 1000);
    this.patientsView.render(state);
    this.heatmapOverlay.render(rooms, state, isPowerCrisis);
    this.ghostView.render(ghost.def, ghost.col, ghost.row, ghost.rotated, ghost.isValid, ghost.touchOffsetY ?? 0);
  }


  public getPatientsView(): PatientsView {
    return this.patientsView;
  }
}

