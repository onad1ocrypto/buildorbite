export const SERVER_DAILY_TICKET_CAP = 3;

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
