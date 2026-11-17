import React from 'react';
import { getLevelForXp, getTimeUntilNextUTCReset } from '../game/dailySystem';
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  TRANSLATIONS,
} from '../game/i18n';
import { HERO_RUE_PORTRAIT_URL, ZOMBIE_CATALOG } from '../game/rules';
import { HudSnapshot, ZombieArchetype } from '../game/types';

interface ModalsProps {
  hud: HudSnapshot;
  lang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  showGuide: boolean;
  onCloseGuide: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenGuide: () => void;
  onFinishRunEarly: () => void;
  onRefillTicketWithCoins: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  hud,
  lang,
  onSelectLanguage,
  showGuide,
  onCloseGuide,
  onResume,
  onRestart,
  onReturnTitle,
  onOpenGuide,
  onFinishRunEarly,
  onRefillTicketWithCoins,
}) => {
  const tr = TRANSLATIONS[lang];
  const formatTime = (sec: number) => {
    const total = Math.max(0, Math.round(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const daily = hud.daily;
  const summary = hud.lastRunSummary;
  const levelInfo = getLevelForXp(daily.xp);
  const completedTasksCount = daily.tasks.filter(
    (t) => (daily.taskProgress[t.id] ?? 0) >= t.target
  ).length;
  const resetCountdown = getTimeUntilNextUTCReset();

  return (
    <>
      {/* Pause Modal */}
      {hud.screen === 'paused' && !showGuide && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.84)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[#131b26] border border-[#334155] p-6 shadow-2xl text-[#f4efe6]">
            <h2 id="pause-modal-title" className="text-2xl font-display font-bold text-[#fef3c7] mb-1">
              {tr.ui.pauseTitle}
            </h2>
            <p className="text-sm text-[#94a3b8] mb-3">
              {tr.ui.pauseSubtitle(hud.dayNumber, hud.maxDays, Math.round(hud.fortHp), hud.fortMaxHp)}
            </p>

            {/* 5-Language Switcher inside Pause Modal */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <span className="text-[11px] font-bold text-[#94a3b8] mr-1">
                🌐 {tr.ui.languageLabel}:
              </span>
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => onSelectLanguage(opt.code)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    lang === opt.code
                      ? 'bg-[#f59e0b] text-[#090d16] font-bold'
                      : 'bg-[#161f2c] text-[#cbd5e1] hover:bg-[#1e293b]'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">Day / Wave</div>
                <div className="text-lg font-mono-tabular font-bold text-[#fef3c7]">
                  {hud.dayNumber} / {hud.maxDays}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">{tr.ui.fortHp}</div>
                <div className="text-lg font-mono-tabular font-bold text-[#4ade80]">
                  {Math.round(hud.fortHp)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">{tr.ui.score}</div>
                <div className="text-lg font-mono-tabular font-bold text-[#fbbf24]">
                  {Math.round(hud.score)}
                </div>
              </div>
            </div>

            {/* Live Daily Task Progress in Pause Menu */}
            <div className="mb-5 p-3 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] mb-1.5">
                {tr.ui.tasksLabel} ({completedTasksCount}/{daily.tasks.length})
              </div>
              <div className="space-y-1">
                {daily.tasks.map((t) => {
                  const p = daily.taskProgress[t.id] ?? 0;
                  const done = p >= t.target;
                  const locTitle = tr.dailyTaskTitles[t.id] ?? t.title;
                  return (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className={done ? 'text-[#4ade80] font-semibold' : 'text-[#cbd5e1]'}>
                        {done ? '✓ ' : '· '}
                        {locTitle}
                      </span>
                      <span className="font-mono-tabular text-[#94a3b8]">
                        {Math.round(p)}/{t.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3 px-4 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-base cursor-pointer transition-colors"
              >
                {tr.ui.resumeBtn}
              </button>
              <button
                type="button"
                onClick={onFinishRunEarly}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-[#fef3c7] font-semibold text-xs cursor-pointer transition-colors"
              >
                {tr.ui.finishRunBtn}
              </button>
              <button
                type="button"
                onClick={onOpenGuide}
                className="w-full py-2.5 px-4 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] text-[#e2dacb] font-medium text-xs cursor-pointer transition-colors"
              >
                {tr.ui.bestiaryGuideBtn}
              </button>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  disabled={daily.tickets <= 0}
                  onClick={onRestart}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    daily.tickets > 0
                      ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#cbd5e1] cursor-pointer'
                      : 'bg-[#090d14] border-[#1e293b] text-[#475569] cursor-not-allowed'
                  }`}
                >
                  {tr.ui.restartRunBtn(daily.tickets)}
                </button>
                <button
                  type="button"
                  onClick={onRefillTicketWithCoins}
                  className="py-2 px-2.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  {tr.ui.addReviewTicketsBtn}
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="py-2 px-2.5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-xs cursor-pointer transition-colors"
                >
                  {tr.ui.returnTitleBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONE UNIFIED END SCREEN RESULT CARD (gameover) */}
      {hud.screen === 'gameover' && !showGuide && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.88)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-modal-title"
        >
          <div className="w-full max-w-xl rounded-xl bg-[#131b26] border border-[#334155] p-6 md:p-7 shadow-2xl text-[#f4efe6] my-auto">
            {/* Result Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#f59e0b]">
                {hud.runOutcome === 'victory' ? tr.ui.victoryBanner : tr.ui.defeatBanner}
              </span>
              <span className="text-xs font-mono-tabular text-[#94a3b8]">
                {formatTime(hud.elapsedRunSeconds)}
              </span>
            </div>

            <h2
              id="gameover-modal-title"
              className="text-3xl font-display font-extrabold text-[#fef3c7] mb-3"
            >
              {hud.runOutcome === 'victory' ? tr.ui.victoryHeadline : tr.ui.defeatHeadline}
            </h2>

            {/* Primary 4-Tile Result Strip: Score, XP Gained, Streak, Tickets Left */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.finalScoreLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#fbbf24]" data-testid="result-score">
                  {Math.round(hud.score)}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  {tr.ui.best}: {Math.round(hud.bestScore)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">XP</div>
                <div className="text-xl font-mono-tabular font-bold text-[#38bdf8]" data-testid="result-xp">
                  +{summary ? summary.xpGained : 0} XP
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  +{summary ? summary.coinsGained : 0} {tr.ui.coins}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.streak}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#4ade80]" data-testid="result-streak">
                  {daily.streak}d
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  {tr.ui.milestonesLabel}: 3/7/30d
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.ui.ticketsLeftLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#f59e0b]" data-testid="result-tickets">
                  {daily.tickets} / {daily.maxDailyTickets}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  00:00 UTC
                </div>
              </div>
            </div>

            {/* Level Progress Bar & Unlocks */}
            <div className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#fef3c7]">
                  {tr.ui.levelRangerLabel(levelInfo.level, daily.xp)} · {daily.equippedTitle}
                </span>
                <span className="font-mono-tabular text-[#38bdf8]">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded bg-[#131b26] overflow-hidden mb-1.5">
                <div
                  className="h-full bg-[#38bdf8] transition-all duration-300"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                {tr.ui.nextUnlockLabel}: <span className="text-[#cbd5e1]">{levelInfo.nextRewardLabel}</span>
              </div>

              {summary && summary.newUnlocks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e293b] text-xs text-[#fbbf24] font-semibold">
                  {summary.newUnlocks.join(' · ')}
                </div>
              )}
            </div>

            {/* Daily Tasks Completed Summary */}
            <div className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold uppercase tracking-wider text-[#f59e0b]">
                  {tr.ui.dailyTaskProgressHeader} ({completedTasksCount} / {daily.tasks.length})
                </span>
                <span className="font-mono-tabular text-[11px] text-[#4ade80]">
                  {daily.allTasksBonusClaimed ? tr.ui.claimedLabel : `${completedTasksCount}/3`}
                </span>
              </div>
              <div className="space-y-1.5">
                {daily.tasks.map((task) => {
                  const prog = daily.taskProgress[task.id] ?? 0;
                  const done = prog >= task.target;
                  const locTitle = tr.dailyTaskTitles[task.id] ?? task.title;
                  return (
                    <div key={task.id} className="flex items-center justify-between text-xs">
                      <span className={done ? 'text-[#4ade80] font-semibold' : 'text-[#cbd5e1]'}>
                        {done ? '✓ ' : '○ '}
                        {locTitle}
                      </span>
                      <span className="font-mono-tabular text-[#94a3b8]">
                        {Math.round(prog)} / {task.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Re-Engagement Line */}
            <div className="p-3 rounded-lg bg-[#161f2c] border border-[#334155] text-xs text-[#fef3c7] mb-5 flex items-center justify-between gap-2">
              <span>
                {tr.ui.nextResetInLabel}: <strong className="text-[#fbbf24] font-mono-tabular">{resetCountdown}</strong>
              </span>
              {daily.pendingBonusTicketsTomorrow > 0 && (
                <span className="font-mono-tabular text-[#4ade80] font-bold shrink-0">
                  +{daily.pendingBonusTicketsTomorrow} Bonus
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-start="true"
                disabled={daily.tickets <= 0}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className={`flex-1 py-3.5 px-5 rounded-lg font-display font-bold text-base transition-colors whitespace-nowrap ${
                  daily.tickets > 0
                    ? 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] cursor-pointer'
                    : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {daily.tickets > 0
                  ? tr.ui.playAgainBtn(daily.tickets)
                  : tr.ui.noTicketsRemainingBtn}
              </button>

              <button
                type="button"
                onClick={onRefillTicketWithCoins}
                className="py-3.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer whitespace-nowrap"
              >
                {tr.ui.addReviewTicketsBtn}
              </button>

              <button
                type="button"
                onClick={onReturnTitle}
                className="py-3.5 px-5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-sm cursor-pointer transition-colors whitespace-nowrap"
              >
                {tr.ui.titleHubBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Run, State Schema & Bestiary Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.9)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-xl bg-[#131b26] border border-[#334155] p-6 md:p-7 shadow-2xl text-[#f4efe6]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-4 mb-5">
              <div>
                <h2 id="guide-modal-title" className="text-2xl font-display font-bold text-[#fef3c7]">
                  {tr.ui.guideModalTitle}
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  {tr.ui.guideModalSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0b1016] border border-[#334155]">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => onSelectLanguage(opt.code)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold cursor-pointer ${
                        lang === opt.code
                          ? 'bg-[#f59e0b] text-[#090d16]'
                          : 'text-[#cbd5e1] hover:bg-[#1e293b]'
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onCloseGuide}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-sm font-medium text-[#e2dacb] cursor-pointer"
                >
                  {tr.ui.guideCloseBtn}
                </button>
              </div>
            </div>

            {/* Hero & Zombie Bestiary with Canonical Concept Art */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2.5">
                1. {tr.ui.tabBestiary}
              </h3>

              {/* Hero Reference Card: Ranger Rue */}
              <div className="p-3.5 rounded-xl bg-[#0b1016] border border-[#f59e0b]/50 flex flex-col sm:flex-row items-center gap-3.5 mb-3">
                <img
                  src={HERO_RUE_PORTRAIT_URL}
                  alt="Ranger Rue Concept Art"
                  className="w-16 h-16 rounded-xl object-cover border border-[#f59e0b] shrink-0 bg-[#070b12]"
                />
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm text-[#fbbf24]">
                      Ranger Rue{' '}
                      <span className="text-xs font-normal text-[#cbd5e1]">
                        · {tr.ui.heroSubtitle}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono-tabular text-[#fef3c7] bg-[#161f2c] px-2 py-0.5 rounded border border-[#334155]">
                      Skill: Lantern Flare [Space]
                    </span>
                  </div>
                  <p className="text-xs text-[#e2dacb] leading-snug mb-1">
                    {tr.ui.heroDescription}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(
                  [
                    'shamble',
                    'grinner',
                    'grumble',
                    'gawp',
                    'brine',
                    'baron',
                    'swift_stumbler',
                    'armored_undead',
                    'bone_howler',
                  ] as ZombieArchetype[]
                ).map((arch) => {
                  const z = ZOMBIE_CATALOG[arch];
                  const zLoc = tr.zombies[arch];
                  return (
                    <div
                      key={arch}
                      className="p-3 rounded-lg bg-[#0b1016] border border-[#1e293b] flex items-start gap-3"
                    >
                      {z.portraitUrl ? (
                        <img
                          src={z.portraitUrl}
                          alt={zLoc.name}
                          className="w-14 h-14 rounded-lg object-cover border border-[#334155] shrink-0 bg-[#070b12]"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-lg border border-[#334155] shrink-0 bg-[#131b26] flex items-center justify-center font-display font-bold text-xs text-center px-1"
                          style={{ color: z.badgeColor }}
                        >
                          {zLoc.name.split(' ')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className="font-display font-bold text-sm truncate"
                              style={{ color: z.badgeColor }}
                            >
                              {zLoc.name}{' '}
                              <span className="text-[11px] font-normal text-[#94a3b8]">
                                · {zLoc.subtitle}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono-tabular text-[#cbd5e1] bg-[#161f2c] px-1.5 py-0.5 rounded border border-[#334155] shrink-0">
                              {z.maxHp} HP
                              {z.armorHp ? ` + ${z.armorHp}A` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-[#e2dacb] leading-snug mb-1">
                            <strong className="text-[#fef3c7]">{tr.ui.traitLabel}:</strong>{' '}
                            {zLoc.specialTrait}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#4ade80] leading-snug">
                          <strong>{tr.ui.counterLabel}:</strong> {zLoc.tacticalCounter}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* State Schema Section */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2">
                2. {tr.ui.tabSchema} (build_or_bite_daily_v1)
              </h3>
              <pre className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] text-xs font-mono-tabular text-[#cbd5e1] overflow-x-auto">
{`interface DailyPersistenceState {
  schemaVersion: 1;
  tickets: number;                  // Refills to 3 at 00:00 UTC (unused do NOT carry over)
  maxDailyTickets: number;          // 3
  pendingBonusTicketsTomorrow: number; // +1 earned when completing all 3 daily tasks
  coins: number;                    // Earned from tasks, runs, level-ups & streak milestones
  xp: number;                       // Cumulative player XP
  level: number;                    // Unlocks Lantern colors & Ranger titles at Lv 2, 3, 4, 5
  streak: number;                   // +1 on first completed run per UTC day; resets if day missed
  bestStreak: number;
  lastResetDateUTC: string;         // Strict UTC "YYYY-MM-DD" for ticket & task reset
  lastPlayedDateUTC: string | null; // Strict UTC "YYYY-MM-DD" for streak verification
  tasks: DailyTaskItem[];           // 3 daily tasks drawn deterministically per UTC date
  taskProgress: Record<string, number>;
  allTasksBonusClaimed: boolean;
  cosmetics: string[];              // Unlocked lantern colors (e.g. "amber_default", "emerald_bog")
  equippedLanternId: string;
  unlockedTitles: string[];
  equippedTitle: string;
  claimedStreakMilestones: number[]; // [3, 7, 30] day milestone claims
}`}
              </pre>
            </div>

            {/* Controls Reference */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2">
                3. {tr.ui.tabHowToRun}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0b1016] p-3.5 rounded-lg border border-[#1e293b]">
                <div><strong className="text-[#fbbf24]">WASD / Arrows / Click:</strong> Move &amp; gather</div>
                <div><strong className="text-[#fbbf24]">Spacebar:</strong> Cast Fire Lantern Flare (Night only · slow + knockback)</div>
                <div><strong className="text-[#fbbf24]">Keys 1–6:</strong> Build or choose Upgrade Path A/B</div>
                <div><strong className="text-[#fbbf24]">Enter / N / P:</strong> Start Night early [N] · Pause [P]</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
