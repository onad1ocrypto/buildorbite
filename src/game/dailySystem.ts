import {
  BonusTaskItem,
  DailyPersistenceState,
  DailyTaskItem,
  FenceSegment,
  LanternCosmeticSpec,
  LevelRewardSpec,
  PlacementPad,
  Resources,
  RunCompletionSummary,
  StreakMilestoneSpec,
} from './types';
import {
  INITIAL_RESOURCES,
  createInitialFenceSegments,
  createInitialPads,
  restoreFenceSegmentsFromPersistence,
  restorePadsFromPersistence,
  serializeFenceSegmentsForPersistence,
  serializePadsForPersistence,
} from './rules';

export const DAILY_STORAGE_KEY = 'build_or_bite_daily_v1';
export const DAILY_STATE_SAVED_EVENT = 'build-or-bite:daily-state-saved';
export const LEGACY_TICKET_BACKUP_KEY = 'build_or_bite_legacy_backup_v2';
export const CURRENT_DAILY_SCHEMA_VERSION = 3;
export const MAX_DAILY_TICKETS = 3;
export const DAILY_CHECKIN_REWARD = {
  coins: 25,
  xp: 30,
};

/**
 * Authoritative helper for computing a normal player's remaining tickets for the current UTC day.
 * Normal players can never have more than MAX_DAILY_TICKETS (3) or more than max(0, 3 - ticketsUsedTodayUTC),
 * and remaining tickets can never be negative.
 */
export function computeRemainingDailyTickets(
  ticketsUsedTodayUTC: number,
  rawTickets?: number
): number {
  const safeUsed =
    typeof ticketsUsedTodayUTC === 'number' && Number.isFinite(ticketsUsedTodayUTC)
      ? Math.max(0, Math.min(MAX_DAILY_TICKETS, Math.round(ticketsUsedTodayUTC)))
      : 0;
  const maxAllowedToday = Math.max(0, MAX_DAILY_TICKETS - safeUsed);
  if (typeof rawTickets === 'number' && Number.isFinite(rawTickets)) {
    return Math.max(0, Math.min(maxAllowedToday, Math.round(rawTickets)));
  }
  return maxAllowedToday;
}

export const DEFAULT_BONUS_TASKS: BonusTaskItem[] = [
  {
    id: 'bonus_slay_12',
    title: 'Slay 12 Undead in the Clearing',
    target: 12,
    rewardXp: 35,
  },
  {
    id: 'bonus_flare_3',
    title: 'Cast 3 Lantern Flares',
    target: 3,
    rewardXp: 25,
  },
];

export const LANTERN_COSMETICS: Record<string, LanternCosmeticSpec> = {
  amber_default: {
    id: 'amber_default',
    name: 'Campfire Amber',
    hexColor: '#ff8c1a',
    threeColor: 0xff8c1a,
    unlockSource: 'Starter Lantern',
  },
  emerald_bog: {
    id: 'emerald_bog',
    name: 'Emerald Bog-Glow',
    hexColor: '#10b981',
    threeColor: 0x10b981,
    unlockSource: 'Reach Player Level 2',
  },
  frost_cyan: {
    id: 'frost_cyan',
    name: 'Frostfire Cyan',
    hexColor: '#06b6d4',
    threeColor: 0x06b6d4,
    unlockSource: 'Reach Player Level 3',
  },
  baron_amethyst: {
    id: 'baron_amethyst',
    name: 'Baron Amethyst',
    hexColor: '#a855f7',
    threeColor: 0xa855f7,
    unlockSource: 'Reach Player Level 4',
  },
  crimson_moon: {
    id: 'crimson_moon',
    name: 'Crimson Bloodmoon',
    hexColor: '#f43f5e',
    threeColor: 0xf43f5e,
    unlockSource: 'Reach Player Level 5',
  },
  solar_gold: {
    id: 'solar_gold',
    name: 'Solar Flare Gold',
    hexColor: '#eab308',
    threeColor: 0xeab308,
    unlockSource: '7-Day Streak Milestone',
  },
  spectral_star: {
    id: 'spectral_star',
    name: 'Spectral Starlight',
    hexColor: '#e879f9',
    threeColor: 0xe879f9,
    unlockSource: '30-Day Streak Milestone',
  },
};

export const LEVEL_REWARDS: LevelRewardSpec[] = [
  {
    level: 1,
    xpRequired: 0,
    rewardLabel: 'Campfire Amber Lantern & Rookie Ranger Title',
    unlockCosmeticId: 'amber_default',
    unlockTitle: 'Rookie Ranger',
    coinsBonus: 0,
  },
  {
    level: 2,
    xpRequired: 300,
    rewardLabel: 'Emerald Bog-Glow Lantern & Timber Tactician Title',
    unlockCosmeticId: 'emerald_bog',
    unlockTitle: 'Timber Tactician',
    coinsBonus: 50,
  },
  {
    level: 3,
    xpRequired: 750,
    rewardLabel: 'Frostfire Cyan Lantern & Fort Architect Title',
    unlockCosmeticId: 'frost_cyan',
    unlockTitle: 'Fort Architect',
    coinsBonus: 75,
  },
  {
    level: 4,
    xpRequired: 1400,
    rewardLabel: 'Baron Amethyst Lantern & Nightfall Sentinel Title',
    unlockCosmeticId: 'baron_amethyst',
    unlockTitle: 'Nightfall Sentinel',
    coinsBonus: 100,
  },
  {
    level: 5,
    xpRequired: 2300,
    rewardLabel: 'Crimson Bloodmoon Lantern & Grand Clearing Warden Title',
    unlockCosmeticId: 'crimson_moon',
    unlockTitle: 'Grand Clearing Warden',
    coinsBonus: 150,
  },
];

