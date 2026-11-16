import React from 'react';
import {
  getLevelForXp,
  getTimeUntilNextUTCReset,
  LANTERN_COSMETICS,
} from '../game/dailySystem';
import { HERO_RUE_PORTRAIT_URL, ZOMBIE_CATALOG } from '../game/rules';
import { DailyPersistenceState, ZombieArchetype } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGuide: () => void;
  bestScore: number;
  daily: DailyPersistenceState;
  onEquipLantern: (lanternId: string) => void;
  onEquipTitle: (title: string) => void;
  onRefillTicketWithCoins: () => void;
}

const CANONICAL_CAST: ZombieArchetype[] = [
  'shamble',
  'grinner',
  'grumble',
  'gawp',
  'brine',
  'baron',
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenGuide,
  bestScore,
  daily,
  onEquipLantern,
  onEquipTitle,
  onRefillTicketWithCoins,
}) => {
  const levelInfo = getLevelForXp(daily.xp);
  const completedCount = daily.tasks.filter(
    (t) => (daily.taskProgress[t.id] ?? 0) >= t.target
  ).length;
  const resetCountdown = getTimeUntilNextUTCReset();

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-5 md:p-10 pointer-events-none overflow-y-auto"
      style={{
        background:
          'linear-gradient(95deg, rgba(8,12,18,0.94) 0%, rgba(8,12,18,0.78) 48%, rgba(8,12,18,0.25) 100%)',
      }}
    >
      {/* Main Split: Left Brand & Start CTA + Right Daily Retention & Progression Hub */}
      <div className="w-full max-w-[1320px] mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pointer-events-auto">
        {/* Left 7 Columns: Title Emblem, Player Rank, Description, Primary CTA & Lantern Cosmetics */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Player Profile Strip (Ranger Rue Portrait, Level, Title, Streak, Coins, Daily Tickets) */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3 text-xs text-[#cbd5e1]">
            <img
              src={HERO_RUE_PORTRAIT_URL}
              alt="Ranger Rue"
              className="w-7 h-7 rounded-lg object-cover border border-[#f59e0b]"
            />
            <span className="font-mono-tabular font-bold text-[#fbbf24]">
              LVL {daily.level}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#fef3c7]">{daily.equippedTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-[#4ade80]">
              Streak: {daily.streak}d (Best {daily.bestStreak}d)
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-[#38bdf8]">
              Coins: {daily.coins}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className="font-mono-tabular font-bold text-[#f59e0b]"
              data-testid="title-tickets"
            >
              Daily Tickets: {daily.tickets} / {daily.maxDailyTickets}
            </span>
          </div>

          {/* Custom Inline SVG Title Lockup */}
          <div className="mb-3 w-full max-w-[420px]">
            <svg
              viewBox="0 0 460 135"
              className="w-full h-auto drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]"
              role="img"
              aria-label="Build or Bite"
            >
              <path
                d="M12 18 L442 12 L448 112 L18 122 Z"
                fill="#1c140d"
                stroke="#78472a"
                strokeWidth="4"
              />
              <path
                d="M20 26 L434 20 L438 104 L26 112 Z"
                fill="#271b12"
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="8 5"
              />
              <circle cx="436" cy="24" r="14" fill="#0b1016" />
              <circle cx="422" cy="14" r="11" fill="#0b1016" />
              <circle cx="445" cy="39" r="10" fill="#0b1016" />

              <g transform="translate(34, 38)">
                <polygon points="18,0 32,10 6,10" fill="#94a3b8" />
                <rect
                  x="9"
                  y="10"
                  width="18"
                  height="28"
                  rx="3"
                  fill={
                    LANTERN_COSMETICS[daily.equippedLanternId]?.hexColor ??
                    '#f59e0b'
                  }
                />
                <rect x="13" y="14" width="10" height="20" rx="2" fill="#fef3c7" />
                <rect x="6" y="38" width="24" height="6" rx="2" fill="#64748b" />
              </g>

              <text
                x="76"
                y="68"
                fill="#fef3c7"
                fontFamily="Outfit, sans-serif"
                fontWeight="800"
                fontSize="44"
                letterSpacing="1.5"
              >
                BUILD OR BITE
              </text>
              <text
                x="78"
                y="96"
                fill="#f59e0b"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="14"
                letterSpacing="3.5"
              >
                3D FOREST FORT DEFENSE
              </text>
            </svg>
          </div>

          {/* One-line description */}
          <p className="text-sm md:text-base text-[#e2dacb] font-medium leading-relaxed mb-5 max-w-md">
            Fortify Ranger Rue’s spooky clearing by day, then fend off polite-yet-hungry zombies by night.
          </p>

          {/* Primary Play CTA (-1 Ticket) + Guide CTA */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <button
              type="button"
              data-start="true"
              disabled={daily.tickets <= 0}
              onClick={(e) => {
                e.currentTarget.blur();
                onStartGame();
              }}
              className={`px-6 py-3.5 rounded-lg font-display font-bold text-base tracking-wide transition-transform duration-150 whitespace-nowrap shrink-0 ${
                daily.tickets > 0
                  ? 'bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#090d16] shadow-[0_6px_20px_rgba(245,158,11,0.35)] cursor-pointer'
                  : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
              }`}
            >
              {daily.tickets > 0
                ? `Play Run (-1 Ticket · ${daily.tickets} Left)`
                : 'No Tickets Left (0/3)'}
            </button>

            {daily.tickets <= 0 && daily.coins >= 50 && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRefillTicketWithCoins();
                }}
                className="px-4 py-3.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                Buy 1 Ticket (50 Coins)
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className="px-4 py-3.5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] text-[#e2dacb] border border-[#334155] font-medium text-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              How to Run &amp; Schema
            </button>
          </div>

          {/* Lantern Cosmetics & Title Customization Strip */}
          <div className="w-full max-w-lg p-3.5 rounded-xl bg-[#0d131c] border border-[#1e293b]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Lantern Glow Cosmetic
              </span>
              <span className="text-[11px] text-[#cbd5e1]">
                Active: <strong className="text-[#fbbf24]">{LANTERN_COSMETICS[daily.equippedLanternId]?.name}</strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.values(LANTERN_COSMETICS).map((item) => {
                const unlocked = daily.cosmetics.includes(item.id);
                const active = daily.equippedLanternId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onEquipLantern(item.id)}
                    title={unlocked ? item.name : `${item.name} (${item.unlockSource})`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1e293b] border-[#fbbf24] text-[#fef3c7] font-semibold cursor-pointer'
                        : unlocked
                        ? 'bg-[#131b26] border-[#334155] text-[#cbd5e1] hover:border-[#64748b] cursor-pointer'
                        : 'bg-[#090d14] border-[#1e293b] text-[#475569] opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.hexColor }}
                    />
                    <span>{item.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {daily.unlockedTitles.length > 1 && (
              <div className="mt-2.5 pt-2.5 border-t border-[#1e293b] flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#94a3b8]">Ranger Title:</span>
                {daily.unlockedTitles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onEquipTitle(t)}
                    className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                      daily.equippedTitle === t
                        ? 'bg-[#f59e0b] text-[#090d16] font-bold'
                        : 'bg-[#161f2c] text-[#cbd5e1] hover:bg-[#1e293b]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Canonical Concept Art Cast Strip */}
            <div className="mt-3 pt-2.5 border-t border-[#1e293b]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Canonical Character Cast (3D Models &amp; Portraits)
                </span>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-[11px] text-[#fbbf24] hover:underline cursor-pointer"
                >
                  Inspect Bestiary →
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenGuide}
                  title="Ranger Rue — Hero Scout (Lantern, Wooden Mallet, Pinched Hat & Rolled Mat)"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#131b26] hover:bg-[#1e293b] border border-[#f59e0b]/60 shrink-0 cursor-pointer transition-colors"
                >
                  <img
                    src={HERO_RUE_PORTRAIT_URL}
                    alt="Ranger Rue"
                    className="w-5 h-5 rounded object-cover"
                  />
                  <span className="text-[11px] font-semibold text-[#fef3c7]">Rue</span>
                </button>
                {CANONICAL_CAST.map((arch) => {
                  const spec = ZOMBIE_CATALOG[arch];
                  return (
                    <button
                      key={arch}
                      type="button"
                      onClick={onOpenGuide}
                      title={`${spec.name} (${spec.subtitle}): ${spec.specialTrait}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] shrink-0 cursor-pointer transition-colors"
                    >
                      {spec.portraitUrl && (
                        <img
                          src={spec.portraitUrl}
                          alt={spec.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                      )}
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: spec.badgeColor }}
                      >
                        {spec.name.replace('The ', '').replace('Old ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Daily Tasks, XP Level Progress & Streak Milestones Card */}
        <div className="lg:col-span-5 w-full">
          <div className="rounded-xl bg-[#0d131c] border border-[#334155] p-5 shadow-2xl">
            {/* Header: Daily Reset (00:00 UTC) & Ticket Refill Info */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
              <div>
                <h2 className="text-base font-display font-bold text-[#fef3c7]">
                  Daily Ranger Board ({daily.lastResetDateUTC} UTC)
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  Tickets refill to 3 at 00:00 UTC (no carry-over) · Next reset in{' '}
                  <span className="font-mono-tabular text-[#fbbf24] font-semibold">
                    {resetCountdown}
                  </span>
                </p>
              </div>
              <div className="text-right font-mono-tabular">
                <div className="text-xs text-[#94a3b8]">Tasks</div>
                <div className="text-sm font-bold text-[#4ade80]">
                  {completedCount} / {daily.tasks.length}
                </div>
              </div>
            </div>

            {/* 3 Daily Tasks List */}
            <div className="space-y-2.5 mb-4">
              {daily.tasks.map((task) => {
                const prog = daily.taskProgress[task.id] ?? 0;
                const done = prog >= task.target;
                const pct = Math.min(100, Math.round((prog / Math.max(1, task.target)) * 100));
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border ${
                      done
                        ? 'bg-[#11221c] border-[#22c55e]/50'
                        : 'bg-[#131b26] border-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-semibold ${done ? 'text-[#4ade80]' : 'text-[#fef3c7]'}`}>
                        {done ? '✓ ' : ''}
                        {task.title}
                      </span>
                      <span className="font-mono-tabular text-[#cbd5e1]">
                        {Math.round(prog)} / {task.target}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded bg-[#090d14] overflow-hidden mb-1">
                      <div
                        className={`h-full transition-all duration-200 ${
                          done ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono-tabular text-[#94a3b8]">
                      Reward: +{task.rewardCoins} Coins · +{task.rewardXp} XP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All 3 Daily Tasks Bonus */}
            <div className="p-2.5 rounded-lg bg-[#161f2c] border border-[#334155] text-xs flex items-center justify-between mb-4">
              <span className="text-[#e2dacb]">
                <strong>All 3 Tasks Bonus:</strong> +100 Coins, +120 XP &amp; +1 Ticket Tomorrow
              </span>
              <span className="font-mono-tabular font-bold text-[#fbbf24] ml-2 shrink-0">
                {daily.allTasksBonusClaimed ? 'Claimed!' : `${completedCount}/3`}
              </span>
            </div>

            {/* Player XP & Level Progress */}
            <div className="p-3 rounded-lg bg-[#131b26] border border-[#1e293b] mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#fef3c7]">
                  Level {levelInfo.level} Ranger ({daily.xp} Total XP)
                </span>
                <span className="font-mono-tabular text-[#fbbf24]">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-2 rounded bg-[#090d14] overflow-hidden mb-1">
                <div
                  className="h-full bg-[#38bdf8] transition-all duration-200"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                Next Unlock: <span className="text-[#cbd5e1]">{levelInfo.nextRewardLabel}</span>
              </div>
            </div>

            {/* Streak Milestones (3 / 7 / 30 Days) */}
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1">
              <span>
                Active Streak: <strong className="text-[#4ade80] font-mono-tabular">{daily.streak}d</strong>
              </span>
              <span className="font-mono-tabular">
                Milestones:{' '}
                <strong className={daily.streak >= 3 ? 'text-[#4ade80]' : 'text-[#64748b]'}>3d</strong>
                {' · '}
                <strong className={daily.streak >= 7 ? 'text-[#4ade80]' : 'text-[#64748b]'}>7d</strong>
                {' · '}
                <strong className={daily.streak >= 30 ? 'text-[#4ade80]' : 'text-[#64748b]'}>30d</strong>
              </span>
              {bestScore > 0 && (
                <span className="font-mono-tabular text-[#fbbf24]">
                  Best: {Math.round(bestScore)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Single flat borderless control-hint line in bottom safe margin */}
      <div className="w-full max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#cbd5e1] tracking-wide pointer-events-auto pt-3">
        <span>
          WASD / Arrows / Click Move · 1–6 Build &amp; Upgrade · Space Lantern Flare · Enter / N Start Night · P Pause
        </span>
        <span className="text-[#94a3b8] font-mono-tabular">
          UTC Daily Reset · 3 Tickets/Day Cap · LocalStorage Schema v1
        </span>
      </div>
    </div>
  );
};
