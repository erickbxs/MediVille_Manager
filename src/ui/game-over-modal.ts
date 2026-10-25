/**
 * Arquivo: src/ui/game-over-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza a tela de encerramento da partida (Game Over), apresentando o motivo oficial da derrota,
 * o balanço estatístico final (dias, pacientes, protocolos, reputação e pontuação), submissão ao Ranking e opções de reinício.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 2 do Prompt 14, garantindo encerramento limpo da simulação com retenção do jogador e submissão de recordes.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O modal é disparado via open(reason, stats). A validação de apelido utiliza validateNickname.
 *
 * Importa: src/systems/defeat-system.ts, src/services/ranking-service.ts, src/utils/nickname-filter.ts
 * Conecta-se com: src/main.ts, src/ui/ranking-modal.ts
 */

import type { FinalScoreSummary } from '../systems/defeat-system';
import { RankingService } from '../services/ranking-service';
import { validateNickname, canSubmitToGlobalRanking } from '../utils/nickname-filter';

export interface GameOverModalCallbacks {
  onRestart: () => void;
  onMainMenu: () => void;
  onViewRanking?: () => void;
}

export class GameOverModal {
  private container: HTMLElement;
  private callbacks: GameOverModalCallbacks;
  private lastStats?: FinalScoreSummary;
  private isSubmitted = false;

  constructor(container: HTMLElement, callbacks: GameOverModalCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public open(reason: string, stats: FinalScoreSummary): void {
    this.lastStats = stats;
    this.isSubmitted = false;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500/80 p-6 flex flex-col space-y-4">
          ${this.renderHeader(reason)}
          ${this.renderStatsGrid(stats)}
          ${this.renderRankingSection(stats)}
          ${this.renderActionButtons()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  public close(): void {
    this.container.innerHTML = '';
  }

  private renderHeader(reason: string): string {
    return `
      <div class="text-center space-y-1">
        <span class="text-4xl">🏥💔</span>
        <h2 class="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Fim de Jogo</h2>
        <p class="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/50">
          ${reason}
        </p>
      </div>
    `;
  }

  private renderStatsGrid(stats: FinalScoreSummary): string {
    return `
      <div class="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div class="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs text-center">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Dias Sobrevividos</span>
          <p class="text-lg font-black text-slate-800 dark:text-slate-100 tabular-nums">${stats.days}</p>
        </div>
        <div class="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs text-center">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Pacientes Salvos</span>
          <p class="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${stats.patientsTreated}</p>
        </div>
        <div class="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs text-center">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Protocolos Dominados</span>
          <p class="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">${stats.masteredCases}</p>
        </div>
        <div class="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs text-center">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Pontuação Final</span>
          <p class="text-lg font-black text-amber-500 tabular-nums">${stats.score.toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `;
  }

  private renderRankingSection(stats: FinalScoreSummary): string {
    if (!canSubmitToGlobalRanking()) {
      return `
        <div class="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>🛡️</span>
          <span><strong>Modo Convidado:</strong> Pontuação de ${stats.score.toLocaleString('pt-BR')} registrada com sucesso no seu dispositivo!</span>
        </div>
      `;
    }

    return `
      <div id="ranking-submit-container" class="space-y-2 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
        <label for="input-ranking-nickname" class="text-xs font-bold text-sky-900 dark:text-sky-200">
          Submeter pontuação ao Ranking Oficial:
        </label>
        <div class="flex gap-2">
          <input
            id="input-ranking-nickname"
            type="text"
            maxlength="16"
            placeholder="Seu apelido público..."
            class="flex-1 px-3 py-2 text-xs rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button id="btn-submit-score" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all">
            Enviar
          </button>
        </div>
        <p id="ranking-feedback-msg" class="text-[10px] text-slate-400"></p>
      </div>
    `;
  }

  private renderActionButtons(): string {
    return `
      <div class="flex items-center gap-2 pt-2">
        <button id="btn-restart-game" class="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
          <span>🔄</span> <span>Novo Hospital</span>
        </button>
        <button id="btn-main-menu" class="flex-1 py-3 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all">
          <span>🏠</span> <span>Menu Principal</span>
        </button>
      </div>
    `;
  }

  private handleScoreSubmission(): void {
    if (this.isSubmitted || !this.lastStats) return;
    const input = document.getElementById('input-ranking-nickname') as HTMLInputElement | null;
    const feedback = document.getElementById('ranking-feedback-msg');
    const nickname = input?.value.trim() ?? '';

    const validation = validateNickname(nickname);
    if (!validation.valid) {
      if (feedback) feedback.textContent = `❌ ${validation.reason}`;
      return;
    }

    RankingService.submitScore({
      nickname,
      score: this.lastStats.score,
      days: this.lastStats.days,
      patientsTreated: this.lastStats.patientsTreated,
      unitType: 'ubs',
    }).then((res) => {
      this.isSubmitted = true;
      if (feedback) feedback.textContent = `✅ ${res.message}`;
      const btn = document.getElementById('btn-submit-score');
      if (btn) btn.setAttribute('disabled', 'true');
    });
  }

  private bindEvents(): void {
    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      this.close();
      this.callbacks.onRestart();
    });

    document.getElementById('btn-main-menu')?.addEventListener('click', () => {
      this.close();
      this.callbacks.onMainMenu();
    });

    document.getElementById('btn-submit-score')?.addEventListener('click', () => {
      this.handleScoreSubmission();
    });
  }
}
