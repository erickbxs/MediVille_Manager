/**
 * Arquivo: src/systems/player-profile.ts
 * O que faz: Gerencia a verificação neutra de idade e o perfil de privacidade do jogador (Modo Convidado vs Modo Padrão).
 * Para que foi criado: Cumprir os requisitos de conformidade com LGPD/ECA Digital (Prompt 13 do GDD), garantindo que menores de 13 anos joguem em modo restrito estritamente local.
 * Como modificar/debugar: Ajuste a idade mínima em MIN_ACCOUNT_AGE ou inspecione a chave 'mediville_profile' no localStorage.
 * Importa: (nenhum)
 * Conecta-se com: src/ui/age-gate-modal.ts, src/ui/hud.ts, src/main.ts
 */

const PROFILE_KEY = 'mediville_profile';
const MIN_ACCOUNT_AGE = 13;

export interface PlayerProfile {
  birthYear: number;
  isUnderAge: boolean;
  guestMode: boolean;
  verifiedAt: number;
}

function getStorage(): Storage | null {
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

export function getPlayerProfile(): PlayerProfile | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const raw = storage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function savePlayerAgeVerification(birthYear: number): PlayerProfile {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const isUnderAge = age < MIN_ACCOUNT_AGE;

  const profile: PlayerProfile = {
    birthYear,
    isUnderAge,
    guestMode: isUnderAge,
    verifiedAt: Date.now(),
  };

  getStorage()?.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function isAgeVerificationRequired(): boolean {
  return getPlayerProfile() === null;
}
