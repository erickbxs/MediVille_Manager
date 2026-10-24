/**
 * Arquivo: src/ui/age-gate-modal.ts
 * O que faz: Exibe a tela neutra de verificação de ano de nascimento na primeira abertura do jogo para respeitar diretrizes de privacidade.
 * Para que foi criado: Cumprir o Prompt 13 do GDD com design amigável e sem coleta de dados sensíveis.
 * Como modificar/debugar: Ajuste os textos ou intervalo de anos válidos aqui.
 * Importa: src/systems/player-profile.ts
 * Conecta-se com: src/main.ts
 */

import { savePlayerAgeVerification, type PlayerProfile } from '../systems/player-profile';

export class AgeGateModal {
  private container: HTMLElement;
  private onComplete: (profile: PlayerProfile) => void;

  constructor(container: HTMLElement, onComplete: (profile: PlayerProfile) => void) {
    this.container = container;
    this.onComplete = onComplete;
  }

  public show(): void {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxYear = currentYear;

    let optionsHtml = '';
    for (let y = currentYear - 10; y >= minYear; y--) {
      optionsHtml += `<option value="${y}">${y}</option>`;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-5">
          
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-sky-500/15 flex items-center justify-center text-2xl">
              🏥
            </div>
            <div>
              <h2 class="font-extrabold text-lg text-slate-900 dark:text-slate-50">Bem-vindo ao MediVille!</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Gestão Hospitalar & Saúde Pública</p>
            </div>
          </div>

          <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p class="leading-relaxed">
              Para personalizar sua experiência de acordo com as normas de proteção digital, informe seu ano de nascimento:
            </p>
          </div>

          <div>
            <label for="birth-year-select" class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Ano de Nascimento:
            </label>
            <select id="birth-year-select" class="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="" disabled selected>Selecione o ano...</option>
              ${optionsHtml}
            </select>
          </div>

          <div class="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            🔒 <strong>Privacidade:</strong> Não armazenamos datas exatas nem informações pessoais. Menores de 13 anos jogam no modo convidado local.
          </div>

          <button id="btn-confirm-age" disabled class="w-full min-h-[48px] py-3 px-5 rounded-2xl font-bold text-sm bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-98 transition-all">
            Continuar para o Hospital
          </button>
        </div>
      </div>
    `;

    this.bindEvents(minYear, maxYear);
  }

  private bindEvents(minYear: number, maxYear: number): void {
    const select = document.getElementById('birth-year-select') as HTMLSelectElement;
    const confirmBtn = document.getElementById('btn-confirm-age') as HTMLButtonElement;

    select?.addEventListener('change', () => {
      const val = parseInt(select.value, 10);
      if (val >= minYear && val <= maxYear) {
        confirmBtn.disabled = false;
      }
    });

    confirmBtn?.addEventListener('click', () => {
      const year = parseInt(select.value, 10);
      if (isNaN(year)) return;

      const profile = savePlayerAgeVerification(year);
      this.container.innerHTML = '';
      this.onComplete(profile);
    });
  }
}
