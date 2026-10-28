/**
 * Arquivo: src/ui/title-screen.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a Tela Inicial (Main Menu) interativa estilo Tycoon com botões para continuar hospital salvo,
 * iniciar nova unidade (UBS, UPA, Clínica, Hospital Geral), acessar a Enciclopédia SUS, Ranking Global,
 * Metas, Configurações, alternar idiomas em tempo real (PT, ES, EN, FR, DE, ZH), abrir Termos de Privacidade LGPD/GDPR
 * e inicializar a música ambiente suave de hospital.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2, 4 e 5 do Prompt 15, garantindo que a tela inicial responda instantaneamente à troca de idioma,
 * ofereça acesso à conformidade legal e inicie o ambiente acolhedor.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Trate as ações nos callbacks de TitleScreenCallbacks. Os termos legais abrem via LegalModal.
 *
 * Importa: src/systems/save-system.ts, src/systems/goals-system.ts, src/systems/revalida-system.ts, src/core/sound-system.ts,
 *          src/core/music-system.ts, src/i18n/i18n.ts, src/ui/legal-modal.ts, src/core/event-bus.ts
 * Conecta-se com: src/main.ts, src/ui/settings-modal.ts, src/ui/legal-modal.ts
 */

import { hasSavedGame, loadGameState } from '../systems/save-system';
import { goalsSystem } from '../systems/goals-system';
import { soundSystem } from '../core/sound-system';
import { musicSystem } from '../core/music-system';
import { CASES_CATALOG } from '../core/config';
import { getRevalidaQuestions, isRevalidaActive } from '../systems/revalida-system';
import { getLocale, setLanguage, t, type SupportedLocale } from '../i18n/i18n';
import { LegalModal } from './legal-modal';
import { globalBus } from '../core/event-bus';

export type HospitalTypeChoice = 'ubs' | 'upa' | 'clinica' | 'hospital';

export interface TitleScreenCallbacks {
  onContinue: () => void;
  onNewGame: (choice: HospitalTypeChoice) => void;
  onOpenEncyclopedia: () => void;
  onOpenGoals: () => void;
  onOpenSettings: () => void;
  onOpenRanking?: () => void;
}

export class TitleScreen {
  private container: HTMLElement;
  private callbacks: TitleScreenCallbacks;
  private isSelectingUnit = false;
  private legalModalContainer: HTMLElement;

  constructor(container: HTMLElement, callbacks: TitleScreenCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.legalModalContainer = document.createElement('div');
    document.body.appendChild(this.legalModalContainer);
    this.render();
    this.setupI18nSubscription();
  }

  private setupI18nSubscription(): void {
    globalBus.on('i18n:changed', () => {
      if (!this.container.classList.contains('hidden')) {
        this.render();
      }
    });
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.isSelectingUnit = false;
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
  }

