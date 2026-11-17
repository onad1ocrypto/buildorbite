import { BuildingType, UpgradePathId, WeatherType, ZombieArchetype } from './types';

export type LanguageCode = 'en' | 'id' | 'zh' | 'vi' | 'ru';

export interface LanguageOption {
  code: LanguageCode;
  shortLabel: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', shortLabel: 'EN', nativeName: 'English' },
  { code: 'id', shortLabel: 'ID', nativeName: 'Indonesia' },
  { code: 'zh', shortLabel: 'ZH', nativeName: '中文' },
  { code: 'vi', shortLabel: 'VI', nativeName: 'Tiếng Việt' },
  { code: 'ru', shortLabel: 'RU', nativeName: 'Русский' },
];

export const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES;

export const LANGUAGE_STORAGE_KEY = 'build_or_bite_lang_v1';

export function loadLanguageFromStorage(): LanguageCode {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'en';
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'en' || raw === 'id' || raw === 'zh' || raw === 'vi' || raw === 'ru') {
      return raw;
    }
    return 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguageToStorage(lang: LanguageCode): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export interface BuildingTranslation {
  name: string;
  shortName: string;
  role: string;
  shortRole: string;
  description: string;
  paths: Record<
    Exclude<UpgradePathId, null>,
    {
      name: string;
      tagline: string;
    }
  >;
}

export interface ZombieTranslation {
  name: string;
  subtitle: string;
  specialTrait: string;
  tacticalCounter: string;
}

export interface UiTranslations {
  // Title Screen
  tagline: string;
  playRunBtn: (tickets: number) => string;
  noTicketsBtn: (maxTickets: number) => string;
  addReviewTicketsBtn: string;
  howToRunBtn: string;
  lanternCosmeticTitle: string;
  activeLabel: string;
  rangerTitleLabel: string;
  canonicalCastTitle: string;
  inspectBestiaryBtn: string;
  dailyBoardTitle: (dateUTC: string) => string;
  dailyResetSubtitle: (countdown: string) => string;
  tasksLabel: string;
  rewardLabel: (coins: number, xp: number) => string;
  allTasksBonusTitle: string;
  allTasksBonusDesc: string;
  claimedLabel: string;
  levelRangerLabel: (level: number, xp: number) => string;
  nextUnlockLabel: string;
  activeStreakLabel: string;
  milestonesLabel: string;
  bestScoreLabel: string;
  streakHeader: (streak: number, best: number) => string;
  coinsHeader: (coins: number) => string;
  dailyTicketsHeader: (tickets: number, max: number) => string;
  controlsFooter: string;
  schemaFooter: string;

  // HUD Overlay
  fortHpLabel: string;
  dayBuildLabel: string;
  bloodMoonLabel: string;
  dayShort: (day: number, max: number) => string;
  zombiesLeftShort: (count: number) => string;
  ticketLabel: string;
  ticketTooltip: string;
  fenceLabel: string;
  scoreLabel: string;
  dailyTasksChecklistTitle: string;
  closeLabel: string;
  woodLabel: string;
  stoneLabel: string;
  foodLabel: string;
  startNightBtn: string;
  nightThreatsLabel: (day: number) => string;
  fastTag: string;
  armorTag: string;
  howlTag: string;
  bossTag: string;
  constructingBanner: (label: string, pct: number) => string;
  showBuildDockBtn: string;
  hideDockTooltip: string;
  padLockedNightHeader: (label: string) => string;
  padChooseBuildHeader: (label: string) => string;
  nightLockedShort: string;
  repairBtn: (locked: boolean) => string;
  salvageBtn: (locked: boolean) => string;
  upgradePathAHeader: (name: string) => string;
  upgradePathBHeader: (name: string) => string;
  masteryActiveLabel: string;
  flareNightLockedBtn: string;
  flareCooldownBtn: (sec: string) => string;
  flareReadyBtn: string;
  flareTooltipNightOnly: string;
  flareTooltipReady: string;
  fenceNightLockedBtn: (built: number, total: number) => string;
  fenceSelectedBtn: (label: string) => string;
  fenceBuildBtn: (built: number, total: number) => string;
  fenceUpgradeBtn: string;
  lockedShort: string;
  languageMenuLabel: string;
  dailyLockedBadgeShort: string;
  noTicketsBanner: string;
  chooseBuildPadLabel: string;
  padEmptyWorldBadge: (id: number) => string;
  padSelectedWorldBadge: (id: number) => string;

  // GameCanvas Banners & Callouts
  dayStartBanner: (day: number) => string;
  padSelectedEmptyBanner: (id: number, label: string) => string;
  padSelectedBuiltBanner: (id: number, bldName: string) => string;
  chooseBuildingCallout: (id: number) => string;
  fenceSelectedBanner: (label: string) => string;
  nightBuildLockedBanner: string;
  flareNightLockedBanner: string;
  notEnoughResourcesBanner: string;
  busyConstructingBanner: (label: string) => string;
  allFencesMaxBanner: string;
  constructingStructureBanner: (name: string, padId: number) => string;
  upgradingStructureBanner: (name: string, padId: number) => string;
  repairingPadBanner: (padId: number) => string;
  addedReviewTicketsBanner: (tickets: number) => string;

  // Modals (Pause, Result Card, Guide)
  campPausedTitle: string;
  campPausedDesc: string;
  dayWaveLabel: string;
  runScoreLabel: string;
  resumeDefenseBtn: string;
  endRunEarlyBtn: string;
  restartBtn: string;
  titleScreenBtn: string;
  victoryHeaderBadge: string;
  defeatHeaderBadge: string;
  runTimeLabel: (timeStr: string) => string;
  victoryTitle: string;
  defeatTitle: string;
  victoryDesc: string;
  defeatDesc: string;
  xpGainedLabel: string;
  dailyStreakLabel: string;
  ticketsLeftLabel: string;
  playerLevelLabel: (level: number, title: string) => string;
  nextLevelRewardLabel: string;
  newUnlocksEarnedLabel: string;
  dailyTasksCompletedTitle: (done: number, total: number) => string;
  allThreeDoneMsg: string;
  completeAllThreeMsg: string;
  comeBackTomorrowMsg: (countdown: string, streak: number) => string;
  bonusQueuedLabel: (count: number) => string;
  playAgainBtn: (tickets: number) => string;
  guideModalTitle: string;
  guideModalSubtitle: string;
  bestiarySectionTitle: string;
  controlsSectionTitle: string;
  controlMoveDesc: string;
  controlFlareDesc: string;
  controlBuildDesc: string;
  controlNightDesc: string;
  controlZoomDesc: string;

  // New Player Build Indicator & Persistent Fort / Daily Lock / Check-In
  newPlayerBuildHint: string;
  dailyLockedBanner: string;
  dailyProgressionCompleteTitle: string;
  dailyProgressionCompleteDesc: string;
  dailyCheckInTitle: string;
  dailyCheckInReadyDesc: string;
  dailyCheckInClaimBtn: string;
  dailyCheckInClaimedLabel: string;
  dailyCheckInPlayFirstDesc: string;
  bonusTasksTitle: string;
  communityInviteTitle: string;
  communityInviteDesc: string;
  savedPermanentlyTitle: string;
  savedPermanentlyDesc: string;
  resetsNextRunTitle: string;
  resetsNextRunDesc: string;
  lockedUntilUtcTitle: string;
  lockedUntilUtcDesc: string;
  buildDurationLabel: (sec: string) => string;
  salvagedStructureBanner: (padId: number, wood: number, stone: number) => string;
  weatherLabel: (w: WeatherType) => string;
  weatherModifierShort: (w: WeatherType) => string;
  weatherTooltip: (w: WeatherType) => string;
  weatherChangedBanner: (w: WeatherType) => string;

  // Dynamic Task & Cosmetic Translators
  translateTaskTitle: (taskId: string, fallback: string) => string;
  translatePadLabel: (padId: number, fallback: string) => string;
  translateLanternName: (lanternId: string, fallback: string) => string;
  buildings: Record<BuildingType, BuildingTranslation>;
  zombies: Record<ZombieArchetype, ZombieTranslation>;
}

const BUILDINGS_EN: Record<BuildingType, BuildingTranslation> = {
  palisade: {
    name: 'Palisade Wall',
    shortName: 'Palisade',
    role: 'Inner Barricade · Blocks & Thorns',
    shortRole: 'Barricade & Thorns',
    description: 'Reinforced timber rampart with iron-shod stakes that blocks biters and deals thorn damage.',
    paths: {
      pathA: {
        name: 'Ironbark Spikes',
        tagline: '+180 HP & heavy steel thorn counter-damage on contact',
      },
      pathB: {
        name: 'Tar-Pitch Barricade',
        tagline: '+120 HP & sticky pitch slows nearby biters by 45%',
      },
    },
  },
  watchtower: {
    name: 'Watchtower',
    shortName: 'Tower',
    role: 'Long-Range Ballista · Fast Single-Target',
    shortRole: 'Ballista Tower',
    description: 'Elevated timber & stone lookout tower with a rotating roof ballista firing bolts over the wall.',
    paths: {
      pathA: {
        name: 'Sharpshooter Nest',
        tagline: 'High-caliber bolts (+32 DMG, +3.5m range, crits bosses)',
      },
      pathB: {
        name: 'Volley Repeater',
        tagline: 'Twin-arm rapid repeater bolts that chill targets briefly',
      },
    },
  },
  spiketrap: {
    name: 'Spike Trap',
    shortName: 'Spikes',
    role: 'Ground Hazard · AoE Pierce & Slow',
    shortRole: 'Ground Slow Trap',
    description: 'Mechanical iron grate pit fitted with spring-loaded steel spikes that pierce and slow zombies.',
    paths: {
      pathA: {
        name: 'Serrated Steel',
        tagline: 'Heavy armor-piercing blades (+24 DMG, shatters plating)',
      },
      pathB: {
        name: 'Bog-Snare Tar',
        tagline: 'Deep mire coils that slow enemies by 60% in a wider radius',
      },
    },
  },
  campfire: {
    name: 'Campfire',
    shortName: 'Campfire',
    role: 'Support Hearth · Fort Regen & Buff',
    shortRole: 'Fort Regen Aura',
    description: 'Mortared stone hearth with a hanging iron cauldron that repairs the Fort and warms nearby towers.',
    paths: {
      pathA: {
        name: 'Roaring Bonfire',
        tagline: 'Doubles Fort HP regeneration and boosts nearby tower attack speed',
      },
      pathB: {
        name: 'Ember Brazier',
        tagline: 'Searing heat wave scorches zombies that get close to the hearth',
      },
    },
  },
  catapult: {
    name: 'Catapult',
    shortName: 'Catapult',
    role: 'Heavy Siege Engine · AoE Armor Breaker',
    shortRole: 'Heavy AoE Siege',
    description: 'Wheeled timber siege onager with winch and throwing arm that hurls boulders to shatter armor.',
    paths: {
      pathA: {
        name: 'Brimstone Pots',
        tagline: 'Explosive fire-pot boulders (+40 AoE DMG & armor shatter)',
      },
      pathB: {
        name: 'Cluster Shrapnel',
        tagline: 'Wide scatter quarry stones that stun and knock back packs',
      },
    },
  },
  guardtent: {
    name: 'Guard Tent',
    shortName: 'Tent',
    role: 'Ranger Outpost · Bolts & Day Bounty',
    shortRole: 'Ranger Volley',
    description: 'Field command pavilion with weapon racks that fires support bolts and gathers bonus supplies.',
    paths: {
      pathA: {
        name: 'Marksman Garrison',
        tagline: 'Fires twin heavy bolts with increased range and damage',
      },
      pathB: {
        name: 'Quartermaster Camp',
        tagline: '+20 Wood & +20 Food each dawn and +12% move speed for Rue',
      },
    },
  },
};

const BUILDINGS_ID: Record<BuildingType, BuildingTranslation> = {
  palisade: {
    name: 'Dinding Palisade',
    shortName: 'Palisade',
    role: 'Barikade Dalam · Blokir & Duri',
    shortRole: 'Barikade & Duri',
    description: 'Benteng balok kayu berlapis besi dengan tombak runcing yang menahan zombie dan memantulkan damage.',
    paths: {
      pathA: {
        name: 'Tombak Besi Runcing',
        tagline: '+180 HP & pantulan damage duri baja yang besar saat disentuh',
      },
      pathB: {
        name: 'Barikade Ter Lengket',
        tagline: '+120 HP & cairan ter memperlambat zombie di sekitar sebesar 45%',
      },
    },
  },
  watchtower: {
    name: 'Menara Pantau',
    shortName: 'Menara',
    role: 'Ballista Jarak Jauh · Tembakan Cepat',
    shortRole: 'Menara Ballista',
    description: 'Menara pengawas kayu & batu dengan senjata ballista putar di atap yang menembak melewati pagar.',
    paths: {
      pathA: {
        name: 'Sarang Penembak Jitu',
        tagline: 'Panah kaliber berat (+32 DMG, +3.5m jarak, kritikal ke Boss)',
      },
      pathB: {
        name: 'Repeater Beruntun',
        tagline: 'Tembakan panah ganda super cepat yang memperlambat target',
      },
    },
  },
  spiketrap: {
    name: 'Jebakan Duri',
    shortName: 'Jebakan',
    role: 'Perangkap Tanah · Tusukan Area & Lambat',
    shortRole: 'Perangkap Tanah',
    description: 'Rangka jeruji besi mekanis dengan paku baja pegas yang menusuk dan memperlambat zombie.',
    paths: {
      pathA: {
        name: 'Baja Bergerigi',
        tagline: 'Mata pisau penembus baja (+24 DMG, menghancurkan armor)',
      },
      pathB: {
        name: 'Jerat Lumpur Rawa',
        tagline: 'Lumpur pekat yang memperlambat musuh 60% di area lebih luas',
      },
    },
  },
  campfire: {
    name: 'Api Unggun',
    shortName: 'Api Unggun',
    role: 'Tungku Pendukung · Pemulihan HP Benteng',
    shortRole: 'Aura Pemulihan',
    description: 'Tungku batu melingkar dengan kuali besi gantung yang memulihkan HP Benteng dan mempercepat menara.',
    paths: {
      pathA: {
        name: 'Api Unggun Berkobar',
        tagline: 'Menggandakan pemulihan HP Benteng & mempercepat tembakan menara',
      },
      pathB: {
        name: 'Tungku Bara Panas',
        tagline: 'Gelombang panas membakar zombie yang mendekati area tungku',
      },
    },
  },
  catapult: {
    name: 'Katapel Tempur',
    shortName: 'Katapel',
    role: 'Mesin Kepung Berat · Penghancur Armor Area',
    shortRole: 'Artileri Batu Area',
    description: 'Mesin pelontar batu beroda dengan derek dan lengan ayun yang menghancurkan perisai zombie.',
    paths: {
      pathA: {
        name: 'Bola Api Belerang',
        tagline: 'Batu api meledak (+40 AoE DMG & langsung meremukkan armor)',
      },
      pathB: {
        name: 'Pecahan Batu Sebar',
        tagline: 'Lontaran batu sebar yang mendorong mundur gerombolan zombie',
      },
    },
  },
  guardtent: {
    name: 'Tenda Penjaga',
    shortName: 'Tenda',
    role: 'Pos Ranger · Tembakan & Bonus Harian',
    shortRole: 'Pos Tembak Ranger',
    description: 'Tenda komando lapangan lengkap dengan rak senjata yang menembakkan panah & memberi suplai pagi.',
    paths: {
      pathA: {
        name: 'Garnisun Penembak',
        tagline: 'Menembakkan panah berat ganda dengan jarak dan damage lebih tinggi',
      },
      pathB: {
        name: 'Kemah Logistik',
        tagline: '+20 Kayu & +20 Makanan tiap pagi serta +12% kecepatan gerak Rue',
      },
    },
  },
};

