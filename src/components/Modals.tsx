import React from 'react';
import { getLevelForXp, getTimeUntilNextUTCReset } from '../game/dailySystem';
import {
  LanguageCode,
  TRANSLATIONS,
} from '../game/i18n';
import { HERO_RUE_PORTRAIT_URL, ZOMBIE_CATALOG } from '../game/rules';
import { HudSnapshot, ZombieArchetype } from '../game/types';

interface ModalsProps {
  hud: HudSnapshot;
  devTestMode: boolean;
  showDevTestControl: boolean;
  lang: LanguageCode;
  showGuide: boolean;
  onCloseGuide: () => void;
  onResume: () => void;
  onRestart: () => void;
  onStartDevTestRun: () => void;
  onClaimDailyCheckIn: () => void;
  onReturnTitle: () => void;
  onOpenGuide: () => void;
  onFinishRunEarly: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  hud,
  devTestMode,
  showDevTestControl,
  lang,
  showGuide,
  onCloseGuide,
  onResume,
  onRestart,
  onStartDevTestRun,
  onClaimDailyCheckIn,
  onReturnTitle,
  onOpenGuide,
  onFinishRunEarly,
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
  const todayUTC = daily.lastResetDateUTC;
  const checkInClaimedToday = daily.lastCheckInClaimedDateUTC === todayUTC;
  const checkInReady =
    !checkInClaimedToday &&
    (daily.checkInEligibleDateUTC === todayUTC || daily.lastPlayedDateUTC === todayUTC);

