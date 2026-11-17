import React from 'react';
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
  onAdjustZoom: (delta: number) => void;
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
  onAdjustZoom,
}) => {
  if (hud.screen === 'title') return null;

  const selectedPad = hud.pads.find((p) => p.id === hud.selectedPadId) ?? null;
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

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Critical low-HP peripheral vignette */}
      {isCriticalHp && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.48)',
          }}
        />
      )}

      {/* TOP PERIMETER BAR: Left Status Cluster + Right Resource & Utility Cluster */}
      <div className="w-full flex flex-wrap items-start justify-between gap-3">
        {/* Top-Left Cluster: Fort HP + Day/Night Phase + Timer + Tickets */}
        <div
          className="pointer-events-auto flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl border border-[#334155]"
          style={{ backgroundColor: 'rgba(13, 19, 28, 0.92)' }}
        >
          {/* Fort Vitality Socket & Bar */}
          <div className="min-w-[165px]">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                FORT HP
              </span>
              <span className="text-base font-mono-tabular font-bold text-[#fef3c7] hud-stroke">
                {Math.round(hud.fortHp)} / {Math.round(hud.fortMaxHp)}
              </span>
            </div>
            <div className="w-full h-3 rounded bg-[#090d14] border border-[#1e293b] overflow-hidden relative">
              {/* Delayed trailing ghost damage bar */}
              <div
                className="position absolute inset-y-0 left-0 bg-[#f59e0b]/60 transition-all duration-300"
                style={{ width: `${fortGhostPct}%` }}
              />
              {/* Active HP fill */}
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

          <div className="h-8 w-[1px] bg-[#1e293b]" />

          {/* Day / Night Indicator & Wave */}
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0">
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
                <path
                  d="M20.4 14.8A8.5 8.5 0 019.2 3.6a8.5 8.5 0 1011.2 11.2z"
                  fill="#38bdf8"
                  stroke="#0c4a6e"
                  strokeWidth="1.5"
                />
              )}
            </svg>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                {hud.phase === 'day' ? 'DAY PHASE · BUILD' : 'NIGHT PHASE · DEFEND'}
              </div>
              <div className="text-lg font-mono-tabular font-extrabold text-[#fef3c7] leading-tight">
                Day {hud.dayNumber}/{hud.maxDays}{' '}
                <span className="text-[#94a3b8] font-normal">·</span>{' '}
                {hud.phase === 'day' ? (
                  <span className="text-[#fbbf24]">{Math.ceil(hud.phaseTimeRemaining)}s</span>
                ) : (
                  <span className="text-[#38bdf8]">
                    {hud.zombiesRemaining} Left
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#1e293b]" />

          {/* Daily Tickets, Tasks & Score */}
          <div className="flex items-center gap-3.5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                TICKETS
              </div>
              <div
                className="text-lg font-mono-tabular font-extrabold text-[#fbbf24] leading-tight"
                data-testid="hud-tickets"
              >
                {hud.daily.tickets}/{hud.daily.maxDailyTickets}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                TASKS
              </div>
              <div
                className="text-lg font-mono-tabular font-extrabold text-[#4ade80] leading-tight"
                data-testid="hud-tasks"
              >
                {
                  hud.daily.tasks.filter(
                    (t) => (hud.daily.taskProgress[t.id] ?? 0) >= t.target
                  ).length
                }
                /{hud.daily.tasks.length}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                FENCE
              </div>
              <div
                className="text-lg font-mono-tabular font-extrabold text-[#4ade80] leading-tight"
                data-testid="hud-fence-count"
              >
                {builtFenceCount}/{hud.fenceSegments.length}
                {upgradedFenceCount > 0 ? ` (${upgradedFenceCount}★)` : ''}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                SCORE
              </div>
              <div
                className="text-lg font-mono-tabular font-extrabold text-[#e2dacb] leading-tight"
                data-testid="hud-score"
              >
                {Math.round(hud.score)}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Wood, Stone, Food + Start Night Early + Utility Icons */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          {/* Resource Counters */}
          <div
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl border border-[#334155]"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.92)' }}
          >
            {/* Wood */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <rect x="3" y="7" width="18" height="10" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
                <circle cx="18" cy="12" r="3" fill="#fde68a" />
              </svg>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">WOOD</div>
                <div className="text-base font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-wood">
                  {Math.round(hud.resources.wood)}
                </div>
              </div>
            </div>

            {/* Stone */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <polygon
                  points="12,3 21,9 18,20 6,20 3,9"
                  fill="#64748b"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                <polygon points="12,5 17,10 12,14 8,10" fill="#94a3b8" />
              </svg>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">STONE</div>
                <div className="text-base font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-stone">
                  {Math.round(hud.resources.stone)}
                </div>
              </div>
            </div>

            {/* Food */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                <circle cx="9" cy="14" r="5" fill="#f43f5e" stroke="#881337" strokeWidth="1.5" />
                <circle cx="15" cy="15" r="4.5" fill="#e11d48" stroke="#881337" strokeWidth="1.5" />
                <path d="M12 5c2 0 4 2 4 4-2 0-4-1-4-4z" fill="#22c55e" />
              </svg>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">FOOD</div>
                <div className="text-base font-mono-tabular font-bold text-[#fef3c7] leading-none" data-testid="hud-food">
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
              className="px-3.5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-md"
            >
              Start Night [N]
            </button>
          )}

          {/* Square SVG Utility Buttons: Guide [?], Mute [M], Pause [P] */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              aria-label="How to Run and Controls"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className="w-10 h-10 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
            >
              <span className="font-display font-bold text-sm">?</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-10 h-10 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
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
              className="w-10 h-10 rounded-xl bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#e2dacb] cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* WAVE THREAT INTEL STRIP (Left-aligned below top bar, never overlapping the central 3D fort) */}
      <div className="w-full flex items-center justify-between gap-2 mt-1.5 pointer-events-none">
        <div
          className="pointer-events-auto inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#334155] text-[11px]"
          style={{ backgroundColor: 'rgba(13, 19, 28, 0.88)' }}
          data-testid="hud-wave-threats"
        >
          <span className="font-bold uppercase tracking-wider text-[#94a3b8] mr-1">
            Night {hud.dayNumber} Threats:
          </span>
          {waveThreats.map((arch) => {
            const spec = ZOMBIE_CATALOG[arch];
            return (
              <button
                key={arch}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenGuide();
                }}
                title={`${spec.name}: ${spec.specialTrait} Counter: ${spec.tacticalCounter}`}
                className="px-2 py-0.5 rounded bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] font-mono-tabular font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                style={{ color: spec.badgeColor }}
              >
                {spec.portraitUrl && (
                  <img
                    src={spec.portraitUrl}
                    alt={spec.name}
                    className="w-4 h-4 rounded-full object-cover border border-[#475569] shrink-0"
                  />
                )}
                <span>{spec.name}</span>
                {arch === 'swift_stumbler' && (
                  <span className="text-[9px] text-[#fdba74] opacity-90">FAST</span>
                )}
                {arch === 'armored_undead' && (
                  <span className="text-[9px] text-[#7dd3fc] opacity-90">90 ARMOR</span>
                )}
                {arch === 'bone_howler' && (
                  <span className="text-[9px] text-[#5eead4] opacity-90">HOWL</span>
                )}
                {arch === 'baron' && (
                  <span className="text-[9px] text-[#e9d5ff] opacity-90">BOSS</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP-CENTER NOTIFICATION / BOSS BARON BLIGHT BANNER (kept off the center 3D fort) */}
      <div className="w-full flex flex-col items-center pointer-events-none mt-1 mb-auto">
        {hud.bossActive && (
          <div
            className="mb-2 px-4 py-2 rounded-xl border border-[#eab308] text-left max-w-md flex items-center gap-3"
            style={{ backgroundColor: 'rgba(27, 12, 46, 0.94)' }}
          >
            {ZOMBIE_CATALOG.baron.portraitUrl && (
              <img
                src={ZOMBIE_CATALOG.baron.portraitUrl}
                alt="Baron Blight"
                className="w-11 h-11 rounded-lg object-cover border border-[#eab308] shrink-0"
              />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#fde047]">
                BOSS · {hud.bossName}
              </div>
              {hud.bossSpeech && (
                <div className="text-xs italic text-[#fef08a] my-0.5">“{hud.bossSpeech}”</div>
              )}
              <div className="w-52 h-2.5 rounded bg-[#090d16] border border-[#581c87] overflow-hidden mt-1">
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
            className="mb-1.5 px-4 py-1.5 rounded-lg border border-[#fbbf24] text-xs font-mono-tabular font-bold text-[#fef3c7] flex items-center gap-3 shadow-lg"
            style={{ backgroundColor: 'rgba(20, 83, 45, 0.94)' }}
          >
            <span>
              🔨 Ranger Rue Constructing: {hud.pendingConstruction.label} ({constructionPct}%)
            </span>
            <div className="w-24 h-2 rounded bg-[#090d16] border border-[#4ade80] overflow-hidden">
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
            className="px-4 py-1.5 rounded-lg border border-[#475569] text-xs font-semibold text-[#fef3c7]"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
          >
            {hud.statusBanner}
          </div>
        )}
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK */}
      <div className="w-full flex flex-col items-center pointer-events-none">
        {/* Collapse / Expand Handle + Pad Quick-Selector Strip */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDock();
            }}
            className="px-3 py-1 rounded-t-lg bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] text-[11px] font-medium text-[#cbd5e1] cursor-pointer whitespace-nowrap"
          >
            {hud.dockCollapsed ? '▴ Show Build & Skill Dock [H]' : '▾ Hide Controls [H]'}
          </button>

          {!hud.dockCollapsed && (
            <div className="flex items-center gap-1 bg-[#131b26] border border-[#334155] rounded-lg px-2 py-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] mr-1">
                Weapon Pads:
              </span>
              {hud.pads.map((p) => {
                const isSelected = p.id === hud.selectedPadId;
                const hasBld = p.building !== null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSelectPad(isSelected ? null : p.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono-tabular font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#f59e0b] text-[#090d16]'
                        : hasBld
                        ? 'bg-[#1e293b] text-[#4ade80] hover:bg-[#334155]'
                        : 'text-[#cbd5e1] hover:bg-[#1e293b]'
                    }`}
                  >
                    P{p.id}
                  </button>
                );
              })}
            </div>
          )}

          {!hud.dockCollapsed && (
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
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono-tabular font-bold transition-colors whitespace-nowrap ${
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
              {isNight
                ? `🔒 Fence Build Locked at Night [F] (${builtFenceCount}/12)`
                : isConstructing
                ? `🔨 Constructing ${hud.pendingConstruction?.label}... (${constructionPct}%)`
                : builtFenceCount < hud.fenceSegments.length
                ? `🔨 Build Square Fence [F] (${builtFenceCount}/12 · 15W 5S)`
                : `🛡️ Upgrade Spiked Fence [F] (20W 15S)`}
            </button>
          )}

          {!hud.dockCollapsed && (
            <div className="hidden sm:flex items-center gap-1 bg-[#131b26] border border-[#334155] rounded-lg px-2 py-0.5">
              <button
                type="button"
                tabIndex={-1}
                aria-label="Zoom In"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onAdjustZoom(-0.12);
                }}
                className="px-1.5 text-xs text-[#cbd5e1] hover:text-[#fbbf24] cursor-pointer"
              >
                Zoom +
              </button>
              <span className="text-[#475569]">·</span>
              <button
                type="button"
                tabIndex={-1}
                aria-label="Zoom Out"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onAdjustZoom(0.12);
                }}
                className="px-1.5 text-xs text-[#cbd5e1] hover:text-[#fbbf24] cursor-pointer"
              >
                Zoom −
              </button>
            </div>
          )}
        </div>

        {/* Main Bottom Dock Surface */}
        {!hud.dockCollapsed && (
          <div
            className="pointer-events-auto w-full max-w-[940px] rounded-xl border border-[#334155] p-3 shadow-2xl"
            style={{ backgroundColor: 'rgba(13, 19, 28, 0.94)' }}
          >
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {/* Left Column: Ranger Rue Lantern Flare Skill */}
              <div className="flex md:flex-col justify-between items-center md:items-stretch md:w-48 shrink-0 p-2.5 rounded-lg bg-[#0b1016] border border-[#1e293b]">
                <div className="flex items-center gap-2.5 text-left">
                  <img
                    src={HERO_RUE_PORTRAIT_URL}
                    alt="Ranger Rue"
                    className="w-10 h-10 rounded-lg object-cover border border-[#f59e0b] shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
                      RUE SKILL · [SPACE]
                    </div>
                    <div className="text-sm font-display font-bold text-[#fef3c7] leading-tight">
                      Lantern Flare
                    </div>
                    <div className="text-[10px] text-[#94a3b8] leading-snug">
                      AoE Knockback + Slow
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  disabled={hud.flareCooldown > 0.05}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerFlare();
                  }}
                  className={`mt-2 px-3.5 py-2 rounded-lg font-mono-tabular font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    hud.flareCooldown > 0.05
                      ? 'bg-[#1e293b] text-[#94a3b8] cursor-not-allowed'
                      : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16]'
                  }`}
                >
                  {hud.flareCooldown > 0.05
                    ? `Cooldown ${hud.flareCooldown.toFixed(1)}s`
                    : 'Cast Flare [Space]'}
                </button>
              </div>

              {/* Right Column: Pad Construction / 2-Path Upgrade Inspector */}
              <div className="flex-1 min-w-0">
                {!selectedPad ? (
                  <div className="h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isNight ? 'text-[#38bdf8]' : 'text-[#e2dacb]'
                        }`}
                      >
                        {isNight
                          ? '🔒 Night Phase: Construction & upgrades locked — fight with Rue & cast Lantern Flare [Space]!'
                          : 'Click a Building below (or press 1–6) to build on the next open Pad, or select P1–P8:'}
                      </span>
                      <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
                        {isNight
                          ? 'Existing defenses fire automatically'
                          : 'Click trees, rocks, or bushes to gather'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {BUILDING_LIST.map((bType) => {
                        const spec = BUILDING_CATALOG[bType];
                        const affordable = !isNight && canAfford(hud.resources, spec.cost);
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
                            className={`p-2 rounded-lg border text-left transition-colors ${
                              affordable
                                ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] cursor-pointer'
                                : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#fef3c7] truncate">
                              <span>{spec.name}</span>
                              <span className="font-mono-tabular text-[#f59e0b]">[{spec.keybind}]</span>
                            </div>
                            <div className="text-[10px] font-mono-tabular text-[#94a3b8] mt-1">
                              {isNight
                                ? 'Locked at Night'
                                : `${spec.cost.wood}W · ${spec.cost.stone}S${
                                    spec.cost.food > 0 ? ` · ${spec.cost.food}F` : ''
                                  }`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : selectedPad.building === null ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#fef3c7]">
                        {isNight
                          ? `Pad #${selectedPad.id} (${selectedPad.label}) — 🔒 Construction Locked at Night`
                          : `Build on Pad #${selectedPad.id} (${selectedPad.label})`}
                      </span>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => onSelectPad(null)}
                        className="text-xs text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer"
                      >
                        Deselect
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                      {BUILDING_LIST.map((bType) => {
                        const spec = BUILDING_CATALOG[bType];
                        const affordable = !isNight && canAfford(hud.resources, spec.cost);
                        return (
                          <button
                            key={bType}
                            type="button"
                            tabIndex={-1}
                            aria-disabled={!affordable}
                            data-night-locked={isNight ? 'true' : 'false'}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              onBuildOnPad(bType);
                            }}
                            className={`p-2 rounded-lg border text-left transition-colors ${
                              affordable
                                ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#475569] cursor-pointer'
                                : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                              <span className="truncate">{spec.name}</span>
                              <span className="font-mono-tabular text-[#f59e0b] ml-1">[{spec.keybind}]</span>
                            </div>
                            <div className="text-[10px] text-[#cbd5e1] truncate mt-0.5">
                              {spec.role.split('·')[1] ?? spec.role}
                            </div>
                            <div className="text-[10px] font-mono-tabular text-[#fbbf24] mt-1">
                              {isNight
                                ? 'Locked at Night'
                                : `${spec.cost.wood}W · ${spec.cost.stone}S${
                                    spec.cost.food > 0 ? ` · ${spec.cost.food}F` : ''
                                  }`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Selected Pad has a Building: Show 2 Upgrade Paths + Repair/Demolish */
                  <div>
                    {(() => {
                      const bld = selectedPad.building!;
                      const spec = BUILDING_CATALOG[bld.type];
                      const pathA = spec.paths.pathA;
                      const pathB = spec.paths.pathB;
                      const canPathA =
                        !isNight && bld.upgradePath === null && canAfford(hud.resources, pathA.cost);
                      const canPathB =
                        !isNight && bld.upgradePath === null && canAfford(hud.resources, pathB.cost);
                      return (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-display font-bold text-[#fef3c7]">
                                Pad #{selectedPad.id}: {spec.name}
                              </span>
                              <span className="text-xs font-mono-tabular text-[#4ade80]">
                                HP {Math.round(bld.hp)}/{Math.round(bld.maxHp)}
                              </span>
                              {bld.upgradePath && (
                                <span className="text-xs text-[#fbbf24] font-semibold">
                                  · Upgraded ({spec.paths[bld.upgradePath].name})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                tabIndex={-1}
                                aria-disabled={isNight}
                                data-night-locked={isNight ? 'true' : 'false'}
                                onClick={(e) => {
                                  e.currentTarget.blur();
                                  onRepairPad();
                                }}
                                className={`px-2.5 py-1 rounded border text-[11px] font-mono-tabular transition-colors ${
                                  isNight
                                    ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                    : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#4ade80] cursor-pointer'
                                }`}
                              >
                                {isNight ? '🔒 Repair [R]' : 'Repair [R] (10W 5S)'}
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
                                className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                                  isNight
                                    ? 'bg-[#0b1016] border-[#1e293b] text-[#64748b] opacity-55 cursor-not-allowed'
                                    : 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#f87171] cursor-pointer'
                                }`}
                              >
                                {isNight ? '🔒 Salvage [X]' : 'Salvage [X]'}
                              </button>
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => onSelectPad(null)}
                                className="text-xs text-[#94a3b8] hover:text-[#fef3c7] cursor-pointer ml-1"
                              >
                                Close
                              </button>
                            </div>
                          </div>

                          {bld.upgradePath === null ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                className={`p-2.5 rounded-lg border text-left transition-colors ${
                                  canPathA
                                    ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#f59e0b] cursor-pointer'
                                    : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                  <span>Path A: {pathA.name}</span>
                                  <span className="font-mono-tabular text-[#f59e0b]">[1]</span>
                                </div>
                                <div className="text-[11px] text-[#cbd5e1] mt-0.5">{pathA.tagline}</div>
                                <div className="text-[10px] font-mono-tabular text-[#fbbf24] mt-1">
                                  {isNight
                                    ? '🔒 Locked at Night — Defend the fort!'
                                    : `Cost: ${pathA.cost.wood}W · ${pathA.cost.stone}S · ${pathA.cost.food}F`}
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
                                className={`p-2.5 rounded-lg border text-left transition-colors ${
                                  canPathB
                                    ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#38bdf8] cursor-pointer'
                                    : 'bg-[#0b1016] border-[#1e293b] opacity-55 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                                  <span>Path B: {pathB.name}</span>
                                  <span className="font-mono-tabular text-[#38bdf8]">[2]</span>
                                </div>
                                <div className="text-[11px] text-[#cbd5e1] mt-0.5">{pathB.tagline}</div>
                                <div className="text-[10px] font-mono-tabular text-[#38bdf8] mt-1">
                                  {isNight
                                    ? '🔒 Locked at Night — Defend the fort!'
                                    : `Cost: ${pathB.cost.wood}W · ${pathB.cost.stone}S · ${pathB.cost.food}F`}
                                </div>
                              </button>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-[#0b1016] border border-[#1e293b] text-xs text-[#cbd5e1]">
                              Mastery Path Active:{' '}
                              <strong className="text-[#fbbf24]">
                                {spec.paths[bld.upgradePath].name}
                              </strong>{' '}
                              — {spec.paths[bld.upgradePath].tagline}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
