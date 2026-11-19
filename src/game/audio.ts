import type { EmoteId } from './emotes';
import { HEROES } from './heroes';
import type { HeroId } from './types';
import {
  type VoiceLineContext,
  type VoiceLineEvent,
  pickHeroVoiceLine,
} from './voiceLines';

export interface FanfareNoteSpec {
  delaySec: number;
  freqStart: number;
  freqEnd: number;
  durationSec: number;
  type: OscillatorType;
  volume: number;
}

export const VICTORY_FANFARE_NOTES: readonly FanfareNoteSpec[] = [
  // Opening triumphant heroic arpeggio (A major) + warm fifth underlay
  { delaySec: 0, freqStart: 110, freqEnd: 78, durationSec: 0.22, type: 'triangle', volume: 0.16 },
  { delaySec: 0, freqStart: 329.63, freqEnd: 332, durationSec: 0.16, type: 'triangle', volume: 0.08 },
  { delaySec: 0, freqStart: 440, freqEnd: 444, durationSec: 0.16, type: 'sawtooth', volume: 0.085 },
  { delaySec: 0.11, freqStart: 554.37, freqEnd: 558, durationSec: 0.16, type: 'sawtooth', volume: 0.09 },
  { delaySec: 0.22, freqStart: 659.25, freqEnd: 664, durationSec: 0.18, type: 'sawtooth', volume: 0.095 },
  // Heroic peak hit + octave bass impact
  { delaySec: 0.36, freqStart: 110, freqEnd: 55, durationSec: 0.42, type: 'triangle', volume: 0.18 },
  { delaySec: 0.36, freqStart: 440, freqEnd: 442, durationSec: 0.48, type: 'triangle', volume: 0.1 },
  { delaySec: 0.36, freqStart: 880, freqEnd: 886, durationSec: 0.56, type: 'sawtooth', volume: 0.11 },
  // Shimmering championship chord tail
  { delaySec: 0.52, freqStart: 1108.73, freqEnd: 1114, durationSec: 0.62, type: 'triangle', volume: 0.085 },
  { delaySec: 0.56, freqStart: 1318.51, freqEnd: 1326, durationSec: 0.68, type: 'sine', volume: 0.09 },
  { delaySec: 0.62, freqStart: 1760, freqEnd: 1772, durationSec: 0.72, type: 'sine', volume: 0.065 },
];

