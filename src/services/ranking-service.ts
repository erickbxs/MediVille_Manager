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
 * Hoje não existe servidor de ranking publicado: as pontuações ficam apenas no aparelho (localStorage).
 * Para um ranking online, crie uma Cloudflare Pages Function em /api/leaderboard e volte a chamar sendToRemoteLeaderboard.
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


function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalEntry(entry: LeaderboardEntry): void {
  const current = getLocalLeaderboard();
  current.push(entry);
  current.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current.slice(0, 50)));
}

export const RankingService = {
  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    return getLocalLeaderboard();
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

    return { success: true, localOnly: true, message: 'Pontuação salva neste aparelho.' };
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
