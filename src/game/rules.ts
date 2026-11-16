import {
  BuildingCatalogItem,
  BuildingType,
  PlacementPad,
  Resources,
  UpgradePathId,
  ZombieArchetype,
  ZombieEntity,
  ZombieSpec,
} from './types';

export const DAY_DURATION_SECONDS = 65;
export const MAX_DAYS = 3;
export const FORT_MAX_HP = 500;
export const LANTERN_FLARE_COOLDOWN = 8.0;
export const LANTERN_FLARE_RADIUS = 8.5;
export const LANTERN_FLARE_DAMAGE = 28;
export const LANTERN_FLARE_SLOW_DURATION = 4.5;
export const LANTERN_FLARE_KNOCKBACK = 4.2;

export const INITIAL_RESOURCES: Resources = {
  wood: 110,
  stone: 80,
  food: 65,
  tickets: 3,
};

export const BUILDING_CATALOG: Record<BuildingType, BuildingCatalogItem> = {
  palisade: {
    type: 'palisade',
    keybind: '1',
    name: 'Palisade Wall',
    role: 'Sturdy Timber Barrier · Blocks & Thorns',
    description: 'Stout sharpened logs that intercept zombies and protect the inner clearing.',
    cost: { wood: 25, stone: 10, food: 0 },
    maxHp: 260,
    damage: 14,
    range: 2.6,
    attackInterval: 1.4,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Ironbark Spikes',
        tagline: '+180 HP & heavy thorn counter-damage on contact',
        cost: { wood: 30, stone: 25, food: 0, tickets: 0 },
        hpBonus: 180,
        damageBonus: 22,
        rangeBonus: 0.4,
        attackRateMultiplier: 1.25,
        specialEffect: 'thorns',
      },
      pathB: {
        id: 'pathB',
        name: 'Tar-Pitch Barricade',
        tagline: '+120 HP & sticky pitch slows nearby biters by 45%',
        cost: { wood: 25, stone: 20, food: 10, tickets: 0 },
        hpBonus: 120,
        damageBonus: 10,
        rangeBonus: 1.2,
        attackRateMultiplier: 1.15,
        specialEffect: 'slow_aura',
      },
    },
  },
  watchtower: {
    type: 'watchtower',
    keybind: '2',
    name: 'Watchtower',
    role: 'Long-Range Crossbow · Fast Single-Target',
    description: 'Elevated ranger lookout firing pine-cone bolts at approaching undead.',
    cost: { wood: 35, stone: 15, food: 5 },
    maxHp: 150,
    damage: 26,
    range: 10.5,
    attackInterval: 1.0,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Sharpshooter Nest',
        tagline: 'High-caliber bolts (+32 DMG, +3.5m range, crits bosses)',
        cost: { wood: 30, stone: 30, food: 10, tickets: 0 },
        hpBonus: 60,
        damageBonus: 32,
        rangeBonus: 3.5,
        attackRateMultiplier: 1.15,
        specialEffect: 'sniper_crit',
      },
      pathB: {
        id: 'pathB',
        name: 'Volley Repeater',
        tagline: 'Rapid double-speed bolts that chill targets briefly',
        cost: { wood: 35, stone: 20, food: 15, tickets: 0 },
        hpBonus: 50,
        damageBonus: 12,
        rangeBonus: 1.5,
        attackRateMultiplier: 1.85,
        specialEffect: 'rapid_volley',
      },
    },
  },
  spiketrap: {
    type: 'spiketrap',
    keybind: '3',
    name: 'Spike Trap',
    role: 'Ground Hazard · AoE Pierce & Slow',
    description: 'Concealed floor spikes that impale and hobble any zombie stepping close.',
    cost: { wood: 20, stone: 20, food: 0 },
    maxHp: 140,
    damage: 22,
    range: 3.8,
    attackInterval: 1.1,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Venom Briars',
        tagline: 'Coats spikes in swamp-nettle toxin (damage over time + slow)',
        cost: { wood: 25, stone: 15, food: 20, tickets: 0 },
        hpBonus: 50,
        damageBonus: 14,
        rangeBonus: 0.8,
        attackRateMultiplier: 1.2,
        specialEffect: 'poison_spikes',
      },
      pathB: {
        id: 'pathB',
        name: 'Spring-Loaded Jaws',
        tagline: 'Steel bear-trap springs deal +28 burst DMG & knockback',
        cost: { wood: 15, stone: 35, food: 0, tickets: 0 },
        hpBonus: 80,
        damageBonus: 28,
        rangeBonus: 0.5,
        attackRateMultiplier: 1.35,
        specialEffect: 'knockback_trap',
      },
    },
  },
  campfire: {
    type: 'campfire',
    keybind: '4',
    name: 'Campfire',
    role: 'Support Hearth · Heals Fort & Warms Towers',
    description: 'Cozy crackling blaze that repairs the Fort andlobbing stray sparks at grumblers.',
    cost: { wood: 25, stone: 15, food: 15 },
    maxHp: 160,
    damage: 15,
    range: 7.5,
    attackInterval: 1.5,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Roaring Bonfire',
        tagline: 'Repairs Fort +8 HP/sec and boosts nearby tower fire rate',
        cost: { wood: 35, stone: 20, food: 20, tickets: 0 },
        hpBonus: 90,
        damageBonus: 10,
        rangeBonus: 2.5,
        attackRateMultiplier: 1.3,
        specialEffect: 'fort_heal',
      },
      pathB: {
        id: 'pathB',
        name: 'Cinder Brazier',
        tagline: 'Flings explosive ember fireballs across a wide radius',
        cost: { wood: 25, stone: 35, food: 15, tickets: 0 },
        hpBonus: 70,
        damageBonus: 26,
        rangeBonus: 2.0,
        attackRateMultiplier: 1.4,
        specialEffect: 'ember_splash',
      },
    },
  },
  catapult: {
    type: 'catapult',
    keybind: '5',
    name: 'Catapult',
    role: 'Heavy Siege · Long-Range Splash Boulder',
    description: 'Timber torsion arm hurling hefty boulders that crush clustered zombies.',
    cost: { wood: 40, stone: 35, food: 10 },
    maxHp: 170,
    damage: 48,
    range: 13.0,
    attackInterval: 2.3,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Meteor Bucket',
        tagline: 'Launches flaming pitch boulders with huge AoE splash (+35 DMG)',
        cost: { wood: 35, stone: 45, food: 15, tickets: 0 },
        hpBonus: 80,
        damageBonus: 35,
        rangeBonus: 2.0,
        attackRateMultiplier: 1.15,
        specialEffect: 'meteor_splash',
      },
      pathB: {
        id: 'pathB',
        name: 'Boulder Splitter',
        tagline: 'Faster reload & shattering shale rocks that slow groups',
        cost: { wood: 40, stone: 35, food: 10, tickets: 0 },
        hpBonus: 70,
        damageBonus: 20,
        rangeBonus: 1.5,
        attackRateMultiplier: 1.55,
        specialEffect: 'shatter_slow',
      },
    },
  },
  guardtent: {
    type: 'guardtent',
    keybind: '6',
    name: 'Guard Tent',
    role: 'Critter Garrison · Fast Melee Strikes & Forage',
    description: 'Canvas ranger tent dispatching trained pine-badgers to pester zombies.',
    cost: { wood: 30, stone: 10, food: 25 },
    maxHp: 180,
    damage: 24,
    range: 8.5,
    attackInterval: 1.1,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Badger Brigade',
        tagline: 'Fierce honey-badger squad deals +26 DMG & stuns biters',
        cost: { wood: 25, stone: 15, food: 35, tickets: 0 },
        hpBonus: 100,
        damageBonus: 26,
        rangeBonus: 1.5,
        attackRateMultiplier: 1.45,
        specialEffect: 'badger_stun',
      },
      pathB: {
        id: 'pathB',
        name: 'Horn Caller Outpost',
        tagline: 'Rallies camp morale (generates bonus Wood/Food each wave)',
        cost: { wood: 30, stone: 20, food: 30, tickets: 0 },
        hpBonus: 90,
        damageBonus: 15,
        rangeBonus: 2.0,
        attackRateMultiplier: 1.25,
        specialEffect: 'forage_bounty',
      },
    },
  },
};