const KILL_VOICE_COOLDOWN_MS = 1800;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private victoryPlayedInCurrentMatch = false;
  private victoryTriggerCount = 0;
  private voiceLineListeners = new Set<(event: VoiceLineEvent) => void>();
  private voiceLineSeq = 1;
  private voiceLineTriggerCount = 0;
  private lastVoiceLine: VoiceLineEvent | null = null;
  private lastKillVoiceAtMs = 0;

  private activeVoiceToken = 0;
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeVoiceElement: HTMLAudioElement | null = null;
  private voiceRawCache = new Map<string, ArrayBuffer>();
  private voiceInFlightCache = new Map<string, Promise<ArrayBuffer | null>>();

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private stopActiveVoicePlayback() {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // Ignore already-stopped AudioBufferSourceNode
      }
      this.activeVoiceSource = null;
    }
    if (this.activeVoiceElement) {
      try {
        this.activeVoiceElement.pause();
        this.activeVoiceElement.currentTime = 0;
      } catch {
        // Ignore HTMLAudioElement pause errors
      }
      this.activeVoiceElement = null;
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.activeVoiceToken += 1;
      this.stopActiveVoicePlayback();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public resetVictoryCooldown() {
    this.victoryPlayedInCurrentMatch = false;
  }

  public getVictoryTriggerCount(): number {
    return this.victoryTriggerCount;
  }

  public subscribeVoiceLine(listener: (event: VoiceLineEvent) => void): () => void {
    this.voiceLineListeners.add(listener);
    return () => {
      this.voiceLineListeners.delete(listener);
    };
  }

  public getLastVoiceLine(): VoiceLineEvent | null {
    return this.lastVoiceLine;
  }

  public getVoiceLineTriggerCount(): number {
    return this.voiceLineTriggerCount;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    pitchVariance = 0.08,
    delaySec = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const jitter = pitchVariance > 0 ? 1 + (Math.random() * 2 - 1) * pitchVariance : 1;
    const startAt = ctx.currentTime + Math.max(0, delaySec);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart * jitter), startAt);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd * jitter), startAt + duration);

    const attack = Math.min(0.015, duration * 0.25);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.01);
  }

  private async fetchVoiceAudioBytes(
    heroId: HeroId,
    context: VoiceLineContext,
    text: string
  ): Promise<ArrayBuffer | null> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return null;

    const key = `${heroId}::${text}`;
    const cached = this.voiceRawCache.get(key);
    if (cached) return cached;

    const pending = this.voiceInFlightCache.get(key);
    if (pending) return pending;

    const requestPromise = (async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heroId, context, text }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.warn(`[ElevenLabs TTS] HTTP ${res.status}: ${detail.slice(0, 180)}`);
          return null;
        }
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) return null;
        this.voiceRawCache.set(key, buf);
        return buf;
      } catch (err) {
        console.warn('[ElevenLabs TTS] Falha na requisição de áudio:', err);
        return null;
      } finally {
        this.voiceInFlightCache.delete(key);
      }
    })();

    this.voiceInFlightCache.set(key, requestPromise);
    return requestPromise;
  }

  private async playElevenLabsVoice(event: VoiceLineEvent, token: number) {
    const rawBytes = await this.fetchVoiceAudioBytes(event.heroId, event.context, event.text);
    if (!rawBytes || this.muted || this.activeVoiceToken !== token) return;

    const ctx = this.ensureContext();
    if (ctx && typeof ctx.decodeAudioData === 'function') {
      try {
        const decoded = await ctx.decodeAudioData(rawBytes.slice(0));
        if (this.muted || this.activeVoiceToken !== token) return;

        this.stopActiveVoicePlayback();
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0.95;

        source.buffer = decoded;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.onended = () => {
          if (this.activeVoiceSource === source) {
            this.activeVoiceSource = null;
          }
        };
        this.activeVoiceSource = source;
        source.start(0);
        return;
      } catch {
        // Fallback to HTMLAudioElement if Web Audio decoding fails
      }
    }

    if (typeof Audio === 'undefined' || typeof URL === 'undefined') return;
    try {
      const blobUrl = URL.createObjectURL(new Blob([rawBytes], { type: 'audio/mpeg' }));
      if (this.muted || this.activeVoiceToken !== token) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      this.stopActiveVoicePlayback();
      const audioEl = new Audio(blobUrl);
      audioEl.volume = 0.92;
      const cleanupUrl = () => {
        URL.revokeObjectURL(blobUrl);
        if (this.activeVoiceElement === audioEl) {
          this.activeVoiceElement = null;
        }
      };
      audioEl.onended = cleanupUrl;
      audioEl.onerror = cleanupUrl;
      this.activeVoiceElement = audioEl;
      await audioEl.play().catch(cleanupUrl);
    } catch {
      // Ignore browser autoplay rejection outside user gesture
    }
  }

  public playVoiceLine(heroId: HeroId, context: VoiceLineContext): VoiceLineEvent | null {
    if (this.muted) return null;

    const nowMs = Date.now();
    if (context === 'kill' && nowMs - this.lastKillVoiceAtMs < KILL_VOICE_COOLDOWN_MS) {
      return null;
    }

    const previousText =
      this.lastVoiceLine &&
      this.lastVoiceLine.heroId === heroId &&
      this.lastVoiceLine.context === context
        ? this.lastVoiceLine.text
        : null;
    const text = pickHeroVoiceLine(heroId, context, previousText);
    const heroName = HEROES[heroId]?.name ?? heroId;

    const event: VoiceLineEvent = {
      id: this.voiceLineSeq++,
      heroId,
      heroName,
      context,
      text,
      timestampMs: nowMs,
    };

    if (context === 'kill') {
      this.lastKillVoiceAtMs = nowMs;
    }
    this.lastVoiceLine = event;
    this.voiceLineTriggerCount += 1;
    this.activeVoiceToken = event.id;
    this.stopActiveVoicePlayback();

    if (typeof window !== 'undefined') {
      void this.playElevenLabsVoice(event, event.id);
    }

    for (const listener of this.voiceLineListeners) {
      try {
        listener(event);
      } catch {
        // Isolate subscriber errors from audio playback
      }
    }

    return event;
  }

  public playShoot(weight: 'light' | 'heavy' = 'light') {
    if (weight === 'heavy') {
      this.playTone(210, 75, 0.14, 'sawtooth', 0.11);
    } else {
      this.playTone(520, 190, 0.08, 'triangle', 0.07);
    }
  }

  public playComboShoot(stage: 2 | 3, weight: 'light' | 'heavy' = 'light') {
    if (stage === 2) {
      if (weight === 'heavy') {
        this.playTone(250, 95, 0.15, 'sawtooth', 0.13);
      } else {
        this.playTone(620, 260, 0.09, 'triangle', 0.09);
      }
      this.playTone(480, 760, 0.08, 'sine', 0.06);
      return;
    }

    // Stage 3 Finisher: punchy double-layered power chime
    if (weight === 'heavy') {
      this.playTone(190, 58, 0.22, 'sawtooth', 0.16);
    } else {
      this.playTone(720, 210, 0.13, 'sawtooth', 0.11);
    }
    this.playTone(580, 1140, 0.14, 'triangle', 0.1);
  }

  public playHit(heavy = false) {
    if (heavy) {
      this.playTone(160, 55, 0.12, 'square', 0.11);
    } else {
      this.playTone(300, 130, 0.06, 'triangle', 0.06);
    }
  }

  public playSkill() {
    this.playTone(320, 740, 0.16, 'sine', 0.1);
  }

  public playFury() {
    this.playTone(240, 880, 0.25, 'sawtooth', 0.13);
    this.playTone(440, 1020, 0.22, 'triangle', 0.1, 0.04, 0.07);
  }

  public playPickup() {
    this.playTone(540, 920, 0.11, 'sine', 0.09);
  }

  public playCrateBreak() {
    this.playTone(190, 65, 0.18, 'sawtooth', 0.11);
  }

  public playKill() {
    this.playTone(380, 760, 0.14, 'triangle', 0.12);
    this.playTone(620, 1080, 0.16, 'sine', 0.11, 0.05, 0.08);
  }

  public playKillStreak(streakCount: number) {
    const base = streakCount >= 5 ? 587 : streakCount === 4 ? 523 : streakCount === 3 ? 494 : 440;
    const intervals = streakCount >= 5 ? [1, 1.25, 1.5, 2] : [1, 1.25, 1.5];
    intervals.forEach((mult, idx) => {
      const freq = base * mult;
      this.playTone(
        freq,
        freq * 1.04,
        0.18,
        idx === intervals.length - 1 ? 'triangle' : 'sine',
        0.12,
        0.02,
        idx * 0.075
      );
    });
  }

  public playVictory(): boolean {
    if (this.victoryPlayedInCurrentMatch || this.muted) return false;
    this.victoryPlayedInCurrentMatch = true;
    this.victoryTriggerCount += 1;
    for (const note of VICTORY_FANFARE_NOTES) {
      this.playTone(
        note.freqStart,
        note.freqEnd,
        note.durationSec,
        note.type,
        note.volume,
        0,
        note.delaySec
      );
    }
    return true;
  }

  public playDefeat() {
    const notes = [330, 277, 220, 165];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 0.94, 0.26, 'sawtooth', 0.09, 0.01, idx * 0.11);
    });
  }

  public playQuestClaim() {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(
        n,
        n * 1.03,
        0.16,
        idx === notes.length - 1 ? 'triangle' : 'sine',
        0.1,
        0.02,
        idx * 0.055
      );
    });
  }

  public playLevelUp() {
    if (this.muted) return;
    const notes = [
      { delay: 0, freq: 523.25, dur: 0.14, type: 'triangle' as OscillatorType, vol: 0.1 },
      { delay: 0.08, freq: 659.25, dur: 0.15, type: 'triangle' as OscillatorType, vol: 0.11 },
      { delay: 0.16, freq: 783.99, dur: 0.16, type: 'triangle' as OscillatorType, vol: 0.12 },
      { delay: 0.25, freq: 1046.5, dur: 0.34, type: 'sine' as OscillatorType, vol: 0.14 },
      { delay: 0.34, freq: 1318.51, dur: 0.38, type: 'sine' as OscillatorType, vol: 0.11 },
      { delay: 0.42, freq: 1567.98, dur: 0.44, type: 'sine' as OscillatorType, vol: 0.09 },
    ];
    for (const note of notes) {
      this.playTone(note.freq, note.freq * 1.015, note.dur, note.type, note.vol, 0, note.delay);
    }
  }

  public playEmote(emoteId: EmoteId) {
    switch (emoteId) {
      case 'gg':
        this.playTone(523.25, 587.33, 0.1, 'triangle', 0.09, 0.02, 0);
        this.playTone(659.25, 783.99, 0.14, 'triangle', 0.1, 0.02, 0.075);
        this.playTone(1046.5, 1080, 0.18, 'sine', 0.09, 0.02, 0.15);
        break;
      case 'smile':
        this.playTone(493.88, 659.25, 0.11, 'sine', 0.09, 0.03, 0);
        this.playTone(659.25, 880, 0.14, 'triangle', 0.09, 0.03, 0.08);
        break;
      case 'nice':
        this.playTone(587.33, 880, 0.12, 'triangle', 0.09, 0.03, 0);
        this.playTone(880, 1174.66, 0.15, 'sine', 0.08, 0.02, 0.085);
        break;
      case 'angry':
        this.playTone(220, 145, 0.12, 'sawtooth', 0.085, 0.03, 0);
        this.playTone(175, 115, 0.16, 'square', 0.065, 0.02, 0.09);
        break;
      case 'oops':
        this.playTone(620, 340, 0.13, 'triangle', 0.085, 0.03, 0);
        this.playTone(410, 260, 0.14, 'sine', 0.08, 0.02, 0.11);
        break;
      case 'taunt':
        this.playTone(392, 523.25, 0.09, 'sawtooth', 0.08, 0.03, 0);
        this.playTone(523.25, 698.46, 0.13, 'triangle', 0.09, 0.02, 0.08);
        break;
    }
  }
}

export const soundEngine = new SoundEngine();
