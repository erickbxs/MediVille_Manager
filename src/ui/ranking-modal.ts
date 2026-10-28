/**
 * Arquivo: src/ui/ranking-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o modal de visualização do Ranking Global e Local do MediVille Manager, exibindo Top Scores,
 * medalhas, estatísticas de dias/pacientes e aviso contextual para o Modo Convidado (< 13 anos).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Permitir que o jogador compare suas conquistas com outros gestores e visualize seus recordes locais.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O modal obtém dados via RankingService.fetchLeaderboard().
 *
 * Importa: src/services/ranking-service.ts, src/utils/nickname-filter.ts, src/i18n/i18n.ts, src/ui/revalida-question-view.ts
 * Conecta-se com: src/ui/title-screen.ts, src/ui/game-over-modal.ts, src/main.ts
 */

import { RankingService, type LeaderboardEntry } from '../services/ranking-service';
import { canSubmitToGlobalRanking } from '../utils/nickname-filter';
import { t } from '../i18n/i18n';
import { escapeHtml } from './revalida-question-view';

export class RankingModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async open(): Promise<void> {
    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85dvh]">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🏆</span>
              <div>
                <h3 class="text-lg font-black text-slate-900 dark:text-slate-50">${t('leaderboard.title')}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${t('leaderboard.subtitle')}</p>
              </div>
            </div>
            <button id="btn-close-ranking" class="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">✕</button>
          </div>

          <div id="ranking-content-body" class="flex-1 min-h-0 overflow-y-auto py-4 space-y-2">
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-ranking')?.addEventListener('click', () => this.close());
    const entries = await RankingService.fetchLeaderboard();
    this.renderEntries(entries);
  }

  public close(): void {
    this.container.innerHTML = '';
  }

  private renderBadge(): string {
    if (canSubmitToGlobalRanking()) return '';
    return `
      <div class="p-3 mb-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <span>🛡️</span>
        <span><strong>Modo Convidado (< 13 anos):</strong> Seus dados de jogo e pontuações ficam salvos estritamente no seu aparelho.</span>
      </div>
    `;
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    const body = document.getElementById('ranking-content-body');
    if (!body) return;

    const getMedal = (idx: number): string => {
      if (idx === 0) return '🥇';
      if (idx === 1) return '🥈';
      if (idx === 2) return '🥉';
      return `${idx + 1}º`;
    };

    if (entries.length === 0) {
      body.innerHTML = `${this.renderBadge()}<p class="p-8 text-center text-sm text-slate-500">${t('leaderboard.empty')}</p>`;
      return;
    }
    const rowsHtml = entries.map((e, idx) => `
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-8 text-center font-black text-sm text-slate-500 dark:text-slate-400">${getMedal(idx)}</span>
          <div>
            <div class="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>${escapeHtml(e.nickname)}</span>
              <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">${t(`leaderboard.unit_${e.unitType}`)}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">
              ${e.days} dias sobrevividos • ${e.patientsTreated} pacientes salvos
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="font-black text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">${e.score.toLocaleString('pt-BR')} pts</span>
        </div>
      </div>
    `).join('');

    body.innerHTML = `
      ${this.renderBadge()}
      <div class="space-y-2">${rowsHtml}</div>
    `;
  }
}
