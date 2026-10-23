/**
 * Arquivo: src/entities/clinical-case.ts
 * O que faz: Define a estrutura de um caso clínico associado a um paciente específico durante o atendimento.
 * Para que foi criado: Permitir variações individuais (idade, sexo, comorbidade) a partir dos 50 casos base do SUS do GDD.
 * Como modificar/debugar: Se desejar novos campos de caso (ex: exames laboratoriais complementares), adicione na interface PatientCase.
 * Importa: src/core/config.ts
 * Conecta-se com: src/entities/patient.ts, src/systems/case-system.ts, src/ui/decision-modal.ts
 */

import type { ClinicalCaseDefinition } from '../core/config';

export interface ConductOption {
  id: string;
  text: string;
  isCorrect: boolean;
  whyWrong?: string;
}

export interface PatientCase {
  definition: ClinicalCaseDefinition;
  intensityId: string;
  comorbidity: string | null;
  conductOptions: ConductOption[];
  chosenConductId: string | null;
  decisionMade: boolean;
  isDecisionCorrect: boolean;
  feedbackText: string;
}
