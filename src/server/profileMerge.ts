import { migrateDailyState } from '../game/dailySystem';
import type { DailyPersistenceState } from '../game/types';
import { isCurrentDayFortSnapshot } from './playerPolicy';

const MAX_SAVED_RESOURCE = 9999;

export function mergeClientSaveFields(
  current: DailyPersistenceState,
  incoming: unknown,
  nowMs: number
): DailyPersistenceState {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new Error('Invalid player data.');
  }
  const candidate = migrateDailyState(incoming, nowMs);
  const source = incoming as Record<string, unknown>;
  // Reject yesterday's fort snapshot after a UTC reset, including a run that crossed midnight.
  const sameDay = isCurrentDayFortSnapshot(source.lastResetDateUTC, current.lastResetDateUTC);
  const rawResources =
    source.savedResources && typeof source.savedResources === 'object'
      ? (source.savedResources as Record<string, unknown>)
      : {};
  const boundedResource = (value: unknown, fallback: number): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.max(0, Math.min(MAX_SAVED_RESOURCE, Math.round(value)));
  };

  // Progression, XP, coins, tasks, streaks, unlocks, ticket counts and check-in
  // claims are never accepted from the browser. Only fort snapshots, bounded
  // resource values and selections already unlocked on this server are mutable here.
  return {
    ...current,
    savedPads: sameDay ? candidate.savedPads : current.savedPads,
    savedFenceSegments: sameDay ? candidate.savedFenceSegments : current.savedFenceSegments,
    savedResources: sameDay ? {
      wood: boundedResource(rawResources.wood, current.savedResources.wood),
      stone: boundedResource(rawResources.stone, current.savedResources.stone),
      food: boundedResource(rawResources.food, current.savedResources.food),
    } : current.savedResources,
    equippedLanternId:
      typeof source.equippedLanternId === 'string' && current.cosmetics.includes(source.equippedLanternId)
        ? source.equippedLanternId
        : current.equippedLanternId,
    equippedTitle:
      typeof source.equippedTitle === 'string' && current.unlockedTitles.includes(source.equippedTitle)
        ? source.equippedTitle
        : current.equippedTitle,
  };
}