export const ZOMBIE_CATALOG: Record<ZombieArchetype, ZombieSpec> = {
  shamble: {
    type: 'shamble',
    name: 'Shamble',
    subtitle: 'Lost Tourist Zombie',
    maxHp: 75,
    speed: 1.55,
    damage: 10,
    attackInterval: 1.3,
    scoreValue: 40,
    ticketReward: 1,
    scale: 1.0,
    badgeColor: '#94a3b8',
    specialTrait: 'Weaves sideways along forest trails while admiring the scenery.',
    tacticalCounter: 'Any basic Watchtower or Palisade Wall easily stops them.',
    quips: [
      'Excuse me, is this the buffet?',
      'Left at the spooky oak, right?',
      'Do you validate parking?',
      'I lost my trail map in 1994!',
    ],
  },
  swift_stumbler: {
    type: 'swift_stumbler',
    name: 'Swift Stumbler',
    subtitle: 'Hyper-Caffeinated Trail Runner',
    maxHp: 72,
    speed: 2.95,
    damage: 11,
    attackInterval: 0.85,
    scoreValue: 70,
    ticketReward: 1,
    scale: 0.94,
    isElite: true,
    badgeColor: '#fb923c',
    specialTrait: 'Fastest unit; slips past outer-ring pads and triggers +45% Surge Dash when wounded or near the Fort.',
    tacticalCounter: 'Slow effects (Lantern Flare, Spike Trap, Tar-Pitch Barricade) cancel Surge Dash and cut speed by 60%.',
    quips: [
      'Outta my way, Im beating my personal best!',
      'Triple espresso from the bog cafe!!',
      'Cant stop, wont stop, ankles optional!',
      'Cardio first, nibbles second!',
    ],
  },
  armored_undead: {
    type: 'armored_undead',
    name: 'Armored Undead',
    subtitle: 'Cast-Iron Kettle Knight',
    maxHp: 285,
    armorHp: 90,
    speed: 1.05,
    damage: 24,
    attackInterval: 1.6,
    scoreValue: 130,
    ticketReward: 2,
    scale: 1.22,
    isElite: true,
    badgeColor: '#38bdf8',
    specialTrait: '90 Armor Plating reduces light ranged/trap damage by 45% and resists knockback by 70% until shattered.',
    tacticalCounter: 'Catapult boulders, Cinder Braziers, Sniper Watchtowers, and Rue’s Hammer/Flare deal 1.8x Armor Shatter!',
    quips: [
      'Clang! That tickled my cast-iron pot!',
      '100% recycled cauldron armor!',
      'Arrows? In THIS economy?!',
      'Mind the rivets, I just polished them!',
    ],
  },
  bone_howler: {
    type: 'bone_howler',
    name: 'Bone Howler',
    subtitle: 'Megaphone Trail-Leader',
    maxHp: 135,
    speed: 1.5,
    damage: 14,
    attackInterval: 1.35,
    scoreValue: 105,
    ticketReward: 2,
    scale: 1.1,
    isElite: true,
    badgeColor: '#2dd4bf',
    specialTrait: 'Blows a spooky horn every 4.5s, granting nearby undead +28% Frenzy Haste.',
    tacticalCounter: 'Focus fire with Watchtowers or Rue’s Hammer Bonk before it rallies Armored Undead.',
    quips: [
      'Awooo! Pick up the pace, shamblers!',
      'Testing, testing, one-two-BITE!',
      'Step lively! The Fort awaits!',
      'Everybody hustle to the lantern!',
    ],
  },
  grinner: {
    type: 'grinner',
    name: 'The Grinner',
    subtitle: 'Overly Polite Sprinter',
    maxHp: 65,
    speed: 2.45,
    damage: 12,
    attackInterval: 1.0,
    scoreValue: 55,
    ticketReward: 1,
    scale: 0.96,
    badgeColor: '#a3e635',
    specialTrait: 'Sprints in cheerful rhythmic bursts while waving politely.',
    tacticalCounter: 'Volley Repeater Watchtowers and Guard Tent badgers.',
    quips: [
      'Hiya neighbor!! Wonderful night!',
      'Mind if I borrow a cup of brains?',
      'Keep smiling! It confuses the rangers!',
      'Wave back! Dont be rude!',
    ],
  },
  grumble: {
    type: 'grumble',
    name: 'Old Grumble',
    subtitle: 'Draft-Hating Pajama Grump',
    maxHp: 95,
    speed: 1.75,
    damage: 15,
    attackInterval: 1.2,
    scoreValue: 65,
    ticketReward: 1,
    scale: 1.05,
    badgeColor: '#60a5fa',
    specialTrait: 'Aggressively detours from 5.2m away to smash warm Campfires and outer structures.',
    tacticalCounter: 'Place Spike Traps or Palisades near Campfires to intercept him.',
    quips: [
      'Terrible draft in this clearing!',
      'Who turned the thermostat down?!',
      'In my day, forts had central heating!',
      'My slippers are soaked in dew!',
    ],
  },
  gawp: {
    type: 'gawp',
    name: 'Gawp',
    subtitle: 'Fence-Wearing Optimist',
    maxHp: 175,
    speed: 1.2,
    damage: 18,
    attackInterval: 1.5,
    scoreValue: 90,
    ticketReward: 2,
    scale: 1.15,
    badgeColor: '#eab308',
    specialTrait: 'Stuck wooden picket fence deflects 25% of single-target ranged bolt damage.',
    tacticalCounter: 'Ground Spike Traps, Palisade thorns, and splash boulders bypass his waist fence.',
    quips: [
      'I brought my own palisade!',
      'Honestly, the fence is growing on me!',
      'Great lumbar support, 10 out of 10!',
      'Im not leaving, everyone here is so nice!',
    ],
  },
  brine: {
    type: 'brine',
    name: 'Brine',
    subtitle: 'Dripping Swamp Bog-Walker',
    maxHp: 115,
    speed: 1.6,
    damage: 14,
    attackInterval: 1.25,
    scoreValue: 80,
    ticketReward: 2,
    scale: 1.08,
    badgeColor: '#10b981',
    specialTrait: 'Leaves slippery pond-slime puddles every 2.8s that slow Ranger Rue’s movement.',
    tacticalCounter: 'Eliminate at long range with Watchtowers and Catapults before he slimes inner paths.',
    quips: [
      'Moist greetings from the bog!',
      'Sorry about the carpet, it drips!',
      '100% organic pond slime!',
      'Slippery when undead!',
    ],
  },
  baron: {
    type: 'baron',
    name: 'Baron Blight',
    subtitle: 'Theatrical Aristocrat of Doom',
    maxHp: 560,
    armorHp: 110,
    speed: 1.35,
    damage: 34,
    attackInterval: 1.8,
    scoreValue: 500,
    ticketReward: 5,
    scale: 1.55,
    isBoss: true,
    isElite: true,
    badgeColor: '#c084fc',
    specialTrait: 'Final Boss: 110 Royal Velvet Armor & 0.65s telegraphed cane slam that shakes the clearing.',
    tacticalCounter: 'Sharpshooter Nest Watchtowers (1.5x Boss Crit) + Lantern Flare during windup.',
    quips: [
      'Behold! A tragedy in three bites!',
      'Critics called my entrance breathtaking!',
      'Spotlights on me, Ranger Rue!',
      'Your rustic fort lacks dramatic flair!',
    ],
  },
};

