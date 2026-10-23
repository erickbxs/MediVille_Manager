/**
 * Arquivo: src/core/config.ts
 * O que faz: Exporta constantes tipadas contendo os dados de balanceamento, salas, nomes e casos clínicos carregados dos arquivos JSON.
 * Para que foi criado: Eliminar números mágicos espalhados pelo código e centralizar o acesso aos dados em tempo de compilação.
 * Como modificar/debugar: Modifique diretamente os arquivos em src/data/*. Se um campo faltar, o compilador TypeScript apontará aqui.
 * Importa: src/core/config-types.ts, src/data/balance.json, src/data/rooms.json, src/data/cases.json, src/data/names.json
 * Conecta-se com: src/core/simulation.ts, src/systems/*, src/state/game-state.ts
 */

import type { GameBalanceConfig } from './config-types';
import balanceRaw from '../data/balance.json';
import roomsRaw from '../data/rooms.json';
import casesRaw from '../data/cases.json';
import namesRaw from '../data/names.json';

export const BALANCE: GameBalanceConfig = balanceRaw as unknown as GameBalanceConfig;

export interface RoomDefinition {
  id: string;
  role: 'entry' | 'queue' | 'treatment' | 'dispense';
  nameKey: string;
  icon: string;
  width: number;
  height: number;
  cost: number;
  dailyUpkeep: number;
  capacity: number;
  hasStaff: boolean;
  color: string;
}

export interface RoomsCatalog {
  rooms: RoomDefinition[];
}

export const ROOMS_CATALOG: RoomsCatalog = roomsRaw as unknown as RoomsCatalog;

export interface ClinicalCaseDefinition {
  id: string;
  name: string;
  area: string;
  typicalUnit: string;
  severity: string;
  weight: number;
  ageRange: { min: number; max: number };
  symptoms: string[];
  suggestedExams: string[];
  suggestedConduct: { id: string; text: string };
  distractorConducts: { id: string; text: string; whyWrong: string }[];
  medications: { genericName: string; route: string; indication: string }[];
  requiresPharmacy: boolean;
  explanation: string;
  possibleComorbidities: string[];
  sources: { name: string; url: string; accessedOn: string }[];
  version: string;
  reviewedOn: string;
  reviewStatus: string;
}

export interface CasesCatalog {
  cases: ClinicalCaseDefinition[];
}

export const CASES_CATALOG: CasesCatalog = casesRaw as unknown as CasesCatalog;

export interface NamesPool {
  pools: {
    female: string[];
    male: string[];
    lastNames: string[];
  };
}

export const NAMES_CATALOG: NamesPool = namesRaw as unknown as NamesPool;
