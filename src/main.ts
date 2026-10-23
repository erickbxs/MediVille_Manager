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
import { StaffModal } from './ui/staff-modal';
import { PharmacyModal } from './ui/pharmacy-modal';
import { FinancesModal } from './ui/finances-modal';
import { EventBannerView } from './ui/event-banner';
import { CanvasInputManager } from './input/canvas-input';
import { globalBus } from './core/event-bus';
import { canPlaceRoom, canMoveRoom } from './systems/grid-system';
import { requestEmergencyGrant } from './systems/economy-system';
import { getNextPendingDecision } from './systems/consultation-system';
import { TutorialView } from './ui/tutorial-view';
import { triggerTutorialTip } from './systems/tutorial-system';
import type { RoomDefinition } from './core/config';

class MediVilleApp {
  private simulation = new HospitalSimulation();
  private renderer = new HospitalRenderer();
  private gameLoop!: GameLoop;
  private hud!: HospitalHUD;
  private decisionModal!: DecisionModal;
  private advisorView!: AdvisorView;
  private defeatModal!: DefeatModal;
  private staffModal!: StaffModal;
  private pharmacyModal!: PharmacyModal;
  private financesModal!: FinancesModal;
  private eventBanner!: EventBannerView;
  private ghost: GhostState = { def: null, col: 0, row: 0, rotated: false, isValid: false };
  private isDemolishMode = false;
  private isMoveMode = false;
  private movingRoomId: string | null = null;
  private selectedRoomId: string | null = null;

  public async start(): Promise<void> {
    const canvasContainer = document.getElementById('game-canvas-container')!;
    await this.renderer.init(canvasContainer);

    this.setupModalsAndHud(document.getElementById('modal-container')!);

    new BuildMenu(document.getElementById('build-menu-container')!, {
      onSelectRoom: (def: RoomDefinition) => this.selectRoomToBuild(def),
      onToggleRotate: () => this.toggleRotate(),
      onToggleDemolish: () => this.toggleDemolish(),
      onToggleMove: () => this.toggleMove(),
      onCancelSelection: () => this.cancelSelection(),
    });

    this.setupInput(canvasContainer);
    this.setupEventSubscriptions();
    triggerTutorialTip(this.simulation.state, 'game_start');

    this.gameLoop = new GameLoop(this.simulation, () => {
      this.renderer.render(this.simulation.state, this.ghost, this.selectedRoomId);
    });
    this.gameLoop.start();
  }

  private setupModalsAndHud(modalContainer: HTMLElement): void {
    this.staffModal = new StaffModal(modalContainer, this.simulation);
    this.pharmacyModal = new PharmacyModal(modalContainer, this.simulation);
    this.financesModal = new FinancesModal(modalContainer, this.simulation);
    this.eventBanner = new EventBannerView(document.getElementById('event-banner-container')!);
    new TutorialView(document.getElementById('tutorial-container') || document.body);
    this.hud = new HospitalHUD(
      document.getElementById('hud-container')!,
      this.simulation,
      {
        onOpenStaff: () => this.staffModal.open(),
        onOpenPharmacy: () => this.pharmacyModal.open(),
        onOpenFinances: () => this.financesModal.open(),
        onRequestGrant: () => requestEmergencyGrant(this.simulation.state),
        onOpenPendingCase: () => {
          const next = getNextPendingDecision(this.simulation.state);
          if (next) this.decisionModal.open(next);
        },
      }
    );
    this.decisionModal = new DecisionModal(modalContainer, this.simulation);
    this.advisorView = new AdvisorView(document.getElementById('advisor-container')!);
    this.defeatModal = new DefeatModal(modalContainer);
  }

  private selectRoomToBuild(def: RoomDefinition): void {
    this.isDemolishMode = false;
    this.isMoveMode = false;
    this.movingRoomId = null;
    this.ghost.def = def;
    this.ghost.isValid = canPlaceRoom(this.simulation.state, def.id, this.ghost.col, this.ghost.row, this.ghost.rotated);
  }

  private toggleRotate(): void {
    this.ghost.rotated = !this.ghost.rotated;
    if (this.movingRoomId && this.ghost.def) {
      this.ghost.isValid = canMoveRoom(this.simulation.state, this.movingRoomId, this.ghost.col, this.ghost.row, this.ghost.rotated);
    } else if (this.ghost.def) {
      this.ghost.isValid = canPlaceRoom(this.simulation.state, this.ghost.def.id, this.ghost.col, this.ghost.row, this.ghost.rotated);
    }
  }

  private toggleDemolish(): void {
    this.isDemolishMode = !this.isDemolishMode;
    this.isMoveMode = false;
    this.movingRoomId = null;
    this.ghost.def = null;
  }

  private toggleMove(): void {
    this.isMoveMode = !this.isMoveMode;
    this.isDemolishMode = false;
    this.movingRoomId = null;
    this.ghost.def = null;
  }

  private cancelSelection(): void {
    this.ghost.def = null;
    this.isDemolishMode = false;
    this.isMoveMode = false;
    this.movingRoomId = null;
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
    if (this.movingRoomId) {
      this.applyRoomMove(col, row);
      return;
    }
    if (this.ghost.def) {
      const placed = this.simulation.buildRoom(this.ghost.def.id, col, row, this.ghost.rotated);
      if (placed) this.ghost.def = null;
      return;
    }
    this.handleExistingRoomInteraction(col, row);
  }

  private applyRoomMove(col: number, row: number): void {
    if (!this.movingRoomId) return;
    const moved = this.simulation.moveRoom(this.movingRoomId, col, row, this.ghost.rotated);
    if (moved) {
      this.movingRoomId = null;
      this.ghost.def = null;
      this.isMoveMode = false;
    }
  }

  private handleExistingRoomInteraction(col: number, row: number): void {
    const clicked = Array.from(this.simulation.state.rooms.values()).find(
      (r) => col >= r.col && col < r.col + r.width && row >= r.row && row < r.row + r.height
    );

    if (this.isDemolishMode && clicked) {
      this.simulation.demolishRoom(clicked.id);
      return;
    }
    if (this.isMoveMode && clicked) {
      this.movingRoomId = clicked.id;
      this.ghost.def = clicked.definition;
      this.ghost.rotated = clicked.rotated;
      this.ghost.isValid = canMoveRoom(this.simulation.state, clicked.id, col, row, clicked.rotated);
      return;
    }
    this.selectedRoomId = clicked ? clicked.id : null;
    this.checkRoomPatientDecision(clicked?.id);
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
    if (this.movingRoomId && this.ghost.def) {
      this.ghost.isValid = canMoveRoom(this.simulation.state, this.movingRoomId, col, row, this.ghost.rotated);
    } else if (this.ghost.def) {
      this.ghost.isValid = canPlaceRoom(this.simulation.state, this.ghost.def.id, col, row, this.ghost.rotated);
    }
  }

  private setupEventSubscriptions(): void {
    globalBus.on('tick', () => {
      this.hud.update(this.simulation.state);
      this.advisorView.update(this.simulation.state);
      this.eventBanner.update(this.simulation.state.activeEvents);
    });

    globalBus.on('patient:needs_decision', ({ patientId }) => {
      if (this.decisionModal.isOpen()) return;
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