export const STREAK_MILESTONES: StreakMilestoneSpec[] = [
  {
    days: 3,
    label: '3-Day Streak: +100 Coins & "Tri-Night Survivor" Title',
    coins: 100,
    title: 'Tri-Night Survivor',
  },
  {
    days: 7,
    label: '7-Day Streak: Solar Gold Lantern, +250 Coins & "Weeklong Watcher"',
    coins: 250,
    cosmeticId: 'solar_gold',
    title: 'Weeklong Watcher',
  },
  {
    days: 30,
    label: '30-Day Streak: Spectral Lantern, +1000 Coins & "Forest Legend"',
    coins: 1000,
    cosmeticId: 'spectral_star',
    title: 'Forest Legend',
  },
];

export const DAILY_TASK_POOL: DailyTaskItem[] = [
  {
    id: 'score_800',
    title: 'Score 800+ in one run',
    type: 'score_run',
    target: 800,
    rewardCoins: 40,
    rewardXp: 80,
  },
  {
    id: 'collect_wood_20',
    title: 'Collect 20 wood',
    type: 'collect_wood',
    target: 20,
    rewardCoins: 30,
    rewardXp: 60,
  },
  {
    id: 'use_flare_5',
    title: 'Use Lantern Flare 5 times',
    type: 'use_flare',
    target: 5,
    rewardCoins: 35,
    rewardXp: 70,
  },
  {
    id: 'build_5',
    title: 'Build 5 buildings',
    type: 'build_structures',
    target: 5,
    rewardCoins: 35,
    rewardXp: 75,
  },
  {
    id: 'survive_2',
    title: 'Survive 2 nights in a row',
    type: 'survive_nights',
    target: 2,
    rewardCoins: 45,
    rewardXp: 90,
  },
];

/**
 * Returns the strict UTC YYYY-MM-DD string for a timestamp.
 */
