import { serve } from '@hono/node-server';
import { context, createServer, getServerPort, redis, reddit } from '@devvit/web/server';
import { Hono } from 'hono';
import { mergeClientSaveFields } from './profileMerge';
import {
  checkAndApplyDailyReset,
  claimDailyCheckIn,
  completeRunProgression,
  createDefaultDailyState,
  getUTCDateString,
  migrateDailyState,
  recordStartedRun,
  recordTaskProgress,
} from '../game/dailySystem';
import type { DailyPersistenceState } from '../game/types';
import {
  getServerTicketSnapshot,
  isValidRunId,
  sanitizeProgressEvent,
  sanitizeRunResult,
  SERVER_DAILY_TICKET_CAP,
} from './playerPolicy';

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

function runIdKey(userId: string, runId: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:run:${runId}`;
}

function eventIdKey(userId: string, runId: string, eventId: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:event:${runId}:${eventId}`;
}

function completionKey(userId: string, runId: string): string {
  return `${PLAYER_KEY_PREFIX}:${userId}:complete:${runId}`;
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
  return getServerTicketSnapshot(await redis.get(dailyTicketCounterKey(userId, utcDate)))
    .ticketsUsedTodayUTC;
}

async function readStoredProfile(userId: string, nowMs: number): Promise<DailyPersistenceState> {
  const raw = await redis.get(playerProfileKey(userId));
  if (raw === undefined) return createDefaultDailyState(nowMs);
  // Fail closed on malformed Redis data; do not overwrite a possibly recoverable save.
  return migrateDailyState(JSON.parse(raw) as unknown, nowMs);
}

async function loadProfile(userId: string, nowMs: number): Promise<DailyPersistenceState> {
  const utcDate = getUTCDateString(nowMs);
  let state = checkAndApplyDailyReset(await readStoredProfile(userId, nowMs), nowMs);
  state = applyServerTicketCount(state, await getTicketsUsedToday(userId, utcDate), utcDate);
  await redis.set(playerProfileKey(userId), JSON.stringify(state));
  return state;
}


function sanitizeProgressPayload(value: unknown): {
  runId: string;
  eventId: string;
  event: NonNullable<ReturnType<typeof sanitizeProgressEvent>>;
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (!isValidRunId(body.runId) || !isValidRunId(body.eventId)) return null;
  const event = sanitizeProgressEvent(body.event);
  if (!event) return null;
  return { runId: body.runId, eventId: body.eventId, event };
}

app.get('/api/health', (c) => c.json({ ok: true }));

// The playtest installs the app, but a playable post must still be created in
// the subreddit. This moderator-only subreddit menu action creates that post.
app.post('/internal/menu/create-game-post', async (c) => {
  try {
    const subredditName = context.subredditName;
    if (!subredditName) {
      return c.json({ showToast: { text: 'Open this action from a subreddit.', appearance: 'neutral' } });
    }
    await reddit.submitCustomPost({
      subredditName,
      title: 'Build or Bite — Play the Game',
      entry: 'default',
      textFallback: {
        text: 'Build your fort by day. Defend it from the zombie horde by night. Play Build or Bite here on Reddit.',
      },
    });
    return c.json({
      showToast: { text: 'Build or Bite game post created. Open it from the community feed.', appearance: 'success' },
    });
  } catch (error) {
    console.error('Could not create Build or Bite post:', error);
    return c.json({ showToast: { text: 'Could not create the game post. Check app permissions and try again.', appearance: 'neutral' } }, 500);
  }
});

// Reddit identity is supplied by Devvit. The raw user ID stays on the server
// and is used only as the key namespace for this user's game save.
app.get('/api/session', (c) => c.json({ authenticated: Boolean(getUserId()) }));

app.get('/api/profile', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);
  try {
    return c.json({ daily: await loadProfile(userId, Date.now()) });
  } catch {
    return c.json({ error: 'Player data could not be loaded safely.' }, 500);
  }
});

app.put('/api/profile', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);
  try {
    const incoming: unknown = await c.req.json();
    const nowMs = Date.now();
    const utcDate = getUTCDateString(nowMs);
    let current = checkAndApplyDailyReset(await readStoredProfile(userId, nowMs), nowMs);
    const merged = mergeClientSaveFields(current, incoming, nowMs);
    const authoritative = applyServerTicketCount(
      merged,
      await getTicketsUsedToday(userId, utcDate),
      utcDate
    );
    await redis.set(playerProfileKey(userId), JSON.stringify(authoritative));
    return c.json({ ok: true, daily: authoritative });
  } catch {
    return c.json({ error: 'Player data could not be saved safely.' }, 400);
  }
});

