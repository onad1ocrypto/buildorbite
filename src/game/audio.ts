// Procedural Web Audio synthesizer for Build or Bite

export class SoundController {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Unlock Web Audio on a real pointer/key gesture, especially on mobile. */
  public unlock(): void {
    this.ensureContext();
  }

  public playGatherHit(resourceType: 'wood' | 'stone' | 'food') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pitchJitter = 0.94 + Math.random() * 0.12;
    const duration = resourceType === 'stone' ? 0.1 : 0.19;

    if (resourceType === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.13);
    } else if (resourceType === 'stone') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(420 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.15);
    }
    gain.gain.setValueAtTime(resourceType === 'stone' ? 0.14 : 0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // A short filtered transient makes chopping and harvesting distinct and audible
    // on phone speakers, without changing the existing stone impact.
    if (resourceType !== 'stone') {
      const length = Math.ceil(ctx.sampleRate * 0.13);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1);
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      source.buffer = buffer;
      filter.type = resourceType === 'wood' ? 'lowpass' : 'bandpass';
      filter.frequency.value = resourceType === 'wood' ? 1200 : 2200;
      noiseGain.gain.setValueAtTime(resourceType === 'wood' ? 0.18 : 0.13, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      source.start(now);
      source.stop(now + 0.13);
    }
  }

  public playBuild(isUpgrade = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = isUpgrade ? [261.6, 329.6, 392.0, 523.2] : [196.0, 246.9, 293.7];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.15);
    });
  }

  public playLanternFlare() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.46);
    osc2.stop(now + 0.46);
  }

  public playAttackHit(heavy = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 0.92 + Math.random() * 0.16;

    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime((heavy ? 140 : 230) * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 42 : 75, now + (heavy ? 0.14 : 0.08));

    gain.gain.setValueAtTime(heavy ? 0.2 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.15 : 0.09));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (heavy ? 0.15 : 0.09));
  }

  public playNightHorn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [146.8, 138.6, 110.0];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.14);
      gain.gain.setValueAtTime(0.14, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.29);
    });
  }

  public playBossEntrance() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [98.0, 116.5, 146.8, 185.0]; // Dramatic diminished/minor organ chord
    chord.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.76);
    });
  }

  public playOutcome(victory: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const seq = victory
      ? [261.6, 329.6, 392.0, 523.25]
      : [246.9, 220.0, 196.0, 146.8];
    seq.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.11);
      gain.gain.setValueAtTime(0.16, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.3);
    });
  }
}

export const soundFX = new SoundController();
