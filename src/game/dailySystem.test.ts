import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAndApplyDailyReset,
  claimDailyCheckIn,
  completeRunProgression,
  consumeTicketForRun,
  createDefaultDailyState,
  CURRENT_DAILY_SCHEMA_VERSION,
  DAILY_CHECKIN_REWARD,
  getUTCDateString,
  grantReviewTickets,
  isDevelopmentTestMode,
  shouldConsumeTicketForStart,
  shouldLockDailyProgression,
  migrateDailyState,
  recordTaskProgress,
  saveFortAndResourcesToDailyState,
} from './dailySystem';
import {
  buildOrUpgradeFenceSegment,
  buildStructureOnPad,
  createInitialFenceSegments,
  createInitialPads,
  restoreFenceSegmentsFromPersistence,
  restorePadsFromPersistence,
  upgradeStructureOnPad,
} from './rules';

test('developer test mode requires both a development build and the explicit devTest query flag', () => {
  assert.equal(isDevelopmentTestMode(true, '?devTest=1'), true);
  assert.equal(isDevelopmentTestMode(true, '?devTest=0'), false);
  assert.equal(isDevelopmentTestMode(true, ''), false);
  assert.equal(isDevelopmentTestMode(false, '?devTest=1'), false);
});

test('developer QA mode bypasses only the daily lock and never spends tickets; production rules remain unchanged', () => {
  assert.equal(shouldLockDailyProgression(true, false), true);
  assert.equal(shouldLockDailyProgression(true, true), false);
  assert.equal(shouldLockDailyProgression(false, true), false);
  assert.equal(shouldConsumeTicketForStart(false, false), true);
  assert.equal(shouldConsumeTicketForStart(false, true), false);
  assert.equal(shouldConsumeTicketForStart(true, true), false);
});

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

