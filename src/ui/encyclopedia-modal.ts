/**
 * Arquivo: src/ui/encyclopedia-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o compêndio interativo da Enciclopédia Médica do SUS com os 150 casos clínicos da APS,
 * com busca reativa, medicamentos RENAME e rolagem horizontal ergonômica nas abas de especialidade.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir layout responsivo, filtros categorizados e retenção pedagógica com rolagem suave por roda, setas e botões.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O catálogo provém de src/data/cases.json e a rolagem horizontal utiliza enableHorizontalScroll de horizontal-scroll.ts.
 *
 * Importa: src/core/config.ts, src/systems/goals-system.ts, src/ui/horizontal-scroll.ts
 * Conecta-se com: src/ui/title-screen.ts, src/main.ts, src/ui/hud.ts
 */

import { CASES_CATALOG, type ClinicalCaseDefinition } from '../core/config';
import { goalsSystem } from '../systems/goals-system';
import { enableHorizontalScroll } from './horizontal-scroll';

interface CategoryOption {
  id: string;
  label: string;
  keywords: string[];
}

const CATEGORY_LIST: CategoryOption[] = [
  { id: 'all', label: 'Todas', keywords: [] },
  { id: 'respiratory', label: 'Respiratória', keywords: ['respirat'] },
  { id: 'viral', label: 'Viral', keywords: ['viral', 'virais'] },
  { id: 'bacterial', label: 'Bacteriana', keywords: ['bacteri'] },
  { id: 'ist', label: 'IST', keywords: ['ist', 'genital', 'venéreo', 'donovanose', 'cancro'] },
  { id: 'tropical', label: 'Tropical', keywords: ['tropical', 'tropicais', 'negligenciada', 'maculosa'] },
  { id: 'parasitic', label: 'Parasitária', keywords: ['parasit', 'larva', 'tênia', 'bicho', 'pediculose'] },
  { id: 'digestive', label: 'Digestiva', keywords: ['digest', 'gástrico', 'hepátic', 'intestinal', 'fissura', 'hemorroida'] },
  { id: 'cardiovascular', label: 'Cardiovascular', keywords: ['cardio', 'pressão', 'pericardite', 'bradicardia', 'taquicardia'] },
  { id: 'hematology', label: 'Hematologia', keywords: ['hematol', 'anemia', 'falciforme', 'leucemia', 'púrpura', 'plaqueta', 'neutropenia'] },
  { id: 'rheumatology', label: 'Reumatologia', keywords: ['reumato', 'lúpus', 'espondilite', 'artrite', 'fibromialgia'] },
  { id: 'neurological', label: 'Neurológica', keywords: ['neuro', 'cefaleia', 'trigêmeo'] },
  { id: 'endocrine', label: 'Endócrina', keywords: ['endócrin', 'diabetes', 'tireoide', 'adrenal', 'potássio'] },
  { id: 'trauma', label: 'Trauma', keywords: ['trauma', 'entorse', 'fratura', 'luxação'] },
  { id: 'toxicology', label: 'Toxicologia', keywords: ['toxico', 'intoxicação', 'picada', 'veneno'] },
  { id: 'allergy', label: 'Alergia', keywords: ['alerg', 'anafilaxia', 'urticária'] },
  { id: 'obstetrics', label: 'Obstetrícia', keywords: ['obstetr', 'gestan', 'mulher', 'eclâmpsia', 'pélvica', 'útero'] },
  { id: 'pediatrics', label: 'Pediatria', keywords: ['pediatr', 'infantil', 'lactente', 'criança', 'pni', 'coqueluche', 'caxumba'] },
  { id: 'mental_health', label: 'Saúde Mental', keywords: ['mental', 'depress', 'ansiedade', 'bipolar', 'insônia', 'álcool'] },
  { id: 'urology', label: 'Urologia', keywords: ['urolog', 'urinár', 'cistite', 'renal'] },
  { id: 'dermatology', label: 'Dermatologia', keywords: ['dermat', 'pele', 'furunculose', 'tinea', 'pitiríase', 'esporotricose'] },
  { id: 'orl_ophthalmology', label: 'Oftalmologia/ORL', keywords: ['oftalmo', 'orl', 'ouvido', 'olho', 'otite', 'cerume', 'terçol'] },
];

