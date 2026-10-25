/**
 * Arquivo: src/main.ts
 *
 * 1. O que este arquivo faz?
 * Ponto de entrada da aplicação que inicializa o loop de jogo, PixiJS, HUD, dock de construção, modais clínicos e administrativos, ouvintes de eventos e feedback flutuante.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Integrar todos os subsistemas de simulação, interface e renderização mantendo desacoplamento estrito via EventBus conforme o GDD.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novas integrações de entrada ou eventos globais, configure listeners em setupEventSubscriptions ou trate cliques em handleGridClick.
 *
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
import { TitleScreen, type HospitalTypeChoice } from './ui/title-screen';
import { EncyclopediaModal } from './ui/encyclopedia-modal';
import { GoalsModal } from './ui/goals-modal';
import { trafficSystem } from './systems/traffic-system';
import { soundSystem } from './core/sound-system';
import { SettingsModal, applySavedFontScale } from './ui/settings-modal';
import { AgeGateModal } from './ui/age-gate-modal';
import { loadGameState, saveGameState, clearSavedGame } from './systems/save-system';
import { isAgeVerificationRequired } from './systems/player-profile';
import type { RoomDefinition } from './core/config';

class MediVilleApp {
  private simulation = new HospitalSimulation(loadGameState() ?? undefined);
  private renderer = new HospitalRenderer();
  private gameLoop!: GameLoop;
  private hud!: HospitalHUD;
  private titleScreen!: TitleScreen;
  private encyclopediaModal!: EncyclopediaModal;
  private goalsModal!: GoalsModal;
  private decisionModal!: DecisionModal;
  private settingsModal!: SettingsModal;
  private advisorView!: AdvisorView;
  private defeatModal!: DefeatModal;
  private staffModal!: StaffModal;
  private pharmacyModal!: PharmacyModal;
  private financesModal!: FinancesModal;
  private eventBanner!: EventBannerView;
  private buildMenu!: BuildMenu;
  private ghost: GhostState = { def: null, col: 0, row: 0, rotated: false, isValid: false };
  private isDemolishMode = false;
  private isMoveMode = false;
  private movingRoomId: string | null = null;
  private selectedRoomId: string | null = null;
  private appMode: 'MENU' | 'PLAYING' = 'MENU';

  public async start(): Promise<void> {
    const canvasContainer = document.getElementById('game-canvas-container')!;
    await this.renderer.init(canvasContainer);

    const modalContainer = document.getElementById('modal-container')!;
    this.setupModalsAndHud(modalContainer);
    this.setupTitleScreen(modalContainer);

    this.setupBuildMenu();
    this.setupInput(canvasContainer);
    this.setupEventSubscriptions();

    this.simulation.setSpeed(0);
    this.gameLoop = new GameLoop(this.simulation, () => {
      trafficSystem.update(0.016);
      this.renderer.render(this.simulation.state, this.ghost, this.selectedRoomId);
    });
    this.gameLoop.start();
  }

  private setupTitleScreen(modalContainer: HTMLElement): void {
    const uiRoot = document.getElementById('ui-root');
    uiRoot?.classList.add('hidden');

    this.encyclopediaModal = new EncyclopediaModal(modalContainer);
    this.goalsModal = new GoalsModal(modalContainer);
    this.titleScreen = new TitleScreen(document.getElementById('title-screen-container')!, {
      onContinue: () => this.startPlaying(),
      onNewGame: (choice: HospitalTypeChoice) => {
        clearSavedGame();
        this.simulation = new HospitalSimulation(choice);
        this.startPlaying();
      },
      onOpenEncyclopedia: () => this.encyclopediaModal.open(),
      onOpenGoals: () => this.goalsModal.open(),
      onOpenSettings: () => this.settingsModal.open(),
    });
  }

  private startPlaying(): void {
    this.appMode = 'PLAYING';
    document.getElementById('ui-root')?.classList.remove('hidden');
    this.titleScreen.hide();
    this.simulation.setSpeed(1);
    this.renderer.recenter();
    triggerTutorialTip(this.simulation.state, 'game_start');
  }

  private setupBuildMenu(): void {
    this.buildMenu = new BuildMenu(document.getElementById('build-menu-container')!, {
      onSelectRoom: (def: RoomDefinition) => this.selectRoomToBuild(def),
      onToggleRotate: () => this.toggleRotate(),
      onToggleDemolish: () => this.toggleDemolish(),
      onToggleMove: () => this.toggleMove(),
      onCancelSelection: () => this.cancelSelection(),
      onRecenterMap: () => this.renderer.recenter(),
      onOpenPendingCase: () => this.openNextPendingCase(),
      onOpenStaff: () => this.staffModal.open(),
      onOpenPharmacy: () => this.pharmacyModal.open(),
      onOpenFinances: () => this.financesModal.open(),
    });
  }

  private setupModalsAndHud(modalContainer: HTMLElement): void {
    this.staffModal = new StaffModal(modalContainer, this.simulation);
    this.pharmacyModal = new PharmacyModal(modalContainer, this.simulation);
    this.financesModal = new FinancesModal(modalContainer, this.simulation);
    this.settingsModal = new SettingsModal(modalContainer, this.simulation);
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
        onOpenPendingCase: () => this.openNextPendingCase(),
        onOpenSettings: () => this.settingsModal.open(),
        onOpenEncyclopedia: () => this.encyclopediaModal.open(),
        onOpenGoals: () => this.goalsModal.open(),
      }
    );
    this.decisionModal = new DecisionModal(modalContainer, this.simulation);
    this.defeatModal = new DefeatModal(modalContainer);
    this.setupAdvisorView();

    if (isAgeVerificationRequired()) {
      new AgeGateModal(modalContainer, () => {}).show();
    }
  }

  private setupAdvisorView(): void {
    const container = document.getElementById('advisor-container')!;
    this.advisorView = new AdvisorView(container, {
      onResolve: (actionType, targetRoomType) => {
        if (actionType === 'open_pharmacy') {
          this.pharmacyModal.open();
        } else if (actionType === 'open_finances') {
          this.financesModal.open();
        } else if (actionType === 'open_staff') {
          this.staffModal.open();
        } else if (actionType === 'build_room') {
          this.buildMenu.openDrawerForRoom(targetRoomType);
        }
      },
    });
  }

  private openNextPendingCase(): void {
    const next = getNextPendingDecision(this.simulation.state);
    if (next) {
      this.simulation.triggerConsultation(next.id);
      this.decisionModal.open(next);
    }
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
    if (this.appMode === 'MENU') return;
    this.hud.closeDetails();
    if (this.movingRoomId) {
      this.applyRoomMove(col, row);
      this.buildMenu.closeDrawer();
      return;
    }
    if (this.ghost.def) {
      const placed = this.simulation.buildRoom(this.ghost.def.id, col, row, this.ghost.rotated);
      if (placed) {
        this.ghost.def = null;
        this.buildMenu.closeDrawer();
      }
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
      if (pat && (pat.state === 'ready_for_treatment' || pat.state === 'needs_decision')) {
        this.simulation.triggerConsultation(pat.id);
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

  private showGainFeedback(text: string, col: number, row: number): void {
    const screenPos = this.renderer.camera.gridToScreen(col + 1, row + 1);
    const badge = document.createElement('div');
    badge.className = 'fixed pointer-events-none z-50 font-black text-emerald-400 bg-slate-900/90 px-3 py-1.5 rounded-xl shadow-xl border border-emerald-500/50 text-sm transition-all duration-1000 -translate-x-1/2 -translate-y-1/2';
    badge.style.left = `${screenPos.x}px`;
    badge.style.top = `${screenPos.y}px`;
    badge.textContent = text;
    document.body.appendChild(badge);
    requestAnimationFrame(() => {
      badge.style.transform = 'translate(-50%, -160%) scale(1.1)';
      badge.style.opacity = '0';
    });
    const removeDelayMs = 1000;
    setTimeout(() => badge.remove(), removeDelayMs);
  }

  private showToast(text: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 text-white font-black text-xs shadow-2xl border border-amber-400/50 backdrop-blur-md animate-in slide-in-from-top duration-300 pointer-events-none';
    toast.textContent = text;
    document.body.appendChild(toast);
    const toastDurationMs = 2800;
    const fadeDurationMs = 500;
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), fadeDurationMs);
    }, toastDurationMs);
  }

  private setupEventSubscriptions(): void {
    globalBus.on('tick', () => {
      this.hud.update(this.simulation.state);
      this.advisorView.update(this.simulation.state);
      this.eventBanner.update(this.simulation.state.activeEvents);
      const hasZeroStock = Object.values(this.simulation.state.pharmacyStock).some((c) => c === 0);
      this.buildMenu.updateBadges(this.simulation.state.pendingDecisionPatientIds.length, hasZeroStock);
    });

    globalBus.on('feedback:gain_float', ({ text, col, row }) => this.showGainFeedback(text, col, row));
    globalBus.on('goal:completed', ({ goal, rewardCash }) => {
      soundSystem.playSuccess();
      this.showToast(`🏆 Meta Concluída: ${goal.title} (+R$ ${rewardCash.toLocaleString('pt-BR')})`);
    });
    globalBus.on('encyclopedia:case_unlocked', () => {
      this.showToast('📖 Novo Caso Registrado na Enciclopédia SUS!');
    });

    globalBus.on('day:end', () => saveGameState(this.simulation.state));
    const autoSaveIntervalMs = 45000;
    window.setInterval(() => saveGameState(this.simulation.state), autoSaveIntervalMs);

    globalBus.on('game:defeat', ({ reason }) => {
      this.defeatModal.show(reason, () => window.location.reload());
    });
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

applySavedFontScale();
const app = new MediVilleApp();
app.start().catch((err: unknown) => {
  console.error('[MediVille] Falha ao iniciar aplicação:', err);
});

