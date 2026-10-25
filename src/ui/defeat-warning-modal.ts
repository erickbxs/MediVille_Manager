/**
 * Arquivo: src/ui/defeat-warning-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o modal de alerta crítico pré-derrota exibindo aviso acionável a 2 dias do colapso
 * (dias 5 e 6 consecutivos de caixa negativo ou reputação crítica) com as 3 saídas oficiais do GDD.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar ao jogador oportunidade de reação estratégica para resgatar o hospital antes da derrota definitiva.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O modal escuta o evento global 'defeat:warning' ou pode ser invocado via open(warning).
 *
 * Importa: src/core/event-bus.ts, src/systems/defeat-system.ts
 * Conecta-se com: src/main.ts, src/systems/day-system.ts, src/ui/staff-modal.ts
 */

import type { DefeatWarningInfo } from '../systems/defeat-system';

export interface DefeatWarningModalCallbacks {
  onRequestEmergencyGrant: () => void;
  onOpenDemolishRoom: () => void;
  onOpenStaffAdjustment: () => void;
}

export class DefeatWarningModal {
  private container: HTMLElement;
  private callbacks: DefeatWarningModalCallbacks;

  constructor(container: HTMLElement, callbacks: DefeatWarningModalCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public open(warning: DefeatWarningInfo): void {
    const isCash = warning.type === 'cash';
    const title = isCash ? '⚠️ RISCO IMINENTE DE FALÊNCIA!' : '⚠️ INTERVENÇÃO SANITÁRIA IMINENTE!';
    const reasonText = isCash
      ? `O hospital opera com caixa negativo há ${warning.consecutiveDays} dias consecutivos.`
      : `A reputação hospitalar está abaixo de 10 há ${warning.consecutiveDays} dias consecutivos.`;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500 overflow-hidden flex flex-col p-6 space-y-4">
          
          <div class="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <span class="text-4xl animate-bounce">🚨</span>
            <div>
              <h3 class="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">${title}</h3>
              <p class="text-xs font-bold text-rose-600 dark:text-rose-400">Resta(m) apenas ${warning.daysRemaining} dia(s) para o encerramento das atividades!</p>
            </div>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/50">
            ${reasonText} Conforme o protocolo do GDD, escolha uma das saídas de emergência para evitar a derrota definitiva:
          </p>

          <div class="space-y-2.5">
            <button id="btn-rescue-grant" class="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center justify-between shadow-md hover:brightness-110 active:scale-98 transition-all">
              <span class="flex items-center gap-2"><span>🏛️</span> <span>Solicitar Repasse de Emergência</span></span>
              <span class="px-2 py-0.5 rounded-md bg-white/20 text-[11px]">+ R$ 15.000</span>
            </button>

            <button id="btn-rescue-demolish" class="w-full p-3.5 rounded-2xl bg-amber-500 text-white font-extrabold text-xs flex items-center justify-between shadow-md hover:brightness-110 active:scale-98 transition-all">
              <span class="flex items-center gap-2"><span>🏚️</span> <span>Vender/Demolir Sala Ociosa</span></span>
              <span class="px-2 py-0.5 rounded-md bg-white/20 text-[11px]">+50% Reembolso</span>
            </button>

            <button id="btn-rescue-staff" class="w-full p-3.5 rounded-2xl bg-sky-600 text-white font-extrabold text-xs flex items-center justify-between shadow-md hover:brightness-110 active:scale-98 transition-all">
              <span class="flex items-center gap-2"><span>👥</span> <span>Ajustar Folha Salarial da Equipe</span></span>
              <span class="px-2 py-0.5 rounded-md bg-white/20 text-[11px]">Reduzir Gastos</span>
            </button>
          </div>

          <div class="pt-2 flex justify-end">
            <button id="btn-close-rescue" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Continuar Monitorando
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  public close(): void {
    this.container.innerHTML = '';
  }

  private bindEvents(): void {
    document.getElementById('btn-rescue-grant')?.addEventListener('click', () => {
      this.close();
      this.callbacks.onRequestEmergencyGrant();
    });

    document.getElementById('btn-rescue-demolish')?.addEventListener('click', () => {
      this.close();
      this.callbacks.onOpenDemolishRoom();
    });

    document.getElementById('btn-rescue-staff')?.addEventListener('click', () => {
      this.close();
      this.callbacks.onOpenStaffAdjustment();
    });

    document.getElementById('btn-close-rescue')?.addEventListener('click', () => {
      this.close();
    });
  }
}
