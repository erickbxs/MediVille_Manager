/**
 * Arquivo: src/ui/entity-inspector.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o painel de inspeção rápida ao tocar em pacientes ou funcionários no mapa do hospital,
 * exibindo métricas em tempo real (paciência, energia, cargo, salário) e ações contextuais rápidas.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 23, permitindo ao jogador inspecionar a equipe médica e os pacientes
 * diretamente pelo mapa, acionando consultas manuais ("🩺 Atender Agora") e pausas para café ("☕ Enviar para Descanso").
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Utilize inspectPatient(patient, onAction) ou inspectStaff(staff, onAction). O painel é fechado via close().
 *
 * Importa: src/entities/patient.ts, src/entities/staff.ts, src/systems/staff-fatigue-system.ts, src/ui/decision-modal.ts
 * Conecta-se com: src/main.ts, src/ui/decision-modal.ts, tests/traffic-expansion-pinch-and-inspector.test.ts
 */

import { displayCaseName } from './decision-modal';
import type { PatientInstance } from '../entities/patient';
import type { StaffMember } from '../entities/staff';
import { getStaffEnergy } from '../systems/staff-fatigue-system';
import { getManchesterInfo } from '../systems/triage-system';

export type InspectorAction = 'attend_now' | 'send_to_rest' | 'close';

export interface EntityInspectorCallbacks {
  onAttendPatient?: (patientId: string) => void;
  onSendStaffToRest?: (staffId: string) => void;
  onClose?: () => void;
}

const ROLE_LABELS: Record<string, { label: string; icon: string }> = {
  doctor: { label: 'Médico Clínico', icon: '🩺' },
  nurse: { label: 'Enfermeiro Triagista', icon: '💉' },
  pharmacist: { label: 'Farmacêutico RENAME', icon: '💊' },
  receptionist: { label: 'Recepcionista SUS', icon: '📋' },
  cleaning: { label: 'Auxiliar de Limpeza', icon: '🧹' },
  manager: { label: 'Gestor Hospitalar', icon: '📊' },
  security: { label: 'Agente de Portaria', icon: '🛡️' },
};

const STATE_LABELS: Record<string, { label: string; colorClass: string }> = {
  waiting: { label: 'Aguardando na Fila', colorClass: 'text-amber-600 dark:text-amber-400' },
  in_consultation: { label: 'Em Consulta Médica', colorClass: 'text-blue-600 dark:text-blue-400' },
  ready_for_treatment: { label: 'Pronto para Atendimento', colorClass: 'text-emerald-600 dark:text-emerald-400' },
  needs_decision: { label: 'Decisão Clínica Pendente', colorClass: 'text-rose-600 dark:text-rose-400' },
  treated: { label: 'Atendido e Recuperado', colorClass: 'text-emerald-500' },
  abandoned: { label: 'Desistiu do Atendimento', colorClass: 'text-slate-400' },
};

export class EntityInspector {
  private container: HTMLElement;
  private callbacks: EntityInspectorCallbacks;
  private activePatient: PatientInstance | null = null;
  private activeStaff: StaffMember | null = null;