  private render(): void {
    const hasSave = hasSavedGame();
    const savedState = hasSave ? loadGameState() : null;
    const revalida = isRevalidaActive();
    const unlockedCount = revalida
      ? (savedState?.masteredCaseIds ?? []).filter((id) => id.startsWith('revalida-')).length
      : goalsSystem.getUnlockedCaseIds().length;
    const totalCases = revalida ? getRevalidaQuestions().length : CASES_CATALOG.cases.length;
    const knowledgeLabel = revalida ? `📚 ${t('menu.questions')}` : `📖 ${t('menu.encyclopedia')}`;
    const currentLang = getLocale();

    if (this.isSelectingUnit) {
      this.renderUnitSelector();
      return;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs select-none animate-in fade-in duration-300">
        <div class="w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/40 dark:border-slate-800/80 text-center space-y-4">
          
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.9.0'} • SUS Tycoon
            </span>
            <div class="flex items-center gap-1">
              ${this.renderLangFlags(currentLang)}
            </div>
          </div>

          <div class="space-y-1">
            <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              MediVille<span class="text-blue-600">.</span>
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ${t('game.subtitle') || 'Gestão Hospitalar & Condutas Médicas Reais (SUS)'}
            </p>
          </div>

          <div class="space-y-2.5 pt-2">
            ${hasSave && savedState ? `
              <button id="btn-menu-continue" class="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-between active:scale-98 transition-all">
                <span class="flex items-center gap-2">▶️ ${t('menu.continue') || 'Continuar Hospital'}</span>
                <span class="text-xs font-mono font-normal opacity-90">Dia ${savedState.day} • R$ ${(savedState.cash / 1000).toFixed(0)}k</span>
              </button>
            ` : ''}

            <button id="btn-menu-new" class="w-full min-h-[46px] px-5 py-3 rounded-2xl ${hasSave ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'} font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all">
              🏥 ${t('menu.newHospital') || 'Novo Hospital'}
            </button>

            <button id="btn-menu-encyclopedia" class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 transition-all">
              <span class="flex items-center gap-2">${knowledgeLabel}</span>
              <span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-extrabold text-[11px]">${unlockedCount}/${totalCases}</span>
            </button>

            <button id="btn-menu-ranking" class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 transition-all">
              <span class="flex items-center gap-2">🏆 ${t('menu.leaderboard')}</span>
            </button>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button id="btn-menu-goals" class="min-h-[44px] px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-all">
                🎯 Metas
              </button>
              <button id="btn-menu-settings" class="min-h-[44px] px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-all">
                ⚙️ ${t('menu.options') || 'Ajustes'}
              </button>
            </div>
          </div>

          <!-- Rodapé com Termos & Privacidade e Aviso Educativo SUS -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            <button id="btn-title-legal" class="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
              ⚖️ Termos de Uso & Privacidade LGPD
            </button>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              ${t('legal.susNotice')}
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderLangFlags(current: SupportedLocale): string {
    const list: Array<{ code: SupportedLocale; flag: string; label: string }> = [
      { code: 'pt', flag: 'PT', label: 'Português' },
      { code: 'en', flag: 'EN', label: 'English' },
      { code: 'es', flag: 'ES', label: 'Español' },
      { code: 'fr', flag: 'FR', label: 'Français' },
      { code: 'de', flag: 'DE', label: 'Deutsch' },
      { code: 'zh', flag: '中文', label: '中文' },
    ];
    return list.map((item) => `
      <button data-lang="${item.code}" title="${item.label}" class="btn-lang-choice min-w-0 truncate px-1.5 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-0.5 transition-all ${item.code === current ? 'bg-sky-500/20 ring-1 ring-sky-500 scale-105 text-sky-600 dark:text-sky-300' : 'opacity-70 hover:opacity-100 text-slate-600 dark:text-slate-400'}">
        <span>${item.flag}</span>
      </button>
    `).join('');
  }

  private renderUnitSelector(): void {
    const units = [
      { id: 'ubs', title: 'UBS - Posto de Saúde', cash: 'R$ 30.000', badge: 'Recomendado', desc: 'Atenção Primária à Saúde (APS), imunização e consultas preventivas.' },
      { id: 'upa', title: 'UPA 24 Horas', cash: 'R$ 45.000', badge: 'Urgência', desc: 'Atendimentos de triagem rápida, estabilização e medicação imediata.' },
      { id: 'clinica', title: 'Clínica Integrada', cash: 'R$ 60.000', badge: 'Misto', desc: 'Equilíbrio entre dispensação de medicamentos e faturamento ambulatorial.' },
      { id: 'hospital', title: 'Hospital Geral SUS', cash: 'R$ 100.000', badge: 'Avançado', desc: 'Gestão hospitalar completa com leitos clínicos e alta demanda de pacientes.' },
    ];

    this.container.innerHTML = `
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs select-none animate-in fade-in duration-200">
        <div class="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/40 dark:border-slate-800/80 space-y-4 max-h-[85dvh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 class="font-black text-base text-slate-900 dark:text-slate-50">Escolha o Tipo de Unidade Inicial</h3>
              <p class="text-xs text-slate-500 font-medium">Cada modelo possui orçamento inicial e perfil de fluxo próprio</p>
            </div>
            <button id="btn-back-menu" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold">✕</button>
          </div>

          <div class="space-y-2.5">
            ${units.map((u) => `
              <div data-unit-id="${u.id}" class="unit-choice-card cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 transition-all active:scale-98">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="font-extrabold text-sm text-slate-900 dark:text-slate-100">${u.title}</h4>
                  <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">${u.badge}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${u.desc}</p>
                <div class="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">Caixa Inicial: ${u.cash}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-back-menu')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.isSelectingUnit = false;
      this.render();
    });

    this.container.querySelectorAll('.unit-choice-card').forEach((el) => {
      el.addEventListener('click', () => {
        soundSystem.playClick();
        musicSystem.start();
        const unitId = (el as HTMLElement).dataset.unitId as HospitalTypeChoice;
        this.hide();
        this.callbacks.onNewGame(unitId);
      });
    });
  }

  private bindEvents(): void {
    document.getElementById('btn-menu-continue')?.addEventListener('click', () => {
      soundSystem.playClick();
      musicSystem.start();
      this.hide();
      this.callbacks.onContinue();
    });

    document.getElementById('btn-menu-new')?.addEventListener('click', () => {
      soundSystem.playClick();
      musicSystem.start();
      this.isSelectingUnit = true;
      this.render();
    });

    document.getElementById('btn-menu-encyclopedia')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks.onOpenEncyclopedia();
    });

    document.getElementById('btn-menu-ranking')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks.onOpenRanking?.();
    });

    document.getElementById('btn-menu-goals')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks.onOpenGoals();
    });

    document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.callbacks.onOpenSettings();
    });

    document.getElementById('btn-title-legal')?.addEventListener('click', () => {
      soundSystem.playClick();
      const legalModal = new LegalModal(this.legalModalContainer);
      legalModal.open();
    });

    this.container.querySelectorAll('.btn-lang-choice').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        soundSystem.playClick();
        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as SupportedLocale;
        if (lang) {
          await setLanguage(lang);
          this.render();
        }
      });
    });
  }
}