function caseMatchesCategory(c: ClinicalCaseDefinition, cat: CategoryOption): boolean {
  if (cat.id === 'all') return true;
  const area = c.area.toLowerCase();
  const name = c.name.toLowerCase();
  return cat.keywords.some((kw) => area.includes(kw) || name.includes(kw));
}

function caseMatchesSearch(c: ClinicalCaseDefinition, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const inName = c.name.toLowerCase().includes(q);
  const inArea = c.area.toLowerCase().includes(q);
  const inSymptoms = c.symptoms.some((s) => s.toLowerCase().includes(q));
  const inConduct = c.suggestedConduct.text.toLowerCase().includes(q);
  return inName || inArea || inSymptoms || inConduct;
}

export class EncyclopediaModal {
  private container: HTMLElement;
  private activeCategory = 'all';
  private searchQuery = '';
  private onPracticeCallback?: (caseId: string) => void;
  private scrollCleanup?: () => void;

  constructor(container: HTMLElement, onPractice?: (caseId: string) => void) {
    this.container = container;
    this.onPracticeCallback = onPractice;
  }

  public open(): void {
    this.render();
  }

  public close(): void {
    this.scrollCleanup?.();
    this.container.innerHTML = '';
  }

  private render(): void {
    const unlockedSet = new Set(goalsSystem.getUnlockedCaseIds());
    const allCases = CASES_CATALOG.cases;
    const unlockedCount = allCases.filter((c) => unlockedSet.has(c.id)).length;
    const currentCat = CATEGORY_LIST.find((cat) => cat.id === this.activeCategory) || CATEGORY_LIST[0]!;

    const filteredCases = allCases.filter((c) => {
      const matchCat = caseMatchesCategory(c, currentCat);
      const matchSearch = caseMatchesSearch(c, this.searchQuery);
      return matchCat && matchSearch;
    });

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[88dvh]">
          ${this.renderHeader(unlockedCount, allCases.length)}
          ${this.renderCategoryBar(unlockedSet, allCases)}
          ${this.renderBody(filteredCases, unlockedSet)}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderHeader(unlockedCount: number, totalCount: number): string {
    const pct = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);
    return `
      <div class="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md space-y-3">
        <!-- Top bar modal -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center text-xl shrink-0">📖</div>
            <div>
              <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Enciclopédia Médica SUS</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span class="tabular-nums font-bold text-blue-600 dark:text-blue-400">${unlockedCount}/${totalCount}</span> Protocolos Dominados (${pct}%)
              </p>
            </div>
          </div>
          <button id="btn-close-encyclopedia" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">✕</button>
        </div>

        <!-- Barra de Progresso Geral -->
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>

        <!-- Campo de Busca Rápida -->
        <div class="relative">
          <input
            id="input-encyclopedia-search"
            type="text"
            value="${this.searchQuery}"
            placeholder="🔍 Buscar por patologia, sintoma ou conduta..."
            class="w-full text-xs py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>
    `;
  }

  private renderCategoryBar(unlockedSet: Set<string>, allCases: ClinicalCaseDefinition[]): string {
    const pillsHtml = CATEGORY_LIST.map((cat) => {
      const catCases = allCases.filter((c) => caseMatchesCategory(c, cat));
      const catUnlocked = catCases.filter((c) => unlockedSet.has(c.id)).length;
      const isActive = this.activeCategory === cat.id;

      return `
        <button
          data-cat="${cat.id}"
          class="btn-encyclopedia-cat shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isActive
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }"
        >
          ${cat.label} <span class="tabular-nums font-normal opacity-85 text-[11px]">(${catUnlocked}/${catCases.length})</span>
        </button>
      `;
    }).join('');

    return `
      <div class="shrink-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <!-- Desktop / Tablet: Flex Wrap Compacto -->
        <div class="hidden sm:flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2">
          ${pillsHtml}
        </div>
        <!-- Mobile: Rolagem Horizontal Fluida com Snap e Botões -->
        <div class="relative sm:hidden flex items-center">
          <button id="btn-ency-scroll-prev" aria-label="Rolar esquerda" class="opacity-0 pointer-events-none transition-opacity absolute left-0 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">◀</button>
          <div id="ency-categories-carousel" class="flex flex-nowrap overflow-x-auto snap-x touch-pan-x py-2 px-2 gap-1.5 no-scrollbar w-full">
            ${pillsHtml}
          </div>
          <button id="btn-ency-scroll-next" aria-label="Rolar direita" class="transition-opacity absolute right-0 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">▶</button>
        </div>
      </div>
    `;
  }

