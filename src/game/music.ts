import type { DayNightPhase } from './types';

const TRACKS: Record<DayNightPhase, string> = {
  day: '/assets/music/day-spooky-dungeon.mp3',
  night: '/assets/music/night-hallow-quest.mp3',
};

/** Music follows the run phase; mute and non-playing screens pause playback. */
export class GameMusic {
  private audio: HTMLAudioElement | null = null;
  private phase: DayNightPhase | null = null;
  private enabled = false;

  sync(phase: DayNightPhase, playing: boolean, muted: boolean): void {
    this.enabled = playing && !muted;
    if (!this.enabled) {
      this.audio?.pause();
      return;
    }
    if (!this.audio || this.phase !== phase) {
      this.audio?.pause();
      this.audio = new Audio(TRACKS[phase]);
      this.audio.loop = true;
      this.audio.volume = 0.18;
      this.phase = phase;
    }
    this.retry();
  }

  /** Browsers may block autoplay until the first user interaction. */
  retry(): void {
    if (this.enabled && this.audio?.paused) {
      void this.audio.play().catch(() => {});
    }
  }

  stop(): void {
    this.enabled = false;
    this.audio?.pause();
    this.audio = null;
    this.phase = null;
  }
}