export function getUTCDateString(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/**
 * Computes exact integer days between two UTC YYYY-MM-DD strings.
 */
export function getUTCDayDifference(earlierDateUTC: string, laterDateUTC: string): number {
  const [y1, m1, d1] = earlierDateUTC.split('-').map(Number);
  const [y2, m2, d2] = laterDateUTC.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Formats time remaining until next 00:00 UTC reset.
 */
export function getTimeUntilNextUTCReset(nowMs: number = Date.now()): string {
  const now = new Date(nowMs);
  const nextMidnightUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  const diffSec = Math.max(0, Math.floor((nextMidnightUTC - nowMs) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
}

/**
 * Deterministically selects 3 daily tasks for a given UTC date string.
 */
export function selectDailyTasksForDate(dateUTC: string): DailyTaskItem[] {
  let hash = 0;
  for (let i = 0; i < dateUTC.length; i++) {
    hash = (hash * 31 + dateUTC.charCodeAt(i)) >>> 0;
  }
  const pool = [...DAILY_TASK_POOL];
  const chosen: DailyTaskItem[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = (hash + i * 7) % pool.length;
    chosen.push({ ...pool[idx] });
    pool.splice(idx, 1);
  }
  return chosen;
}

export function getLevelForXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
  nextRewardLabel: string;
} {
  let currentLevel = 1;
  let currentThreshold = 0;
  let nextThreshold = 300;
  let nextRewardLabel = '+100 Coins Mastery Bonus';

  for (let i = 0; i < LEVEL_REWARDS.length; i++) {
    if (xp >= LEVEL_REWARDS[i].xpRequired) {
      currentLevel = LEVEL_REWARDS[i].level;
      currentThreshold = LEVEL_REWARDS[i].xpRequired;
      if (i + 1 < LEVEL_REWARDS.length) {
        nextThreshold = LEVEL_REWARDS[i + 1].xpRequired;
        nextRewardLabel = LEVEL_REWARDS[i + 1].rewardLabel;
      } else {
        const extraLevels = Math.floor((xp - currentThreshold) / 1200);
        currentLevel = LEVEL_REWARDS[i].level + extraLevels;
        currentThreshold = LEVEL_REWARDS[i].xpRequired + extraLevels * 1200;
        nextThreshold = currentThreshold + 1200;
        nextRewardLabel = 'Level-Up Chest (+100 Coins)';
      }
    }
  }

  const span = Math.max(1, nextThreshold - currentThreshold);
  const intoLevel = Math.max(0, xp - currentThreshold);
  const progressPct = Math.min(100, Math.round((intoLevel / span) * 100));

  return {
    level: currentLevel,
    currentLevelXp: intoLevel,
    nextLevelXp: span,
    progressPct,
    nextRewardLabel,
  };
}

export function createDefaultDailyState(nowMs: number = Date.now()): DailyPersistenceState {
  const todayUTC = getUTCDateString(nowMs);
  const tasks = selectDailyTasksForDate(todayUTC);
  const taskProgress: Record<string, number> = {};
  tasks.forEach((t) => {
    taskProgress[t.id] = 0;
  });

  const bonusTasks = DEFAULT_BONUS_TASKS.map((b) => ({ ...b }));
  const bonusTaskProgress: Record<string, number> = {};
  bonusTasks.forEach((b) => {
    bonusTaskProgress[b.id] = 0;
  });

  return {
    schemaVersion: CURRENT_DAILY_SCHEMA_VERSION,
    tickets: MAX_DAILY_TICKETS,
    ticketsUsedTodayUTC: 0,
    maxDailyTickets: MAX_DAILY_TICKETS,
    pendingBonusTicketsTomorrow: 0,
    coins: 50,
    xp: 0,
    level: 1,
    toolTier: 1,
    streak: 0,
    bestStreak: 0,
    lastResetDateUTC: todayUTC,
    lastPlayedDateUTC: null,
    tasks,
    taskProgress,
    allTasksBonusClaimed: false,
    dailyProgressionLocked: false,
    savedPads: serializePadsForPersistence(createInitialPads()),
    savedFenceSegments: serializeFenceSegmentsForPersistence(createInitialFenceSegments()),
    savedResources: {
      wood: INITIAL_RESOURCES.wood,
      stone: INITIAL_RESOURCES.stone,
      food: INITIAL_RESOURCES.food,
    },
    checkInEligibleDateUTC: null,
    lastCheckInClaimedDateUTC: null,
    bonusTasks,
    bonusTaskProgress,
    bonusXpClaimedIds: [],
    cosmetics: ['amber_default'],
    equippedLanternId: 'amber_default',
    unlockedTitles: ['Rookie Ranger'],
    equippedTitle: 'Rookie Ranger',
    claimedStreakMilestones: [],
  };
}

/**
 * Safely migrates older (schemaVersion 1) or partially corrupted daily states to schemaVersion 2
 * without wiping valid account progression, fort buildings, or resource wallets.
 */
export function migrateDailyState(
  raw: unknown,
  nowMs: number = Date.now()
): DailyPersistenceState {
  const base = createDefaultDailyState(nowMs);
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const src = raw as Partial<DailyPersistenceState>;

  const xp = typeof src.xp === 'number' && Number.isFinite(src.xp) && src.xp >= 0 ? src.xp : base.xp;
  const levelInfo = getLevelForXp(xp);
  const level =
    typeof src.level === 'number' && src.level >= 1 ? Math.max(src.level, levelInfo.level) : levelInfo.level;
  const toolTier =
    typeof src.toolTier === 'number' && src.toolTier >= 1
      ? src.toolTier
      : level >= 3
      ? 2
      : 1;

  const restoredPads = restorePadsFromPersistence(src.savedPads, false);
  const restoredFences = restoreFenceSegmentsFromPersistence(src.savedFenceSegments, false);

  const savedResources =
    src.savedResources &&
    typeof src.savedResources === 'object' &&
    typeof src.savedResources.wood === 'number' &&
    typeof src.savedResources.stone === 'number' &&
    typeof src.savedResources.food === 'number'
      ? {
          wood: Math.max(0, Math.round(src.savedResources.wood)),
          stone: Math.max(0, Math.round(src.savedResources.stone)),
          food: Math.max(0, Math.round(src.savedResources.food)),
        }
      : { ...base.savedResources };

  const tasks =
    Array.isArray(src.tasks) && src.tasks.length === 3
      ? src.tasks
      : selectDailyTasksForDate(
          typeof src.lastResetDateUTC === 'string' ? src.lastResetDateUTC : base.lastResetDateUTC
        );

  const taskProgress: Record<string, number> = {};
  tasks.forEach((t) => {
    const val = src.taskProgress && typeof src.taskProgress[t.id] === 'number' ? src.taskProgress[t.id] : 0;
    taskProgress[t.id] = Math.max(0, val);
  });

  const allCompleted = tasks.every((t) => (taskProgress[t.id] ?? 0) >= t.target);
  const allTasksBonusClaimed = Boolean(src.allTasksBonusClaimed || allCompleted);
  const dailyProgressionLocked =
    typeof src.dailyProgressionLocked === 'boolean'
      ? src.dailyProgressionLocked || allCompleted
      : allCompleted;

  const bonusTasks =
    Array.isArray(src.bonusTasks) && src.bonusTasks.length > 0
      ? src.bonusTasks
      : base.bonusTasks;
  const bonusTaskProgress: Record<string, number> = {};
  bonusTasks.forEach((b) => {
    const val =
      src.bonusTaskProgress && typeof src.bonusTaskProgress[b.id] === 'number'
        ? src.bonusTaskProgress[b.id]
        : 0;
    bonusTaskProgress[b.id] = Math.max(0, val);
  });

  const lastResetDateUTC =
    typeof src.lastResetDateUTC === 'string' && src.lastResetDateUTC.length === 10
      ? src.lastResetDateUTC
      : base.lastResetDateUTC;
  const lastPlayedDateUTC =
    typeof src.lastPlayedDateUTC === 'string' && src.lastPlayedDateUTC.length === 10
      ? src.lastPlayedDateUTC
      : null;

  // Conservative, idempotent ticket normalization:
  // - Never grants more than MAX_DAILY_TICKETS (3) per UTC day.
  // - Never invents fake usage history, but respects explicit ticketsUsedTodayUTC, or if absent in a legacy save:
  //   - If 0 <= src.tickets <= 3, infers used = 3 - round(src.tickets).
  //   - If src.tickets > 3 (legacy inflated save) and the player already recorded a play or task progress on lastResetDateUTC,
  //     conservatively counts at least 1 ticket used today so migration never grants extra tickets beyond today's remaining allowance.
  const hasActivityToday =
    lastPlayedDateUTC === lastResetDateUTC ||
    dailyProgressionLocked ||
    Object.values(taskProgress).some((v) => v > 0);
  const rawTickets =
    typeof src.tickets === 'number' && Number.isFinite(src.tickets)
      ? Math.max(0, Math.round(src.tickets))
      : base.tickets;

  let ticketsUsedTodayUTC = 0;
  if (typeof src.ticketsUsedTodayUTC === 'number' && Number.isFinite(src.ticketsUsedTodayUTC)) {
    ticketsUsedTodayUTC = Math.max(
      0,
      Math.min(MAX_DAILY_TICKETS, Math.round(src.ticketsUsedTodayUTC))
    );
    if (rawTickets <= MAX_DAILY_TICKETS) {
      ticketsUsedTodayUTC = Math.max(ticketsUsedTodayUTC, MAX_DAILY_TICKETS - rawTickets);
    }
  } else if (rawTickets <= MAX_DAILY_TICKETS) {
    ticketsUsedTodayUTC = Math.max(0, MAX_DAILY_TICKETS - rawTickets);
  } else if (hasActivityToday) {
    ticketsUsedTodayUTC = 1;
  }

  const normalizedTickets = computeRemainingDailyTickets(ticketsUsedTodayUTC, rawTickets);

  return {
    schemaVersion: CURRENT_DAILY_SCHEMA_VERSION,
    tickets: normalizedTickets,
    ticketsUsedTodayUTC,
    maxDailyTickets: MAX_DAILY_TICKETS,
    pendingBonusTicketsTomorrow: 0,
    coins:
      typeof src.coins === 'number' && Number.isFinite(src.coins) && src.coins >= 0
        ? Math.round(src.coins)
        : base.coins,
    xp,
    level,
    toolTier,
    streak:
      typeof src.streak === 'number' && src.streak >= 0 ? Math.round(src.streak) : 0,
    bestStreak: Math.max(
      typeof src.bestStreak === 'number' && src.bestStreak >= 0 ? Math.round(src.bestStreak) : 0,
      typeof src.streak === 'number' && src.streak >= 0 ? Math.round(src.streak) : 0
    ),
    lastResetDateUTC,
    lastPlayedDateUTC,
    tasks,
    taskProgress,
    allTasksBonusClaimed,
    dailyProgressionLocked,
    savedPads: serializePadsForPersistence(restoredPads),
    savedFenceSegments: serializeFenceSegmentsForPersistence(restoredFences),
    savedResources,
    checkInEligibleDateUTC:
      typeof src.checkInEligibleDateUTC === 'string' ? src.checkInEligibleDateUTC : null,
    lastCheckInClaimedDateUTC:
      typeof src.lastCheckInClaimedDateUTC === 'string' ? src.lastCheckInClaimedDateUTC : null,
    bonusTasks,
    bonusTaskProgress,
    bonusXpClaimedIds: Array.isArray(src.bonusXpClaimedIds) ? src.bonusXpClaimedIds : [],
    cosmetics:
      Array.isArray(src.cosmetics) && src.cosmetics.length > 0 ? src.cosmetics : base.cosmetics,
    equippedLanternId:
      typeof src.equippedLanternId === 'string' && src.equippedLanternId in LANTERN_COSMETICS
        ? src.equippedLanternId
        : base.equippedLanternId,
    unlockedTitles:
      Array.isArray(src.unlockedTitles) && src.unlockedTitles.length > 0
        ? src.unlockedTitles
        : base.unlockedTitles,
    equippedTitle:
      typeof src.equippedTitle === 'string' && src.equippedTitle.length > 0
        ? src.equippedTitle
        : base.equippedTitle,
    claimedStreakMilestones: Array.isArray(src.claimedStreakMilestones)
      ? src.claimedStreakMilestones
      : [],
  };
}

/**
 * Persists the player's current fort structures, fence segments, and resource wallet
 * into the DailyPersistenceState. Optionally restores all structures to full maxHp
 * (used when ending a run or returning to title so combat damage does not permanently erase upgrades).
 */
export function saveFortAndResourcesToDailyState(
  state: DailyPersistenceState,
  pads: PlacementPad[],
  fenceSegments: FenceSegment[],
  resources: Pick<Resources, 'wood' | 'stone' | 'food'>,
  restoreFullHp = false,
  options?: { isDevTestMode?: boolean }
): DailyPersistenceState {
  if (options?.isDevTestMode) {
    return state;
  }
  const serializedPads = serializePadsForPersistence(pads);
  const serializedFences = serializeFenceSegmentsForPersistence(fenceSegments);

  const finalPads = restoreFullHp
    ? serializePadsForPersistence(restorePadsFromPersistence(serializedPads, true))
    : serializedPads;
  const finalFences = restoreFullHp
    ? serializeFenceSegmentsForPersistence(restoreFenceSegmentsFromPersistence(serializedFences, true))
    : serializedFences;

  return {
    ...state,
    savedPads: finalPads,
    savedFenceSegments: finalFences,
    savedResources: {
      wood: Math.max(0, Math.round(resources.wood)),
      stone: Math.max(0, Math.round(resources.stone)),
      food: Math.max(0, Math.round(resources.food)),
    },
  };
}

/**
 * Applies the 00:00 UTC daily reset:
 * - Refills tickets to 3 (capped at 3; unused tickets do NOT carry over, plus any bonus ticket earned from yesterday's 3/3 task completion).
 * - Refreshes the 3 daily tasks, resets taskProgress, and unlocks dailyProgressionLocked.
 * - Preserves the player's saved fort structures, fence segments (restored to full HP), and resource wallet.
 * - Resets streak to 0 if the player missed a full UTC day.
 */
export function checkAndApplyDailyReset(
  state: DailyPersistenceState,
  nowMs: number = Date.now()
): DailyPersistenceState {
  const migrated = migrateDailyState(state, nowMs);
  const todayUTC = getUTCDateString(nowMs);
  if (migrated.lastResetDateUTC === todayUTC) {
    return migrated;
  }

  const tasks = selectDailyTasksForDate(todayUTC);
  const taskProgress: Record<string, number> = {};
  tasks.forEach((t) => {
    taskProgress[t.id] = 0;
  });

  const bonusTasks = DEFAULT_BONUS_TASKS.map((b) => ({ ...b }));
  const bonusTaskProgress: Record<string, number> = {};
  bonusTasks.forEach((b) => {
    bonusTaskProgress[b.id] = 0;
  });

  // Check if streak expired (if lastPlayedDateUTC is more than 1 day before todayUTC)
  let updatedStreak = migrated.streak;
  if (migrated.lastPlayedDateUTC) {
    const daysSincePlayed = getUTCDayDifference(migrated.lastPlayedDateUTC, todayUTC);
    if (daysSincePlayed > 1) {
      updatedStreak = 0;
    }
  } else {
    updatedStreak = 0;
  }

  // Unused tickets do NOT carry over and normal players never exceed MAX_DAILY_TICKETS (3) per UTC day
  const refilledTickets = MAX_DAILY_TICKETS;

  // Restore saved fort & fences to full HP for the new UTC day while keeping all upgrades & wallet intact
  const restoredPads = serializePadsForPersistence(
    restorePadsFromPersistence(migrated.savedPads, true)
  );
  const restoredFences = serializeFenceSegmentsForPersistence(
    restoreFenceSegmentsFromPersistence(migrated.savedFenceSegments, true)
  );

  return {
    ...migrated,
    tickets: refilledTickets,
    ticketsUsedTodayUTC: 0,
    maxDailyTickets: MAX_DAILY_TICKETS,
    pendingBonusTicketsTomorrow: 0,
    streak: updatedStreak,
    lastResetDateUTC: todayUTC,
    tasks,
    taskProgress,
    allTasksBonusClaimed: false,
    dailyProgressionLocked: false,
    savedPads: restoredPads,
    savedFenceSegments: restoredFences,
    bonusTasks,
    bonusTaskProgress,
    bonusXpClaimedIds: [],
  };
}

/** Record a successfully started normal run once per UTC day. Demo callers must not invoke this. */
export function recordStartedRun(state: DailyPersistenceState, nowMs: number = Date.now()): DailyPersistenceState {
  const working = checkAndApplyDailyReset(state, nowMs);
  const today = getUTCDateString(nowMs);
  if (working.lastPlayedDateUTC === today) return working;
  const streak = working.lastPlayedDateUTC && getUTCDayDifference(working.lastPlayedDateUTC, today) === 1
    ? working.streak + 1 : 1;
  const cosmetics = new Set(working.cosmetics);
  const titles = new Set(working.unlockedTitles);
  const claimed = new Set(working.claimedStreakMilestones);
  let coins = working.coins;
  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone.days && !claimed.has(milestone.days)) {
      claimed.add(milestone.days);
      coins += milestone.coins;
      if (milestone.cosmeticId) cosmetics.add(milestone.cosmeticId);
      if (milestone.title) titles.add(milestone.title);
    }
  }
  return { ...working, streak, bestStreak: Math.max(working.bestStreak, streak),
    lastPlayedDateUTC: today, coins, cosmetics: Array.from(cosmetics),
    unlockedTitles: Array.from(titles), claimedStreakMilestones: Array.from(claimed) };
}

export function consumeTicketForRun(state: DailyPersistenceState): {
  updatedState: DailyPersistenceState;
  allowed: boolean;
} {
  const prevUsed =
    typeof state.ticketsUsedTodayUTC === 'number' && Number.isFinite(state.ticketsUsedTodayUTC)
      ? Math.max(0, Math.min(MAX_DAILY_TICKETS, Math.round(state.ticketsUsedTodayUTC)))
      : Math.max(0, MAX_DAILY_TICKETS - Math.min(MAX_DAILY_TICKETS, Math.max(0, state.tickets)));
  const remaining = computeRemainingDailyTickets(prevUsed, state.tickets);

  if (remaining <= 0) {
    return {
      updatedState: {
        ...state,
        tickets: 0,
        ticketsUsedTodayUTC: MAX_DAILY_TICKETS,
      },
      allowed: false,
    };
  }
  const nextUsed = Math.min(MAX_DAILY_TICKETS, prevUsed + 1);
  const nextTickets = computeRemainingDailyTickets(nextUsed, remaining - 1);
  return {
    updatedState: {
      ...state,
      tickets: nextTickets,
      ticketsUsedTodayUTC: nextUsed,
    },
    allowed: true,
  };
}

/**
 * Updates live task progress during or at the end of a run.
 * When all 3 core daily tasks reach their targets, immediately sets dailyProgressionLocked = true.
 * In Demo / Dev Test mode, core daily tasks do not advance and do not grant repeatable rewards.
 */
export function recordTaskProgress(
  state: DailyPersistenceState,
  event: {
    woodCollectedDelta?: number;
    flaresUsedDelta?: number;
    buildingsBuiltDelta?: number;
    consecutiveNightsSurvived?: number;
    runScore?: number;
    zombiesDefeatedDelta?: number;
  },
  options?: { isDevTestMode?: boolean }
): {
  updatedState: DailyPersistenceState;
  newlyCompletedTaskTitles: string[];
  allThreeJustCompleted: boolean;
} {
  if (options?.isDevTestMode) {
    return {
      updatedState: state,
      newlyCompletedTaskTitles: [],
      allThreeJustCompleted: false,
    };
  }

  const nextProgress = { ...state.taskProgress };
  const newlyCompletedTaskTitles: string[] = [];
  let bonusCoinsAdded = 0;
  let bonusXpAdded = 0;

  for (const task of state.tasks) {
    const prevVal = nextProgress[task.id] ?? 0;
    const wasComplete = prevVal >= task.target;
    let nextVal = prevVal;

    if (task.type === 'collect_wood' && event.woodCollectedDelta) {
      nextVal = Math.min(task.target, prevVal + event.woodCollectedDelta);
    } else if (task.type === 'use_flare' && event.flaresUsedDelta) {
      nextVal = Math.min(task.target, prevVal + event.flaresUsedDelta);
    } else if (task.type === 'build_structures' && event.buildingsBuiltDelta) {
      nextVal = Math.min(task.target, prevVal + event.buildingsBuiltDelta);
    } else if (task.type === 'survive_nights' && event.consecutiveNightsSurvived !== undefined) {
      nextVal = Math.min(task.target, Math.max(prevVal, event.consecutiveNightsSurvived));
    } else if (task.type === 'score_run' && event.runScore !== undefined) {
      nextVal = Math.min(task.target, Math.max(prevVal, event.runScore));
    }

    nextProgress[task.id] = nextVal;
    if (!wasComplete && nextVal >= task.target) {
      newlyCompletedTaskTitles.push(task.title);
      bonusCoinsAdded += task.rewardCoins;
      bonusXpAdded += task.rewardXp;
    }
  }

  // Optional finite bonus tasks (capped once per UTC day, small XP only, no farming resources)
  const nextBonusProgress = { ...(state.bonusTaskProgress || {}) };
  const nextBonusClaimed = new Set(state.bonusXpClaimedIds || []);
  for (const bTask of state.bonusTasks || DEFAULT_BONUS_TASKS) {
    const prevB = nextBonusProgress[bTask.id] ?? 0;
    let nextB = prevB;
    if (bTask.id === 'bonus_slay_12' && event.zombiesDefeatedDelta) {
      nextB = Math.min(bTask.target, prevB + event.zombiesDefeatedDelta);
    } else if (bTask.id === 'bonus_flare_3' && event.flaresUsedDelta) {
      nextB = Math.min(bTask.target, prevB + event.flaresUsedDelta);
    }
    nextBonusProgress[bTask.id] = nextB;
    if (nextB >= bTask.target && !nextBonusClaimed.has(bTask.id)) {
      nextBonusClaimed.add(bTask.id);
      bonusXpAdded += bTask.rewardXp;
    }
  }

  const allCompleted = state.tasks.every((t) => (nextProgress[t.id] ?? 0) >= t.target);
  const allThreeJustCompleted = allCompleted && !state.allTasksBonusClaimed;

  if (allThreeJustCompleted) {
    bonusCoinsAdded += 100;
    bonusXpAdded += 120;
  }
  const pendingBonusTicketsTomorrow = 0;

  const updatedXp = state.xp + bonusXpAdded;
  const levelInfo = getLevelForXp(updatedXp);
  const cosmetics = new Set(state.cosmetics);
  const titles = new Set(state.unlockedTitles);

  LEVEL_REWARDS.forEach((lr) => {
    if (levelInfo.level >= lr.level) {
      if (lr.unlockCosmeticId) cosmetics.add(lr.unlockCosmeticId);
      if (lr.unlockTitle) titles.add(lr.unlockTitle);
    }
  });

  const nextToolTier = Math.max(state.toolTier || 1, levelInfo.level >= 3 ? 2 : 1);

  return {
    updatedState: {
      ...state,
      coins: state.coins + bonusCoinsAdded,
      xp: updatedXp,
      level: levelInfo.level,
      toolTier: nextToolTier,
      taskProgress: nextProgress,
      allTasksBonusClaimed: state.allTasksBonusClaimed || allThreeJustCompleted,
      dailyProgressionLocked: state.dailyProgressionLocked || allCompleted,
      pendingBonusTicketsTomorrow,
      bonusTaskProgress: nextBonusProgress,
      bonusXpClaimedIds: Array.from(nextBonusClaimed),
      cosmetics: Array.from(cosmetics),
      unlockedTitles: Array.from(titles),
    },
    newlyCompletedTaskTitles,
    allThreeJustCompleted,
  };
}

/**
 * Claims today's Daily Check-In reward once per UTC day after the player has completed
 * their first non-Free-Play, non-Dev-Test run of the UTC day.
 */
export function claimDailyCheckIn(
  state: DailyPersistenceState,
  nowMs: number = Date.now(),
  options?: { isDevTestMode?: boolean }
): {
  updatedState: DailyPersistenceState;
  claimed: boolean;
  coinsAdded: number;
  xpAdded: number;
  reason?: 'not_eligible_yet' | 'already_claimed_today' | 'dev_test_isolated';
} {
  if (options?.isDevTestMode) {
    return {
      updatedState: state,
      claimed: false,
      coinsAdded: 0,
      xpAdded: 0,
      reason: 'dev_test_isolated',
    };
  }
  const todayUTC = getUTCDateString(nowMs);
  if (state.lastCheckInClaimedDateUTC === todayUTC) {
    return {
      updatedState: state,
      claimed: false,
      coinsAdded: 0,
      xpAdded: 0,
      reason: 'already_claimed_today',
    };
  }
  if (state.checkInEligibleDateUTC !== todayUTC) {
    return {
      updatedState: state,
      claimed: false,
      coinsAdded: 0,
      xpAdded: 0,
      reason: 'not_eligible_yet',
    };
  }

  const newXp = state.xp + DAILY_CHECKIN_REWARD.xp;
  const levelInfo = getLevelForXp(newXp);
  const nextToolTier = Math.max(state.toolTier || 1, levelInfo.level >= 3 ? 2 : 1);

  const updatedState: DailyPersistenceState = {
    ...state,
    coins: state.coins + DAILY_CHECKIN_REWARD.coins,
    xp: newXp,
    level: levelInfo.level,
    toolTier: nextToolTier,
    lastCheckInClaimedDateUTC: todayUTC,
    checkInEligibleDateUTC: todayUTC,
  };

  return {
    updatedState,
    claimed: true,
    coinsAdded: DAILY_CHECKIN_REWARD.coins,
    xpAdded: DAILY_CHECKIN_REWARD.xp,
  };
}

/**
 * Evaluates end-of-run XP, player level-ups, and any unclaimed streak milestones.
 * Daily streak is recorded when a normal run starts.
 * Also restores saved persistent fort structures & fences to full HP so combat damage during
 * a run never permanently erases structures or upgrades.
 * In Demo / Dev Test mode, grants 0 repeatable XP/coins and does not modify streak,
 * daily tasks, check-in eligibility, or production unlocks.
 */
export function completeRunProgression(
  state: DailyPersistenceState,
  params: {
    score: number;
    victory: boolean;
    nightsSurvived: number;
    isDevTestMode?: boolean;
    nowMs?: number;
  }
): {
  updatedState: DailyPersistenceState;
  summary: RunCompletionSummary;
} {
  const nowMs = params.nowMs ?? Date.now();
  const todayUTC = getUTCDateString(nowMs);
  const isDevTestMode = Boolean(params.isDevTestMode);

  if (isDevTestMode) {
    const levelInfo = getLevelForXp(state.xp);
    const completedTasksCount = state.tasks.filter(
      (t) => (state.taskProgress[t.id] ?? 0) >= t.target
    ).length;
    const checkInClaimedToday = state.lastCheckInClaimedDateUTC === todayUTC;
    const checkInAvailableToClaim =
      !checkInClaimedToday &&
      (state.checkInEligibleDateUTC === todayUTC);

    return {
      updatedState: state,
      summary: {
        xpGained: 0,
        coinsGained: 0,
        previousLevel: state.level,
        newLevel: state.level,
        levelProgressPct: levelInfo.progressPct,
        currentLevelXp: levelInfo.currentLevelXp,
        nextLevelXp: levelInfo.nextLevelXp,
        nextRewardLabel: levelInfo.nextRewardLabel,
        streak: state.streak,
        streakIncrementedToday: false,
        ticketsLeft: state.tickets,
        completedTasksCount,
        totalTasksCount: state.tasks.length,
        allTasksBonusClaimed: state.allTasksBonusClaimed,
        dailyProgressionLocked: state.dailyProgressionLocked,
        pendingBonusTicketsTomorrow: state.pendingBonusTicketsTomorrow,
        newUnlocks: [],
        isDevTestMode: true,
        checkInAvailableToClaim,
        checkInClaimedToday,
      },
    };
  }

  // Restore saved fort & fences to full HP between runs
  const restoredSavedPads = serializePadsForPersistence(
    restorePadsFromPersistence(state.savedPads, true)
  );
  const restoredSavedFences = serializeFenceSegmentsForPersistence(
    restoreFenceSegmentsFromPersistence(state.savedFenceSegments, true)
  );

  // 1. Update score & survival tasks first
  const taskStep = recordTaskProgress(state, {
    runScore: params.score,
    consecutiveNightsSurvived: params.nightsSurvived,
  });
  const working = taskStep.updatedState;

  // 2. Calculate XP gained from run
  const baseRunXp = Math.max(25, Math.round(params.score * 0.12));
  const nightBonusXp = params.nightsSurvived * 35;
  const victoryBonusXp = params.victory ? 120 : 0;
  const totalRunXpGained = baseRunXp + nightBonusXp + victoryBonusXp;

  const prevLevel = working.level;
  const newXp = working.xp + totalRunXpGained;
  const levelInfo = getLevelForXp(newXp);

  // Streak is recorded on run start, never again on completion (including across UTC midnight).
  const newStreak = working.streak;
  const streakIncrementedToday = false;
  const bestStreak = Math.max(working.bestStreak, newStreak);

  // 4. Unlocks from Level & Streak Milestones (3 / 7 / 30)
  const cosmetics = new Set(working.cosmetics);
  const titles = new Set(working.unlockedTitles);
  const claimedMilestones = new Set(working.claimedStreakMilestones);
  const newUnlocks: string[] = [];
  let extraCoins = Math.round(params.score * 0.04) + (params.victory ? 40 : 10);

  for (const lr of LEVEL_REWARDS) {
    if (lr.level > prevLevel && lr.level <= levelInfo.level) {
      extraCoins += lr.coinsBonus;
      if (lr.unlockCosmeticId) cosmetics.add(lr.unlockCosmeticId);
      if (lr.unlockTitle) titles.add(lr.unlockTitle);
      newUnlocks.push(`Level ${lr.level}: ${lr.rewardLabel}`);
    }
  }

  for (const ms of STREAK_MILESTONES) {
    if (newStreak >= ms.days && !claimedMilestones.has(ms.days)) {
      claimedMilestones.add(ms.days);
      extraCoins += ms.coins;
      if (ms.cosmeticId) cosmetics.add(ms.cosmeticId);
      if (ms.title) titles.add(ms.title);
      newUnlocks.push(ms.label);
    }
  }

  const completedTasksCount = working.tasks.filter(
    (t) => (working.taskProgress[t.id] ?? 0) >= t.target
  ).length;
  const nextToolTier = Math.max(working.toolTier || 1, levelInfo.level >= 3 ? 2 : 1);
  const checkInClaimedToday = working.lastCheckInClaimedDateUTC === todayUTC;

  const updatedState: DailyPersistenceState = {
    ...working,
    xp: newXp,
    level: levelInfo.level,
    toolTier: nextToolTier,
    coins: working.coins + extraCoins,
    streak: newStreak,
    bestStreak,
    checkInEligibleDateUTC: todayUTC,
    savedPads: restoredSavedPads,
    savedFenceSegments: restoredSavedFences,
    cosmetics: Array.from(cosmetics),
    unlockedTitles: Array.from(titles),
    claimedStreakMilestones: Array.from(claimedMilestones),
  };

  return {
    updatedState,
    summary: {
      xpGained: totalRunXpGained,
      coinsGained: extraCoins,
      previousLevel: prevLevel,
      newLevel: levelInfo.level,
      levelProgressPct: levelInfo.progressPct,
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      nextRewardLabel: levelInfo.nextRewardLabel,
      streak: newStreak,
      streakIncrementedToday,
      ticketsLeft: updatedState.tickets,
      completedTasksCount,
      totalTasksCount: updatedState.tasks.length,
      allTasksBonusClaimed: updatedState.allTasksBonusClaimed,
      dailyProgressionLocked: updatedState.dailyProgressionLocked,
      pendingBonusTicketsTomorrow: updatedState.pendingBonusTicketsTomorrow,
      newUnlocks,
      isDevTestMode: false,
      checkInAvailableToClaim: !checkInClaimedToday,
      checkInClaimedToday,
    },
  };
}

export const REVIEW_GRANT_TICKETS = MAX_DAILY_TICKETS;
export const DEV_TEST_FORT_STORAGE_KEY = 'build_or_bite_dev_test_fort_v1';

/**
 * Returns true only in verified non-production environments:
 * - Local / AI Studio Preview development builds (`isDevBuild === true`)
 * - Vercel Preview deployments (`vercelEnv === 'preview'`)
 * Strictly false in Production (`isDevBuild === false` and `vercelEnv !== 'preview'`).
 */
export function canShowDevTestControl(
  isDevBuild: boolean,
  vercelEnv?: string
): boolean {
  if (vercelEnv === 'production') return false;
  return Boolean(isDevBuild) || vercelEnv === 'preview';
}

/**
 * Enables the isolated Test Run only in local/preview builds or a Devvit prerelease
 * (identified by its four-part app version). Production app versions can never enable it.
 */
export function isDevelopmentTestMode(
  isDevBuild: boolean,
  search: string,
  manualTestRunActive = false,
  vercelEnv?: string,
  isDevvitPlaytest = false
): boolean {
  if (vercelEnv === 'production') return false;
  if (!canShowDevTestControl(isDevBuild, vercelEnv) && !isDevvitPlaytest) return false;
  if (manualTestRunActive) return true;
  const params = new URLSearchParams(search);
  return params.get('devTest') === '1' || params.get('demo') === '1';
}

export function shouldLockDailyProgression(
  dailyProgressionLocked: boolean,
  devTestMode: boolean
): boolean {
  return dailyProgressionLocked && !devTestMode;
}

export function shouldConsumeTicketForStart(devTestMode: boolean): boolean {
  return !devTestMode;
}

export interface DevTestFortSnapshot {
  savedPads: DailyPersistenceState['savedPads'];
  savedFenceSegments: DailyPersistenceState['savedFenceSegments'];
  savedResources: DailyPersistenceState['savedResources'];
}

/**
 * Loads the isolated Demo / Dev Test fort & resource wallet from its dedicated localStorage key,
 * seeding from the player's current fort without ever mutating the production profile.
 */
export function loadDevTestFortFromStorage(
  fallbackState: DailyPersistenceState
): DevTestFortSnapshot {
  const defaultSnapshot: DevTestFortSnapshot = {
    savedPads: serializePadsForPersistence(restorePadsFromPersistence(fallbackState.savedPads, true)),
    savedFenceSegments: serializeFenceSegmentsForPersistence(
      restoreFenceSegmentsFromPersistence(fallbackState.savedFenceSegments, true)
    ),
    savedResources: {
      wood: fallbackState.savedResources?.wood ?? INITIAL_RESOURCES.wood,
      stone: fallbackState.savedResources?.stone ?? INITIAL_RESOURCES.stone,
      food: fallbackState.savedResources?.food ?? INITIAL_RESOURCES.food,
    },
  };
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultSnapshot;
  }
  try {
    const raw = window.localStorage.getItem(DEV_TEST_FORT_STORAGE_KEY);
    if (!raw) {
      return defaultSnapshot;
    }
    const parsed = JSON.parse(raw);
    const pads = restorePadsFromPersistence(parsed?.savedPads, true);
    const fences = restoreFenceSegmentsFromPersistence(parsed?.savedFenceSegments, true);
    const res =
      parsed?.savedResources &&
      typeof parsed.savedResources.wood === 'number' &&
      typeof parsed.savedResources.stone === 'number' &&
      typeof parsed.savedResources.food === 'number'
        ? {
            wood: Math.max(0, Math.round(parsed.savedResources.wood)),
            stone: Math.max(0, Math.round(parsed.savedResources.stone)),
            food: Math.max(0, Math.round(parsed.savedResources.food)),
          }
        : defaultSnapshot.savedResources;
    return {
      savedPads: serializePadsForPersistence(pads),
      savedFenceSegments: serializeFenceSegmentsForPersistence(fences),
      savedResources: res,
    };
  } catch {
    return defaultSnapshot;
  }
}