  constructor(container: HTMLElement, callbacks: EntityInspectorCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public getActivePatient(): PatientInstance | null {
    return this.activePatient;
  }

  public getActiveStaff(): StaffMember | null {
    return this.activeStaff;
  }

  public isOpen(): boolean {
    return this.activePatient !== null || this.activeStaff !== null;
  }

  public inspectPatient(patient: PatientInstance): void {
    this.activeStaff = null;
    this.activePatient = patient;
    this.renderPatient(patient);
  }

  public inspectStaff(member: StaffMember): void {
    this.activePatient = null;
    this.activeStaff = member;
    this.renderStaff(member);
  }

  public close(): void {
    this.activePatient = null;
    this.activeStaff = null;
    this.container.innerHTML = '';
    this.callbacks.onClose?.();
  }

  private renderPatient(patient: PatientInstance): void {
    const patiencePct = Math.max(0, Math.min(100, Math.round((1 - patient.waitTimeSec / Math.max(1, patient.patienceSec)) * 100)));
    const stateInfo = STATE_LABELS[patient.state] ?? { label: patient.state, colorClass: 'text-slate-500' };
    const canAttend = patient.state === 'ready_for_treatment' || patient.state === 'needs_decision' || patient.state === 'in_consultation';
    const manchester = getManchesterInfo(patient.manchesterPriority);

    this.container.innerHTML = `
      <aside id="entity-inspector-panel" class="fixed bottom-24 left-4 right-20 sm:left-auto sm:right-24 sm:w-80 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" aria-label="Painel de Inspeção">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-2xl shrink-0">
              ${patient.gender === 'female' ? '👩' : '👨'}
            </div>
            <div>
              <h3 class="font-extrabold text-sm text-slate-900 dark:text-slate-100">${patient.name}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${patient.age} anos • Cartão SUS</p>
            </div>
          </div>
          <button id="btn-inspector-close" class="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm transition-colors" aria-label="Fechar">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span class="text-slate-500 dark:text-slate-400">Classificação de Risco:</span>
            <span class="font-bold ${manchester.textColorClass}">${manchester.badge}</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span class="text-slate-500 dark:text-slate-400">Status no SUS:</span>
            <span class="font-bold ${stateInfo.colorClass}">${stateInfo.label}</span>
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1 font-medium">
              <span class="text-slate-500">Paciência na Unidade</span>
              <span class="font-bold text-slate-700 dark:text-slate-300 tabular-nums">${patiencePct}%</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full ${patiencePct < 30 ? 'bg-rose-500' : patiencePct < 60 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-300" style="width: ${patiencePct}%"></div>
            </div>
          </div>

          <div class="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/40">
            <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Hipótese Diagnóstica</span>
            <p class="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">${displayCaseName(patient.clinicalCase.definition.name, patient.clinicalCase.definition.suggestedConduct.text)}</p>
          </div>

          ${patient.examCompleted ? `
            <div class="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/40 flex items-center justify-between">
              <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">🔬 Exame Diagnóstico Concluído</span>
              <span class="font-bold text-xs text-emerald-600">+R$ 1.200</span>
            </div>
          ` : ''}

          ${canAttend ? `
            <button id="btn-inspector-attend" class="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform">
              🩺 Atender Agora
            </button>
          ` : ''}
        </div>
      </aside>
    `;


    this.bindPatientEvents(patient.id);
  }

  private renderStaff(member: StaffMember): void {
    const role = ROLE_LABELS[member.roleId] ?? { label: member.roleId, icon: '👤' };
    const energy = Math.round(getStaffEnergy(member));
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, member.skill)));

    this.container.innerHTML = `
      <aside id="entity-inspector-panel" class="fixed bottom-24 left-4 right-20 sm:left-auto sm:right-24 sm:w-80 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" aria-label="Painel de Inspeção">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
              ${role.icon}
            </div>
            <div>
              <h3 class="font-extrabold text-sm text-slate-900 dark:text-slate-100">${member.name}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${role.label}</p>
            </div>
          </div>
          <button id="btn-inspector-close" class="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm transition-colors" aria-label="Fechar">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span class="text-slate-500 dark:text-slate-400">Qualificação Profissional:</span>
            <span class="font-bold text-amber-500">${stars} (${member.skill}/5)</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span class="text-slate-500 dark:text-slate-400">Salário / Turno:</span>
            <span class="font-bold text-slate-700 dark:text-slate-200 tabular-nums">R$ ${member.dailySalary}</span>
          </div>

          <div>
            <div class="flex justify-between text-[11px] mb-1 font-medium">
              <span class="text-slate-500">Nível de Energia / Disposição</span>
              <span class="font-bold ${energy < 40 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'} tabular-nums">${energy}%</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full ${energy < 40 ? 'bg-rose-500' : energy < 70 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-300" style="width: ${energy}%"></div>
            </div>
          </div>

          <button id="btn-inspector-rest" class="w-full min-h-[44px] py-2.5 px-4 rounded-2xl ${member.isResting ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-lg shadow-amber-500/25'} font-extrabold text-xs flex items-center justify-center gap-2 transition-transform">
            ${member.isResting ? '☕ Em Pausa para Descanso' : '☕ Enviar para Descanso'}
          </button>
        </div>
      </aside>
    `;

    this.bindStaffEvents(member.id);
  }

  private bindPatientEvents(patientId: string): void {
    this.container.querySelector('#btn-inspector-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.container.querySelector('#btn-inspector-attend')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onAttendPatient?.(patientId);
      this.close();
    });
  }

  private bindStaffEvents(staffId: string): void {
    this.container.querySelector('#btn-inspector-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    this.container.querySelector('#btn-inspector-rest')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onSendStaffToRest?.(staffId);
      if (this.activeStaff) {
        this.activeStaff.isResting = true;
        this.renderStaff(this.activeStaff);
      }
    });
  }
}
