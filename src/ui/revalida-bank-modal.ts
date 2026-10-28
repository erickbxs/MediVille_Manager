/**
 * Arquivo: src/ui/revalida-bank-modal.ts
 * O que faz: Mostra o Banco de Questões do Revalida — progresso (dominadas, para revisar, novas), áreas liberadas
 * pelas salas do hospital, filtros por área/edição, busca e leitura de cada questão.
 * Para que foi criado: Substituir a Enciclopédia no Modo Revalida, servindo de "caderno de estudo" do jogador.
 * Como modificar/debugar: As questões vêm de getRevalidaQuestions(); o progresso vem de state.masteredCaseIds e
 * state.revalidaReviewIds. O gabarito só aparece para questões já respondidas (para não estragar o estudo).
 * Importa: src/core/config.ts, src/entities/revalida-question.ts, src/i18n/i18n.ts, src/state/game-state.ts,
 *          src/systems/revalida-system.ts, src/ui/revalida-question-view.ts
 * Conecta-se com: src/main.ts, src/ui/title-screen.ts, src/ui/build-menu.ts
 */

import { ROOMS_CATALOG } from '../core/config';
import type { RevalidaArea, RevalidaQuestion } from '../entities/revalida-question';
import { getRoomShortName, t } from '../i18n/i18n';
import type { GameState } from '../state/game-state';
import {
  REVALIDA_AREAS,
  formatRevalidaReference,
  getAreaRoomId,
  getRevalidaCommentary,
  getRevalidaQuestions,
  getUnlockedAreas,
} from '../systems/revalida-system';
import { areaLabel, escapeHtml, renderStem } from './revalida-question-view';

type Status = 'mastered' | 'review' | 'new';

const PAGE_SIZE = 25;
const PREVIEW_CHARS = 150;

export class RevalidaBankModal {
  private container: HTMLElement;
  private getState: () => GameState;
  private area: RevalidaArea | 'all' = 'all';
  private edition = 'all';
  private search = '';
  private limit = PAGE_SIZE;
  private openId: string | null = null;
  private onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') this.close(); };

  constructor(container: HTMLElement, getState: () => GameState) {
    this.container = container;
    this.getState = getState;
  }

  public open(): void {
    this.limit = PAGE_SIZE;
    this.openId = null;
    document.addEventListener('keydown', this.onKey);
    this.render();
  }

  public close(): void {
    document.removeEventListener('keydown', this.onKey);
    this.container.innerHTML = '';
  }

  private statusOf(q: RevalidaQuestion, state: GameState): Status {
    if (state.revalidaReviewIds.includes(q.id)) return 'review';
    return state.masteredCaseIds.includes(q.id) ? 'mastered' : 'new';
  }

  private filtered(): RevalidaQuestion[] {
    const term = this.search.trim().toLowerCase();
    return getRevalidaQuestions().filter((q) =>
      (this.area === 'all' || q.area === this.area) &&
      (this.edition === 'all' || q.editionLabel === this.edition) &&
      (!term || `${q.stem} ${formatRevalidaReference(q)} ${q.number}`.toLowerCase().includes(term)));
  }

  private renderStats(state: GameState): string {
    const all = getRevalidaQuestions();
    const counts = { mastered: 0, review: 0, new: 0 };
    all.forEach((q) => { counts[this.statusOf(q, state)] += 1; });
    const tile = (label: string, value: number, tone: string): string =>
      `<div class="rounded-2xl p-3 ${tone}"><div class="text-xl font-black tabular-nums">${value}</div><div class="text-[11px] font-bold">${escapeHtml(label)}</div></div>`;
    return `<div class="grid grid-cols-3 gap-2">
      ${tile(t('revalida.stat_mastered'), counts.mastered, 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300')}
      ${tile(t('revalida.stat_review'), counts.review, 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300')}
      ${tile(t('revalida.stat_new'), counts.new, 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}
    </div>`;
  }

  private renderAreaChips(state: GameState): string {
    const unlocked = new Set(getUnlockedAreas(state));
    const chip = (id: string, label: string, active: boolean, locked: boolean, hint: string): string =>
      `<button data-area="${id}" title="${escapeHtml(hint)}" class="shrink-0 min-h-[40px] px-3 rounded-full text-xs font-bold border transition-all ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}">${locked ? '🔒 ' : ''}${escapeHtml(label)}</button>`;
    const chips = REVALIDA_AREAS.map((a) => {
      const room = ROOMS_CATALOG.rooms.find((r) => r.id === getAreaRoomId(a));
      const hint = unlocked.has(a) ? t('revalida.unlocked_area') : t('revalida.locked_area', { room: room ? getRoomShortName(room.id) : getAreaRoomId(a) });
      return chip(a, areaLabel(a), this.area === a, !unlocked.has(a), hint);
    });
    return `<div class="flex gap-2 overflow-x-auto pb-1">${chip('all', t('revalida.filter_all'), this.area === 'all', false, '')}${chips.join('')}</div>`;
  }

  private renderEditionSelect(): string {
    const editions = [...new Set(getRevalidaQuestions().map((q) => q.editionLabel))].sort().reverse();
    const opts = editions.map((e) => `<option value="${e}" ${e === this.edition ? 'selected' : ''}>Revalida ${e}</option>`).join('');
    return `<select id="revalida-edition" aria-label="Edição" class="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
      <option value="all">${escapeHtml(t('revalida.filter_all'))}</option>${opts}</select>`;
  }

