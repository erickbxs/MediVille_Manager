/**
 * Arquivo: src/ui/finances-modal.ts
 *
 * 1. O que este arquivo faz?
 * Exibe o demonstrativo financeiro do SUS (procedimentos BPA/AIH faturados, repasses do Ministério da Saúde) e gerencia o Sistema de Negociação Governamental de Repasses (ciclo de 30 dias do GDD).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir os requisitos do GDD e Prompt 12 de pactuação tripartite de recursos do SUS (PAB/MAC), permitindo aumento de repasse conforme reputação e protocolos dominados.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O cálculo de probabilidades e cooldown de 30 dias residem em src/systems/economy-system.ts.
 *
 * Importa: src/core/simulation.ts, src/systems/economy-system.ts, src/core/config.ts
 * Conecta-se com: src/ui/hud.ts, src/main.ts
 */

import { BALANCE, SIGTAP_CATALOG } from '../core/config';
import type { HospitalSimulation } from '../core/simulation';
import {
  requestEmergencyGrant,
  calculateNegotiationChances,
  executeGovernmentNegotiation,
  setPrivateConsultationFee,
  toggleContract,
  type NegotiationResult,
} from '../systems/economy-system';
import { getNextExpansion, expandMap } from '../systems/map-expansion-system';

export class FinancesModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;
  private lastNegotiationFeedback: NegotiationResult | null = null;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(): void {
    this.simulation.pauseForModal();
    const state = this.simulation.state;
    const { finances, cash } = state;
    const procedures = SIGTAP_CATALOG.procedures;
    const chances = calculateNegotiationChances(state);
    const cooldown = state.governmentNegotiationCooldownDays;
    const bonusMultiplier = state.governmentGrantBonusMultiplier;
    const isCommercial = state.unitType === 'private_clinic' || state.unitType === 'hospital';
    const isSusUnit = state.unitType === 'ubs' || state.unitType === 'upa' || state.unitType === 'hospital';

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[88dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">
                ${state.unitType === 'private_clinic' ? '💼' : '🏛️'}
              </div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">
                  ${state.unitType === 'private_clinic' ? 'Gestão Financeira & Convênios' : 'Finanças & Economia Hospitalar'}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ${state.unitType === 'private_clinic' ? 'Planos privados, tabela de consultas e balanço' : 'SUS, convênios, repasses e balanço'}
                </p>
              </div>
            </div>
            <button id="btn-close-finances" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-5 overflow-y-auto space-y-6 text-sm flex-1">
            ${isCommercial ? this.renderCommercialSection() : ''}
            ${isSusUnit ? this.renderNegotiationCard(chances, cooldown, bonusMultiplier) : ''}

            ${(() => {
              const nextExp = getNextExpansion(state);
              if (!nextExp) return '';
              const canAfford = state.cash >= nextExp.cost;
              return `
                <div class="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span class="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">Expansão de Terreno</span>
                    <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">${nextExp.title}</h4>
                    <p class="text-[11px] text-slate-500 max-w-sm mt-0.5">Expande a laje para acomodar novas instalações de alta complexidade.</p>
                  </div>
                  <button id="btn-finance-expand" ${canAfford ? '' : 'disabled'} class="min-h-[42px] px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all ${canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'}">
                    📐 Expandir Terreno (+4x4 — R$ ${(nextExp.cost / 1000).toFixed(0)}k)
                  </button>
                </div>
              `;
            })()}

            ${isSusUnit ? `
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">Socorro Orçamentário</span>
                <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">Verba Emergencial da Secretaria de Saúde</h4>
                <p class="text-[11px] text-slate-500 max-w-sm mt-0.5">Injeção extraordinária de caixa para reformas ou cobrir déficits.</p>
              </div>
              <button id="btn-modal-grant" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs active:scale-95 transition-all">
                🏛️ Solicitar (+R$ ${BALANCE.emergencyGrant.amount.toLocaleString('pt-BR')})
              </button>
            </div>
            ` : ''}

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Caixa Atual</span>
                <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">R$ ${cash.toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Faturado SUS</span>
                <span class="text-sm font-extrabold text-sky-600 dark:text-sky-400">R$ ${(finances.bpaRevenue + (finances.aihRevenue ?? 0)).toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Particulares</span>
                <span class="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">R$ ${(finances.privateRevenue ?? 0).toLocaleString('pt-BR')}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span class="text-[11px] text-slate-400 font-semibold block">Convênios</span>
                <span class="text-sm font-extrabold text-violet-600 dark:text-violet-400">R$ ${(finances.contractsRevenue ?? 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tabela SIGTAP de Procedimentos</h4>
              <div class="space-y-2">
                ${procedures.map((p) => `
                  <div class="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/30 dark:bg-slate-800/20">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold">${p.code}</span>
                        <strong class="text-slate-800 dark:text-slate-200">${p.name}</strong>
                        <span class="text-[10px] font-bold text-sky-600">${p.type}</span>
                      </div>
                      <p class="text-slate-400 text-[11px] mt-0.5">${p.description}</p>
                    </div>
                    <span class="font-extrabold text-emerald-600 text-sm whitespace-nowrap ml-2">R$ ${p.baseValue.toLocaleString('pt-BR')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
            <button id="btn-done-finances" class="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all">
              Fechar
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderCommercialSection(): string {
    const state = this.simulation.state;
    const fee = state.privateConsultationFee ?? BALANCE.mixedEconomy.defaultConsultationFee;
    const contracts = state.activeContracts ?? [];
    const plans = BALANCE.mixedEconomy.plans;

    const isCheap = fee <= BALANCE.mixedEconomy.lowPriceThreshold;
    const isExpensive = fee > BALANCE.mixedEconomy.highPriceThreshold;
    const demandFeedback = isCheap
      ? '🟢 Preço acessível: +25% na taxa de chegada de clientes!'
      : isExpensive
        ? state.reputation >= BALANCE.mixedEconomy.requiredReputationForHighPrice
          ? '🌟 Preço premium validado pela excelente reputação (>75)!'
          : '⚠️ Preço alto com reputação insuficiente reduz o fluxo de clientes!'
        : '⚪ Preço equilibrado com demanda média de mercado.';

    return `
      <div class="p-4 rounded-3xl bg-linear-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/25 space-y-4">
        <div>
          <span class="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">Gestão Comercial</span>
          <h4 class="font-extrabold text-base text-slate-900 dark:text-slate-100">Preço da Consulta & Convênios Médicos</h4>
          <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Defina o valor da consulta particular e assine contratos com operadoras de saúde para garantir fluxo diário fixo.
          </p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-emerald-500/20 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Preço da Consulta Particular</span>
            <span class="text-base font-extrabold text-emerald-600 dark:text-emerald-400">R$ ${fee.toLocaleString('pt-BR')}</span>
          </div>
          <div class="flex items-center gap-3">
            <button id="btn-fee-minus" class="min-w-[40px] min-h-[40px] rounded-xl bg-slate-200 dark:bg-slate-700 font-extrabold text-base active:scale-95 transition-all">-</button>
            <input id="slider-fee" type="range" min="${BALANCE.mixedEconomy.minConsultationFee}" max="${BALANCE.mixedEconomy.maxConsultationFee}" step="200" value="${fee}" class="w-full accent-emerald-500 cursor-pointer" />
            <button id="btn-fee-plus" class="min-w-[40px] min-h-[40px] rounded-xl bg-slate-200 dark:bg-slate-700 font-extrabold text-base active:scale-95 transition-all">+</button>
          </div>
          <p class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">${demandFeedback}</p>
        </div>

        <div class="space-y-2">
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Planos de Convênio (Ativos: ${contracts.length}/3)
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            ${plans.map((plan) => {
              const active = contracts.includes(plan.id);
              return `
                <div class="p-3 rounded-2xl border transition-all ${active ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'} flex flex-col justify-between gap-2">
                  <div>
                    <strong class="text-xs font-bold block">${plan.name}</strong>
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold block">R$ ${plan.feePerPatient.toLocaleString('pt-BR')} / consulta</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 block">+${plan.dailyBonusArrival} pacientes/dia</span>
                  </div>
                  <button data-plan-id="${plan.id}" class="btn-toggle-contract min-h-[34px] px-2 py-1 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${active ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}">
                    ${active ? '✕ Rescindir' : '✓ Contratar'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderNegotiationCard(
    chances: { totalAcceptChance: number; partialAcceptChance: number; deniedChance: number },
    cooldown: number,
    bonusMultiplier: number
  ): string {
    const isCoolingDown = cooldown > 0;
    const feedback = this.lastNegotiationFeedback;

    return `
      <div class="p-4 rounded-3xl bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-transparent border border-indigo-500/25 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">Pactuação Bipartite / Tripartite</span>
            <h4 class="font-extrabold text-base text-slate-900 dark:text-slate-100">Negociação de Repasse SUS (Ciclo de 30 Dias)</h4>
          </div>
          <span class="text-xs font-extrabold px-2.5 py-1 rounded-full ${bonusMultiplier > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">
            ${bonusMultiplier > 0 ? `Repasse +${Math.round(bonusMultiplier * 100)}%` : 'Repasse Base'}
          </span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300">
          Solicite aumento do teto PAB/MAC ao Ministério da Saúde. Suas chances aumentam com a <strong>Reputação</strong> e o número de <strong>Protocolos Clínicos Dominados</strong>.
        </p>

        <div class="grid grid-cols-3 gap-2 text-center py-1">
          <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Aceite Total (+40%)</span>
            <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">${Math.round(chances.totalAcceptChance * 100)}%</span>
          </div>
          <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">Aceite Parcial (+20%)</span>
            <span class="text-sm font-extrabold text-amber-600 dark:text-amber-400">${Math.round(chances.partialAcceptChance * 100)}%</span>
          </div>
          <div class="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span class="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">Negado</span>
            <span class="text-sm font-extrabold text-rose-600 dark:text-rose-400">${Math.round(chances.deniedChance * 100)}%</span>
          </div>
        </div>

        ${feedback ? `
          <div class="p-3 rounded-xl ${feedback.success ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'} text-xs font-semibold animate-in fade-in">
            ${feedback.message}
          </div>
        ` : ''}

        <div class="pt-1">
          ${isCoolingDown ? `
            <button disabled class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-xs cursor-not-allowed">
              ⏳ Aguarde ${cooldown} dias de jogo para a próxima renegociação
            </button>
          ` : `
            <button id="btn-negotiate-grant" class="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all">
              🏛️ Negociar Aumento de Repasse PAB/MAC
            </button>
          `}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const close = () => {
      this.lastNegotiationFeedback = null;
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    };

    document.getElementById('btn-close-finances')?.addEventListener('click', close);
    document.getElementById('btn-done-finances')?.addEventListener('click', close);

    document.getElementById('btn-finance-expand')?.addEventListener('click', () => {
      const expanded = expandMap(this.simulation.state);
      if (expanded) this.open();
    });

    document.getElementById('btn-modal-grant')?.addEventListener('click', () => {
      requestEmergencyGrant(this.simulation.state);
      this.open();
    });

    document.getElementById('btn-negotiate-grant')?.addEventListener('click', () => {
      const result = executeGovernmentNegotiation(this.simulation.state);
      this.lastNegotiationFeedback = result;
      this.open();
    });

    const fee = this.simulation.state.privateConsultationFee ?? BALANCE.mixedEconomy.defaultConsultationFee;
    document.getElementById('btn-fee-minus')?.addEventListener('click', () => {
      setPrivateConsultationFee(this.simulation.state, fee - 200);
      this.open();
    });

    document.getElementById('btn-fee-plus')?.addEventListener('click', () => {
      setPrivateConsultationFee(this.simulation.state, fee + 200);
      this.open();
    });

    const slider = document.getElementById('slider-fee') as HTMLInputElement | null;
    slider?.addEventListener('change', () => {
      setPrivateConsultationFee(this.simulation.state, Number(slider.value));
      this.open();
    });

    const contractBtns = this.container.querySelectorAll('.btn-toggle-contract');
    contractBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const planId = (btn as HTMLElement).dataset.planId;
        if (planId) {
          toggleContract(this.simulation.state, planId);
          this.open();
        }
      });
    });
  }
}

