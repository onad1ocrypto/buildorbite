import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBoneHowlerRally,
  applyDamageToZombie,
  applyLanternFlareToZombies,
  buildStructureOnPad,
  calculateRunScore,
  canAfford,
  computeZombieEffectiveSpeed,
  createInitialPads,
  evaluateGameOutcome,
  getEffectiveBuildingStats,
  getWaveComposition,
  INITIAL_RESOURCES,
  upgradeStructureOnPad,
  ZOMBIE_CATALOG,
} from './rules';
import { ZombieEntity } from './types';

function makeZombie(overrides: Partial<ZombieEntity>): ZombieEntity {
  return {
    id: 1,
    type: 'shamble',
    name: 'Shamble',
    x: 3,
    z: 0,
    vx: 0,
    vz: 0,
    rotationY: 0,
    hp: 75,
    maxHp: 75,
    armorHp: 0,
    maxArmorHp: 0,
    baseSpeed: 1.5,
    damage: 10,
    attackCooldown: 0,
    slowTimer: 0,
    poisonTimer: 0,
    hitFlashTimer: 0,
    windupTimer: 0,
    isWindingUp: false,
    dashTimer: 0,
    frenzyTimer: 0,
    howlCooldown: 0,
    koTimer: 0,
    isDead: false,
    quipText: null,
    quipTimer: 0,
    walkPhase: 0,
    slimeDropTimer: 0,
    ...overrides,
  };
}

test('createInitialPads returns a closed palisade ring plus inner and outer pads', () => {
  const pads = createInitialPads();
  assert.equal(pads.length, 25);
  assert.equal(pads.every((p) => p.building === null), true);
  assert.equal(pads.some((p) => p.rotationY !== undefined), true);
});

test('buildStructureOnPad deducts resources and sets building state', () => {
  const pads = createInitialPads();
  const res = { ...INITIAL_RESOURCES };
  const { updatedPad, updatedResources, success } = buildStructureOnPad(
    pads[0],
    res,
    'watchtower'
  );
  assert.equal(success, true);
  assert.notEqual(updatedPad.building, null);
  assert.equal(updatedPad.building?.type, 'watchtower');
  assert.equal(updatedResources.wood, res.wood - 35);
  assert.equal(updatedResources.stone, res.stone - 15);
  assert.equal(updatedResources.food, res.food - 5);
});

test('upgradeStructureOnPad supports 2 upgrade paths and prevents double upgrade', () => {
  const pads = createInitialPads();
  const res = { wood: 200, stone: 200, food: 200, tickets: 10 };
  const built = buildStructureOnPad(pads[0], res, 'catapult');
  assert.equal(built.success, true);

  const upgraded = upgradeStructureOnPad(
    built.updatedPad,
    built.updatedResources,
    'pathA'
  );
  assert.equal(upgraded.success, true);
  assert.equal(upgraded.updatedPad.building?.upgradePath, 'pathA');
  assert.equal(upgraded.updatedPad.building?.level, 2);

  const stats = getEffectiveBuildingStats('catapult', 'pathA');
  assert.equal(stats.damage > 48, true);
  assert.equal(stats.specialEffect, 'meteor_splash');

  const secondUpgrade = upgradeStructureOnPad(
    upgraded.updatedPad,
    upgraded.updatedResources,
    'pathB'
  );
  assert.equal(secondUpgrade.success, false);
});

test('applyLanternFlareToZombies slows, knocks back, and damages zombies in radius', () => {
  const zombies: ZombieEntity[] = [
    makeZombie({ id: 1, type: 'shamble', x: 3, z: 0, hp: 75, maxHp: 75 }),
    makeZombie({ id: 2, type: 'grinner', x: 20, z: 20, hp: 65, maxHp: 65 }),
  ];

  const { affectedCount } = applyLanternFlareToZombies(0, 0, zombies);
  assert.equal(affectedCount, 1);
  assert.equal(zombies[0].x > 3, true);
  assert.equal(zombies[0].slowTimer > 0, true);
  assert.equal(zombies[0].hp < 75, true);
  assert.equal(zombies[1].hp, 65);
});

