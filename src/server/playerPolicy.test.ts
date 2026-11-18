import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getServerTicketSnapshot,
  isValidRunId,
  sanitizeProgressEvent,
  sanitizeRunResult,
} from './playerPolicy';

test('server ticket snapshot clamps persisted values to the daily cap', () => {
  assert.deepEqual(getServerTicketSnapshot(undefined), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
  assert.deepEqual(getServerTicketSnapshot('2'), { ticketsUsedTodayUTC: 2, ticketsRemaining: 1 });
  assert.deepEqual(getServerTicketSnapshot(99), { ticketsUsedTodayUTC: 3, ticketsRemaining: 0 });
  assert.deepEqual(getServerTicketSnapshot(-5), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
  assert.deepEqual(getServerTicketSnapshot('corrupt'), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
});

test('run IDs have bounded safe characters for Redis keys', () => {
  assert.equal(isValidRunId('run_12345678'), true);
  assert.equal(isValidRunId('short'), false);
  assert.equal(isValidRunId('invalid:123456'), false);
  assert.equal(isValidRunId('x'.repeat(81)), false);
});

test('game progress events accept only bounded, positive gameplay deltas', () => {
  assert.deepEqual(sanitizeProgressEvent({ woodCollectedDelta: 5000 }), {
    woodCollectedDelta: 1000,
    flaresUsedDelta: undefined,
    buildingsBuiltDelta: undefined,
    consecutiveNightsSurvived: undefined,
    runScore: undefined,
    zombiesDefeatedDelta: undefined,
  });
  assert.equal(sanitizeProgressEvent({ xp: 1000000 }), null);
  assert.equal(sanitizeProgressEvent({ flaresUsedDelta: '999' }), null);
  assert.equal(sanitizeProgressEvent({ buildingsBuiltDelta: -1 }), null);
});

test('run rewards are bounded and a victory requires surviving every night', () => {
  assert.deepEqual(sanitizeRunResult({ score: 999999, victory: true, nightsSurvived: 3 }), {
    score: 8000,
    victory: true,
    nightsSurvived: 3,
  });
  assert.deepEqual(sanitizeRunResult({ score: 20, victory: true, nightsSurvived: 2 }), {
    score: 20,
    victory: false,
    nightsSurvived: 2,
  });
  assert.deepEqual(sanitizeRunResult({ score: 20, victory: true, nightsSurvived: 3, endedEarly: true }), {
    score: 20,
    victory: false,
    nightsSurvived: 2,
  });
  assert.equal(sanitizeRunResult({ score: Number.NaN, victory: false, nightsSurvived: 0 }), null);
});
