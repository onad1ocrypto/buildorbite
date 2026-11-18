import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundController } from './audio';

test('preloads samples; playback is immediate, bounded, and mute stops active sounds', async () => {
  const oldWindow = globalThis.window;
  const oldFetch = globalThis.fetch;
  const fetched: string[] = [];
  const sources: FakeSource[] = [];
  class FakeSource {
    buffer: unknown;
    onended: (() => void) | null = null;
    started = false;
    stopped = false;
    connect() {}
    disconnect() {}
    start() { this.started = true; }
    stop() { this.stopped = true; this.onended?.(); }
  }
  class FakeContext {
    state = 'running';
    destination = {};
    resume() { return Promise.resolve(); }
    decodeAudioData(data: ArrayBuffer) { return Promise.resolve({ id: new TextDecoder().decode(data) }); }
    createBufferSource() { const source = new FakeSource(); sources.push(source); return source; }
    createGain() { return { gain: { value: 0 }, connect() {}, disconnect() {} }; }
  }
  globalThis.window = { AudioContext: FakeContext } as unknown as Window & typeof globalThis;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input); fetched.push(url);
    return { ok: true, arrayBuffer: async () => new TextEncoder().encode(url).buffer } as Response;
  }) as typeof fetch;
  try {
    const s = new SoundController();
    // No delayed playback is queued before the samples are ready.
    s.playGatherHit('stone');
    assert.equal(sources.length, 0);
    await s.prepare();
    assert.ok(fetched.some((url) => url.endsWith('/stone.ogg')));
    assert.ok(fetched.some((url) => url.endsWith('/food-leaves.mp3')));
    assert.ok(fetched.some((url) => url.endsWith('/flare-fireball.wav')));
    s.unlock();
    s.playGatherHit('stone');
    assert.equal(sources.length, 1);
    assert.equal(sources[0].started, true);
    assert.match((sources[0].buffer as { id: string }).id, /stone.ogg/);
    s.playGatherHit('stone');
    s.playProjectile();
    s.playProjectileHit();
    s.playZombieSpawn();
    assert.equal(sources.length, 3);
    s.playOutcome(true);
    assert.ok(sources.slice(0, 3).every((source) => source.stopped));
    assert.match((sources[3].buffer as { id: string }).id, /victory.mp3/);
    s.playAttackHit();
    assert.equal(sources.length, 4);
    s.toggleMute();
    assert.equal(sources[3].stopped, true);
    s.playGatherHit('food');
    assert.equal(sources.length, 4);
    s.toggleMute();
    s.playGatherHit('food');
    assert.match((sources[4].buffer as { id: string }).id, /food-leaves.mp3/);
    s.stopAll();
    s.playLanternFlare();
    assert.match((sources[5].buffer as { id: string }).id, /flare-fireball.wav/);
  } finally { globalThis.window = oldWindow; globalThis.fetch = oldFetch; }
});