test('Swift Stumbler moves faster, triggers Surge Dash when wounded, and is countered by slows', () => {
  const spec = ZOMBIE_CATALOG.swift_stumbler;
  assert.equal(spec.speed > ZOMBIE_CATALOG.shamble.speed, true);

  const stumbler = makeZombie({
    type: 'swift_stumbler',
    baseSpeed: spec.speed,
    hp: spec.maxHp,
    maxHp: spec.maxHp,
  });

  const normalSpeed = computeZombieEffectiveSpeed(stumbler);
  assert.equal(normalSpeed, spec.speed);

  // Wounded below 75% HP triggers +45% Surge Dash
  stumbler.hp = Math.floor(spec.maxHp * 0.6);
  const surgeSpeed = computeZombieEffectiveSpeed(stumbler);
  assert.equal(Math.abs(surgeSpeed - spec.speed * 1.45) < 0.001, true);

  // Applying a slow strips Surge Dash and cuts speed by 60%
  stumbler.slowTimer = 2.0;
  const slowedSpeed = computeZombieEffectiveSpeed(stumbler);
  assert.equal(Math.abs(slowedSpeed - spec.speed * 0.4) < 0.001, true);
});

test('Armored Undead reduces light projectile damage by 45% until heavy attacks shatter its armor', () => {
  const spec = ZOMBIE_CATALOG.armored_undead;
  assert.equal(spec.maxHp, 285);
  assert.equal(spec.armorHp, 90);

  const armored = makeZombie({
    type: 'armored_undead',
    hp: spec.maxHp,
    maxHp: spec.maxHp,
    armorHp: spec.armorHp!,
    maxArmorHp: spec.armorHp!,
    baseSpeed: spec.speed,
  });

  // Light projectile (26 damage) deals 45% reduced HP damage (14) while chipping 26 armor
  const lightHit = applyDamageToZombie(armored, 26, 'projectile');
  assert.equal(lightHit.actualHpDamage, Math.round(26 * 0.55));
  assert.equal(lightHit.armorShattered, false);
  assert.equal(armored.armorHp, 90 - 26);

  // Heavy Catapult splash (48 damage) deals 1.8x armor shatter (86 armor damage), shattering remaining 64 armor!
  const heavyHit = applyDamageToZombie(armored, 48, 'splash', 'meteor_splash');
  assert.equal(heavyHit.armorShattered, true);
  assert.equal(armored.armorHp, 0);

  // Once armor is shattered, subsequent light projectiles deal full 100% damage
  const postShatterHit = applyDamageToZombie(armored, 26, 'projectile');
  assert.equal(postShatterHit.actualHpDamage, 26);
});

test('Bone Howler rally grants Frenzy Haste to nearby zombies', () => {
  const howler = makeZombie({ id: 10, type: 'bone_howler', x: 5, z: 5 });
  const nearby = makeZombie({
    id: 11,
    type: 'armored_undead',
    x: 7,
    z: 5,
    baseSpeed: 1.05,
    armorHp: 90,
  });
  const farAway = makeZombie({ id: 12, type: 'shamble', x: -12, z: -12, baseSpeed: 1.55 });

  const count = applyBoneHowlerRally(howler, [howler, nearby, farAway], 5.2);
  assert.equal(count, 2);
  assert.equal(nearby.frenzyTimer > 0, true);
  assert.equal(farAway.frenzyTimer, 0);
  assert.equal(computeZombieEffectiveSpeed(nearby) > 1.05, true);
});

test('waves include Swift Stumbler, Armored Undead, Bone Howler, and Boss Baron Blight', () => {
  const wave1 = getWaveComposition(1);
  const wave2 = getWaveComposition(2);
  const wave3 = getWaveComposition(3);

  assert.equal(wave1.includes('swift_stumbler'), true);
  assert.equal(wave1.includes('armored_undead'), true);
  assert.equal(wave2.includes('bone_howler'), true);
  assert.equal(wave3.includes('baron'), true);

  assert.equal(
    evaluateGameOutcome({
      fortHp: 0,
      dayNumber: 1,
      maxDays: 3,
      phase: 'night',
      activeZombiesCount: 4,
      pendingWaveSpawns: 2,
    }),
    'defeat'
  );

  assert.equal(
    evaluateGameOutcome({
      fortHp: 320,
      dayNumber: 3,
      maxDays: 3,
      phase: 'night',
      activeZombiesCount: 0,
      pendingWaveSpawns: 0,
    }),
    'victory'
  );

  const score = calculateRunScore({
    zombiesDefeated: 25,
    fortHp: 400,
    resources: INITIAL_RESOURCES,
    victory: true,
    dayNumber: 3,
  });
  assert.equal(score > 2500, true);
  assert.equal(
    canAfford({ wood: 5, stone: 5, food: 5, tickets: 0 }, { wood: 10, stone: 5, food: 0 }),
    false
  );
});
