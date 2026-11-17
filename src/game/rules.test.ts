import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceFenceSegmentBuild,
  applyBoneHowlerRally,
  applyDamageToZombie,
  applyLanternFlareToZombies,
  buildOrUpgradeFenceSegment,
  buildStructureOnPad,
  calculateRunScore,
  canAfford,
  canGatherResourcesInPhase,
  canPerformConstructionInPhase,
  canTriggerLanternFlare,
  clampHeroPositionForPhase,
  computeZombieEffectiveSpeed,
  createInitialFenceSegments,
  createInitialPads,
  evaluateGameOutcome,
  FENCE_HALF_EXTENT,
  findBlockingFenceSegment,
  findNextFenceSegmentForHero,
  FORT_INTERIOR_HALF_EXTENT,
  gatherFromResourceNode,
  getConstructionDuration,
  getEffectiveBuildingStats,
  getNextDayWeather,
  getWaveComposition,
  HERO_CONSTRUCTION_DURATION,
  INITIAL_RESOURCES,
  restoreFenceSegmentsFromPersistence,
  restorePadsFromPersistence,
  salvageStructureOnPad,
  serializeFenceSegmentsForPersistence,
  serializePadsForPersistence,
  startFenceConstructionTask,
  startPadConstructionTask,
  stepConstructionTask,
  stepDayWeather,
  stepResourceNodeGrowth,
  upgradeStructureOnPad,
  WEATHER_CATALOG,
  WEATHER_CYCLE_DURATION,
  ZOMBIE_CATALOG,
} from './rules';
import { ResourceNodeEntity, ZombieEntity } from './types';

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

test('createInitialPads returns 8 weapon pads strictly inside the square fence perimeter', () => {
  const pads = createInitialPads();
  assert.equal(pads.length, 8);
  assert.equal(pads.every((p) => p.building === null), true);
  assert.equal(
    pads.every((p) => Math.abs(p.x) < FENCE_HALF_EXTENT && Math.abs(p.z) < FENCE_HALF_EXTENT),
    true
  );
});