const BUILDINGS_ZH: Record<BuildingType, BuildingTranslation> = {
  palisade: {
    name: '木栅栏防壁',
    shortName: '木栅栏',
    role: '内层路障 · 阻挡与反伤',
    shortRole: '路障与尖刺反伤',
    description: '配有铁箍与削尖木桩的坚固防壁，可阻挡僵尸并造成尖刺反弹伤害。',
    paths: {
      pathA: {
        name: '铁木尖刺',
        tagline: '+180 生命值，接触时造成高额钢铁尖刺反伤',
      },
      pathB: {
        name: '沥青拒马',
        tagline: '+120 生命值，粘稠沥青使周围僵尸减速 45%',
      },
    },
  },
  watchtower: {
    name: '瞭望弩塔',
    shortName: '弩塔',
    role: '远程床弩 · 高速单体射击',
    shortRole: '远程床弩塔',
    description: '高耸的木石结构瞭望塔，顶部配有旋转重型十字弩，可越过围墙精准射击。',
    paths: {
      pathA: {
        name: '神射手巢穴',
        tagline: '大口径重箭（+32 伤害，+3.5米射程，对首领暴击）',
      },
      pathB: {
        name: '连发齐射弩',
        tagline: '双臂高速连发弩箭，命中后短暂冰缓目标',
      },
    },
  },
  spiketrap: {
    name: '尖刺陷阱',
    shortName: '地刺',
    role: '地面机关 · 范围穿刺与减速',
    shortRole: '地面穿刺减速',
    description: '装有弹簧钢刺的机械铁格栅陷阱，可穿刺并大幅减缓经过的僵尸。',
    paths: {
      pathA: {
        name: '锯齿钢刃',
        tagline: '重型破甲钢刺（+24 伤害，迅速击碎护甲）',
      },
      pathB: {
        name: '沼泽泥潭',
        tagline: '更大范围的深渊泥沼，使敌人移动速度降低 60%',
      },
    },
  },
  campfire: {
    name: '营地篝火',
    shortName: '篝火',
    role: '支援火塘 · 堡垒回血与增益',
    shortRole: '堡垒治疗光环',
    description: '配有铸铁吊锅的石砌火塘，可持续修复堡垒生命值并提升附近防御塔攻速。',
    paths: {
      pathA: {
        name: '熊熊烈火',
        tagline: '堡垒生命恢复翻倍，并大幅提升周围防御塔攻击速度',
      },
      pathB: {
        name: '炽热火盆',
        tagline: '释放灼热气浪，持续灼烧靠近火塘的僵尸',
      },
    },
  },
  catapult: {
    name: '重型投石车',
    shortName: '投石车',
    role: '攻城重武 · 范围破甲轰击',
    shortRole: '范围破甲投石',
    description: '带有绞盘与抛射臂的轮式重型投石机，投掷巨石造成大范围伤害并震碎护甲。',
    paths: {
      pathA: {
        name: '硫磺火罐',
        tagline: '爆炸烈焰巨石（+40 范围伤害并直接击碎护甲）',
      },
      pathB: {
        name: '散射碎石',
        tagline: '抛射密集碎石群，击退并震晕成群僵尸',
      },
    },
  },
  guardtent: {
    name: '游侠营帐',
    shortName: '营帐',
    role: '游侠哨站 · 支援射击与晨间补给',
    shortRole: '游侠支援哨站',
    description: '配有武器架与战旗的野战指挥营帐，可发射支援弩箭并在清晨提供额外物资。',
    paths: {
      pathA: {
        name: '神射卫队',
        tagline: '发射双发重型弩箭，射程与伤害全面提升',
      },
      pathB: {
        name: '军需补给营',
        tagline: '每日黎明额外 +20 木材与 +20 食物，主角移动速度 +12%',
      },
    },
  },
};

const BUILDINGS_VI: Record<BuildingType, BuildingTranslation> = {
  palisade: {
    name: 'Tường Gỗ Nhọn',
    shortName: 'Tường Gỗ',
    role: 'Chắn Nội Vi · Chặn & Phản Sát Thương',
    shortRole: 'Chắn & Gai Nhọn',
    description: 'Chiến lũy gỗ bọc sắt với cọc nhọn giúp chặn zombie và phản sát thương gai.',
    paths: {
      pathA: {
        name: 'Gai Thép Thiết Mộc',
        tagline: '+180 HP & phản sát thương gai thép cực mạnh khi va chạm',
      },
      pathB: {
        name: 'Rào Nhựa Đường',
        tagline: '+120 HP & nhựa đường làm chậm zombie xung quanh 45%',
      },
    },
  },
  watchtower: {
    name: 'Tháp Canh Nỏ',
    shortName: 'Tháp Canh',
    role: 'Nỏ Tầm Xa · Bắn Nhanh Đơn Mục Tiêu',
    shortRole: 'Tháp Nỏ Tầm Xa',
    description: 'Tháp canh gỗ đá cao ráo trang bị nỏ thần xoay trên mái bắn xuyên qua hàng rào.',
    paths: {
      pathA: {
        name: 'Tổ Bắn Tỉa',
        tagline: 'Tên hạng nặng (+32 DMG, +3.5m tầm bắn, chí mạng lên Trùm)',
      },
      pathB: {
        name: 'Nỏ Liên Thanh',
        tagline: 'Bắn tên đôi tốc độ cao làm tê cóng mục tiêu trong chốc lát',
      },
    },
  },
  spiketrap: {
    name: 'Bẫy Gai Thép',
    shortName: 'Bẫy Gai',
    role: 'Bẫy Mặt Đất · Đâm Xuyên & Làm Chậm',
    shortRole: 'Bẫy Gai Làm Chậm',
    description: 'Hố lưới sắt cơ khí gắn gai thép lò xo đâm xuyên và làm chậm zombie đi qua.',
    paths: {
      pathA: {
        name: 'Lưỡi Thép Răng Cưa',
        tagline: 'Gai xuyên giáp hạng nặng (+24 DMG, phá vỡ giáp sắt)',
      },
      pathB: {
        name: 'Bùn Lầy Đầm Lầy',
        tagline: 'Bùn đặc làm chậm kẻ địch tới 60% trên phạm vi rộng hơn',
      },
    },
  },
  campfire: {
    name: 'Lửa Trại',
    shortName: 'Lửa Trại',
    role: 'Bếp Lửa Hỗ Trợ · Hồi Máu Pháo Đài',
    shortRole: 'Hồi Máu & Tăng Tốc',
    description: 'Bếp đá tròn treo vạc sắt giúp hồi HP Pháo Đài và tăng tốc độ bắn cho tháp quanh đó.',
    paths: {
      pathA: {
        name: 'Lửa Trại Rực Cháy',
        tagline: 'Nhân đôi tốc độ hồi HP Pháo Đài và tăng tốc bắn cho tháp gần',
      },
      pathB: {
        name: 'Chảo Than Hồng',
        tagline: 'Sóng nhiệt thiêu đốt mọi zombie đến gần bếp lửa',
      },
    },
  },
  catapult: {
    name: 'Máy Bắn Đá',
    shortName: 'Máy Bắn Đá',
    role: 'Pháo Công Thành · Phá Giáp Diện Rộng',
    shortRole: 'Pháo Đá Diện Rộng',
    description: 'Cỗ máy bắn đá có bánh xe và tời kéo, ném tảng đá lớn phá tan giáp zombie.',
    paths: {
      pathA: {
        name: 'Chum Lửa Lưu Huỳnh',
        tagline: 'Đá lửa phát nổ (+40 DMG diện rộng & phá vỡ giáp ngay lập tức)',
      },
      pathB: {
        name: 'Đá Mảnh Văng',
        tagline: 'Bắn chùm đá dăm đẩy lùi và làm choáng đám đông zombie',
      },
    },
  },
  guardtent: {
    name: 'Lều Cảnh Vệ',
    shortName: 'Lều Trại',
    role: 'Đồn Kiểm Lâm · Bắn Tên & Tiếp Tế',
    shortRole: 'Lều Bắn Hỗ Trợ',
    description: 'Lều chỉ huy dã chiến có giá vũ khí giúp bắn tên hỗ trợ và thu thập tài nguyên mỗi sáng.',
    paths: {
      pathA: {
        name: 'Đồn Xạ Thủ',
        tagline: 'Bắn tên đôi hạng nặng với tầm bắn và sát thương vượt trội',
      },
      pathB: {
        name: 'Trại Quân Nhu',
        tagline: '+20 Gỗ & +20 Thức ăn mỗi bình minh, +12% tốc độ chạy cho Rue',
      },
    },
  },
};

const BUILDINGS_RU: Record<BuildingType, BuildingTranslation> = {
  palisade: {
    name: 'Частокол',
    shortName: 'Частокол',
    role: 'Внутренний барьер · Блок и шипы',
    shortRole: 'Барьер и шипы',
    description: 'Укрепленный бревенчатый вал с окованными железом кольями, задерживающий зомби.',
    paths: {
      pathA: {
        name: 'Шипы Железнокора',
        tagline: '+180 ОЗ и мощный ответный урон стальными шипами при контакте',
      },
      pathB: {
        name: 'Смоляной барьер',
        tagline: '+120 ОЗ и липкая смола, замедляющая врагов рядом на 45%',
      },
    },
  },
  watchtower: {
    name: 'Сторожевая башня',
    shortName: 'Башня',
    role: 'Дальнобойная баллиста · Быстрый выстрел',
    shortRole: 'Башня с баллистой',
    description: 'Высокая деревянно-каменная вышка с поворотным арбалетом-баллистой на крыше.',
    paths: {
      pathA: {
        name: 'Гнездо снайпера',
        tagline: 'Тяжелые болты (+32 урона, +3.5м дальности, крит по боссам)',
      },
      pathB: {
        name: 'Скорострельный арбалет',
        tagline: 'Двойные скоростные залпы, ненадолго охлаждающие цели',
      },
    },
  },
  spiketrap: {
    name: 'Ловушка с шипами',
    shortName: 'Шипы',
    role: 'Наземная ловушка · Прокол и замедление',
    shortRole: 'Наземные шипы',
    description: 'Механическая железная решетка с пружинными стальными пиками, пронзающими зомби.',
    paths: {
      pathA: {
        name: 'Зазубренная сталь',
        tagline: 'Бронебойные лезвия (+24 урона, раскалывают броню)',
      },
      pathB: {
        name: 'Болотная смола',
        tagline: 'Глубокая трясина, замедляющая врагов на 60% в большом радиусе',
      },
    },
  },
  campfire: {
    name: 'Лагерный костер',
    shortName: 'Костер',
    role: 'Очаг поддержки · Регенерация форта',
    shortRole: 'Аура лечения',
    description: 'Каменный очаг с чугунным котлом на треноге, чинящий форт и ускоряющий башни.',
    paths: {
      pathA: {
        name: 'Ревущий костер',
        tagline: 'Удваивает регенерацию ОЗ форта и ускоряет атаку соседних башен',
      },
      pathB: {
        name: 'Жаровня углей',
        tagline: 'Обжигающая волна жара поджигает зомби вблизи очага',
      },
    },
  },
  catapult: {
    name: 'Катапульта',
    shortName: 'Катапульта',
    role: 'Осадное орудие · Разрушение брони по площади',
    shortRole: 'Осадная катапульта',
    description: 'Колесная осадная машина с лебедкой и рычагом, метающая валуны по толпам врагов.',
    paths: {
      pathA: {
        name: 'Серные горшки',
        tagline: 'Взрывные огненные снаряды (+40 урона по площади и слом брони)',
      },
      pathB: {
        name: 'Каменная картечь',
        tagline: 'Залп острых осколков, отбрасывающий и оглушающий толпу',
      },
    },
  },
  guardtent: {
    name: 'Палатка стражи',
    shortName: 'Палатка',
    role: 'Пост рейнджеров · Залпы и припасы',
    shortRole: 'Штаб рейнджеров',
    description: 'Полевой шатер со стойками оружия, ведущий огонь болтами и приносящий припасы утром.',
    paths: {
      pathA: {
        name: 'Стрелковый гарнизон',
        tagline: 'Выпускает парные тяжелые болты с увеличенной дальностью',
      },
      pathB: {
        name: 'Лагерь интенданта',
        tagline: '+20 дерева и +20 еды каждое утро, +12% к скорости бега Рю',
      },
    },
  },
};

const ZOMBIES_EN: Record<ZombieArchetype, ZombieTranslation> = {
  shamble: {
    name: 'Shamble',
    subtitle: 'Polite Woods Walker',
    specialTrait: 'Steady marcher carrying a lantern stake; attacks in packs.',
    tacticalCounter: 'Watchtowers & perimeter fences.',
  },
  grinner: {
    name: 'The Grinner',
    subtitle: 'Dapper Trickster',
    specialTrait: 'Lanky sprinter in a tailcoat who weaves quickly toward gates.',
    tacticalCounter: 'Spike Traps & Tar-Pitch slows.',
  },
  grumble: {
    name: 'Old Grumble',
    subtitle: 'Grumpy Pajama Sleeper',
    specialTrait: 'Sturdy bruiser who hates loud noises and hits fences hard.',
    tacticalCounter: 'Palisade thorns & Catapult boulders.',
  },
  gawp: {
    name: 'Gawp',
    subtitle: 'Wide-Eyed Scavenger',
    specialTrait: 'Erratic flanker who targets undefended side pads.',
    tacticalCounter: 'Guard Tents & crossfire.',
  },
  brine: {
    name: 'Brine',
    subtitle: 'Swamp Slime Carrier',
    specialTrait: 'Leaves slowing toxic bog puddles behind as he walks.',
    tacticalCounter: 'Long-range Watchtowers & Campfire warmth.',
  },
  baron: {
    name: 'Baron Blight',
    subtitle: 'Undead Warlord Boss',
    specialTrait: 'Massive armored boss with ground-slam shockwave windup.',
    tacticalCounter: 'Lantern Flare + Catapult Brimstone + Sharpshooter crits.',
  },
  swift_stumbler: {
    name: 'Swift Stumbler',
    subtitle: 'Frenzied Runner',
    specialTrait: 'High-speed sprinter that triggers Surge Dash when wounded.',
    tacticalCounter: 'Spike Traps & Lantern Flare slow.',
  },
  armored_undead: {
    name: 'Armored Undead',
    subtitle: 'Iron-Plated Juggernaut',
    specialTrait: '90 Armor plating reduces light arrow damage by 45%.',
    tacticalCounter: 'Catapults, Serrated Traps, or Lantern Flare to shatter armor.',
  },
  bone_howler: {
    name: 'Bone Howler',
    subtitle: 'Pack Alpha Shaman',
    specialTrait: 'Howls every few seconds to grant Frenzy Haste to nearby undead.',
    tacticalCounter: 'Snipe early with Watchtower Path A.',
  },
};