export function createInitialPads(): PlacementPad[] {
  // 8 well-spaced pads in two rings around the central Fort at (0, 0)
  return [
    { id: 1, x: -5.5, z: -4.2, ring: 'inner', label: 'NW Inner Pad', building: null },
    { id: 2, x: 5.5, z: -4.2, ring: 'inner', label: 'NE Inner Pad', building: null },
    { id: 3, x: -5.5, z: 4.2, ring: 'inner', label: 'SW Inner Pad', building: null },
    { id: 4, x: 5.5, z: 4.2, ring: 'inner', label: 'SE Inner Pad', building: null },
    { id: 5, x: 0, z: -8.2, ring: 'outer', label: 'North Trail Pad', building: null },
    { id: 6, x: 8.8, z: 0, ring: 'outer', label: 'East Trail Pad', building: null },
    { id: 7, x: 0, z: 8.2, ring: 'outer', label: 'South Trail Pad', building: null },
    { id: 8, x: -8.8, z: 0, ring: 'outer', label: 'West Trail Pad', building: null },
  ];
}

export function canAfford(
  resources: Resources,
  cost: { wood: number; stone: number; food: number; tickets?: number }
): boolean {
  const neededTickets = cost.tickets ?? 0;
  return (
    resources.wood >= cost.wood &&
    resources.stone >= cost.stone &&
    resources.food >= cost.food &&
    resources.tickets >= neededTickets
  );
}

