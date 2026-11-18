import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canShowDevTestControl,
  checkAndApplyDailyReset,
  claimDailyCheckIn,
  clearDevTestFortFromStorage,
  completeRunProgression,
  computeRemainingDailyTickets,
  consumeTicketForRun,
  createDefaultDailyState,
  CURRENT_DAILY_SCHEMA_VERSION,
  DAILY_CHECKIN_REWARD,
  DAILY_STORAGE_KEY,
  DEV_TEST_FORT_STORAGE_KEY,
  getUTCDateString,
  grantReviewTickets,
  isDevelopmentTestMode,
  LEGACY_TICKET_BACKUP_KEY,
  loadDailyStateFromStorage,
  loadDevTestFortFromStorage,
  MAX_DAILY_TICKETS,
  shouldConsumeTicketForStart,
  shouldLockDailyProgression,
  migrateDailyState,
  recordStartedRun,
  recordTaskProgress,
  saveDevTestFortToStorage,
  saveFortAndResourcesToDailyState,
} from './dailySystem';
import {
  buildOrUpgradeFenceSegment,
  buildStructureOnPad,
  createInitialFenceSegments,
  createInitialPads,
  gatherFromResourceNode,
  restoreFenceSegmentsFromPersistence,
  restorePadsFromPersistence,
  salvageStructureOnPad,
  upgradeStructureOnPad,
} from './rules';
import { ResourceNodeEntity } from './types';

test('demo/test mode is enabled in Dev and Vercel Preview (?devTest=1, ?demo=1, or button) and strictly blocked in Production', () => {
  // UI control visibility
  assert.equal(canShowDevTestControl(true), true);
  assert.equal(canShowDevTestControl(false, 'preview'), true);
  assert.equal(canShowDevTestControl(false, 'production'), false);
  assert.equal(canShowDevTestControl(false, ''), false);
  assert.equal(canShowDevTestControl(true, 'production'), false);

  // Devvit prerelease playtest allows the manual Test Run button, but does not auto-start it.
  assert.equal(isDevelopmentTestMode(false, '', false, undefined, true), false);
  assert.equal(isDevelopmentTestMode(false, '', true, undefined, true), true);
  assert.equal(isDevelopmentTestMode(false, '', false, 'production', true), false);

  // URL flag activation in dev build and Vercel Preview
  assert.equal(isDevelopmentTestMode(true, '?devTest=1'), true);
  assert.equal(isDevelopmentTestMode(true, '?demo=1'), true);
  assert.equal(isDevelopmentTestMode(false, '?demo=1', false, 'preview'), true);
  assert.equal(isDevelopmentTestMode(false, '?devTest=1', false, 'preview'), true);
  assert.equal(isDevelopmentTestMode(true, '?devTest=0'), false);
  assert.equal(isDevelopmentTestMode(true, ''), false);

  // In-app manual Demo/Test Run button activation in dev & preview builds
  assert.equal(isDevelopmentTestMode(true, '', true), true);
  assert.equal(isDevelopmentTestMode(false, '', true, 'preview'), true);
  assert.equal(isDevelopmentTestMode(true, '?devTest=0', true), true);

  // Strictly disabled in production builds even if URL flags or manual trigger are passed
  assert.equal(isDevelopmentTestMode(false, '?devTest=1', false, 'production'), false);
  assert.equal(isDevelopmentTestMode(false, '?demo=1', false, 'production'), false);
  assert.equal(isDevelopmentTestMode(false, '', true, 'production'), false);
  assert.equal(isDevelopmentTestMode(false, '?devTest=1', true, ''), false);
  assert.equal(isDevelopmentTestMode(false, '?demo=1', true, ''), false);
});

test('developer QA mode bypasses only the daily lock and never spends tickets; production rules remain unchanged', () => {
  assert.equal(shouldLockDailyProgression(true, false), true);
  assert.equal(shouldLockDailyProgression(true, true), false);
  assert.equal(shouldLockDailyProgression(false, true), false);
  assert.equal(shouldConsumeTicketForStart(false), true);
  assert.equal(shouldConsumeTicketForStart(true), false);
});

