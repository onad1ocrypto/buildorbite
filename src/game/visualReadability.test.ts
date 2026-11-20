import test from 'node:test';
import assert from 'node:assert/strict';
import { animateCampfireFlames, createBuildingModel, createResourceNodeModel } from './models';

test('campfire has visible tongues and upgraded flames move independently', () => {
  const model = createBuildingModel('campfire', null, 1);
  const fire = model.getObjectByName('campfire-flames');
  assert.ok(fire);
  assert.equal(fire.children.length, 6);
  assert.equal(fire.scale.y, 0.84);
  animateCampfireFlames(model, 1, 0.5);
  assert.equal(fire.children[0].scale.y, 1);
  animateCampfireFlames(model, 2, 0.75);
  assert.equal(fire.scale.y, 1);
  assert.notEqual(fire.children[0].scale.y, 1);
  animateCampfireFlames(model, 3, 0);
  assert.equal(fire.scale.y, 1.16);
});

test('resource shapes have recognizable groups and retain the ground ring', () => {
  const wood = createResourceNodeModel('wood');
  const stone = createResourceNodeModel('stone');
  const food = createResourceNodeModel('food');
  for (const node of [wood, stone, food]) assert.equal(node.children[1].scale.x, 1);
  assert.ok(wood.getObjectByName('wood-stump'));
  assert.equal(stone.children.filter((child) => child.name === 'stone-rock').length, 3);
  assert.equal(food.children.filter((child) => child.name === 'food-apple').length, 3);
  assert.equal(food.children.filter((child) => child.name === 'food-corn').length, 2);
});
