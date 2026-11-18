import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundController } from './audio';

test('wood, food and stone harvesting trigger audible effects; mute suppresses them', () => {
  const originalWindow = globalThis.window;
  let starts = 0;
  const frequencies: number[] = [];
  const param = { value: 0, setValueAtTime: (n: number) => { frequencies.push(n); }, exponentialRampToValueAtTime: () => {} };
  class FakeAudioContext {
    currentTime = 0;
    sampleRate = 44100;
    state = 'running';
    destination = {};
    resume() { return Promise.resolve(); }
    createOscillator() { return { type: '', frequency: param, connect: () => {}, start: () => { starts++; }, stop: () => {} }; }
    createGain() { return { gain: param, connect: () => {} }; }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { buffer: null, connect: () => {}, start: () => { starts++; }, stop: () => {} }; }
    createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect: () => {} }; }
  }
  globalThis.window = { AudioContext: FakeAudioContext } as unknown as Window & typeof globalThis;
  try {
    const audio = new SoundController();
    audio.unlock();
    audio.playGatherHit('wood');
    assert.equal(starts, 2);
    audio.playGatherHit('food');
    assert.equal(starts, 4);
    audio.playGatherHit('stone');
    assert.equal(starts, 5);
    assert.ok(frequencies.some((value) => value >= 480 && value <= 590));
    audio.toggleMute();
    audio.playGatherHit('wood');
    audio.playGatherHit('food');
    assert.equal(starts, 5);
  } finally {
    globalThis.window = originalWindow;
  }
});
