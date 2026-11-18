import test from 'node:test';
import assert from 'node:assert/strict';
import { GameMusic } from './music';

test('music follows day/night, mute, pause and user interaction retry', async () => {
  const original = globalThis.Audio;
  const tracks: FakeAudio[] = [];
  class FakeAudio {
    paused = true;
    loop = false;
    volume = 1;
    plays = 0;
    constructor(public src: string) { tracks.push(this); }
    play() { this.plays++; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
  try {
    const music = new GameMusic();
    music.sync('day', true, false);
    assert.match(tracks[0].src, /day-spooky-dungeon/);
    assert.equal(tracks[0].loop, true);
    assert.equal(tracks[0].volume, 0.18);
    music.sync('day', true, false);
    assert.equal(tracks.length, 1);
    music.sync('night', true, false);
    assert.equal(tracks[0].paused, true);
    assert.match(tracks[1].src, /night-hallow-quest/);
    music.sync('night', true, true);
    assert.equal(tracks[1].paused, true);
    music.retry();
    assert.equal(tracks[1].paused, true);
    music.sync('night', true, false);
    assert.equal(tracks[1].paused, false);
    music.sync('night', false, false);
    assert.equal(tracks[1].paused, true);
    music.stop();
  } finally {
    globalThis.Audio = original;
  }
});