test('Test Run strictly isolates production progression (no ticket spend, no task/XP/coin/streak/check-in/fort mutations)', () => {
  const day1 = Date.UTC(2026, 10, 16, 14, 0, 0);
  const prodState = createDefaultDailyState(day1);
  const prodTickets = prodState.tickets;
  const prodXp = prodState.xp;
  const prodCoins = prodState.coins;
  const prodStreak = prodState.streak;
  const prodWood = prodState.savedResources.wood;

  // 1. Fort & resource saves with isDevTestMode=true leave production state untouched
  const testPads = createInitialPads();
  const testFences = createInitialFenceSegments();
  const built = buildStructureOnPad(
    testPads[0],
    { wood: 200, stone: 200, food: 200, tickets: 3 },
    'watchtower',
    'day',
    false
  );
  testPads[0] = built.updatedPad;
  const afterFortSave = saveFortAndResourcesToDailyState(
    prodState,
    testPads,
    testFences,
    built.updatedResources,
    false,
    { isDevTestMode: true }
  );
  assert.equal(afterFortSave, prodState);
  assert.equal(afterFortSave.savedPads[0].building, null);
  assert.equal(afterFortSave.savedResources.wood, prodWood);

  // 2. Task progress in Dev Test mode does not advance tasks or award bonus
  const afterTasks = recordTaskProgress(
    prodState,
    {
      woodCollectedDelta: 100,
      flaresUsedDelta: 10,
      buildingsBuiltDelta: 10,
      consecutiveNightsSurvived: 3,
      runScore: 2500,
    },
    { isDevTestMode: true }
  );
  assert.equal(afterTasks.allThreeJustCompleted, false);
  assert.equal(afterTasks.updatedState, prodState);
  assert.equal(
    Object.values(afterTasks.updatedState.taskProgress).every((val) => val === 0),
    true
  );

  // 3. Run completion in Dev Test mode grants 0 XP, 0 Coins, 0 streak, and does not unlock check-in
  const afterRun = completeRunProgression(prodState, {
    score: 2500,
    victory: true,
    nightsSurvived: 3,
    nowMs: day1,
    isDevTestMode: true,
  });
  assert.equal(afterRun.updatedState, prodState);
  assert.equal(afterRun.summary.xpGained, 0);
  assert.equal(afterRun.summary.coinsGained, 0);
  assert.equal(afterRun.updatedState.xp, prodXp);
  assert.equal(afterRun.updatedState.coins, prodCoins);
  assert.equal(afterRun.updatedState.tickets, prodTickets);
  assert.equal(afterRun.updatedState.streak, prodStreak);
  assert.equal(afterRun.updatedState.checkInEligibleDateUTC, null);

  // 4. Claiming Daily Check-In while in Dev Test mode is blocked
  const eligibleProdState = {
    ...prodState,
    checkInEligibleDateUTC: prodState.lastResetDateUTC,
  };
  const checkInAttempt = claimDailyCheckIn(eligibleProdState, day1, { isDevTestMode: true });
  assert.equal(checkInAttempt.claimed, false);
  assert.equal(checkInAttempt.updatedState, eligibleProdState);
});