  private renderItem(q: RevalidaQuestion, state: GameState): string {
    const status = this.statusOf(q, state);
    const badge = { mastered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', review: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', new: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' }[status];
    const isOpen = this.openId === q.id;
    const preview = q.stem.replace(/\[\[FIG:\d+\]\]/g, '').slice(0, PREVIEW_CHARS);
    return `
      <li class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button data-qid="${q.id}" aria-expanded="${isOpen}" class="w-full text-left p-3.5 flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
            <span>${escapeHtml(formatRevalidaReference(q))} · ${escapeHtml(areaLabel(q.area))}</span>
            <span class="shrink-0 px-2 py-0.5 rounded-full ${badge}">${escapeHtml(t(`revalida.status_${status}`))}</span>
          </div>
          <div class="text-sm text-slate-700 dark:text-slate-200">${escapeHtml(preview)}…</div>
        </button>
        ${isOpen ? this.renderDetail(q, status) : ''}
      </li>`;
  }

  private renderDetail(q: RevalidaQuestion, status: Status): string {
    const options = q.options.map((o) => `<li><b>${o.key})</b> ${escapeHtml(o.text)}</li>`).join('');
    const comment = getRevalidaCommentary(q.id);
    const answer = status === 'new' ? '' : `
      <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100">
        <b>${escapeHtml(t('revalida.answer_official'))}: ${q.answer}</b>
        ${comment ? `<div class="mt-1">${escapeHtml(comment)}</div>` : ''}
      </div>`;
    return `<div class="px-3.5 pb-3.5 space-y-2 text-sm text-slate-800 dark:text-slate-100">
      ${renderStem(q)}<ol class="space-y-1">${options}</ol>${answer}
      <p class="text-[11px] text-slate-500">${escapeHtml(t('revalida.license_note'))}</p></div>`;
  }

  private renderList(state: GameState): string {
    const items = this.filtered();
    if (!items.length) return `<p class="text-center text-sm text-slate-500 py-8">${escapeHtml(t('revalida.empty'))}</p>`;
    const more = items.length > this.limit
      ? `<button id="revalida-more" class="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm">${escapeHtml(t('revalida.show_more'))} (${items.length - this.limit})</button>`
      : '';
    return `<ul class="space-y-2">${items.slice(0, this.limit).map((q) => this.renderItem(q, state)).join('')}</ul>${more}`;
  }

  private render(): void {
    const state = this.getState();
    const total = getRevalidaQuestions().length;
    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="revalida-bank-title">
        <div class="w-full max-w-3xl bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col max-h-[92dvh]">
          <div class="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 id="revalida-bank-title" class="font-black text-lg text-slate-900 dark:text-slate-50">📚 ${escapeHtml(t('revalida.bank_title'))}</h2>
              <p class="text-xs text-slate-500">${escapeHtml(t('revalida.bank_subtitle', { total }))}</p>
            </div>
            <button id="revalida-bank-close" aria-label="${escapeHtml(t('common.close'))}" class="shrink-0 w-11 h-11 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-lg">✕</button>
          </div>
          <div class="p-4 space-y-3 overflow-y-auto min-h-0">
            ${this.renderStats(state)}
            <details class="rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 p-3 text-xs"><summary class="font-bold cursor-pointer">💡 ${escapeHtml(t('revalida.tip_title'))}</summary><p class="mt-1">${escapeHtml(t('revalida.tip_text'))}</p></details>
            ${this.renderAreaChips(state)}
            <div class="flex flex-col sm:flex-row gap-2">
              <input id="revalida-search" type="search" value="${escapeHtml(this.search)}" placeholder="${escapeHtml(t('revalida.search_placeholder'))}" class="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
              ${this.renderEditionSelect()}
            </div>
            <div id="revalida-list">${this.renderList(state)}</div>
          </div>
        </div>
      </div>`;
    this.bind();
  }

  private bind(): void {
    document.getElementById('revalida-bank-close')?.addEventListener('click', () => this.close());
    this.container.querySelectorAll<HTMLButtonElement>('[data-area]').forEach((b) => b.addEventListener('click', () => {
      this.area = (b.dataset.area as RevalidaArea | 'all') ?? 'all';
      this.limit = PAGE_SIZE;
      this.render();
    }));
    document.getElementById('revalida-edition')?.addEventListener('change', (e) => {
      this.edition = (e.target as HTMLSelectElement).value;
      this.limit = PAGE_SIZE;
      this.render();
    });
    document.getElementById('revalida-search')?.addEventListener('change', (e) => {
      this.search = (e.target as HTMLInputElement).value;
      this.render();
    });
    this.bindList();
  }

  private bindList(): void {
    this.container.querySelectorAll<HTMLButtonElement>('[data-qid]').forEach((b) => b.addEventListener('click', () => {
      this.openId = this.openId === b.dataset.qid ? null : (b.dataset.qid ?? null);
      this.refreshList();
    }));
    document.getElementById('revalida-more')?.addEventListener('click', () => {
      this.limit += PAGE_SIZE;
      this.refreshList();
    });
  }

  private refreshList(): void {
    const list = document.getElementById('revalida-list');
    if (!list) return;
    list.innerHTML = this.renderList(this.getState());
    this.bindList();
  }
}
