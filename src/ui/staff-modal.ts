/**
 * Arquivo: src/ui/staff-modal.ts
 *
 * 1. O que este arquivo faz?
 * Exibe o modal de gestão de equipe hospitalar: contratação, habilidades (1 a 5 estrelas),
 * monitoramento de energia/fadiga por profissional e botão de recarga emergencial via café ("Dar Pausa").
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a gestão de equipe, alocação de pessoal e bem-estar dos profissionais de saúde da versão 1.8.0.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Cargos e salários vêm de staff.json. Parâmetros de energia e custos são controlados por staff-fatigue-system.ts.
 *
 * Importa: src/core/config.ts, src/core/simulation.ts, src/entities/staff.ts, src/systems/staff-fatigue-system.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts, tests/fatigue-weather-balance-and-6langs.test.ts
 */

import { STAFF_CATALOG, type StaffRoleDefinition } from '../core/config';
import type { HospitalSimulation } from '../core/simulation';
import type { StaffMember } from '../entities/staff';
import { getStaffEnergy, isStaffTired, energizeAllStaffWithCoffee } from '../systems/staff-fatigue-system';

export class StaffModal {
  private container: HTMLElement;
  private simulation: HospitalSimulation;

  constructor(container: HTMLElement, simulation: HospitalSimulation) {
    this.container = container;
    this.simulation = simulation;
  }

  public open(): void {
    this.simulation.pauseForModal();
    const staffList = Array.from(this.simulation.state.staff.values());
    const rolesList = STAFF_CATALOG.roles;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[82dvh]">
          
          <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl">👥</div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-slate-50">Equipe de Saúde</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Gerencie médicos, enfermeiros, salários e níveis de energia</p>
              </div>
            </div>
            <button id="btn-close-staff" class="min-w-[44px] min-h-[44px] px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold">✕</button>
          </div>

          <div class="p-5 overflow-y-auto space-y-6 text-sm flex-1">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Profissionais Contratados (${staffList.length})</h4>
                <button id="btn-energize-staff" class="btn-interactive min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <span>☕ Dar Pausa / Energizar Equipe</span>
                  <span class="text-[10px] opacity-75">(R$ 500)</span>
                </button>
              </div>
              <div class="space-y-2.5">
                ${staffList.map((m) => this.renderStaffItem(m)).join('')}
              </div>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contratar Novos Profissionais</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${rolesList.map((r) => this.renderHireCard(r)).join('')}
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
    this.bindEvents();
  }

  private renderStaffItem(member: StaffMember): string {
    const stars = '⭐'.repeat(member.skill);
    const energy = getStaffEnergy(member);
    const tired = isStaffTired(member);
    const isResting = member.isResting;
    const barColor = energy >= 50 ? 'bg-emerald-500' : energy >= 35 ? 'bg-amber-500' : 'bg-rose-500';
    const statusBadge = isResting
      ? '<span class="text-[10px] font-bold text-amber-600 dark:text-amber-400">☕ Recuperando energia...</span>'
      : tired
        ? '<span class="text-[10px] font-bold text-rose-600 dark:text-rose-400">💤 Cansado (-25% vel.)</span>'
        : '';

    return `
      <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3 min-w-[200px] flex-1">
          <span class="text-2xl shrink-0">${member.role.icon}</span>
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-800 dark:text-slate-100 truncate">${member.name}</span>
              ${statusBadge}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
              <span>${member.role.name} • ${stars}</span>
              <div class="flex items-center gap-1">
                <span class="text-[10px]">⚡ ${energy}%</span>
                <div class="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300 ${barColor}" style="width: ${energy}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ ${member.dailySalary}/dia</span>
          <button data-fire-id="${member.id}" class="fire-btn btn-interactive min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all">Demitir</button>
        </div>
      </div>
    `;
  }

  private renderHireCard(role: StaffRoleDefinition): string {
    return `
      <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <span class="text-2xl">${role.icon}</span>
          <div>
            <div class="font-bold text-xs text-slate-800 dark:text-slate-100">${role.name}</div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">${role.description}</p>
          </div>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-600 dark:text-slate-300">A partir de R$ ${role.baseSalaryDaily}/dia</span>
          <button data-hire-role="${role.id}" class="hire-btn btn-interactive min-w-[44px] min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 active:scale-95 transition-all">Contratar</button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    document.getElementById('btn-close-staff')?.addEventListener('click', () => {
      this.container.innerHTML = '';
      this.simulation.resumeFromModal();
    });

    document.getElementById('btn-energize-staff')?.addEventListener('click', () => {
      const res = energizeAllStaffWithCoffee(this.simulation.state);
      if (res.success) {
        this.open();
      } else {
        alert(res.error ?? 'Saldo insuficiente para a rodada de café.');
      }
    });

    this.container.querySelectorAll('.fire-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.fireId;
        if (id) {
          this.simulation.fireStaff(id);
          this.open();
        }
      });
    });

    this.container.querySelectorAll('.hire-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const roleId = (btn as HTMLElement).dataset.hireRole;
        if (roleId) {
          this.simulation.hireStaff(roleId);
          this.open();
        }
      });
    });
  }
}