const ZOMBIES_ID: Record<ZombieArchetype, ZombieTranslation> = {
  shamble: {
    name: 'Shamble',
    subtitle: 'Pejalan Hutan Sopan',
    specialTrait: 'Berjalan stabil menyerbu gerbang secara berkelompok.',
    tacticalCounter: 'Menara Pantau & pagar luar.',
  },
  grinner: {
    name: 'The Grinner',
    subtitle: 'Pesolek Lincah',
    specialTrait: 'Pelari jangkung berjas yang bergerak cepat menuju celah pagar.',
    tacticalCounter: 'Jebakan Duri & perlambatan ter.',
  },
  grumble: {
    name: 'Old Grumble',
    subtitle: 'Kakek Piyama Pemarah',
    specialTrait: 'Zombie kekar yang memukul pagar dengan sangat keras.',
    tacticalCounter: 'Duri Palisade & batu Katapel.',
  },
  gawp: {
    name: 'Gawp',
    subtitle: 'Pengintai Melotot',
    specialTrait: 'Penyerang sisi samping yang mengincar bangunan tanpa penjagaan.',
    tacticalCounter: 'Tenda Penjaga & tembakan silang.',
  },
  brine: {
    name: 'Brine',
    subtitle: 'Pembawa Lumpur Rawa',
    specialTrait: 'Meninggalkan genangan lumpur pelambat saat berjalan.',
    tacticalCounter: 'Menara Pantau jarak jauh & Api Unggun.',
  },
  baron: {
    name: 'Baron Blight',
    subtitle: 'Panglima Zombie (Boss)',
    specialTrait: 'Boss raksasa berlapis baja dengan hantaman gelombang kejut.',
    tacticalCounter: 'Lantern Flare + Katapel Api + Menara Penembak Jitu.',
  },
  swift_stumbler: {
    name: 'Swift Stumbler',
    subtitle: 'Pelari Mengamuk',
    specialTrait: 'Berlari sangat cepat dan melakukan dash saat terluka.',
    tacticalCounter: 'Jebakan Duri & efek lambat Lantern Flare.',
  },
  armored_undead: {
    name: 'Armored Undead',
    subtitle: 'Zombie Lapis Baja',
    specialTrait: '90 Perisai Baja mengurangi damage panah ringan sebesar 45%.',
    tacticalCounter: 'Katapel, Jebakan Baja, atau Lantern Flare untuk memecahkan armor.',
  },
  bone_howler: {
    name: 'Bone Howler',
    subtitle: 'Pawang Lolongan Tulang',
    specialTrait: 'Melolong untuk mempercepat gerak seluruh zombie di sekitarnya.',
    tacticalCounter: 'Tembak lebih dulu dengan Menara Pantau.',
  },
};

const ZOMBIES_ZH: Record<ZombieArchetype, ZombieTranslation> = {
  shamble: {
    name: '蹒跚者 (Shamble)',
    subtitle: '礼貌的林间行尸',
    specialTrait: '步伐稳健的普通行尸，喜欢成群结队进攻大门。',
    tacticalCounter: '瞭望弩塔与外围木栅栏。',
  },
  grinner: {
    name: '咧嘴怪 (The Grinner)',
    subtitle: '燕尾服诡术师',
    specialTrait: '身穿燕尾服的高瘦快步僵尸，快速冲向防线缺口。',
    tacticalCounter: '尖刺陷阱与沥青减速。',
  },
  grumble: {
    name: '暴躁老头 (Old Grumble)',
    subtitle: '睡衣起床气重装怪',
    specialTrait: '体型敦实，讨厌噪音，对围墙造成高额砸击伤害。',
    tacticalCounter: '铁木尖刺反伤与重型投石车。',
  },
  gawp: {
    name: '瞪眼怪 (Gawp)',
    subtitle: '大眼拾荒者',
    specialTrait: '从侧翼游走突袭薄弱的防御阵地。',
    tacticalCounter: '游侠营帐与交叉火力。',
  },
  brine: {
    name: '盐沼怪 (Brine)',
    subtitle: '沼泽毒泥携带者',
    specialTrait: '行走时在地面留下令英雄减速的沼泽毒泥。',
    tacticalCounter: '远程瞭望弩塔与营地篝火。',
  },
  baron: {
    name: '枯萎男爵 (Baron Blight)',
    subtitle: '亡灵领主首领 (Boss)',
    specialTrait: '披甲巨型首领，可蓄力发动地面震击波。',
    tacticalCounter: '提灯烈焰闪光 + 硫磺投石车 + 神射手暴击。',
  },
  swift_stumbler: {
    name: '疾行狂尸 (Swift Stumbler)',
    subtitle: '狂暴冲刺者',
    specialTrait: '极速狂奔，受伤时会触发狂暴突进。',
    tacticalCounter: '尖刺陷阱与提灯闪光减速。',
  },
  armored_undead: {
    name: '重甲亡灵 (Armored Undead)',
    subtitle: '铁甲重装步兵',
    specialTrait: '拥有 90 点铁甲，可减免 45% 轻型箭矢伤害。',
    tacticalCounter: '重型投石车、锯齿陷阱或提灯闪光破甲。',
  },
  bone_howler: {
    name: '骸骨咆哮者 (Bone Howler)',
    subtitle: '尸群萨满',
    specialTrait: '发出战吼，为周围亡灵提供狂暴加速。',
    tacticalCounter: '使用神射手弩塔优先狙杀。',
  },
};

const ZOMBIES_VI: Record<ZombieArchetype, ZombieTranslation> = {
  shamble: {
    name: 'Shamble',
    subtitle: 'Kẻ Lang Thang Lịch Sự',
    specialTrait: 'Di chuyển đều đặn và tấn công cổng theo bầy.',
    tacticalCounter: 'Tháp Canh Nỏ & hàng rào ngoài.',
  },
  grinner: {
    name: 'The Grinner',
    subtitle: 'Kẻ Lừa Bịp Bảnh Bao',
    specialTrait: 'Zombie cao gầy mặc áo đuôi tôm chạy rất nhanh về phía cổng.',
    tacticalCounter: 'Bẫy Gai Thép & làm chậm bằng nhựa đường.',
  },
  grumble: {
    name: 'Old Grumble',
    subtitle: 'Ông Già Đồ Ngủ Cáu Kỉnh',
    specialTrait: 'Zombie to khỏe đập phá hàng rào cực mạnh.',
    tacticalCounter: 'Gai Tường Gỗ & Máy Bắn Đá.',
  },
  gawp: {
    name: 'Gawp',
    subtitle: 'Kẻ Nhặt Rác Mắt Tròn',
    specialTrait: 'Đánh bọc sườn nhắm vào các ô xây dựng ít phòng thủ.',
    tacticalCounter: 'Lều Cảnh Vệ & lưới lửa đan chéo.',
  },
  brine: {
    name: 'Brine',
    subtitle: 'Quái Bùn Đầm Lầy',
    specialTrait: 'Để lại vũng bùn độc làm chậm trên đường đi.',
    tacticalCounter: 'Tháp Canh tầm xa & Lửa Trại.',
  },
  baron: {
    name: 'Baron Blight',
    subtitle: 'Chúa Tể Xác Sống (Trùm)',
    specialTrait: 'Trùm khổng lồ mặc giáp nặng với chiêu đập đất chấn động.',
    tacticalCounter: 'Pháo Sáng Đèn Lồng + Máy Bắn Đá Lửa + Nỏ Bắn Tỉa.',
  },
  swift_stumbler: {
    name: 'Swift Stumbler',
    subtitle: 'Kẻ Chạy Điên Cuồng',
    specialTrait: 'Tốc độ cực nhanh và lao vọt lên khi bị thương.',
    tacticalCounter: 'Bẫy Gai Thép & làm chậm từ Đèn Lồng.',
  },
  armored_undead: {
    name: 'Armored Undead',
    subtitle: 'Xác Sống Giáp Sắt',
    specialTrait: '90 Giáp sắt giúp giảm 45% sát thương từ tên nhẹ.',
    tacticalCounter: 'Máy Bắn Đá, Bẫy Răng Cưa hoặc Pháo Sáng để phá giáp.',
  },
  bone_howler: {
    name: 'Bone Howler',
    subtitle: 'Pháp Sư Hú Xương',
    specialTrait: 'Hú vang giúp tăng tốc độ di chuyển cho zombie xung quanh.',
    tacticalCounter: 'Dùng Tháp Canh bắn hạ sớm.',
  },
};

const ZOMBIES_RU: Record<ZombieArchetype, ZombieTranslation> = {
  shamble: {
    name: 'Шаркун (Shamble)',
    subtitle: 'Вежливый лесной ходок',
    specialTrait: 'Уверенно шагает к воротам в составе стаи.',
    tacticalCounter: 'Сторожевые башни и внешний забор.',
  },
  grinner: {
    name: 'Ухмыльник (The Grinner)',
    subtitle: 'Щегольской ловкач',
    specialTrait: 'Долговязый бегун во фраке, стремительно рвущийся к воротам.',
    tacticalCounter: 'Ловушки с шипами и смоляное замедление.',
  },
  grumble: {
    name: 'Старый Ворчун (Old Grumble)',
    subtitle: 'Сонный громила в пижаме',
    specialTrait: 'Крепкий здоровяк, наносящий огромный урон заборам.',
    tacticalCounter: 'Шипы частокола и валуны катапульты.',
  },
  gawp: {
    name: 'Ротозей (Gawp)',
    subtitle: 'Лупоглазый мародер',
    specialTrait: 'Обходит с флангов и атакует незащищенные постройки.',
    tacticalCounter: 'Палатки стражи и перекрестный огонь.',
  },
  brine: {
    name: 'Рассольник (Brine)',
    subtitle: 'Болотный слизевик',
    specialTrait: 'Оставляет за собой замедляющие лужи болотной слизи.',
    tacticalCounter: 'Дальнобойные башни и тепло костра.',
  },
  baron: {
    name: 'Барон Мор (Baron Blight)',
    subtitle: 'Полководец нежити (Босс)',
    specialTrait: 'Гигантский бронированный босс с сокрушительным ударом по земле.',
    tacticalCounter: 'Вспышка фонаря + огненная катапульта + снайперские башни.',
  },
  swift_stumbler: {
    name: 'Быстрый Бегун (Swift Stumbler)',
    subtitle: 'Бешеный спринтер',
    specialTrait: 'Высокая скорость бега и рывок вперед при ранении.',
    tacticalCounter: 'Ловушки с шипами и замедление от фонаря.',
  },
  armored_undead: {
    name: 'Бронированный мертвец',
    subtitle: 'Закованный в сталь гигант',
    specialTrait: '90 ед. брони снижают урон от легких стрел на 45%.',
    tacticalCounter: 'Катапульты, стальные шипы или вспышка фонаря для раскола брони.',
  },
  bone_howler: {
    name: 'Костяной Вой (Bone Howler)',
    subtitle: 'Вожак стаи',
    specialTrait: 'Воем ускоряет всех ближайших мертвецов.',
    tacticalCounter: 'Уничтожайте первым из снайперской башни.',
  },
};

const TASK_TITLES: Record<LanguageCode, Record<string, string>> = {
  en: {
    build_5_structures: 'Build 5 defensive structures or fences',
    survive_2_nights: 'Survive 2 nights in a single run',
    collect_20_wood: 'Gather 20 Wood from forest timber nodes',
    use_3_flares: 'Cast 3 Lantern Fire Flares at night',
    score_600_pts: 'Reach 600+ Run Score',
    score_800: 'Score 800+ in one run',
    collect_wood_20: 'Collect 20 wood',
    use_flare_5: 'Use Lantern Flare 5 times',
    build_5: 'Build 5 buildings',
    survive_2: 'Survive 2 nights in a row',
    bonus_slay_12: 'Slay 12 Undead in the Clearing',
    bonus_flare_3: 'Cast 3 Lantern Flares',
  },
  id: {
    build_5_structures: 'Bangun 5 bangunan pertahanan atau pagar',
    survive_2_nights: 'Bertahan hidup melewati 2 malam berturut-turut',
    collect_20_wood: 'Kumpulkan 20 Kayu dari hutan',
    use_3_flares: 'Gunakan 3 Lantern Fire Flare saat malam',
    score_600_pts: 'Capai skor 600+ dalam satu permainan',
    score_800: 'Capai skor 800+ dalam satu permainan',
    collect_wood_20: 'Kumpulkan 20 Kayu',
    use_flare_5: 'Gunakan Lantern Flare 5 kali',
    build_5: 'Bangun 5 bangunan pertahanan',
    survive_2: 'Bertahan hidup melewati 2 malam berturut-turut',
    bonus_slay_12: 'Kalahkan 12 Zombie di Area Hutan',
    bonus_flare_3: 'Gunakan 3 Lantern Flare',
  },
  zh: {
    build_5_structures: '建造 5 座防御建筑或围栏',
    survive_2_nights: '单局连续存活 2 个夜晚',
    collect_20_wood: '从森林木材点收集 20 木材',
    use_3_flares: '在夜晚释放 3 次提灯烈焰闪光',
    score_600_pts: '单局得分达到 600 分以上',
    score_800: '单局得分达到 800 分以上',
    collect_wood_20: '收集 20 木材',
    use_flare_5: '使用 5 次提灯烈焰闪光',
    build_5: '建造 5 座防御建筑',
    survive_2: '单局连续存活 2 个夜晚',
    bonus_slay_12: '在空地击败 12 只亡灵',
    bonus_flare_3: '释放 3 次提灯闪光',
  },
  vi: {
    build_5_structures: 'Xây 5 công trình phòng thủ hoặc hàng rào',
    survive_2_nights: 'Sống sót qua 2 đêm liên tiếp',
    collect_20_wood: 'Thu thập 20 Gỗ từ rừng',
    use_3_flares: 'Dùng 3 lần Pháo Sáng Đèn Lồng vào ban đêm',
    score_600_pts: 'Đạt 600+ điểm trong một lượt chơi',
    score_800: 'Đạt 800+ điểm trong một lượt chơi',
    collect_wood_20: 'Thu thập 20 Gỗ',
    use_flare_5: 'Sử dụng Pháo Sáng Đèn Lồng 5 lần',
    build_5: 'Xây 5 công trình phòng thủ',
    survive_2: 'Sống sót qua 2 đêm liên tiếp',
    bonus_slay_12: 'Tiêu diệt 12 Zombie tại Rừng Quang',
    bonus_flare_3: 'Sử dụng 3 lần Pháo Sáng Đèn Lồng',
  },
  ru: {
    build_5_structures: 'Постройте 5 защитных сооружений или заборов',
    survive_2_nights: 'Переживите 2 ночи подряд за один забег',
    collect_20_wood: 'Соберите 20 ед. дерева в лесу',
    use_3_flares: 'Используйте вспышку фонаря 3 раза ночью',
    score_600_pts: 'Наберите 600+ очков за забег',
    score_800: 'Наберите 800+ очков за один забег',
    collect_wood_20: 'Соберите 20 ед. дерева',
    use_flare_5: 'Используйте вспышку фонаря 5 раз',
    build_5: 'Постройте 5 сооружений',
    survive_2: 'Переживите 2 ночи подряд',
    bonus_slay_12: 'Победите 12 мертвецов на поляне',
    bonus_flare_3: 'Используйте 3 вспышки фонаря',
  },
};

