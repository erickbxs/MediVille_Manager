/**
 * Arquivo: src/ui/revalida-question-view.ts
 * O que faz: Gera o HTML da questão do Revalida (enunciado com figuras, alternativas A–D, resultado e referência INEP).
 * Para que foi criado: Separar o desenho da questão oficial do modal de decisão, mantendo o texto do INEP sem alterações.
 * Como modificar/debugar: Figuras aparecem no enunciado pelo marcador [[FIG:n]]; os arquivos ficam em public/revalida/img/.
 * Todo texto vindo do JSON passa por escapeHtml (alguns enunciados têm "<https://...>").
 * Importa: src/core/config.ts, src/entities/revalida-question.ts, src/entities/clinical-case.ts, src/i18n/i18n.ts
 * Conecta-se com: src/ui/decision-modal.ts, src/ui/revalida-bank-modal.ts
 */

import { BALANCE } from '../core/config';
import type { RevalidaArea, RevalidaCasePayload, RevalidaQuestion } from '../entities/revalida-question';
import type { ConductOption } from '../entities/clinical-case';
import { t } from '../i18n/i18n';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function areaLabel(area: RevalidaArea): string {
  return t(`revalida.area.${area}`);
}

function renderFigure(q: RevalidaQuestion, index: number): string {
  const file = q.images?.[index - 1];
  if (!file) return '';
  const src = `${BALANCE.revalida.imageBasePath}${file}`;
  const alt = escapeHtml(t('revalida.figure_alt', { n: q.number }));
  return `<a href="${src}" target="_blank" rel="noopener" title="${escapeHtml(t('revalida.figure_zoom'))}" class="block my-2">
    <img src="${src}" alt="${alt}" loading="lazy" class="w-full max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white">
    <span class="block text-[11px] text-sky-700 dark:text-sky-300 mt-1">🔍 ${escapeHtml(t('revalida.figure_zoom'))}</span>
  </a>`;
}

export function renderStem(q: RevalidaQuestion): string {
  return q.stem
    .split('\n')
    .map((line) => {
      const fig = line.match(/^\[\[FIG:(\d+)\]\]$/);
      if (fig) return renderFigure(q, Number(fig[1]));
      return `<p class="leading-relaxed">${escapeHtml(line)}</p>`;
    })
    .join('');
}

export function renderOptionButtons(options: ConductOption[]): string {
  return options.map((opt) => {
    const key = opt.id.slice(-1);
    return `
      <button data-conduct-id="${opt.id}" class="conduct-btn btn-interactive w-full min-h-[48px] text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-700/80 transition-all text-sm text-slate-800 dark:text-slate-100 flex gap-3 items-start">
        <span class="shrink-0 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-extrabold text-xs">${key}</span>
        <span class="pt-0.5">${escapeHtml(opt.text)}</span>
      </button>`;
  }).join('');
}

export function renderReferenceLine(payload: RevalidaCasePayload): string {
  const q = payload.question;
  const preliminary = q.preliminaryKey ? `<div>${escapeHtml(t('revalida.preliminary_key'))}</div>` : '';
  return `
    <div class="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-0.5">
      <div class="font-bold">${escapeHtml(t('revalida.reference_label'))}: ${escapeHtml(payload.reference)}</div>
      <div>${escapeHtml(t('revalida.license_note'))}</div>
      ${preliminary}
    </div>`;
}

export function renderRevalidaFeedback(payload: RevalidaCasePayload, chosenKey: string, isCorrect: boolean): string {
  const tone = isCorrect
    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
  const title = isCorrect ? t('revalida.correct') : t('revalida.wrong');
  const comment = payload.commentary
    ? `<div class="mt-2"><span class="font-bold">${escapeHtml(t('revalida.comment_title'))}:</span> ${escapeHtml(payload.commentary)}</div>`
    : `<div class="mt-2 opacity-80">${escapeHtml(t('revalida.comment_pending'))}</div>`;
  return `
    <div class="p-4 rounded-2xl border text-sm ${tone}">
      <div class="font-extrabold">${isCorrect ? '✅' : '❌'} ${escapeHtml(title)}</div>
      <div class="mt-1">${escapeHtml(t('revalida.your_answer'))}: <b>${chosenKey}</b> · ${escapeHtml(t('revalida.answer_official'))}: <b>${payload.question.answer}</b></div>
      ${isCorrect ? '' : `<div class="mt-1 text-xs opacity-80">${escapeHtml(t('revalida.review_note'))}</div>`}
      ${comment}
    </div>`;
}

/** Destaca a alternativa certa (verde) e a escolhida errada (vermelho) depois da resposta. */
export function markAnsweredOptions(root: HTMLElement, options: ConductOption[], chosenId: string): void {
  root.querySelectorAll<HTMLButtonElement>('.conduct-btn').forEach((btn) => {
    const opt = options.find((o) => o.id === btn.dataset.conductId);
    btn.disabled = true;
    if (opt?.isCorrect) btn.classList.add('!border-emerald-500', '!bg-emerald-50', 'dark:!bg-emerald-950/40');
    else if (opt?.id === chosenId) btn.classList.add('!border-rose-500', '!bg-rose-50', 'dark:!bg-rose-950/40');
  });
}
