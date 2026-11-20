import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultDailyState, checkAndApplyDailyReset } from '../game/dailySystem';
import { mergeClientSaveFields } from './profileMerge';
import { buildStructureOnPad, createInitialPads, serializePadsForPersistence } from '../game/rules';

test('old-day fort snapshots cannot restore old buildings after UTC reset', () => {
  const yesterday = Date.UTC(2026, 10, 18, 23, 59);
  const today = Date.UTC(2026, 10, 19, 0, 1);
  const previous = createDefaultDailyState(yesterday);
  const pads = createInitialPads();
  pads[0] = buildStructureOnPad(pads[0], { wood: 500, stone: 500, food: 500, tickets: 3 }, 'watchtower', 'day').updatedPad;
  previous.savedPads = serializePadsForPersistence(pads);
  previous.savedResources = { wood: 400, stone: 400, food: 400 };
  const reset = checkAndApplyDailyReset(previous, today);
  const merged = mergeClientSaveFields(reset, previous, today);
  assert.deepEqual(merged.savedPads, reset.savedPads);
  assert.deepEqual(merged.savedResources, reset.savedResources);
  const newSnapshot = { ...previous, lastResetDateUTC: reset.lastResetDateUTC };
  const sameDay = mergeClientSaveFields(reset, newSnapshot, today);
  assert.equal(sameDay.savedPads[0].building?.type, 'watchtower');
  assert.equal(sameDay.savedResources.wood, 400);
});
