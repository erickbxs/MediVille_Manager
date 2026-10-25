/**
 * Arquivo: src/ui/settings-modal.ts
 * O que faz: Exibe o modal de configurações do hospital com opções de salvamento manual, exportação e importação de arquivo JSON e reinício de partida.
 * Para que foi criado: Cumprir os requisitos da Fase 3 dando ao jogador autonomia para gerenciar e guardar seu progresso.
 * Como modificar/debugar: Conecte novas opções de jogo (como áudio ou tema) neste modal.
 * Importa: src/core/simulation.ts, src/systems/save-system.ts, src/systems/player-profile.ts
 * Conecta-se com: src/ui/hud.ts, src/main.ts
 */

import type { HospitalSimulation } from '../core/simulation';
import { saveGameState, exportSaveJson, importSaveJson, clearSavedGame } from '../systems/save-system';
import { getPlayerProfile } from '../systems/player-profile';

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

export class SettingsModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(): void {
    this.simulation.pauseForModal();
    const profile = getPlayerProfile();
    const modeLabel = profile?.guestMode ? 'Convidado (Estritamente Local)' : 'Padrão (Salvo no Navegador)';
    const currentScale = getSavedFontScale();

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col space-y-4 max-h-[90dvh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Configurações & Acessibilidade</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${modeLabel}</p>
              </div>
            </div>
            <button id="btn-close-settings" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold">
              ✕
            </button>
          </div>

          <div id="save-status-msg" class="hidden p-3 rounded-2xl text-xs font-bold text-center"></div>

          <!-- Acessibilidade e Tamanho da Fonte -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                🔤 Tamanho da Fonte
              </span>
              <span class="text-[11px] text-slate-400">Escala da interface</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button data-scale="normal" class="btn-font-scale p-2 rounded-xl border transition-all ${currentScale === 'normal' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}">
                Padrão
              </button>
              <button data-scale="large" class="btn-font-scale p-2 rounded-xl border transition-all ${currentScale === 'large' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}">
                Grande
              </button>
              <button data-scale="xlarge" class="btn-font-scale p-2 rounded-xl border transition-all ${currentScale === 'xlarge' ? 'bg-sky-600 text-white border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}">
                Extra Grande
              </button>
            </div>
          </div>

          <div class="space-y-2.5">
            <button id="btn-manual-save" class="w-full min-h-[48px] p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center justify-between hover:bg-sky-100/60 transition-all active:scale-[0.99]">
              <span class="flex items-center gap-2">💾 Salvar Hospital Agora</span>
              <span class="text-xs font-semibold opacity-75">Navegador</span>
            </button>

            <button id="btn-export-save" class="w-full min-h-[48px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-between hover:bg-slate-100 transition-all active:scale-[0.99]">
              <span class="flex items-center gap-2">📥 Exportar Backup (.json)</span>
              <span class="text-xs font-semibold opacity-75">Baixar</span>
            </button>

            <label class="w-full min-h-[48px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-between hover:bg-slate-100 transition-all cursor-pointer active:scale-[0.99]">
              <span class="flex items-center gap-2">📤 Importar Backup (.json)</span>
              <span class="text-xs font-semibold opacity-75">Arquivo</span>
              <input type="file" id="input-import-save" accept=".json" class="hidden" />
            </label>

            <button id="btn-reset-game" class="w-full min-h-[48px] p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-sm flex items-center justify-between hover:bg-rose-100/60 transition-all active:scale-[0.99]">
              <span class="flex items-center gap-2">🔄 Reiniciar Novo Hospital</span>
              <span class="text-xs font-semibold opacity-75">Reset</span>
            </button>
          </div>

          <div class="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            💡 O jogo também salva seu progresso automaticamente ao final de cada dia.
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    });

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

    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
      const ok = saveGameState(this.simulation.state);
      this.showStatus(ok ? '✅ Jogo salvo com sucesso no navegador!' : '⚠️ Falha ao salvar jogo.', ok);
    });

    document.getElementById('btn-export-save')?.addEventListener('click', () => {
      this.triggerDownload();
    });

    const fileInput = document.getElementById('input-import-save') as HTMLInputElement;
    fileInput?.addEventListener('change', () => {
      this.handleFileImport(fileInput);
    });

    document.getElementById('btn-reset-game')?.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja reiniciar seu hospital? Todo o progresso não exportado será perdido.')) {
        clearSavedGame();
        window.location.reload();
      }
    });
  }

  private showStatus(msg: string, success: boolean): void {
    const box = document.getElementById('save-status-msg');
    if (!box) return;
    box.className = success
      ? 'p-3 rounded-2xl text-xs font-bold text-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'p-3 rounded-2xl text-xs font-bold text-center bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  private triggerDownload(): void {
    const jsonStr = exportSaveJson(this.simulation.state);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediville-save-dia-${this.simulation.state.day}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showStatus('📥 Arquivo de save baixado com sucesso!', true);
  }

  private handleFileImport(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const loaded = importSaveJson(content);
      if (loaded) {
        saveGameState(loaded);
        alert('Hospital importado com sucesso! A página será recarregada.');
        window.location.reload();
      } else {
        this.showStatus('⚠️ Arquivo de save inválido ou incompatível.', false);
      }
    };
    reader.readAsText(file);
  }
}

