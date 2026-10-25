/**
 * Arquivo: src/services/ranking-service.ts
 *
 * 1. O que este arquivo faz?
 * Gerencia a comunicação com o serviço de Ranking Global (Cloudflare Workers/D1), submissão de pontuações,
 * suporte ao Modo Convidado local (< 13 anos), fallback offline gracioso e ações de privacidade LGPD/GDPR.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 3 do Prompt 14, viabilizando o Leaderboard competitivo com proteção estrita de privacidade.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O endpoint padrão é '/api/leaderboard'. Em ambiente de desenvolvimento ou offline, o fallback local é acionado.
 *
 * Importa: src/utils/nickname-filter.ts, src/systems/player-profile.ts
 * Conecta-se com: src/ui/ranking-modal.ts, src/ui/game-over-modal.ts, src/ui/settings-modal.ts
 */

import { validateNickname, canSubmitToGlobalRanking } from '../utils/nickname-filter';

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  days: number;
  patientsTreated: number;
  unitType: string;
  createdAt: string;
}

export interface LeaderboardSubmission {
  nickname: string;
  score: number;
  days: number;
  patientsTreated: number;
  unitType: string;
}

export interface SubmissionResponse {
  success: boolean;
  message?: string;
  localOnly?: boolean;
  offline?: boolean;
}

const LOCAL_STORAGE_KEY = 'mediville_local_leaderboard';
const API_URL = '/api/leaderboard';

const DEFAULT_MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb_1', nickname: 'Dra_Clara_SUS', score: 28500, days: 62, patientsTreated: 420, unitType: 'hospital', createdAt: '2026-10-24' },
  { id: 'lb_2', nickname: 'Dr_Eduardo_UPA', score: 21400, days: 48, patientsTreated: 310, unitType: 'upa', createdAt: '2026-10-23' },
  { id: 'lb_3', nickname: 'Enf_Beatriz_APS', score: 18200, days: 39, patientsTreated: 260, unitType: 'ubs', createdAt: '2026-10-22' },
  { id: 'lb_4', nickname: 'Gestor_Marcelo', score: 15300, days: 31, patientsTreated: 195, unitType: 'hospital', createdAt: '2026-10-21' },
  { id: 'lb_5', nickname: 'Dra_Juliana_Clin', score: 12800, days: 25, patientsTreated: 140, unitType: 'private_clinic', createdAt: '2026-10-20' },
];

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_MOCK_LEADERBOARD;
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return parsed.length > 0 ? parsed : DEFAULT_MOCK_LEADERBOARD;
  } catch {
    return DEFAULT_MOCK_LEADERBOARD;
  }
}

function saveLocalEntry(entry: LeaderboardEntry): void {
  const current = getLocalLeaderboard();
  current.push(entry);
  current.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current.slice(0, 50)));
}

async function sendToRemoteLeaderboard(submission: LeaderboardSubmission): Promise<SubmissionResponse> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: submission.nickname.trim(),
        score: submission.score,
        days: submission.days,
        patients_treated: submission.patientsTreated,
        unit_type: submission.unitType,
      }),
    });

    if (!response.ok) {
      return { success: true, offline: true, message: 'Salvo localmente (servidor indisponível).' };
    }

    return { success: true, message: 'Pontuação enviada ao Ranking Global com sucesso!' };
  } catch {
    return { success: true, offline: true, message: 'Salvo localmente (modo offline).' };
  }
}

export const RankingService = {
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      if (!response.ok) return getLocalLeaderboard();
      const data = (await response.json()) as { leaderboard?: Array<Record<string, unknown>> };
      if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
        return getLocalLeaderboard();
      }
      return data.leaderboard.map((item) => ({
        id: String(item.id ?? `lb_${Math.random()}`),
        nickname: String(item.nickname ?? 'Jogador'),
        score: Number(item.score ?? 0),
        days: Number(item.days ?? 1),
        patientsTreated: Number(item.patients_treated ?? 0),
        unitType: String(item.unit_type ?? 'ubs'),
        createdAt: String(item.created_at ?? new Date().toISOString().split('T')[0]),
      }));
    } catch {
      return getLocalLeaderboard();
    }
  },

  async submitScore(submission: LeaderboardSubmission): Promise<SubmissionResponse> {
    const validation = validateNickname(submission.nickname);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    const localEntry: LeaderboardEntry = {
      id: `local_${Date.now()}`,
      nickname: submission.nickname.trim(),
      score: submission.score,
      days: submission.days,
      patientsTreated: submission.patientsTreated,
      unitType: submission.unitType,
      createdAt: new Date().toISOString().split('T')[0]!,
    };

    saveLocalEntry(localEntry);

    if (!canSubmitToGlobalRanking()) {
      return {
        success: true,
        localOnly: true,
        message: 'Modo Convidado (< 13 anos): Sua pontuação foi salva com sucesso no aparelho.',
      };
    }

    return sendToRemoteLeaderboard(submission);
  },

  exportUserDataJson(): string {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mediville_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) ?? 'null');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    return JSON.stringify(data, null, 2);
  },

  deleteUserAccountAndData(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mediville_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    try {
      indexedDB.deleteDatabase('mediville_db');
    } catch {
      // IndexedDB opcional se não suportado
    }
  },
};