test('Test Run allows gathering, building, upgrading, and salvaging during Day even when dailyProgressionLocked is true, while still enforcing Night restrictions', () => {
  const prodDailyLocked = true;
  const devTestMode = true;
  const effectiveLock = shouldLockDailyProgression(prodDailyLocked, devTestMode);
  assert.equal(effectiveLock, false);

  const sampleNode: ResourceNodeEntity = {
    id: 1,
    type: 'wood',
    name: 'Timber Pile',
    x: -14,
    z: -8,
    amount: 30,
    maxAmount: 30,
    hitFlashTimer: 0,
    respawnTimer: 0,
  };
  const pads = createInitialPads();
  const wallet = { wood: 150, stone: 150, food: 100, tickets: 0 };

  // During Day in Test Run (effectiveLock === false): gathering, building, upgrading, salvaging all work
  const gatherDay = gatherFromResourceNode({
    node: sampleNode,
    resources: wallet,
    phase: 'day',
    dailyLocked: effectiveLock,
  });
  assert.equal(gatherDay.gathered, true);
  assert.equal(gatherDay.updatedResources.wood > wallet.wood, true);

  const buildDay = buildStructureOnPad(
    pads[0],
    gatherDay.updatedResources,
    'watchtower',
    'day',
    effectiveLock
  );
  assert.equal(buildDay.success, true);

  const upgradeDay = upgradeStructureOnPad(
    buildDay.updatedPad,
    buildDay.updatedResources,
    'pathA',
    'day',
    effectiveLock
  );
  assert.equal(upgradeDay.success, true);

  const salvageDay = salvageStructureOnPad(
    upgradeDay.updatedPad,
    upgradeDay.updatedResources,
    'day',
    effectiveLock
  );
  assert.equal(salvageDay.success, true);

  // During Night in Test Run: Night restrictions STILL apply (no gathering or building at night)
  const gatherNight = gatherFromResourceNode({
    node: sampleNode,
    resources: wallet,
    phase: 'night',
    dailyLocked: effectiveLock,
  });
  assert.equal(gatherNight.gathered, false);
  assert.equal(gatherNight.reason, 'night_locked');

  const buildNight = buildStructureOnPad(
    pads[1],
    wallet,
    'watchtower',
    'night',
    effectiveLock
  );
  assert.equal(buildNight.success, false);
  assert.equal(buildNight.reason, 'night_locked');
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

test('completing all 3 daily tasks awards bonus coins & XP, locks daily progression until 00:00 UTC reset, and keeps ticket cap at 3', () => {
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
  assert.equal(updatedState.pendingBonusTicketsTomorrow, 0);
  assert.equal(updatedState.dailyProgressionLocked, true);

  // Next UTC day reset refills strictly to 3 base tickets (no rollover/bonus above 3) and unlocks daily progression
  const nextDayState = checkAndApplyDailyReset(updatedState, day2);
  assert.equal(nextDayState.tickets, 3);
  assert.equal(nextDayState.ticketsUsedTodayUTC, 0);
  assert.equal(nextDayState.pendingBonusTicketsTomorrow, 0);
  assert.equal(nextDayState.dailyProgressionLocked, false);
});

test('streak advances on normal starts once per UTC day, including unfinished runs and milestones', () => {
  const d1 = Date.UTC(2026, 10, 16, 14);
  const d2 = Date.UTC(2026, 10, 17, 14);
  const d3 = Date.UTC(2026, 10, 18, 14);
  const d5 = Date.UTC(2026, 10, 20, 14);
  let state = recordStartedRun(createDefaultDailyState(d1), d1);
  assert.equal(state.streak, 1);
  state = recordStartedRun(state, d1 + 1000);
  assert.equal(state.streak, 1);
  state = recordStartedRun(state, d2);
  assert.equal(state.streak, 2);
  state = recordStartedRun(state, d3);
  assert.equal(state.streak, 3);
  assert.equal(state.claimedStreakMilestones.includes(3), true);
  assert.equal(state.unlockedTitles.includes('Tri-Night Survivor'), true);
  const coins = state.coins;
  state = recordStartedRun(state, d3 + 5000);
  assert.equal(state.coins, coins);
  state = checkAndApplyDailyReset(state, d5);
  assert.equal(state.streak, 0);
  state = recordStartedRun(state, d5);
  assert.equal(state.streak, 1);
});

test('completion after UTC midnight does not advance streak for a day with no start', () => {
  const start = Date.UTC(2026, 10, 16, 23, 59);
  const next = Date.UTC(2026, 10, 17, 0, 1);
  const state = recordStartedRun(createDefaultDailyState(start), start);
  const result = completeRunProgression(state, { score: 0, victory: false, nightsSurvived: 0, nowMs: next });
  assert.equal(result.updatedState.streak, 1);
  assert.equal(result.updatedState.lastPlayedDateUTC, '2026-11-16');
});

test('normal players can never hold or receive more than 3 tickets per UTC day', () => {
  const t0 = Date.UTC(2026, 10, 16, 12, 0, 0);
  let state = createDefaultDailyState(t0);
  assert.equal(computeRemainingDailyTickets(0, 99), MAX_DAILY_TICKETS);
  assert.equal(computeRemainingDailyTickets(2, 99), 1);
  assert.equal(computeRemainingDailyTickets(3, 5), 0);
  assert.equal(computeRemainingDailyTickets(5, -3), 0);

  // Consume 1 ticket (ticketsUsedTodayUTC becomes 1, remaining = 2)
  state = consumeTicketForRun(state).updatedState;
  assert.equal(state.tickets, 2);
  assert.equal(state.ticketsUsedTodayUTC, 1);

  // Attempting to grant extra tickets cannot exceed max(0, 3 - ticketsUsedTodayUTC)
  state = grantReviewTickets(state, 10);
  assert.equal(state.tickets, 2);

  // Consume remaining 2 tickets -> 0 tickets left, ticketsUsedTodayUTC = 3
  state = consumeTicketForRun(state).updatedState;
  state = consumeTicketForRun(state).updatedState;
  assert.equal(state.tickets, 0);
  assert.equal(state.ticketsUsedTodayUTC, 3);

  state = grantReviewTickets(state, 15);
  assert.equal(state.tickets, 0);
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

test('Demo / Test mode grants 0 XP, 0 Coins, does not advance tasks or streak, and preserves saved fort', () => {
  const day1 = Date.UTC(2026, 10, 16, 14, 0, 0);
  let state = createDefaultDailyState(day1);
  const startXp = state.xp;
  const startCoins = state.coins;
  const startTickets = state.tickets;

  // Task progress in Demo / Dev Test mode is ignored
  const taskRes = recordTaskProgress(
    state,
    {
      woodCollectedDelta: 50,
      flaresUsedDelta: 10,
      buildingsBuiltDelta: 10,
      consecutiveNightsSurvived: 3,
      runScore: 3000,
    },
    { isDevTestMode: true }
  );
  assert.equal(taskRes.allThreeJustCompleted, false);
  assert.equal(taskRes.updatedState.xp, startXp);
  assert.equal(taskRes.updatedState.coins, startCoins);

  // Run completion in Demo / Dev Test mode grants 0 XP, 0 Coins, and does not increment streak
  const runRes = completeRunProgression(state, {
    score: 3000,
    victory: true,
    nightsSurvived: 3,
    nowMs: day1,
    isDevTestMode: true,
  });
  assert.equal(runRes.summary.isDevTestMode, true);
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

test('migrateDailyState safely upgrades legacy saves to Schema v3, normalizes >3 tickets idempotently without losing progression', () => {
  const nowMs = Date.UTC(2026, 10, 16, 12, 0, 0);
  const legacyV1Raw = {
    lastResetDateUTC: '2026-11-16',
    tickets: 25,
    pendingBonusTicketsTomorrow: 2,
    xp: 760,
    level: 3,
    coins: 140,
    streak: 4,
    lastPlayedDateUTC: '2026-11-16',
    cosmetics: ['amber_default', 'emerald_bog'],
    unlockedTitles: ['Rookie Ranger', 'Tri-Night Survivor'],
    equippedLanternId: 'emerald_bog',
    equippedTitle: 'Tri-Night Survivor',
  };

  // First migration: 25 legacy tickets normalized conservatively (<= 2 since activity today counted >=1 used)
  const migrated1 = migrateDailyState(legacyV1Raw, nowMs);
  assert.equal(migrated1.schemaVersion, CURRENT_DAILY_SCHEMA_VERSION);
  assert.equal(migrated1.tickets <= 2, true);
  assert.equal(migrated1.ticketsUsedTodayUTC, 1);
  assert.equal(migrated1.tickets, 2);
  assert.equal(migrated1.pendingBonusTicketsTomorrow, 0);
  assert.equal(migrated1.xp, 760);
  assert.equal(migrated1.level, 3);
  assert.equal(migrated1.toolTier, 2);
  assert.equal(migrated1.coins, 140);
  assert.equal(migrated1.streak, 4);
  assert.equal(migrated1.equippedLanternId, 'emerald_bog');
  assert.equal(migrated1.equippedTitle, 'Tri-Night Survivor');
  assert.equal(migrated1.savedPads.length, 8);
  assert.equal(migrated1.savedFenceSegments.length, 12);
  assert.equal(migrated1.savedResources.wood > 0, true);

  // Second migration (idempotency check): repeated runs produce the exact same state
  const migrated2 = migrateDailyState(migrated1, nowMs);
  assert.deepEqual(migrated2, migrated1);

  // Legacy inflated save with NO activity today normalizes to 3 tickets
  const freshInflated = migrateDailyState(
    {
      lastResetDateUTC: '2026-11-16',
      tickets: 25,
      xp: 120,
      coins: 90,
    },
    nowMs
  );
  assert.equal(freshInflated.tickets, 3);
  assert.equal(freshInflated.ticketsUsedTodayUTC, 0);
});

test('loadDailyStateFromStorage backs up legacy >3 ticket saves once and clearDevTestFortFromStorage isolates production data', () => {
  const store = new Map<string, string>();
  const prevWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  };

  try {
    const nowMs = Date.UTC(2026, 10, 16, 15, 0, 0);
    const legacySave = {
      schemaVersion: 2,
      lastResetDateUTC: '2026-11-16',
      lastPlayedDateUTC: '2026-11-16',
      tickets: 25,
      xp: 450,
      coins: 310,
      streak: 2,
    };
    store.set(DAILY_STORAGE_KEY, JSON.stringify(legacySave));
    store.set(DEV_TEST_FORT_STORAGE_KEY, JSON.stringify({ savedResources: { wood: 999, stone: 999, food: 999 } }));

    const loaded = loadDailyStateFromStorage(nowMs);
    assert.equal(loaded.tickets, 2);
    assert.equal(loaded.xp, 450);
    assert.equal(loaded.coins, 310);

    // Non-destructive traceable backup exists with original legacy payload
    const backupRaw = store.get(LEGACY_TICKET_BACKUP_KEY);
    assert.ok(backupRaw, 'Expected traceable legacy ticket backup');
    const backup = JSON.parse(backupRaw!);
    assert.equal(backup.legacyState.tickets, 25);

    // Demo fort save & load round-trip works and stays isolated from production save
    const baseState = createDefaultDailyState(nowMs);
    const seededDemo = loadDevTestFortFromStorage(baseState);
    assert.equal(seededDemo.savedFenceSegments.length, 12);
    const demoPads = restorePadsFromPersistence(seededDemo.savedPads, true);
    const demoFences = restoreFenceSegmentsFromPersistence(seededDemo.savedFenceSegments, true);
    saveDevTestFortToStorage(demoPads, demoFences, { wood: 123, stone: 45, food: 67 });
    const reloadedDemo = loadDevTestFortFromStorage(baseState);
    assert.deepEqual(reloadedDemo.savedResources, { wood: 123, stone: 45, food: 67 });

    // Clearing Demo/Test data removes ONLY dev test storage and leaves production save intact
    clearDevTestFortFromStorage();
    assert.equal(store.get(DEV_TEST_FORT_STORAGE_KEY), undefined);
    assert.ok(store.get(DAILY_STORAGE_KEY));
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = prevWindow;
    }
  }
});

test('UTC reset checks strict 00:00 UTC boundary rather than local calendar day', () => {
  const beforeUtcMidnight = Date.UTC(2026, 10, 16, 23, 55, 0);
  const afterUtcMidnight = Date.UTC(2026, 10, 17, 0, 5, 0);

  let state = createDefaultDailyState(beforeUtcMidnight);
  state = consumeTicketForRun(state).updatedState;
  state = consumeTicketForRun(state).updatedState;
  assert.equal(state.tickets, 1);

  // 4 minutes later at 23:59 UTC: still same UTC day -> no reset
  const stillSameDay = checkAndApplyDailyReset(state, Date.UTC(2026, 10, 16, 23, 59, 0));
  assert.equal(stillSameDay.tickets, 1);
  assert.equal(stillSameDay.lastResetDateUTC, '2026-11-16');

  // At 00:05 UTC next day: strict UTC reset refills to 3 and clears ticketsUsedTodayUTC
  const nextUtcDay = checkAndApplyDailyReset(stillSameDay, afterUtcMidnight);
  assert.equal(nextUtcDay.tickets, 3);
  assert.equal(nextUtcDay.ticketsUsedTodayUTC, 0);
  assert.equal(nextUtcDay.lastResetDateUTC, '2026-11-17');
});



test('level three upgrades survive normal save migration', () => {
  const state = createDefaultDailyState();
  const wallet = { wood: 500, stone: 500, food: 500, tickets: 3 };
  const pads = createInitialPads();
  const fences = createInitialFenceSegments();
  const built = buildStructureOnPad(pads[0], wallet, 'watchtower', 'day');
  const upgraded = upgradeStructureOnPad(built.updatedPad, wallet, 'pathB', 'day');
  pads[0] = upgradeStructureOnPad(upgraded.updatedPad, wallet, 'pathB', 'day').updatedPad;
  const fence2 = buildOrUpgradeFenceSegment(fences[1], wallet);
  fences[1] = buildOrUpgradeFenceSegment(fence2.updatedSegment, wallet).updatedSegment;
  const saved = saveFortAndResourcesToDailyState(state, pads, fences, wallet);
  const migrated = migrateDailyState(saved);
  assert.equal(migrated.savedPads[0].building?.level, 3);
  assert.equal(migrated.savedPads[0].building?.upgradePath, 'pathB');
  assert.equal(migrated.savedFenceSegments[1].level, 3);
  assert.equal(migrated.savedFenceSegments[1].maxHp, 600);
});
