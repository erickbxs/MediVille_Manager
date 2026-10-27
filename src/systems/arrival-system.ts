/**
 * Arquivo: src/systems/arrival-system.ts
 *
 * 1. O que este arquivo faz?
 * Simula o fluxo contínuo e intenso de chegada de pacientes ao hospital (ambulâncias, ondas de ônibus a cada 25s,
 * cadência dinâmica por porte da unidade e picos de demanda em surtos e emergências).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 3 do Prompt 22, criando a sensação de "Hospital Vivo em Tempo Real" com cadência acelerada
 * escalonada por UBS (4-6s), UPA (2.5-4s) e Hospital Municipal (2-3.5s) e ondas de desembarque coletivo.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O intervalo básico provém de BALANCE.arrival.baseIntervalSec em balance.json e os multiplicadores em calculateArrivalInterval().
 *
 * Importa: src/core/config.ts, src/core/event-bus.ts, src/state/game-state.ts, src/systems/case-system.ts, src/systems/event-system.ts
 * Conecta-se com: src/core/simulation.ts, src/systems/queue-system.ts, src/systems/traffic-system.ts
 */

import { BALANCE } from '../core/config';
import type { GameState } from '../state/game-state';
import { createPatient } from './case-system';
import { globalBus } from '../core/event-bus';
import { getActiveArrivalMultiplier } from './event-system';
import { calculateDemandMultiplier } from './economy-system';
import { classifyManchester, applyTriageProcedure } from './triage-system';
import type { PatientInstance } from '../entities/patient';

const MIN_MARKET_MULTIPLIER = 0.1;
const DEFAULT_HELIPAD_INTERVAL_SEC = 60;
export const BUS_ARRIVAL_INTERVAL_SEC = 25;
const EMERGENCY_EVENT_MULTIPLIER = 3.0;

const MORNING_PEAK_THRESHOLD_SEC = 20;
const UBS_MORNING_FACTOR = 1.25;
const UPA_CADENCE_FACTOR = 1.6;
const HOSPITAL_CADENCE_FACTOR = 2.2;
const MIN_TOTAL_MULT = 0.1;
const HOSPITAL_MIN_INTERVAL = 1.5;
const HOSPITAL_MAX_INTERVAL = 3.5;
const UPA_MIN_INTERVAL = 2.0;
const UPA_MAX_INTERVAL = 4.0;
const UBS_MIN_INTERVAL = 2.5;
const UBS_MAX_INTERVAL = 6.0;
const BUS_MIN_PATIENTS = 3;
const BUS_RANDOM_PATIENTS_RANGE = 3;

export function getUnitLevelCadenceFactor(level: 'ubs' | 'upa' | 'hospital', dayTimeSec = 0): number {
  switch (level) {
    case 'ubs': {
      // UBS: fluxo constante com pico matinal (primeiros 20 segundos do dia)
      const isMorningPeak = dayTimeSec < MORNING_PEAK_THRESHOLD_SEC;
      return isMorningPeak ? UBS_MORNING_FACTOR : 1.0;
    }
    case 'upa':
      // UPA: fluxo acelerado de pronto atendimento (2.5s a 4s)
      return UPA_CADENCE_FACTOR;
    case 'hospital':
      // Hospital: fluxo hospitalar intenso (2s a 3.5s)
      return HOSPITAL_CADENCE_FACTOR;
    default:
      return 1.0;
  }
}

export function calculateArrivalInterval(
  sectorCount: number,
  eventMultiplier = 1.0,
  marketMultiplier = 1.0,
  level: 'ubs' | 'upa' | 'hospital' = 'ubs',
  dayTimeSec = 0
): number {
  const { baseIntervalSec, sectorGrowthFactor } = BALANCE.arrival;
  const sectorMult = 1 + sectorGrowthFactor * sectorCount;
  const levelFactor = getUnitLevelCadenceFactor(level, dayTimeSec);
  const effectiveEventMult = eventMultiplier > 1.0 ? Math.max(EMERGENCY_EVENT_MULTIPLIER, eventMultiplier) : eventMultiplier;
  const totalMult = sectorMult * levelFactor * Math.max(0, effectiveEventMult) * Math.max(MIN_MARKET_MULTIPLIER, marketMultiplier);

  // Intervalo respeitando o porte: UBS (4-6s), UPA (2.5-4s), Hospital (2-3.5s)
  const calculated = baseIntervalSec / Math.max(MIN_TOTAL_MULT, totalMult);
  if (level === 'hospital') {
    return Math.max(HOSPITAL_MIN_INTERVAL, Math.min(HOSPITAL_MAX_INTERVAL, calculated));
  }
  if (level === 'upa') {
    return Math.max(UPA_MIN_INTERVAL, Math.min(UPA_MAX_INTERVAL, calculated));
  }
  return Math.max(UBS_MIN_INTERVAL, Math.min(UBS_MAX_INTERVAL, calculated));
}

