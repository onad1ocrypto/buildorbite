// Decode samples ahead of time so the first effect can start without network/decode delay.
type Effect = 'wood' | 'stone' | 'food' | 'build' | 'impact' | 'flare' | 'projectile' | 'projectileHit' | 'zombie' | 'victory' | 'defeat';
const files: Record<Effect, string> = {
  wood: 'wood.ogg', stone: 'stone.ogg', food: 'food-leaves.mp3', build: 'build.ogg',
  impact: 'impact.ogg', flare: 'flare-fireball.wav', projectile: 'projectile.wav', projectileHit: 'projectile-hit.wav', zombie: 'zombie-call.mp3', victory: 'victory.mp3', defeat: 'defeat.mp3',
};

export class SoundController {
  public muted = false;
  private ctx: AudioContext | null = null;
  private buffers = new Map<Effect, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private active = new Set<AudioBufferSourceNode>();
  private lastPlayed = new Map<Effect, number>();
  private outcomePlaying = false;

  constructor() { void this.prepare(); }

  /** Preload and decode on page load, before the first gameplay interaction. */
  public prepare(): Promise<void> {
    if (this.loading) return this.loading;
    if (typeof window === 'undefined') return Promise.resolve();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return Promise.resolve();
    try { this.ctx = new AudioCtx(); } catch { return Promise.resolve(); }
    const ctx = this.ctx;
    this.loading = Promise.all((Object.keys(files) as Effect[]).map(async (effect) => {
      try {
        const response = await fetch(`/assets/sfx/${files[effect]}`);
        if (!response.ok) return;
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(effect, buffer);
      } catch { /* A failed or unsupported sample must not break gameplay. */ }
    })).then(() => {});
    return this.loading;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.stopAll();
    return this.muted;
  }

  /** Resume the browser audio context in a user gesture. */
  public unlock(): void {
    void this.prepare();
    if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => {});
  }

  public stopAll(): void {
    const playing = [...this.active];
    this.active.clear();
    for (const source of playing) { try { source.stop(); } catch { /* already ended */ } }
    this.outcomePlaying = false;
    this.lastPlayed.clear();
  }

  private play(effect: Effect, volume: number, cooldown = 250): void {
    if (this.muted || this.outcomePlaying) return;
    const ctx = this.ctx;
    const buffer = this.buffers.get(effect);
    // Do not play a stale effect later if loading has not finished yet.
    if (!ctx || ctx.state !== 'running' || !buffer) return;
    const now = Date.now();
    if (now - (this.lastPlayed.get(effect) ?? 0) < cooldown || this.active.size >= 3) return;
    this.lastPlayed.set(effect, now);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    this.active.add(source);
    if (effect === 'victory' || effect === 'defeat') this.outcomePlaying = true;
    source.onended = () => {
      if (this.active.delete(source) && (effect === 'victory' || effect === 'defeat')) this.outcomePlaying = false;
      source.disconnect();
      gain.disconnect();
    };
    try { source.start(); } catch { this.active.delete(source); this.outcomePlaying = false; }
  }

  public playGatherHit(type: 'wood' | 'stone' | 'food'): void { this.play(type, 0.24, 400); }
  public playBuild(_isUpgrade = false): void { this.play('build', 0.3, 400); }
  public playAttackHit(heavy = false): void { this.play('impact', heavy ? 0.25 : 0.18, 300); }
  public playProjectile(): void { this.play('projectile', 0.32, 350); }
  public playProjectileHit(): void { this.play('projectileHit', 0.24, 350); }
  public playZombieSpawn(): void { this.play('zombie', 0.45, 7000); }
  public playBossEntrance(): void { this.play('zombie', 0.45, 7000); }
  public playNightHorn(): void { this.play('zombie', 0.4, 7000); }
  public playLanternFlare(): void { this.play('flare', 0.3, 700); }
  public playOutcome(victory: boolean): void {
    this.stopAll();
    this.play(victory ? 'victory' : 'defeat', 0.3, 0);
  }
}

export const soundFX = new SoundController();
