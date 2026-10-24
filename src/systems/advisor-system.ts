/**
 * Arquivo: src/systems/advisor-system.ts
 *
 * 1. O que este arquivo faz?
 * Analisa os gargalos hospitalares em tempo real e gera no máximo 3 sugestões simultâneas ordenadas estritamente por urgência (Crítica > Urgente > Oportunidade) com ações diretas (Resolver, Adiar, Ignorar).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Implementar a inteligência do Conselheiro Hospitalar prevista no GDD (pág. 4 e 11) e no Prompt 12, orientando o gestor com ações práticas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Adicione ou ajuste heurísticas de detecção de gargalos nas funções auxiliares check*.
 *
 * Importa: src/core/config.ts, src/state/game-state.ts
 * Conecta-se com: src/ui/advisor-view.ts, tests/sectors-and-negotiation.test.ts
 */

import { BALANCE } from '../core/config';
import type { GameState } from '../state/game-state';

export type AlertUrgency = 'high' | 'medium' | 'low';
export type AlertActionType = 'build_room' | 'open_pharmacy' | 'open_finances' | 'open_staff' | 'dismiss';

export interface AdvisorAlert {
  id: string;
  urgency: AlertUrgency;
  title: string;
  message: string;
  actionHint: string;
  actionType: AlertActionType;
  targetRoomType?: string;
}

const URGENCY_RANK: Record<AlertUrgency, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const MIN_STAFF_FOR_REST = 3;
const MIN_REP_FOR_NEGOTIATION = 60;

function checkBasicBottlenecks(state: GameState, alerts: AdvisorAlert[]): void {
  if (state.cash < BALANCE.advisor.cashWarningThreshold) {
    alerts.push({
      id: 'cash_low',
      urgency: 'high',
      title: 'Caixa Baixo',
      message: 'Saldo crítico! Evite construções e negocie repasses governamentais.',
      actionHint: 'Finanças SUS',
      actionType: 'open_finances',
    });
  }

  if (state.queueIds.length >= BALANCE.advisor.queueWarningThreshold) {
    alerts.push({
      id: 'queue_bottleneck',
      urgency: 'high',
      title: 'Fila Congestionada',
      message: 'Fila longa na recepção. Risco de desistência de pacientes.',
      actionHint: 'Novo Consultório',
      actionType: 'build_room',
      targetRoomType: 'consultation',
    });
  }
}

function checkPharmacyBottlenecks(state: GameState, alerts: AdvisorAlert[]): void {
  const hasPharm = Array.from(state.rooms.values()).some((r) => r.definition.role === 'dispense');
  if (!hasPharm && state.stats.treatedCount >= BALANCE.advisor.treatedPatientsPharmacyWarning) {
    alerts.push({
      id: 'pharmacy_missing',
      urgency: 'high',
      title: 'Sem Farmácia',
      message: 'Pacientes saindo sem remédios. Reduz faturamento e satisfação.',
      actionHint: 'Construir Farmácia',
      actionType: 'build_room',
      targetRoomType: 'pharmacy',
    });
    return;
  }

  const stockOut = Object.values(state.pharmacyStock ?? {}).some((qty) => qty <= 0);
  if (hasPharm && stockOut) {
    alerts.push({
      id: 'medication_stockout',
      urgency: 'high',
      title: 'Estoque RENAME Zerado',
      message: 'Medicamentos essenciais esgotados. Pacientes insatisfeitos.',
      actionHint: 'Comprar Lote',
      actionType: 'open_pharmacy',
    });
  }
}

function checkSevereCases(state: GameState, alerts: AdvisorAlert[]): void {
  const rooms = Array.from(state.rooms.values());
  const patients = Array.from(state.patients.values());

  const hasSurgeryOrIcu = rooms.some((r) => r.typeId === 'surgery' || r.typeId === 'icu');
  const hasSeverePatient = patients.some(
    (p) => p.clinicalCase.definition.severity === 'Grave' || p.clinicalCase.definition.severity === 'Crítica'
  );
  if (!hasSurgeryOrIcu && hasSeverePatient) {
    alerts.push({
      id: 'missing_icu_surgery',
      urgency: 'high',
      title: 'Casos Graves Sem UTI/Cirurgia',
      message: 'Chegada de casos graves sem UTI ou Centro Cirúrgico disponível.',
      actionHint: 'Construir UTI',
      actionType: 'build_room',
      targetRoomType: 'icu',
    });
  }
}

