export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type DayNightPhase = 'day' | 'night';

export type WeatherType = 'clear' | 'rain' | 'fog';

export interface WeatherSpec {
  type: WeatherType;
  fogDensity: number;
  visibilityMultiplier: number;
  resourceGrowthMultiplier: number;
  passiveRegrowPerSec: number;
  skyColorHex: number;
  sunColorHex: number;
  sunIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  rimColorHex: number;
  rimIntensity: number;
}

export type HeroAnimState = 'idle' | 'walk' | 'combat' | 'construction';

export type ResourceType = 'wood' | 'stone' | 'food';

export interface Resources {
  wood: number;
  stone: number;
  food: number;
  tickets: number;
}

export type BuildingType =
  | 'palisade'
  | 'watchtower'
  | 'spiketrap'
  | 'campfire'
  | 'catapult'
  | 'guardtent';

export type UpgradePathId = 'pathA' | 'pathB' | null;

export interface PendingConstructionTask {
  targetKind: 'fence' | 'pad';
  action: 'build_fence' | 'build_pad' | 'upgrade_pad' | 'repair_pad';
  targetId: number;
  buildingType?: BuildingType;
  upgradePath?: 'pathA' | 'pathB';
  targetX: number;
  targetZ: number;
  label: string;
  remainingTime: number;
  totalTime: number;
}

export interface UpgradeSpec {
  id: 'pathA' | 'pathB';
  name: string;
  tagline: string;
  cost: { wood: number; stone: number; food: number; tickets?: number };
  hpBonus: number;
  damageBonus: number;
  rangeBonus: number;
  attackRateMultiplier: number;
  specialEffect: string;
}

export interface BuildingCatalogItem {
  type: BuildingType;
  keybind: string;
  name: string;
  role: string;
  description: string;
  cost: { wood: number; stone: number; food: number };
  maxHp: number;
  damage: number;
  range: number;
  attackInterval: number;
  paths: {
    pathA: UpgradeSpec;
    pathB: UpgradeSpec;
  };
}

export interface PlacementPad {
  id: number;
  x: number;
  z: number;
  ring: 'inner' | 'outer';
  rotationY?: number;
  label: string;
  building: {
    type: BuildingType;
    hp: number;
    maxHp: number;
    upgradePath: UpgradePathId;
    cooldown: number;
    level: number;
  } | null;
}

export type FenceSide = 'north' | 'east' | 'south' | 'west';

export interface FenceSegment {
  id: number;
  side: FenceSide;
  slotIndex: 0 | 1 | 2;
  isGate: boolean;
  label: string;
  x: number;
  z: number;
  rotationY: number;
  length: number;
  level: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  buildProgress: number;
}

export type ZombieArchetype =
  | 'shamble'
  | 'swift_stumbler'
  | 'armored_undead'
  | 'bone_howler'
  | 'grinner'
  | 'grumble'
  | 'gawp'
  | 'brine'
  | 'baron';

export interface ZombieSpec {
  type: ZombieArchetype;
  name: string;
  subtitle: string;
  portraitUrl?: string;
  maxHp: number;
  armorHp?: number;
  speed: number;
  damage: number;
  attackInterval: number;
  scoreValue: number;
  ticketReward: number;
  scale: number;
  isBoss?: boolean;
  isElite?: boolean;
  badgeColor: string;
  specialTrait: string;
  tacticalCounter: string;
  quips: string[];
}

export interface ZombieEntity {
  id: number;
  type: ZombieArchetype;
  name: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  rotationY: number;
  hp: number;
  maxHp: number;
  armorHp: number;
  maxArmorHp: number;
  baseSpeed: number;
  damage: number;
  attackCooldown: number;
  slowTimer: number;
  poisonTimer: number;
  hitFlashTimer: number;
  windupTimer: number;
  isWindingUp: boolean;
  dashTimer: number;
  frenzyTimer: number;
  howlCooldown: number;
  koTimer: number;
  isDead: boolean;
  quipText: string | null;
  quipTimer: number;
  walkPhase: number;
  slimeDropTimer: number;
}

export interface ResourceNodeEntity {
  id: number;
  type: ResourceType;
  name: string;
  x: number;
  z: number;
  amount: number;
  maxAmount: number;
  hitFlashTimer: number;
  respawnTimer: number;
}

export interface SlimePatch {
  id: number;
  x: number;
  z: number;
  radius: number;
  ttl: number;
}

