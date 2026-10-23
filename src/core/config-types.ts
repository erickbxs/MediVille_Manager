/**
 * Arquivo: src/core/config-types.ts
 * O que faz: Define as interfaces e tipos TypeScript para todos os parâmetros de balanceamento e configurações do jogo.
 * Para que foi criado: Garante tipagem estrita (zero any) para os dados carregados de src/data/balance.json.
 * Como modificar/debugar: Ao adicionar novos parâmetros em balance.json, reflita as propriedades correspondentes aqui.
 * Conecta-se com: src/data/balance.json, src/core/config.ts
 */

export interface IntensityConfig {
  id: string;
  labelKey: string;
  patienceFactor: number;
}

export interface StarterRoomConfig {
  typeId: string;
  col: number;
  row: number;
  rotated: boolean;
}

export interface GameBalanceConfig {
  time: {
    fixedStepSec: number;
    maxFrameDeltaSec: number;
    dayDurationSec: number;
    speedLevels: number[];
    initialSpeed: number;
  };
  economy: {
    startingCash: number;
    revenuePerPatient: number;
    pharmacyRevenue: number;
    removeRefundRatio: number;
  };
  arrival: {
    baseIntervalSec: number;
    initialProgress: number;
    sectorGrowthFactor: number;
    reputationDemandFactor: number;
    reputationReference: number;
  };
  consultation: {
    baseTimeSec: number;
    skillReductionPerLevel: number;
    skillMin: number;
    skillMax: number;
    decisionTimeoutSec: number;
    correctSuggestionChance: number;
  };
  queue: {
    patienceSec: number;
    alertRatio: number;
    intensityLevels: IntensityConfig[];
  };
  population: {
    femaleChance: number;
    comorbidityChance: number;
  };
  satisfaction: {
    min: number;
    max: number;
    initial: number;
    waitPenalty: number;
    errorPenalty: number;
    abandonedSatisfaction: number;
    turnedAwaySatisfaction: number;
    missingPharmacyPenalty: number;
  };
  reputation: {
    initial: number;
    learningRate: number;
  };
  defeat: {
    graceDays: number;
    minReputation: number;
    minCash: number;
  };
  grid: {
    cols: number;
    rows: number;
  };
  starterRooms: StarterRoomConfig[];
  advisor: {
    maxSuggestions: number;
    cashWarningThreshold: number;
    queueWarningThreshold: number;
    treatedPatientsPharmacyWarning: number;
  };
}
