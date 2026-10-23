/**
 * Arquivo: src/systems/satisfaction-system.ts
 * O que faz: Calcula a satisfação individual do paciente com base na fórmula exata do GDD: S = 100 - 20 * (T_espera / T_paciencia) - 15 * N_erros.
 * Para que foi criado: Refletir o impacto da demora e dos erros de conduta médica na experiência do paciente.
 * Como modificar/debugar: Os multiplicadores de penalidade são lidos de src/data/balance.json.
 * Importa: src/core/config.ts, src/entities/patient.ts
 * Conecta-se com: src/systems/consultation-system.ts, tests/formulas.test.ts
 */

import { BALANCE } from '../core/config';
import type { PatientInstance } from '../entities/patient';

export function calculatePatientSatisfaction(
  patient: PatientInstance,
  hasPharmacyAvailable = true,
  hasMedicationInStock = true
): number {
  const { min, max, waitPenalty, errorPenalty, missingPharmacyPenalty, missingMedicationPenalty } = BALANCE.satisfaction;

  const waitRatio = patient.patienceSec > 0
    ? Math.min(1, patient.waitTimeSec / patient.patienceSec)
    : 0;

  let score = max - (waitPenalty * waitRatio) - (errorPenalty * patient.errorsCount);

  if (patient.clinicalCase.definition.requiresPharmacy) {
    if (!hasPharmacyAvailable) {
      score -= missingPharmacyPenalty;
    } else if (!hasMedicationInStock) {
      score -= missingMedicationPenalty;
    }
  }

  return Math.max(min, Math.min(max, Math.round(score)));
}
