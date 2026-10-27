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
import { musicSystem } from './core/music-system';
import { SettingsModal, applySavedFontScale } from './ui/settings-modal';
import { AgeGateModal } from './ui/age-gate-modal';
import { loadGameState, saveGameState, clearSavedGame } from './systems/save-system';
import { isAgeVerificationRequired } from './systems/player-profile';
import { globalErrorBoundary } from './core/error-boundary';
import { GameOverModal } from './ui/game-over-modal';
import { DefeatWarningModal } from './ui/defeat-warning-modal';
import { RankingModal } from './ui/ranking-modal';
import { executeEmergencyTransferRescue } from './systems/defeat-system';
import { initI18n } from './i18n/i18n';
import { BuildController } from './ui/build-controller';
import { expandMap } from './systems/map-expansion-system';
import { NotificationCenter } from './ui/notification-center';
import { RoomContextMenu } from './ui/room-context-menu';
import { EntityInspector } from './ui/entity-inspector';
import { THEME } from './render/theme-config';
import type { RoomDefinition } from './core/config';
import type { RoomInstance } from './entities/room';

const HALF_TILE_OFFSET = 0.5;
const INSPECTION_RADIUS_FACTOR = 1.3;
const REST_TIMER_DURATION_SEC = 30;

class MediVilleApp {
  private simulation = new HospitalSimulation(loadGameState() ?? undefined);
  private renderer = new HospitalRenderer({ onExpandMap: () => this.handleDirectMapExpansion() });
  private gameLoop!: GameLoop;
  private hud!: HospitalHUD;
  private notificationCenter!: NotificationCenter;
  private roomContextMenu!: RoomContextMenu;
  private titleScreen!: TitleScreen;
  private encyclopediaModal!: EncyclopediaModal;
  private goalsModal!: GoalsModal;
  private decisionModal!: DecisionModal;
  private settingsModal!: SettingsModal;
  private advisorView!: AdvisorView;
  private defeatModal!: DefeatModal;
  private gameOverModal!: GameOverModal;
  private defeatWarningModal!: DefeatWarningModal;
  private rankingModal!: RankingModal;
  private staffModal!: StaffModal;
  private pharmacyModal!: PharmacyModal;
  private financesModal!: FinancesModal;
  private eventBanner!: EventBannerView;
  private buildMenu!: BuildMenu;
  private buildController!: BuildController;
  private entityInspector!: EntityInspector;
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

    this.setupBuildController();
    this.setupBuildMenu();
    this.setupInput(canvasContainer);
    this.setupEventSubscriptions();