export function deductCost(
  resources: Resources,
  cost: { wood: number; stone: number; food: number; tickets?: number }
): Resources {
  const neededTickets = cost.tickets ?? 0;
  return {
    wood: Math.max(0, resources.wood - cost.wood),
    stone: Math.max(0, resources.stone - cost.stone),
    food: Math.max(0, resources.food - cost.food),
    tickets: Math.max(0, resources.tickets - neededTickets),
  };
}

export function buildStructureOnPad(
  pad: PlacementPad,
  resources: Resources,
  type: BuildingType
): { updatedPad: PlacementPad; updatedResources: Resources; success: boolean } {
  if (pad.building !== null) {
    return { updatedPad: pad, updatedResources: resources, success: false };
  }
  const spec = BUILDING_CATALOG[type];
  if (!canAfford(resources, spec.cost)) {
    return { updatedPad: pad, updatedResources: resources, success: false };
  }
  const updatedResources = deductCost(resources, spec.cost);
  const updatedPad: PlacementPad = {
    ...pad,
    building: {
      type,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      upgradePath: null,
      cooldown: 0,
      level: 1,
    },
  };
  return { updatedPad, updatedResources, success: true };
}

export function upgradeStructureOnPad(
  pad: PlacementPad,
  resources: Resources,
  pathId: 'pathA' | 'pathB'
): { updatedPad: PlacementPad; updatedResources: Resources; success: boolean } {
  if (!pad.building || pad.building.upgradePath !== null) {
    return { updatedPad: pad, updatedResources: resources, success: false };
  }
  const spec = BUILDING_CATALOG[pad.building.type];
  const pathSpec = spec.paths[pathId];
  if (!canAfford(resources, pathSpec.cost)) {
    return { updatedPad: pad, updatedResources: resources, success: false };
  }
  const updatedResources = deductCost(resources, pathSpec.cost);
  const newMaxHp = pad.building.maxHp + pathSpec.hpBonus;
  const updatedPad: PlacementPad = {
    ...pad,
    building: {
      ...pad.building,
      hp: newMaxHp,
      maxHp: newMaxHp,
      upgradePath: pathId,
      level: 2,
    },
  };
  return { updatedPad, updatedResources, success: true };
}

