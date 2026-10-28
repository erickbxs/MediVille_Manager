/**
 * Arquivo: src/ui/settings-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o modal de Configurações & Acessibilidade: ajuste do volume de música suave de hospital (0% a 100%),
 * troca instantânea de idiomas (PT, ES, EN, FR, DE, ZH), escala de fontes, salvamento/exportação/importação de partidas,
 * acesso aos Termos de Uso e Privacidade LGPD/GDPR e exclusão de dados locais.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2, 4 e 5 do Prompt 15, unificando preferências sonoras, linguísticas e garantias legais da plataforma.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O volume é transmitido para musicSystem.setVolume(). Os termos legais abrem via LegalModal.
 *
 * Importa: src/core/simulation.ts, src/systems/save-system.ts, src/systems/player-profile.ts,, src/core/sound-system.ts, src/systems/revalida-difficulty.ts, src/systems/revalida-system.ts
 *          src/services/ranking-service.ts, src/core/music-system.ts, src/i18n/i18n.ts, src/ui/legal-modal.ts
 * Conecta-se com: src/ui/hud.ts, src/main.ts
 */

import { getRevalidaDifficulty, setRevalidaDifficulty } from '../systems/revalida-difficulty';
import { isRevalidaActive } from '../systems/revalida-system';
import { soundSystem } from '../core/sound-system';
import type { HospitalSimulation } from '../core/simulation';
import { saveGameState, exportSaveJson, importSaveJson, clearSavedGame } from '../systems/save-system';
import { getPlayerProfile } from '../systems/player-profile';
import { musicSystem } from '../core/music-system';
import { getLocale, setLanguage, t, type SupportedLocale } from '../i18n/i18n';
import { LegalModal } from './legal-modal';

export type FontScale = 'normal' | 'large' | 'xlarge';

const FONT_SCALE_KEY = 'mediville_font_scale';

export function getSavedFontScale(): FontScale {
  const saved = localStorage.getItem(FONT_SCALE_KEY);
  if (saved === 'large' || saved === 'xlarge') return saved;
  return 'normal';
}

export function applySavedFontScale(scale?: FontScale): void {
  const target = scale ?? getSavedFontScale();
  if (target === 'normal') {
    document.documentElement.removeAttribute('data-font-scale');
  } else {
    document.documentElement.setAttribute('data-font-scale', target);
  }
}

const REDUCE_MOTION_KEY = 'mediville_reduce_motion';
const REVALIDA_LEVEL_KEY = 'mediville_revalida_level';
const LEVELS = ['facil', 'medio', 'dificil'] as const;

/** Aplica o nível do Modo Revalida salvo no aparelho (Fácil, Médio ou Difícil). */
export function applySavedRevalidaLevel(): void {
  try {
    const saved = localStorage.getItem(REVALIDA_LEVEL_KEY);
    if (saved) setRevalidaDifficulty(saved);
  } catch {
    // Sem armazenamento: usa o nível padrão do balance.json
  }
}