app.post('/api/runs/start', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ allowed: false, reason: 'session_required' }, 401);
  let runId: unknown;
  try {
    const body = await c.req.json();
    runId = body?.runId;
  } catch {
    return c.json({ allowed: false, reason: 'invalid_request' }, 400);
  }
  if (!isValidRunId(runId)) return c.json({ allowed: false, reason: 'invalid_run_id' }, 400);

  const nowMs = Date.now();
  const utcDate = getUTCDateString(nowMs);
  const ticketKey = dailyTicketCounterKey(userId, utcDate);
  const idempotencyKey = runIdKey(userId, runId);
  const expiresAt = new Date(nowMs + RUN_ID_TTL_MS);

  try {
    const reservation = await redis.set(idempotencyKey, 'pending', { nx: true, expiration: expiresAt });
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
          daily: await loadProfile(userId, nowMs),
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
    const current = await readStoredProfile(userId, nowMs);
    const daily = applyServerTicketCount(recordStartedRun(current, nowMs), incrementedUsage, utcDate);
    await redis.set(playerProfileKey(userId), JSON.stringify(daily));
    await redis.set(idempotencyKey, 'accepted', { expiration: expiresAt });
    return c.json({
      daily,
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

// Only bounded gameplay measurements are accepted, and the server computes
// task progress/rewards itself. Daily tasks and bonus rewards are capped by
// their definitions and can only be changed during a server-authorized run.
app.post('/api/progress/event', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);
  let payload: ReturnType<typeof sanitizeProgressPayload>;
  try {
    payload = sanitizeProgressPayload(await c.req.json());
  } catch {
    return c.json({ error: 'Invalid progress event.' }, 400);
  }
  if (!payload) return c.json({ error: 'Invalid progress event.' }, 400);

  const runKey = runIdKey(userId, payload.runId);
  const eventKey = eventIdKey(userId, payload.runId, payload.eventId);
  const completeKey = completionKey(userId, payload.runId);
  const expiresAt = new Date(Date.now() + RUN_ID_TTL_MS);
  try {
    if ((await redis.get(runKey)) !== 'accepted') {
      return c.json({ error: 'Run is not active.' }, 409);
    }
    if (await redis.get(completeKey)) return c.json({ error: 'Run is already complete.' }, 409);
    const reservation = await redis.set(eventKey, 'processing', { nx: true, expiration: expiresAt });
    if (reservation !== 'OK') return c.json({ ok: true, duplicate: true });

    const nowMs = Date.now();
    const state = checkAndApplyDailyReset(await readStoredProfile(userId, nowMs), nowMs);
    const progress = recordTaskProgress(state, payload.event);
    const authoritative = applyServerTicketCount(
      progress.updatedState,
      await getTicketsUsedToday(userId, getUTCDateString(nowMs)),
      getUTCDateString(nowMs)
    );
    await redis.set(playerProfileKey(userId), JSON.stringify(authoritative));
    await redis.set(eventKey, 'accepted', { expiration: expiresAt });
    return c.json({ ok: true, daily: authoritative });
  } catch {
    // Keep the processing marker until its TTL to fail closed if Redis committed
    // the profile update but the acknowledgement failed.
    return c.json({ error: 'Progress could not be saved.' }, 503);
  }
});

app.post('/api/runs/complete', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid run result.' }, 400);
  }
  if (!isValidRunId(body.runId)) return c.json({ error: 'Invalid run ID.' }, 400);
  const result = sanitizeRunResult(body);
  if (!result) return c.json({ error: 'Invalid run result.' }, 400);

  const runKey = runIdKey(userId, body.runId);
  const resultKey = completionKey(userId, body.runId);
  const expiresAt = new Date(Date.now() + RUN_ID_TTL_MS);
  try {
    if ((await redis.get(runKey)) !== 'accepted') {
      return c.json({ error: 'Run was not authorized by the server.' }, 409);
    }
    const cached = await redis.get(resultKey);
    if (cached && cached !== 'processing') return c.json(JSON.parse(cached));
    const reservation = await redis.set(resultKey, 'processing', { nx: true, expiration: expiresAt });
    if (reservation !== 'OK') return c.json({ error: 'Run completion is already processing.' }, 409);

    const nowMs = Date.now();
    const utcDate = getUTCDateString(nowMs);
    let state = checkAndApplyDailyReset(await readStoredProfile(userId, nowMs), nowMs);
    if (body.daily !== undefined) state = mergeClientSaveFields(state, body.daily, nowMs);
    const completion = completeRunProgression(state, { ...result, nowMs });
    const authoritative = applyServerTicketCount(
      completion.updatedState,
      await getTicketsUsedToday(userId, utcDate),
      utcDate
    );
    const response = { daily: authoritative, summary: completion.summary };
    await redis.set(playerProfileKey(userId), JSON.stringify(authoritative));
    await redis.set(resultKey, JSON.stringify(response), { expiration: expiresAt });
    return c.json(response);
  } catch {
    // Keep the reservation until expiry: retrying after a partial Redis commit
    // must not grant the same run rewards twice.
    return c.json({ error: 'Run rewards could not be saved.' }, 503);
  }
});

app.post('/api/check-in/claim', async (c) => {
  const userId = getUserId();
  if (!userId) return c.json({ error: 'Reddit session required.' }, 401);
  try {
    const nowMs = Date.now();
    const utcDate = getUTCDateString(nowMs);
    const state = checkAndApplyDailyReset(await readStoredProfile(userId, nowMs), nowMs);
    const result = claimDailyCheckIn(state, nowMs);
    if (!result.claimed) {
      return c.json({ claimed: false, reason: result.reason, daily: state }, 409);
    }
    const authoritative = applyServerTicketCount(
      result.updatedState,
      await getTicketsUsedToday(userId, utcDate),
      utcDate
    );
    await redis.set(playerProfileKey(userId), JSON.stringify(authoritative));
    return c.json({ claimed: true, daily: authoritative });
  } catch {
    return c.json({ error: 'Check-in reward could not be claimed.' }, 503);
  }
});

serve({ fetch: app.fetch, createServer, port: getServerPort() });