export function checkHelipadArrival(state: GameState, deltaSec: number): void {
  const hasHelipad = Array.from(state.rooms.values()).some((r) => r.typeId === 'helipad');
  if (!hasHelipad) return;

  const interval = BALANCE.sectors.helipadArrivalIntervalSec ?? DEFAULT_HELIPAD_INTERVAL_SEC;
  state.helipadTimerSec = (state.helipadTimerSec ?? 0) + deltaSec;

  if (state.helipadTimerSec >= interval) {
    state.helipadTimerSec = 0;
    const patientId = `heli_pat_${Date.now()}`;
    const patient = createPatient(patientId, state.masteredCaseIds, 'hospital');
    patient.clinicalCase.definition.severity = 'Grave';
    patient.isHelipadEmergency = true;
    state.patients.set(patientId, patient);
    state.queueIds.unshift(patientId);
    globalBus.emit('patient:arrived', { patientId, name: `🚁 ${patient.name} (Aeromédico)` });
    globalBus.emit('helipad:landing', { patientId });
  }
}

function classifyPatientTriage(state: GameState, patient: PatientInstance): void {
  const hasTriage = Array.from(state.rooms.values()).some((r) => r.definition.id === 'triage');
  if (hasTriage) {
    applyTriageProcedure(state, patient);
  } else {
    patient.manchesterPriority = classifyManchester(patient);
  }
}

export function checkBusArrivalWave(state: GameState, deltaSec: number): void {
  state.busArrivalTimerSec = (state.busArrivalTimerSec ?? 0) + deltaSec;
  if (state.busArrivalTimerSec >= BUS_ARRIVAL_INTERVAL_SEC) {
    state.busArrivalTimerSec = 0;
    // Desembarque de onda com 3 a 5 pacientes simultâneos
    const count = BUS_MIN_PATIENTS + Math.floor(Math.random() * BUS_RANDOM_PATIENTS_RANGE);
    for (let i = 0; i < count; i++) {
      const patientId = `bus_pat_${Date.now()}_${i}`;
      const patient = createPatient(patientId, state.masteredCaseIds, state.hospitalLevel);
      classifyPatientTriage(state, patient);
      state.patients.set(patientId, patient);
      state.queueIds.push(patientId);
      patient.state = 'waiting';
      globalBus.emit('patient:arrived', { patientId, name: `🚌 ${patient.name}` });
      globalBus.emit('patient:entered_queue', { patientId });
    }
    globalBus.emit('bus:arrival', { patientCount: count });
  }
}

export function updateArrivalSystem(state: GameState, deltaSec: number): void {
  const eventMult = getActiveArrivalMultiplier(state);
  const marketMult = calculateDemandMultiplier(state);
  const interval = calculateArrivalInterval(state.rooms.size, eventMult, marketMult, state.hospitalLevel, state.dayTimeSec);
  state.arrivalTimerSec += deltaSec;

  if (state.arrivalTimerSec >= interval) {
    state.arrivalTimerSec -= interval;
    const patientId = `pat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const patient = createPatient(patientId, state.masteredCaseIds, state.hospitalLevel);
    classifyPatientTriage(state, patient);

    state.patients.set(patientId, patient);
    state.queueIds.push(patientId);
    patient.state = 'waiting';

    globalBus.emit('patient:arrived', { patientId, name: patient.name });
    globalBus.emit('patient:entered_queue', { patientId });
  }


  checkBusArrivalWave(state, deltaSec);
  checkHelipadArrival(state, deltaSec);
}