export function getEffectiveBuildingStats(
  type: BuildingType,
  upgradePath: UpgradePathId
): {
  damage: number;
  range: number;
  attackInterval: number;
  maxHp: number;
  specialEffect: string | null;
} {
  const base = BUILDING_CATALOG[type];
  if (!upgradePath) {
    return {
      damage: base.damage,
      range: base.range,
      attackInterval: base.attackInterval,
      maxHp: base.maxHp,
      specialEffect: null,
    };
  }
  const up = base.paths[upgradePath];
  return {
    damage: base.damage + up.damageBonus,
    range: base.range + up.rangeBonus,
    attackInterval: base.attackInterval / up.attackRateMultiplier,
    maxHp: base.maxHp + up.hpBonus,
    specialEffect: up.specialEffect,
  };
}

/**
 * Pure helper computing effective movement speed for any zombie archetype,
 * accounting for Swift Stumbler Surge Dash & Slow vulnerability, Armored Undead
 * post-shatter acceleration, Grinner sprint bursts, and Bone Howler Frenzy aura.
 */
export function computeZombieEffectiveSpeed(
  z: Pick<
    ZombieEntity,
    | 'type'
    | 'baseSpeed'
    | 'slowTimer'
    | 'dashTimer'
    | 'frenzyTimer'
    | 'hp'
    | 'maxHp'
    | 'armorHp'
    | 'walkPhase'
  >
): number {
  let speed = z.baseSpeed;

  if (z.type === 'swift_stumbler') {
    if (z.slowTimer > 0) {
      // Tactical counter: Slows strip Swift Stumbler's Surge Dash and cut speed by 60%
      return speed * 0.4;
    }
    const isSurging = z.dashTimer > 0 || z.hp < z.maxHp * 0.75;
    if (isSurging) {
      speed *= 1.45;
    }
  } else if (z.type === 'armored_undead') {
    // Once cast-iron armor is shattered, Armored Undead moves 20% faster
    if (z.armorHp <= 0) {
      speed *= 1.2;
    }
    if (z.slowTimer > 0) {
      speed *= 0.58;
    }
  } else if (z.type === 'grinner') {
    speed *= 1.0 + Math.max(0, Math.sin(z.walkPhase * 0.5)) * 0.45;
    if (z.slowTimer > 0) {
      speed *= 0.52;
    }
  } else {
    if (z.slowTimer > 0) {
      speed *= 0.52;
    }
  }

  if (z.frenzyTimer > 0 && z.slowTimer <= 0) {
    speed *= 1.28;
  }

  return speed;
}

