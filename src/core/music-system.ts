/**
 * Arquivo: src/core/music-system.ts
 *
 * 1. O que este arquivo faz?
 * Sintetizador polifônico de música ambiente relaxante estilo Bossa Lounge / Elevador Hospitalar (~72 BPM)
 * utilizando 100% Web Audio API nativo (sem MP3s externos), com piano elétrico Rhodes suave filtrado em 900 Hz,
 * contrabaixo aveludado, ritmo sutil de vassourinha, audio ducking de 50% em modais clínicos e persistência de volume.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 4 do Prompt 15, oferecendo uma atmosfera auditiva acolhedora, humana e relaxante que reduz o estresse
 * da simulação sem poluir a memória do navegador ou inflar o bundle (< 5 MB).
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para mudar a harmonia ou andamento, ajuste CHORD_PROGRESSION e BPM. Para testar sem interação do usuário, chame start()
 * após clique na interface (devido às políticas de autoplay do navegador).
 *
 * Importa: src/core/event-bus.ts
 * Conecta-se com: src/main.ts, src/ui/hud.ts, src/ui/settings-modal.ts
 */

import { globalBus } from './event-bus';

const MUSIC_MUTE_KEY = 'mediville_music_muted';
const MUSIC_VOL_KEY = 'mediville_music_volume';

const BPM = 72;
const SECONDS_IN_MINUTE = 60;
const SECONDS_PER_BEAT = SECONDS_IN_MINUTE / BPM;
const BEATS_PER_CHORD = 4;
const DEFAULT_GAIN = 0.08;
const DUCKING_FACTOR = 0.5;
const DEFAULT_VOLUME = 0.8;
const MIN_GAIN = 0.0001;
const FADE_RAMP_SEC = 0.15;
const LOWPASS_FILTER_HZ = 900;
const EVEN_DIVISOR = 2;
const RHODES_GAIN = 0.05;
const RHODES_ATTACK_SEC = 0.05;
const RHODES_PADDING_SEC = 0.1;
const BASS_GAIN = 0.07;
const BASS_ATTACK_SEC = 0.04;
const BASS_DURATION_FACTOR = 0.9;
const BRUSH_FILTER_HZ = 3200;
const BRUSH_Q = 1.8;
const BRUSH_BASE_HZ = 120;
const BRUSH_GAIN = 0.012;
const BRUSH_ATTACK_SEC = 0.01;
const BRUSH_DECAY_SEC = 0.06;
const BRUSH_DURATION_SEC = 0.07;

// Notas musicais (Hz)
const NOTE_C2 = 65.41;
const NOTE_D2 = 73.42;
const NOTE_E2 = 82.41;
const NOTE_F2 = 87.31;
const NOTE_G2 = 98.0;
const NOTE_A2 = 110.0;
const NOTE_C3 = 130.81;
const NOTE_D3 = 146.83;
const NOTE_E3 = 164.81;
const NOTE_F3 = 174.61;
const NOTE_G3 = 196.0;
const NOTE_A3 = 220.0;
const NOTE_B3 = 246.94;
const NOTE_C4 = 261.63;
const NOTE_D4 = 293.66;
const NOTE_E4 = 329.63;
const NOTE_G4 = 392.0;

interface ChordDef {
  bassHz: number;
  rhodesHz: number[];
}

const CHORDS: ChordDef[] = [
  // Fmaj7
  { bassHz: NOTE_F2, rhodesHz: [NOTE_F3, NOTE_A3, NOTE_C4, NOTE_E4] },
  // Em7
  { bassHz: NOTE_E2, rhodesHz: [NOTE_E3, NOTE_G3, NOTE_B3, NOTE_D4] },
  // Dm9
  { bassHz: NOTE_D2, rhodesHz: [NOTE_D3, NOTE_F3, NOTE_A3, NOTE_C4, NOTE_E4] },
  // G13
  { bassHz: NOTE_G2, rhodesHz: [NOTE_F3, NOTE_B3, NOTE_E4, NOTE_G4] },
  // Cmaj9
  { bassHz: NOTE_C2, rhodesHz: [NOTE_C3, NOTE_E3, NOTE_G3, NOTE_B3, NOTE_D4] },
  // Am7
  { bassHz: NOTE_A2, rhodesHz: [NOTE_C3, NOTE_E3, NOTE_G3, NOTE_B3] },
];

