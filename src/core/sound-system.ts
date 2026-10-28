/**
 * Arquivo: src/core/sound-system.ts
 *
 * 1. O que este arquivo faz?
 * Sintetizador procedural de efeitos sonoros de áudio para interface, construção, consultas médicas e alertas
 * utilizando 100% Web Audio API nativo (zero dependências ou arquivos .mp3/.wav externos, mantendo o bundle < 2 MB).
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Dar feedback tátil e sonoro ao jogador (clique de botões, sucesso clínico +R$ 3.600, colocação de salas e sirenes),
 * com controle persistente de mudo (🔊 / 🔇) sincronizado com as preferências do jogador.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar novos sons, consulte as constantes SOUND_PARAMS e configure envelopes ADSR em OscillatorNode.
 *
 * Importa: src/core/event-bus.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts, src/ui/title-screen.ts
 */

import { globalBus } from './event-bus';

const MUTE_STORAGE_KEY = 'mediville_sound_muted';
const SFX_VOLUME_STORAGE_KEY = 'mediville_sfx_volume';
const DEFAULT_SFX_VOLUME = 1;

const NOTE_C5 = 523.25;
const NOTE_E5 = 659.25;
const NOTE_G5 = 783.99;
const NOTE_C6 = 1046.5;
const NOTE_A5 = 880;
const NOTE_D6 = 1174.66;

const SOUND_PARAMS = {
  CLICK_START_HZ: 600,
  CLICK_END_HZ: 200,
  CLICK_TIME_SEC: 0.04,
  CLICK_DURATION_SEC: 0.05,
  CLICK_GAIN: 0.12,
  GAIN_MIN: 0.001,
  SUCCESS_NOTES: [NOTE_C5, NOTE_E5, NOTE_G5, NOTE_C6] as const,
  SUCCESS_INTERVAL_SEC: 0.07,
  SUCCESS_GAIN: 0.14,
  SUCCESS_FADE_SEC: 0.25,
  SUCCESS_DURATION_SEC: 0.28,
  BUILD_START_HZ: 180,
  BUILD_END_HZ: 65,
  BUILD_TIME_SEC: 0.12,
  BUILD_GAIN: 0.2,
  BUILD_DURATION_SEC: 0.13,
  ALERT_NOTES: [NOTE_A5, NOTE_D6] as const,
  ALERT_INTERVAL_SEC: 0.12,
  ALERT_GAIN: 0.08,
  ALERT_FADE_SEC: 0.09,
  ALERT_DURATION_SEC: 0.1,
} as const;

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private muted = false;
  private volume = DEFAULT_SFX_VOLUME;
  private master: GainNode | null = null;

  constructor() {
    this.initMuteState();
    this.setupEventListeners();
  }

  private initMuteState(): void {
    if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
      const rawVolume = localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
      if (rawVolume !== null && Number.isFinite(Number(rawVolume))) this.volume = Number(rawVolume);
    }
  }

  private setupEventListeners(): void {
    globalBus.on('patient:consultation_completed', () => this.playSuccess());
    globalBus.on('room:placed', () => this.playBuild());
    globalBus.on('event:started', () => this.playAlert());
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Volume dos efeitos sonoros (0 a 1), separado do volume da música. */
  public getVolume(): number {
    return this.volume;
  }

  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master) this.master.gain.value = this.volume;
    if (typeof localStorage !== 'undefined') localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(this.volume));
  }

  private output(ctx: AudioContext): AudioNode {
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(ctx.destination);
    }
    return this.master;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    }
    globalBus.emit('sound:mute_changed', { muted: this.muted });
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    }
    globalBus.emit('sound:mute_changed', { muted: this.muted });
  }

  public playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(SOUND_PARAMS.CLICK_START_HZ, now);
    osc.frequency.exponentialRampToValueAtTime(SOUND_PARAMS.CLICK_END_HZ, now + SOUND_PARAMS.CLICK_TIME_SEC);

    gain.gain.setValueAtTime(SOUND_PARAMS.CLICK_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(SOUND_PARAMS.GAIN_MIN, now + SOUND_PARAMS.CLICK_TIME_SEC);

    osc.connect(gain);
    gain.connect(this.output(ctx));
    osc.start(now);
    osc.stop(now + SOUND_PARAMS.CLICK_DURATION_SEC);
  }

  public playSuccess(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    SOUND_PARAMS.SUCCESS_NOTES.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * SOUND_PARAMS.SUCCESS_INTERVAL_SEC;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(SOUND_PARAMS.SUCCESS_GAIN, startTime);
      gain.gain.exponentialRampToValueAtTime(SOUND_PARAMS.GAIN_MIN, startTime + SOUND_PARAMS.SUCCESS_FADE_SEC);

      osc.connect(gain);
      gain.connect(this.output(ctx));
      osc.start(startTime);
      osc.stop(startTime + SOUND_PARAMS.SUCCESS_DURATION_SEC);
    });
  }

  public playBuild(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(SOUND_PARAMS.BUILD_START_HZ, now);
    osc.frequency.exponentialRampToValueAtTime(SOUND_PARAMS.BUILD_END_HZ, now + SOUND_PARAMS.BUILD_TIME_SEC);

    gain.gain.setValueAtTime(SOUND_PARAMS.BUILD_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(SOUND_PARAMS.GAIN_MIN, now + SOUND_PARAMS.BUILD_TIME_SEC);

    osc.connect(gain);
    gain.connect(this.output(ctx));
    osc.start(now);
    osc.stop(now + SOUND_PARAMS.BUILD_DURATION_SEC);
  }

  public playAlert(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    SOUND_PARAMS.ALERT_NOTES.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * SOUND_PARAMS.ALERT_INTERVAL_SEC;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(SOUND_PARAMS.ALERT_GAIN, startTime);
      gain.gain.exponentialRampToValueAtTime(SOUND_PARAMS.GAIN_MIN, startTime + SOUND_PARAMS.ALERT_FADE_SEC);

      osc.connect(gain);
      gain.connect(this.output(ctx));
      osc.start(startTime);
      osc.stop(startTime + SOUND_PARAMS.ALERT_DURATION_SEC);
    });
  }
}

export const soundSystem = new SoundSystem();
