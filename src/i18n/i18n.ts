/**
 * Arquivo: src/i18n/i18n.ts
 *
 * 1. O que este arquivo faz?
 * Gerenciador reativo de internacionalização com carregamento sob demanda para 6 idiomas ('pt', 'es', 'en', 'fr', 'de', 'zh'),
 * tradução com parâmetros ({days}), atualização direta de elementos HTML [data-i18n] e emissão de evento 'i18n:changed'.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 2 do Prompt 15, garantindo que a troca de idiomas seja 100% instantânea e reativa na UI e no Canvas
 * sem exigir recarga da página, mantendo compatibilidade com os modos local e mobile.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novos idiomas ou termos, crie/edite os arquivos JSON em src/i18n/ e vincule no loadDictionary.
 *
 * Importa: src/core/event-bus.ts, src/core/config.ts
 * Conecta-se com: src/i18n/*.json, src/ui/*, src/render/room-renderer-3d.ts
 */

import { globalBus } from '../core/event-bus';
import { ROOMS_CATALOG } from '../core/config';

export type SupportedLocale = 'pt' | 'es' | 'en' | 'fr' | 'de' | 'zh';

type TranslationDictionary = Record<string, unknown>;

const STORAGE_LANG_KEY = 'mediville_lang';
const STORAGE_LEGACY_KEY = 'mediville_locale';
const DEFAULT_LOCALE: SupportedLocale = 'pt';

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
let activeDictionary: TranslationDictionary = {};

async function loadDictionary(locale: SupportedLocale): Promise<TranslationDictionary> {
  switch (locale) {
    case 'es':
      return (await import('./es.json')).default as TranslationDictionary;
    case 'en':
      return (await import('./en.json')).default as TranslationDictionary;
    case 'fr':
      return (await import('./fr.json')).default as TranslationDictionary;
    case 'de':
      return (await import('./de.json')).default as TranslationDictionary;
    case 'zh':
      return (await import('./zh.json')).default as TranslationDictionary;
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

export function getRoomShortName(roomId: string): string {
  const translated = t(`room.${roomId}_short`);
  if (translated && translated !== `room.${roomId}_short`) {
    return translated;
  }
  const found = ROOMS_CATALOG.rooms.find((r) => r.id === roomId);
  return found?.shortName ?? roomId;
}

export function applyTranslationsToDom(): void {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;

  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  const placeholders = document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]');
  placeholders.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });

  const titled = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
  titled.forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });
}

export async function setLanguage(lang: SupportedLocale): Promise<void> {
  activeDictionary = await loadDictionary(lang);
  currentLocale = lang;

  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    localStorage.setItem(STORAGE_LEGACY_KEY, lang);
  } catch {
    // Modo headless / localStorage indisponível
  }

  applyTranslationsToDom();
  globalBus.emit('i18n:changed', { lang });
}

export const setLocale = setLanguage;

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export async function initI18n(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_LANG_KEY) || localStorage.getItem(STORAGE_LEGACY_KEY);
  } catch {
    // Modo headless
  }

  const validLocales: SupportedLocale[] = ['pt', 'es', 'en', 'fr', 'de', 'zh'];
  let detected: SupportedLocale = DEFAULT_LOCALE;

  if (saved && validLocales.includes(saved as SupportedLocale)) {
    detected = saved as SupportedLocale;
  } else if (typeof navigator !== 'undefined') {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('zh')) detected = 'zh';
    else if (nav.startsWith('de')) detected = 'de';
    else if (nav.startsWith('fr')) detected = 'fr';
    else if (nav.startsWith('es')) detected = 'es';
    else if (nav.startsWith('en')) detected = 'en';
  }

  await setLanguage(detected);
}