  private renderBody(cases: ClinicalCaseDefinition[], unlockedSet: Set<string>): string {
    if (cases.length === 0) {
      return `
        <div class="flex-1 min-h-0 overflow-y-auto p-8 text-center flex flex-col items-center justify-center">
          <span class="text-4xl mb-2">🔍</span>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum protocolo clínico encontrado</p>
          <p class="text-xs text-slate-400 mt-1">Tente ajustar a busca ou trocar a área médica selecionada.</p>
        </div>
      `;
    }

    return `
      <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5">
        <div class="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <span class="text-base shrink-0">💡</span>
          <span><strong>Mecânica SUS:</strong> Ao acertar a conduta médica de um caso no consultório, ele é dominado pela equipe e resolvido automaticamente com repasse de bônus!</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${cases.map((c) => this.renderCaseCard(c, unlockedSet.has(c.id))).join('')}
        </div>
      </div>
    `;
  }

  private renderCaseCard(c: ClinicalCaseDefinition, isUnlocked: boolean): string {
    if (!isUnlocked) {
      return `
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/60 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
          <div class="flex items-start gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">🔒</div>
            <div>
              <span class="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                ${c.area} • ${c.typicalUnit}
              </span>
              <h4 class="font-bold text-xs text-slate-700 dark:text-slate-300 mt-1">${c.name}</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">Atenda no consultório para instituir e dominar o protocolo.</p>
            </div>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex justify-between items-center text-[10px] text-slate-400">
            <span>Gravidade: ${c.severity}</span>
            <span class="font-bold text-amber-500">Aguardando Caso</span>
          </div>
        </div>
      `;
    }

    const source = c.sources[0]?.name ?? 'Ministério da Saúde - RENAME';
    const sourceDate = c.reviewedOn || '2026';

    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-emerald-500/30 shadow-xs flex flex-col justify-between space-y-2.5">
        <div>
          <div class="flex items-start justify-between gap-1.5 mb-1.5">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              ${c.area} • ${c.typicalUnit} • ${c.severity}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-extrabold">⚡ Dominado</span>
          </div>

          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">${c.name}</h4>

          <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-2 space-y-1">
            <strong class="text-slate-700 dark:text-slate-200">Sintomas:</strong>
            <ul class="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400 pl-0.5">
              ${c.symptoms.slice(0, 3).map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[11px] text-emerald-950 dark:text-emerald-200 mt-2">
            <strong>Conduta RENAME:</strong> ${c.suggestedConduct.text}
          </div>

          <p class="text-[10px] text-slate-400 italic mt-1.5 line-clamp-2">${c.explanation}</p>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span class="text-[9px] text-slate-400 truncate" title="${source} (${sourceDate})">📚 ${source}</span>
          <button data-practice-id="${c.id}" class="btn-practice-case px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shrink-0">
            🔄 Praticar
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    document.getElementById('btn-close-encyclopedia')?.addEventListener('click', () => {
      this.close();
    });

    const searchInput = document.getElementById('input-encyclopedia-search') as HTMLInputElement | null;
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.render();
    });

    const carousel = document.getElementById('ency-categories-carousel');
    const prevBtn = document.getElementById('btn-ency-scroll-prev');
    const nextBtn = document.getElementById('btn-ency-scroll-next');
    if (carousel) {
      this.scrollCleanup?.();
      this.scrollCleanup = enableHorizontalScroll(carousel, {
        prevButton: prevBtn,
        nextButton: nextBtn,
        step: 180,
      });
    }

    this.container.querySelectorAll('.btn-encyclopedia-cat').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat');
        if (cat) {
          this.activeCategory = cat;
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-practice-case').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const caseId = (e.currentTarget as HTMLElement).getAttribute('data-practice-id');
        if (caseId && this.onPracticeCallback) {
          this.close();
          this.onPracticeCallback(caseId);
        }
      });
    });
  }
}