test('createInitialFenceSegments returns 12 square fence segments (3 per side) and supports progressive assembly', () => {
  const segments = createInitialFenceSegments();
  assert.equal(segments.length, 12);
  assert.equal(segments.filter((s) => s.side === 'north').length, 3);
  assert.equal(segments.filter((s) => s.side === 'east').length, 3);
  assert.equal(segments.filter((s) => s.side === 'south').length, 3);
  assert.equal(segments.filter((s) => s.side === 'west').length, 3);
  assert.equal(segments.filter((s) => s.isGate).length, 4);

  // Find next unbuilt segment for Ranger Rue to assemble
  const target = findNextFenceSegmentForHero(0, 4, segments);
  assert.notEqual(target, null);
  assert.equal(target?.level, 0);

  // Step 1: 50% hammer progress
  const res = { ...INITIAL_RESOURCES };
  const step1 = advanceFenceSegmentBuild(target!, res, 0.5);
  assert.equal(step1.success, true);
  assert.equal(step1.completed, false);
  assert.equal(step1.updatedSegment.buildProgress, 0.5);
  assert.equal(step1.updatedSegment.level, 0);

  // Step 2: 100% hammer progress -> completes Level 1 fence segment and deducts 15W 5S
  const step2 = advanceFenceSegmentBuild(step1.updatedSegment, step1.updatedResources, 0.6);
  assert.equal(step2.success, true);
  assert.equal(step2.completed, true);
  assert.equal(step2.updatedSegment.level, 1);
  assert.equal(step2.updatedSegment.hp, 240);
  assert.equal(step2.updatedResources.wood, res.wood - 15);
  assert.equal(step2.updatedResources.stone, res.stone - 5);

  // Upgrade Level 1 fence segment to Level 2 (Ironbark Spikes)
  const upg = buildOrUpgradeFenceSegment(step2.updatedSegment, step2.updatedResources);
  assert.equal(upg.success, true);
  assert.equal(upg.action, 'upgraded');
  assert.equal(upg.updatedSegment.level, 2);
  assert.equal(upg.updatedSegment.maxHp, 420);

  // Zombie approaching on North trail is blocked by the North Gate fence segment
  const blocker = findBlockingFenceSegment(0, -11.5, segments);
  assert.notEqual(blocker, null);
  assert.equal(blocker?.side, 'north');
  assert.equal(blocker?.isGate, true);
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

test('canTriggerLanternFlare allows activation only during Night phase when off cooldown', () => {
  const dayRes = canTriggerLanternFlare('day', 0);
  assert.equal(dayRes.allowed, false);
  assert.equal(dayRes.reason, 'day_locked');

  const nightCdRes = canTriggerLanternFlare('night', 3.2);
  assert.equal(nightCdRes.allowed, false);
  assert.equal(nightCdRes.reason, 'cooldown');

  const nightReadyRes = canTriggerLanternFlare('night', 0);
  assert.equal(nightReadyRes.allowed, true);
  assert.equal(nightReadyRes.reason, undefined);
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

test('Day vs Night phase rules: building and upgrading are allowed by day, rejected at night, structures persist into night, and combat works at night', () => {
  const pads = createInitialPads();
  const fences = createInitialFenceSegments();
  const res = { wood: 250, stone: 200, food: 150, tickets: 3 };

  // 1. Day phase: building and upgrading structures and fences succeed
  const dayBuildPad = buildStructureOnPad(pads[0], res, 'watchtower', 'day');
  assert.equal(dayBuildPad.success, true);
  assert.equal(dayBuildPad.updatedPad.building?.type, 'watchtower');

  const unbuiltFence = fences.find((f) => f.level === 0)!;
  const dayBuildFence = buildOrUpgradeFenceSegment(
    unbuiltFence,
    dayBuildPad.updatedResources,
    'day'
  );
  assert.equal(dayBuildFence.success, true);
  assert.equal(dayBuildFence.action, 'built');
  assert.equal(dayBuildFence.updatedSegment.level, 1);

  // 2. Night phase: building and upgrading pads or fences are rejected with reason 'night_locked'
  const nightBuildPad = buildStructureOnPad(
    pads[1],
    dayBuildFence.updatedResources,
    'catapult',
    'night'
  );
  assert.equal(nightBuildPad.success, false);
  assert.equal(nightBuildPad.reason, 'night_locked');
  assert.equal(nightBuildPad.updatedPad.building, null);
  assert.deepEqual(nightBuildPad.updatedResources, dayBuildFence.updatedResources);

  const nightUpgradePad = upgradeStructureOnPad(
    dayBuildPad.updatedPad,
    dayBuildFence.updatedResources,
    'pathA',
    'night'
  );
  assert.equal(nightUpgradePad.success, false);
  assert.equal(nightUpgradePad.reason, 'night_locked');
  assert.equal(nightUpgradePad.updatedPad.building?.upgradePath, null);

  const nightUpgradeFence = buildOrUpgradeFenceSegment(
    dayBuildFence.updatedSegment,
    dayBuildFence.updatedResources,
    'night'
  );
  assert.equal(nightUpgradeFence.success, false);
  assert.equal(nightUpgradeFence.reason, 'night_locked');
  assert.equal(nightUpgradeFence.updatedSegment.level, 1);

  const anotherUnbuiltFence = fences.find((f) => f.level === 0 && f.id !== unbuiltFence.id)!;
  const nightStepFence = advanceFenceSegmentBuild(
    anotherUnbuiltFence,
    dayBuildFence.updatedResources,
    0.5,
    'night'
  );
  assert.equal(nightStepFence.success, false);
  assert.equal(nightStepFence.reason, 'night_locked');
  assert.equal(nightStepFence.updatedSegment.buildProgress, 0);

  // 3. Structures completed before night persist and retain their combat stats & blocking behavior at night
  assert.equal(dayBuildPad.updatedPad.building?.type, 'watchtower');
  assert.equal(dayBuildPad.updatedPad.building?.hp, 150);
  const towerStats = getEffectiveBuildingStats(
    dayBuildPad.updatedPad.building!.type,
    dayBuildPad.updatedPad.building!.upgradePath
  );
  assert.equal(towerStats.damage > 0, true);

  const updatedFences = fences.map((f) =>
    f.id === unbuiltFence.id ? dayBuildFence.updatedSegment : f
  );
  const gateBlocker = findBlockingFenceSegment(0, -11.5, updatedFences);
  assert.notEqual(gateBlocker, null);

  // 4. Hero combat actions (melee bonk & Lantern Flare) remain active at night
  const nightZombie = makeZombie({ id: 99, x: 2.0, z: 0, hp: 100, maxHp: 100 });
  const meleeRes = applyDamageToZombie(nightZombie, 30, 'melee');
  assert.equal(meleeRes.actualHpDamage, 30);
  assert.equal(nightZombie.hp, 70);

  const flareRes = applyLanternFlareToZombies(0, 0, [nightZombie]);
  assert.equal(flareRes.affectedCount, 1);
  assert.equal(nightZombie.slowTimer > 0, true);

  // 5. Returning to Day phase restores construction & upgrade actions
  const nextDayUpgradePad = upgradeStructureOnPad(
    dayBuildPad.updatedPad,
    dayBuildFence.updatedResources,
    'pathA',
    'day'
  );
  assert.equal(nextDayUpgradePad.success, true);
  assert.equal(nextDayUpgradePad.updatedPad.building?.upgradePath, 'pathA');
});

test('Hero construction animation state: clicking a segment or pad enters construction state and waits for animation to finish before applying build or upgrade', () => {
  let pads = createInitialPads();
  let fences = createInitialFenceSegments();
  let res = { wood: 250, stone: 200, food: 150, tickets: 3 };

  // 1. Clicking an unbuilt fence segment triggers 'construction' animation state without immediately building
  const unbuiltFence = fences.find((f) => f.level === 0)!;
  const startFence = startFenceConstructionTask({
    segment: unbuiltFence,
    resources: res,
    phase: 'day',
    currentTask: null,
  });
  assert.equal(startFence.started, true);
  assert.equal(startFence.heroAnimState, 'construction');
  assert.notEqual(startFence.task, null);
  assert.equal(startFence.task?.remainingTime, HERO_CONSTRUCTION_DURATION);
  // Before animation finishes, fence segment is still level 0
  assert.equal(fences.find((f) => f.id === unbuiltFence.id)?.level, 0);

  // Attempting to start another build while 'construction' animation is playing is rejected as 'busy_constructing'
  const busyAttempt = startPadConstructionTask({
    pad: pads[0],
    resources: res,
    phase: 'day',
    currentTask: startFence.task,
    action: 'build_pad',
    buildingType: 'watchtower',
  });
  assert.equal(busyAttempt.started, false);
  assert.equal(busyAttempt.reason, 'busy_constructing');
  assert.equal(busyAttempt.heroAnimState, 'construction');

  // Stepping halfway (0.4s) keeps hero in 'construction' state and fence unbuilt
  const midFenceStep = stepConstructionTask({
    task: startFence.task,
    dt: 0.4,
    phase: 'day',
    fenceSegments: fences,
    pads,
    resources: res,
  });
  assert.equal(midFenceStep.completed, false);
  assert.equal(midFenceStep.heroAnimState, 'construction');
  assert.equal(midFenceStep.fenceSegments.find((f) => f.id === unbuiltFence.id)?.level, 0);
  assert.equal(midFenceStep.resources.wood, res.wood);

  // Stepping the remaining time (0.5s) finishes the animation and applies the fence build!
  const finishFenceStep = stepConstructionTask({
    task: midFenceStep.task,
    dt: 0.5,
    phase: 'day',
    fenceSegments: midFenceStep.fenceSegments,
    pads: midFenceStep.pads,
    resources: midFenceStep.resources,
  });
  assert.equal(finishFenceStep.completed, true);
  assert.equal(finishFenceStep.heroAnimState, 'idle');
  assert.equal(finishFenceStep.task, null);
  assert.equal(finishFenceStep.fenceOutcome, 'built');
  assert.equal(finishFenceStep.fenceSegments.find((f) => f.id === unbuiltFence.id)?.level, 1);
  assert.equal(finishFenceStep.resources.wood, res.wood - 15);
  fences = finishFenceStep.fenceSegments;
  res = finishFenceStep.resources;

  // 2. Clicking a pad to build a Watchtower enters 'construction' state and applies only when animation finishes
  const startPadBuild = startPadConstructionTask({
    pad: pads[0],
    resources: res,
    phase: 'day',
    currentTask: null,
    action: 'build_pad',
    buildingType: 'watchtower',
  });
  assert.equal(startPadBuild.started, true);
  assert.equal(startPadBuild.heroAnimState, 'construction');

  const midPadStep = stepConstructionTask({
    task: startPadBuild.task,
    dt: 0.3,
    phase: 'day',
    fenceSegments: fences,
    pads,
    resources: res,
  });
  assert.equal(midPadStep.completed, false);
  assert.equal(midPadStep.heroAnimState, 'construction');
  assert.equal(midPadStep.pads[0].building, null);

  const finishPadStep = stepConstructionTask({
    task: midPadStep.task,
    dt: 0.65,
    phase: 'day',
    fenceSegments: midPadStep.fenceSegments,
    pads: midPadStep.pads,
    resources: midPadStep.resources,
  });
  assert.equal(finishPadStep.completed, true);
  assert.equal(finishPadStep.heroAnimState, 'idle');
  assert.equal(finishPadStep.pads[0].building?.type, 'watchtower');
  assert.equal(finishPadStep.pads[0].building?.level, 1);
  pads = finishPadStep.pads;
  res = finishPadStep.resources;

  // 3. Clicking the built pad to upgrade (Path A) also enters 'construction' state and applies only when animation finishes
  const startPadUpgrade = startPadConstructionTask({
    pad: pads[0],
    resources: res,
    phase: 'day',
    currentTask: null,
    action: 'upgrade_pad',
    upgradePath: 'pathA',
  });
  assert.equal(startPadUpgrade.started, true);
  assert.equal(startPadUpgrade.heroAnimState, 'construction');
  assert.equal(pads[0].building?.upgradePath, null);

  const finishUpgradeStep = stepConstructionTask({
    task: startPadUpgrade.task,
    dt: HERO_CONSTRUCTION_DURATION + 0.05,
    phase: 'day',
    fenceSegments: fences,
    pads,
    resources: res,
  });
  assert.equal(finishUpgradeStep.completed, true);
  assert.equal(finishUpgradeStep.heroAnimState, 'idle');
  assert.equal(finishUpgradeStep.pads[0].building?.upgradePath, 'pathA');
  assert.equal(finishUpgradeStep.pads[0].building?.level, 2);
});

test('Night phase confines Hero inside the fort fence arena and locks resource gathering', () => {
  // Day phase: Hero can roam outside the fence (e.g. x=13, z=0) and gather resources
  assert.equal(canGatherResourcesInPhase('day'), true);
  const dayPos = clampHeroPositionForPhase(13, 0, 'day');
  assert.equal(dayPos.x, 13);
  assert.equal(dayPos.z, 0);

  // Night phase: Hero cannot gather resources and is strictly clamped inside the fort fence perimeter
  assert.equal(canGatherResourcesInPhase('night'), false);
  const nightPos = clampHeroPositionForPhase(13, -12, 'night');
  assert.equal(nightPos.x, FORT_INTERIOR_HALF_EXTENT);
  assert.equal(nightPos.z, -FORT_INTERIOR_HALF_EXTENT);
  assert.equal(Math.abs(nightPos.x) < FENCE_HALF_EXTENT, true);
  assert.equal(Math.abs(nightPos.z) < FENCE_HALF_EXTENT, true);
});

test('Daily progression lock and Free Play mode strictly reject gathering, building, upgrading, repairing, and salvaging while preserving Lantern Flare and combat', () => {
  const pads = createInitialPads();
  const fences = createInitialFenceSegments();
  const nodes: ResourceNodeEntity[] = [
    {
      id: 1,
      type: 'wood',
      name: 'Timber Pile',
      x: -14,
      z: -8,
      amount: 30,
      maxAmount: 30,
      hitFlashTimer: 0,
      respawnTimer: 0,
    },
  ];
  const res = { wood: 200, stone: 200, food: 200, tickets: 3 };

  // Build one structure during normal day play first so we can test upgrade & salvage locks
  const normalBuild = buildStructureOnPad(pads[0], res, 'watchtower', 'day', false, false);
  assert.equal(normalBuild.success, true);
  const builtPad = normalBuild.updatedPad;

  // 1. Daily progression locked (after 3/3 core daily tasks complete)
  assert.equal(canPerformConstructionInPhase('day', true, false), false);
  assert.equal(canGatherResourcesInPhase('day', true, false), false);

  const lockedGather = gatherFromResourceNode({
    node: nodes[0],
    resources: res,
    phase: 'day',
    dailyLocked: true,
    isFreePlay: false,
  });
  assert.equal(lockedGather.gathered, false);
  assert.equal(lockedGather.reason, 'daily_locked');
  assert.deepEqual(lockedGather.updatedResources, res);

  const lockedBuild = buildStructureOnPad(pads[1], res, 'palisade', 'day', true, false);
  assert.equal(lockedBuild.success, false);
  assert.equal(lockedBuild.reason, 'daily_locked');

  const lockedUpgrade = upgradeStructureOnPad(builtPad, res, 'pathA', 'day', true, false);
  assert.equal(lockedUpgrade.success, false);
  assert.equal(lockedUpgrade.reason, 'daily_locked');

  const lockedSalvage = salvageStructureOnPad(builtPad, res, 'day', true, false);
  assert.equal(lockedSalvage.success, false);
  assert.equal(lockedSalvage.reason, 'daily_locked');

  const lockedTask = startPadConstructionTask({
    pad: pads[1],
    resources: res,
    phase: 'day',
    currentTask: null,
    action: 'build_pad',
    buildingType: 'palisade',
    dailyLocked: true,
    isFreePlay: false,
  });
  assert.equal(lockedTask.started, false);
  assert.equal(lockedTask.reason, 'daily_locked');

  // 2. Free Play / Demo mode lock
  assert.equal(canPerformConstructionInPhase('day', false, true), false);
  assert.equal(canGatherResourcesInPhase('day', false, true), false);

  const freeGather = gatherFromResourceNode({
    node: nodes[0],
    resources: res,
    phase: 'day',
    dailyLocked: false,
    isFreePlay: true,
  });
  assert.equal(freeGather.gathered, false);
  assert.equal(freeGather.reason, 'free_play_locked');

  const freeBuild = buildStructureOnPad(pads[1], res, 'catapult', 'day', false, true);
  assert.equal(freeBuild.success, false);
  assert.equal(freeBuild.reason, 'free_play_locked');

  const freeFenceTask = startFenceConstructionTask({
    segment: fences.find((f) => f.level === 0)!,
    resources: res,
    phase: 'day',
    currentTask: null,
    dailyLocked: false,
    isFreePlay: true,
  });
  assert.equal(freeFenceTask.started, false);
  assert.equal(freeFenceTask.reason, 'free_play_locked');

  // 3. Normal day salvage succeeds when unlocked
  const unlockedSalvage = salvageStructureOnPad(builtPad, normalBuild.updatedResources, 'day', false, false);
  assert.equal(unlockedSalvage.success, true);
  assert.equal(unlockedSalvage.updatedPad.building, null);
  assert.equal(unlockedSalvage.updatedResources.wood > normalBuild.updatedResources.wood, true);

  // 4. Lantern Flare and hero combat remain available even when daily progression is locked
  assert.equal(canTriggerLanternFlare('night', 0).allowed, true);
});

test('Construction timer hierarchy scales by structure complexity and toolTier speed bonus', () => {
  const repairTime = getConstructionDuration({ action: 'repair_pad', buildingType: 'watchtower', toolTier: 1 });
  const basicBuildTime = getConstructionDuration({ action: 'build_pad', buildingType: 'palisade', toolTier: 1 });
  const midBuildTime = getConstructionDuration({ action: 'build_pad', buildingType: 'watchtower', toolTier: 1 });
  const heavyBuildTime = getConstructionDuration({ action: 'build_pad', buildingType: 'catapult', toolTier: 1 });
  const upgradeTime = getConstructionDuration({ action: 'upgrade_pad', buildingType: 'watchtower', toolTier: 1 });

  assert.equal(repairTime < basicBuildTime, true);
  assert.equal(basicBuildTime < midBuildTime, true);
  assert.equal(midBuildTime < heavyBuildTime, true);
  assert.equal(heavyBuildTime < upgradeTime, true);

  // Higher toolTier (Tier 2 Master Hammer) makes construction faster, never slower
  const tier2HeavyBuildTime = getConstructionDuration({ action: 'build_pad', buildingType: 'catapult', toolTier: 2 });
  assert.equal(tier2HeavyBuildTime < heavyBuildTime, true);
});

test('Persistent fort serialization and restoration preserves built structures and restores full maxHp for new runs', () => {
  const pads = createInitialPads();
  const fences = createInitialFenceSegments();
  const res = { wood: 300, stone: 300, food: 300, tickets: 3 };

  const built = buildStructureOnPad(pads[0], res, 'catapult', 'day');
  const upgraded = upgradeStructureOnPad(built.updatedPad, built.updatedResources, 'pathA', 'day');
  // Simulate combat damage reducing HP during a run
  upgraded.updatedPad.building!.hp = 45;
  pads[0] = upgraded.updatedPad;

  const fenceBuilt = buildOrUpgradeFenceSegment(fences.find((f) => f.level === 0)!, res, 'day');
  fenceBuilt.updatedSegment.hp = 50; // Damaged in combat
  fences[fenceBuilt.updatedSegment.id - 1] = fenceBuilt.updatedSegment;

  const savedPads = serializePadsForPersistence(pads);
  const savedFences = serializeFenceSegmentsForPersistence(fences);

  const restoredPads = restorePadsFromPersistence(savedPads, true);
  const restoredFences = restoreFenceSegmentsFromPersistence(savedFences, true);

  assert.equal(restoredPads[0].building?.type, 'catapult');
  assert.equal(restoredPads[0].building?.upgradePath, 'pathA');
  assert.equal(restoredPads[0].building?.level, 2);
  assert.equal(restoredPads[0].building?.hp, restoredPads[0].building?.maxHp);

  const restoredSeg = restoredFences.find((f) => f.id === fenceBuilt.updatedSegment.id)!;
  assert.equal(restoredSeg.level, 1);
  assert.equal(restoredSeg.hp, restoredSeg.maxHp);
});

test('Dynamic daytime weather system transitions deterministically and modifies visibility, resource regrowth, and gather yields', () => {
  // 1. Weather progression cycles deterministically during Day and pauses during Night
  assert.equal(WEATHER_CATALOG.clear.visibilityMultiplier, 1);
  assert.equal(WEATHER_CATALOG.rain.resourceGrowthMultiplier > 1, true);
  assert.equal(WEATHER_CATALOG.fog.resourceGrowthMultiplier < 1, true);
  assert.equal(WEATHER_CATALOG.fog.visibilityMultiplier < WEATHER_CATALOG.rain.visibilityMultiplier, true);

  const nightStep = stepDayWeather({
    phase: 'night',
    currentWeather: 'rain',
    weatherTimer: 10,
    dt: 15,
    dayNumber: 1,
    cycleCount: 0,
  });
  assert.equal(nightStep.changed, true);
  assert.equal(nightStep.weather, 'clear');
  assert.equal(nightStep.weatherTimer, WEATHER_CYCLE_DURATION);

  const dayStep = stepDayWeather({
    phase: 'day',
    currentWeather: 'clear',
    weatherTimer: 1.0,
    dt: 2.0,
    dayNumber: 1,
    cycleCount: 0,
  });
  assert.equal(dayStep.changed, true);
  assert.notEqual(dayStep.weather, 'clear');
  assert.equal(dayStep.weatherTimer, WEATHER_CYCLE_DURATION);
  assert.equal(dayStep.cycleCount, 1);
  assert.notEqual(getNextDayWeather('rain', 2, 1), 'rain');

  // 2. Resource node regrowth rates scale with weather (rain faster, fog slower, night paused)
  const depletedWood: ResourceNodeEntity = {
    id: 1,
    type: 'wood',
    name: 'Timber Pile',
    x: -14,
    z: -8,
    amount: 0,
    maxAmount: 30,
    hitFlashTimer: 0,
    respawnTimer: 5.0,
  };
  const rainGrowth = stepResourceNodeGrowth({
    node: depletedWood,
    dt: 2.0,
    phase: 'day',
    weather: 'rain',
    regrowAccumulator: 0,
  });
  const fogGrowth = stepResourceNodeGrowth({
    node: { ...depletedWood },
    dt: 2.0,
    phase: 'day',
    weather: 'fog',
    regrowAccumulator: 0,
  });
  const nightGrowth = stepResourceNodeGrowth({
    node: { ...depletedWood },
    dt: 2.0,
    phase: 'night',
    weather: 'rain',
    regrowAccumulator: 0,
  });
  assert.equal(rainGrowth.updatedNode.respawnTimer < fogGrowth.updatedNode.respawnTimer, true);
  assert.equal(nightGrowth.updatedNode.respawnTimer, 5.0);

  // 3. Gather yield bonuses apply per weather (+20% wood/food in rain, +25% stone in fog)
  const woodNode: ResourceNodeEntity = {
    id: 2,
    type: 'wood',
    name: 'Timber Pile',
    x: -14,
    z: -8,
    amount: 30,
    maxAmount: 30,
    hitFlashTimer: 0,
    respawnTimer: 0,
  };
  const stoneNode: ResourceNodeEntity = {
    id: 3,
    type: 'stone',
    name: 'Quarry Rock',
    x: 14,
    z: -8,
    amount: 30,
    maxAmount: 30,
    hitFlashTimer: 0,
    respawnTimer: 0,
  };
  const wallet = { wood: 100, stone: 100, food: 100, tickets: 3 };

  const woodClear = gatherFromResourceNode({
    node: { ...woodNode },
    resources: wallet,
    phase: 'day',
    weather: 'clear',
  });
  const woodRain = gatherFromResourceNode({
    node: { ...woodNode },
    resources: wallet,
    phase: 'day',
    weather: 'rain',
  });
  assert.equal(woodRain.yieldAmount > woodClear.yieldAmount, true);

  const stoneClear = gatherFromResourceNode({
    node: { ...stoneNode },
    resources: wallet,
    phase: 'day',
    weather: 'clear',
  });
  const stoneFog = gatherFromResourceNode({
    node: { ...stoneNode },
    resources: wallet,
    phase: 'day',
    weather: 'fog',
  });
  assert.equal(stoneFog.yieldAmount > stoneClear.yieldAmount, true);
});


