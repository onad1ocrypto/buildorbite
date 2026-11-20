import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createZombieModel } from './models';
import type { ZombieArchetype } from './types';

test('all zombie archetypes retain their models, armor markers, and shared body geometries', () => {
  const types: ZombieArchetype[] = ['shamble', 'grinner', 'grumble', 'gawp', 'brine', 'baron', 'swift_stumbler', 'armored_undead', 'bone_howler'];
  const texture = new THREE.CanvasTexture();
  for (const type of types) {
    const zombie = createZombieModel(type, texture);
    assert.ok(zombie.children.length > 5, `${type} has body and distinctive details`);
    assert.ok(zombie.scale.x > 0);
    if (type === 'armored_undead') {
      assert.ok(zombie.children.some((child) => child.userData.isArmorPiece));
    }
  }
  const a = createZombieModel('shamble', texture);
  const b = createZombieModel('shamble', texture);
  const aLeg = a.children[1] as THREE.Mesh;
  const bLeg = b.children[1] as THREE.Mesh;
  assert.equal(aLeg.geometry, bLeg.geometry);
});