/**
 * Pure helper applying tactical damage to a zombie, resolving Armored Undead's
 * ablative armor plating, Gawp's ranged fence shield, Swift Stumbler trap vulnerability,
 * and Baron Blight sniper crits.
 */
export function applyDamageToZombie(
  z: Pick<ZombieEntity, 'type' | 'hp' | 'armorHp' | 'hitFlashTimer' | 'koTimer'>,
  rawDamage: number,
  source: 'projectile' | 'melee' | 'trap' | 'flare' | 'splash',
  specialEffect?: string | null
): { actualHpDamage: number; armorDamage: number; armorShattered: boolean } {
  let damage = rawDamage;

  if (specialEffect === 'sniper_crit' && (z.type === 'baron' || z.type === 'armored_undead')) {
    damage = Math.round(damage * 1.5);
  }

  // Swift Stumblers take +25% bonus damage from ground Spike Traps
  if (z.type === 'swift_stumbler' && source === 'trap') {
    damage = Math.round(damage * 1.25);
  }

  // Gawp's wooden fence reduces non-splash ranged projectile damage by 25%
  if (z.type === 'gawp' && source === 'projectile') {
    damage = Math.round(damage * 0.75);
  }

  let armorDamage = 0;
  let armorShattered = false;

  if (z.armorHp > 0) {
    const isHeavyShatter =
      source === 'splash' ||
      source === 'flare' ||
      source === 'melee' ||
      specialEffect === 'sniper_crit' ||
      specialEffect === 'meteor_splash' ||
      specialEffect === 'ember_splash';

    armorDamage = isHeavyShatter ? Math.round(damage * 1.8) : damage;
    const prevArmor = z.armorHp;
    z.armorHp = Math.max(0, z.armorHp - armorDamage);
    if (prevArmor > 0 && z.armorHp === 0) {
      armorShattered = true;
    }

    // While armor holds (or on the hit that chips it), light projectiles/traps deal 45% less HP damage
    if (!isHeavyShatter) {
      damage = Math.max(1, Math.round(damage * 0.55));
    } else {
      damage = Math.max(1, Math.round(damage * 0.85));
    }
  }

  z.hp = Math.max(0, z.hp - damage);
  z.hitFlashTimer = 0.14;
  if (z.hp <= 0 && z.koTimer <= 0) {
    z.koTimer = 0.35;
  }

  return {
    actualHpDamage: damage,
    armorDamage,
    armorShattered,
  };
}

/**
 * Bone Howler war-cry rally: grants Frenzy Haste (+28% speed) to nearby undead within radius.
 */
export function applyBoneHowlerRally(
  howler: Pick<ZombieEntity, 'id' | 'x' | 'z'>,
  zombies: ZombieEntity[],
  radius = 5.2
): number {
  let ralliedCount = 0;
  for (const z of zombies) {
    if (z.isDead || z.koTimer > 0) continue;
    const d = Math.hypot(z.x - howler.x, z.z - howler.z);
    if (d <= radius) {
      z.frenzyTimer = Math.max(z.frenzyTimer, 2.8);
      if (z.type === 'swift_stumbler') {
        z.dashTimer = Math.max(z.dashTimer, 2.2);
      }
      ralliedCount++;
    }
  }
  return ralliedCount;
}

