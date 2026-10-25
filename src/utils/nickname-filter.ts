/**
 * Arquivo: src/utils/nickname-filter.ts
 *
 * 1. O que este arquivo faz?
 * Valida apelidos de jogadores para o ranking global garantindo conformidade com a LGPD e termos de uso:
 * checa tamanho (3 a 16 caracteres), formato e bloqueia palavras ofensivas, e-mails, CPFs e telefones.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 3 do Prompt 14, protegendo a privacidade dos usuários e evitando exibição pública de dados sensíveis.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar termos proibidos, insira no conjunto BANNED_WORDS. Teste via vitest.
 *
 * Importa: src/systems/player-profile.ts
 * Conecta-se com: src/services/ranking-service.ts, src/ui/game-over-modal.ts, src/ui/ranking-modal.ts
 */

import { getPlayerProfile } from '../systems/player-profile';

export interface NicknameValidationResult {
  valid: boolean;
  reason?: string;
}

const MIN_NICKNAME_LENGTH = 3;
const MAX_NICKNAME_LENGTH = 16;

const BANNED_WORDS = new Set([
  'admin', 'root', 'moderator', 'mod', 'staff',
  'porra', 'caralho', 'puta', 'merda', 'foda', 'cacete', 'bosta', 'viado', 'cu',
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy',
  'mierda', 'puto', 'cabron', 'chingar', 'pendejo', 'coño', 'maricon',
]);

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const CPF_FORMATTED_REGEX = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
const CONTINUOUS_NUMBERS_REGEX = /\b\d{9,14}\b/;
const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?9?\d{4}[\s-]?\d{4}\b/;
const VALID_CHARS_REGEX = /^[A-Za-z0-9_.-]+$/;

function hasBannedWord(nickname: string): boolean {
  const normalized = nickname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const word of BANNED_WORDS) {
    if (normalized.includes(word)) {
      return true;
    }
  }
  return false;
}

function hasSensitiveData(nickname: string): boolean {
  if (EMAIL_REGEX.test(nickname)) return true;
  if (CPF_FORMATTED_REGEX.test(nickname)) return true;
  if (CONTINUOUS_NUMBERS_REGEX.test(nickname)) return true;
  if (PHONE_REGEX.test(nickname) && /\d{8,}/.test(nickname.replace(/\D/g, ''))) return true;
  return false;
}

export function validateNickname(nickname: string): NicknameValidationResult {
  const trimmed = nickname.trim();

  if (trimmed.length < MIN_NICKNAME_LENGTH || trimmed.length > MAX_NICKNAME_LENGTH) {
    return {
      valid: false,
      reason: `O apelido deve ter entre ${MIN_NICKNAME_LENGTH} e ${MAX_NICKNAME_LENGTH} caracteres.`,
    };
  }

  if (!VALID_CHARS_REGEX.test(trimmed)) {
    return {
      valid: false,
      reason: 'Use apenas letras, números, traço (-) ou sublinhado (_).',
    };
  }

  if (hasSensitiveData(trimmed)) {
    return {
      valid: false,
      reason: 'Por segurança e privacidade (LGPD), não utilize e-mails, telefones ou CPFs como apelido.',
    };
  }

  if (hasBannedWord(trimmed)) {
    return {
      valid: false,
      reason: 'O apelido contém termos impróprios ou reservados.',
    };
  }

  return { valid: true };
}

export function canSubmitToGlobalRanking(): boolean {
  const profile = getPlayerProfile();
  if (!profile) return false;
  return !profile.isUnderAge && !profile.guestMode;
}
