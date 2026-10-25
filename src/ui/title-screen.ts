/**
 * Arquivo: src/ui/title-screen.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a Tela Inicial (Main Menu) interativa estilo Tycoon com estética Apple, apresentando botões para
 * continuar hospital salvo, iniciar nova unidade (UBS, UPA, Clínica, Hospital Geral), acessar a Enciclopédia SUS,
 * ver Marcos & Metas, abrir configurações/backup e alternar idioma.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 11, estruturando a máquina de estados (MENU -> PLAYING) sobre o canvas vivo em segundo plano.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Trate as ações nos callbacks onContinue, onNewGame, onOpenEncyclopedia, onOpenGoals e onOpenSettings.
 *
 * Importa: src/systems/save-system.ts, src/systems/goals-system.ts, src/core/sound-system.ts
 * Conecta-se with: src/main.ts, src/ui/encyclopedia-modal.ts, src/ui/goals-modal.ts, src/ui/settings-modal.ts
 */

import { hasSavedGame, loadGameState } from '../systems/save-system';
import { goalsSystem } from '../systems/goals-system';
import { soundSystem } from '../core/sound-system';
import { CASES_CATALOG } from '../core/config';
import { getLocale, setLocale, type SupportedLocale } from '../i18n/i18n';

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

  constructor(container: HTMLElement, callbacks: TitleScreenCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
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
    const unlockedCount = goalsSystem.getUnlockedCaseIds().length;
    const totalCases = CASES_CATALOG.cases.length;

    if (this.isSelectingUnit) {
      this.renderUnitSelector();
      return;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs select-none animate-in fade-in duration-300">
        <div class="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/40 dark:border-slate-800/80 text-center space-y-6">
          
          <!-- Seletor de Idioma -->
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span class="tracking-wider uppercase text-[10px]">Versão 1.3.0</span>
            <div class="flex items-center gap-1.5">
              <button data-lang="pt" class="btn-lang-choice px-2 py-1 rounded-lg ${getLocale() === 'pt' ? 'bg-blue-500 text-white font-extrabold shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'} text-[11px]">🇧🇷 PT</button>
              <button data-lang="es" class="btn-lang-choice px-2 py-1 rounded-lg ${getLocale() === 'es' ? 'bg-blue-500 text-white font-extrabold shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'} text-[11px]">🇪🇸 ES</button>
              <button data-lang="en" class="btn-lang-choice px-2 py-1 rounded-lg ${getLocale() === 'en' ? 'bg-blue-500 text-white font-extrabold shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'} text-[11px]">🇺🇸 EN</button>
            </div>
          </div>

          <!-- Logo e Identidade -->
          <div class="space-y-1.5">
            <div class="inline-flex p-3 rounded-2xl bg-linear-to-tr from-blue-600 to-emerald-500 text-white shadow-lg text-3xl">
              🏥
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              MediVille Manager
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
              Administre o hospital. Aprenda medicina.
            </p>
          </div>

          <!-- Menu de Ações -->
          <div class="space-y-2.5 pt-2">
            ${hasSave && savedState ? `
              <button id="btn-menu-continue" class="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-md flex items-center justify-between active:scale-98 transition-all">
                <span class="flex items-center gap-2">▶️ Continuar Hospital</span>
                <span class="text-xs font-mono font-normal opacity-90">Dia ${savedState.day} • R$ ${(savedState.cash / 1000).toFixed(0)}k</span>
              </button>
            ` : ''}

            <button id="btn-menu-new" class="w-full min-h-[46px] px-5 py-3 rounded-2xl ${hasSave ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'} font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all">
              🏥 Novo Hospital
            </button>

            <button id="btn-menu-encyclopedia" class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 transition-all">
              <span class="flex items-center gap-2">📖 Enciclopédia SUS</span>
              <span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-extrabold text-[11px]">${unlockedCount}/${totalCases} Casos</span>
            </button>

            <button id="btn-menu-ranking" class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 transition-all">
              <span class="flex items-center gap-2">🏆 Ranking Global</span>
              <span class="text-xs text-amber-500 font-bold">Top 50</span>
            </button>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button id="btn-menu-goals" class="min-h-[44px] px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-all">
                🎯 Metas SUS
              </button>
              <button id="btn-menu-settings" class="min-h-[44px] px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-all">
                ⚙️ Ajustes & Backup
              </button>
            </div>
          </div>

          <!-- Rodapé de Aviso Obrigatório do GDD -->
          <p class="text-[10px] text-slate-400 dark:text-slate-500 leading-tight pt-2">
            Conteúdo educativo baseado em protocolos oficiais (SUS/RENAME/MS). Não substitui orientação médica profissional.
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
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
        const unitId = (el as HTMLElement).dataset.unitId as HospitalTypeChoice;
        this.hide();
        this.callbacks.onNewGame(unitId);
      });
    });
  }

  private bindEvents(): void {
    document.getElementById('btn-menu-continue')?.addEventListener('click', () => {
      soundSystem.playClick();
      this.hide();
      this.callbacks.onContinue();
    });

    document.getElementById('btn-menu-new')?.addEventListener('click', () => {
      soundSystem.playClick();
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

    this.container.querySelectorAll('.btn-lang-choice').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        soundSystem.playClick();
        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as SupportedLocale;
        if (lang) {
          await setLocale(lang);
          this.render();
        }
      });
    });
  }
}