export function applyLanternFlareToZombies(
  rueX: number,
  rueZ: number,
  zombies: ZombieEntity[],
  radius: number = LANTERN_FLARE_RADIUS
): { affectedCount: number; shatteredCount: number } {
  let affectedCount = 0;
  let shatteredCount = 0;
  for (const z of zombies) {
    if (z.isDead) continue;
    const dx = z.x - rueX;
    const dz = z.z - rueZ;
    const dist = Math.hypot(dx, dz);
    if (dist <= radius) {
      affectedCount++;
      const nx = dist > 0.001 ? dx / dist : 0;
      const nz = dist > 0.001 ? dz / dist : 1;
      const kbScale =
        z.type === 'baron'
          ? 0.45
          : z.type === 'armored_undead' && z.armorHp > 0
          ? 0.3
          : z.type === 'gawp'
          ? 0.65
          : 1.0;
      z.x += nx * LANTERN_FLARE_KNOCKBACK * kbScale;
      z.z += nz * LANTERN_FLARE_KNOCKBACK * kbScale;
      z.slowTimer = Math.max(z.slowTimer, LANTERN_FLARE_SLOW_DURATION);
      z.dashTimer = 0;
      z.frenzyTimer = 0;

      const dmgRes = applyDamageToZombie(z, LANTERN_FLARE_DAMAGE, 'flare');
      if (dmgRes.armorShattered) {
        shatteredCount++;
      }
      if (z.hp <= 0 && z.koTimer <= 0) {
        z.koTimer = 0.4;
      }
    }
  }
  return { affectedCount, shatteredCount };
}

export function getWaveComposition(dayNumber: number): ZombieArchetype[] {
  if (dayNumber <= 1) {
    return [
      'swift_stumbler',
      'armored_undead',
      'shamble',
      'grinner',
      'shamble',
      'swift_stumbler',
      'grumble',
      'gawp',
      'shamble',
    ];
  }
  if (dayNumber === 2) {
    return [
      'swift_stumbler',
      'armored_undead',
      'bone_howler',
      'grinner',
      'brine',
      'swift_stumbler',
      'armored_undead',
      'grumble',
      'gawp',
      'bone_howler',
      'swift_stumbler',
      'brine',
    ];
  }
  return [
    'swift_stumbler',
    'armored_undead',
    'bone_howler',
    'grinner',
    'brine',
    'armored_undead',
    'swift_stumbler',
    'gawp',
    'bone_howler',
    'grumble',
    'baron',
    'swift_stumbler',
    'armored_undead',
    'brine',
  ];
}

export function getWaveThreatArchetypes(dayNumber: number): ZombieArchetype[] {
  const wave = getWaveComposition(dayNumber);
  const unique: ZombieArchetype[] = [];
  for (const arch of wave) {
    if (!unique.includes(arch)) {
      unique.push(arch);
    }
  }
  return unique;
}

export function calculateRunScore(params: {
  zombiesDefeated: number;
  fortHp: number;
  resources: Resources;
  victory: boolean;
  dayNumber: number;
}): number {
  const base = params.zombiesDefeated * 65;
  const fortBonus = Math.round(params.fortHp * 1.5);
  const resourceBonus =
    params.resources.wood * 2 +
    params.resources.stone * 3 +
    params.resources.food * 3 +
    params.resources.tickets * 75;
  const waveBonus = params.dayNumber * 200;
  const victoryBonus = params.victory ? 1000 : 0;
  return Math.max(0, base + fortBonus + resourceBonus + waveBonus + victoryBonus);
}

export function evaluateGameOutcome(params: {
  fortHp: number;
  dayNumber: number;
  maxDays: number;
  phase: 'day' | 'night';
  activeZombiesCount: number;
  pendingWaveSpawns: number;
}): 'victory' | 'defeat' | null {
  if (params.fortHp <= 0) {
    return 'defeat';
  }
  if (
    params.phase === 'night' &&
    params.dayNumber >= params.maxDays &&
    params.activeZombiesCount === 0 &&
    params.pendingWaveSpawns === 0
  ) {
    return 'victory';
  }
  return null;
}
