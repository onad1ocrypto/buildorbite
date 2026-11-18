import test from 'node:test';
import assert from 'node:assert/strict';
import { isDevvitPlaytestVersion } from './devvitEnvironment';

test('Devvit playtest versions have a fourth numeric segment; production versions do not', () => {
  assert.equal(isDevvitPlaytestVersion('0.0.1.12'), true);
  assert.equal(isDevvitPlaytestVersion('1.2.3.4'), true);
  assert.equal(isDevvitPlaytestVersion('0.0.1'), false);
  assert.equal(isDevvitPlaytestVersion(''), false);
  assert.equal(isDevvitPlaytestVersion(undefined), false);
});
