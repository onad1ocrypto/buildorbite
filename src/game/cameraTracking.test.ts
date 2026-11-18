import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraTrackingTarget } from './cameraTracking';

test('close zoom tracks Rue more closely while normal zoom keeps a fort view', () => {
  const normal = cameraTrackingTarget(5, 0, 1, false);
  const close = cameraTrackingTarget(5, 0, 0.62, false);
  assert.ok(normal.x < close.x);
  assert.ok(close.x > 4.5);
  assert.equal(normal.z, 0);
});

test('tracking follows distant hero and stays within map bounds', () => {
  const target = cameraTrackingTarget(-16.8, 16.8, 1, false);
  assert.ok(target.x <= -10.8 && target.z >= 10.8);
  assert.equal(cameraTrackingTarget(100, -100, 0.62, true).x, 15.5);
  assert.equal(cameraTrackingTarget(100, -100, 0.62, true).z, -15.5);
});