export class MusicSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private volume = DEFAULT_VOLUME;
  private isDucking = false;
  private isPlaying = false;
  private timerId: number | null = null;
  private currentChordIndex = 0;

  constructor() {
    this.loadSettings();
    this.setupListeners();
  }

  private loadSettings(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      this.muted = localStorage.getItem(MUSIC_MUTE_KEY) === 'true';
      const savedVol = localStorage.getItem(MUSIC_VOL_KEY);
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch {
      // Modo headless
    }
  }

  private setupListeners(): void {
    globalBus.on('music:ducking_changed', ({ isDucking }) => {
      this.setDucking(isDucking);
    });
    globalBus.on('game:over', () => {
      this.stop();
    });
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.updateMasterVolume();
    return this.ctx;
  }

  private updateMasterVolume(): void {
    if (!this.masterGain || !this.ctx) return;
    const factor = this.isDucking ? DUCKING_FACTOR : 1.0;
    const targetGain = this.muted ? MIN_GAIN : DEFAULT_GAIN * this.volume * factor;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + FADE_RAMP_SEC);
  }

  public setDucking(active: boolean): void {
    this.isDucking = active;
    this.updateMasterVolume();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(MUSIC_VOL_KEY, this.volume.toString());
    } catch {
      // Ignora erro de storage
    }
    this.updateMasterVolume();
  }

  public getVolume(): number {
    return this.volume;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUSIC_MUTE_KEY, this.muted ? 'true' : 'false');
    } catch {
      // Modo headless
    }
    this.updateMasterVolume();
    globalBus.emit('music:mute_changed', { muted: this.muted });
    return this.muted;
  }

  public start(): void {
    if (this.isPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.scheduleLoop();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleLoop(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const chord = CHORDS[this.currentChordIndex % CHORDS.length]!;
    this.currentChordIndex++;

    this.playChord(chord);

    const stepMs = SECONDS_PER_BEAT * BEATS_PER_CHORD * 1000;
    this.timerId = window.setTimeout(() => this.scheduleLoop(), stepMs);
  }

  private playChord(chord: ChordDef): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const chordDuration = SECONDS_PER_BEAT * BEATS_PER_CHORD;

    this.playRhodesVoice(chord.rhodesHz, now, chordDuration);
    this.playBassNote(chord.bassHz, now, chordDuration);
    this.playBrushChiff(now);
  }

  private playRhodesVoice(notes: number[], now: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(LOWPASS_FILTER_HZ, now);
    lpf.connect(this.masterGain);

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx % EVEN_DIVISOR === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(MIN_GAIN, now);
      gain.gain.linearRampToValueAtTime(RHODES_GAIN, now + RHODES_ATTACK_SEC);
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + duration);

      osc.connect(gain);
      gain.connect(lpf);

      osc.start(now);
      osc.stop(now + duration + RHODES_PADDING_SEC);
    });
  }

  private playBassNote(freq: number, now: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(MIN_GAIN, now);
    gain.gain.linearRampToValueAtTime(BASS_GAIN, now + BASS_ATTACK_SEC);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + duration * BASS_DURATION_FACTOR);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playBrushChiff(now: number): void {
    if (!this.ctx || !this.masterGain) return;

    for (let beat = 0; beat < BEATS_PER_CHORD; beat++) {
      const beatTime = now + beat * SECONDS_PER_BEAT;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(BRUSH_FILTER_HZ, beatTime);
      filter.Q.setValueAtTime(BRUSH_Q, beatTime);

      osc.type = 'square';
      osc.frequency.setValueAtTime(BRUSH_BASE_HZ, beatTime);

      gain.gain.setValueAtTime(MIN_GAIN, beatTime);
      gain.gain.linearRampToValueAtTime(BRUSH_GAIN, beatTime + BRUSH_ATTACK_SEC);
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, beatTime + BRUSH_DECAY_SEC);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(beatTime);
      osc.stop(beatTime + BRUSH_DURATION_SEC);
    }
  }
}

export const musicSystem = new MusicSystem();
