import {
  DailyPersistenceState,
  DailyTaskItem,
  LanternCosmeticSpec,
  LevelRewardSpec,
  RunCompletionSummary,
  StreakMilestoneSpec,
} from './types';

export const DAILY_STORAGE_KEY = 'build_or_bite_daily_v1';
export const MAX_DAILY_TICKETS = 3;

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

  return {
    schemaVersion: 1,
    tickets: MAX_DAILY_TICKETS,
    maxDailyTickets: MAX_DAILY_TICKETS,
    pendingBonusTicketsTomorrow: 0,
    coins: 50,
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastResetDateUTC: todayUTC,
    lastPlayedDateUTC: null,
    tasks,
    taskProgress,
    allTasksBonusClaimed: false,
    cosmetics: ['amber_default'],
    equippedLanternId: 'amber_default',
    unlockedTitles: ['Rookie Ranger'],
    equippedTitle: 'Rookie Ranger',
    claimedStreakMilestones: [],
  };
}

/**
 * Applies the 00:00 UTC daily reset:
 * - Refills tickets to 3 (capped at 3; unused tickets do NOT carry over, plus any bonus ticket earned from yesterday's 3/3 task completion).
 * - Refreshes the 3 daily tasks and resets taskProgress.
 * - Resets streak to 0 if the player missed a full UTC day.
 */
export function checkAndApplyDailyReset(
  state: DailyPersistenceState,
  nowMs: number = Date.now()
): DailyPersistenceState {
  const todayUTC = getUTCDateString(nowMs);
  if (state.lastResetDateUTC === todayUTC) {
    return state;
  }

  const tasks = selectDailyTasksForDate(todayUTC);
  const taskProgress: Record<string, number> = {};
  tasks.forEach((t) => {
    taskProgress[t.id] = 0;
  });

  // Check if streak expired (if lastPlayedDateUTC is more than 1 day before todayUTC)
  let updatedStreak = state.streak;
  if (state.lastPlayedDateUTC) {
    const daysSincePlayed = getUTCDayDifference(state.lastPlayedDateUTC, todayUTC);
    if (daysSincePlayed > 1) {
      updatedStreak = 0;
    }
  } else {
    updatedStreak = 0;
  }

  // Unused tickets do NOT carry over (cap base refill at 3, plus any +1 tomorrow bonus earned yesterday)
  const refilledTickets = MAX_DAILY_TICKETS + (state.pendingBonusTicketsTomorrow || 0);

  return {
    ...state,
    tickets: refilledTickets,
    pendingBonusTicketsTomorrow: 0,
    streak: updatedStreak,
    lastResetDateUTC: todayUTC,
    tasks,
    taskProgress,
    allTasksBonusClaimed: false,
  };
}

export function consumeTicketForRun(state: DailyPersistenceState): {
  updatedState: DailyPersistenceState;
  allowed: boolean;
} {
  if (state.tickets <= 0) {
    return { updatedState: state, allowed: false };
  }
  return {
    updatedState: {
      ...state,
      tickets: state.tickets - 1,
    },
    allowed: true,
  };
}

/**
 * Updates live task progress during or at the end of a run.
 */
export function recordTaskProgress(
  state: DailyPersistenceState,
  event: {
    woodCollectedDelta?: number;
    flaresUsedDelta?: number;
    buildingsBuiltDelta?: number;
    consecutiveNightsSurvived?: number;
    runScore?: number;
  }
): {
  updatedState: DailyPersistenceState;
  newlyCompletedTaskTitles: string[];
  allThreeJustCompleted: boolean;
} {
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

  const allCompleted = state.tasks.every((t) => (nextProgress[t.id] ?? 0) >= t.target);
  const allThreeJustCompleted = allCompleted && !state.allTasksBonusClaimed;

  let pendingBonusTicketsTomorrow = state.pendingBonusTicketsTomorrow;
  if (allThreeJustCompleted) {
    bonusCoinsAdded += 100;
    bonusXpAdded += 120;
    pendingBonusTicketsTomorrow += 1;
  }

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

  return {
    updatedState: {
      ...state,
      coins: state.coins + bonusCoinsAdded,
      xp: updatedXp,
      level: levelInfo.level,
      taskProgress: nextProgress,
      allTasksBonusClaimed: state.allTasksBonusClaimed || allThreeJustCompleted,
      pendingBonusTicketsTomorrow,
      cosmetics: Array.from(cosmetics),
      unlockedTitles: Array.from(titles),
    },
    newlyCompletedTaskTitles,
    allThreeJustCompleted,
  };
}

/**
 * Evaluates end-of-run XP, player level-ups, daily streak (+1 on first run of the UTC day),
 * and 3 / 7 / 30 day streak milestones.
 */
export function completeRunProgression(
  state: DailyPersistenceState,
  params: {
    score: number;
    victory: boolean;
    nightsSurvived: number;
    nowMs?: number;
  }
): {
  updatedState: DailyPersistenceState;
  summary: RunCompletionSummary;
} {
  const nowMs = params.nowMs ?? Date.now();
  const todayUTC = getUTCDateString(nowMs);

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

  // 3. Streak update (+1 if first completed run today; reset to 1 if missed a day)
  let newStreak = working.streak;
  let streakIncrementedToday = false;
  if (working.lastPlayedDateUTC === todayUTC) {
    newStreak = working.streak;
  } else if (working.lastPlayedDateUTC) {
    const diff = getUTCDayDifference(working.lastPlayedDateUTC, todayUTC);
    if (diff === 1) {
      newStreak = working.streak + 1;
    } else {
      newStreak = 1;
    }
    streakIncrementedToday = true;
  } else {
    newStreak = 1;
    streakIncrementedToday = true;
  }

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

  const updatedState: DailyPersistenceState = {
    ...working,
    xp: newXp,
    level: levelInfo.level,
    coins: working.coins + extraCoins,
    streak: newStreak,
    bestStreak,
    lastPlayedDateUTC: todayUTC,
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
      pendingBonusTicketsTomorrow: updatedState.pendingBonusTicketsTomorrow,
      newUnlocks,
    },
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
    const parsed = JSON.parse(raw) as DailyPersistenceState;
    const resetChecked = checkAndApplyDailyReset(parsed, nowMs);
    saveDailyStateToStorage(resetChecked);
    return resetChecked;
  } catch {
    return createDefaultDailyState(nowMs);
  }
}

export function saveDailyStateToStorage(state: DailyPersistenceState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}
