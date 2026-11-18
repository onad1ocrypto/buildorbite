import React, { useEffect, useRef, useState } from 'react';
import { getLevelForXp, getTimeUntilNextUTCReset } from '../game/dailySystem';
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  TRANSLATIONS,
} from '../game/i18n';
import {
  BUILDING_CATALOG,
  canAfford,
  FENCE_BUILD_COST,
  FENCE_UPGRADE_COST,
  getConstructionDuration,
  getWaveThreatArchetypes,
  HERO_RUE_PORTRAIT_URL,
  ZOMBIE_CATALOG,
} from '../game/rules';
import { BuildingType, HudSnapshot } from '../game/types';
import { BossHealthBar } from './BossHealthBar';

interface HudOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  lang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectPad: (padId: number | null) => void;
  onSelectFence: (fenceId: number | null) => void;
  onBuildNextFence: () => void;
  onBuildOnPad: (type: BuildingType) => void;
  onUpgradeOnPad: (pathId: 'pathA' | 'pathB') => void;
  onRepairPad: () => void;
  onDemolishPad: () => void;
  onTriggerFlare: () => void;
  onStartNightEarly: () => void;
  onCycleWeather?: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenGuide: () => void;
  onToggleDock: () => void;
  onAdjustZoom?: (delta: number) => void;
  onClaimDailyCheckIn?: () => void;
  onResetDemoData?: () => void;
  onExitDemoMode?: () => void;
}

