import test from 'node:test';
import assert from 'node:assert/strict';
import { createRangerRueModel } from './models';

test('Rue model retains the animated rig and lantern references', () => {
  const rue = createRangerRueModel();
  assert.equal(rue.leftArm.parent, rue.group);
  assert.equal(rue.rightArm.parent, rue.group);
  assert.equal(rue.headGroup.parent, rue.group);
  assert.ok(rue.lanternMesh.isMesh);
  assert.ok(rue.lanternFlameMesh.isMesh);
  assert.ok(rue.lanternHaloMesh.isMesh);
  rue.leftArm.rotation.x = -1;
  rue.rightArm.rotation.x = 0.3;
  rue.headGroup.rotation.y = 0.2;
  assert.equal(rue.leftArm.rotation.x, -1);
  assert.equal(rue.rightArm.rotation.x, 0.3);
  assert.equal(rue.headGroup.rotation.y, 0.2);
});
