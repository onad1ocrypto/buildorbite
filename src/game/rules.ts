import {
  BuildingCatalogItem,
  BuildingType,
  DayNightPhase,
  FenceSegment,
  FenceSide,
  HeroAnimState,
  PendingConstructionTask,
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
export const HERO_CONSTRUCTION_DURATION = 0.65;

// Outer Square Perimeter Fence constants (19.2m x 19.2m square box around the inner weapon pads)
export const FENCE_HALF_EXTENT = 9.6;
export const FENCE_SEGMENT_LENGTH = 6.2;
export const FENCE_LEVEL1_MAX_HP = 240;
export const FENCE_LEVEL2_MAX_HP = 420;
export const FENCE_BUILD_COST = { wood: 15, stone: 5, food: 0 };
export const FENCE_UPGRADE_COST = { wood: 20, stone: 15, food: 0 };
export const FENCE_REPAIR_COST = { wood: 8, stone: 4, food: 0 };

export const INITIAL_RESOURCES: Resources = {
  wood: 165,
  stone: 95,
  food: 65,
  tickets: 3,
};

export const BUILDING_CATALOG: Record<BuildingType, BuildingCatalogItem> = {
  palisade: {
    type: 'palisade',
    keybind: '1',
    name: 'Palisade Wall',
    role: 'Inner Barricade · Blocks & Thorns',
    description: 'Stout sharpened logs that reinforce inner lanes and deal thorn damage.',
    cost: { wood: 25, stone: 10, food: 0 },
    maxHp: 260,
    damage: 14,
    range: 4.6,
    attackInterval: 1.4,
    paths: {
      pathA: {
        id: 'pathA',
        name: 'Ironbark Spikes',
        tagline: '+180 HP & heavy thorn counter-damage on contact',
        cost: { wood: 30, stone: 25, food: 0, tickets: 0 },
        hpBonus: 180,
        damageBonus: 22,
        rangeBonus: 0.6,
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
        rangeBonus: 1.4,
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
    description: 'Elevated ranger lookout inside the fence firing bolts over the perimeter wall.',
    cost: { wood: 35, stone: 15, food: 5 },
    maxHp: 150,
    damage: 26,
    range: 12.2,
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
    description: 'Concealed floor spikes that impale zombies at the fence line and inner lanes.',
    cost: { wood: 20, stone: 20, food: 0 },
    maxHp: 140,
    damage: 22,
    range: 5.4,
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
        rangeBonus: 0.6,
        attackRateMultiplier: 1.35,
        specialEffect: 'knockback_trap',
      },
    },
  },
  campfire: {
    type: 'campfire',
    keybind: '4',
    name: 'Campfire',
    role: 'Support Hearth · Heals Fort & Lobs Sparks',
    description: 'Cozy crackling blaze inside the compound that repairs the Fort and lobs sparks.',
    cost: { wood: 25, stone: 15, food: 15 },
    maxHp: 160,
    damage: 15,
    range: 9.5,
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
        tagline: 'Flings explosive ember fireballs across the fence line',
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
    description: 'Timber torsion arm hurling hefty boulders over the square fence at zombie mobs.',
    cost: { wood: 40, stone: 35, food: 10 },
    maxHp: 170,
    damage: 48,
    range: 14.5,
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
    role: 'Critter Garrison · Fast Strikes & Forage',
    description: 'Canvas ranger tent inside the fence dispatching trained pine-badgers.',
    cost: { wood: 30, stone: 10, food: 25 },
    maxHp: 180,
    damage: 24,
    range: 10.5,
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

export const HERO_RUE_PORTRAIT_URL = '/assets/aistudio/hero-ranger-rue_33302ab4.png';

export const ZOMBIE_CATALOG: Record<ZombieArchetype, ZombieSpec> = {
  shamble: {
    type: 'shamble',
    name: 'Shamble',
    subtitle: 'Dazed Map-Holding Lost Hiker',
    portraitUrl: '/assets/aistudio/zombie-shamble_61f30384.png',
    maxHp: 75,
    speed: 1.55,
    damage: 10,
    attackInterval: 1.3,
    scoreValue: 40,
    ticketReward: 1,
    scale: 1.0,
    badgeColor: '#84a98c',
    specialTrait: 'Hunched dazed hiker holding a trail map, satchel & wooden mug while pointing down the path.',
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
    subtitle: 'Top-Hatted Polite Sprinter',
    portraitUrl: '/assets/aistudio/zombie-the-grinner_d6bb8107.png',
    maxHp: 65,
    speed: 2.45,
    damage: 12,
    attackInterval: 1.0,
    scoreValue: 55,
    ticketReward: 1,
    scale: 1.14,
    badgeColor: '#2dd4bf',
    specialTrait: 'Tall Victorian gentleman in a slate-teal tailcoat & top hat who sprints in bursts while waving politely with a huge grin.',
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
    subtitle: 'Nightcap-Wearing Pajama Grump',
    portraitUrl: '/assets/aistudio/zombie-old-grumble_bb4afa58.png',
    maxHp: 95,
    speed: 1.75,
    damage: 15,
    attackInterval: 1.2,
    scoreValue: 65,
    ticketReward: 1,
    scale: 1.05,
    badgeColor: '#60a5fa',
    specialTrait: 'Grumpy bearded elder in striped pajamas & pom-pom nightcap with arms crossed; detours to smash warm Campfires.',
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
    subtitle: 'Fence-Straddling Optimist',
    portraitUrl: '/assets/aistudio/zombie-gawp_229ab66e.png',
    maxHp: 175,
    speed: 1.2,
    damage: 18,
    attackInterval: 1.5,
    scoreValue: 90,
    ticketReward: 2,
    scale: 1.15,
    badgeColor: '#eab308',
    specialTrait: 'Stuck straddling a wide two-rail wooden fence with iron-banded posts that deflects 25% of single-target ranged bolt damage.',
    tacticalCounter: 'Ground Spike Traps, Palisade thorns, and splash boulders bypass his wooden fence.',
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
    subtitle: 'Slime-Dripping Bog Hulk',
    portraitUrl: '/assets/aistudio/zombie-brine_21fe32ea.png',
    maxHp: 115,
    speed: 1.6,
    damage: 14,
    attackInterval: 1.25,
    scoreValue: 80,
    ticketReward: 2,
    scale: 1.1,
    badgeColor: '#4ade80',
    specialTrait: 'Swamp-logged brute with cattail reeds & hip rope who drools glowing neon-green slime puddles that slow Ranger Rue.',
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
    subtitle: 'Crowned Fungal Warlord (Boss)',
    portraitUrl: '/assets/aistudio/zombie-baron-blight_8c63ec26.png',
    maxHp: 560,
    armorHp: 110,
    speed: 1.35,
    damage: 34,
    attackInterval: 1.8,
    scoreValue: 500,
    ticketReward: 5,
    scale: 1.52,
    isBoss: true,
    isElite: true,
    badgeColor: '#f59e0b',
    specialTrait: 'Final Boss: Golden crown, crimson cape, glowing mushroom pauldrons (110 Armor), and a spiked skull staff slam!',
    tacticalCounter: 'Sharpshooter Nest Watchtowers (1.5x Boss Crit) + Lantern Flare during windup.',
    quips: [
      'Behold! My fungal kingdom rises!',
      'Kneel before the Crown of Blight!',
      'My skull staff hungers for your Fort!',
      'Spotlights on me, Ranger Rue!',
    ],
  },
};

export function createInitialPads(): PlacementPad[] {
  // 8 Weapon Pads arranged in an inner square compound inside the ±9.6m outer Square Fence
  return [
    { id: 1, x: -5.6, z: -5.6, ring: 'inner', label: 'NW Corner Weapon Pad', building: null },
    { id: 2, x: 5.6, z: -5.6, ring: 'inner', label: 'NE Corner Weapon Pad', building: null },
    { id: 3, x: -5.6, z: 5.6, ring: 'inner', label: 'SW Corner Weapon Pad', building: null },
    { id: 4, x: 5.6, z: 5.6, ring: 'inner', label: 'SE Corner Weapon Pad', building: null },
    { id: 5, x: 0, z: -5.8, ring: 'outer', label: 'North Lane Weapon Pad', building: null },
    { id: 6, x: 5.8, z: 0, ring: 'outer', label: 'East Lane Weapon Pad', building: null },
    { id: 7, x: 0, z: 5.8, ring: 'outer', label: 'South Lane Weapon Pad', building: null },
    { id: 8, x: -5.8, z: 0, ring: 'outer', label: 'West Lane Weapon Pad', building: null },
  ];
}

export function createInitialFenceSegments(): FenceSegment[] {
  const offsets: [-6.2, 0, 6.2] = [-6.2, 0, 6.2];
  const sideConfigs: {
    side: FenceSide;
    sideLabel: string;
    rotY: number;
    coordForSlot: (offset: number) => { x: number; z: number };
  }[] = [
    {
      side: 'north',
      sideLabel: 'Utara',
      rotY: 0,
      coordForSlot: (off) => ({ x: off, z: -FENCE_HALF_EXTENT }),
    },
    {
      side: 'east',
      sideLabel: 'Timur',
      rotY: Math.PI / 2,
      coordForSlot: (off) => ({ x: FENCE_HALF_EXTENT, z: off }),
    },
    {
      side: 'south',
      sideLabel: 'Selatan',
      rotY: 0,
      coordForSlot: (off) => ({ x: off, z: FENCE_HALF_EXTENT }),
    },
    {
      side: 'west',
      sideLabel: 'Barat',
      rotY: Math.PI / 2,
      coordForSlot: (off) => ({ x: -FENCE_HALF_EXTENT, z: off }),
    },
  ];

  const segments: FenceSegment[] = [];
  let nextId = 1;
  for (const cfg of sideConfigs) {
    for (let s = 0; s < 3; s++) {
      const slotIndex = s as 0 | 1 | 2;
      const isGate = slotIndex === 1;
      const pos = cfg.coordForSlot(offsets[s]);
      // Start with the 4 cardinal Trail Gates erected (Level 1) and the 8 side/corner wall segments at Level 0
      // so Ranger Rue actively assembles the square perimeter step-by-step!
      const initialLevel: 0 | 1 | 2 = isGate ? 1 : 0;
      const initialMaxHp = FENCE_LEVEL1_MAX_HP;
      segments.push({
        id: nextId++,
        side: cfg.side,
        slotIndex,
        isGate,
        label: isGate
          ? `Gerbang ${cfg.sideLabel} (${cfg.side.toUpperCase()}-2)`
          : `Pagar ${cfg.sideLabel} ${s + 1} (${cfg.side.toUpperCase()}-${s + 1})`,
        x: pos.x,
        z: pos.z,
        rotationY: cfg.rotY,
        length: FENCE_SEGMENT_LENGTH,
        level: initialLevel,
        hp: initialLevel > 0 ? initialMaxHp : 0,
        maxHp: initialMaxHp,
        buildProgress: initialLevel > 0 ? 1 : 0,
      });
    }
  }
  return segments;
}

export const NIGHT_BUILD_LOCKED_MESSAGE = 'Night has fallen — defend the fort!';
export const FLARE_NIGHT_LOCKED_MESSAGE = 'Lantern Flare can only be used at night!';

/**
 * Locked gameplay rule: Ranger Rue can only place/build, upgrade, repair, or salvage structures during the Day phase.
 * During the Night phase, construction and upgrade actions are rejected while combat abilities remain active.
 */
export function canPerformConstructionInPhase(phase: DayNightPhase): boolean {
  return phase === 'day';
}

/**
 * Lantern Flare combat ability is only usable during Night phase and when off cooldown.
 */
export function canTriggerLanternFlare(
  phase: DayNightPhase,
  flareCooldown: number
): { allowed: boolean; reason?: 'day_locked' | 'cooldown' } {
  if (phase !== 'night') {
    return { allowed: false, reason: 'day_locked' };
  }
  if (flareCooldown > 0.05) {
    return { allowed: false, reason: 'cooldown' };
  }
  return { allowed: true };
}

/**
 * Progressively assembles an unbuilt (level 0) fence segment when Ranger Rue hammers it during Day phase.
 * Deducts FENCE_BUILD_COST (15W, 5S) when assembly completes (buildProgress >= 1).
 */
export function advanceFenceSegmentBuild(
  segment: FenceSegment,
  resources: Resources,
  progressDelta: number,
  phase: DayNightPhase = 'day'
): {
  updatedSegment: FenceSegment;
  updatedResources: Resources;
  completed: boolean;
  success: boolean;
  reason?: 'night_locked' | 'insufficient_resources' | 'already_built';
} {
  if (!canPerformConstructionInPhase(phase)) {
    return {
      updatedSegment: segment,
      updatedResources: resources,
      completed: false,
      success: false,
      reason: 'night_locked',
    };
  }
  if (segment.level > 0) {
    return {
      updatedSegment: segment,
      updatedResources: resources,
      completed: false,
      success: false,
      reason: 'already_built',
    };
  }
  if (!canAfford(resources, FENCE_BUILD_COST)) {
    return {
      updatedSegment: segment,
      updatedResources: resources,
      completed: false,
      success: false,
      reason: 'insufficient_resources',
    };
  }
  const nextProgress = Math.min(1, segment.buildProgress + progressDelta);
  if (nextProgress >= 1) {
    const updatedResources = deductCost(resources, FENCE_BUILD_COST);
    const updatedSegment: FenceSegment = {
      ...segment,
      level: 1,
      hp: FENCE_LEVEL1_MAX_HP,
      maxHp: FENCE_LEVEL1_MAX_HP,
      buildProgress: 1,
    };
    return {
      updatedSegment,
      updatedResources,
      completed: true,
      success: true,
    };
  }
  return {
    updatedSegment: {
      ...segment,
      buildProgress: nextProgress,
    },
    updatedResources: resources,
    completed: false,
    success: true,
  };
}

/**
 * Direct click / button action on a fence segment (allowed only during Day phase):
 * - Level 0 -> Builds Level 1 Timber Palisade Fence (15W, 5S)
 * - Damaged Level 1/2 -> Repairs to full HP (8W, 4S)
 * - Full HP Level 1 -> Upgrades to Level 2 Ironbark Spiked Fence (20W, 15S)
 */
export function buildOrUpgradeFenceSegment(
  segment: FenceSegment,
  resources: Resources,
  phase: DayNightPhase = 'day'
): {
  updatedSegment: FenceSegment;
  updatedResources: Resources;
  action: 'built' | 'upgraded' | 'repaired' | 'none';
  success: boolean;
  reason?: 'night_locked' | 'insufficient_resources' | 'max_level';
} {
  if (!canPerformConstructionInPhase(phase)) {
    return {
      updatedSegment: segment,
      updatedResources: resources,
      action: 'none',
      success: false,
      reason: 'night_locked',
    };
  }

  if (segment.level === 0) {
    if (!canAfford(resources, FENCE_BUILD_COST)) {
      return {
        updatedSegment: segment,
        updatedResources: resources,
        action: 'none',
        success: false,
        reason: 'insufficient_resources',
      };
    }
    return {
      updatedSegment: {
        ...segment,
        level: 1,
        hp: FENCE_LEVEL1_MAX_HP,
        maxHp: FENCE_LEVEL1_MAX_HP,
        buildProgress: 1,
      },
      updatedResources: deductCost(resources, FENCE_BUILD_COST),
      action: 'built',
      success: true,
    };
  }

  if (segment.hp < segment.maxHp) {
    if (!canAfford(resources, FENCE_REPAIR_COST)) {
      return {
        updatedSegment: segment,
        updatedResources: resources,
        action: 'none',
        success: false,
        reason: 'insufficient_resources',
      };
    }
    return {
      updatedSegment: {
        ...segment,
        hp: segment.maxHp,
      },
      updatedResources: deductCost(resources, FENCE_REPAIR_COST),
      action: 'repaired',
      success: true,
    };
  }

  if (segment.level === 1) {
    if (!canAfford(resources, FENCE_UPGRADE_COST)) {
      return {
        updatedSegment: segment,
        updatedResources: resources,
        action: 'none',
        success: false,
        reason: 'insufficient_resources',
      };
    }
    return {
      updatedSegment: {
        ...segment,
        level: 2,
        hp: FENCE_LEVEL2_MAX_HP,
        maxHp: FENCE_LEVEL2_MAX_HP,
        buildProgress: 1,
      },
      updatedResources: deductCost(resources, FENCE_UPGRADE_COST),
      action: 'upgraded',
      success: true,
    };
  }

  return {
    updatedSegment: segment,
    updatedResources: resources,
    action: 'none',
    success: false,
    reason: 'max_level',
  };
}

/**
 * Finds the highest-priority fence segment for Ranger Rue to assemble, repair, or upgrade next.
 */
export function findNextFenceSegmentForHero(
  rueX: number,
  rueZ: number,
  fenceSegments: FenceSegment[]
): FenceSegment | null {
  // 1. Unbuilt segments (level === 0) closest to Rue
  const unbuilt = fenceSegments.filter((s) => s.level === 0);
  if (unbuilt.length > 0) {
    unbuilt.sort(
      (a, b) => Math.hypot(a.x - rueX, a.z - rueZ) - Math.hypot(b.x - rueX, b.z - rueZ)
    );
    return unbuilt[0];
  }
  // 2. Damaged segments (hp < maxHp) closest to Rue
  const damaged = fenceSegments.filter((s) => s.level > 0 && s.hp < s.maxHp);
  if (damaged.length > 0) {
    damaged.sort(
      (a, b) => Math.hypot(a.x - rueX, a.z - rueZ) - Math.hypot(b.x - rueX, b.z - rueZ)
    );
    return damaged[0];
  }
  // 3. Level 1 segments ready for Level 2 upgrade
  const upgradable = fenceSegments.filter((s) => s.level === 1);
  if (upgradable.length > 0) {
    upgradable.sort(
      (a, b) => Math.hypot(a.x - rueX, a.z - rueZ) - Math.hypot(b.x - rueX, b.z - rueZ)
    );
    return upgradable[0];
  }
  return null;
}

/**
 * Determines which outer square fence segment blocks a zombie approaching the compound from outside.
 */
export function findBlockingFenceSegment(
  zX: number,
  zZ: number,
  fenceSegments: FenceSegment[]
): FenceSegment | null {
  const absX = Math.abs(zX);
  const absZ = Math.abs(zZ);
  // Only intercept zombies that are at or outside the inner edge of the fence perimeter
  if (Math.max(absX, absZ) < FENCE_HALF_EXTENT - 1.1) {
    return null;
  }

  let side: FenceSide;
  let lateralCoord: number;
  if (absZ >= absX) {
    side = zZ < 0 ? 'north' : 'south';
    lateralCoord = zX;
  } else {
    side = zX > 0 ? 'east' : 'west';
    lateralCoord = zZ;
  }

  const slotIndex: 0 | 1 | 2 =
    lateralCoord < -3.1 ? 0 : lateralCoord > 3.1 ? 2 : 1;

  const matching = fenceSegments.find(
    (s) => s.side === side && s.slotIndex === slotIndex && s.level > 0 && s.hp > 0
  );
  return matching ?? null;
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
  type: BuildingType,
  phase: DayNightPhase = 'day'
): {
  updatedPad: PlacementPad;
  updatedResources: Resources;
  success: boolean;
  reason?: 'night_locked' | 'occupied' | 'insufficient_resources';
} {
  if (!canPerformConstructionInPhase(phase)) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'night_locked',
    };
  }
  if (pad.building !== null) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'occupied',
    };
  }
  const spec = BUILDING_CATALOG[type];
  if (!canAfford(resources, spec.cost)) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'insufficient_resources',
    };
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
  pathId: 'pathA' | 'pathB',
  phase: DayNightPhase = 'day'
): {
  updatedPad: PlacementPad;
  updatedResources: Resources;
  success: boolean;
  reason?: 'night_locked' | 'invalid_pad' | 'insufficient_resources';
} {
  if (!canPerformConstructionInPhase(phase)) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'night_locked',
    };
  }
  if (!pad.building || pad.building.upgradePath !== null) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'invalid_pad',
    };
  }
  const spec = BUILDING_CATALOG[pad.building.type];
  const pathSpec = spec.paths[pathId];
  if (!canAfford(resources, pathSpec.cost)) {
    return {
      updatedPad: pad,
      updatedResources: resources,
      success: false,
      reason: 'insufficient_resources',
    };
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

/**
 * Initiates a distinct 'construction' animation state for Ranger Rue when a fence segment is clicked or selected for build/upgrade.
 * The actual build/upgrade is deferred until the construction animation finishes via stepConstructionTask.
 */
export function startFenceConstructionTask(params: {
  segment: FenceSegment;
  resources: Resources;
  phase: DayNightPhase;
  currentTask: PendingConstructionTask | null;
  duration?: number;
}): {
  started: boolean;
  heroAnimState: HeroAnimState;
  task: PendingConstructionTask | null;
  reason?: 'night_locked' | 'busy_constructing' | 'insufficient_resources' | 'max_level';
} {
  const {
    segment,
    resources,
    phase,
    currentTask,
    duration = HERO_CONSTRUCTION_DURATION,
  } = params;

  if (!canPerformConstructionInPhase(phase)) {
    return {
      started: false,
      heroAnimState: currentTask ? 'construction' : 'idle',
      task: currentTask,
      reason: 'night_locked',
    };
  }

  if (currentTask !== null) {
    return {
      started: false,
      heroAnimState: 'construction',
      task: currentTask,
      reason: 'busy_constructing',
    };
  }

  if (segment.level === 0) {
    if (!canAfford(resources, FENCE_BUILD_COST)) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
  } else if (segment.hp < segment.maxHp) {
    if (!canAfford(resources, FENCE_REPAIR_COST)) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
  } else if (segment.level === 1) {
    if (!canAfford(resources, FENCE_UPGRADE_COST)) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
  } else {
    return {
      started: false,
      heroAnimState: 'idle',
      task: null,
      reason: 'max_level',
    };
  }

  return {
    started: true,
    heroAnimState: 'construction',
    task: {
      targetKind: 'fence',
      action: 'build_fence',
      targetId: segment.id,
      targetX: segment.x,
      targetZ: segment.z,
      label: segment.label,
      remainingTime: duration,
      totalTime: duration,
    },
  };
}

/**
 * Initiates a distinct 'construction' animation state for Ranger Rue when a weapon pad is clicked or selected for build/upgrade/repair.
 * The actual build/upgrade/repair is deferred until the construction animation finishes via stepConstructionTask.
 */
export function startPadConstructionTask(params: {
  pad: PlacementPad;
  resources: Resources;
  phase: DayNightPhase;
  currentTask: PendingConstructionTask | null;
  action: 'build_pad' | 'upgrade_pad' | 'repair_pad';
  buildingType?: BuildingType;
  upgradePath?: 'pathA' | 'pathB';
  duration?: number;
}): {
  started: boolean;
  heroAnimState: HeroAnimState;
  task: PendingConstructionTask | null;
  reason?:
    | 'night_locked'
    | 'busy_constructing'
    | 'insufficient_resources'
    | 'occupied'
    | 'invalid_pad';
} {
  const {
    pad,
    resources,
    phase,
    currentTask,
    action,
    buildingType,
    upgradePath,
    duration = HERO_CONSTRUCTION_DURATION,
  } = params;

  if (!canPerformConstructionInPhase(phase)) {
    return {
      started: false,
      heroAnimState: currentTask ? 'construction' : 'idle',
      task: currentTask,
      reason: 'night_locked',
    };
  }

  if (currentTask !== null) {
    return {
      started: false,
      heroAnimState: 'construction',
      task: currentTask,
      reason: 'busy_constructing',
    };
  }

  let label = pad.label;

  if (action === 'build_pad') {
    if (pad.building !== null) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'occupied',
      };
    }
    if (!buildingType) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'invalid_pad',
      };
    }
    const spec = BUILDING_CATALOG[buildingType];
    if (!canAfford(resources, spec.cost)) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
    label = `${spec.name} (P${pad.id})`;
  } else if (action === 'upgrade_pad') {
    if (!pad.building || pad.building.upgradePath !== null || !upgradePath) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'invalid_pad',
      };
    }
    const pathSpec = BUILDING_CATALOG[pad.building.type].paths[upgradePath];
    if (!canAfford(resources, pathSpec.cost)) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
    label = `${pathSpec.name} (P${pad.id})`;
  } else if (action === 'repair_pad') {
    if (!pad.building || pad.building.hp >= pad.building.maxHp) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'invalid_pad',
      };
    }
    if (!canAfford(resources, { wood: 10, stone: 5, food: 0 })) {
      return {
        started: false,
        heroAnimState: 'idle',
        task: null,
        reason: 'insufficient_resources',
      };
    }
    label = `Repair P${pad.id}`;
  }

  return {
    started: true,
    heroAnimState: 'construction',
    task: {
      targetKind: 'pad',
      action,
      targetId: pad.id,
      buildingType,
      upgradePath,
      targetX: pad.x,
      targetZ: pad.z,
      label,
      remainingTime: duration,
      totalTime: duration,
    },
  };
}

