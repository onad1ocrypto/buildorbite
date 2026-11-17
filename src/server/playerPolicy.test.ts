import assert from 'node:assert/strict';
import test from 'node:test';
import { getServerTicketSnapshot, isValidRunId } from './playerPolicy';

test('server ticket snapshot clamps persisted values to the daily cap', () => {
  assert.deepEqual(getServerTicketSnapshot(undefined), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
  assert.deepEqual(getServerTicketSnapshot('2'), { ticketsUsedTodayUTC: 2, ticketsRemaining: 1 });
  assert.deepEqual(getServerTicketSnapshot(99), { ticketsUsedTodayUTC: 3, ticketsRemaining: 0 });
  assert.deepEqual(getServerTicketSnapshot(-5), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
  assert.deepEqual(getServerTicketSnapshot('corrupt'), { ticketsUsedTodayUTC: 0, ticketsRemaining: 3 });
});

test('run IDs have bounded safe characters for Redis keys', () => {
  assert.equal(isValidRunId('run_12345678'), true);
  assert.equal(isValidRunId('short'), false);
  assert.equal(isValidRunId('invalid:123456'), false);
  assert.equal(isValidRunId('x'.repeat(81)), false);
});
