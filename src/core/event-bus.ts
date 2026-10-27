/**
 * Arquivo: src/core/event-bus.ts
 *
 * 1. O que este arquivo faz?
 * Barramento de eventos estritamente tipado (Observer Pattern) que desacopla a simulação da UI, áudio e renderizador PixiJS.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a exigência do GDD de manter a lógica pura, modular e reativa, com zero any e comunicação orientada a eventos.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Adicione novos eventos na interface GameEvents e registre listeners via bus.on() ou emita via bus.emit().
 *
 * Conecta-se com: src/core/simulation.ts, src/ui/*, src/render/*, src/systems/*
 */

export interface GameEvents {
  'tick': { day: number; dayProgress: number; speed: number };
  'day:end': { day: number; cash: number; reputation: number; patientsTreated: number };
  'state:changed': undefined;
  'cash:changed': { cash: number; delta: number; reason: string };
  'reputation:changed': { reputation: number; delta: number };
  'patient:arrived': { patientId: string; name: string };
  'patient:entered_queue': { patientId: string };
  'patient:consultation_started': { patientId: string; roomId: string };
  'patient:needs_decision': { patientId: string };
  'patient:treated': { patientId: string; satisfaction: number; revenue: number };
  'patient:abandoned': { patientId: string; reason: string };
  'room:placed': { roomId: string; typeId: string; cost: number };
  'room:removed': { roomId: string; refund: number };
  'advisor:alert': { id: string; message: string };
  'game:defeat': { reason: string };
  'event:started': { eventId: string; title: string; icon: string; description: string; durationSec: number };
  'event:ended': { eventId: string; title: string };
  'staff:hired': { staffId: string; roleId: string; name: string };
  'staff:fired': { staffId: string; name: string };
  'pharmacy:stock_changed': { medId: string; newStock: number; delta: number };
  'pharmacy:stock_out': { medId: string; medName: string };
  'economy:grant_received': { amount: number; reason: string };
  'economy:transfer_received': { amount: number; fixedPab: number; bonus: number };
  'economy:bpa_billed': { code: string; name: string; amount: number };
  'progression:level_up': { levelId: 'ubs' | 'upa' | 'hospital'; name: string };
  'tutorial:tip_triggered': { tipId: string; title: string; message: string };
  'room:moved': { roomId: string; col: number; row: number; rotated: boolean };
  'decision:queue_updated': { pendingCount: number };
  'patient:ready_for_treatment': { patientId: string; roomId: string; patientName: string };
  'simulation:speed_changed': { speed: number };
  'feedback:gain_float': { text: string; col: number; row: number };
  'patient:spawned': { patientId: string };
  'patient:consultation_completed': { patientId: string };
  'traffic:patient_disembarked': { patientId: string; x: number; y: number };
  'sound:mute_changed': { muted: boolean };
  'goal:completed': { goal: { id: string; title: string; description: string; target: number; rewardCash: number; completed: boolean }; rewardCash: number };
  'encyclopedia:case_unlocked': { caseId: string };
  'protocol:mastered': { caseId: string; diseaseName: string; totalMastered: number };
  'patient:auto_treatment_started': { patientId: string; roomId: string; caseId: string; durationSec: number };
  'economy:negotiation_completed': { outcome: 'total' | 'partial' | 'denied'; bonus: number; message: string };
  'save:restored_from_backup': { reason: string; timestamp?: number };
  'helipad:landing': { patientId: string };
  'defeat:warning': { type: 'cash' | 'reputation'; consecutiveDays: number; daysRemaining: number };
  'game:over': { reason: string; stats: { days: number; patientsTreated: number; masteredCases: number; finalReputation: number; score: number } };
  'milestone:unlocked': { id: string; title: string; description: string };
  'i18n:changed': { lang: string };
  'music:mute_changed': { muted: boolean };
  'music:ducking_changed': { isDucking: boolean };
  'map:expanded': { newGridSize: number; cost: number; deltaRow?: number; deltaCol?: number };
  'toast:show': { text: string };
  'bus:arrival': { patientCount: number };
}

export type EventKey = keyof GameEvents;
export type EventHandler<K extends EventKey> = (payload: GameEvents[K]) => void;
type InternalHandler = (payload: unknown) => void;

export class EventBus {
  private listeners: Map<EventKey, Set<InternalHandler>> = new Map();

  public on<K extends EventKey>(event: K, handler: EventHandler<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    const internal = handler as unknown as InternalHandler;
    set.add(internal);
    return () => set.delete(internal);
  }

  public emit<K extends EventKey>(event: K, payload: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const globalBus = new EventBus();
