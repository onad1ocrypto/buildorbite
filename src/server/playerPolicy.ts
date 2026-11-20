export const SERVER_DAILY_TICKET_CAP = 3;
export const SERVER_RUN_SCORE_CAP = 8000;

export interface ServerTicketSnapshot {
  ticketsUsedTodayUTC: number;
  ticketsRemaining: number;
}

export function getServerTicketSnapshot(value: unknown): ServerTicketSnapshot {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  const ticketsUsedTodayUTC = Number.isFinite(numeric)
    ? Math.max(0, Math.min(SERVER_DAILY_TICKET_CAP, Math.floor(numeric)))
    : 0;
  return {
    ticketsUsedTodayUTC,
    ticketsRemaining: Math.max(0, SERVER_DAILY_TICKET_CAP - ticketsUsedTodayUTC),
  };
}

export function isValidRunId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

export function sanitizeProgressEvent(value: unknown): {
  woodCollectedDelta?: number;
  flaresUsedDelta?: number;
  buildingsBuiltDelta?: number;
  consecutiveNightsSurvived?: number;
  runScore?: number;
  zombiesDefeatedDelta?: number;
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const src = value as Record<string, unknown>;
  const numeric = (key: string, max: number): number | undefined => {
    const raw = src[key];
    if (raw === undefined) return undefined;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return NaN;
    return Math.max(0, Math.min(max, Math.floor(raw)));
  };
  const event = {
    woodCollectedDelta: numeric('woodCollectedDelta', 1000),
    flaresUsedDelta: numeric('flaresUsedDelta', 1),
    buildingsBuiltDelta: numeric('buildingsBuiltDelta', 1),
    consecutiveNightsSurvived: numeric('consecutiveNightsSurvived', 3),
    runScore: numeric('runScore', SERVER_RUN_SCORE_CAP),
    zombiesDefeatedDelta: numeric('zombiesDefeatedDelta', 1),
  };
  if (Object.values(event).some((item) => typeof item === 'number' && !Number.isFinite(item))) return null;
  if (!Object.values(event).some((item) => typeof item === 'number' && item > 0)) return null;
  return event;
}

export function sanitizeRunResult(value: unknown): {
  score: number;
  victory: boolean;
  nightsSurvived: number;
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const src = value as Record<string, unknown>;
  if (typeof src.score !== 'number' || !Number.isFinite(src.score)) return null;
  if (typeof src.victory !== 'boolean') return null;
  if (typeof src.nightsSurvived !== 'number' || !Number.isFinite(src.nightsSurvived)) return null;
  const nightsSurvived = Math.max(0, Math.min(src.endedEarly === true ? 2 : 3, Math.floor(src.nightsSurvived)));
  return {
    score: Math.max(0, Math.min(SERVER_RUN_SCORE_CAP, Math.floor(src.score))),
    victory: src.victory && src.endedEarly !== true && nightsSurvived >= 3,
    nightsSurvived,
  };
}

/** Old-day snapshots cannot overwrite a fort reset at UTC midnight. */
export function isCurrentDayFortSnapshot(snapshotDate: unknown, currentDate: string): boolean {
  return typeof snapshotDate === 'string' && snapshotDate === currentDate;
}