export function saveDevTestFortToStorage(
  pads: PlacementPad[],
  fenceSegments: FenceSegment[],
  resources: Pick<Resources, 'wood' | 'stone' | 'food'>
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const payload: DevTestFortSnapshot = {
      savedPads: serializePadsForPersistence(
        restorePadsFromPersistence(serializePadsForPersistence(pads), true)
      ),
      savedFenceSegments: serializeFenceSegmentsForPersistence(
        restoreFenceSegmentsFromPersistence(serializeFenceSegmentsForPersistence(fenceSegments), true)
      ),
      savedResources: {
        wood: Math.max(0, Math.round(resources.wood)),
        stone: Math.max(0, Math.round(resources.stone)),
        food: Math.max(0, Math.round(resources.food)),
      },
    };
    window.localStorage.setItem(DEV_TEST_FORT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Safely deletes the isolated local Demo / Dev Test fort data without touching the normal production save.
 */
export function clearDevTestFortFromStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(DEV_TEST_FORT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Normalizes tickets within today's authoritative remaining allowance:
 * max(0, MAX_DAILY_TICKETS - ticketsUsedTodayUTC). Never grants more than 3 tickets on the same UTC day.
 */
export function grantReviewTickets(
  state: DailyPersistenceState,
  amount = 1
): DailyPersistenceState {
  const safeAmount = Math.max(0, Math.round(amount));
  const used =
    typeof state.ticketsUsedTodayUTC === 'number' && Number.isFinite(state.ticketsUsedTodayUTC)
      ? Math.max(0, Math.min(MAX_DAILY_TICKETS, Math.round(state.ticketsUsedTodayUTC)))
      : Math.max(0, MAX_DAILY_TICKETS - Math.min(MAX_DAILY_TICKETS, Math.max(0, state.tickets)));
  const cappedTickets = computeRemainingDailyTickets(used, state.tickets + safeAmount);
  return {
    ...state,
    tickets: cappedTickets,
    ticketsUsedTodayUTC: used,
  };
}

export function loadDailyStateFromStorage(nowMs: number = Date.now()): DailyPersistenceState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultDailyState(nowMs);
  }
  try {
    const raw = window.localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultDailyState(nowMs);
      saveDailyStateToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Preserve a traceable, non-destructive backup once before normalizing a legacy save with >3 tickets
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.tickets === 'number' &&
      parsed.tickets > MAX_DAILY_TICKETS &&
      !window.localStorage.getItem(LEGACY_TICKET_BACKUP_KEY)
    ) {
      window.localStorage.setItem(
        LEGACY_TICKET_BACKUP_KEY,
        JSON.stringify({
          backedUpAtUTC: new Date(nowMs).toISOString(),
          legacyState: parsed,
        })
      );
    }
    const migrated = migrateDailyState(parsed, nowMs);
    const resetChecked = checkAndApplyDailyReset(migrated, nowMs);
    saveDailyStateToStorage(resetChecked);
    return resetChecked;
  } catch {
    return createDefaultDailyState(nowMs);
  }
}

export function saveDailyStateToStorage(state: DailyPersistenceState): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) {
      window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Keep the server-backed Reddit save path available even if local cache storage fails.
  }
  try {
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DAILY_STATE_SAVED_EVENT, { detail: state }));
    }
  } catch {
    // Ignore environments that do not support custom events.
  }
}
