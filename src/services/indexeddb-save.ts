/**
 * Arquivo: src/services/indexeddb-save.ts
 *
 * 1. O que este arquivo faz?
 * Implementa a camada assíncrona de persistência de dados em IndexedDB com suporte a salvamento duplo rotativo
 * (slot_current e slot_backup), verificação de integridade via checksum FNV-1a, controle de schemaVersion
 * e fallback automático para LocalStorage em ambientes restritos ou de teste.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir alta resiliência do progresso do jogador (Prompt 13), evitando perda de saves em caso de falhas
 * inesperadas de energia ou fechamento de aba, com restauração automática do backup caso o slot principal corrompa.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Inspecione a aba Application > IndexedDB no Chrome/Edge DevTools (banco "MediVilleDB", store "game_saves").
 * Os métodos loadGameDualSlots e saveGameDualSlots retornam promessas e emitem eventos no EventBus.
 *
 * Importa: src/core/event-bus.ts, src/systems/save-system.ts (tipos)
 * Conecta-se com: src/systems/save-system.ts, src/core/simulation.ts, src/core/error-boundary.ts
 */

import { globalBus } from '../core/event-bus';
import type { SerializedGameState } from '../systems/save-system';

export const DB_NAME = 'MediVilleDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'game_saves';
export const SCHEMA_VERSION = 120; // 1.2.0

export interface SaveEnvelope {
  slot: 'slot_current' | 'slot_backup';
  schemaVersion: number;
  timestamp: number;
  checksum: string;
  data: SerializedGameState;
}

export function computeChecksum(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function saveToLocalStorageFallback(envelope: SaveEnvelope): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`mediville_${envelope.slot}`, JSON.stringify(envelope));
  } catch (e) {
    console.warn('[IndexedDBSave] Falha no fallback localStorage:', e);
  }
}

function loadFromLocalStorageFallback(slot: 'slot_current' | 'slot_backup'): SaveEnvelope | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`mediville_${slot}`);
    return raw ? (JSON.parse(raw) as SaveEnvelope) : null;
  } catch {
    return null;
  }
}

export async function putSaveEnvelope(envelope: SaveEnvelope): Promise<boolean> {
  const db = await openDatabase();
  if (!db) {
    saveToLocalStorageFallback(envelope);
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(envelope);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        saveToLocalStorageFallback(envelope);
        resolve(false);
      };
    } catch {
      saveToLocalStorageFallback(envelope);
      resolve(false);
    }
  });
}

export async function getSaveEnvelope(slot: 'slot_current' | 'slot_backup'): Promise<SaveEnvelope | null> {
  const db = await openDatabase();
  if (!db) {
    return loadFromLocalStorageFallback(slot);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slot);
      req.onsuccess = () => {
        const result = req.result as SaveEnvelope | undefined;
        resolve(result ?? loadFromLocalStorageFallback(slot));
      };
      req.onerror = () => resolve(loadFromLocalStorageFallback(slot));
    } catch {
      resolve(loadFromLocalStorageFallback(slot));
    }
  });
}

export function validateSaveEnvelope(envelope: SaveEnvelope | null): boolean {
  if (!envelope || !envelope.data || !envelope.checksum) return false;
  try {
    const serializedString = JSON.stringify(envelope.data);
    const expectedChecksum = computeChecksum(serializedString);
    return expectedChecksum === envelope.checksum;
  } catch {
    return false;
  }
}

export async function saveGameDualSlots(data: SerializedGameState): Promise<boolean> {
  try {
    // 1. Move o atual para backup se o atual existir e for válido
    const current = await getSaveEnvelope('slot_current');
    if (current && validateSaveEnvelope(current)) {
      const backupEnvelope: SaveEnvelope = {
        slot: 'slot_backup',
        schemaVersion: current.schemaVersion,
        timestamp: current.timestamp,
        checksum: current.checksum,
        data: current.data,
      };
      await putSaveEnvelope(backupEnvelope);
    }

    // 2. Grava o novo no slot principal
    const dataString = JSON.stringify(data);
    const checksum = computeChecksum(dataString);
    const newEnvelope: SaveEnvelope = {
      slot: 'slot_current',
      schemaVersion: SCHEMA_VERSION,
      timestamp: Date.now(),
      checksum,
      data,
    };
    return await putSaveEnvelope(newEnvelope);
  } catch (err) {
    console.error('[IndexedDBSave] Erro ao salvar nos slots duplos:', err);
    return false;
  }
}

export async function loadGameDualSlots(): Promise<{ data: SerializedGameState; restoredFromBackup: boolean } | null> {
  try {
    const current = await getSaveEnvelope('slot_current');
    if (current && validateSaveEnvelope(current)) {
      return { data: current.data, restoredFromBackup: false };
    }

    // Se o slot_current corrompeu ou é nulo, tenta recuperar o backup
    console.warn('[IndexedDBSave] slot_current inválido ou corrompido. Tentando restaurar slot_backup...');
    const backup = await getSaveEnvelope('slot_backup');
    if (backup && validateSaveEnvelope(backup)) {
      globalBus.emit('save:restored_from_backup', {
        reason: 'slot_current apresentava falha de checksum ou parsing.',
        timestamp: backup.timestamp,
      });
      return { data: backup.data, restoredFromBackup: true };
    }

    return null;
  } catch (err) {
    console.error('[IndexedDBSave] Falha crítica ao carregar slots duplos:', err);
    return null;
  }
}
