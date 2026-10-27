/**
 * Arquivo: src/systems/triage-system.ts
 *
 * 1. O que este arquivo faz?
 * Implementa o Protocolo de Triagem de Manchester por Cores de Risco (Vermelho, Laranja, Amarelo,
 * Verde e Azul), faturamento do procedimento SIGTAP 02.14.01.001-5 e reordenação prioritária da fila SUS.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 24, garantindo que casos graves passem na frente na fila de consultórios
 * e emergência, reduzindo abandono e óbitos, além de remunerar a unidade pelo acolhimento de triagem.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para calibrar critérios de gravidade, edite classifyManchester. A tabela de prioridades está em MANCHESTER_CONFIG.
 *
 * Importa: src/entities/patient.ts, src/state/game-state.ts, src/core/event-bus.ts
 * Conecta-se com: src/systems/consultation-system.ts, src/ui/entity-inspector.ts, src/render/patients-view.ts
 */

import type { PatientInstance, ManchesterPriority } from '../entities/patient';
import type { GameState } from '../state/game-state';
import { globalBus } from '../core/event-bus';

export interface ManchesterInfo {
  priority: ManchesterPriority;
  name: string;
  label: string;
  badge: string;
  colorHex: number;
  textColorClass: string;
  order: number;
  maxWaitSec: number;
}

export const SIGTAP_TRIAGE_CODE = '02.14.01.001-5';
export const SIGTAP_TRIAGE_VALUE = 400;
const PEDIATRIC_THRESHOLD_AGE = 2;
const GERIATRIC_THRESHOLD_AGE = 75;
const LOW_SEVERITY_WEIGHT_THRESHOLD = 2;
const DEFAULT_MANCHESTER_QUEUE_ORDER = 4;

export const MANCHESTER_CONFIG: Record<ManchesterPriority, ManchesterInfo> = {
  red: {
    priority: 'red',
    name: 'Vermelho',
    label: 'Emergência (Imediato)',
    badge: '🔴 Emergência',
    colorHex: 0xef4444,
    textColorClass: 'text-rose-600 dark:text-rose-400',
    order: 1,
    maxWaitSec: 0,
  },
  orange: {
    priority: 'orange',
    name: 'Laranja',
    label: 'Muito Urgente (10 min)',
    badge: '🟠 Muito Urgente',
    colorHex: 0xf97316,
    textColorClass: 'text-orange-500 dark:text-orange-400',
    order: 2,
    maxWaitSec: 600,
  },
  yellow: {
    priority: 'yellow',
    name: 'Amarelo',
    label: 'Urgente (60 min)',
    badge: '🟡 Urgente',
    colorHex: 0xeab308,
    textColorClass: 'text-amber-500 dark:text-amber-400',
    order: 3,
    maxWaitSec: 3600,
  },
  green: {
    priority: 'green',
    name: 'Verde',
    label: 'Pouco Urgente (120 min)',
    badge: '🟢 Pouco Urgente',
    colorHex: 0x22c55e,
    textColorClass: 'text-emerald-600 dark:text-emerald-400',
    order: 4,
    maxWaitSec: 7200,
  },
  blue: {
    priority: 'blue',
    name: 'Azul',
    label: 'Não Urgente (240 min)',
    badge: '🔵 Não Urgente',
    colorHex: 0x3b82f6,
    textColorClass: 'text-blue-500 dark:text-blue-400',
    order: 5,
    maxWaitSec: 14400,
  },
};

const SEVERE_KEYWORDS = ['choque', 'parada', 'iam', 'avc', 'inconsciente', 'hemorragia', 'politrauma', 'coma'];

function isImminentEmergency(patient: PatientInstance): boolean {
  if (patient.isHelipadEmergency) return true;
  const def = patient.clinicalCase.definition;
  const text = `${def.name} ${def.symptoms?.join(' ') ?? ''}`.toLowerCase();
  return SEVERE_KEYWORDS.some((kw) => text.includes(kw));
}

export function classifyManchester(patient: PatientInstance): ManchesterPriority {
  if (isImminentEmergency(patient)) {
    return 'red';
  }

  const def = patient.clinicalCase.definition;
  const severity = def.severity || 'Leve';

  if (severity === 'Grave') {
    return 'orange';
  }
  if (severity === 'Moderada') {
    return 'yellow';
  }
  if (patient.age < PEDIATRIC_THRESHOLD_AGE || patient.age >= GERIATRIC_THRESHOLD_AGE) {
    return 'yellow'; // Idosos e lactentes recebem prioridade mínima amarela no SUS
  }
  if (def.weight && def.weight <= LOW_SEVERITY_WEIGHT_THRESHOLD) {
    return 'blue';
  }
  return 'green';
}

export function getManchesterInfo(priority?: ManchesterPriority): ManchesterInfo {
  return MANCHESTER_CONFIG[priority ?? 'green'];
}

export function orderQueueByManchester(state: GameState): void {
  state.queueIds.sort((idA, idB) => {
    const patA = state.patients.get(idA);
    const patB = state.patients.get(idB);
    if (!patA || !patB) return 0;

    const prioA = patA.manchesterPriority ? MANCHESTER_CONFIG[patA.manchesterPriority].order : DEFAULT_MANCHESTER_QUEUE_ORDER;
    const prioB = patB.manchesterPriority ? MANCHESTER_CONFIG[patB.manchesterPriority].order : DEFAULT_MANCHESTER_QUEUE_ORDER;

    if (prioA !== prioB) {
      return prioA - prioB; // Menor order (1) vem na frente
    }
    return patB.waitTimeSec - patA.waitTimeSec; // Maior tempo de espera tem preferência
  });
}

export function applyTriageProcedure(state: GameState, patient: PatientInstance): boolean {
  patient.manchesterPriority = classifyManchester(patient);
  patient.triaged = true;

  // Credita procedimento SIGTAP Acolhimento com Classificação de Risco
  state.cash += SIGTAP_TRIAGE_VALUE;
  state.finances.bpaRevenue += SIGTAP_TRIAGE_VALUE;

  orderQueueByManchester(state);

  const info = getManchesterInfo(patient.manchesterPriority);
  globalBus.emit('triage:classified', {
    patientId: patient.id,
    priority: patient.manchesterPriority,
    colorHex: info.colorHex,
  });

  return true;
}

export const classifyPatientTriage = applyTriageProcedure;