/**
 * Advances Ranger Rue's active 'construction' animation timer by dt.
 * While remainingTime > 0, heroAnimState stays 'construction' and no build/upgrade is applied yet.
 * Once remainingTime reaches 0, the pending fence or pad build/upgrade is applied and heroAnimState returns to 'idle'.
 */
export function stepConstructionTask(params: {
  task: PendingConstructionTask | null;
  dt: number;
  phase: DayNightPhase;
  fenceSegments: FenceSegment[];
  pads: PlacementPad[];
  resources: Resources;
}): {
  heroAnimState: HeroAnimState;
  task: PendingConstructionTask | null;
  completed: boolean;
  cancelledByNight?: boolean;
  fenceOutcome?: 'built' | 'upgraded' | 'repaired' | 'none';
  completedTask?: PendingConstructionTask;
  fenceSegments: FenceSegment[];
  pads: PlacementPad[];
  resources: Resources;
} {
  const { task, dt, phase, fenceSegments, pads, resources } = params;

  if (!task) {
    return {
      heroAnimState: 'idle',
      task: null,
      completed: false,
      fenceSegments,
      pads,
      resources,
    };
  }

  if (!canPerformConstructionInPhase(phase)) {
    return {
      heroAnimState: 'idle',
      task: null,
      completed: false,
      cancelledByNight: true,
      fenceSegments,
      pads,
      resources,
    };
  }

  const remainingTime = Math.max(0, task.remainingTime - dt);
  if (remainingTime > 0) {
    return {
      heroAnimState: 'construction',
      task: {
        ...task,
        remainingTime,
      },
      completed: false,
      fenceSegments,
      pads,
      resources,
    };
  }

  // Construction animation finished -> apply the deferred build/upgrade/repair
  if (task.targetKind === 'fence') {
    const targetSeg = fenceSegments.find((f) => f.id === task.targetId);
    if (!targetSeg) {
      return {
        heroAnimState: 'idle',
        task: null,
        completed: false,
        fenceSegments,
        pads,
        resources,
      };
    }
    const res = buildOrUpgradeFenceSegment(targetSeg, resources, phase);
    if (!res.success) {
      return {
        heroAnimState: 'idle',
        task: null,
        completed: false,
        fenceSegments,
        pads,
        resources,
      };
    }
    return {
      heroAnimState: 'idle',
      task: null,
      completed: true,
      fenceOutcome: res.action,
      completedTask: task,
      fenceSegments: fenceSegments.map((f) =>
        f.id === targetSeg.id ? res.updatedSegment : f
      ),
      pads,
      resources: res.updatedResources,
    };
  }

  // Pad targetKind
  const targetPad = pads.find((p) => p.id === task.targetId);
  if (!targetPad) {
    return {
      heroAnimState: 'idle',
      task: null,
      completed: false,
      fenceSegments,
      pads,
      resources,
    };
  }

  if (task.action === 'build_pad' && task.buildingType) {
    const res = buildStructureOnPad(targetPad, resources, task.buildingType, phase);
    if (!res.success) {
      return {
        heroAnimState: 'idle',
        task: null,
        completed: false,
        fenceSegments,
        pads,
        resources,
      };
    }
    return {
      heroAnimState: 'idle',
      task: null,
      completed: true,
      completedTask: task,
      fenceSegments,
      pads: pads.map((p) => (p.id === targetPad.id ? res.updatedPad : p)),
      resources: res.updatedResources,
    };
  }

  if (task.action === 'upgrade_pad' && task.upgradePath) {
    const res = upgradeStructureOnPad(targetPad, resources, task.upgradePath, phase);
    if (!res.success) {
      return {
        heroAnimState: 'idle',
        task: null,
        completed: false,
        fenceSegments,
        pads,
        resources,
      };
    }
    return {
      heroAnimState: 'idle',
      task: null,
      completed: true,
      completedTask: task,
      fenceSegments,
      pads: pads.map((p) => (p.id === targetPad.id ? res.updatedPad : p)),
      resources: res.updatedResources,
    };
  }

  if (task.action === 'repair_pad' && targetPad.building) {
    const repairCost = { wood: 10, stone: 5, food: 0 };
    if (!canAfford(resources, repairCost)) {
      return {
        heroAnimState: 'idle',
        task: null,
        completed: false,
        fenceSegments,
        pads,
        resources,
      };
    }
    const updatedPad: PlacementPad = {
      ...targetPad,
      building: {
        ...targetPad.building,
        hp: targetPad.building.maxHp,
      },
    };
    return {
      heroAnimState: 'idle',
      task: null,
      completed: true,
      completedTask: task,
      fenceSegments,
      pads: pads.map((p) => (p.id === targetPad.id ? updatedPad : p)),
      resources: deductCost(resources, repairCost),
    };
  }

  return {
    heroAnimState: 'idle',
    task: null,
    completed: false,
    fenceSegments,
    pads,
    resources,
  };
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
