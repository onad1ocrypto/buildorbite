import React from 'react';
import {
  getLevelForXp,
  getTimeUntilNextUTCReset,
  LANTERN_COSMETICS,
} from '../game/dailySystem';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../game/i18n';
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
  lang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
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
  lang,
  onSelectLanguage,
}) => {
  const tr = TRANSLATIONS[lang];
  const levelInfo = getLevelForXp(daily.xp);
  const completedCount = daily.tasks.filter(
    (t) => (daily.taskProgress[t.id] ?? 0) >= t.target
  ).length;
  const resetCountdown = getTimeUntilNextUTCReset();

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-10 pointer-events-none overflow-y-auto"
      style={{
        background:
          'linear-gradient(95deg, rgba(8,12,18,0.92) 0%, rgba(8,12,18,0.74) 48%, rgba(8,12,18,0.22) 100%)',
      }}
    >
      {/* Top Bar: Language Selector (English Primary + Indonesia, Chinese, Vietnamese, Russian) */}
      <div className="w-full max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-2 pointer-events-auto pb-2">
        <div
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d131c]/95 border border-[#334155] shadow-lg"
          data-testid="title-language-selector"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mr-1">
            🌐 Language:
          </span>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const active = lang === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                data-testid={`lang-btn-${opt.code}`}
                onClick={() => onSelectLanguage(opt.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#f59e0b] text-[#090d16] font-bold shadow'
                    : 'bg-[#161f2c] text-[#cbd5e1] hover:bg-[#1e293b] border border-[#334155]'
                }`}
              >
                {opt.shortLabel} · {opt.nativeName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Left Brand & Start CTA + Right Daily Retention & Progression Hub */}
      <div className="w-full max-w-[1320px] mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center pointer-events-auto">
        {/* Left 7 Columns: Title Emblem, Player Rank, Description, Primary CTA & Lantern Cosmetics */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Player Profile Strip (Ranger Rue Portrait, Level, Title, Streak, Coins, Daily Tickets) */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5 text-xs text-[#cbd5e1]">
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
              {tr.streakHeader(daily.streak, daily.bestStreak)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-[#38bdf8]">
              {tr.coinsHeader(daily.coins)}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className="font-mono-tabular font-bold text-[#f59e0b]"
              data-testid="title-tickets"
            >
              {tr.dailyTicketsHeader(daily.tickets, daily.maxDailyTickets)}
            </span>
          </div>

          {/* Custom Uploaded Build or Bite Title Logo Image */}
          <div className="mb-3 w-full max-w-[300px] sm:max-w-[430px]">
            <img
              src="/assets/aistudio/build-or-bite-title-removebg-preview_49acf47a.png"
              alt="Build or Bite — 3D Forest Fort Defense"
              data-testid="title-logo-img"
              className="w-full h-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.88)] select-none"
            />
          </div>

          {/* One-line description */}
          <p
            data-testid="title-tagline"
            className="text-xs sm:text-sm md:text-base text-[#e2dacb] font-medium leading-relaxed mb-4 max-w-md"
          >
            {tr.tagline}
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
                ? tr.playRunBtn(daily.tickets)
                : tr.noTicketsBtn(daily.maxDailyTickets)}
            </button>

            <button
              type="button"
              data-testid="btn-add-tickets"
              onClick={(e) => {
                e.currentTarget.blur();
                onRefillTicketWithCoins();
              }}
              className="px-4 py-3.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0 shadow-md"
            >
              {tr.addReviewTicketsBtn}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenGuide();
              }}
              className="px-4 py-3.5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] text-[#e2dacb] border border-[#334155] font-medium text-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              {tr.howToRunBtn}
            </button>
          </div>

          {/* Lantern Cosmetics & Title Customization Strip */}
          <div className="w-full max-w-lg p-3.5 rounded-xl bg-[#0d131c] border border-[#1e293b]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                {tr.lanternCosmeticTitle}
              </span>
              <span className="text-[11px] text-[#cbd5e1]">
                {tr.activeLabel}:{' '}
                <strong className="text-[#fbbf24]">
                  {tr.translateLanternName(
                    daily.equippedLanternId,
                    LANTERN_COSMETICS[daily.equippedLanternId]?.name ?? ''
                  )}
                </strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.values(LANTERN_COSMETICS).map((item) => {
                const unlocked = daily.cosmetics.includes(item.id);
                const active = daily.equippedLanternId === item.id;
                const locName = tr.translateLanternName(item.id, item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onEquipLantern(item.id)}
                    title={unlocked ? locName : `${locName} (${item.unlockSource})`}
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
                    <span>{locName.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {daily.unlockedTitles.length > 1 && (
              <div className="mt-2.5 pt-2.5 border-t border-[#1e293b] flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#94a3b8]">{tr.rangerTitleLabel}:</span>
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
                  {tr.canonicalCastTitle}
                </span>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-[11px] text-[#fbbf24] hover:underline cursor-pointer"
                >
                  {tr.inspectBestiaryBtn}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenGuide}
                  title="Ranger Rue"
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
                  const zLoc = tr.zombies[arch];
                  return (
                    <button
                      key={arch}
                      type="button"
                      onClick={onOpenGuide}
                      title={`${zLoc.name} (${zLoc.subtitle}): ${zLoc.specialTrait}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#131b26] hover:bg-[#1e293b] border border-[#334155] shrink-0 cursor-pointer transition-colors"
                    >
                      {spec.portraitUrl && (
                        <img
                          src={spec.portraitUrl}
                          alt={zLoc.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                      )}
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: spec.badgeColor }}
                      >
                        {zLoc.name.replace('The ', '').replace('Old ', '')}
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
                  {tr.dailyBoardTitle(daily.lastResetDateUTC)}
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  {tr.dailyResetSubtitle(resetCountdown)}
                </p>
              </div>
              <div className="text-right font-mono-tabular">
                <div className="text-xs text-[#94a3b8]">{tr.tasksLabel}</div>
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
                const locTitle = tr.translateTaskTitle(task.id, task.title);
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
                        {locTitle}
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
                      {tr.rewardLabel(task.rewardCoins, task.rewardXp)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All 3 Daily Tasks Bonus */}
            <div className="p-2.5 rounded-lg bg-[#161f2c] border border-[#334155] text-xs flex items-center justify-between mb-4">
              <span className="text-[#e2dacb]">
                <strong>{tr.allTasksBonusTitle}:</strong> {tr.allTasksBonusDesc}
              </span>
              <span className="font-mono-tabular font-bold text-[#fbbf24] ml-2 shrink-0">
                {daily.allTasksBonusClaimed ? tr.claimedLabel : `${completedCount}/3`}
              </span>
            </div>

            {/* Player XP & Level Progress */}
            <div className="p-3 rounded-lg bg-[#131b26] border border-[#1e293b] mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#fef3c7]">
                  {tr.levelRangerLabel(levelInfo.level, daily.xp)}
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
                {tr.nextUnlockLabel}: <span className="text-[#cbd5e1]">{levelInfo.nextRewardLabel}</span>
              </div>
            </div>

            {/* Streak Milestones (3 / 7 / 30 Days) */}
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1">
              <span>
                {tr.activeStreakLabel}: <strong className="text-[#4ade80] font-mono-tabular">{daily.streak}d</strong>
              </span>
              <span className="font-mono-tabular">
                {tr.milestonesLabel}:{' '}
                <strong className={daily.streak >= 3 ? 'text-[#4ade80]' : 'text-[#64748b]'}>3d</strong>
                {' · '}
                <strong className={daily.streak >= 7 ? 'text-[#4ade80]' : 'text-[#64748b]'}>7d</strong>
                {' · '}
                <strong className={daily.streak >= 30 ? 'text-[#4ade80]' : 'text-[#64748b]'}>30d</strong>
              </span>
              {bestScore > 0 && (
                <span className="font-mono-tabular text-[#fbbf24]">
                  {tr.bestScoreLabel}: {Math.round(bestScore)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Single flat borderless control-hint line in bottom safe margin */}
      <div className="w-full max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#cbd5e1] tracking-wide pointer-events-auto pt-3">
        <span>{tr.controlsFooter}</span>
        <span className="text-[#94a3b8] font-mono-tabular">{tr.schemaFooter}</span>
      </div>
    </div>
  );
};