    globalErrorBoundary.attach(this.simulation);

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
      onOpenRanking: () => this.rankingModal.open(),
    });
  }

  private startPlaying(): void {
    this.appMode = 'PLAYING';
    document.getElementById('ui-root')?.classList.remove('hidden');
    this.titleScreen.hide();
    musicSystem.start();
    this.simulation.setSpeed(1);
    this.renderer.recenter();
    triggerTutorialTip(this.simulation.state, 'game_start');
  }

  private handleBuildConfirm(col: number, row: number, rotated: boolean, def: RoomDefinition, isMove: boolean, movingRoomId: string | null): void {
    if (isMove && movingRoomId) {
      const moved = this.simulation.moveRoom(movingRoomId, col, row, rotated);
      if (moved) {
        this.showToast('✅ Sala reposicionada com sucesso!');
        soundSystem.playClick();
      }
      this.movingRoomId = null;
      this.isMoveMode = false;
    } else {
      const placed = this.simulation.buildRoom(def.id, col, row, rotated);
      if (placed) {
        this.showToast(`✅ ${def.shortName} construída!`);
        soundSystem.playClick();
      }
    }
    this.ghost.def = null;
  }

  private setupBuildController(): void {
    const buildConfirmContainer = document.getElementById('build-confirm-container') || document.body;
    this.buildController = new BuildController(buildConfirmContainer, {
      onValidate: (col, row, rotated, def, isMove, movingRoomId) => {
        if (isMove && movingRoomId) {
          return canMoveRoom(this.simulation.state, movingRoomId, col, row, rotated);
        }
        return canPlaceRoom(this.simulation.state, def.id, col, row, rotated);
      },
      onConfirm: (col, row, rotated, def, isMove, movingRoomId) => {
        this.renderer.camera.panLocked = false;
        this.handleBuildConfirm(col, row, rotated, def, isMove, movingRoomId);
      },
      onCancel: () => {
        this.renderer.camera.panLocked = false;
        this.cancelSelection();
      },
      onChange: (col, row, rotated, isValid) => {
        this.ghost.col = col;
        this.ghost.row = row;
        this.ghost.rotated = rotated;
        this.ghost.isValid = isValid;
      },
    });
  }

  private setupBuildMenu(): void {
    this.buildMenu = new BuildMenu(document.getElementById('build-menu-container')!, {
      onSelectRoom: (def: RoomDefinition) => this.selectRoomToBuild(def),
      onToggleRotate: () => this.toggleRotate(),
      onToggleDemolish: () => this.toggleDemolish(),
      onToggleMove: () => this.toggleMove(),
      onCancelSelection: () => this.cancelSelection(),
      onLiftOffDrag: (_def: RoomDefinition, clientX: number, clientY: number) => this.handleLiftOffDrag(clientX, clientY),
      onRecenterMap: () => this.renderer.recenter(),
      onOpenPendingCase: () => this.openNextPendingCase(),
      onOpenStaff: () => this.staffModal.open(),
      onOpenPharmacy: () => this.pharmacyModal.open(),
      onOpenFinances: () => this.financesModal.open(),
      onOpenEncyclopedia: () => this.encyclopediaModal.open(),
      onExpandMap: () => this.handleDirectMapExpansion(),
      getState: () => this.simulation.state,
    });
  }

  private handleLiftOffDrag(clientX: number, clientY: number): void {
    const canvas = this.renderer.app.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const touchOffsetY = -36;
    const grid = this.renderer.camera.screenToGrid(clientX - rect.left, clientY - rect.top + touchOffsetY);
    this.renderer.camera.panLocked = true;
    this.buildController.setPosition(grid.col, grid.row);
  }

  private handleDirectMapExpansion(): void {
    const ok = expandMap(this.simulation.state);
    if (ok) {
      soundSystem.playSuccess();
      this.showToast('📐 Terreno Hospitalar Expandido com Sucesso (+4x4)!');
      this.renderer.recenter();
    } else {
      this.showToast('⚠️ Saldo insuficiente ou tamanho máximo atingido!');
    }
  }

  private setupDefeatRescueModals(modalContainer: HTMLElement): void {
    this.rankingModal = new RankingModal(modalContainer);
    this.defeatWarningModal = new DefeatWarningModal(modalContainer, {
      onRequestEmergencyGrant: () => executeEmergencyTransferRescue(this.simulation.state),
      onOpenDemolishRoom: () => this.buildMenu.openDrawerForRoom(),
      onOpenStaffAdjustment: () => this.staffModal.open(),
    });
    this.gameOverModal = new GameOverModal(modalContainer, {
      onRestart: () => {
        clearSavedGame();
        window.location.reload();
      },
      onMainMenu: () => window.location.reload(),
      onViewRanking: () => this.rankingModal.open(),
    });
  }

  private setupNotificationsAndContextMenu(): void {
    const notifContainer = document.getElementById('notification-center-container') || document.body;
    this.notificationCenter = new NotificationCenter(notifContainer);

    const roomCtxContainer = document.getElementById('room-context-container') || document.body;
    this.roomContextMenu = new RoomContextMenu(roomCtxContainer, {
      onMove: (room) => this.startMovingExistingRoom(room),
      onRotate: (room) => this.rotateExistingRoom(room),
      onDemolish: (room) => this.demolishExistingRoom(room),
    });

    globalBus.on('day:end', (payload) => {
      this.notificationCenter.pushDailySummary({
        day: payload.day,
        patientsCured: payload.patientsTreated,
        revenue: payload.cash,
        goalBonus: 0,
        reputationDelta: 0,
      });
    });

    globalBus.on('protocol:mastered', (payload) => {
      soundSystem.playSuccess();
      this.notificationCenter.pushToast(
        `🏆 Protocolo Dominado: ${payload.diseaseName} (${payload.totalMastered} dominados)`,
        'success',
        '⭐'
      );
    });

    globalBus.on('progression:level_up', (payload) => {
      soundSystem.playSuccess();
      this.notificationCenter.pushToast(`🎉 Unidade Hospitalar Evoluída para ${payload.name}!`, 'success', '🏥');
    });
  }

  private startMovingExistingRoom(room: RoomInstance): void {
    this.movingRoomId = room.id;
    this.ghost.def = room.definition;
    this.ghost.col = room.col;
    this.ghost.row = room.row;
    this.ghost.rotated = room.rotated;
    this.ghost.isValid = true;
    this.buildMenu.closeDrawer();
    this.buildController.startPreview(room.definition, room.col, room.row, true, room.id, room.rotated);
  }

  private rotateExistingRoom(room: RoomInstance): void {
    const rotated = !room.rotated;
    const canRotate = canMoveRoom(this.simulation.state, room.id, room.col, room.row, rotated);
    if (canRotate) {
      this.simulation.moveRoom(room.id, room.col, room.row, rotated);
      this.showToast('🔄 Sala rotacionada 90°!');
      soundSystem.playClick();
    } else {
      this.showToast('⚠️ Espaço insuficiente para rotacionar!');
    }
  }

  private demolishExistingRoom(room: RoomInstance): void {
    this.simulation.demolishRoom(room.id);
    this.showToast('🗑️ Sala demolida (+50% reembolso)!');
    soundSystem.playClick();
  }

  private setupModalsAndHud(modalContainer: HTMLElement): void {
    this.staffModal = new StaffModal(modalContainer, this.simulation);
    this.pharmacyModal = new PharmacyModal(modalContainer, this.simulation);
    this.financesModal = new FinancesModal(modalContainer, this.simulation);
    this.settingsModal = new SettingsModal(modalContainer, this.simulation);
    this.setupDefeatRescueModals(modalContainer);
    this.setupNotificationsAndContextMenu();
    this.eventBanner = new EventBannerView(document.getElementById('event-banner-container')!);
    new TutorialView(document.getElementById('tutorial-container') || document.body);
    this.setupHud();
    this.decisionModal = new DecisionModal(modalContainer, this.simulation);
    this.defeatModal = new DefeatModal(modalContainer);
    this.setupEntityInspector(modalContainer);
    this.setupAdvisorView();

    if (isAgeVerificationRequired()) {
      new AgeGateModal(modalContainer, () => {}).show();
    }
  }

  private setupHud(): void {
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
        onOpenExpandMap: () => this.handleDirectMapExpansion(),
      }
    );
  }

  private setupEntityInspector(modalContainer: HTMLElement): void {
    this.entityInspector = new EntityInspector(modalContainer, {
      onAttendPatient: (patientId) => {
        this.simulation.triggerConsultation(patientId);
        const pat = this.simulation.state.patients.get(patientId);
        if (pat) this.decisionModal.open(pat);
      },
      onSendStaffToRest: (staffId) => {
        const staff = this.simulation.state.staff.get(staffId);
        if (staff) {
          staff.isResting = true;
          staff.restTimerSec = REST_TIMER_DURATION_SEC;
          this.showToast(`☕ ${staff.name} foi para a Sala de Descanso!`);
          soundSystem.playClick();
        }
      },
    });
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
    this.buildMenu.closeDrawer();

    const maxGrid = this.simulation.state.gridSize ?? 12;
    const startCol = Math.max(0, Math.floor((maxGrid - def.width) / 2));
    const startRow = Math.max(0, Math.floor((maxGrid - def.height) / 2));

    this.ghost.def = def;
    this.ghost.col = startCol;
    this.ghost.row = startRow;
    this.ghost.rotated = false;
    this.ghost.isValid = canPlaceRoom(this.simulation.state, def.id, startCol, startRow, false);

    this.buildController.startPreview(def, startCol, startRow, false, null, false);
  }

  private toggleRotate(): void {
    if (this.buildController.isActive()) {
      this.buildController.toggleRotate();
      return;
    }
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
    this.buildController.close();
  }

  private toggleMove(): void {
    this.isMoveMode = !this.isMoveMode;
    this.isDemolishMode = false;
    this.movingRoomId = null;
    this.ghost.def = null;
    this.buildController.close();
  }

  private cancelSelection(): void {
    this.ghost.def = null;
    this.isDemolishMode = false;
    this.isMoveMode = false;
    this.movingRoomId = null;
    this.selectedRoomId = null;
    this.buildController.close();
  }

  private setupInput(canvasContainer: HTMLElement): void {
    new CanvasInputManager(canvasContainer, this.renderer.camera, {
      onGridClick: (col, row) => this.handleGridClick(col, row),
      onGridHover: (col, row) => this.handleGridHover(col, row),
      onRotateKey: () => this.toggleRotate(),
      isBuildPreviewActive: () => this.buildController.isActive(),
      onPreviewDrag: (col, row) => this.buildController.setPosition(col, row),
      onRoomLongPress: (col, row) => this.handleRoomLongPress(col, row),
      onToggleHeatmap: () => {
        const mode = this.renderer.heatmapOverlay.cycleMode();
        const modeNames: Record<string, string> = {
          OFF: 'Desativado',
          OCCUPANCY: 'Fluxo & Lotação',
          HYGIENE: 'Higiene & Biossegurança',
          REVENUE: 'Rentabilidade Financeira',
        };
        const label = modeNames[mode] ?? mode;
        this.showToast(`🌡️ Mapa de Calor: ${label}`);
        soundSystem.playClick();
      },
    });
  }

  private handleRoomLongPress(col: number, row: number): void {
    const clicked = Array.from(this.simulation.state.rooms.values()).find(
      (r) => col >= r.col && col < r.col + r.width && row >= r.row && row < r.row + r.height
    );
    if (clicked && !this.buildController.isActive()) {
      this.startMovingExistingRoom(clicked);
      this.showToast('✋ Sala descolada para mover!');
      soundSystem.playClick();
    }
  }

  private handleGridClick(col: number, row: number): void {
    if (this.appMode === 'MENU') return;
    this.hud.closeDetails();

    if (this.buildController.isActive()) {
      const state = this.buildController.getPreviewState();
      if (state.col === col && state.row === row && state.isValid) {
        this.buildController.confirm();
      } else {
        this.buildController.setPosition(col, row);
      }
      return;
    }

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
    if (this.handleEntityInspection(col, row)) {
      return;
    }
    this.handleExistingRoomInteraction(col, row);
  }

  private handleEntityInspection(col: number, row: number): boolean {
    const patientsView = this.renderer.getPatientsView();
    if (!patientsView) return false;
    const clickWorldX = (col + HALF_TILE_OFFSET) * THEME.tileSize;
    const clickWorldY = (row + HALF_TILE_OFFSET) * THEME.tileSize;
    const clickRadiusSq = (THEME.tileSize * INSPECTION_RADIUS_FACTOR) ** 2;

    for (const [id, agent] of patientsView.npcMovementSystem.patientAgents) {
      const dx = agent.x - clickWorldX;
      const dy = agent.y - clickWorldY;
      if (dx * dx + dy * dy <= clickRadiusSq) {
        const patient = this.simulation.state.patients.get(id);
        if (patient) {
          this.entityInspector.inspectPatient(patient);
          soundSystem.playClick();
          return true;
        }
      }
    }

    for (const [id, agent] of patientsView.npcMovementSystem.staffAgents) {
      const dx = agent.x - clickWorldX;
      const dy = agent.y - clickWorldY;
      if (dx * dx + dy * dy <= clickRadiusSq) {
        const staff = this.simulation.state.staff.get(id);
        if (staff) {
          this.entityInspector.inspectStaff(staff);
          soundSystem.playClick();
          return true;
        }
      }
    }

    return false;
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
      this.startMovingExistingRoom(clicked);
      return;
    }
    this.selectedRoomId = clicked ? clicked.id : null;
    const handledPatient = this.checkRoomPatientDecision(clicked?.id);
    if (!handledPatient && clicked) {
      const screenPos = this.renderer.camera.gridToScreen(
        clicked.col + clicked.width / 2,
        clicked.row + clicked.height / 2
      );
      this.roomContextMenu.show(clicked, screenPos.x, screenPos.y);
    }
  }

  private checkRoomPatientDecision(roomId?: string): boolean {
    if (!roomId) return false;
    const room = this.simulation.state.rooms.get(roomId);
    if (!room) return false;

    for (const patId of room.occupantIds) {
      const pat = this.simulation.state.patients.get(patId);
      if (pat && (pat.state === 'ready_for_treatment' || pat.state === 'needs_decision')) {
        this.simulation.triggerConsultation(pat.id);
        this.decisionModal.open(pat);
        return true;
      }
    }
    return false;
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
    if (this.notificationCenter) {
      this.notificationCenter.pushToast(text, 'info');
      return;
    }
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

  private setupLifecycleEvents(): void {
    globalBus.on('day:end', () => saveGameState(this.simulation.state));
    const autoSaveIntervalMs = 45000;
    window.setInterval(() => saveGameState(this.simulation.state), autoSaveIntervalMs);

    globalBus.on('game:defeat', ({ reason }) => {
      this.defeatModal.show(reason, () => window.location.reload());
    });

    globalBus.on('defeat:warning', (warning) => {
      this.defeatWarningModal.open(warning);
    });

    globalBus.on('game:over', ({ reason, stats }) => {
      this.simulation.setSpeed(0);
      this.gameOverModal.open(reason, stats);
    });
  }

  private setupEventSubscriptions(): void {
    globalBus.on('tick', () => {
      this.hud.update(this.simulation.state);
      this.advisorView.update(this.simulation.state);
      this.eventBanner.update(this.simulation.state.activeEvents);
      this.notificationCenter?.updateActiveEvent(this.simulation.state.activeEvents);
      const hasZeroStock = Object.values(this.simulation.state.pharmacyStock).some((c) => c === 0);
      this.buildMenu.updateBadges(this.simulation.state.pendingDecisionPatientIds.length, hasZeroStock);
    });

    globalBus.on('feedback:gain_float', ({ text, col, row }) => this.showGainFeedback(text, col, row));
    globalBus.on('goal:completed', ({ goal, rewardCash }) => {
      soundSystem.playSuccess();
      this.showToast(`🏆 Meta Concluída: ${goal.title} (+R$ ${rewardCash.toLocaleString('pt-BR')})`);
    });
    globalBus.on('encyclopedia:case_unlocked', () => this.showToast('📖 Novo Caso Registrado na Enciclopédia SUS!'));
    globalBus.on('save:restored_from_backup', () => this.showToast('🛡️ Save principal restaurado com sucesso a partir do backup!'));
    globalBus.on('toast:show', ({ text }) => this.showToast(text));

    this.setupLifecycleEvents();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

applySavedFontScale();
initI18n().then(() => {
  const app = new MediVilleApp();
  app.start().catch((err: unknown) => {
    console.error('[MediVille] Falha ao iniciar aplicação:', err);
  });
});

