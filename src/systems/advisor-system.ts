/**
 * Arquivo: src/systems/advisor-system.ts
 * O que faz: Analisa o estado do hospital e gera até 3 sugestões contextuais/alertas em ordem de urgência (GDD pág. 4 e 11).
 * Para que foi criado: Orientar o jogador sobre gargalos e expansões necessárias sem sobrecarregar a interface.
 * Como modificar/debugar: Adicione novas condições de verificação em getAdvisorAlerts().
 * Importa: src/core/config.ts, src/state/game-state.ts
 * Conecta-se com: src/ui/advisor-view.ts
 */

import { BALANCE } from '../core/config';
import type { GameState } from '../state/game-state';

export interface AdvisorAlert {
  id: string;
  urgency: 'high' | 'medium' | 'low';
  message: string;
  actionHint: string;
}

export function getAdvisorAlerts(state: GameState): AdvisorAlert[] {
  const alerts: AdvisorAlert[] = [];
  const max = BALANCE.advisor.maxSuggestions;

  if (state.cash < BALANCE.advisor.cashWarningThreshold) {
    alerts.push({
      id: 'cash_low',
      urgency: 'high',
      message: 'Caixa baixo! Evite construir novas salas até estabilizar.',
      actionHint: 'Aguarde novos repasses.',
    });
  }

  if (state.queueIds.length >= BALANCE.advisor.queueWarningThreshold) {
    alerts.push({
      id: 'queue_bottleneck',
      urgency: 'high',
      message: 'Fila de espera longa. Pacientes podem desistir.',
      actionHint: 'Construa outro consultório.',
    });
  }

  const hasPharm = Array.from(state.rooms.values()).some((r) => r.definition.role === 'dispense');
  if (!hasPharm && state.stats.treatedCount >= BALANCE.advisor.treatedPatientsPharmacyWarning) {
    alerts.push({
      id: 'pharmacy_missing',
      urgency: 'medium',
      message: 'Pacientes saindo sem farmácia para retirar medicamentos.',
      actionHint: 'Construa uma farmácia.',
    });
  }

  return alerts.slice(0, max);
}