function checkDiagnosticCases(state: GameState, alerts: AdvisorAlert[]): void {
  const rooms = Array.from(state.rooms.values());
  const patients = Array.from(state.patients.values());

  const hasLab = rooms.some((r) => r.typeId === 'laboratory');
  const hasInfectious = patients.some(
    (p) => p.clinicalCase.definition.area === 'Infectologia' || p.clinicalCase.definition.area === 'Endocrinologia'
  );
  if (!hasLab && hasInfectious) {
    alerts.push({
      id: 'missing_lab',
      urgency: 'medium',
      title: 'Diagnósticos Lentos',
      message: 'Casos infecciosos aguardando exames sem laboratório clínico.',
      actionHint: 'Construir Laboratório',
      actionType: 'build_room',
      targetRoomType: 'laboratory',
    });
  }

  const hasXray = rooms.some((r) => r.typeId === 'xray');
  const hasChest = patients.some(
    (p) => p.clinicalCase.definition.area === 'Pneumologia' || p.clinicalCase.definition.area === 'Ortopedia'
  );
  if (!hasXray && hasChest) {
    alerts.push({
      id: 'missing_xray',
      urgency: 'medium',
      title: 'Faturamento SIGTAP Perdido',
      message: 'Casos de trauma/tórax sem sala de Raio-X perdem repasses adicionais.',
      actionHint: 'Construir Raio-X',
      actionType: 'build_room',
      targetRoomType: 'xray',
    });
  }
}

function checkStaffAndExpansion(state: GameState, alerts: AdvisorAlert[]): void {
  const rooms = Array.from(state.rooms.values());
  const hasStaffRoom = rooms.some((r) => r.typeId === 'staff_room');
  if (!hasStaffRoom && state.staff.size >= MIN_STAFF_FOR_REST) {
    alerts.push({
      id: 'missing_staff_room',
      urgency: 'medium',
      title: 'Cansaço da Equipe',
      message: 'Funcionários trabalhando sem sala de descanso para recuperar energia.',
      actionHint: 'Sala de Descanso',
      actionType: 'build_room',
      targetRoomType: 'staff_room',
    });
  }

  const canNegotiate = state.governmentNegotiationCooldownDays === 0;
  if (canNegotiate && state.reputation >= MIN_REP_FOR_NEGOTIATION) {
    alerts.push({
      id: 'government_negotiation_ready',
      urgency: 'low',
      title: 'Pactuação de Repasse Aberta',
      message: 'Reputação alta permite solicitar aumento de até +40% no repasse SUS.',
      actionHint: 'Negociar Repasse',
      actionType: 'open_finances',
    });
  }
}

export function dismissAdvisorAlert(state: GameState, alertId: string): void {
  if (!state.dismissedAdvisorAlertIds.includes(alertId)) {
    state.dismissedAdvisorAlertIds.push(alertId);
  }
}

export function snoozeAdvisorAlert(state: GameState, alertId: string): void {
  dismissAdvisorAlert(state, alertId);
}

export function getAdvisorAlerts(state: GameState): AdvisorAlert[] {
  const alerts: AdvisorAlert[] = [];
  const max = BALANCE.advisor.maxSuggestions;

  checkBasicBottlenecks(state, alerts);
  checkPharmacyBottlenecks(state, alerts);
  checkSevereCases(state, alerts);
  checkDiagnosticCases(state, alerts);
  checkStaffAndExpansion(state, alerts);

  const dismissed = state.dismissedAdvisorAlertIds ?? [];
  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  activeAlerts.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
  return activeAlerts.slice(0, max);
}

