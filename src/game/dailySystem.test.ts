import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAndApplyDailyReset,
  completeRunProgression,
  consumeTicketForRun,
  createDefaultDailyState,
  getUTCDateString,
  grantReviewTickets,
  recordTaskProgress,
} from './dailySystem';

test('daily state initializes with 3 tickets and 3 daily tasks for UTC date', () => {
  const t0 = Date.UTC(2026, 10, 16, 12, 0, 0);
  const state = createDefaultDailyState(t0);
  assert.equal(state.tickets, 3);
  assert.equal(state.tasks.length, 3);
  assert.equal(state.lastResetDateUTC, '2026-11-16');
});

test('consumeTicketForRun deducts 1 ticket per run and blocks at 0 tickets', () => {
  const t0 = Date.UTC(2026, 10, 16, 12, 0, 0);
  let state = createDefaultDailyState(t0);

  const r1 = consumeTicketForRun(state);
  assert.equal(r1.allowed, true);
  assert.equal(r1.updatedState.tickets, 2);
  state = r1.updatedState;

  state = consumeTicketForRun(state).updatedState;
  state = consumeTicketForRun(state).updatedState;
  assert.equal(state.tickets, 0);

  const r4 = consumeTicketForRun(state);
  assert.equal(r4.allowed, false);
  assert.equal(r4.updatedState.tickets, 0);
});

test('00:00 UTC daily reset refills tickets to 3 without carrying over unused tickets', () => {
  const day1 = Date.UTC(2026, 10, 16, 18, 0, 0);
  const day2 = Date.UTC(2026, 10, 17, 0, 5, 0); // 5 minutes past 00:00 UTC next day
  const state = createDefaultDailyState(day1);
  assert.equal(state.tickets, 3);

  // Even if player had 2 unused tickets left, reset caps at 3 (no carry-over)
  const afterOneRun = consumeTicketForRun(state).updatedState;
  assert.equal(afterOneRun.tickets, 2);

  const resetState = checkAndApplyDailyReset(afterOneRun, day2);
  assert.equal(resetState.tickets, 3);
  assert.equal(resetState.lastResetDateUTC, getUTCDateString(day2));
});

test('completing all 3 daily tasks awards bonus coins, XP, and +1 ticket tomorrow', () => {
  const day1 = Date.UTC(2026, 10, 16, 10, 0, 0);
  const day2 = Date.UTC(2026, 10, 17, 1, 0, 0);
  const state = createDefaultDailyState(day1);

  const { updatedState, allThreeJustCompleted } = recordTaskProgress(state, {
    woodCollectedDelta: 50,
    flaresUsedDelta: 10,
    buildingsBuiltDelta: 10,
    consecutiveNightsSurvived: 3,
    runScore: 1500,
  });

  assert.equal(allThreeJustCompleted, true);
  assert.equal(updatedState.allTasksBonusClaimed, true);
  assert.equal(updatedState.pendingBonusTicketsTomorrow, 1);

  // Next UTC day reset grants 3 base + 1 bonus ticket
  const nextDayState = checkAndApplyDailyReset(updatedState, day2);
  assert.equal(nextDayState.tickets, 4);
  assert.equal(nextDayState.pendingBonusTicketsTomorrow, 0);
});

test('streak increments +1 per consecutive UTC day played, resets if day missed, and unlocks 3-day milestone', () => {
  const d1 = Date.UTC(2026, 10, 16, 14, 0, 0);
  const d2 = Date.UTC(2026, 10, 17, 14, 0, 0);
  const d3 = Date.UTC(2026, 10, 18, 14, 0, 0);
  const d5 = Date.UTC(2026, 10, 20, 14, 0, 0); // Skipped Nov 19!

  let state = createDefaultDailyState(d1);
  state = completeRunProgression(state, {
    score: 900,
    victory: true,
    nightsSurvived: 3,
    nowMs: d1,
  }).updatedState;
  assert.equal(state.streak, 1);

  // Playing a second run on the same UTC day keeps streak at 1
  state = completeRunProgression(state, {
    score: 500,
    victory: false,
    nightsSurvived: 1,
    nowMs: d1 + 3600 * 1000,
  }).updatedState;
  assert.equal(state.streak, 1);

  // Day 2 consecutive
  state = checkAndApplyDailyReset(state, d2);
  state = completeRunProgression(state, {
    score: 850,
    victory: true,
    nightsSurvived: 3,
    nowMs: d2,
  }).updatedState;
  assert.equal(state.streak, 2);

  // Day 3 consecutive -> triggers 3-day milestone reward!
  state = checkAndApplyDailyReset(state, d3);
  const day3Result = completeRunProgression(state, {
    score: 1000,
    victory: true,
    nightsSurvived: 3,
    nowMs: d3,
  });
  state = day3Result.updatedState;
  assert.equal(state.streak, 3);
  assert.equal(state.claimedStreakMilestones.includes(3), true);
  assert.equal(state.unlockedTitles.includes('Tri-Night Survivor'), true);

  // Skip Day 4 -> reset on Day 5
  state = checkAndApplyDailyReset(state, d5);
  assert.equal(state.streak, 0);
});

test('grantReviewTickets adds playtest tickets even when tickets are at 0 or above daily cap', () => {
  const t0 = Date.UTC(2026, 10, 16, 12, 0, 0);
  let state = { ...createDefaultDailyState(t0), tickets: 0 };
  state = grantReviewTickets(state, 10);
  assert.equal(state.tickets, 10);
  state = grantReviewTickets(state, 15);
  assert.equal(state.tickets, 25);
});