const PAD_LABELS: Record<LanguageCode, Record<number, string>> = {
  en: {
    1: 'NW Corner Weapon Pad',
    2: 'NE Corner Weapon Pad',
    3: 'SW Corner Weapon Pad',
    4: 'SE Corner Weapon Pad',
    5: 'North Gate Defense Pad',
    6: 'East Gate Defense Pad',
    7: 'South Gate Defense Pad',
    8: 'West Gate Defense Pad',
  },
  id: {
    1: 'Titik Senjata Sudut Barat Laut',
    2: 'Titik Senjata Sudut Timur Laut',
    3: 'Titik Senjata Sudut Barat Daya',
    4: 'Titik Senjata Sudut Tenggara',
    5: 'Titik Pertahanan Gerbang Utara',
    6: 'Titik Pertahanan Gerbang Timur',
    7: 'Titik Pertahanan Gerbang Selatan',
    8: 'Titik Pertahanan Gerbang Barat',
  },
  zh: {
    1: '西北角武器台',
    2: '东北角武器台',
    3: '西南角武器台',
    4: '东南角武器台',
    5: '北门防御台',
    6: '东门防御台',
    7: '南门防御台',
    8: '西门防御台',
  },
  vi: {
    1: 'Bệ Vũ Khí Góc Tây Bắc',
    2: 'Bệ Vũ Khí Góc Đông Bắc',
    3: 'Bệ Vũ Khí Góc Tây Nam',
    4: 'Bệ Vũ Khí Góc Đông Nam',
    5: 'Bệ Phòng Thủ Cổng Bắc',
    6: 'Bệ Phòng Thủ Cổng Đông',
    7: 'Bệ Phòng Thủ Cổng Nam',
    8: 'Bệ Phòng Thủ Cổng Tây',
  },
  ru: {
    1: 'СЗ угловая площадка',
    2: 'СВ угловая площадка',
    3: 'ЮЗ угловая площадка',
    4: 'ЮВ угловая площадка',
    5: 'Северная площадка у ворот',
    6: 'Восточная площадка у ворот',
    7: 'Южная площадка у ворот',
    8: 'Западная площадка у ворот',
  },
};

const LANTERN_NAMES: Record<LanguageCode, Record<string, string>> = {
  en: {
    amber_default: 'Campfire Amber',
    emerald_bog: 'Emerald Bog-Glow',
    frostfire_blue: 'Frostfire Azure',
    baron_violet: 'Baron Royal Violet',
    crimson_flare: 'Crimson Bloodflare',
    solar_gold: 'Solar Dawnburst',
    spectral_mint: 'Spectral Wisp',
  },
  id: {
    amber_default: 'Amber Api Unggun',
    emerald_bog: 'Zamrud Rawa',
    frostfire_blue: 'Biru Api Es',
    baron_violet: 'Ungu Baron',
    crimson_flare: 'Merah Bloodflare',
    solar_gold: 'Emas Surya',
    spectral_mint: 'Mint Spektral',
  },
  zh: {
    amber_default: '篝火琥珀',
    emerald_bog: '翡翠沼光',
    frostfire_blue: '霜火苍蓝',
    baron_violet: '男爵紫晶',
    crimson_flare: '猩红血焰',
    solar_gold: '曜金晨曦',
    spectral_mint: '幽灵薄荷',
  },
  vi: {
    amber_default: 'Hổ Phách Lửa Trại',
    emerald_bog: 'Ngọc Lục Đầm Lầy',
    frostfire_blue: 'Lam Băng Hỏa',
    baron_violet: 'Tím Hoàng Gia',
    crimson_flare: 'Đỏ Huyết Hỏa',
    solar_gold: 'Vàng Bình Minh',
    spectral_mint: 'Bạc Hà Ma Quái',
  },
  ru: {
    amber_default: 'Костровой янтарь',
    emerald_bog: 'Болотный изумруд',
    frostfire_blue: 'Ледяное пламя',
    baron_violet: 'Королевский аметист',
    crimson_flare: 'Багровая вспышка',
    solar_gold: 'Солнечный рассвет',
    spectral_mint: 'Призрачная мята',
  },
};

