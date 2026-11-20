import test from 'node:test';
import assert from 'node:assert/strict';
import { CORNFIELD, cornfieldNearestRadius, MOAT_OUTER_BANK_RADIUS } from './worldLayout';

test('cornfield bed stays clear of the outside bank of the moat', () => {
  assert.ok(cornfieldNearestRadius() > MOAT_OUTER_BANK_RADIUS + 1);
  assert.ok(CORNFIELD.x > 0 && CORNFIELD.z < 0);
});