const BUILDING_LIST: BuildingType[] = [
  'palisade',
  'watchtower',
  'spiketrap',
  'campfire',
  'catapult',
  'guardtent',
];

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  muted,
  lang,
  onSelectLanguage,
  onSelectPad,
  onSelectFence,
  onBuildNextFence,
  onBuildOnPad,
  onUpgradeOnPad,
  onRepairPad,
  onDemolishPad,
  onTriggerFlare,
  onStartNightEarly,
  onCycleWeather,
  onToggleMute,
  onTogglePause,
  onOpenGuide,
  onToggleDock,
  onClaimDailyCheckIn,
  onResetDemoData,
  onExitDemoMode,
}) => {
  const [showTasksPopover, setShowTasksPopover] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const tasksMenuRef = useRef<HTMLDivElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (tasksMenuRef.current && !tasksMenuRef.current.contains(target)) {
        setShowTasksPopover(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setShowLangDropdown(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const tr = TRANSLATIONS[lang];
  const currentLangOpt =
    LANGUAGE_OPTIONS.find((o) => o.code === lang) ?? LANGUAGE_OPTIONS[0];

  if (hud.screen === 'title') return null;

  const selectedPad = hud.pads.find((p) => p.id === hud.selectedPadId) ?? null;
  const buildMenuTargetPad =
    selectedPad ?? hud.pads.find((pad) => pad.building === null) ?? hud.pads[0] ?? null;
  const selectedFence =
    hud.fenceSegments.find((f) => f.id === hud.selectedFenceId) ?? null;
  const isNight = hud.phase === 'night';
  const isDailyLocked = Boolean(hud.daily.dailyProgressionLocked);
  const isConstructionLocked = isNight || isDailyLocked;
  const isConstructing =
    hud.heroAnimState === 'construction' && hud.pendingConstruction !== null;
  const constructionPct = hud.pendingConstruction
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (1 -
              hud.pendingConstruction.remainingTime /
                Math.max(0.01, hud.pendingConstruction.totalTime)) *
              100
          )
        )
      )
    : 0;
  const builtFenceCount = hud.fenceSegments.filter((f) => f.level > 0 && f.hp > 0).length;
  const upgradedFenceCount = hud.fenceSegments.filter((f) => f.level === 2 && f.hp > 0).length;
  const canBuildFence =
    !isConstructionLocked && !isConstructing && canAfford(hud.resources, FENCE_BUILD_COST);
  const canUpgradeFence =
    !isConstructionLocked && !isConstructing && canAfford(hud.resources, FENCE_UPGRADE_COST);
  const fortHpPct = Math.max(0, Math.min(100, (hud.fortHp / hud.fortMaxHp) * 100));
  const fortGhostPct = Math.max(fortHpPct, Math.min(100, (hud.fortGhostHp / hud.fortMaxHp) * 100));
  const isCriticalHp = fortHpPct <= 30;
  const waveThreats = getWaveThreatArchetypes(hud.dayNumber);
  const completedTasksCount = hud.daily.tasks.filter(
    (t) => (hud.daily.taskProgress[t.id] ?? 0) >= t.target
  ).length;
  const levelInfo = getLevelForXp(hud.daily.xp);
  const resetCountdown = getTimeUntilNextUTCReset();

  const hasNoBuildings = hud.pads.every((p) => p.building === null);
  const canAffordFirstBuild = BUILDING_LIST.some((bType) =>
    canAfford(hud.resources, BUILDING_CATALOG[bType].cost)
  );
  const showNewPlayerBuildGuide =
    !isConstructionLocked && !isConstructing && hasNoBuildings && canAffordFirstBuild;

  const todayUTC = hud.daily.lastResetDateUTC;
  const checkInClaimedToday = hud.daily.lastCheckInClaimedDateUTC === todayUTC;
  const checkInReady =
    !checkInClaimedToday &&
    (hud.daily.checkInEligibleDateUTC === todayUTC ||
      hud.daily.lastPlayedDateUTC === todayUTC);

  const flareNightLocked = !isNight;
  const flareOnCooldown = isNight && hud.flareCooldown > 0.05;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between px-2 py-1.5 sm:px-3 sm:py-2">
      {/* Blood Moon Night Atmospheric Edge Vignette (Center kept 100% clear so Night mode is bright & readable) */}
      <div
        data-testid="blood-moon-overlay"
        data-active={isNight ? 'true' : 'false'}
        className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${
          isNight ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(185, 28, 28, 0) 62%, rgba(153, 27, 27, 0.16) 100%)',
          boxShadow: 'inset 0 0 70px rgba(220, 38, 38, 0.22)',
        }}
      />

      {/* Daytime Weather Atmospheric Edge Vignette (Rain / Fog only; center 100% clear, no backdrop-filter) */}
      <div
        data-testid="weather-atmosphere-overlay"
        data-weather={hud.phase === 'day' ? hud.weather : 'night'}
        className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${
          hud.phase === 'day' && hud.weather !== 'clear' ? 'opacity-100' : 'opacity-0'
        }`}
        style={
          hud.weather === 'rain'
            ? {
                background:
                  'radial-gradient(circle at 50% 48%, rgba(56, 189, 248, 0) 64%, rgba(30, 58, 138, 0.16) 100%)',
                boxShadow: 'inset 0 0 65px rgba(56, 189, 248, 0.18)',
              }
            : {
                background:
                  'radial-gradient(circle at 50% 48%, rgba(148, 163, 184, 0) 56%, rgba(51, 65, 85, 0.26) 100%)',
                boxShadow: 'inset 0 0 85px rgba(148, 163, 184, 0.24)',
              }
        }
      />

      {/* Critical low-HP peripheral vignette */}
      {isCriticalHp && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* TOP PERIMETER BAR: Single Slim, Uncluttered Row */}
      <div className="w-full flex flex-wrap items-start justify-between gap-1.5">
        {/* Top-Left Compact Pill: Fort HP + Day/Night Phase + In-Game Daily Tasks Menu + Tickets + Score */}
        <div ref={tasksMenuRef} className="relative pointer-events-auto max-w-full">
          <div
            className="flex flex-wrap items-center gap-2 sm:gap-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#334155] shadow-lg"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.76)' }}
          >
            {/* Fort Vitality Bar */}
            <div className="min-w-[96px] sm:min-w-[122px]">
              <div className="flex items-baseline justify-between gap-1 mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.fortHpLabel}
                </span>
                <span className="text-[11px] sm:text-xs font-mono-tabular font-bold text-[#fef3c7]">
                  {Math.round(hud.fortHp)}/{Math.round(hud.fortMaxHp)}
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 rounded bg-[#090d14] border border-[#1e293b] overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-[#f59e0b]/60 transition-all duration-300"
                  style={{ width: `${fortGhostPct}%` }}
                />
                <div
                  className={`relative h-full transition-all duration-150 ${
                    fortHpPct > 50
                      ? 'bg-[#22c55e]'
                      : fortHpPct > 25
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#ef4444]'
                  }`}
                  style={{ width: `${fortHpPct}%` }}
                />
              </div>
            </div>

            <div className="h-5 w-[1px] bg-[#1e293b]" />

            {/* Day / Night Indicator */}
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                {hud.phase === 'day' ? (
                  <>
                    <circle cx="12" cy="12" r="6" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                    <path
                      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <g>
                    <circle cx="12" cy="12" r="7" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="2" fill="#fca5a5" opacity="0.55" />
                    <circle cx="14.5" cy="14" r="1.5" fill="#991b1b" opacity="0.65" />
                  </g>
                )}
              </svg>
              <div className="leading-none">
                <div
                  className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                    isNight ? 'text-[#f87171]' : 'text-[#94a3b8]'
                  }`}
                >
                  {hud.phase === 'day' ? tr.dayBuildLabel : tr.bloodMoonLabel}
                </div>
                <div className="text-xs sm:text-sm font-mono-tabular font-extrabold text-[#fef3c7] mt-0.5">
                  {tr.dayShort(hud.dayNumber, hud.maxDays)}{' '}
                  <span className="text-[#94a3b8] font-normal">·</span>{' '}
                  {hud.phase === 'day' ? (
                    <span className="text-[#fbbf24]">{Math.ceil(hud.phaseTimeRemaining)}s</span>
                  ) : (
                    <span className="text-[#f87171]">
                      {tr.zombiesLeftShort(hud.zombiesRemaining)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Daytime Dynamic Weather Indicator & Cycle Button */}
            {hud.phase === 'day' && (
              <>
                <div className="h-5 w-[1px] bg-[#1e293b]" />
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-weather-badge"
                  data-weather={hud.weather}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onCycleWeather?.();
                  }}
                  title={tr.weatherTooltip(hud.weather)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-left cursor-pointer transition-colors ${
                    hud.weather === 'rain'
                      ? 'bg-[#0c233b] hover:bg-[#123152] border-[#38bdf8]/70 text-[#bae6fd]'
                      : hud.weather === 'fog'
                      ? 'bg-[#19252c] hover:bg-[#22323b] border-[#94a3b8]/70 text-[#e2e8f0]'
                      : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#fef3c7]'
                  }`}
                >
                  <div className="leading-none">
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold">
                      <span>{tr.weatherLabel(hud.weather)}</span>
                      <span className="text-[9px] font-mono-tabular opacity-80">
                        {Math.ceil(hud.weatherTimeRemaining)}s
                      </span>
                    </div>
                    <div
                      data-testid="hud-weather-modifier"
                      className={`text-[8.5px] font-mono-tabular font-semibold mt-0.5 ${
                        hud.weather === 'rain'
                          ? 'text-[#38bdf8]'
                          : hud.weather === 'fog'
                          ? 'text-[#cbd5e1]'
                          : 'text-[#fbbf24]'
                      }`}
                    >
                      {tr.weatherModifierShort(hud.weather)}
                    </div>
                  </div>
                </button>
              </>
            )}

            <div className="h-5 w-[1px] bg-[#1e293b]" />

            {/* Clickable In-Game Daily Tasks Menu Button */}
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-daily-tasks"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowTasksPopover((v) => !v);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                showTasksPopover
                  ? 'bg-[#f59e0b] border-[#fef08a] text-[#090d16] font-bold'
                  : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#fef3c7]'
              }`}
              title={tr.dailyTasksChecklistTitle}
            >
              <span>📋 {tr.tasksLabel}</span>
              <span
                className={`font-mono-tabular font-extrabold ${
                  showTasksPopover ? 'text-[#090d16]' : 'text-[#4ade80]'
                }`}
                data-testid="hud-tasks"
              >
                {completedTasksCount}/{hud.daily.tasks.length}
              </span>
              <span className="text-[9px] opacity-80">{showTasksPopover ? '▴' : '▾'}</span>
            </button>

            {/* Read-Only Daily Ticket Counter (Strict 3/3 UTC Cap) */}
            <div
              title={tr.ticketTooltip}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg"
            >
              <span className="text-[9px] font-bold uppercase text-[#94a3b8]">
                {tr.ticketLabel}
              </span>
              <span
                className="text-xs font-mono-tabular font-extrabold text-[#fbbf24]"
                data-testid="hud-tickets"
              >
                {hud.daily.tickets}/{hud.daily.maxDailyTickets}
              </span>
            </div>

            {/* Compact Fence & Score */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono-tabular">
              <span className="text-[#94a3b8] text-[9px] uppercase font-bold">
                {tr.fenceLabel}:
              </span>
              <span className="font-bold text-[#4ade80]" data-testid="hud-fence-count">
                {builtFenceCount}/{hud.fenceSegments.length}
                {upgradedFenceCount > 0 ? `(${upgradedFenceCount}★)` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-mono-tabular">
              <span className="text-[#94a3b8] text-[9px] uppercase font-bold hidden sm:inline">
                {tr.scoreLabel}:
              </span>
              <span className="font-extrabold text-[#e2dacb]" data-testid="hud-score">
                {Math.round(hud.score)}
              </span>
            </div>

            {isDailyLocked && (
              <span
                data-testid="hud-daily-locked-badge"
                className="px-2 py-0.5 rounded-md bg-[#14532d] border border-[#4ade80] text-[9px] font-mono-tabular font-bold text-[#dcfce7] uppercase tracking-wider"
              >
                🔒 {tr.dailyLockedBadgeShort}
              </span>
            )}
          </div>

          {/* IN-GAME DAILY TASKS & PROGRESSION POPOVER (Appears when user clicks 📋 Tasks) */}
          {showTasksPopover && (
            <div
              data-testid="hud-daily-tasks-panel"
              className="absolute left-0 top-full mt-1.5 z-40 w-[335px] sm:w-[385px] max-h-[82vh] overflow-y-auto rounded-xl border border-[#334155] p-3.5 shadow-2xl"
              style={{ backgroundColor: 'rgba(13, 19, 28, 0.86)' }}
            >
              {/* Header: Daily Ranger Board + Close */}
              <div className="flex items-start justify-between gap-2 border-b border-[#1e293b] pb-2 mb-2.5">
                <div>
                  <div className="text-xs font-display font-bold text-[#fef3c7]">
                    {tr.dailyBoardTitle(hud.daily.lastResetDateUTC)}
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">
                    {tr.dailyResetSubtitle(resetCountdown)}
                  </div>
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowTasksPopover(false)}
                  className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#334155] text-[10px] font-semibold text-[#fef3c7] cursor-pointer"
                >
                  {tr.closeLabel}
                </button>
              </div>

              {/* Daily Progression Lock Banner if 3/3 completed */}
              {isDailyLocked && (
                <div
                  data-testid="popover-daily-lock-banner"
                  className="p-2.5 rounded-lg bg-[#11221c] border border-[#22c55e]/60 text-[11px] text-[#fef3c7] mb-2.5"
                >
                  <div className="font-bold text-[#4ade80] mb-0.5">
                    🔒 {tr.dailyProgressionCompleteTitle}
                  </div>
                  <div className="text-[10px] text-[#cbd5e1]">
                    {tr.dailyProgressionCompleteDesc}
                  </div>
                </div>
              )}

              {/* 3 Daily Tasks with Progress Bar & Reward */}
              <div className="space-y-2 mb-2.5">
                {hud.daily.tasks.map((task) => {
                  const prog = Math.min(task.target, hud.daily.taskProgress[task.id] ?? 0);
                  const done = prog >= task.target;
                  const pct = Math.min(100, Math.round((prog / Math.max(1, task.target)) * 100));
                  const locTitle = tr.translateTaskTitle(task.id, task.title);
                  return (
                    <div
                      key={task.id}
                      className={`p-2 rounded-lg border ${
                        done
                          ? 'bg-[#11221c] border-[#22c55e]/50'
                          : 'bg-[#0b1016] border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <span className={done ? 'text-[#4ade80] font-semibold' : 'text-[#fef3c7]'}>
                          {done ? '✓ ' : ''}
                          {locTitle}
                        </span>
                        <span
                          className={`font-mono-tabular font-bold shrink-0 ${
                            done ? 'text-[#4ade80]' : 'text-[#fbbf24]'
                          }`}
                        >
                          {Math.round(prog)}/{task.target}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded bg-[#131b26] overflow-hidden mb-1">
                        <div
                          className={`h-full transition-all duration-200 ${
                            done ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono-tabular text-[#94a3b8]">
                        {tr.rewardLabel(task.rewardCoins, task.rewardXp)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All 3 Daily Tasks Bonus */}
              <div className="px-2.5 py-1.5 rounded-lg bg-[#161f2c] border border-[#334155] text-[11px] flex items-center justify-between mb-2.5">
                <span className="text-[#e2dacb]">
                  <strong>{tr.allTasksBonusTitle}</strong> {tr.allTasksBonusDesc}
                </span>
                <span className="font-mono-tabular font-bold text-[#fbbf24] ml-2 shrink-0">
                  {hud.daily.allTasksBonusClaimed ? tr.claimedLabel : `${completedTasksCount}/3`}
                </span>
              </div>

              {/* Daily Check-In Status / Claim */}
              <div
                data-testid="popover-daily-checkin"
                className="p-2 rounded-lg bg-[#0b1016] border border-[#1e293b] text-[11px] mb-2.5"
              >
                <div className="font-bold text-[#fbbf24] mb-1">🎁 {tr.dailyCheckInTitle}</div>
                {checkInClaimedToday ? (
                  <div className="text-[#4ade80] font-semibold text-[10.5px]">
                    {tr.dailyCheckInClaimedLabel}
                  </div>
                ) : checkInReady ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="hud-btn-claim-checkin"
                    onClick={() => onClaimDailyCheckIn?.()}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-xs cursor-pointer"
                  >
                    {tr.dailyCheckInClaimBtn}
                  </button>
                ) : (
                  <div className="text-[10px] text-[#94a3b8]">{tr.dailyCheckInPlayFirstDesc}</div>
                )}
              </div>

              {/* Optional Finite Bonus Patrols (Small XP) */}
              {hud.daily.bonusTasks && hud.daily.bonusTasks.length > 0 && (
                <div className="p-2 rounded-lg bg-[#0b1016] border border-[#1e293b] text-[11px] mb-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] mb-1">
                    ⭐ {tr.bonusTasksTitle}
                  </div>
                  <div className="space-y-1">
                    {hud.daily.bonusTasks.map((bt) => {
                      const bProg = Math.min(bt.target, hud.daily.bonusTaskProgress?.[bt.id] ?? 0);
                      const bDone = bProg >= bt.target;
                      const bTitle = tr.translateTaskTitle(bt.id, bt.title);
                      return (
                        <div key={bt.id} className="flex items-center justify-between text-[10.5px]">
                          <span className={bDone ? 'text-[#4ade80] font-semibold' : 'text-[#cbd5e1]'}>
                            {bDone ? '✓ ' : '· '}
                            {bTitle} (+{bt.rewardXp} XP)
                          </span>
                          <span className="font-mono-tabular text-[#94a3b8]">
                            {Math.round(bProg)}/{bt.target}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ranger Level & Streak Row */}
              <div className="p-2 rounded-lg bg-[#0b1016] border border-[#1e293b] text-[11px] mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#fef3c7]">
                    {tr.levelRangerLabel(levelInfo.level, hud.daily.xp)}
                  </span>
                  <span className="font-mono-tabular text-[#4ade80]">
                    {tr.activeStreakLabel} {hud.daily.streak}d
                  </span>
                </div>
                <div className="w-full h-1.5 rounded bg-[#131b26] overflow-hidden">
                  <div
                    className="h-full bg-[#38bdf8]"
                    style={{ width: `${levelInfo.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Tonight's Wave Threats (Tucked cleanly inside the popover) */}
              <div className="pt-2 border-t border-[#1e293b] mb-2" data-testid="hud-wave-threats">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                  {tr.nightThreatsLabel(hud.dayNumber)}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {waveThreats.map((arch) => {
                    const spec = ZOMBIE_CATALOG[arch];
                    const zLoc = tr.zombies[arch];
                    return (
                      <button
                        key={arch}
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                          setShowTasksPopover(false);
                          onOpenGuide();
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[10px] font-mono-tabular font-semibold cursor-pointer flex items-center gap-1"
                        style={{ color: spec.badgeColor }}
                      >
                        <span>{zLoc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Non-rewarded Community Invite Notice */}
              <div className="pt-2 border-t border-[#1e293b] text-[10px] text-[#94a3b8]">
                <strong className="text-[#cbd5e1]">🏕️ {tr.communityInviteTitle}:</strong>{' '}
                {tr.communityInviteDesc}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Compact Pill: Wood, Stone, Food + Start Night Early + Click-to-Open Language Dropdown + Icons */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          {/* Resource Counters */}
          <div
            className="flex items-center gap-2 sm:gap-3 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#334155] shadow-lg"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.76)' }}
          >
            {/* Wood */}
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                <rect x="3" y="7" width="18" height="10" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
                <circle cx="18" cy="12" r="3" fill="#fde68a" />
              </svg>
              <span className="text-[9px] font-bold uppercase text-[#94a3b8] hidden md:inline">
                {tr.woodLabel}
              </span>
              <span
                className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7]"
                data-testid="hud-wood"
              >
                {Math.round(hud.resources.wood)}
              </span>
            </div>

            {/* Stone */}
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                <polygon
                  points="12,3 21,9 18,20 6,20 3,9"
                  fill="#64748b"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                <polygon points="12,5 17,10 12,14 8,10" fill="#94a3b8" />
              </svg>
              <span className="text-[9px] font-bold uppercase text-[#94a3b8] hidden md:inline">
                {tr.stoneLabel}
              </span>
              <span
                className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7]"
                data-testid="hud-stone"
              >
                {Math.round(hud.resources.stone)}
              </span>
            </div>

            {/* Food */}
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0">
                <circle cx="9" cy="14" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
                <circle cx="15" cy="15" r="4.5" fill="#ef4444" stroke="#881337" strokeWidth="1.5" />
                <path d="M12 5c2 0 4 2 4 4-2 0-4-1-4-4z" fill="#22c55e" />
              </svg>
              <span className="text-[9px] font-bold uppercase text-[#94a3b8] hidden md:inline">
                {tr.foodLabel}
              </span>
              <span
                className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7]"
                data-testid="hud-food"
              >
                {Math.round(hud.resources.food)}
              </span>
            </div>
          </div>

          {/* Start Night Early CTA during Day */}
          {hud.phase === 'day' && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onStartNightEarly();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-md"
            >
              {tr.startNightBtn}
            </button>
          )}

          {/* Click-to-Open Language Dropdown Menu in HUD */}
          <div
            ref={langMenuRef}
            className="relative"
            data-testid="hud-language-selector"
          >
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-hud-language-menu"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowLangDropdown((v) => !v);
              }}
              className="h-8 px-2.5 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center gap-1 text-xs font-mono-tabular font-bold text-[#fef3c7] cursor-pointer transition-colors shadow-md"
              title="Change Language"
            >
              <span>🌐</span>
              <span className="text-[#fbbf24]">{currentLangOpt.shortLabel}</span>
              <span className="text-[9px] text-[#94a3b8]">{showLangDropdown ? '▴' : '▾'}</span>
            </button>

            {showLangDropdown && (
              <div
                data-testid="hud-language-dropdown"
                className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl bg-[#0d131c] border border-[#334155] p-1.5 shadow-2xl flex flex-col gap-1"
              >
                {LANGUAGE_OPTIONS.map((opt) => {
                  const active = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      tabIndex={-1}
                      data-testid={`hud-lang-btn-${opt.code}`}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectLanguage(opt.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#f59e0b] text-[#090d16] font-bold'
                          : 'text-[#cbd5e1] hover:bg-[#1e293b]'
                      }`}
                    >
                      <span>{opt.nativeName}</span>
                      <span className="font-mono-tabular text-[10px] opacity-85">
                        {opt.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Utility Buttons: Guide [?], Mute [M], Pause [P] */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-label="How to Run and Controls"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className="w-8 h-8 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors shadow-md"
            >
              <span className="font-display font-bold text-xs">?</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors shadow-md"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              className="w-8 h-8 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* SLIM TOP-CENTER NOTIFICATION / DEMO BANNER / BOSS BARON BLIGHT BANNER */}
      <div className="w-full flex flex-col items-center gap-1 pointer-events-none mt-1 mb-auto">
        {hud.isDevTestMode && (
          <div
            data-testid="dev-test-active-banner"
            className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-1 rounded-lg bg-[#581c87]/95 border border-[#c084fc] text-[10px] font-bold tracking-wide text-white shadow-lg"
            title="Demo / Test Mode: Isolated sandbox — no tickets spent, production save untouched."
          >
            <span>🧪 DEMO / TEST MODE · NO TICKETS SPENT · PRODUCTION SAVE ISOLATED</span>
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-reset-demo-data"
              onClick={(e) => {
                e.currentTarget.blur();
                onResetDemoData?.();
              }}
              className="px-1.5 py-0.5 rounded bg-[#3b0764] hover:bg-[#4c1d95] border border-[#d8b4fe]/60 text-[9px] font-semibold cursor-pointer"
            >
              Reset Demo Data
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-exit-demo-mode"
              onClick={(e) => {
                e.currentTarget.blur();
                onExitDemoMode?.();
              }}
              className="px-1.5 py-0.5 rounded bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#cbd5e1]/50 text-[9px] font-semibold cursor-pointer"
            >
              Exit Demo
            </button>
          </div>
        )}
        <BossHealthBar
          bossActive={hud.bossActive}
          bossName={hud.bossName}
          bossHp={hud.bossHp}
          bossMaxHp={hud.bossMaxHp}
          bossSpeech={hud.bossSpeech}
          bossTag={tr.bossTag}
          portraitUrl={ZOMBIE_CATALOG.baron.portraitUrl}
        />

        {isConstructing && hud.pendingConstruction && (
          <div
            data-testid="hud-construction-state"
            className="mb-1 px-2.5 py-0.5 rounded-lg border border-[#fbbf24] text-[11px] font-mono-tabular font-bold text-[#fef3c7] flex items-center gap-2 shadow-md"
            style={{ backgroundColor: 'rgba(20, 83, 45, 0.92)' }}
          >
            <span>
              {tr.constructingBanner(hud.pendingConstruction.label, constructionPct)}
            </span>
            <div className="w-16 h-1.5 rounded bg-[#090d16] border border-[#4ade80] overflow-hidden">
              <div
                className="h-full bg-[#fbbf24] transition-all duration-75"
                style={{ width: `${constructionPct}%` }}
              />
            </div>
          </div>
        )}

        {!isConstructing && hud.statusBanner && !selectedPad && (
          <div
            data-testid="hud-status-banner"
            className="px-2.5 py-0.5 rounded-lg border border-[#334155]/80 text-[11px] font-medium text-[#e2dacb] text-center max-w-md"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.82)' }}
          >
            {hud.statusBanner}
          </div>
        )}
      </div>

      {/* COMPACT FLOATING BOTTOM DOCK: Leaves maximum 3D viewport visibility */}
      <div className="w-full flex flex-col items-center pointer-events-none">
        {hud.dockCollapsed ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDock();
            }}
            className="pointer-events-auto px-3 py-1 rounded-xl bg-[#131b26]/90 hover:bg-[#1e293b] border border-[#334155] text-xs font-medium text-[#cbd5e1] cursor-pointer whitespace-nowrap shadow-lg"
          >
            {tr.showBuildDockBtn}
          </button>
        ) : (
          <div className="pointer-events-auto flex flex-col items-center w-auto max-w-[96vw] gap-1.5">
            {/* 1. CONTEXTUAL POPOVER WHEN A BUILD PAD IS SELECTED */}
            {selectedPad && (
              <div
                data-testid="pad-build-choice-menu"
                className="w-full max-w-[760px] rounded-xl border-2 border-[#f59e0b] px-3 py-2 shadow-2xl"
                style={{ backgroundColor: 'rgba(13, 19, 28, 0.82)' }}
              >
                {/* Header: Selected Pad Title + Close Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#f59e0b] text-[#090d16] font-mono-tabular font-extrabold text-[11px]">
                      P{selectedPad.id}
                    </span>
                    <span className="text-xs font-display font-bold text-[#fef3c7]">
                      {(() => {
                        const padLabelLoc = tr.translatePadLabel(selectedPad.id, selectedPad.label);
                        if (selectedPad.building === null) {
                          if (isDailyLocked)
                            return `${padLabelLoc} — 🔒 ${tr.dailyProgressionCompleteTitle}`;
                          return isNight
                            ? tr.padLockedNightHeader(padLabelLoc)
                            : tr.padChooseBuildHeader(padLabelLoc);
                        }
                        const bLoc =
                          tr.buildings[selectedPad.building.type]?.name ??
                          BUILDING_CATALOG[selectedPad.building.type].name;
                        return `${padLabelLoc} — ${bLoc}`;
                      })()}
                    </span>
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid="btn-close-pad-menu"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSelectPad(null);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-[11px] font-semibold text-[#fef3c7] cursor-pointer"
                  >
                    {tr.closeLabel}
                  </button>
                </div>

                {selectedPad.building === null ? (
                  /* 6 Compact Building Choices for the Selected Empty Pad */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                    {BUILDING_LIST.map((bType) => {
                      const spec = BUILDING_CATALOG[bType];
                      const bLoc = tr.buildings[bType];
                      const affordable =
                        !isConstructionLocked &&
                        !isConstructing &&
                        canAfford(hud.resources, spec.cost);
                      const expectedSec = getConstructionDuration({
                        action: 'build_pad',
                        buildingType: bType,
                        toolTier: hud.daily.toolTier,
                      }).toFixed(2);
                      const highlightNewPlayer = showNewPlayerBuildGuide && affordable;
                      return (
                        <button
                          key={bType}
                          type="button"
                          tabIndex={-1}
                          aria-disabled={!affordable}
                          data-night-locked={isConstructionLocked ? 'true' : 'false'}
                          data-new-player-highlight={highlightNewPlayer ? 'true' : 'false'}
                          data-testid={`btn-build-${bType}`}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            onBuildOnPad(bType);
                          }}
                          className={`relative p-1.5 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[56px] ${
                            highlightNewPlayer
                              ? 'bg-[#1e293b] hover:bg-[#263548] border-2 border-[#fbbf24] shadow-[0_0_14px_rgba(251,191,36,0.45)] cursor-pointer'
                              : affordable
                              ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#475569] hover:border-[#f59e0b] cursor-pointer shadow-sm'
                              : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                          }`}
                        >
                          {highlightNewPlayer && bType === 'palisade' && (
                            <span
                              data-testid="new-player-build-indicator"
                              className="absolute -top-2 right-1 px-1.5 py-0.5 rounded bg-[#f59e0b] text-[#090d16] text-[8.5px] font-extrabold uppercase tracking-wider shadow"
                            >
                              ✨ BUILD
                            </span>
                          )}
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-[#fef3c7]">
                              <span className="truncate">{bLoc.name}</span>
                              <span className="font-mono-tabular text-[9px] text-[#f59e0b] shrink-0">
                                [{spec.keybind}]
                              </span>
                            </div>
                            <div className="text-[9.5px] text-[#94a3b8] truncate">
                              {bLoc.shortRole}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[9.5px] font-mono-tabular font-bold text-[#fbbf24] mt-0.5">
                            <span>
                              {isConstructionLocked
                                ? isNight
                                  ? tr.nightLockedShort
                                  : `🔒 ${tr.lockedShort}`
                                : `${spec.cost.wood}W·${spec.cost.stone}S${
                                    spec.cost.food > 0 ? `·${spec.cost.food}F` : ''
                                  }`}
                            </span>
                            {!isConstructionLocked && (
                              <span className="text-[8.5px] text-[#94a3b8] whitespace-nowrap shrink-0">
                                {tr.buildDurationLabel(expectedSec)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Built Pad Selected: Upgrade Path A / Path B + Repair + Salvage */
                  (() => {
                    const bld = selectedPad.building!;
                    const spec = BUILDING_CATALOG[bld.type];
                    const bLoc = tr.buildings[bld.type];
                    const pathA = spec.paths.pathA;
                    const pathB = spec.paths.pathB;
                    const canPathA =
                      !isConstructionLocked &&
                      bld.upgradePath === null &&
                      canAfford(hud.resources, pathA.cost);
                    const canPathB =
                      !isConstructionLocked &&
                      bld.upgradePath === null &&
                      canAfford(hud.resources, pathB.cost);
                    const upgDurationSec = getConstructionDuration({
                      action: 'upgrade_pad',
                      buildingType: bld.type,
                      toolTier: hud.daily.toolTier,
                    }).toFixed(2);
                    const repairDurationSec = getConstructionDuration({
                      action: 'repair_pad',
                      buildingType: bld.type,
                      toolTier: hud.daily.toolTier,
                    }).toFixed(2);
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono-tabular font-bold text-[#4ade80]">
                              HP {Math.round(bld.hp)}/{Math.round(bld.maxHp)}
                            </span>
                            {bld.upgradePath && (
                              <span className="text-[#fbbf24] font-semibold">
                                · {tr.masteryActiveLabel}{' '}
                                {bld.upgradePath === 'pathA'
                                  ? bLoc.paths.pathA.name
                                  : bLoc.paths.pathB.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={isConstructionLocked}
                              data-night-locked={isConstructionLocked ? 'true' : 'false'}
                              data-testid="btn-repair-pad"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onRepairPad();
                              }}
                              className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono-tabular font-semibold transition-colors ${
                                isConstructionLocked
                                  ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                  : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#4ade80] cursor-pointer'
                              }`}
                            >
                              {tr.repairBtn(isConstructionLocked)}{' '}
                              {!isConstructionLocked && (
                                <span className="text-[9px] text-[#94a3b8]">
                                  ({tr.buildDurationLabel(repairDurationSec)})
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={isConstructionLocked}
                              data-night-locked={isConstructionLocked ? 'true' : 'false'}
                              data-testid="btn-salvage-pad"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onDemolishPad();
                              }}
                              className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                                isConstructionLocked
                                  ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                  : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#f87171] cursor-pointer'
                              }`}
                            >
                              {tr.salvageBtn(isConstructionLocked)}
                            </button>
                          </div>
                        </div>

                        {bld.upgradePath === null ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={!canPathA}
                              data-night-locked={isConstructionLocked ? 'true' : 'false'}
                              data-testid="btn-upgrade-pathA"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onUpgradeOnPad('pathA');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                                canPathA
                                  ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#f59e0b] cursor-pointer'
                                  : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                <span>{tr.upgradePathAHeader(bLoc.paths.pathA.name)}</span>
                                {!isConstructionLocked && (
                                  <span className="text-[9.5px] font-mono-tabular text-[#94a3b8]">
                                    {tr.buildDurationLabel(upgDurationSec)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-[#cbd5e1] truncate">
                                {bLoc.paths.pathA.tagline}
                              </div>
                              <div className="text-[10px] font-mono-tabular font-bold text-[#fbbf24]">
                                {isConstructionLocked
                                  ? isNight
                                    ? tr.nightLockedShort
                                    : `🔒 ${tr.lockedShort}`
                                  : `${pathA.cost.wood}W · ${pathA.cost.stone}S · ${pathA.cost.food}F`}
                              </div>
                            </button>

                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={!canPathB}
                              data-night-locked={isConstructionLocked ? 'true' : 'false'}
                              data-testid="btn-upgrade-pathB"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onUpgradeOnPad('pathB');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                                canPathB
                                  ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#38bdf8] cursor-pointer'
                                  : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                <span>{tr.upgradePathBHeader(bLoc.paths.pathB.name)}</span>
                                {!isConstructionLocked && (
                                  <span className="text-[9.5px] font-mono-tabular text-[#94a3b8]">
                                    {tr.buildDurationLabel(upgDurationSec)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-[#cbd5e1] truncate">
                                {bLoc.paths.pathB.tagline}
                              </div>
                              <div className="text-[10px] font-mono-tabular font-bold text-[#38bdf8]">
                                {isConstructionLocked
                                  ? isNight
                                    ? tr.nightLockedShort
                                    : `🔒 ${tr.lockedShort}`
                                  : `${pathB.cost.wood}W · ${pathB.cost.stone}S · ${pathB.cost.food}F`}
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-lg bg-[#0b1016] border border-[#1e293b] text-xs text-[#cbd5e1]">
                            {tr.masteryActiveLabel}{' '}
                            <strong className="text-[#fbbf24]">
                              {bld.upgradePath === 'pathA'
                                ? bLoc.paths.pathA.name
                                : bLoc.paths.pathB.name}
                            </strong>{' '}
                            —{' '}
                            {bld.upgradePath === 'pathA'
                              ? bLoc.paths.pathA.tagline
                              : bLoc.paths.pathB.tagline}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* NEW-PLAYER BUILD INDICATOR TOOLTIP (Guides players when they can afford a building and have 0 placed) */}
            {showNewPlayerBuildGuide && !selectedPad && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="new-player-build-tooltip"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectPad(1);
                }}
                className="px-3 py-1 rounded-full bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] border-2 border-[#fef08a] text-[11px] font-display font-extrabold tracking-wide shadow-[0_0_18px_rgba(245,158,11,0.55)] cursor-pointer flex items-center gap-1.5 animate-bounce"
              >
                <span>{tr.newPlayerBuildHint}</span>
                <span className="text-xs">▾</span>
              </button>
            )}

            {/* 2. ULTRA-COMPACT FLOATING BOTTOM PILL */}
            <div
              className="w-fit max-w-full rounded-xl border border-[#334155] px-2.5 py-1 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
              style={{ backgroundColor: 'rgba(13, 19, 28, 0.78)' }}
            >
              {/* Lantern Flare (Night) */}
              <button
                type="button"
                tabIndex={-1}
                disabled={flareNightLocked || flareOnCooldown}
                aria-disabled={flareNightLocked || flareOnCooldown}
                data-night-locked={flareNightLocked ? 'true' : 'false'}
                data-testid="btn-lantern-flare"
                title={
                  flareNightLocked ? tr.flareTooltipNightOnly : tr.flareTooltipReady
                }
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerFlare();
                }}
                className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono-tabular font-bold text-[11px] transition-colors whitespace-nowrap border ${
                  flareNightLocked
                    ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                    : flareOnCooldown
                    ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8] cursor-not-allowed'
                    : 'bg-[#ea580c] hover:bg-[#f97316] border-[#fbbf24] text-[#fef3c7] cursor-pointer shadow-md'
                }`}
              >
                <img
                  src={HERO_RUE_PORTRAIT_URL}
                  alt="Rue"
                  className="w-4 h-4 rounded object-cover border border-[#090d16]/40 shrink-0"
                />
                <span>
                  {flareNightLocked
                    ? tr.flareNightLockedBtn
                    : flareOnCooldown
                    ? tr.flareCooldownBtn(hud.flareCooldown.toFixed(1))
                    : tr.flareReadyBtn}
                </span>
              </button>

              {/* Outer Fence [F] */}
              <button
                type="button"
                tabIndex={-1}
                aria-disabled={
                  isConstructionLocked ||
                  isConstructing ||
                  (builtFenceCount < hud.fenceSegments.length ? !canBuildFence : !canUpgradeFence)
                }
                data-night-locked={isConstructionLocked ? 'true' : 'false'}
                data-constructing={isConstructing ? 'true' : 'false'}
                data-testid="btn-build-fence"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onBuildNextFence();
                }}
                className={`shrink-0 px-2 py-1 rounded-lg border text-left font-mono-tabular transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isConstructionLocked
                    ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                    : isConstructing
                    ? 'bg-[#78350f] border-[#fbbf24] text-[#fef3c7] cursor-wait'
                    : builtFenceCount < hud.fenceSegments.length
                    ? canBuildFence
                      ? 'bg-[#14532d] hover:bg-[#166534] border-[#4ade80] text-[#fef3c7] cursor-pointer'
                      : 'bg-[#131b26] border-[#334155] text-[#94a3b8] cursor-pointer'
                    : canUpgradeFence
                    ? 'bg-[#1e3a8a] hover:bg-[#1d4ed8] border-[#38bdf8] text-[#fef3c7] cursor-pointer'
                    : 'bg-[#131b26] border-[#334155] text-[#94a3b8] cursor-pointer'
                }`}
              >
                <span className="text-[11px] font-bold">
                  {isConstructionLocked
                    ? tr.fenceNightLockedBtn(builtFenceCount, hud.fenceSegments.length)
                    : isConstructing
                    ? `🔨 ${constructionPct}%`
                    : selectedFence
                    ? tr.fenceSelectedBtn(selectedFence.label.replace(' Fence', ''))
                    : builtFenceCount < hud.fenceSegments.length
                    ? tr.fenceBuildBtn(builtFenceCount, hud.fenceSegments.length)
                    : tr.fenceUpgradeBtn}
                </span>
                {!isConstructionLocked && (
                  <span className="text-[9.5px] text-[#fbbf24] hidden sm:inline">
                    {builtFenceCount < hud.fenceSegments.length ? '15W·5S' : '20W·15S'}
                  </span>
                )}
              </button>

              <div className="h-4 w-[1px] bg-[#1e293b] hidden sm:block" />

              {/* Always-visible shortcut to the contextual build/upgrade menu */}
              <button
                type="button"
                tabIndex={-1}
                data-testid="btn-open-build-menu"
                aria-label={buildMenuTargetPad?.building ? 'Open upgrade menu' : 'Open build menu'}
                title="Open the build or upgrade menu for a fort pad"
                disabled={!buildMenuTargetPad}
                onClick={(e) => {
                  e.currentTarget.blur();
                  if (buildMenuTargetPad) onSelectPad(buildMenuTargetPad.id);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg border border-[#f59e0b] bg-[#78350f] hover:bg-[#92400e] text-[#fef3c7] text-[10px] font-extrabold tracking-wide cursor-pointer whitespace-nowrap shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buildMenuTargetPad?.building ? 'UPGRADE' : 'BUILD'}
              </button>

              {/* Compact Build Pads (P1-P8) Strip */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                {hud.pads.map((p) => {
                  const isSelected = p.id === hud.selectedPadId;
                  const hasBld = p.building !== null;
                  const padLabelLoc = tr.translatePadLabel(p.id, p.label);
                  const bldNameLoc = hasBld
                    ? (tr.buildings[p.building!.type]?.name ??
                      BUILDING_CATALOG[p.building!.type].name)
                    : '';
                  const highlightPad1 = showNewPlayerBuildGuide && !selectedPad && p.id === 1;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      tabIndex={-1}
                      data-testid={`btn-select-pad-${p.id}`}
                      data-new-player-highlight={highlightPad1 ? 'true' : 'false'}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectPad(isSelected ? null : p.id);
                      }}
                      title={
                        hasBld
                          ? `Pad #${p.id}: ${bldNameLoc}`
                          : highlightPad1
                          ? `${tr.newPlayerBuildHint} (Pad #${p.id}: ${padLabelLoc})`
                          : `Pad #${p.id} (${padLabelLoc})`
                      }
                      className={`px-1.5 py-1 rounded-lg border text-[10.5px] font-mono-tabular font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-[#f59e0b] border-[#fef08a] text-[#090d16] shadow-md'
                          : highlightPad1
                          ? 'bg-[#f59e0b]/25 border-2 border-[#fbbf24] text-[#fef08a] shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                          : hasBld
                          ? 'bg-[#14532d]/85 border-[#4ade80] text-[#86efac] hover:bg-[#166534]'
                          : 'bg-[#161f2c] border-[#334155] text-[#fef3c7] hover:border-[#f59e0b]'
                      }`}
                    >
                      {highlightPad1 ? '✨P1' : `P${p.id}`}
                      {hasBld ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Collapse Dock [H] */}
              <button
                type="button"
                tabIndex={-1}
                title={tr.hideDockTooltip}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleDock();
                }}
                className="shrink-0 px-2 py-1 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[10px] font-mono-tabular text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer whitespace-nowrap"
              >
                ▾
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
