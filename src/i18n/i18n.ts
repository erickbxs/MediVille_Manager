/**
 * Arquivo: src/i18n/i18n.ts
 *
 * 1. O que este arquivo faz?
 * Gerenciador reativo de internacionalização com carregamento dinâmico sob demanda (on-demand code splitting)
 * para Português ('pt'), Espanhol ('es') e Inglês ('en'), com suporte a substituição de parâmetros ({days}).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 4 do Prompt 14, garantindo carregamento inicial leve (< 2 MB) sem carregar todos os idiomas de uma vez.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O idioma ativo é persistido no localStorage sob 'mediville_locale'.
 *
 * Importa: (nenhum)
 * Conecta-se com: src/i18n/pt.json, src/i18n/es.json, src/i18n/en.json, src/ui/*
 */

export type SupportedLocale = 'pt' | 'es' | 'en';

type TranslationDictionary = Record<string, unknown>;

const LOCALE_STORAGE_KEY = 'mediville_locale';
const DEFAULT_LOCALE: SupportedLocale = 'pt';

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
let activeDictionary: TranslationDictionary = {};

async function loadDictionary(locale: SupportedLocale): Promise<TranslationDictionary> {
  switch (locale) {
    case 'es':
      return (await import('./es.json')).default as TranslationDictionary;
    case 'en':
      return (await import('./en.json')).default as TranslationDictionary;
    case 'pt':
    default:
      return (await import('./pt.json')).default as TranslationDictionary;
  }
}

function resolveDotKey(dict: TranslationDictionary, key: string): string | null {
  const parts = key.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
}

export async function setLocale(locale: SupportedLocale): Promise<void> {
  activeDictionary = await loadDictionary(locale);
  currentLocale = locale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Modo local / headless
  }
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const raw = resolveDotKey(activeDictionary, key);
  if (!raw) return key;
  if (!params) return raw;

  let result = raw;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

export async function initI18n(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Modo headless / localStorage indisponível
  }

  const detected: SupportedLocale = (saved === 'pt' || saved === 'es' || saved === 'en')
    ? saved
    : (typeof navigator !== 'undefined' && navigator.language.startsWith('es'))
      ? 'es'
      : (typeof navigator !== 'undefined' && navigator.language.startsWith('en'))
        ? 'en'
        : DEFAULT_LOCALE;

  await setLocale(detected);
}