test('completing all 3 daily tasks awards bonus coins, XP, +1 ticket tomorrow, and locks daily progression until 00:00 UTC reset', () => {
  const day1 = Date.UTC(2026, 10, 16, 10, 0, 0);
  const day2 = Date.UTC(2026, 10, 17, 1, 0, 0);
  const state = createDefaultDailyState(day1);
  assert.equal(state.dailyProgressionLocked, false);

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
  assert.equal(updatedState.dailyProgressionLocked, true);

  // Next UTC day reset grants 3 base + 1 bonus ticket and unlocks daily progression
  const nextDayState = checkAndApplyDailyReset(updatedState, day2);
  assert.equal(nextDayState.tickets, 4);
  assert.equal(nextDayState.pendingBonusTicketsTomorrow, 0);
  assert.equal(nextDayState.dailyProgressionLocked, false);
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

test('Persistent fort and resource wallet remain intact across boss victory, daily task lock, and 00:00 UTC reset', () => {
  const day1 = Date.UTC(2026, 10, 16, 15, 0, 0);
  const day2 = Date.UTC(2026, 10, 17, 0, 30, 0);
  let state = createDefaultDailyState(day1);

  const pads = createInitialPads();
  const fences = createInitialFenceSegments();
  const initialRes = { wood: 180, stone: 120, food: 95, tickets: 3 };

  // Build Watchtower on P1 and upgrade to Path B, and build a fence segment
  const b1 = buildStructureOnPad(pads[0], initialRes, 'watchtower', 'day');
  const u1 = upgradeStructureOnPad(b1.updatedPad, b1.updatedResources, 'pathB', 'day');
  pads[0] = u1.updatedPad;
  const f1 = buildOrUpgradeFenceSegment(fences.find((f) => f.level === 0)!, u1.updatedResources, 'day');
  fences[f1.updatedSegment.id - 1] = f1.updatedSegment;

  // Save fort and wallet during run
  state = saveFortAndResourcesToDailyState(state, pads, fences, f1.updatedResources);

  // Complete boss victory run + all 3 daily tasks
  state = recordTaskProgress(state, {
    woodCollectedDelta: 100,
    flaresUsedDelta: 10,
    buildingsBuiltDelta: 10,
    consecutiveNightsSurvived: 3,
    runScore: 2200,
  }).updatedState;
  assert.equal(state.dailyProgressionLocked, true);

  state = completeRunProgression(state, {
    score: 2200,
    victory: true,
    nightsSurvived: 3,
    nowMs: day1,
  }).updatedState;

  // Verify fort and resources were NOT wiped by boss victory or daily lock
  assert.equal(state.savedPads[0].building?.type, 'watchtower');
  assert.equal(state.savedPads[0].building?.upgradePath, 'pathB');
  assert.equal(state.savedPads[0].building?.level, 2);
  assert.equal(state.savedResources.wood, f1.updatedResources.wood);
  assert.equal(state.savedFenceSegments[f1.updatedSegment.id - 1].level, 1);

  // Advance across 00:00 UTC reset -> fort and wallet still persist and restore to full maxHp
  const nextDayState = checkAndApplyDailyReset(state, day2);
  assert.equal(nextDayState.dailyProgressionLocked, false);
  assert.equal(nextDayState.savedPads[0].building?.type, 'watchtower');
  assert.equal(nextDayState.savedPads[0].building?.upgradePath, 'pathB');
  assert.equal(nextDayState.savedResources.wood, f1.updatedResources.wood);

  const restoredPads = restorePadsFromPersistence(nextDayState.savedPads, true);
  const restoredFences = restoreFenceSegmentsFromPersistence(nextDayState.savedFenceSegments, true);
  assert.equal(restoredPads[0].building?.type, 'watchtower');
  assert.equal(restoredPads[0].building?.hp, restoredPads[0].building?.maxHp);
  assert.equal(restoredFences[f1.updatedSegment.id - 1].level, 1);
  assert.equal(restoredFences[f1.updatedSegment.id - 1].hp, restoredFences[f1.updatedSegment.id - 1].maxHp);
});

test('Free Play / Demo mode grants 0 XP, 0 Coins, does not advance tasks or streak, and preserves saved fort', () => {
  const day1 = Date.UTC(2026, 10, 16, 16, 0, 0);
  let state = createDefaultDailyState(day1);
  const startXp = state.xp;
  const startCoins = state.coins;
  const startTickets = state.tickets;

  // Task progress in Free Play is ignored
  const taskRes = recordTaskProgress(
    state,
    {
      woodCollectedDelta: 50,
      flaresUsedDelta: 10,
      buildingsBuiltDelta: 10,
      consecutiveNightsSurvived: 3,
      runScore: 3000,
    },
    { isFreePlay: true }
  );
  assert.equal(taskRes.allThreeJustCompleted, false);
  assert.equal(taskRes.updatedState.xp, startXp);
  assert.equal(taskRes.updatedState.coins, startCoins);

  // Run completion in Free Play grants 0 XP, 0 Coins, and does not increment streak
  const runRes = completeRunProgression(state, {
    score: 3000,
    victory: true,
    nightsSurvived: 3,
    nowMs: day1,
    isFreePlay: true,
  });
  assert.equal(runRes.summary.isFreePlay, true);
  assert.equal(runRes.summary.xpGained, 0);
  assert.equal(runRes.summary.coinsGained, 0);
  assert.equal(runRes.updatedState.xp, startXp);
  assert.equal(runRes.updatedState.coins, startCoins);
  assert.equal(runRes.updatedState.tickets, startTickets);
  assert.equal(runRes.updatedState.streak, 0);
});

test('Daily Check-In reward unlocks after first completed run of UTC day, claims once per UTC date, and resets next UTC day', () => {
  const day1 = Date.UTC(2026, 10, 16, 18, 0, 0);
  const day2 = Date.UTC(2026, 10, 17, 2, 0, 0);
  let state = createDefaultDailyState(day1);

  // Cannot claim before completing first run of the UTC day
  const earlyClaim = claimDailyCheckIn(state, day1);
  assert.equal(earlyClaim.claimed, false);
  assert.equal(earlyClaim.reason, 'not_eligible_yet');

  // Complete first run (even a defeat unlocks check-in eligibility)
  const afterRun = completeRunProgression(state, {
    score: 400,
    victory: false,
    nightsSurvived: 1,
    nowMs: day1,
  });
  state = afterRun.updatedState;
  assert.equal(afterRun.summary.checkInAvailableToClaim, true);

  const coinsBefore = state.coins;
  const xpBefore = state.xp;
  const firstClaim = claimDailyCheckIn(state, day1);
  assert.equal(firstClaim.claimed, true);
  assert.equal(firstClaim.coinsAdded, DAILY_CHECKIN_REWARD.coins);
  assert.equal(firstClaim.xpAdded, DAILY_CHECKIN_REWARD.xp);
  assert.equal(firstClaim.updatedState.coins, coinsBefore + DAILY_CHECKIN_REWARD.coins);
  assert.equal(firstClaim.updatedState.xp, xpBefore + DAILY_CHECKIN_REWARD.xp);
  state = firstClaim.updatedState;

  // Duplicate claim on the same UTC date is rejected
  const duplicateClaim = claimDailyCheckIn(state, day1 + 60000);
  assert.equal(duplicateClaim.claimed, false);
  assert.equal(duplicateClaim.reason, 'already_claimed_today');

  // Next UTC date: requires completing a run on the new UTC day, then can be claimed again
  state = checkAndApplyDailyReset(state, day2);
  const nextDayEarly = claimDailyCheckIn(state, day2);
  assert.equal(nextDayEarly.claimed, false);
  assert.equal(nextDayEarly.reason, 'not_eligible_yet');

  state = completeRunProgression(state, {
    score: 900,
    victory: true,
    nightsSurvived: 3,
    nowMs: day2,
  }).updatedState;
  const nextDayClaim = claimDailyCheckIn(state, day2);
  assert.equal(nextDayClaim.claimed, true);
});

test('migrateDailyState safely upgrades v1 or partially corrupted localStorage data to Schema v2 without losing progression', () => {
  const nowMs = Date.UTC(2026, 10, 16, 12, 0, 0);
  const legacyV1Raw = {
    lastResetDateUTC: '2026-11-16',
    tickets: 2,
    xp: 760,
    level: 3,
    coins: 140,
    streak: 4,
    lastPlayedDateUTC: '2026-11-16',
    cosmetics: ['amber_default', 'emerald_bog'],
    unlockedTitles: ['Rookie Ranger', 'Tri-Night Survivor'],
    equippedLanternId: 'emerald_bog',
    equippedTitle: 'Tri-Night Survivor',
    // Missing schemaVersion, savedPads, savedFenceSegments, savedResources, checkIn fields
  };

  const migrated = migrateDailyState(legacyV1Raw, nowMs);
  assert.equal(migrated.schemaVersion, CURRENT_DAILY_SCHEMA_VERSION);
  assert.equal(migrated.xp, 760);
  assert.equal(migrated.level, 3);
  assert.equal(migrated.toolTier, 2); // Level 3+ unlocks Master Hammer toolTier 2
  assert.equal(migrated.coins, 140);
  assert.equal(migrated.streak, 4);
  assert.equal(migrated.equippedLanternId, 'emerald_bog');
  assert.equal(migrated.equippedTitle, 'Tri-Night Survivor');
  assert.equal(migrated.savedPads.length, 8);
  assert.equal(migrated.savedFenceSegments.length, 12);
  assert.equal(migrated.savedResources.wood > 0, true);
});

