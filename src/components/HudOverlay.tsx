import React, { useState } from 'react';
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
  getWaveThreatArchetypes,
  HERO_RUE_PORTRAIT_URL,
  ZOMBIE_CATALOG,
} from '../game/rules';
import { BuildingType, HudSnapshot } from '../game/types';

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
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenGuide: () => void;
  onToggleDock: () => void;
  onAdjustZoom?: (delta: number) => void;
  onRefillTicketWithCoins?: () => void;
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
  onToggleMute,
  onTogglePause,
  onOpenGuide,
  onToggleDock,
  onRefillTicketWithCoins,
}) => {
  const [showTasksPopover, setShowTasksPopover] = useState(false);
  const tr = TRANSLATIONS[lang];

  if (hud.screen === 'title') return null;

  const selectedPad = hud.pads.find((p) => p.id === hud.selectedPadId) ?? null;
  const selectedFence =
    hud.fenceSegments.find((f) => f.id === hud.selectedFenceId) ?? null;
  const isNight = hud.phase === 'night';
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
    !isNight && !isConstructing && canAfford(hud.resources, FENCE_BUILD_COST);
  const canUpgradeFence =
    !isNight && !isConstructing && canAfford(hud.resources, FENCE_UPGRADE_COST);
  const fortHpPct = Math.max(0, Math.min(100, (hud.fortHp / hud.fortMaxHp) * 100));
  const fortGhostPct = Math.max(fortHpPct, Math.min(100, (hud.fortGhostHp / hud.fortMaxHp) * 100));
  const isCriticalHp = fortHpPct <= 30;
  const waveThreats = getWaveThreatArchetypes(hud.dayNumber);
  const completedTasksCount = hud.daily.tasks.filter(
    (t) => (hud.daily.taskProgress[t.id] ?? 0) >= t.target
  ).length;

  const flareNightLocked = !isNight;
  const flareOnCooldown = isNight && hud.flareCooldown > 0.05;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between px-2 py-2 sm:px-4 sm:py-3">
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

      {/* Critical low-HP peripheral vignette */}
      {isCriticalHp && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* TOP PERIMETER BAR: Clean & Responsive on PC and Mobile */}
      <div className="w-full flex flex-wrap items-start justify-between gap-1.5 sm:gap-2.5">
        {/* Top-Left Cluster: Fort HP + Day/Night Phase + Tickets + Clickable Tasks */}
        <div className="relative pointer-events-auto max-w-full">
          <div
            className="flex flex-wrap items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-[#334155]"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.92)' }}
          >
            {/* Fort Vitality Socket & Bar */}
            <div className="min-w-[112px] sm:min-w-[144px]">
              <div className="flex items-baseline justify-between gap-1.5 mb-0.5 sm:mb-1">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.fortHp}
                </span>
                <span className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7] hud-stroke">
                  {Math.round(hud.fortHp)}/{Math.round(hud.fortMaxHp)}
                </span>
              </div>
              <div className="w-full h-2 sm:h-2.5 rounded bg-[#090d14] border border-[#1e293b] overflow-hidden relative">
                <div
                  className="position absolute inset-y-0 left-0 bg-[#f59e0b]/60 transition-all duration-300"
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

            <div className="h-6 w-[1px] bg-[#1e293b]" />

            {/* Day / Night Indicator & Wave */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0">
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
              <div>
                <div
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    isNight ? 'text-[#f87171]' : 'text-[#94a3b8]'
                  }`}
                >
                  {hud.phase === 'day' ? tr.ui.dayBuild : tr.ui.bloodMoon}
                </div>
                <div className="text-xs sm:text-base font-mono-tabular font-extrabold text-[#fef3c7] leading-tight">
                  D{hud.dayNumber}/{hud.maxDays}{' '}
                  <span className="text-[#94a3b8] font-normal">·</span>{' '}
                  {hud.phase === 'day' ? (
                    <span className="text-[#fbbf24]">{Math.ceil(hud.phaseTimeRemaining)}s</span>
                  ) : (
                    <span className="text-[#f87171]">
                      {hud.zombiesRemaining} {tr.ui.zombiesLeft}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-[#1e293b]" />

            {/* Daily Tickets (clickable +10 refill), Clickable Tasks, Fence & Score */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRefillTicketWithCoins?.();
                }}
                title={tr.ui.ticketRefillTooltip}
                className="text-left px-1 py-0.5 rounded-lg hover:bg-[#1e293b] border border-transparent hover:border-[#334155] cursor-pointer transition-colors"
              >
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-0.5">
                  <span>{tr.ui.ticket}</span>
                  <span className="text-[#fbbf24]">+</span>
                </div>
                <div
                  className="text-xs sm:text-base font-mono-tabular font-extrabold text-[#fbbf24] leading-tight"
                  data-testid="hud-tickets"
                >
                  {hud.daily.tickets}/{hud.daily.maxDailyTickets}
                </div>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setShowTasksPopover((v) => !v);
                }}
                className="text-left px-1 py-0.5 rounded-lg hover:bg-[#1e293b] border border-transparent hover:border-[#334155] cursor-pointer transition-colors"
                title={tr.ui.dailyTasksChecklist}
              >
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-0.5">
                  <span>{tr.ui.tasks}</span>
                  <span className="text-[#4ade80]">{showTasksPopover ? '▴' : '▾'}</span>
                </div>
                <div
                  className="text-xs sm:text-base font-mono-tabular font-extrabold text-[#4ade80] leading-tight"
                  data-testid="hud-tasks"
                >
                  {completedTasksCount}/{hud.daily.tasks.length}
                </div>
              </button>

              <div className="hidden xs:block sm:block">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.fence}
                </div>
                <div
                  className="text-xs sm:text-base font-mono-tabular font-extrabold text-[#4ade80] leading-tight"
                  data-testid="hud-fence-count"
                >
                  {builtFenceCount}/{hud.fenceSegments.length}
                  {upgradedFenceCount > 0 ? ` (${upgradedFenceCount}★)` : ''}
                </div>
              </div>

              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.score}
                </div>
                <div
                  className="text-xs sm:text-base font-mono-tabular font-extrabold text-[#e2dacb] leading-tight"
                  data-testid="hud-score"
                >
                  {Math.round(hud.score)}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Expandable Daily Tasks Checklist */}
          {showTasksPopover && (
            <div
              className="absolute left-0 top-full mt-1.5 z-30 w-72 rounded-xl border border-[#334155] p-2.5 shadow-xl"
              style={{ backgroundColor: 'rgba(13, 19, 28, 0.97)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
                  {tr.ui.dailyTasksChecklist}
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowTasksPopover(false)}
                  className="text-[10px] text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer"
                >
                  {tr.ui.closeLabel}
                </button>
              </div>
              <div className="space-y-1.5">
                {hud.daily.tasks.map((task) => {
                  const prog = Math.min(task.target, hud.daily.taskProgress[task.id] ?? 0);
                  const done = prog >= task.target;
                  const locTitle = tr.dailyTaskTitles[task.id] ?? task.title;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#0b1016] border border-[#1e293b] text-[11px]"
                    >
                      <span className={done ? 'text-[#4ade80] line-through' : 'text-[#e2dacb]'}>
                        {locTitle}
                      </span>
                      <span
                        className={`font-mono-tabular font-bold shrink-0 ${
                          done ? 'text-[#4ade80]' : 'text-[#fbbf24]'
                        }`}
                      >
                        {prog}/{task.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Cluster: Wood, Stone, Food + Start Night Early + Language Switcher + Utility Icons */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between sm:justify-end w-full sm:w-auto gap-1.5 sm:gap-2">
          {/* Resource Counters */}
          <div
            className="flex items-center gap-2 sm:gap-3.5 px-2 py-1 sm:px-3.5 sm:py-2 rounded-xl border border-[#334155]"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.92)' }}
          >
            {/* Wood */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0">
                <rect x="3" y="7" width="18" height="10" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
                <circle cx="18" cy="12" r="3" fill="#fde68a" />
              </svg>
              <div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.wood}
                </div>
                <div className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-wood">
                  {Math.round(hud.resources.wood)}
                </div>
              </div>
            </div>

            {/* Stone */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0">
                <polygon
                  points="12,3 21,9 18,20 6,20 3,9"
                  fill="#64748b"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                <polygon points="12,5 17,10 12,14 8,10" fill="#94a3b8" />
              </svg>
              <div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.stone}
                </div>
                <div className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-stone">
                  {Math.round(hud.resources.stone)}
                </div>
              </div>
            </div>

            {/* Food */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0">
                <circle cx="9" cy="14" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
                <circle cx="15" cy="15" r="4.5" fill="#ef4444" stroke="#881337" strokeWidth="1.5" />
                <path d="M12 5c2 0 4 2 4 4-2 0-4-1-4-4z" fill="#22c55e" />
              </svg>
              <div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.food}
                </div>
                <div className="text-xs sm:text-sm font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-food">
                  {Math.round(hud.resources.food)}
                </div>
              </div>
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
              className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-md"
            >
              {tr.ui.nightBtn}
            </button>
          )}

          {/* Compact In-Game 5-Language Switcher (EN | ID | ZH | VI | RU) */}
          <div
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-[#131b26] border border-[#334155]"
            data-testid="hud-language-selector"
          >
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = lang === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  tabIndex={-1}
                  data-testid={`hud-lang-btn-${opt.code}`}
                  title={opt.nativeName}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectLanguage(opt.code);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#f59e0b] text-[#090d16]'
                      : 'text-[#cbd5e1] hover:bg-[#1e293b]'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Square SVG Utility Buttons: Guide [?], Mute [M], Pause [P] (Zoom uses Mouse Wheel / Pinch) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-label="How to Run and Controls"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
            >
              <span className="font-display font-bold text-xs sm:text-sm">?</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* WAVE THREAT INTEL STRIP (Left-aligned compact strip on tablet/desktop) */}
      <div className="hidden sm:flex w-full items-center justify-between gap-2 mt-1 pointer-events-none">
        <div
          className="pointer-events-auto inline-flex flex-wrap items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#334155] text-[9.5px] sm:text-[10px]"
          style={{ backgroundColor: 'rgba(13, 19, 28, 0.86)' }}
          data-testid="hud-wave-threats"
        >
          <span className="font-bold uppercase tracking-wider text-[#94a3b8] mr-0.5">
            {tr.ui.nightThreatsLabel(hud.dayNumber)}
          </span>
          {waveThreats.map((arch) => {
            const spec = ZOMBIE_CATALOG[arch];
            const zLoc = tr.zombies[arch];
            return (
              <button
                key={arch}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenGuide();
                }}
                title={`${zLoc.name}: ${zLoc.specialTrait} · ${zLoc.tacticalCounter}`}
                className="px-1.5 py-0.5 rounded bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] font-mono-tabular font-semibold cursor-pointer transition-colors flex items-center gap-1"
                style={{ color: spec.badgeColor }}
              >
                {spec.portraitUrl && (
                  <img
                    src={spec.portraitUrl}
                    alt={zLoc.name}
                    className="w-3.5 h-3.5 rounded-full object-cover border border-[#475569] shrink-0"
                  />
                )}
                <span>{zLoc.name}</span>
                {arch === 'swift_stumbler' && (
                  <span className="text-[9px] text-[#fdba74] opacity-90">{tr.ui.fastBadge}</span>
                )}
                {arch === 'armored_undead' && (
                  <span className="text-[9px] text-[#7dd3fc] opacity-90">{tr.ui.armorBadge}</span>
                )}
                {arch === 'bone_howler' && (
                  <span className="text-[9px] text-[#5eead4] opacity-90">{tr.ui.howlBadge}</span>
                )}
                {arch === 'baron' && (
                  <span className="text-[9px] text-[#e9d5ff] opacity-90">{tr.ui.bossBadge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP-CENTER NOTIFICATION / BOSS BARON BLIGHT BANNER */}
      <div className="w-full flex flex-col items-center pointer-events-none mt-1 mb-auto">
        {hud.bossActive && (
          <div
            className="mb-1.5 px-3 py-1.5 rounded-xl border border-[#eab308] text-left max-w-md flex items-center gap-3"
            style={{ backgroundColor: 'rgba(27, 12, 46, 0.94)' }}
          >
            {ZOMBIE_CATALOG.baron.portraitUrl && (
              <img
                src={ZOMBIE_CATALOG.baron.portraitUrl}
                alt="Baron Blight"
                className="w-10 h-10 rounded-lg object-cover border border-[#eab308] shrink-0"
              />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#fde047]">
                {tr.ui.bossBadge} · {hud.bossName}
              </div>
              {hud.bossSpeech && (
                <div className="text-xs italic text-[#fef08a] my-0.5">“{hud.bossSpeech}”</div>
              )}
              <div className="w-48 h-2 rounded bg-[#090d16] border border-[#581c87] overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#eab308] transition-all duration-150"
                  style={{ width: `${Math.max(0, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {isConstructing && hud.pendingConstruction && (
          <div
            data-testid="hud-construction-state"
            className="mb-1 px-3 py-1 rounded-lg border border-[#fbbf24] text-[11px] sm:text-xs font-mono-tabular font-bold text-[#fef3c7] flex items-center gap-2.5 shadow-lg"
            style={{ backgroundColor: 'rgba(20, 83, 45, 0.94)' }}
          >
            <span>
              {tr.ui.constructingBanner(hud.pendingConstruction.label, constructionPct)}
            </span>
            <div className="w-20 sm:w-24 h-2 rounded bg-[#090d16] border border-[#4ade80] overflow-hidden">
              <div
                className="h-full bg-[#fbbf24] transition-all duration-75"
                style={{ width: `${constructionPct}%` }}
              />
            </div>
          </div>
        )}

        {!isConstructing && hud.statusBanner && (
          <div
            data-testid="hud-status-banner"
            className="px-3 py-1 rounded-lg border border-[#475569] text-[11px] sm:text-xs font-semibold text-[#fef3c7] text-center max-w-xl"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            {hud.statusBanner}
          </div>
        )}
      </div>

      {/* ORGANIZED CONTEXT-SENSITIVE BOTTOM DOCK */}
      <div className="w-full flex flex-col items-center pointer-events-none">
        {hud.dockCollapsed ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDock();
            }}
            className="pointer-events-auto px-3 py-1.5 rounded-lg bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] text-xs font-medium text-[#cbd5e1] cursor-pointer whitespace-nowrap shadow-lg"
          >
            {tr.ui.openControlMenuBtn}
          </button>
        ) : (
          <div className="pointer-events-auto flex flex-col items-center w-full max-w-[1060px] gap-1.5">
            {/* 1. CONTEXTUAL BUILD / UPGRADE MENU WHEN A BUILD PAD IS SELECTED */}
            {selectedPad && (
              <div
                data-testid="pad-build-choice-menu"
                className="w-full rounded-xl border-2 border-[#f59e0b] px-3 py-2 shadow-2xl"
                style={{ backgroundColor: 'rgba(13, 19, 28, 0.96)' }}
              >
                {/* Header: Selected Pad Title + Quick P1-P8 Switcher + Close Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-2 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#f59e0b] text-[#090d16] font-mono-tabular font-extrabold text-xs">
                      PAD P{selectedPad.id}
                    </span>
                    <span className="text-xs sm:text-sm font-display font-bold text-[#fef3c7]">
                      {(() => {
                        const padLabelLoc = tr.padLabels[selectedPad.label] ?? selectedPad.label;
                        if (selectedPad.building === null) {
                          return isNight
                            ? `${padLabelLoc} — ${tr.ui.padLockedNightHeader}`
                            : `${padLabelLoc} — ${tr.ui.padChooseStructureHeader}`;
                        }
                        const bLoc =
                          tr.buildings[selectedPad.building.type]?.name ??
                          BUILDING_CATALOG[selectedPad.building.type].name;
                        return `${padLabelLoc} — ${bLoc}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="hidden md:flex items-center gap-1 mr-2">
                      {hud.pads.map((p) => {
                        const isSel = p.id === selectedPad.id;
                        const hasBld = p.building !== null;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              onSelectPad(p.id);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-[#f59e0b] text-[#090d16]'
                                : hasBld
                                ? 'bg-[#14532d] text-[#86efac] hover:bg-[#166534]'
                                : 'bg-[#161f2c] text-[#cbd5e1] hover:bg-[#1e293b]'
                            }`}
                          >
                            P{p.id}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="btn-close-pad-menu"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectPad(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-xs font-semibold text-[#fef3c7] cursor-pointer"
                    >
                      {tr.ui.closeMenuBtn}
                    </button>
                  </div>
                </div>

                {selectedPad.building === null ? (
                  /* 6 Building Choices for the Selected Empty Pad */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                    {BUILDING_LIST.map((bType) => {
                      const spec = BUILDING_CATALOG[bType];
                      const bLoc = tr.buildings[bType];
                      const affordable = !isNight && !isConstructing && canAfford(hud.resources, spec.cost);
                      return (
                        <button
                          key={bType}
                          type="button"
                          tabIndex={-1}
                          aria-disabled={!affordable}
                          data-night-locked={isNight ? 'true' : 'false'}
                          data-testid={`btn-build-${bType}`}
                          onClick={(e) => {
                            e.currentTarget.blur();
                            onBuildOnPad(bType);
                          }}
                          className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[58px] ${
                            affordable
                              ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#475569] hover:border-[#f59e0b] cursor-pointer shadow-sm'
                              : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 text-xs font-bold text-[#fef3c7]">
                              <span className="truncate">{bLoc.name}</span>
                              <span className="font-mono-tabular text-[10px] text-[#f59e0b] shrink-0">
                                [{spec.keybind}]
                              </span>
                            </div>
                            <div className="text-[10px] text-[#94a3b8] truncate mt-0.5">
                              {bLoc.roleShort}
                            </div>
                          </div>
                          <div className="text-[10px] font-mono-tabular font-bold text-[#fbbf24] mt-1">
                            {isNight
                              ? tr.ui.nightLockedShort
                              : `${spec.cost.wood}W · ${spec.cost.stone}S${
                                  spec.cost.food > 0 ? ` · ${spec.cost.food}F` : ''
                                }`}
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
                      !isNight && bld.upgradePath === null && canAfford(hud.resources, pathA.cost);
                    const canPathB =
                      !isNight && bld.upgradePath === null && canAfford(hud.resources, pathB.cost);
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono-tabular font-bold text-[#4ade80]">
                              HP {Math.round(bld.hp)} / {Math.round(bld.maxHp)}
                            </span>
                            {bld.upgradePath && (
                              <span className="text-[#fbbf24] font-semibold">
                                · {tr.ui.masteryLabel}:{' '}
                                {bld.upgradePath === 'pathA' ? bLoc.pathAName : bLoc.pathBName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={isNight}
                              data-night-locked={isNight ? 'true' : 'false'}
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onRepairPad();
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-mono-tabular font-semibold transition-colors ${
                                isNight
                                  ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                  : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#4ade80] cursor-pointer'
                              }`}
                            >
                              {isNight ? tr.ui.repairLockedBtn : tr.ui.repairBtn}
                            </button>
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={isNight}
                              data-night-locked={isNight ? 'true' : 'false'}
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onDemolishPad();
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                isNight
                                  ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                  : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#f87171] cursor-pointer'
                              }`}
                            >
                              {isNight ? tr.ui.salvageLockedBtn : tr.ui.salvageBtn}
                            </button>
                          </div>
                        </div>

                        {bld.upgradePath === null ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={!canPathA}
                              data-night-locked={isNight ? 'true' : 'false'}
                              data-testid="btn-upgrade-pathA"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onUpgradeOnPad('pathA');
                              }}
                              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                                canPathA
                                  ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#f59e0b] cursor-pointer'
                                  : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                <span>
                                  {tr.ui.upgradeALabel}: {bLoc.pathAName}
                                </span>
                                <span className="font-mono-tabular text-[#f59e0b]">[1]</span>
                              </div>
                              <div className="text-[11px] text-[#cbd5e1] truncate">
                                {bLoc.pathATagline}
                              </div>
                              <div className="text-[10px] font-mono-tabular font-bold text-[#fbbf24] mt-0.5">
                                {isNight
                                  ? tr.ui.lockedAtNight
                                  : `${pathA.cost.wood}W · ${pathA.cost.stone}S · ${pathA.cost.food}F`}
                              </div>
                            </button>

                            <button
                              type="button"
                              tabIndex={-1}
                              aria-disabled={!canPathB}
                              data-night-locked={isNight ? 'true' : 'false'}
                              data-testid="btn-upgrade-pathB"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                onUpgradeOnPad('pathB');
                              }}
                              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                                canPathB
                                  ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#38bdf8] cursor-pointer'
                                  : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                <span>
                                  {tr.ui.upgradeBLabel}: {bLoc.pathBName}
                                </span>
                                <span className="font-mono-tabular text-[#38bdf8]">[2]</span>
                              </div>
                              <div className="text-[11px] text-[#cbd5e1] truncate">
                                {bLoc.pathBTagline}
                              </div>
                              <div className="text-[10px] font-mono-tabular font-bold text-[#38bdf8] mt-0.5">
                                {isNight
                                  ? tr.ui.lockedAtNight
                                  : `${pathB.cost.wood}W · ${pathB.cost.stone}S · ${pathB.cost.food}F`}
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1.5 rounded-lg bg-[#0b1016] border border-[#1e293b] text-xs text-[#cbd5e1]">
                            {tr.ui.masteryActiveLabel}:{' '}
                            <strong className="text-[#fbbf24]">
                              {bld.upgradePath === 'pathA' ? bLoc.pathAName : bLoc.pathBName}
                            </strong>{' '}
                            — {bld.upgradePath === 'pathA' ? bLoc.pathATagline : bLoc.pathBTagline}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* 2. MAIN COMPACT ACTION BAR (Always Clean & Easy to Use on PC & Mobile) */}
            <div
              className="w-full rounded-xl border border-[#334155] px-2.5 py-1.5 shadow-2xl flex flex-wrap items-center justify-between gap-2"
              style={{ backgroundColor: 'rgba(13, 19, 28, 0.93)' }}
            >
              {/* Left Actions: Lantern Flare (Night) + Perimeter Fence [F] */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={flareNightLocked || flareOnCooldown}
                  aria-disabled={flareNightLocked || flareOnCooldown}
                  data-night-locked={flareNightLocked ? 'true' : 'false'}
                  data-testid="btn-lantern-flare"
                  title={
                    flareNightLocked ? tr.ui.flareTooltipLocked : tr.ui.flareTooltipReady
                  }
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerFlare();
                  }}
                  className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg font-mono-tabular font-bold text-[11px] sm:text-xs transition-colors whitespace-nowrap border ${
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
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover border border-[#090d16]/40 shrink-0"
                  />
                  <span>
                    {flareNightLocked
                      ? tr.ui.flareLockedBtn
                      : flareOnCooldown
                      ? tr.ui.flareCooldownBtn(hud.flareCooldown.toFixed(1))
                      : tr.ui.flareReadyBtn}
                  </span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-disabled={
                    isNight ||
                    isConstructing ||
                    (builtFenceCount < hud.fenceSegments.length ? !canBuildFence : !canUpgradeFence)
                  }
                  data-night-locked={isNight ? 'true' : 'false'}
                  data-constructing={isConstructing ? 'true' : 'false'}
                  data-testid="btn-build-fence"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onBuildNextFence();
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border text-left font-mono-tabular transition-colors whitespace-nowrap ${
                    isNight
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
                  <div className="text-[11px] font-bold leading-tight">
                    {isNight
                      ? tr.ui.fenceLockedBtn(builtFenceCount, hud.fenceSegments.length)
                      : isConstructing
                      ? `🔨 ${constructionPct}%`
                      : selectedFence
                      ? tr.ui.fenceSelectedBtn(selectedFence.label.replace(' Fence', ''))
                      : builtFenceCount < hud.fenceSegments.length
                      ? tr.ui.outerFenceBtn(builtFenceCount, hud.fenceSegments.length)
                      : tr.ui.upgradeFenceBtn}
                  </div>
                  <div className="text-[9px] text-[#cbd5e1] opacity-85 leading-tight">
                    {isNight
                      ? tr.ui.fenceLockedSub
                      : builtFenceCount < hud.fenceSegments.length
                      ? '15W · 5S'
                      : '20W · 15S'}
                  </div>
                </button>
              </div>

              {/* Center: Interactive Build Points (P1-P8) Selector Strip */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full py-0.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#cbd5e1] whitespace-nowrap mr-0.5">
                  {tr.ui.selectBuildPadPrompt}
                </span>
                {hud.pads.map((p) => {
                  const isSelected = p.id === hud.selectedPadId;
                  const hasBld = p.building !== null;
                  const padLabelLoc = tr.padLabels[p.label] ?? p.label;
                  const bldNameLoc = hasBld
                    ? (tr.buildings[p.building!.type]?.name ??
                      BUILDING_CATALOG[p.building!.type].name)
                    : '';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      tabIndex={-1}
                      data-testid={`btn-select-pad-${p.id}`}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectPad(isSelected ? null : p.id);
                      }}
                      title={
                        hasBld
                          ? `Pad #${p.id}: ${bldNameLoc}`
                          : `Pad #${p.id} (${padLabelLoc})`
                      }
                      className={`px-2 py-1 rounded-lg border text-[11px] font-mono-tabular font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-[#f59e0b] border-[#fef08a] text-[#090d16] shadow-md'
                          : hasBld
                          ? 'bg-[#14532d]/80 border-[#4ade80] text-[#86efac] hover:bg-[#166534]'
                          : 'bg-[#161f2c] border-[#334155] text-[#fef3c7] hover:border-[#f59e0b]'
                      }`}
                    >
                      P{p.id}
                      {hasBld ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Right: Deselect Fence / Collapse Dock [H] */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                {selectedFence && !selectedPad && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onSelectFence(null)}
                    className="px-2 py-1 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[10px] text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer"
                  >
                    {tr.ui.deselectFenceBtn}
                  </button>
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  title={tr.ui.hideBottomDockTooltip}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleDock();
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[10px] font-mono-tabular text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer whitespace-nowrap"
                >
                  ▾ [H]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
