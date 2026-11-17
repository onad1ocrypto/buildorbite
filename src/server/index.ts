import { serve } from '@hono/node-server';
import { context, createServer, getServerPort, redis } from '@devvit/web/server';
import { Hono } from 'hono';
import {
  checkAndApplyDailyReset,
  createDefaultDailyState,
  getUTCDateString,
  migrateDailyState,
} from '../game/dailySystem';
import type { DailyPersistenceState } from '../game/types';
import { getServerTicketSnapshot, isValidRunId, SERVER_DAILY_TICKET_CAP } from './playerPolicy';

const app = new Hono();
const PLAYER_KEY_PREFIX = 'build-or-bite:v1:player';
const RUN_ID_TTL_MS = 48 * 60 * 60 * 1000;

function getUserId(): string | null {
  const userId = context.userId;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

function playerProfileKey(userId: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:daily`;
}

function dailyTicketCounterKey(userId: string, utcDate: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:tickets:${utcDate}`;
}

function runIdKey(userId: string, utcDate: string, runId: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:run:${utcDate}:${runId}`;
}

function applyServerTicketCount(
  state: DailyPersistenceState,
  ticketsUsedTodayUTC: number,
  utcDate: string
): DailyPersistenceState {
  const ticketSnapshot = getServerTicketSnapshot(ticketsUsedTodayUTC);
  return {
    ...state,
    tickets: ticketSnapshot.ticketsRemaining,
    ticketsUsedTodayUTC: ticketSnapshot.ticketsUsedTodayUTC,
    maxDailyTickets: SERVER_DAILY_TICKET_CAP,
    lastResetDateUTC: utcDate,
  };
}

async function getTicketsUsedToday(userId: string, utcDate: string): Promise<number> {
  const raw = await redis.get(dailyTicketCounterKey(userId, utcDate));
  return getServerTicketSnapshot(raw).ticketsUsedTodayUTC;
}

async function loadProfile(userId: string, nowMs: number): Promise<DailyPersistenceState> {
  const utcDate = getUTCDateString(nowMs);
  const raw = await redis.get(playerProfileKey(userId));
  let state: DailyPersistenceState;

  if (raw === undefined) {
    state = createDefaultDailyState(nowMs);
  } else {
    // Fail closed on malformed Redis data; do not overwrite a possibly recoverable save.
    const parsed: unknown = JSON.parse(raw);
    state = migrateDailyState(parsed, nowMs);
  }

  state = checkAndApplyDailyReset(state, nowMs);
  state = applyServerTicketCount(state, await getTicketsUsedToday(userId, utcDate), utcDate);
  await redis.set(playerProfileKey(userId), JSON.stringify(state));
  return state;
}

app.get('/api/health', (c) => c.json({ ok: true }));

// Reddit identity is supplied by Devvit. The raw user ID stays on the server
// and is used only as the key namespace for this user's game save.
app.get('/api/session', (c) => {
  return c.json({ authenticated: Boolean(getUserId()) });
});

// First-time Reddit players receive a clean profile: 0 XP, Level 1, and 3 tickets.
app.get('/api/profile', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);

  try {
    return c.json({ daily: await loadProfile(userId, Date.now()) });
  } catch {
    return c.json({ error: 'Player data could not be loaded safely.' }, 500);
  }
});

// The client may save game progress, but tickets and reset date are always
// overwritten from the server's UTC ticket counter.
app.put('/api/profile', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);

  try {
    const incoming: unknown = await c.req.json();
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return c.json({ error: 'Invalid player data.' }, 400);
    }

    const nowMs = Date.now();
    const utcDate = getUTCDateString(nowMs);
    const state = checkAndApplyDailyReset(migrateDailyState(incoming, nowMs), nowMs);
    const authoritative = applyServerTicketCount(
      state,
      await getTicketsUsedToday(userId, utcDate),
      utcDate
    );
    await redis.set(playerProfileKey(userId), JSON.stringify(authoritative));
    return c.json({ ok: true, daily: authoritative });
  } catch {
    return c.json({ error: 'Player data could not be saved safely.' }, 400);
  }
});

// Ticket spending is server-side, keyed by Reddit user and UTC day. INCRBY is
// atomic; over-limit increments are rolled back before the request is rejected.
app.post('/api/runs/start', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ allowed: false, reason: 'session_required' }, 401);

  let runId = '';
  try {
    const body = (await c.req.json()) as { runId?: unknown };
    if (typeof body?.runId === 'string') runId = body.runId;
  } catch {
    return c.json({ allowed: false, reason: 'invalid_request' }, 400);
  }
  if (!isValidRunId(runId)) {
    return c.json({ allowed: false, reason: 'invalid_run_id' }, 400);
  }

  const nowMs = Date.now();
  const utcDate = getUTCDateString(nowMs);
  const ticketKey = dailyTicketCounterKey(userId, utcDate);
  const idempotencyKey = runIdKey(userId, utcDate, runId);
  const expiresAt = new Date(nowMs + RUN_ID_TTL_MS);

  try {
    const reservation = await redis.set(idempotencyKey, 'pending', {
      nx: true,
      expiration: expiresAt,
    });
    if (reservation !== 'OK') {
      const prior = await redis.get(idempotencyKey);
      const used = await getTicketsUsedToday(userId, utcDate);
      if (prior === 'accepted') {
        return c.json({
          allowed: true,
          alreadyStarted: true,
          ticketsUsedTodayUTC: used,
          ticketsRemaining: getServerTicketSnapshot(used).ticketsRemaining,
          utcDate,
        });
      }
      return c.json({ allowed: false, reason: 'request_pending' }, 409);
    }

    const incrementedUsage = await redis.incrBy(ticketKey, 1);
    if (incrementedUsage > SERVER_DAILY_TICKET_CAP) {
      await redis.incrBy(ticketKey, -1);
      await redis.del(idempotencyKey);
      return c.json({
        allowed: false,
        reason: 'no_tickets',
        ticketsUsedTodayUTC: SERVER_DAILY_TICKET_CAP,
        ticketsRemaining: 0,
        utcDate,
      }, 409);
    }

    await redis.expire(ticketKey, Math.ceil(RUN_ID_TTL_MS / 1000));
    await redis.set(idempotencyKey, 'accepted', { expiration: expiresAt });
    return c.json({
      allowed: true,
      alreadyStarted: false,
      ticketsUsedTodayUTC: incrementedUsage,
      ticketsRemaining: getServerTicketSnapshot(incrementedUsage).ticketsRemaining,
      utcDate,
    });
  } catch {
    return c.json({ allowed: false, reason: 'ticket_service_unavailable' }, 503);
  }
});

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
