/**
 * Arquivo: tests/fatigue-weather-balance-and-6langs.test.ts
 *
 * 1. O que este arquivo faz?
 * Executa testes unitários automatizados para a versão 1.8.0 do MediVille Manager cobrindo:
 * - Sistema de Cansaço e Energia da Equipe (dedução por atendimento, penalidade de velocidade e recuperação na Sala de Descanso).
 * - Exatidão matemática estrita das 4 fórmulas do GDD usando parâmetros do balance.json.
 * - Detecção procedural do clima sazonal (chuva, sol, carnaval/feriado, normal) e inicialização de animações médicas.
 * - Paridade absoluta de 100% de chaves entre os 6 idiomas suportados (PT, ES, EN, FR, DE, ZH) e aplicação de fonte do sistema para ZH.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir conformidade com os requisitos de engenharia do Prompt 19 e evitar regressões de jogabilidade,
 * balanceamento matemático ou internacionalização.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/fatigue-weather-balance-and-6langs.test.ts`. Caso falhe a paridade de chaves,
 * verifique se alguma chave foi adicionada em um idioma mas esquecida nos outros em `src/i18n/`.
 *
 * Importa: vitest, fs, path, src/systems/staff-fatigue-system.ts, src/utils/formulas.ts,
 *          src/core/config.ts, src/core/new-game.ts, src/render/weather-view.ts,
 *          src/render/medical-animations.ts, src/i18n/i18n.ts, src/entities/staff.ts,
 *          src/entities/event.ts, src/entities/room.ts
 * Conecta-se com: src/data/balance.json, src/i18n/*.json, src/core/simulation.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getStaffEnergy,
  isStaffTired,
  getStaffFatigueSpeedPenalty,
  deductStaffEnergyOnConsultation,
  hasStaffRoom,
  energizeAllStaffWithCoffee,
  updateStaffFatigueSystem,
} from '../src/systems/staff-fatigue-system';
import {
  calculateConsultationDuration,
  calculateSatisfaction,
  calculateNextDayReputation,
  calculateArrivalRate,
  calculateArrivalIntervalFromRate,
  clamp,
} from '../src/utils/formulas';
import { BALANCE, STAFF_CATALOG, ROOMS_CATALOG } from '../src/core/config';
import { createInitialGameState } from '../src/core/new-game';
import { detectWeather, WeatherView } from '../src/render/weather-view';
import { MedicalAnimationsView } from '../src/render/medical-animations';
import { setLanguage, getLocale } from '../src/i18n/i18n';
import type { StaffMember } from '../src/entities/staff';
import type { ActiveEvent } from '../src/entities/event';
import { createRoomInstance, type RoomInstance } from '../src/entities/room';

function createMockStaff(id: string, energy = 100): StaffMember {
  const role = (STAFF_CATALOG.roles.find((r) => r.id === 'doctor') ?? STAFF_CATALOG.roles[0])!;
  return {
    id,
    name: `Dr. ${id}`,
    roleId: role.id,
    role,
    skill: 3,
    dailySalary: 5000,
    assignedRoomId: null,
    energy,
    isResting: false,
    restTimerSec: 0,
  };
}

function createMockStaffRoom(id: string): RoomInstance {
  const def = (ROOMS_CATALOG.rooms.find((r) => r.id === 'staff_room') ?? ROOMS_CATALOG.rooms[0])!;
  return createRoomInstance(id, def, 5, 5, false);
}

function extractAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    if (key === '_meta') continue;
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(extractAllKeys(value as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

describe('PARTE 1: Animações Médicas & Clima Sazonal', () => {
  it('detecta clima chuvoso durante eventos de dengue ou inverno', () => {
    const dengueEvent: ActiveEvent = {
      instanceId: 'inst_1',
      remainingSec: 120,
      elapsedSec: 10,
      definition: {
        id: 'surto_dengue',
        type: 'epidemic',
        title: 'Surto de Dengue',
        icon: '🦟',
        description: 'Chuva e proliferação de mosquitos',
        durationSec: 180,
        arrivalMultiplier: 2.0,
      },
    };

    const weather = detectWeather([dengueEvent]);
    expect(weather).toBe('rain');
  });

  it('detecta clima ensolarado/onda de calor durante eventos térmicos de verão', () => {
    const heatEvent: ActiveEvent = {
      instanceId: 'inst_2',
      remainingSec: 120,
      elapsedSec: 10,
      definition: {
        id: 'onda_calor',
        type: 'seasonal',
        title: 'Onda de Calor Intenso',
        icon: '☀️',
        description: 'Temperaturas elevadas e tempo seco',
        durationSec: 180,
        arrivalMultiplier: 1.5,
      },
    };

    const weather = detectWeather([heatEvent]);
    expect(weather).toBe('sunny');
  });

  it('detecta clima festivo durante eventos de carnaval ou feriado', () => {
    const carnivalEvent: ActiveEvent = {
      instanceId: 'inst_3',
      remainingSec: 120,
      elapsedSec: 10,
      definition: {
        id: 'feriado_carnaval',
        type: 'seasonal',
        title: 'Carnaval de Rua',
        icon: '🎭',
        description: 'Maior movimentação e festividades',
        durationSec: 180,
        arrivalMultiplier: 1.8,
      },
    };

    const weather = detectWeather([carnivalEvent]);
    expect(weather).toBe('festive');
  });

  it('instancia MedicalAnimationsView e WeatherView sem erros de ciclo', () => {
    const medView = new MedicalAnimationsView();
    expect(medView.container).toBeDefined();
    expect(typeof medView.render).toBe('function');

    const weatherView = new WeatherView();
    expect(weatherView.container).toBeDefined();
    expect(typeof weatherView.render).toBe('function');
  });
});

describe('PARTE 2: Sistema de Energia & Sala de Descanso (staff_room)', () => {
  it('inicia funcionário com energia completa e sem penalidade de velocidade', () => {
    const staff = createMockStaff('medico_1', 100);
    expect(getStaffEnergy(staff)).toBe(100);
    expect(isStaffTired(staff)).toBe(false);
    expect(getStaffFatigueSpeedPenalty(staff)).toBe(0);
  });

  it('deduz energia após atendimento e aplica penalidade quando energy < 40%', () => {
    const state = createInitialGameState('hospital');
    const staff = createMockStaff('medico_2', 45);
    state.staff.set(staff.id, staff);

    expect(isStaffTired(staff)).toBe(false);

    deductStaffEnergyOnConsultation(state, staff.id);
    // 45 - 8 = 37% -> Cansado!
    expect(staff.energy).toBe(37);
    expect(isStaffTired(staff)).toBe(true);
    expect(getStaffFatigueSpeedPenalty(staff)).toBe(0.25);
  });

  it('identifica corretamente se o hospital possui Sala de Descanso construída', () => {
    const state = createInitialGameState('ubs');
    expect(hasStaffRoom(state)).toBe(false);

    const room = createMockStaffRoom('room_staff_1');
    state.rooms.set(room.id, room);

    expect(hasStaffRoom(state)).toBe(true);
  });

  it('encaminha funcionário exausto para staff_room e restaura 100% após repouso', () => {
    const state = createInitialGameState('hospital');
    const room = createMockStaffRoom('room_staff_main');
    state.rooms.set(room.id, room);

    const staff = createMockStaff('enf_1', 30); // < 35%
    state.staff.set(staff.id, staff);

    // Simula 1 segundo de simulação -> deve iniciar descanso
    updateStaffFatigueSystem(state, 1);
    expect(staff.isResting).toBe(true);
    expect(staff.restTimerSec).toBeGreaterThan(0);

    // Simula passagem de 10 segundos (> 8s necessários)
    updateStaffFatigueSystem(state, 10);
    expect(staff.isResting).toBe(false);
    expect(staff.energy).toBe(100);
    expect(isStaffTired(staff)).toBe(false);
  });

  it('permite energizar toda a equipe com café mediante taxa de R$ 500', () => {
    const state = createInitialGameState('hospital');
    state.cash = 10000;
    const staff1 = createMockStaff('m1', 20);
    const staff2 = createMockStaff('m2', 30);
    state.staff.set(staff1.id, staff1);
    state.staff.set(staff2.id, staff2);

    const res = energizeAllStaffWithCoffee(state);
    expect(res.success).toBe(true);
    expect(res.cost).toBe(500);
    expect(state.cash).toBe(9500);
    expect(staff1.energy).toBe(100);
    expect(staff2.energy).toBe(100);
  });
});

describe('PARTE 3: Fórmulas Matemáticas Puras e Calibragem de balance.json', () => {
  it('respeita os parâmetros oficiais carregados em BALANCE', () => {
    expect(BALANCE.time.dayDurationSec).toBe(60);
    expect(BALANCE.economy.startingCash).toBe(100000);
    expect([5, 15]).toContain(BALANCE.arrival.baseIntervalSec);
    expect(BALANCE.consultation.baseTimeSec).toBe(20);
    expect(BALANCE.queue.patienceSec).toBe(90);
    expect(BALANCE.consultation.skillReductionPerLevel).toBe(0.05);
    expect(BALANCE.fatigue.lossPerPatient).toBe(8);
    expect(BALANCE.fatigue.tiredThreshold).toBe(40);
    expect(BALANCE.fatigue.tiredSpeedPenalty).toBe(0.25);
  });

  it('Fórmula 1: T_atend = T_base * (1 - 0.05 * (H - 1))', () => {
    // Nível 1: 20 * (1 - 0) = 20 s
    expect(calculateConsultationDuration(20, 1)).toBe(20);
    // Nível 3: 20 * (1 - 0.10) = 18 s
    expect(calculateConsultationDuration(20, 3)).toBe(18);
    // Nível 5: 20 * (1 - 0.20) = 16 s
    expect(calculateConsultationDuration(20, 5)).toBe(16);
  });

  it('Fórmula 2: S = clamp(100 - 20 * (T_esp / T_pac) - 15 * N_erros, 0, 100)', () => {
    // Sem espera nem erros -> 100
    expect(calculateSatisfaction(0, 90, 0)).toBe(100);
    // Espera metade do tempo: 100 - 20 * 0.5 = 90
    expect(calculateSatisfaction(45, 90, 0)).toBe(90);
    // Com 2 erros: 90 - 30 = 60
    expect(calculateSatisfaction(45, 90, 2)).toBe(60);
    // Limite mínimo 0
    expect(calculateSatisfaction(200, 90, 10)).toBe(0);
  });

  it('Fórmula 3: R_{dia+1} = clamp(R_dia + 0.1 * (S_media - R_dia), 0, 100)', () => {
    // Rep 50 e Sat 80 -> 50 + 0.1 * 30 = 53
    expect(calculateNextDayReputation(50, 80)).toBe(53);
    // Rep 70 e Sat 40 -> 70 + 0.1 * (-30) = 67
    expect(calculateNextDayReputation(70, 40)).toBe(67);
  });

  it('Fórmula 4: lambda = lambda_base * (1 + 0.1 * N_setores)', () => {
    const baseRate = 1 / 15;
    // 0 setores: lambda = baseRate
    expect(calculateArrivalRate(0, baseRate)).toBeCloseTo(baseRate);
    // 5 setores: baseRate * (1 + 0.5) = 1.5 * baseRate
    expect(calculateArrivalRate(5, baseRate)).toBeCloseTo(baseRate * 1.5);
    // Intervalo decorrente
    const interval5 = calculateArrivalIntervalFromRate(5, 15);
    expect(interval5).toBeCloseTo(10); // 15 / 1.5 = 10 segundos
  });

  it('clamp matematicamente restringe aos limites especificados', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(42, 0, 100)).toBe(42);
  });
});

describe('PARTE 4: Internacionalização Completa para os 6 Idiomas (PT, ES, EN, FR, DE, ZH)', () => {
  const i18nDir = path.resolve(__dirname, '../src/i18n');
  const locales = ['pt', 'es', 'en', 'fr', 'de', 'zh'] as const;

  const filesContent: Record<string, Record<string, unknown>> = {};
  const filesKeys: Record<string, string[]> = {};

  beforeEach(() => {
    for (const loc of locales) {
      const filePath = path.join(i18nDir, `${loc}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      filesContent[loc] = parsed;
      filesKeys[loc] = extractAllKeys(parsed);
    }
  });

  it('garante paridade exata de 100% de chaves em todos os 6 idiomas', () => {
    const ptKeys = filesKeys['pt'];
    expect(ptKeys).toBeDefined();
    if (!ptKeys) return;
    expect(ptKeys.length).toBeGreaterThan(100);

    for (const loc of locales) {
      if (loc === 'pt') continue;
      const targetKeys = filesKeys[loc];
      expect(targetKeys).toBeDefined();
      if (!targetKeys) continue;
      expect(targetKeys.length, `Quantidade de chaves em ${loc} difere de pt`).toBe(ptKeys.length);
      expect(targetKeys, `Chaves em ${loc} devem ser idênticas a pt`).toEqual(ptKeys);
    }
  });

  it('mantém as siglas brasileiras SUS, UBS e UPA no glossário com explicações apropriadas', () => {
    for (const loc of locales) {
      const content = filesContent[loc];
      expect(content).toBeDefined();
      if (!content) continue;
      const glossary = content.glossary as Record<string, string> | undefined;
      expect(glossary, `Glossary deve existir em ${loc}`).toBeDefined();
      expect(glossary?.sus, `Sigla SUS deve estar definida em ${loc}`).toBeDefined();
      expect(glossary?.ubs, `Sigla UBS deve estar definida em ${loc}`).toBeDefined();
      expect(glossary?.upa, `Sigla UPA deve estar definida em ${loc}`).toBeDefined();
    }
  });

  it('aplica a pilha de fontes do sistema nativa ao selecionar chinês (zh)', async () => {
    await setLanguage('pt');
    expect(getLocale()).toBe('pt');

    await setLanguage('zh');
    expect(getLocale()).toBe('zh');
    if (typeof document !== 'undefined' && document.body) {
      expect(document.body.style.fontFamily).toContain('PingFang SC');
    }

    await setLanguage('pt');
  });
});