  return (
    <>
      {/* Pause Modal */}
      {hud.screen === 'paused' && !showGuide && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[#131b26]/90 border border-[#334155] p-5 sm:p-6 shadow-2xl text-[#f4efe6]">
            {/* Header + Click-to-Open Language Dropdown */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 id="pause-modal-title" className="text-xl font-display font-bold text-[#fef3c7]">
                  {tr.campPausedTitle}
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  {tr.campPausedDesc}
                </p>
              </div>


            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-3.5 p-3 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.dayWaveLabel}
                </div>
                <div className="text-base font-mono-tabular font-bold text-[#fef3c7]">
                  {hud.dayNumber} / {hud.maxDays}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.fortHpLabel}
                </div>
                <div className="text-base font-mono-tabular font-bold text-[#4ade80]">
                  {Math.round(hud.fortHp)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.runScoreLabel}
                </div>
                <div className="text-base font-mono-tabular font-bold text-[#fbbf24]">
                  {Math.round(hud.score)}
                </div>
              </div>
            </div>

            {/* Live Daily Task Progress in Pause Menu */}
            <div className="mb-4 p-3 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] mb-1.5">
                📋 {tr.tasksLabel} ({completedTasksCount}/{daily.tasks.length})
              </div>
              <div className="space-y-1">
                {daily.tasks.map((t) => {
                  const p = daily.taskProgress[t.id] ?? 0;
                  const done = p >= t.target;
                  const locTitle = tr.translateTaskTitle(t.id, t.title);
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
                className="w-full py-2.5 px-4 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-sm cursor-pointer transition-colors"
              >
                {tr.resumeDefenseBtn}
              </button>
              <button
                type="button"
                onClick={onFinishRunEarly}
                className="w-full py-2 px-4 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-[#fef3c7] font-semibold text-xs cursor-pointer transition-colors"
              >
                {tr.endRunEarlyBtn}
              </button>
              {showDevTestControl && !devTestMode && (
                <button
                  type="button"
                  data-testid="btn-pause-dev-test-run"
                  onClick={onStartDevTestRun}
                  className="w-full py-2 px-4 rounded-lg bg-[#581c87] hover:bg-[#6b21a8] border border-[#c084fc] text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  🧪 Demo / Test Run (No Ticket · Isolated Sandbox)
                </button>
              )}
              <button
                type="button"
                onClick={onOpenGuide}
                className="w-full py-2 px-4 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] text-[#e2dacb] font-medium text-xs cursor-pointer transition-colors"
              >
                {tr.howToRunBtn}
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={daily.tickets <= 0 && !devTestMode}
                  onClick={onRestart}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    daily.tickets > 0 || devTestMode
                      ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#cbd5e1] cursor-pointer'
                      : 'bg-[#090d14] border-[#1e293b] text-[#475569] cursor-not-allowed'
                  }`}
                >
                  {tr.restartBtn}
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="py-2 px-2 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-xs cursor-pointer transition-colors"
                >
                  {tr.titleScreenBtn}
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
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.58)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-modal-title"
        >
          <div className="w-full max-w-2xl rounded-xl bg-[#131b26]/90 border border-[#334155] p-5 sm:p-6 shadow-2xl text-[#f4efe6] my-auto">
            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-semibold text-[#f59e0b]">
                  {hud.runOutcome === 'victory' ? tr.victoryHeaderBadge : tr.defeatHeaderBadge}
                </span>
                {summary?.isDevTestMode && (
                  <span
                    data-testid="result-dev-test-badge"
                    className="px-2 py-0.5 rounded bg-[#581c87] border border-[#c084fc] text-[10px] font-mono-tabular font-bold text-white"
                  >
                    🧪 DEMO / TEST RUN
                  </span>
                )}
              </div>
              <span className="text-xs font-mono-tabular text-[#94a3b8]">
                {tr.runTimeLabel(formatTime(hud.elapsedRunSeconds))}
              </span>
            </div>

            <h2
              id="gameover-modal-title"
              className="text-2xl sm:text-3xl font-display font-extrabold text-[#fef3c7] mb-1"
            >
              {hud.runOutcome === 'victory' ? tr.victoryTitle : tr.defeatTitle}
            </h2>
            <p className="text-xs text-[#94a3b8] mb-3">
              {hud.runOutcome === 'victory' ? tr.victoryDesc : tr.defeatDesc}
            </p>

            {/* Primary 4-Tile Result Strip: Score, XP Gained, Streak, Tickets Left */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5 p-3 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.scoreLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#fbbf24]" data-testid="result-score">
                  {Math.round(hud.score)}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  {tr.bestScoreLabel} {Math.round(hud.bestScore)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.xpGainedLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#38bdf8]" data-testid="result-xp">
                  +{summary ? summary.xpGained : 0} XP
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  +{summary ? summary.coinsGained : 0} Coins
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.dailyStreakLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#4ade80]" data-testid="result-streak">
                  {daily.streak}d
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  {tr.milestonesLabel} 3d / 7d / 30d
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                  {tr.ticketsLeftLabel}
                </div>
                <div className="text-xl font-mono-tabular font-bold text-[#f59e0b]" data-testid="result-tickets">
                  {daily.tickets} / {daily.maxDailyTickets}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  00:00 UTC
                </div>
              </div>
            </div>

            {/* Daily Check-In Reward Card (Revealed after first completed run of the UTC day) */}
            <div
              data-testid="result-daily-checkin"
              className="p-3 rounded-lg bg-[#0b1016] border border-[#f59e0b]/60 mb-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
            >
              <div>
                <div className="text-xs font-display font-bold text-[#fbbf24]">
                  🎁 {tr.dailyCheckInTitle}
                </div>
                <div className="text-[11px] text-[#cbd5e1]">
                  {checkInClaimedToday
                    ? tr.dailyCheckInClaimedLabel
                    : checkInReady
                    ? tr.dailyCheckInReadyDesc
                    : tr.dailyCheckInPlayFirstDesc}
                </div>
              </div>
              {checkInReady && (
                <button
                  type="button"
                  data-testid="btn-claim-daily-checkin"
                  onClick={onClaimDailyCheckIn}
                  className="px-3.5 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] font-display font-bold text-xs cursor-pointer shrink-0 shadow-md"
                >
                  {tr.dailyCheckInClaimBtn}
                </button>
              )}
            </div>

            {/* Level Progress Bar & Unlocks */}
            <div className="p-3 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-3.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#fef3c7]">
                  {tr.playerLevelLabel(levelInfo.level, daily.equippedTitle)}
                </span>
                <span className="font-mono-tabular text-[#38bdf8]">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded bg-[#131b26] overflow-hidden mb-1">
                <div
                  className="h-full bg-[#38bdf8] transition-all duration-300"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                {tr.nextLevelRewardLabel}{' '}
                <span className="text-[#cbd5e1]">{levelInfo.nextRewardLabel}</span>
              </div>

              {summary && summary.newUnlocks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e293b] text-xs text-[#fbbf24] font-semibold">
                  {tr.newUnlocksEarnedLabel}: {summary.newUnlocks.join(' · ')}
                </div>
              )}
            </div>

            {devTestMode ? (
              <div className="p-3 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-3.5 text-xs text-[#cbd5e1]">
                Daily tasks are available in real play only. Demo runs do not change task progress or rewards.
              </div>
            ) : (
              <>
            {/* Daily Tasks Completed Summary */}
            <div className="p-3 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-3.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold uppercase tracking-wider text-[#f59e0b]">
                  {tr.dailyTasksCompletedTitle(completedTasksCount, daily.tasks.length)}
                </span>
                <span className="font-mono-tabular text-[11px] text-[#4ade80]">
                  {daily.allTasksBonusClaimed ? tr.allThreeDoneMsg : tr.completeAllThreeMsg}
                </span>
              </div>
              <div className="space-y-1">
                {daily.tasks.map((task) => {
                  const prog = daily.taskProgress[task.id] ?? 0;
                  const done = prog >= task.target;
                  const locTitle = tr.translateTaskTitle(task.id, task.title);
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

              </>
            )}

            {/* 3-Way Persistence & Reset Breakdown (Saved Permanently vs Resets For Run vs Locked Until 00:00 UTC) */}
            <div
              data-testid="result-persistence-breakdown"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3.5 text-left"
            >
              <div className="p-2.5 rounded-lg bg-[#0d1f18] border border-[#22c55e]/50">
                <div className="text-[10.5px] font-bold text-[#4ade80] mb-0.5">
                  {tr.savedPermanentlyTitle}
                </div>
                <div className="text-[10px] text-[#cbd5e1] leading-snug">
                  {tr.savedPermanentlyDesc}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0b1016] border border-[#38bdf8]/40">
                <div className="text-[10.5px] font-bold text-[#38bdf8] mb-0.5">
                  {tr.resetsNextRunTitle}
                </div>
                <div className="text-[10px] text-[#cbd5e1] leading-snug">
                  {tr.resetsNextRunDesc}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#1c160d] border border-[#f59e0b]/50">
                <div className="text-[10.5px] font-bold text-[#fbbf24] mb-0.5">
                  {tr.lockedUntilUtcTitle}
                </div>
                <div className="text-[10px] text-[#cbd5e1] leading-snug">
                  {tr.lockedUntilUtcDesc}
                </div>
              </div>
            </div>

            {/* Re-Engagement Line */}
            <div className="p-2.5 rounded-lg bg-[#161f2c] border border-[#334155] text-xs text-[#fef3c7] mb-4 flex items-center justify-between gap-2">
              <span>{tr.comeBackTomorrowMsg(resetCountdown, daily.streak)}</span>
              {daily.pendingBonusTicketsTomorrow > 0 && (
                <span className="font-mono-tabular text-[#4ade80] font-bold shrink-0">
                  {tr.bonusQueuedLabel(daily.pendingBonusTicketsTomorrow)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-start="true"
                disabled={daily.tickets <= 0 && !devTestMode}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-display font-bold text-sm sm:text-base transition-colors whitespace-nowrap ${
                  daily.tickets > 0 || devTestMode
                    ? 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#090d16] cursor-pointer'
                    : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {devTestMode
                  ? '🧪 DEMO / TEST RUN (No Ticket)'
                  : daily.tickets > 0
                  ? tr.playAgainBtn(daily.tickets)
                  : tr.noTicketsBtn(daily.maxDailyTickets)}
              </button>

              {showDevTestControl && !devTestMode && (
                <button
                  type="button"
                  data-testid="btn-result-dev-test-run"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onStartDevTestRun();
                  }}
                  className="py-3 px-4 rounded-lg bg-[#581c87] hover:bg-[#6b21a8] border border-[#c084fc] text-white font-display font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  🧪 Demo / Test Run (No Ticket)
                </button>
              )}

              <button
                type="button"
                onClick={onReturnTitle}
                className="py-3 px-4 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-xs sm:text-sm cursor-pointer transition-colors whitespace-nowrap"
              >
                {tr.titleScreenBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Run, State Schema & Bestiary Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.58)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-xl bg-[#131b26]/90 border border-[#334155] p-6 md:p-7 shadow-2xl text-[#f4efe6]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-4 mb-5">
              <div>
                <h2 id="guide-modal-title" className="text-2xl font-display font-bold text-[#fef3c7]">
                  {tr.guideModalTitle}
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  {tr.guideModalSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onCloseGuide}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-sm font-medium text-[#e2dacb] cursor-pointer"
                >
                  {tr.closeLabel}
                </button>
              </div>
            </div>

            {/* Hero & Zombie Bestiary with Canonical Concept Art */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2.5">
                {tr.bestiarySectionTitle}
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
                      Ranger Rue
                    </span>
                    <span className="text-[10px] font-mono-tabular text-[#fef3c7] bg-[#161f2c] px-2 py-0.5 rounded border border-[#334155]">
                      Lantern Flare [Space]
                    </span>
                  </div>
                  <p className="text-xs text-[#e2dacb] leading-snug mb-1">
                    {tr.tagline}
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
                            {zLoc.specialTrait}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#4ade80] leading-snug">
                          {zLoc.tacticalCounter}
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
                2. State Schema (build_or_bite_daily_v1 · Schema v3)
              </h3>
              <pre className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] text-xs font-mono-tabular text-[#cbd5e1] overflow-x-auto">
{`interface DailyPersistenceState {
  schemaVersion: 3;                 // Migrates cleanly from v1/v2 with idempotent ticket cap
  tickets: number;                  // max(0, 3 - ticketsUsedTodayUTC); resets to 3 at 00:00 UTC
  ticketsUsedTodayUTC: number;      // Authoritative count of standard tickets spent today (0..3)
  maxDailyTickets: 3;               // Unused tickets do NOT roll over
  pendingBonusTicketsTomorrow: 0;   // Disabled to keep normal players strictly capped at 3/day
  coins: number;                    // Earned from tasks, runs, check-in, level-ups & milestones
  xp: number;                       // Cumulative player XP
  level: number;                    // Unlocks Lantern colors, titles & Tool Tier 2 at Lv 3+
  toolTier: number;                 // 1 (Base) -> 2 (15% faster construction at Level 3+)
  streak: number;                   // +1 on first completed run per UTC day
  bestStreak: number;
  lastResetDateUTC: string;         // Strict UTC "YYYY-MM-DD" for ticket & task reset
  lastPlayedDateUTC: string | null;
  tasks: DailyTaskItem[];           // 3 core daily tasks per UTC date
  taskProgress: Record<string, number>;
  allTasksBonusClaimed: boolean;
  dailyProgressionLocked: boolean;  // Locks farming/building after 3/3 tasks until 00:00 UTC
  savedPads: SavedPadState[];       // Persistent fort buildings & upgrade paths across runs/days
  savedFenceSegments: SavedFenceState[]; // Persistent outer fence segments across runs/days
  savedResources: { wood: number; stone: number; food: number }; // Persistent resource wallet
  checkInEligibleDateUTC: string | null;
  lastCheckInClaimedDateUTC: string | null;
}`}
              </pre>
            </div>

            {/* Controls Reference */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2">
                {tr.controlsSectionTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0b1016] p-3.5 rounded-lg border border-[#1e293b]">
                <div><strong className="text-[#fbbf24]">WASD / Arrows / Click:</strong> {tr.controlMoveDesc}</div>
                <div><strong className="text-[#fbbf24]">Spacebar:</strong> {tr.controlFlareDesc}</div>
                <div><strong className="text-[#fbbf24]">Keys 1–6:</strong> {tr.controlBuildDesc}</div>
                <div><strong className="text-[#fbbf24]">Enter / N / P:</strong> {tr.controlNightDesc}</div>
                <div className="sm:col-span-2"><strong className="text-[#fbbf24]">Mouse Wheel / Pinch:</strong> {tr.controlZoomDesc}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