function prefersReducedMotion(): boolean {
  const saved = localStorage.getItem(REDUCE_MOTION_KEY);
  if (saved !== null) return saved === 'true';
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Reduz animações da interface (pulsos, deslizes) para quem se incomoda com movimento. */
export function applySavedReduceMotion(value?: boolean): void {
  const on = value ?? prefersReducedMotion();
  if (on) document.documentElement.setAttribute('data-reduce-motion', 'true');
  else document.documentElement.removeAttribute('data-reduce-motion');
}

export class SettingsModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;
  private legalModalContainer: HTMLElement;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
    this.legalModalContainer = document.createElement('div');
    document.body.appendChild(this.legalModalContainer);
  }

  public open(): void {
    this.simulation.pauseForModal();
    const profile = getPlayerProfile();
    const modeLabel = profile?.guestMode ? 'Convidado (Estritamente Local)' : 'Padrão (Salvo no Navegador)';
    const currentScale = getSavedFontScale();
    const currentLang = getLocale();
    const currentVol = Math.round(musicSystem.getVolume() * 100);
    const sfxVol = Math.round(soundSystem.getVolume() * 100);
    const reduceMotion = prefersReducedMotion();

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col space-y-4 max-h-[90dvh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">⚙️</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">${t('settings.title') || 'Configurações'}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${modeLabel}</p>
              </div>
            </div>
            <button id="btn-close-settings" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold">✕</button>
          </div>

          <div id="save-status-msg" class="hidden p-3 rounded-2xl text-xs font-bold text-center"></div>

          <!-- Controle de Música Relaxante -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">🎵 ${t('music.volume') || 'Volume da Música'}</span>
              <span id="music-vol-label" class="text-xs font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">${currentVol}%</span>
            </div>
            <input type="range" id="input-music-volume" min="0" max="100" value="${currentVol}" class="w-full accent-sky-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <label for="input-sfx-volume" class="text-xs font-bold text-slate-700 dark:text-slate-200">🔔 ${t('settings.sfx_volume')}</label>
              <span id="sfx-vol-label" class="text-xs font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">${sfxVol}%</span>
            </div>
            <input type="range" id="input-sfx-volume" min="0" max="100" value="${sfxVol}" class="w-full accent-sky-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>

          <label class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 min-h-[48px] cursor-pointer">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">🧘 ${t('settings.reduce_motion')}</span>
            <input type="checkbox" id="input-reduce-motion" ${reduceMotion ? 'checked' : ''} class="w-5 h-5 accent-sky-500" />
          </label>

          <!-- Seleção de Idioma Reativa -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 block">🌐 Idioma / Language</span>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">
              ${this.renderLangButtons(currentLang)}
            </div>
          </div>

          ${isRevalidaActive() ? this.renderLevelPicker() : ''}

          <!-- Acessibilidade e Tamanho da Fonte -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 block">🔤 ${t('settings.fontSize') || 'Tamanho da Fonte'}</span>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button data-scale="normal" class="btn-font-scale p-2 rounded-xl border ${currentScale === 'normal' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'}">Padrão</button>
              <button data-scale="large" class="btn-font-scale p-2 rounded-xl border ${currentScale === 'large' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'}">Grande</button>
              <button data-scale="xlarge" class="btn-font-scale p-2 rounded-xl border ${currentScale === 'xlarge' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'}">Extra Grande</button>
            </div>
          </div>

          <div class="space-y-2">
            <button id="btn-manual-save" class="w-full min-h-[44px] p-3 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-between">
              <span>💾 ${t('settings.saveNow') || 'Salvar Hospital Agora'}</span>
              <span class="text-[10px] opacity-75">Navegador</span>
            </button>
            <button id="btn-export-save" class="w-full min-h-[44px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between">
              <span>📥 ${t('settings.exportBackup') || 'Exportar Backup (.json)'}</span>
              <span class="text-[10px] opacity-75">Baixar</span>
            </button>
            <label class="w-full min-h-[44px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between cursor-pointer">
              <span>📤 ${t('settings.importBackup') || 'Importar Backup (.json)'}</span>
              <span class="text-[10px] opacity-75">Arquivo</span>
              <input type="file" id="input-import-save" accept=".json" class="hidden" />
            </label>
            <button id="btn-open-legal-terms" class="w-full min-h-[44px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between">
              <span>⚖️ Termos de Uso & Privacidade LGPD</span>
              <span class="text-[10px] opacity-75">Visualizar</span>
            </button>
            <button id="btn-reset-game" class="w-full min-h-[44px] p-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-between">
              <span>🔄 ${t('settings.resetGame') || 'Reiniciar Novo Hospital'}</span>
              <span class="text-[10px] opacity-75">Reset</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderLangButtons(current: SupportedLocale): string {
    const list: Array<{ code: SupportedLocale; label: string }> = [
      { code: 'pt', label: 'Português' },
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'fr', label: 'Français' },
      { code: 'de', label: 'Deutsch' },
      { code: 'zh', label: '中文' },
    ];
    return list.map((item) => `
      <button data-lang="${item.code}" class="btn-lang-choice min-w-0 truncate px-2 py-2 rounded-xl border text-center transition-all ${item.code === current ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'}">
        ${item.label}
      </button>
    `).join('');
  }

  private bindEvents(): void {
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-revalida-level').forEach((btn) => btn.addEventListener('click', () => {
      const level = btn.dataset.level ?? 'medio';
      setRevalidaDifficulty(level);
      try { localStorage.setItem(REVALIDA_LEVEL_KEY, level); } catch { /* sem armazenamento */ }
      this.open();
    }));

    document.getElementById('input-sfx-volume')?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      soundSystem.setVolume(val / 100);
      soundSystem.playClick();
      const label = document.getElementById('sfx-vol-label');
      if (label) label.textContent = `${val}%`;
    });
    document.getElementById('input-reduce-motion')?.addEventListener('change', (e) => {
      const on = (e.target as HTMLInputElement).checked;
      localStorage.setItem(REDUCE_MOTION_KEY, String(on));
      applySavedReduceMotion(on);
    });

    const volSlider = document.getElementById('input-music-volume') as HTMLInputElement | null;
    volSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      musicSystem.setVolume(val / 100);
      const label = document.getElementById('music-vol-label');
      if (label) label.textContent = `${val}%`;
    });

    this.container.querySelectorAll('.btn-lang-choice').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang') as SupportedLocale;
        if (lang) {
          await setLanguage(lang);
          this.open();
        }
      });
    });

    this.bindFontAndDataEvents();
  }

  private bindFontAndDataEvents(): void {
    this.container.querySelectorAll('.btn-font-scale').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const scale = (e.currentTarget as HTMLElement).getAttribute('data-scale') as FontScale;
        if (scale) {
          localStorage.setItem(FONT_SCALE_KEY, scale);
          applySavedFontScale(scale);
          this.open();
        }
      });
    });

    document.getElementById('btn-open-legal-terms')?.addEventListener('click', () => {
      const legalModal = new LegalModal(this.legalModalContainer);
      legalModal.open();
    });

    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
      const ok = saveGameState(this.simulation.state);
      this.showStatus(ok ? '✅ Jogo salvo com sucesso!' : '⚠️ Falha ao salvar jogo.', ok);
    });

    document.getElementById('btn-export-save')?.addEventListener('click', () => {
      const json = exportSaveJson(this.simulation.state);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediville-backup-day-${this.simulation.state.day}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showStatus('📥 Backup exportado com sucesso!', true);
    });

    document.getElementById('input-import-save')?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const loaded = importSaveJson(content);
          if (loaded) {
            saveGameState(loaded);
            window.location.reload();
          } else {
            this.showStatus('❌ Arquivo de backup inválido.', false);
          }
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('btn-reset-game')?.addEventListener('click', () => {
      if (confirm('Tem certeza de que deseja apagar o progresso deste hospital?')) {
        // Apaga só a partida; mantém idioma e a verificação de idade (antes pedia o ano de nascimento de novo).
        clearSavedGame();
        window.location.reload();
      }
    });
  }

  private renderLevelPicker(): string {
    const current = getRevalidaDifficulty();
    const buttons = LEVELS.map((lv) => `
      <button data-level="${lv}" class="btn-revalida-level min-h-[44px] p-2 rounded-xl border ${lv === current ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'}">${t(`revalida.level_${lv}`)}</button>`).join('');
    return `
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200 block">🎚️ ${t('revalida.level_title')}</span>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">${buttons}</div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">${t(`revalida.level_${current}_desc`)}</p>
          </div>`;
  }

  private showStatus(msg: string, success: boolean): void {
    const el = document.getElementById('save-status-msg');
    if (!el) return;
    el.textContent = msg;
    el.className = `p-3 rounded-2xl text-xs font-bold text-center ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  }
}
