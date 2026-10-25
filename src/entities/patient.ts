/**
 * Arquivo: src/entities/patient.ts
 * O que faz: Representa a entidade do paciente no hospital com estado do ciclo de vida, paciência, satisfação e caso clínico associado.
 * Para que foi criado: Controlar o fluxo do paciente (chegada, espera, consulta, tomada de decisão médica e alta).
 * Como modificar/debugar: Caso precise de novos estados no ciclo de vida, atualize PatientState e os sistemas correspondentes.
 * Importa: src/entities/clinical-case.ts
 * Conecta-se com: src/systems/queue-system.ts, src/systems/consultation-system.ts, src/render/patients-view.ts
 */

import type { PatientCase } from './clinical-case';

export type PatientState =
  | 'arrived'
  | 'waiting'
  | 'in_consultation'
  | 'ready_for_treatment'
  | 'needs_decision'
  | 'dispensing'
  | 'treated'
  | 'abandoned';

export interface PatientInstance {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male';
  state: PatientState;
  clinicalCase: PatientCase;
  patienceSec: number;
  waitTimeSec: number;
  consultationTimeSec: number;
  consultationDurationSec: number;
  currentRoomId: string | null;
  satisfaction: number;
  errorsCount: number;
  isHelipadEmergency?: boolean;
}


export function isPatientPatienceCritical(
  patient: PatientInstance,
  alertRatio: number
): boolean {
  if (patient.patienceSec <= 0) return false;
  return patient.waitTimeSec / patient.patienceSec >= alertRatio;
}

export function isPatientPatienceExhausted(patient: PatientInstance): boolean {
  return patient.waitTimeSec >= patient.patienceSec;
}
