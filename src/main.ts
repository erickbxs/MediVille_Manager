/**
 * Arquivo: src/main.ts
 * O que faz: Ponto de entrada da aplicação: inicializa a simulação, renderizador PixiJS, HUD, dock de construção, modais e laço de jogo.
 * Para que foi criado: Integrar os subsistemas mantendo o desacoplamento arquitetural exigido pelo GDD.
 * Como modificar/debugar: Caso precise de novas conexões entre UI e simulação, registre os ouvintes no globalBus aqui.
 * Importa: src/core/*, src/render/*, src/ui/*, src/input/*, src/systems/*
 * Conecta-se com: index.html
 */

import { HospitalSimulation } from './core/simulation';
import { GameLoop } from './core/game-loop';
import { HospitalRenderer, type GhostState } from './render/renderer';
import { HospitalHUD } from './ui/hud';
import { BuildMenu } from './ui/build-menu';
import { DecisionModal } from './ui/decision-modal';
import { AdvisorView } from './ui/advisor-view';
import { DefeatModal } from './ui/defeat-modal';
import { CanvasInputManager } from './input/canvas-input';
import { globalBus } from './core/event-bus';
import { canPlaceRoom } from './systems/grid-system';
import type { RoomDefinition } from './core/config';

class MediVilleApp {
  private simulation = new HospitalSimulation();
  private renderer = new HospitalRenderer();
  private gameLoop!: GameLoop;
  private hud!: HospitalHUD;
  private decisionModal!: DecisionModal;
  private advisorView!: AdvisorView;
  private defeatModal!: DefeatModal;
  private ghost: GhostState = { def: null, col: 0, row: 0, rotated: false, isValid: false };
  private isDemolishMode = false;
  private selectedRoomId: string | null = null;

  public async start(): Promise<void> {
    const canvasContainer = document.getElementById('game-canvas-container')!;
    await this.renderer.init(canvasContainer);

    this.hud = new HospitalHUD(document.getElementById('hud-container')!, this.simulation);
    this.decisionModal = new DecisionModal(document.getElementById('modal-container')!, this.simulation);
    this.advisorView = new AdvisorView(document.getElementById('advisor-container')!);
    this.defeatModal = new DefeatModal(document.getElementById('modal-container')!);

    new BuildMenu(document.getElementById('build-menu-container')!, {
      onSelectRoom: (def: RoomDefinition) => this.selectRoomToBuild(def),
      onToggleRotate: () => this.toggleRotate(),
      onToggleDemolish: () => this.toggleDemolish(),
      onCancelSelection: () => this.cancelSelection(),
    });

    this.setupInput(canvasContainer);
    this.setupEventSubscriptions();

    this.gameLoop = new GameLoop(this.simulation, () => {
      this.renderer.render(this.simulation.state, this.ghost, this.selectedRoomId);
    });
    this.gameLoop.start();
  }

  private selectRoomToBuild(def: RoomDefinition): void {
    this.isDemolishMode = false;
    this.ghost.def = def;
    this.ghost.isValid = canPlaceRoom(this.simulation.state, def.id, this.ghost.col, this.ghost.row, this.ghost.rotated);
  }

  private toggleRotate(): void {
    this.ghost.rotated = !this.ghost.rotated;
    if (this.ghost.def) {
      this.ghost.isValid = canPlaceRoom(this.simulation.state, this.ghost.def.id, this.ghost.col, this.ghost.row, this.ghost.rotated);
    }
  }

  private toggleDemolish(): void {
    this.isDemolishMode = !this.isDemolishMode;
    this.ghost.def = null;
  }

  private cancelSelection(): void {
    this.ghost.def = null;
    this.isDemolishMode = false;
    this.selectedRoomId = null;
  }

  private setupInput(canvasContainer: HTMLElement): void {
    new CanvasInputManager(canvasContainer, this.renderer.camera, {
      onGridClick: (col, row) => this.handleGridClick(col, row),
      onGridHover: (col, row) => this.handleGridHover(col, row),
      onRotateKey: () => this.toggleRotate(),
    });
  }

  private handleGridClick(col: number, row: number): void {
    if (this.ghost.def) {
      const placed = this.simulation.buildRoom(this.ghost.def.id, col, row, this.ghost.rotated);
      if (placed) this.ghost.def = null;
      return;
    }

    const clickedRoom = Array.from(this.simulation.state.rooms.values()).find(
      (r) => col >= r.col && col < r.col + r.width && row >= r.row && row < r.row + r.height
    );

    if (this.isDemolishMode && clickedRoom) {
      this.simulation.demolishRoom(clickedRoom.id);
      return;
    }

    this.selectedRoomId = clickedRoom ? clickedRoom.id : null;
    this.checkRoomPatientDecision(clickedRoom?.id);
  }

  private checkRoomPatientDecision(roomId?: string): void {
    if (!roomId) return;
    const room = this.simulation.state.rooms.get(roomId);
    if (!room) return;

    for (const patId of room.occupantIds) {
      const pat = this.simulation.state.patients.get(patId);
      if (pat && pat.state === 'needs_decision') {
        this.decisionModal.open(pat);
        break;
      }
    }
  }

  private handleGridHover(col: number, row: number): void {
    this.ghost.col = col;
    this.ghost.row = row;
    if (this.ghost.def) {
      this.ghost.isValid = canPlaceRoom(this.simulation.state, this.ghost.def.id, col, row, this.ghost.rotated);
    }
  }

  private setupEventSubscriptions(): void {
    globalBus.on('tick', () => {
      this.hud.update(this.simulation.state);
      this.advisorView.update(this.simulation.state);
    });

    globalBus.on('patient:needs_decision', ({ patientId }) => {
      const patient = this.simulation.state.patients.get(patientId);
      if (patient) this.decisionModal.open(patient);
    });

    globalBus.on('game:defeat', ({ reason }) => {
      this.defeatModal.show(reason, () => {
        window.location.reload();
      });
    });
  }
}

const app = new MediVilleApp();
app.start().catch((err: unknown) => {
  console.error('[MediVille] Falha ao iniciar aplicação:', err);
});