export const TRANSLATIONS: Record<LanguageCode, UiTranslations> = {
  en: {
    tagline:
      'Fortify Ranger Rue’s spooky clearing by day, then fend off polite-yet-hungry zombies by night.',
    playRunBtn: (tickets) => `Play Run (-1 Ticket · ${tickets} Left)`,
    noTicketsBtn: (max) => `No Tickets Left (0/${max})`,
    addReviewTicketsBtn: '+10 Review Tickets (Free)',
    howToRunBtn: 'Game Guide & Bestiary',
    lanternCosmeticTitle: 'Lantern Glow Cosmetic',
    activeLabel: 'Active:',
    rangerTitleLabel: 'Ranger Title:',
    canonicalCastTitle: 'Character Cast (3D Models & Portraits)',
    inspectBestiaryBtn: 'Inspect Bestiary →',
    dailyBoardTitle: (dateUTC) => `Daily Ranger Board (${dateUTC} UTC)`,
    dailyResetSubtitle: (countdown) =>
      `Tickets refill to 3 at 00:00 UTC · Next reset in ${countdown}`,
    tasksLabel: 'Tasks',
    rewardLabel: (coins, xp) => `Reward: +${coins} Coins · +${xp} XP`,
    allTasksBonusTitle: 'All 3 Tasks Bonus:',
    allTasksBonusDesc: '+100 Coins & +120 XP (Fort Saved)',
    claimedLabel: 'Claimed!',
    levelRangerLabel: (level, xp) => `Level ${level} Ranger (${xp} Total XP)`,
    nextUnlockLabel: 'Next Unlock:',
    activeStreakLabel: 'Active Streak:',
    milestonesLabel: 'Milestones:',
    bestScoreLabel: 'Best:',
    streakHeader: (s, b) => `Streak: ${s}d (Best ${b}d)`,
    coinsHeader: (c) => `Coins: ${c}`,
    dailyTicketsHeader: (t, m) => `Daily Tickets: ${t} / ${m}`,
    controlsFooter:
      'WASD / Arrows / Click Move · Click Pad to Choose Building · Mouse Wheel / Pinch Zoom · Space Fire Flare (Night) · N Start Night',
    schemaFooter: 'UTC Daily Reset · 5 Languages Supported · LocalStorage v3',

    fortHpLabel: 'FORT HP',
    dayBuildLabel: 'DAY · BUILD',
    bloodMoonLabel: 'BLOOD MOON',
    dayShort: (d, m) => `D${d}/${m}`,
    zombiesLeftShort: (c) => `${c} Left`,
    ticketLabel: 'TICKET',
    ticketTooltip: 'Daily tickets reset to 3 at 00:00 UTC (unused tickets do not roll over)',
    fenceLabel: 'FENCE',
    scoreLabel: 'SCORE',
    dailyTasksChecklistTitle: 'Daily Tasks Checklist',
    closeLabel: 'Close',
    woodLabel: 'WOOD',
    stoneLabel: 'STONE',
    foodLabel: 'FOOD',
    startNightBtn: 'Night [N]',
    nightThreatsLabel: (d) => `Night ${d} Threats:`,
    fastTag: 'FAST',
    armorTag: '90 ARMOR',
    howlTag: 'HOWL',
    bossTag: 'BOSS',
    constructingBanner: (label, pct) => `🔨 Constructing: ${label} (${pct}%)`,
    showBuildDockBtn: '▴ Show Build Menu [H]',
    hideDockTooltip: 'Hide Bottom Menu [H]',
    padLockedNightHeader: (label) => `${label} — 🔒 Locked at Night`,
    padChooseBuildHeader: (label) => `${label} — Choose Structure to Build:`,
    nightLockedShort: '🔒 Night',
    repairBtn: (locked) => (locked ? '🔒 Repair [R]' : '🔧 Repair [R] (10W 5S)'),
    salvageBtn: (locked) => (locked ? '🔒 Salvage [X]' : '🗑️ Salvage [X]'),
    upgradePathAHeader: (name) => `Upgrade A: ${name}`,
    upgradePathBHeader: (name) => `Upgrade B: ${name}`,
    masteryActiveLabel: 'Mastery Active:',
    flareNightLockedBtn: '🔒 Flare (Night)',
    flareCooldownBtn: (sec) => `Flare ${sec}s`,
    flareReadyBtn: '🔥 Flare [Space]',
    flareTooltipNightOnly: 'Lantern Flare can only be used at Night',
    flareTooltipReady: 'Cast Lantern Fire Flare [Space]',
    fenceNightLockedBtn: (b, t) => `🔒 Fence (${b}/${t})`,
    fenceSelectedBtn: (label) => `Fence: ${label} [F]`,
    fenceBuildBtn: (b, t) => `Outer Fence [F] (${b}/${t})`,
    fenceUpgradeBtn: 'Upgrade Fence [F]',
    lockedShort: 'Locked',
    languageMenuLabel: 'Language:',
    dailyLockedBadgeShort: '3/3 SAVED',
    noTicketsBanner: 'No Daily Tickets remaining today! Wait for 00:00 UTC reset.',
    chooseBuildPadLabel: 'Build Pads:',
    padEmptyWorldBadge: (id) => `P${id} · +BUILD`,
    padSelectedWorldBadge: (id) => `P${id} · SELECT`,

    dayStartBanner: (d) =>
      `Day ${d}: Gather Wood, Stone & Food, or click any Build Pad (P1–P8) to choose a structure!`,
    padSelectedEmptyBanner: (id, label) =>
      `Build Pad P${id} (${label}) selected — choose what Ranger Rue will build below!`,
    padSelectedBuiltBanner: (id, bldName) =>
      `Pad P${id}: ${bldName} selected — choose Upgrade, Repair, or Salvage below!`,
    chooseBuildingCallout: (id) => `Choose Build (P${id})`,
    fenceSelectedBanner: (label) =>
      `${label} selected — press Outer Fence [F] to build/upgrade, or pick a Build Pad (P1–P8)!`,
    nightBuildLockedBanner: 'Night has fallen — building is locked until dawn!',
    flareNightLockedBanner: 'Lantern Flare can only be used during Night defense!',
    notEnoughResourcesBanner: 'Not enough Wood, Stone, or Food for that action!',
    busyConstructingBanner: (label) =>
      `Ranger Rue is constructing ${label} — wait for completion!`,
    allFencesMaxBanner: 'All 12 Outer Fence segments are already at maximum level!',
    constructingStructureBanner: (name, id) => `Constructing ${name} on Pad P${id}...`,
    upgradingStructureBanner: (name, id) => `Upgrading to ${name} on Pad P${id}...`,
    repairingPadBanner: (id) => `Repairing structure on Pad P${id}...`,
    addedReviewTicketsBanner: (t) => `+10 Review Tickets Added! (${t} Tickets Available)`,

    campPausedTitle: 'Camp Paused',
    campPausedDesc: 'Ranger Rue is catching a breath by the lantern.',
    dayWaveLabel: 'Day / Wave',
    runScoreLabel: 'Run Score',
    resumeDefenseBtn: 'Resume Defense (P / Esc)',
    endRunEarlyBtn: 'End Run & Claim XP / Streak Result Card',
    restartBtn: 'Restart (-1)',
    titleScreenBtn: 'Title Screen',
    victoryHeaderBadge: 'All 3 Nights Survived · Dawn Breaks!',
    defeatHeaderBadge: 'Run Complete · Fort Report',
    runTimeLabel: (t) => `Run Time: ${t}`,
    victoryTitle: 'Victory! Clearing Secured',
    defeatTitle: 'Bitten! Fort Overrun',
    victoryDesc:
      'Baron Blight bowed out dramatically and the shamblers wandered back into the deep forest.',
    defeatDesc:
      'Ranger Rue fought bravely with lantern and mallet before retreating to camp.',
    xpGainedLabel: 'XP Gained',
    dailyStreakLabel: 'Daily Streak',
    ticketsLeftLabel: 'Tickets Left',
    playerLevelLabel: (lvl, title) => `Player Level ${lvl} · ${title}`,
    nextLevelRewardLabel: 'Next Level Reward:',
    newUnlocksEarnedLabel: 'New Unlocks Earned:',
    dailyTasksCompletedTitle: (d, t) => `Daily Tasks Completed (${d} / ${t})`,
    allThreeDoneMsg: 'All 3 Done! (Fort Saved)',
    completeAllThreeMsg: 'Complete all 3 for Bonus Coins & XP',
    comeBackTomorrowMsg: (countdown, streak) =>
      `Come back tomorrow at 00:00 UTC (in ${countdown}) for 3 fresh tickets and to grow your ${streak}-day streak!`,
    bonusQueuedLabel: (c) => `+${c} Bonus Queued`,
    playAgainBtn: (t) => `Play Again (-1 Ticket · ${t} Left)`,
    guideModalTitle: 'Build or Bite — Tactical Guide & Zombie Bestiary',
    guideModalSubtitle: '3D Forest Fort Defense · Realistic Structures & Multi-Language Edition',
    bestiarySectionTitle: '1. Hero & Zombie Bestiary (Traits & Tactical Counters)',
    controlsSectionTitle: '2. Controls Reference (PC & Mobile)',
    controlMoveDesc: 'WASD / Arrows / Click or Touch-Drag on ground to move & gather resources',
    controlFlareDesc: 'Spacebar / Flare Button: Cast Fire Lantern Flare (Night only)',
    controlBuildDesc: 'Click any Build Pad (P1–P8) to open the 6-structure choice menu',
    controlNightDesc: 'Enter / N: Start Night early · P: Pause',
    controlZoomDesc: 'Mouse Scroll Wheel (PC) or Two-Finger Pinch (Mobile) to Zoom In / Out',

    newPlayerBuildHint: '✨ Ready to Build! Click P1 or a Build Pad to place your first defense',
    dailyLockedBanner:
      "🔒 Today's construction progression is complete! Your fort & resources are saved until 00:00 UTC. Hero combat stays open!",
    dailyProgressionCompleteTitle: 'Fort Saved · Daily Construction Complete',
    dailyProgressionCompleteDesc:
      'All 3 daily tasks are complete! Gathering, building, and upgrades are locked until 00:00 UTC.',
    dailyCheckInTitle: 'Daily Ranger Check-In',
    dailyCheckInReadyDesc: 'First run of the UTC day complete! Claim your daily check-in supply cache:',
    dailyCheckInClaimBtn: '🎁 Claim Daily Check-In (+25 Coins · +30 XP)',
    dailyCheckInClaimedLabel: '✓ Daily Check-In Claimed Today (+25 Coins · +30 XP)',
    dailyCheckInPlayFirstDesc: 'Complete 1 standard run today to unlock your Daily Check-In reward.',
    bonusTasksTitle: 'Optional Daily Bonus Patrols (Small XP)',
    communityInviteTitle: 'Ranger Campfire Community',
    communityInviteDesc: 'Share fort layouts & wave strategies with fellow wardens at r/BuildOrBite',
    savedPermanentlyTitle: '✓ Saved Permanently Across Runs & UTC Days',
    savedPermanentlyDesc:
      'Fort structures & upgrade paths (restored to full HP), Wood/Stone/Food wallet, Level, XP, Coins & Cosmetics.',
    resetsNextRunTitle: '↻ Resets For Each New Run',
    resetsNextRunDesc:
      'Undead waves, active projectiles, temporary run score, and Day/Night wave timers.',
    lockedUntilUtcTitle: '🔒 Locked After 3/3 Daily Tasks Until 00:00 UTC',
    lockedUntilUtcDesc:
      'New resource gathering, building, upgrades, repairs & salvage (Hero combat stays open).',
    buildDurationLabel: (sec) => `⏱ ${sec}s`,
    salvagedStructureBanner: (id, w, s) => `Salvaged Pad P${id} (+${w} Wood, +${s} Stone refunded)`,
    weatherLabel: (w) =>
      w === 'rain' ? '🌧️ Rain' : w === 'fog' ? '☁️ Dense Fog' : '☀️ Clear',
    weatherModifierShort: (w) =>
      w === 'rain'
        ? '+65% Regrow · 82% Vis'
        : w === 'fog'
        ? '-35% Regrow · 65% Vis'
        : '100% Growth · 100% Vis',
    weatherTooltip: (w) =>
      w === 'rain'
        ? 'Woodland Rainshower: +65% resource regrowth & +20% Wood/Food gather yield; visibility reduced to 82%. (Click to cycle weather)'
        : w === 'fog'
        ? 'Dense Swamp Mist: -35% resource regrowth & visibility reduced to 65%, +25% Stone gather yield. (Click to cycle weather)'
        : 'Sunlit Clearing: 100% clear visibility & standard resource growth rate. (Click to cycle weather)',
    weatherChangedBanner: (w) =>
      w === 'rain'
        ? '🌧️ Weather Shift: Woodland Rain! Resource regrowth +65% & +20% Wood/Food yield (Visibility 82%).'
        : w === 'fog'
        ? '☁️ Weather Shift: Dense Swamp Fog! Visibility 65% & slower regrowth (-35%), +25% Stone yield.'
        : '☀️ Weather Shift: Sunlit Clearing! Full visibility & normal resource growth restored.',

    translateTaskTitle: (id, fb) => TASK_TITLES.en[id] ?? fb,
    translatePadLabel: (id, fb) => PAD_LABELS.en[id] ?? fb,
    translateLanternName: (id, fb) => LANTERN_NAMES.en[id] ?? fb,
    buildings: BUILDINGS_EN,
    zombies: ZOMBIES_EN,
  },

  id: {
    tagline:
      'Perkuat benteng Ranger Rue di siang hari, lalu halau serbuan zombie lapar di malam hari.',
    playRunBtn: (tickets) => `Mulai Main (-1 Tiket · Sisa ${tickets})`,
    noTicketsBtn: (max) => `Tiket Habis (0/${max})`,
    addReviewTicketsBtn: '+10 Tiket Review (Gratis)',
    howToRunBtn: 'Panduan & Bestiari',
    lanternCosmeticTitle: 'Kosmetik Cahaya Lentera',
    activeLabel: 'Aktif:',
    rangerTitleLabel: 'Gelar Ranger:',
    canonicalCastTitle: 'Daftar Karakter (Model 3D & Potret)',
    inspectBestiaryBtn: 'Lihat Bestiari →',
    dailyBoardTitle: (dateUTC) => `Papan Misi Harian (${dateUTC} UTC)`,
    dailyResetSubtitle: (countdown) =>
      `Tiket terisi ke 3 pada 00:00 UTC · Reset berikutnya dalam ${countdown}`,
    tasksLabel: 'Misi',
    rewardLabel: (coins, xp) => `Hadiah: +${coins} Koin · +${xp} XP`,
    allTasksBonusTitle: 'Bonus Selesai 3 Misi:',
    allTasksBonusDesc: '+100 Koin & +120 XP (Benteng Tersimpan)',
    claimedLabel: 'Diklaim!',
    levelRangerLabel: (level, xp) => `Ranger Level ${level} (${xp} Total XP)`,
    nextUnlockLabel: 'Hadiah Berikutnya:',
    activeStreakLabel: 'Rekor Hari Aktif:',
    milestonesLabel: 'Target:',
    bestScoreLabel: 'Skor Terbaik:',
    streakHeader: (s, b) => `Streak: ${s}h (Terbaik ${b}h)`,
    coinsHeader: (c) => `Koin: ${c}`,
    dailyTicketsHeader: (t, m) => `Tiket Harian: ${t} / ${m}`,
    controlsFooter:
      'WASD / Klik / Geser Layar: Gerak · Klik Titik Build: Pilih Bangunan · Scroll Mouse / Cubit Layar: Zoom · Space: Flare (Malam)',
    schemaFooter: 'Reset Harian UTC · 5 Bahasa Tersedia · LocalStorage v3',

    fortHpLabel: 'HP BENTENG',
    dayBuildLabel: 'SIANG · BANGUN',
    bloodMoonLabel: 'MALAM DARAH',
    dayShort: (d, m) => `H${d}/${m}`,
    zombiesLeftShort: (c) => `${c} Tersisa`,
    ticketLabel: 'TIKET',
    ticketTooltip: 'Tiket harian direset ke 3 pada 00:00 UTC (sisa tiket tidak diakumulasi)',
    fenceLabel: 'PAGAR',
    scoreLabel: 'SKOR',
    dailyTasksChecklistTitle: 'Daftar Misi Harian',
    closeLabel: 'Tutup',
    woodLabel: 'KAYU',
    stoneLabel: 'BATU',
    foodLabel: 'MAKANAN',
    startNightBtn: 'Malam [N]',
    nightThreatsLabel: (d) => `Ancaman Malam ${d}:`,
    fastTag: 'CEPAT',
    armorTag: '90 BAJA',
    howlTag: 'LOLONG',
    bossTag: 'BOSS',
    constructingBanner: (label, pct) => `🔨 Membangun: ${label} (${pct}%)`,
    showBuildDockBtn: '▴ Buka Menu Bangun [H]',
    hideDockTooltip: 'Sembunyikan Menu Bawah [H]',
    padLockedNightHeader: (label) => `${label} — 🔒 Terkunci Saat Malam`,
    padChooseBuildHeader: (label) => `${label} — Pilih Bangunan yang Akan Dibuat:`,
    nightLockedShort: '🔒 Malam',
    repairBtn: (locked) => (locked ? '🔒 Perbaiki [R]' : '🔧 Perbaiki [R] (10W 5S)'),
    salvageBtn: (locked) => (locked ? '🔒 Bongkar [X]' : '🗑️ Bongkar [X]'),
    upgradePathAHeader: (name) => `Upgrade A: ${name}`,
    upgradePathBHeader: (name) => `Upgrade B: ${name}`,
    masteryActiveLabel: 'Mastery Aktif:',
    flareNightLockedBtn: '🔒 Flare (Malam)',
    flareCooldownBtn: (sec) => `Flare ${sec}d`,
    flareReadyBtn: '🔥 Flare [Space]',
    flareTooltipNightOnly: 'Lantern Flare hanya bisa digunakan saat Malam',
    flareTooltipReady: 'Aktifkan Fire Flare [Space]',
    fenceNightLockedBtn: (b, t) => `🔒 Pagar (${b}/${t})`,
    fenceSelectedBtn: (label) => `Pagar: ${label} [F]`,
    fenceBuildBtn: (b, t) => `Pagar Luar [F] (${b}/${t})`,
    fenceUpgradeBtn: 'Upgrade Pagar [F]',
    lockedShort: 'Terkunci',
    languageMenuLabel: 'Bahasa:',
    dailyLockedBadgeShort: '3/3 TERSIMPAN',
    noTicketsBanner: 'Tiket Harian habis hari ini! Tunggu reset 00:00 UTC.',
    chooseBuildPadLabel: 'Titik Build:',
    padEmptyWorldBadge: (id) => `P${id} · +BANGUN`,
    padSelectedWorldBadge: (id) => `P${id} · PILIH`,

    dayStartBanner: (d) =>
      `Hari ${d}: Kumpulkan Kayu, Batu & Makanan, atau klik Titik Build (P1–P8) untuk memilih bangunan!`,
    padSelectedEmptyBanner: (id, label) =>
      `Titik Build P${id} (${label}) dipilih — pilih bangunan yang akan dibuat di menu bawah!`,
    padSelectedBuiltBanner: (id, bldName) =>
      `Pad P${id}: ${bldName} dipilih — pilih Upgrade, Perbaiki, atau Bongkar di menu bawah!`,
    chooseBuildingCallout: (id) => `Pilih Bangunan (P${id})`,
    fenceSelectedBanner: (label) =>
      `${label} dipilih — klik Pagar Luar [F] untuk membangun, atau pilih Titik Build P1–P8!`,
    nightBuildLockedBanner: 'Malam telah tiba — pembangunan dikunci hingga pagi!',
    flareNightLockedBanner: 'Lantern Flare hanya dapat digunakan saat Malam hari!',
    notEnoughResourcesBanner: 'Kayu, Batu, atau Makanan tidak cukup!',
    busyConstructingBanner: (label) =>
      `Ranger Rue sedang membangun ${label} — tunggu hingga selesai!`,
    allFencesMaxBanner: 'Seluruh 12 segmen Pagar Luar sudah mencapai level maksimal!',
    constructingStructureBanner: (name, id) => `Membangun ${name} di Pad P${id}...`,
    upgradingStructureBanner: (name, id) => `Meng-upgrade ke ${name} di Pad P${id}...`,
    repairingPadBanner: (id) => `Memperbaiki bangunan di Pad P${id}...`,
    addedReviewTicketsBanner: (t) => `+10 Tiket Review Ditambahkan! (${t} Tiket Tersedia)`,

    campPausedTitle: 'Permainan Dijeda',
    campPausedDesc: 'Ranger Rue sedang beristirahat sejenak di dekat lentera.',
    dayWaveLabel: 'Hari / Gelombang',
    runScoreLabel: 'Skor Saat Ini',
    resumeDefenseBtn: 'Lanjutkan Pertahanan (P / Esc)',
    endRunEarlyBtn: 'Akhiri Permainan & Klaim XP / Streak',
    restartBtn: 'Ulangi (-1)',
    titleScreenBtn: 'Halaman Utama',
    victoryHeaderBadge: '3 Malam Berhasil Dilewati · Fajar Menyingsing!',
    defeatHeaderBadge: 'Permainan Selesai · Laporan Benteng',
    runTimeLabel: (t) => `Waktu Bermain: ${t}`,
    victoryTitle: 'Menang! Area Hutan Aman',
    defeatTitle: 'Kalah! Benteng Ditembus',
    victoryDesc:
      'Baron Blight mundur teratur dan para zombie kembali ke dalam rawa hutan.',
    defeatDesc:
      'Ranger Rue telah bertarung gagah berani dengan lentera dan palunya sebelum mundur.',
    xpGainedLabel: 'XP Diperoleh',
    dailyStreakLabel: 'Streak Harian',
    ticketsLeftLabel: 'Sisa Tiket',
    playerLevelLabel: (lvl, title) => `Level Pemain ${lvl} · ${title}`,
    nextLevelRewardLabel: 'Hadiah Level Berikutnya:',
    newUnlocksEarnedLabel: 'Item Baru Terbuka:',
    dailyTasksCompletedTitle: (d, t) => `Misi Harian Selesai (${d} / ${t})`,
    allThreeDoneMsg: '3 Misi Selesai! (Benteng Tersimpan)',
    completeAllThreeMsg: 'Selesaikan ke-3 misi untuk Bonus Koin & XP',
    comeBackTomorrowMsg: (countdown, streak) =>
      `Kembali lagi besok pukul 00:00 UTC (dalam ${countdown}) untuk 3 tiket baru dan lanjutkan streak ${streak} harimu!`,
    bonusQueuedLabel: (c) => `+${c} Bonus Besok`,
    playAgainBtn: (t) => `Main Lagi (-1 Tiket · Sisa ${t})`,
    guideModalTitle: 'Build or Bite — Panduan Taktis & Bestiari Zombie',
    guideModalSubtitle: 'Pertahanan Benteng Hutan 3D · Bangunan Realistis & Multi-Bahasa',
    bestiarySectionTitle: '1. Bestiari Hero & Zombie (Sifat & Cara Mengatasi)',
    controlsSectionTitle: '2. Panduan Kontrol (PC & Handphone)',
    controlMoveDesc: 'WASD / Panah / Klik atau Geser Jari di tanah untuk bergerak & mengambil resource',
    controlFlareDesc: 'Spasi / Tombol Flare: Ledakan Api Lentera (Khusus Malam)',
    controlBuildDesc: 'Klik Titik Build (P1–P8) untuk membuka menu pilihan 6 bangunan',
    controlNightDesc: 'Enter / N: Mulai Malam lebih awal · P: Jeda',
    controlZoomDesc: 'Scroll Mouse (PC) atau Cubit 2 Jari (HP) untuk Zoom In / Out',

    newPlayerBuildHint: '✨ Siap Membangun! Klik P1 atau Titik Build untuk memasang pertahanan pertamamu',
    dailyLockedBanner:
      '🔒 Progres pembangunan hari ini selesai! Benteng & resource tersimpan hingga 00:00 UTC. Pertarungan Hero tetap aktif!',
    dailyProgressionCompleteTitle: 'Benteng Tersimpan · Progres Harian Selesai',
    dailyProgressionCompleteDesc:
      'Ke-3 misi harian selesai! Pengumpulan resource & pembangunan dikunci hingga 00:00 UTC.',
    dailyCheckInTitle: 'Check-In Harian Ranger',
    dailyCheckInReadyDesc: 'Permainan pertama hari ini selesai! Klaim hadiah Check-In harianmu:',
    dailyCheckInClaimBtn: '🎁 Klaim Check-In Harian (+25 Koin · +30 XP)',
    dailyCheckInClaimedLabel: '✓ Check-In Harian Sudah Diklaim Hari Ini (+25 Koin · +30 XP)',
    dailyCheckInPlayFirstDesc: 'Selesaikan 1 permainan hari ini untuk membuka hadiah Check-In Harian.',
    bonusTasksTitle: 'Patroli Bonus Opsional (XP Tambahan)',
    communityInviteTitle: 'Komunitas Api Unggun Ranger',
    communityInviteDesc: 'Bagikan susunan benteng & strategi bertahan di r/BuildOrBite',
    savedPermanentlyTitle: '✓ Tersimpan Permanen Antar Run & Reset Harian',
    savedPermanentlyDesc:
      'Bangunan & upgrade benteng (HP pulih penuh), dompet Kayu/Batu/Makanan, Level, XP, Koin & Kosmetik.',
    resetsNextRunTitle: '↻ Direset Setiap Permainan Baru',
    resetsNextRunDesc:
      'Gelombang zombie, proyektil aktif, skor sementara permainan, dan waktu Siang/Malam.',
    lockedUntilUtcTitle: '🔒 Dikunci Setelah 3/3 Misi Harian Hingga 00:00 UTC',
    lockedUntilUtcDesc:
      'Mengumpulkan resource, membangun, upgrade, perbaiki & bongkar (Pertarungan Hero tetap aktif).',
    buildDurationLabel: (sec) => `⏱ ${sec}d`,
    salvagedStructureBanner: (id, w, s) => `Pad P${id} dibongkar (+${w} Kayu, +${s} Batu kembali)`,
    weatherLabel: (w) =>
      w === 'rain' ? '🌧️ Hujan' : w === 'fog' ? '☁️ Kabut Tebal' : '☀️ Cerah',
    weatherModifierShort: (w) =>
      w === 'rain'
        ? '+65% Tumbuh · 82% Vis'
        : w === 'fog'
        ? '-35% Tumbuh · 65% Vis'
        : '100% Normal · 100% Vis',
    weatherTooltip: (w) =>
      w === 'rain'
        ? 'Hujan Hutan: Pertumbuhan resource +65% & hasil Kayu/Makanan +20%; jarak pandang 82%. (Klik untuk ganti cuaca)'
        : w === 'fog'
        ? 'Kabut Rawa Tebal: Pertumbuhan resource -35% & jarak pandang 65%, hasil Batu +25%. (Klik untuk ganti cuaca)'
        : 'Cerah: Jarak pandang 100% & pertumbuhan resource normal. (Klik untuk ganti cuaca)',
    weatherChangedBanner: (w) =>
      w === 'rain'
        ? '🌧️ Cuaca Berubah: Hujan Hutan! Pertumbuhan resource +65% & hasil Kayu/Makanan +20% (Jarak pandang 82%).'
        : w === 'fog'
        ? '☁️ Cuaca Berubah: Kabut Rawa Tebal! Jarak pandang 65% & pertumbuhan resource -35% (+25% hasil Batu).'
        : '☀️ Cuaca Berubah: Langit Cerah! Jarak pandang penuh & pertumbuhan resource kembali normal.',

    translateTaskTitle: (id, fb) => TASK_TITLES.id[id] ?? fb,
    translatePadLabel: (id, fb) => PAD_LABELS.id[id] ?? fb,
    translateLanternName: (id, fb) => LANTERN_NAMES.id[id] ?? fb,
    buildings: BUILDINGS_ID,
    zombies: ZOMBIES_ID,
  },

  zh: {
    tagline: '白天加固游侠露伊的森林堡垒，夜晚抵御礼貌却饥肠辘辘的僵尸大军。',
    playRunBtn: (tickets) => `开始挑战 (-1 门票 · 剩余 ${tickets})`,
    noTicketsBtn: (max) => `门票已用尽 (0/${max})`,
    addReviewTicketsBtn: '+10 测试门票 (免费)',
    howToRunBtn: '游戏指南与图鉴',
    lanternCosmeticTitle: '提灯光效外观',
    activeLabel: '当前装备:',
    rangerTitleLabel: '游侠称号:',
    canonicalCastTitle: '角色阵容 (3D模型与立绘)',
    inspectBestiaryBtn: '查看图鉴 →',
    dailyBoardTitle: (dateUTC) => `每日游侠任务板 (${dateUTC} UTC)`,
    dailyResetSubtitle: (countdown) =>
      `每日 00:00 UTC 重置为 3 张门票 · 距离重置 ${countdown}`,
    tasksLabel: '每日任务',
    rewardLabel: (coins, xp) => `奖励: +${coins} 金币 · +${xp} 经验`,
    allTasksBonusTitle: '完成全部 3 项任务奖励:',
    allTasksBonusDesc: '+100 金币 & +120 经验 (堡垒已保存)',
    claimedLabel: '已领取!',
    levelRangerLabel: (level, xp) => `${level} 级游侠 (累计 ${xp} 经验)`,
    nextUnlockLabel: '下级解锁:',
    activeStreakLabel: '当前连胜:',
    milestonesLabel: '里程碑:',
    bestScoreLabel: '最高分:',
    streakHeader: (s, b) => `连胜: ${s}天 (最高 ${b}天)`,
    coinsHeader: (c) => `金币: ${c}`,
    dailyTicketsHeader: (t, m) => `每日门票: ${t} / ${m}`,
    controlsFooter:
      'WASD / 点击或拖动地面移动 · 点击建造点选择建筑 · 鼠标滚轮 / 双指缩放 · 空格 提灯闪光(夜晚)',
    schemaFooter: 'UTC 每日重置 · 支持 5 种语言 · LocalStorage v3',

    fortHpLabel: '堡垒生命',
    dayBuildLabel: '白天 · 建造',
    bloodMoonLabel: '血月 · 防守',
    dayShort: (d, m) => `第${d}/${m}天`,
    zombiesLeftShort: (c) => `剩余 ${c}`,
    ticketLabel: '门票',
    ticketTooltip: '每日 00:00 UTC 重置为 3 张门票（未用门票不结转）',
    fenceLabel: '围栏',
    scoreLabel: '得分',
    dailyTasksChecklistTitle: '每日任务清单',
    closeLabel: '关闭',
    woodLabel: '木材',
    stoneLabel: '石料',
    foodLabel: '食物',
    startNightBtn: '入夜 [N]',
    nightThreatsLabel: (d) => `第 ${d} 夜威胁:`,
    fastTag: '高速',
    armorTag: '90 护甲',
    howlTag: '战吼',
    bossTag: '首领',
    constructingBanner: (label, pct) => `🔨 正在建造: ${label} (${pct}%)`,
    showBuildDockBtn: '▴ 展开建造菜单 [H]',
    hideDockTooltip: '隐藏底部菜单 [H]',
    padLockedNightHeader: (label) => `${label} — 🔒 夜晚锁定`,
    padChooseBuildHeader: (label) => `${label} — 请选择要建造的设施:`,
    nightLockedShort: '🔒 夜晚',
    repairBtn: (locked) => (locked ? '🔒 修复 [R]' : '🔧 修复 [R] (10木 5石)'),
    salvageBtn: (locked) => (locked ? '🔒 拆除 [X]' : '🗑️ 拆除 [X]'),
    upgradePathAHeader: (name) => `升级路线 A: ${name}`,
    upgradePathBHeader: (name) => `升级路线 B: ${name}`,
    masteryActiveLabel: '专精已激活:',
    flareNightLockedBtn: '🔒 闪光 (仅限夜晚)',
    flareCooldownBtn: (sec) => `冷却 ${sec}秒`,
    flareReadyBtn: '🔥 烈焰闪光 [空格]',
    flareTooltipNightOnly: '提灯烈焰闪光仅可在夜晚使用',
    flareTooltipReady: '释放提灯烈焰闪光 [空格]',
    fenceNightLockedBtn: (b, t) => `🔒 围栏 (${b}/${t})`,
    fenceSelectedBtn: (label) => `围栏: ${label} [F]`,
    fenceBuildBtn: (b, t) => `外围木栏 [F] (${b}/${t})`,
    fenceUpgradeBtn: '升级木栏 [F]',
    lockedShort: '已锁定',
    languageMenuLabel: '语言:',
    dailyLockedBadgeShort: '3/3 已保存',
    noTicketsBanner: '今日门票已用完！请等待 00:00 UTC 重置。',
    chooseBuildPadLabel: '建造点:',
    padEmptyWorldBadge: (id) => `P${id} · +建造`,
    padSelectedWorldBadge: (id) => `P${id} · 选择`,

    dayStartBanner: (d) =>
      `第 ${d} 天：收集木材、石料与食物，或点击任意建造点 (P1–P8) 选择要建造的防御设施！`,
    padSelectedEmptyBanner: (id, label) =>
      `已选中建造点 P${id} (${label}) — 请在下方菜单选择要建造的建筑！`,
    padSelectedBuiltBanner: (id, bldName) =>
      `已选中 P${id}: ${bldName} — 请在下方选择升级、修复或拆除！`,
    chooseBuildingCallout: (id) => `选择建筑 (P${id})`,
    fenceSelectedBanner: (label) =>
      `已选中 ${label} — 点击“外围木栏 [F]”进行建造/升级，或选择建造点 P1–P8！`,
    nightBuildLockedBanner: '夜幕已降临 — 黎明前无法进行建造与升级！',
    flareNightLockedBanner: '提灯烈焰闪光仅可在夜晚防守时使用！',
    notEnoughResourcesBanner: '木材、石料或食物不足！',
    busyConstructingBanner: (label) => `游侠露伊正在建造 ${label} — 请等待完成！`,
    allFencesMaxBanner: '全部 12 段外围围栏已升至最高等级！',
    constructingStructureBanner: (name, id) => `正在 P${id} 建造 ${name}...`,
    upgradingStructureBanner: (name, id) => `正在将 P${id} 升级为 ${name}...`,
    repairingPadBanner: (id) => `正在修复 P${id} 的建筑...`,
    addedReviewTicketsBanner: (t) => `已添加 +10 张测试门票！（当前可用：${t}）`,

    campPausedTitle: '游戏已暂停',
    campPausedDesc: '游侠露伊正在提灯旁稍作休息。',
    dayWaveLabel: '天数 / 波次',
    runScoreLabel: '当前得分',
    resumeDefenseBtn: '继续防守 (P / Esc)',
    endRunEarlyBtn: '提前结算并领取经验与连胜奖励',
    restartBtn: '重新开始 (-1)',
    titleScreenBtn: '返回主页',
    victoryHeaderBadge: '成功坚守 3 个夜晚 · 黎明降临！',
    defeatHeaderBadge: '挑战结束 · 堡垒战报',
    runTimeLabel: (t) => `用时: ${t}`,
    victoryTitle: '胜利！林间空地化险为夷',
    defeatTitle: '失守！堡垒被攻破',
    victoryDesc: '枯萎男爵戏剧性地鞠躬退场，尸群摇摇晃晃地退回了深林。',
    defeatDesc: '游侠露伊挥舞木槌与提灯英勇奋战，随后撤回营地重整旗鼓。',
    xpGainedLabel: '获得经验',
    dailyStreakLabel: '每日连胜',
    ticketsLeftLabel: '剩余门票',
    playerLevelLabel: (lvl, title) => `玩家等级 ${lvl} · ${title}`,
    nextLevelRewardLabel: '下一级奖励:',
    newUnlocksEarnedLabel: '新解锁内容:',
    dailyTasksCompletedTitle: (d, t) => `每日任务完成度 (${d} / ${t})`,
    allThreeDoneMsg: '全部完成！(堡垒已保存)',
    completeAllThreeMsg: '完成全部 3 项任务可获额外金币与经验',
    comeBackTomorrowMsg: (countdown, streak) =>
      `明日 00:00 UTC (${countdown}后) 回来领取 3 张新门票，延续你的 ${streak} 天连胜！`,
    bonusQueuedLabel: (c) => `明日额外 +${c}`,
    playAgainBtn: (t) => `再来一局 (-1 门票 · 剩余 ${t})`,
    guideModalTitle: 'Build or Bite — 战术指南与僵尸图鉴',
    guideModalSubtitle: '3D 森林堡垒塔防 · 写实建筑与多语言版',
    bestiarySectionTitle: '1. 英雄与僵尸图鉴 (特性与克制方法)',
    controlsSectionTitle: '2. 操作指南 (电脑与手机)',
    controlMoveDesc: 'WASD / 方向键 / 点击或触屏拖动地面：移动并采集资源',
    controlFlareDesc: '空格键 / 闪光按钮：释放提灯烈焰闪光（仅限夜晚）',
    controlBuildDesc: '点击任意建造点 (P1–P8)：打开 6 种防御建筑选择菜单',
    controlNightDesc: 'Enter / N：提前入夜 · P：暂停',
    controlZoomDesc: '鼠标滚轮 (电脑) 或 双指捏合 (手机)：缩放镜头',

    newPlayerBuildHint: '✨ 资源充足！点击 P1 或建造点放置你的第一座防御建筑',
    dailyLockedBanner:
      '🔒 今日建造进度已完成！堡垒与资源已保存至 00:00 UTC。英雄战斗依然开放！',
    dailyProgressionCompleteTitle: '堡垒已保存 · 今日建造任务全部完成',
    dailyProgressionCompleteDesc:
      '全部 3 项每日任务已完成！采集、建造与升级将锁定至 00:00 UTC。',
    dailyCheckInTitle: '每日游侠签到',
    dailyCheckInReadyDesc: '今日首局挑战已完成！立即领取你的每日签到补给：',
    dailyCheckInClaimBtn: '🎁 领取每日签到 (+25 金币 · +30 经验)',
    dailyCheckInClaimedLabel: '✓ 今日签到奖励已领取 (+25 金币 · +30 经验)',
    dailyCheckInPlayFirstDesc: '今日完成 1 局标准挑战即可解锁每日签到奖励。',
    bonusTasksTitle: '可选额外巡逻目标 (小额经验)',
    communityInviteTitle: '游侠营火社区',
    communityInviteDesc: '在 r/BuildOrBite 与其他守卫者分享你的堡垒布局与防守战术',
    savedPermanentlyTitle: '✓ 跨局与跨日永久保存',
    savedPermanentlyDesc:
      '堡垒建筑与升级路线（耐久自动回满）、木材/石料/食物钱包、等级、经验、金币与外观。',
    resetsNextRunTitle: '↻ 每局新挑战重置',
    resetsNextRunDesc: '亡灵波次、场上弹射物、单局临时得分以及昼夜波次计时器。',
    lockedUntilUtcTitle: '🔒 完成 3/3 每日任务后锁定至 00:00 UTC',
    lockedUntilUtcDesc:
      '采集资源、建造、升级、修复与拆除（英雄战斗依然开放）。',
    buildDurationLabel: (sec) => `⏱ ${sec}秒`,
    salvagedStructureBanner: (id, w, s) => `已拆除 P${id} 建筑 (返还 +${w} 木材, +${s} 石料)`,
    weatherLabel: (w) =>
      w === 'rain' ? '🌧️ 阵雨' : w === 'fog' ? '☁️ 浓雾' : '☀️ 晴朗',
    weatherModifierShort: (w) =>
      w === 'rain'
        ? '+65% 生长 · 82% 视野'
        : w === 'fog'
        ? '-35% 生长 · 65% 视野'
        : '100% 生长 · 100% 视野',
    weatherTooltip: (w) =>
      w === 'rain'
        ? '森林阵雨：资源再生速度 +65%，木材/食物采集量 +20%；视野降至 82%。（点击切换天气）'
        : w === 'fog'
        ? '沼泽浓雾：资源再生速度 -35%，视野降至 65%，石料采集量 +25%。（点击切换天气）'
        : '晴朗空地：100% 清晰视野与标准资源生长速度。（点击切换天气）',
    weatherChangedBanner: (w) =>
      w === 'rain'
        ? '🌧️ 天气变化：森林阵雨！资源再生速度 +65%，木材/食物采集 +20%（视野 82%）。'
        : w === 'fog'
        ? '☁️ 天气变化：沼泽浓雾！视野降至 65%，资源再生减缓 -35%（石料采集 +25%）。'
        : '☀️ 天气变化：阳光放晴！视野与资源生长速度恢复正常。',

    translateTaskTitle: (id, fb) => TASK_TITLES.zh[id] ?? fb,
    translatePadLabel: (id, fb) => PAD_LABELS.zh[id] ?? fb,
    translateLanternName: (id, fb) => LANTERN_NAMES.zh[id] ?? fb,
    buildings: BUILDINGS_ZH,
    zombies: ZOMBIES_ZH,
  },

  vi: {
    tagline:
      'Gia cố pháo đài rừng của Kiểm Lâm Rue vào ban ngày, chống lại bầy zombie lịch sự nhưng đói khát vào ban đêm.',
    playRunBtn: (tickets) => `Chơi Ngay (-1 Vé · Còn ${tickets})`,
    noTicketsBtn: (max) => `Hết Vé Hôm Nay (0/${max})`,
    addReviewTicketsBtn: '+10 Vé Chơi Thử (Miễn Phí)',
    howToRunBtn: 'Hướng Dẫn & Từ Điển',
    lanternCosmeticTitle: 'Màu Ánh Sáng Đèn Lồng',
    activeLabel: 'Đang dùng:',
    rangerTitleLabel: 'Danh Hiệu:',
    canonicalCastTitle: 'Dàn Nhân Vật (Mô Hình 3D & Chân Dung)',
    inspectBestiaryBtn: 'Xem Từ Điển →',
    dailyBoardTitle: (dateUTC) => `Bảng Nhiệm Vụ Ngày (${dateUTC} UTC)`,
    dailyResetSubtitle: (countdown) =>
      `Làm mới 3 vé lúc 00:00 UTC · Làm mới sau ${countdown}`,
    tasksLabel: 'Nhiệm vụ',
    rewardLabel: (coins, xp) => `Thưởng: +${coins} Xu · +${xp} XP`,
    allTasksBonusTitle: 'Thưởng Hoàn Thành Cả 3:',
    allTasksBonusDesc: '+100 Xu & +120 XP (Đã Lưu Pháo Đài)',
    claimedLabel: 'Đã nhận!',
    levelRangerLabel: (level, xp) => `Kiểm Lâm Cấp ${level} (${xp} Tổng XP)`,
    nextUnlockLabel: 'Mở khóa tiếp:',
    activeStreakLabel: 'Chuỗi Ngày:',
    milestonesLabel: 'Cột mốc:',
    bestScoreLabel: 'Kỷ lục:',
    streakHeader: (s, b) => `Chuỗi: ${s}n (Kỷ lục ${b}n)`,
    coinsHeader: (c) => `Xu: ${c}`,
    dailyTicketsHeader: (t, m) => `Vé Hàng Ngày: ${t} / ${m}`,
    controlsFooter:
      'WASD / Chạm & Kéo: Di chuyển · Chạm Bệ Xây (P1–P8): Chọn công trình · Lăn chuột / Chụm 2 ngón: Thu phóng · Space: Pháo sáng',
    schemaFooter: 'Làm Mới 00:00 UTC · Hỗ Trợ 5 Ngôn Ngữ · LocalStorage v3',

    fortHpLabel: 'MÁU PHÁO ĐÀI',
    dayBuildLabel: 'NGÀY · XÂY DỰNG',
    bloodMoonLabel: 'TRĂNG MÁU',
    dayShort: (d, m) => `N${d}/${m}`,
    zombiesLeftShort: (c) => `Còn ${c}`,
    ticketLabel: 'VÉ',
    ticketTooltip: 'Làm mới tối đa 3 vé lúc 00:00 UTC (vé dư không cộng dồn)',
    fenceLabel: 'HÀNG RÀO',
    scoreLabel: 'ĐIỂM',
    dailyTasksChecklistTitle: 'Danh Sách Nhiệm Vụ Ngày',
    closeLabel: 'Đóng',
    woodLabel: 'GỖ',
    stoneLabel: 'ĐÁ',
    foodLabel: 'THỨC ĂN',
    startNightBtn: 'Vào Đêm [N]',
    nightThreatsLabel: (d) => `Mối Đe Dọa Đêm ${d}:`,
    fastTag: 'NHANH',
    armorTag: '90 GIÁP',
    howlTag: 'HÚ',
    bossTag: 'TRÙM',
    constructingBanner: (label, pct) => `🔨 Đang xây: ${label} (${pct}%)`,
    showBuildDockBtn: '▴ Mở Menu Xây Dựng [H]',
    hideDockTooltip: 'Ẩn Menu Dưới [H]',
    padLockedNightHeader: (label) => `${label} — 🔒 Khóa Ban Đêm`,
    padChooseBuildHeader: (label) => `${label} — Chọn Công Trình Muốn Xây:`,
    nightLockedShort: '🔒 Đêm',
    repairBtn: (locked) => (locked ? '🔒 Sửa [R]' : '🔧 Sửa [R] (10G 5Đ)'),
    salvageBtn: (locked) => (locked ? '🔒 Tháo Dỡ [X]' : '🗑️ Tháo Dỡ [X]'),
    upgradePathAHeader: (name) => `Nâng Cấp A: ${name}`,
    upgradePathBHeader: (name) => `Nâng Cấp B: ${name}`,
    masteryActiveLabel: 'Tinh Thông:',
    flareNightLockedBtn: '🔒 Pháo Sáng (Đêm)',
    flareCooldownBtn: (sec) => `Hồi ${sec}s`,
    flareReadyBtn: '🔥 Pháo Sáng [Space]',
    flareTooltipNightOnly: 'Pháo sáng Đèn Lồng chỉ dùng được vào Ban Đêm',
    flareTooltipReady: 'Kích hoạt Pháo Sáng Lửa [Space]',
    fenceNightLockedBtn: (b, t) => `🔒 Rào (${b}/${t})`,
    fenceSelectedBtn: (label) => `Rào: ${label} [F]`,
    fenceBuildBtn: (b, t) => `Rào Ngoài [F] (${b}/${t})`,
    fenceUpgradeBtn: 'Nâng Cấp Rào [F]',
    lockedShort: 'Đã khóa',
    languageMenuLabel: 'Ngôn ngữ:',
    dailyLockedBadgeShort: '3/3 ĐÃ LƯU',
    noTicketsBanner: 'Hết Vé Ngày hôm nay! Hãy đợi reset lúc 00:00 UTC.',
    chooseBuildPadLabel: 'Bệ Xây:',
    padEmptyWorldBadge: (id) => `P${id} · +XÂY`,
    padSelectedWorldBadge: (id) => `P${id} · CHỌN`,

    dayStartBanner: (d) =>
      `Ngày ${d}: Thu thập Gỗ, Đá & Thức ăn, hoặc nhấn vào Bệ Xây (P1–P8) để chọn công trình!`,
    padSelectedEmptyBanner: (id, label) =>
      `Đã chọn Bệ P${id} (${label}) — hãy chọn công trình muốn xây ở menu bên dưới!`,
    padSelectedBuiltBanner: (id, bldName) =>
      `Bệ P${id}: ${bldName} — chọn Nâng cấp, Sửa chữa hoặc Tháo dỡ ở menu dưới!`,
    chooseBuildingCallout: (id) => `Chọn Công Trình (P${id})`,
    fenceSelectedBanner: (label) =>
      `Đã chọn ${label} — nhấn Rào Ngoài [F] để xây/nâng cấp, hoặc chọn Bệ Xây P1–P8!`,
    nightBuildLockedBanner: 'Đêm đã buông xuống — khóa xây dựng cho đến bình minh!',
    flareNightLockedBanner: 'Pháo sáng Đèn Lồng chỉ có thể sử dụng vào ban đêm!',
    notEnoughResourcesBanner: 'Không đủ Gỗ, Đá hoặc Thức ăn!',
    busyConstructingBanner: (label) => `Kiểm Lâm Rue đang xây ${label} — vui lòng đợi!`,
    allFencesMaxBanner: 'Tất cả 12 đoạn Hàng Rào Ngoài đã đạt cấp tối đa!',
    constructingStructureBanner: (name, id) => `Đang xây ${name} tại Bệ P${id}...`,
    upgradingStructureBanner: (name, id) => `Đang nâng cấp ${name} tại Bệ P${id}...`,
    repairingPadBanner: (id) => `Đang sửa chữa công trình tại Bệ P${id}...`,
    addedReviewTicketsBanner: (t) => `Đã thêm +10 Vé Chơi Thử! (Hiện có ${t} vé)`,

    campPausedTitle: 'Tạm Dừng Trò Chơi',
    campPausedDesc: 'Kiểm Lâm Rue đang nghỉ ngơi bên ánh đèn lồng.',
    dayWaveLabel: 'Ngày / Đợt',
    runScoreLabel: 'Điểm Hiện Tại',
    resumeDefenseBtn: 'Tiếp Tục Phòng Thủ (P / Esc)',
    endRunEarlyBtn: 'Kết Thúc Sớm & Nhận XP / Chuỗi Ngày',
    restartBtn: 'Chơi Lại (-1)',
    titleScreenBtn: 'Màn Hình Chính',
    victoryHeaderBadge: 'Sống Sót Qua 3 Đêm · Bình Minh Lên!',
    defeatHeaderBadge: 'Hoàn Thành Lượt · Báo Cáo Pháo Đài',
    runTimeLabel: (t) => `Thời gian: ${t}`,
    victoryTitle: 'Chiến Thắng! Rừng Quang Đã An Toàn',
    defeatTitle: 'Thất Thủ! Pháo Đài Bị Tràn Ngập',
    victoryDesc: 'Baron Blight cúi chào rút lui và đám zombie lững thững quay về đầm lầy.',
    defeatDesc: 'Kiểm Lâm Rue đã chiến đấu quả cảm trước khi rút về trại.',
    xpGainedLabel: 'XP Nhận Được',
    dailyStreakLabel: 'Chuỗi Ngày',
    ticketsLeftLabel: 'Vé Còn Lại',
    playerLevelLabel: (lvl, title) => `Cấp Người Chơi ${lvl} · ${title}`,
    nextLevelRewardLabel: 'Phần Thưởng Cấp Tiếp:',
    newUnlocksEarnedLabel: 'Mở Khóa Mới:',
    dailyTasksCompletedTitle: (d, t) => `Nhiệm Vụ Ngày Đã Xong (${d} / ${t})`,
    allThreeDoneMsg: 'Hoàn thành cả 3! (Đã Lưu Pháo Đài)',
    completeAllThreeMsg: 'Hoàn thành cả 3 để nhận Xu & XP thưởng',
    comeBackTomorrowMsg: (countdown, streak) =>
      `Quay lại vào 00:00 UTC ngày mai (sau ${countdown}) để nhận 3 vé mới và nối dài chuỗi ${streak} ngày!`,
    bonusQueuedLabel: (c) => `+${c} Vé Thưởng Chờ`,
    playAgainBtn: (t) => `Chơi Lại (-1 Vé · Còn ${t})`,
    guideModalTitle: 'Build or Bite — Cẩm Nang Chiến Thuật & Từ Điển Zombie',
    guideModalSubtitle: 'Thủ Thành Rừng 3D · Công Trình Chân Thực & Đa Ngôn Ngữ',
    bestiarySectionTitle: '1. Từ Điển Anh Hùng & Zombie (Đặc Điểm & Khắc Chế)',
    controlsSectionTitle: '2. Điều Khiển (PC & Điện Thoại)',
    controlMoveDesc: 'WASD / Mũi tên / Chạm & Kéo trên mặt đất để di chuyển & thu thập tài nguyên',
    controlFlareDesc: 'Phím Space / Nút Pháo Sáng: Bắn Pháo Sáng Lửa (Chỉ ban đêm)',
    controlBuildDesc: 'Nhấn vào Bệ Xây (P1–P8) để mở menu chọn 6 công trình phòng thủ',
    controlNightDesc: 'Enter / N: Bắt đầu Đêm sớm · P: Tạm dừng',
    controlZoomDesc: 'Con lăn chuột (PC) hoặc Chụm 2 ngón tay (Điện thoại) để Phóng to / Thu nhỏ',

    newPlayerBuildHint: '✨ Đủ tài nguyên! Nhấn P1 hoặc Bệ Xây để đặt công trình phòng thủ đầu tiên',
    dailyLockedBanner:
      '🔒 Tiến độ xây dựng hôm nay đã hoàn tất! Pháo đài & tài nguyên đã được lưu đến 00:00 UTC. Chiến đấu vẫn mở!',
    dailyProgressionCompleteTitle: 'Pháo Đài Đã Lưu · Hoàn Tất Tiến Độ Ngày',
    dailyProgressionCompleteDesc:
      'Đã xong cả 3 nhiệm vụ ngày! Thu thập, xây dựng & nâng cấp khóa đến 00:00 UTC.',
    dailyCheckInTitle: 'Điểm Danh Kiểm Lâm Hàng Ngày',
    dailyCheckInReadyDesc: 'Đã hoàn thành lượt chơi đầu tiên trong ngày! Nhận quà điểm danh ngay:',
    dailyCheckInClaimBtn: '🎁 Nhận Quà Điểm Danh (+25 Xu · +30 XP)',
    dailyCheckInClaimedLabel: '✓ Đã Nhận Quà Điểm Danh Hôm Nay (+25 Xu · +30 XP)',
    dailyCheckInPlayFirstDesc: 'Hoàn thành 1 lượt chơi tiêu chuẩn hôm nay để mở khóa Điểm Danh.',
    bonusTasksTitle: 'Nhiệm Vụ Tuần Tra Phụ (Thêm XP)',
    communityInviteTitle: 'Cộng Đồng Lửa Trại Kiểm Lâm',
    communityInviteDesc: 'Chia sẻ cách bố trí pháo đài & chiến thuật tại r/BuildOrBite',
    savedPermanentlyTitle: '✓ Lưu Vĩnh Viễn Qua Các Lượt & Ngày UTC',
    savedPermanentlyDesc:
      'Công trình & nhánh nâng cấp pháo đài (hồi đầy HP), ví Gỗ/Đá/Thức ăn, Cấp độ, XP, Xu & Trang phục.',
    resetsNextRunTitle: '↻ Đặt Lại Khi Bắt Đầu Lượt Mới',
    resetsNextRunDesc: 'Đợt zombie, đạn đang bay, điểm số tạm thời và đồng hồ Ngày/Đêm.',
    lockedUntilUtcTitle: '🔒 Khóa Sau Khi Xong 3/3 Nhiệm Vụ Đến 00:00 UTC',
    lockedUntilUtcDesc:
      'Thu thập tài nguyên, xây mới, nâng cấp, sửa chữa & tháo dỡ (Chiến đấu vẫn mở).',
    buildDurationLabel: (sec) => `⏱ ${sec}s`,
    salvagedStructureBanner: (id, w, s) => `Đã tháo dỡ Bệ P${id} (+${w} Gỗ, +${s} Đá hoàn lại)`,
    weatherLabel: (w) =>
      w === 'rain' ? '🌧️ Mưa Rừng' : w === 'fog' ? '☁️ Sương Mù' : '☀️ Nắng Đẹp',
    weatherModifierShort: (w) =>
      w === 'rain'
        ? '+65% Mọc · 82% Tầm nhìn'
        : w === 'fog'
        ? '-35% Mọc · 65% Tầm nhìn'
        : '100% Mọc · 100% Tầm nhìn',
    weatherTooltip: (w) =>
      w === 'rain'
        ? 'Mưa Rừng: Tốc độ hồi tài nguyên +65% & sản lượng Gỗ/Thức ăn +20%; tầm nhìn 82%. (Nhấn để đổi thời tiết)'
        : w === 'fog'
        ? 'Sương Mù Đầm Lầy: Tốc độ hồi tài nguyên -35% & tầm nhìn 65%, sản lượng Đá +25%. (Nhấn để đổi thời tiết)'
        : 'Nắng Quang Đãng: Tầm nhìn 100% & tốc độ hồi tài nguyên tiêu chuẩn. (Nhấn để đổi thời tiết)',
    weatherChangedBanner: (w) =>
      w === 'rain'
        ? '🌧️ Thời Tiết Đổi: Mưa Rừng! Tốc độ mọc tài nguyên +65% & Gỗ/Thức ăn +20% (Tầm nhìn 82%).'
        : w === 'fog'
        ? '☁️ Thời Tiết Đổi: Sương Mù Đầm Lầy! Tầm nhìn 65% & mọc tài nguyên -35% (+25% Đá).'
        : '☀️ Thời Tiết Đổi: Trời Quang Mây Tạnh! Tầm nhìn và tốc độ mọc tài nguyên trở lại bình thường.',

    translateTaskTitle: (id, fb) => TASK_TITLES.vi[id] ?? fb,
    translatePadLabel: (id, fb) => PAD_LABELS.vi[id] ?? fb,
    translateLanternName: (id, fb) => LANTERN_NAMES.vi[id] ?? fb,
    buildings: BUILDINGS_VI,
    zombies: ZOMBIES_VI,
  },

  ru: {
    tagline:
      'Укрепляйте лесной форт рейнджера Рю днем и отбивайтесь от вежливых, но голодных зомби ночью.',
    playRunBtn: (tickets) => `Играть (-1 билет · Осталось ${tickets})`,
    noTicketsBtn: (max) => `Нет билетов (0/${max})`,
    addReviewTicketsBtn: '+10 билетов (Бесплатно)',
    howToRunBtn: 'Руководство и Бестиарий',
    lanternCosmeticTitle: 'Свечение фонаря',
    activeLabel: 'Активно:',
    rangerTitleLabel: 'Титул:',
    canonicalCastTitle: 'Персонажи (3D-модели и портреты)',
    inspectBestiaryBtn: 'Открыть Бестиарий →',
    dailyBoardTitle: (dateUTC) => `Доска заданий рейнджера (${dateUTC} UTC)`,
    dailyResetSubtitle: (countdown) =>
      `Пополнение до 3 билетов в 00:00 UTC · Сброс через ${countdown}`,
    tasksLabel: 'Задания',
    rewardLabel: (coins, xp) => `Награда: +${coins} монет · +${xp} опыта`,
    allTasksBonusTitle: 'Бонус за все 3 задания:',
    allTasksBonusDesc: '+100 монет и +120 опыта (Форт сохранен)',
    claimedLabel: 'Получено!',
    levelRangerLabel: (level, xp) => `Рейнджер ${level} ур. (${xp} опыта)`,
    nextUnlockLabel: 'След. награда:',
    activeStreakLabel: 'Серия дней:',
    milestonesLabel: 'Рубежи:',
    bestScoreLabel: 'Рекорд:',
    streakHeader: (s, b) => `Серия: ${s}д (Рекорд ${b}д)`,
    coinsHeader: (c) => `Монеты: ${c}`,
    dailyTicketsHeader: (t, m) => `Билеты: ${t} / ${m}`,
    controlsFooter:
      'WASD / Клик и ведение: Движение · Клик по площадке (P1–P8): Выбор постройки · Колесо мыши / Щипок: Зум · Пробел: Вспышка',
    schemaFooter: 'Сброс в 00:00 UTC · 5 языков · LocalStorage v3',

    fortHpLabel: 'ОЗ ФОРТА',
    dayBuildLabel: 'ДЕНЬ · СТРОЙКА',
    bloodMoonLabel: 'КРОВАВАЯ ЛУНА',
    dayShort: (d, m) => `Д${d}/${m}`,
    zombiesLeftShort: (c) => `Ост: ${c}`,
    ticketLabel: 'БИЛЕТЫ',
    ticketTooltip: 'Билеты сбрасываются до 3 в 00:00 UTC (неиспользованные не переносятся)',
    fenceLabel: 'ЗАБОР',
    scoreLabel: 'СЧЕТ',
    dailyTasksChecklistTitle: 'Ежедневные задания',
    closeLabel: 'Закрыть',
    woodLabel: 'ДЕРЕВО',
    stoneLabel: 'КАМЕНЬ',
    foodLabel: 'ЕДА',
    startNightBtn: 'Ночь [N]',
    nightThreatsLabel: (d) => `Угрозы ночи ${d}:`,
    fastTag: 'БЫСТРЫЙ',
    armorTag: '90 БРОНЯ',
    howlTag: 'ВОЙ',
    bossTag: 'БОСС',
    constructingBanner: (label, pct) => `🔨 Строительство: ${label} (${pct}%)`,
    showBuildDockBtn: '▴ Открыть меню стройки [H]',
    hideDockTooltip: 'Скрыть нижнее меню [H]',
    padLockedNightHeader: (label) => `${label} — 🔒 Закрыто ночью`,
    padChooseBuildHeader: (label) => `${label} — Выберите постройку:`,
    nightLockedShort: '🔒 Ночь',
    repairBtn: (locked) => (locked ? '🔒 Починить [R]' : '🔧 Починить [R] (10Д 5К)'),
    salvageBtn: (locked) => (locked ? '🔒 Снести [X]' : '🗑️ Снести [X]'),
    upgradePathAHeader: (name) => `Улучшение A: ${name}`,
    upgradePathBHeader: (name) => `Улучшение B: ${name}`,
    masteryActiveLabel: 'Мастерство:',
    flareNightLockedBtn: '🔒 Вспышка (Ночь)',
    flareCooldownBtn: (sec) => `Вспышка ${sec}с`,
    flareReadyBtn: '🔥 Вспышка [Пробел]',
    flareTooltipNightOnly: 'Вспышка фонаря доступна только ночью',
    flareTooltipReady: 'Активировать огненную вспышку фонаря [Пробел]',
    fenceNightLockedBtn: (b, t) => `🔒 Забор (${b}/${t})`,
    fenceSelectedBtn: (label) => `Забор: ${label} [F]`,
    fenceBuildBtn: (b, t) => `Внешний забор [F] (${b}/${t})`,
    fenceUpgradeBtn: 'Улучшить забор [F]',
    lockedShort: 'Закрыто',
    languageMenuLabel: 'Язык:',
    dailyLockedBadgeShort: '3/3 СОХРАНЕНО',
    noTicketsBanner: 'Дневные билеты на сегодня закончились! Ждите сброса в 00:00 UTC.',
    chooseBuildPadLabel: 'Площадки:',
    padEmptyWorldBadge: (id) => `P${id} · +СТРОИТЬ`,
    padSelectedWorldBadge: (id) => `P${id} · ВЫБОР`,

    dayStartBanner: (d) =>
      `День ${d}: Собирайте дерево, камень и еду или нажмите на площадку (P1–P8), чтобы выбрать постройку!`,
    padSelectedEmptyBanner: (id, label) =>
      `Выбрана площадка P${id} (${label}) — выберите постройку в нижнем меню!`,
    padSelectedBuiltBanner: (id, bldName) =>
      `Площадка P${id}: ${bldName} — выберите улучшение, починку или снос!`,
    chooseBuildingCallout: (id) => `Выбор постройки (P${id})`,
    fenceSelectedBanner: (label) =>
      `Выбран ${label} — нажмите «Внешний забор [F]» для постройки или выберите площадку P1–P8!`,
    nightBuildLockedBanner: 'Наступила ночь — строительство заблокировано до рассвета!',
    flareNightLockedBanner: 'Огненная вспышка фонаря доступна только ночью!',
    notEnoughResourcesBanner: 'Недостаточно дерева, камня или еды!',
    busyConstructingBanner: (label) => `Рейнджер Рю строит ${label} — подождите завершения!`,
    allFencesMaxBanner: 'Все 12 секций внешнего забора уже улучшены до максимума!',
    constructingStructureBanner: (name, id) => `Строим ${name} на площадке P${id}...`,
    upgradingStructureBanner: (name, id) => `Улучшаем до «${name}» на площадке P${id}...`,
    repairingPadBanner: (id) => `Чиним постройку на площадке P${id}...`,
    addedReviewTicketsBanner: (t) => `+10 тестовых билетов добавлено! (Доступно: ${t})`,

    campPausedTitle: 'Игра на паузе',
    campPausedDesc: 'Рейнджер Рю переводит дух у фонаря.',
    dayWaveLabel: 'День / Волна',
    runScoreLabel: 'Текущий счет',
    resumeDefenseBtn: 'Продолжить оборону (P / Esc)',
    endRunEarlyBtn: 'Завершить забег и забрать опыт / серию',
    restartBtn: 'Заново (-1)',
    titleScreenBtn: 'Главное меню',
    victoryHeaderBadge: 'Все 3 ночи позади · Рассвет!',
    defeatHeaderBadge: 'Забег завершен · Отчет форта',
    runTimeLabel: (t) => `Время: ${t}`,
    victoryTitle: 'Победа! Поляна защищена',
    defeatTitle: 'Укушены! Форт пал',
    victoryDesc: 'Барон Мор театрально поклонился, и зомби побрели обратно в болото.',
    defeatDesc: 'Рейнджер Рю храбро сражалась фонарем и молотом перед отступлением в лагерь.',
    xpGainedLabel: 'Получено опыта',
    dailyStreakLabel: 'Серия дней',
    ticketsLeftLabel: 'Осталось билетов',
    playerLevelLabel: (lvl, title) => `Уровень игрока ${lvl} · ${title}`,
    nextLevelRewardLabel: 'Награда след. уровня:',
    newUnlocksEarnedLabel: 'Новые награды:',
    dailyTasksCompletedTitle: (d, t) => `Ежедневные задания (${d} / ${t})`,
    allThreeDoneMsg: 'Все 3 выполнены! (Форт сохранен)',
    completeAllThreeMsg: 'Выполните все 3 для бонуса монет и опыта',
    comeBackTomorrowMsg: (countdown, streak) =>
      `Возвращайтесь завтра в 00:00 UTC (через ${countdown}), чтобы получить 3 новых билета и продлить серию (${streak} дн.)!`,
    bonusQueuedLabel: (c) => `+${c} бонус завтра`,
    playAgainBtn: (t) => `Играть снова (-1 билет · Осталось ${t})`,
    guideModalTitle: 'Build or Bite — Тактическое руководство и Бестиарий',
    guideModalSubtitle: '3D-оборона лесного форта · Реалистичные постройки и 5 языков',
    bestiarySectionTitle: '1. Бестиарий героя и зомби (особенности и контрмеры)',
    controlsSectionTitle: '2. Управление (ПК и телефон)',
    controlMoveDesc: 'WASD / Стрелки / Клик или ведение пальцем по земле — движение и сбор ресурсов',
    controlFlareDesc: 'Пробел / Кнопка Вспышки — огненная вспышка фонаря (только ночью)',
    controlBuildDesc: 'Нажмите на любую площадку (P1–P8), чтобы открыть меню выбора из 6 построек',
    controlNightDesc: 'Enter / N — начать ночь досрочно · P — пауза',
    controlZoomDesc: 'Колесо мыши (ПК) или щипок двумя пальцами (телефон) — приближение и отдаление',

    newPlayerBuildHint: '✨ Ресурсов достаточно! Нажмите P1 или площадку, чтобы построить первую защиту',
    dailyLockedBanner:
      '🔒 Дневной прогресс строительства завершен! Форт и ресурсы сохранены до 00:00 UTC. Бой героя открыт!',
    dailyProgressionCompleteTitle: 'Форт сохранен · Дневной прогресс завершен',
    dailyProgressionCompleteDesc:
      'Все 3 задания выполнены! Сбор ресурсов, постройка и улучшения закрыты до 00:00 UTC.',
    dailyCheckInTitle: 'Ежедневная отметка рейнджера',
    dailyCheckInReadyDesc: 'Первый забег за день завершен! Заберите ежедневную награду:',
    dailyCheckInClaimBtn: '🎁 Забрать награду дня (+25 монет · +30 опыта)',
    dailyCheckInClaimedLabel: '✓ Награда дня уже получена сегодня (+25 монет · +30 опыта)',
    dailyCheckInPlayFirstDesc: 'Завершите 1 стандартный забег сегодня, чтобы открыть награду дня.',
    bonusTasksTitle: 'Дополнительные патрули (бонусный опыт)',
    communityInviteTitle: 'Сообщество у костра рейнджеров',
    communityInviteDesc: 'Делитесь схемами фортов и тактикой обороны в r/BuildOrBite',
    savedPermanentlyTitle: '✓ Сохраняется навсегда между забегами и днями UTC',
    savedPermanentlyDesc:
      'Постройки и улучшения форта (с полным ОЗ), запас дерева/камня/еды, уровень, опыт, монеты и декор.',
    resetsNextRunTitle: '↻ Сбрасывается в каждом новом забеге',
    resetsNextRunDesc: 'Волны зомби, снаряды, временный счет забега и таймеры дня/ночи.',
    lockedUntilUtcTitle: '🔒 Закрыто после 3/3 заданий дня до 00:00 UTC',
    lockedUntilUtcDesc:
      'Сбор ресурсов, постройка, улучшения, починка и снос (бой героя доступен).',
    buildDurationLabel: (sec) => `⏱ ${sec}с`,
    salvagedStructureBanner: (id, w, s) => `Разобрана площадка P${id} (+${w} дерева, +${s} камня)`,
    weatherLabel: (w) =>
      w === 'rain' ? '🌧️ Дождь' : w === 'fog' ? '☁️ Туман' : '☀️ Ясно',
    weatherModifierShort: (w) =>
      w === 'rain'
        ? '+65% Рост · 82% Обзор'
        : w === 'fog'
        ? '-35% Рост · 65% Обзор'
        : '100% Рост · 100% Обзор',
    weatherTooltip: (w) =>
      w === 'rain'
        ? 'Лесной ливень: восстановление ресурсов +65%, сбор дерева/еды +20%; видимость 82%. (Нажмите для смены погоды)'
        : w === 'fog'
        ? 'Густой туман: восстановление ресурсов -35%, видимость 65%, сбор камня +25%. (Нажмите для смены погоды)'
        : 'Ясная погода: 100% видимость и обычная скорость роста ресурсов. (Нажмите для смены погоды)',
    weatherChangedBanner: (w) =>
      w === 'rain'
        ? '🌧️ Смена погоды: Лесной дождь! Рост ресурсов +65% и сбор дерева/еды +20% (Видимость 82%).'
        : w === 'fog'
        ? '☁️ Смена погоды: Густой туман! Видимость 65% и рост ресурсов -35% (+25% камня).'
        : '☀️ Смена погоды: Ясное небо! Полная видимость и обычный рост ресурсов.',

    translateTaskTitle: (id, fb) => TASK_TITLES.ru[id] ?? fb,
    translatePadLabel: (id, fb) => PAD_LABELS.ru[id] ?? fb,
    translateLanternName: (id, fb) => LANTERN_NAMES.ru[id] ?? fb,
    buildings: BUILDINGS_RU,
    zombies: ZOMBIES_RU,
  },
};