export interface ProjectileEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  startX: number;
  startZ: number;
  progress: number;
  speed: number;
  arcHeight: number;
  damage: number;
  splashRadius: number;
  applySlow: boolean;
  applyPoison: boolean;
  specialEffect?: string | null;
  colorHex: number;
}

export interface FloatingCallout {
  id: number;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  ttl: number;
  maxTtl: number;
}

export type DailyTaskType =
  | 'score_run'
  | 'collect_wood'
  | 'use_flare'
  | 'build_structures'
  | 'survive_nights';

export interface DailyTaskItem {
  id: string;
  title: string;
  type: DailyTaskType;
  target: number;
  rewardCoins: number;
  rewardXp: number;
}

export interface LanternCosmeticSpec {
  id: string;
  name: string;
  hexColor: string;
  threeColor: number;
  unlockSource: string;
}

export interface LevelRewardSpec {
  level: number;
  xpRequired: number;
  rewardLabel: string;
  unlockCosmeticId?: string;
  unlockTitle?: string;
  coinsBonus: number;
}

export interface StreakMilestoneSpec {
  days: number;
  label: string;
  coins: number;
  cosmeticId?: string;
  title?: string;
}

export interface SavedPadState {
  id: number;
  building: {
    type: BuildingType;
    upgradePath: UpgradePathId;
    level: number;
    hp: number;
    maxHp: number;
  } | null;
}

export interface SavedFenceState {
  id: number;
  level: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  buildProgress: number;
}

export interface BonusTaskItem {
  id: string;
  title: string;
  target: number;
  rewardXp: number;
}

export interface DailyPersistenceState {
  schemaVersion: number;
  tickets: number;
  ticketsUsedTodayUTC?: number;
  maxDailyTickets: number;
  pendingBonusTicketsTomorrow: number;
  coins: number;
  xp: number;
  level: number;
  toolTier: number;
  streak: number;
  bestStreak: number;
  lastResetDateUTC: string;
  lastPlayedDateUTC: string | null;
  tasks: DailyTaskItem[];
  taskProgress: Record<string, number>;
  allTasksBonusClaimed: boolean;
  dailyProgressionLocked: boolean;
  savedPads: SavedPadState[];
  savedFenceSegments: SavedFenceState[];
  savedResources: {
    wood: number;
    stone: number;
    food: number;
  };
  checkInEligibleDateUTC: string | null;
  lastCheckInClaimedDateUTC: string | null;
  bonusTasks: BonusTaskItem[];
  bonusTaskProgress: Record<string, number>;
  bonusXpClaimedIds: string[];
  cosmetics: string[];
  equippedLanternId: string;
  unlockedTitles: string[];
  equippedTitle: string;
  claimedStreakMilestones: number[];
}

export interface RunCompletionSummary {
  xpGained: number;
  coinsGained: number;
  previousLevel: number;
  newLevel: number;
  levelProgressPct: number;
  currentLevelXp: number;
  nextLevelXp: number;
  nextRewardLabel: string;
  streak: number;
  streakIncrementedToday: boolean;
  ticketsLeft: number;
  completedTasksCount: number;
  totalTasksCount: number;
  allTasksBonusClaimed: boolean;
  dailyProgressionLocked: boolean;
  isFreePlay: boolean;
  checkInAvailableToClaim: boolean;
  checkInClaimedToday: boolean;
  pendingBonusTicketsTomorrow: number;
  newUnlocks: string[];
}

export interface HudSnapshot {
  screen: GameScreenState;
  phase: DayNightPhase;
  weather: WeatherType;
  weatherTimeRemaining: number;
  dayNumber: number;
  maxDays: number;
  phaseTimeRemaining: number;
  fortHp: number;
  fortMaxHp: number;
  fortGhostHp: number;
  resources: Resources;
  score: number;
  bestScore: number;
  zombiesRemaining: number;
  totalWaveZombies: number;
  zombiesDefeated: number;
  flareCooldown: number;
  flareMaxCooldown: number;
  selectedPadId: number | null;
  pads: PlacementPad[];
  selectedFenceId: number | null;
  fenceSegments: FenceSegment[];
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossSpeech: string | null;
  statusBanner: string | null;
  runOutcome: 'victory' | 'defeat' | null;
  elapsedRunSeconds: number;
  cameraZoom: number;
  dockCollapsed: boolean;
  heroAnimState: HeroAnimState;
  pendingConstruction: PendingConstructionTask | null;
  isDevTestMode: boolean;
  isFreePlay: boolean;
  daily: DailyPersistenceState;
  lastRunSummary: RunCompletionSummary | null;
}

