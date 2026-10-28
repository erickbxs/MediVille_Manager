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
    waitingPatienceFactor: number;
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
    missingMedicationPenalty: number;
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
  staff: {
    startingDoctors: number;
    startingNurses: number;
    minSkill: number;
    maxSkill: number;
    skillReductionFactor: number;
  };
  events: {
    intervalBetweenEventsSec: number;
    firstEventDelaySec: number;
    maxActiveEvents: number;
  };
  sigtap: {
    consultationBpaCode: string;
    pharmacyBpaCode: string;
  };
  ministryOfHealth: {
    dailyFixedPab: number;
    performanceBonusThreshold: number;
    performanceBonusPerPoint: number;
  };
  emergencyGrant: {
    amount: number;
    description: string;
  };
  progression: {
    levels: HospitalProgressionLevel[];
  };
  sectors: {
    vaccinationDailyBonus: number;
    vaccinationReputationBonus: number;
    laboratorySpeedMultiplier: number;
    xraySigtapBonus: number;
    surgeryIcuRevenue: number;
    staffRoomSpeedMultiplier: number;
    helipadReward?: number;
    helipadArrivalIntervalSec?: number;
    bloodBankTransfusionBonus?: number;
    woundCareSpeedMultiplier?: number;
    dentalRevenue?: number;
  };
  governmentNegotiation: {
    cooldownDays: number;
    totalAcceptBonus: number;
    partialAcceptBonus: number;
  };
  mixedEconomy: {
    minConsultationFee: number;
    maxConsultationFee: number;
    defaultConsultationFee: number;
    lowPriceThreshold: number;
    lowPriceDemandBonus: number;
    highPriceThreshold: number;
    requiredReputationForHighPrice: number;
    plans: MixedEconomyPlan[];
  };
  staffPerks: {
    techSpeedReduction: number;
    janitorCleanlinessBonus: number;
    managerUpkeepReductionPerSkill: number;
    managerNegotiationBonusPerSkill: number;
  };
  fatigue: {
    energyInitial: number;
    lossPerPatient: number;
    tiredThreshold: number;
    restThreshold: number;
    tiredSpeedPenalty: number;
    breakDurationSec: number;
    coffeeBoostCost: number;
  };
  revalida: RevalidaBalanceConfig;
}

export interface RevalidaCalmModeConfig {
  disableAbandonment: boolean;
  disableBusWaves: boolean;
  disableHelipad: boolean;
  disableRandomEvents: boolean;
  disableDefeat: boolean;
  hideManagementDock: boolean;
}

export type RevalidaDifficulty = 'facil' | 'medio' | 'dificil';

export interface RevalidaDifficultyLevel {
  /** Qual alternativa errada riscar: a mais parecida com a certa (tricky), a menos parecida (obvious) ou nenhuma. */
  eliminate: 'tricky' | 'obvious' | 'none';
  rewardMultiplier: number;
}

export interface RevalidaDifficultyConfig {
  default: RevalidaDifficulty;
  levels: Record<RevalidaDifficulty, RevalidaDifficultyLevel>;
}

export interface RevalidaBalanceConfig {
  enabled: boolean;
  questionsUrl: string;
  commentsUrl: string;
  imageBasePath: string;
  areaRooms: Record<string, string>;
  arrivalIntervalSec: number;
  maxWaitingPatients: number;
  advisorMaxSuggestions: number;
  difficulty: RevalidaDifficultyConfig;
  reviewEveryNthPatient: number;
  wrongReputationPenalty: number;
  correctReputationGain: number;
  reputationCap: number;
  defaultPatientAge: { min: number; max: number };
  calmMode: RevalidaCalmModeConfig;
}

export interface MixedEconomyPlan {
  id: string;
  name: string;
  monthlyCost: number;
  feePerPatient: number;
  dailyBonusArrival: number;
}

export type StaffRoleType = 'doctor' | 'nurse' | 'pharmacist' | 'receptionist' | 'tech' | 'janitor' | 'manager';

export interface HospitalProgressionLevel {
  id: 'ubs' | 'upa' | 'hospital';
  name: string;
  minTreatedCount: number;
  minReputation: number;
  unlockedRooms: string[];
}


export interface TutorialTip {
  id: string;
  trigger: string;
  title: string;
  message: string;
}

export interface TutorialCatalog {
  tips: TutorialTip[];
}

export interface SigtapProcedure {
  code: string;
  name: string;
  type: 'BPA' | 'AIH';
  baseValue: number;
  description: string;
}

export interface SigtapCatalog {
  procedures: SigtapProcedure[];
}

export interface RenameMedication {
  id: string;
  genericName: string;
  category: string;
  unit: string;
  batchSize: number;
  batchCost: number;
  initialStock: number;
  description: string;
}

export interface PharmacyCatalog {
  medications: RenameMedication[];
}
