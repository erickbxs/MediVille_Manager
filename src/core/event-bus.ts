/**
 * Arquivo: src/core/event-bus.ts
 * O que faz: Barramento de eventos tipado (Observer Pattern) que desacopla completamente a simulação da interface gráfica e do renderizador.
 * Para que foi criado: Cumprir a exigência do GDD de manter a lógica pura e independente da UI/Canvas, com zero any.
 * Como modificar/debugar: Adicione novas ações no mapa GameEvents. Use bus.on() para escutar e bus.emit() para disparar.
 * Conecta-se com: src/core/simulation.ts, src/ui/*, src/render/*
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
