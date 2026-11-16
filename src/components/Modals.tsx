import React from 'react';
import { getLevelForXp, getTimeUntilNextUTCReset } from '../game/dailySystem';
import { HERO_RUE_PORTRAIT_URL, ZOMBIE_CATALOG } from '../game/rules';
import { HudSnapshot, ZombieArchetype } from '../game/types';

interface ModalsProps {
  hud: HudSnapshot;
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
  showGuide,
  onCloseGuide,
  onResume,
  onRestart,
  onReturnTitle,
  onOpenGuide,
  onFinishRunEarly,
  onRefillTicketWithCoins,
}) => {
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
              Camp Paused
            </h2>
            <p className="text-sm text-[#94a3b8] mb-4">
              Ranger Rue is catching a breath by the lantern.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4 p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">Day / Wave</div>
                <div className="text-lg font-mono-tabular font-bold text-[#fef3c7]">
                  {hud.dayNumber} / {hud.maxDays}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">Fort HP</div>
                <div className="text-lg font-mono-tabular font-bold text-[#4ade80]">
                  {Math.round(hud.fortHp)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#94a3b8]">Run Score</div>
                <div className="text-lg font-mono-tabular font-bold text-[#fbbf24]">
                  {Math.round(hud.score)}
                </div>
              </div>
            </div>

            {/* Live Daily Task Progress in Pause Menu */}
            <div className="mb-5 p-3 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b] mb-1.5">
                Daily Tasks ({completedTasksCount}/{daily.tasks.length})
              </div>
              <div className="space-y-1">
                {daily.tasks.map((t) => {
                  const p = daily.taskProgress[t.id] ?? 0;
                  const done = p >= t.target;
                  return (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className={done ? 'text-[#4ade80] font-semibold' : 'text-[#cbd5e1]'}>
                        {done ? '✓ ' : '· '}
                        {t.title}
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
                Resume Defense (P / Esc)
              </button>
              <button
                type="button"
                onClick={onFinishRunEarly}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-[#fef3c7] font-semibold text-xs cursor-pointer transition-colors"
              >
                End Run &amp; Claim XP / Streak Result Card
              </button>
              <button
                type="button"
                onClick={onOpenGuide}
                className="w-full py-2.5 px-4 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] text-[#e2dacb] font-medium text-xs cursor-pointer transition-colors"
              >
                How to Run, Schema &amp; Server Note
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={daily.tickets <= 0}
                  onClick={onRestart}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    daily.tickets > 0
                      ? 'bg-[#161f2c] hover:bg-[#1e293b] border-[#334155] text-[#cbd5e1] cursor-pointer'
                      : 'bg-[#090d14] border-[#1e293b] text-[#475569] cursor-not-allowed'
                  }`}
                >
                  Restart (-1 Ticket)
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="py-2 px-3 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-xs cursor-pointer transition-colors"
                >
                  Title Screen
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
                {hud.runOutcome === 'victory'
                  ? 'All 3 Nights Survived · Dawn Breaks!'
                  : 'Run Complete · Fort Report'}
              </span>
              <span className="text-xs font-mono-tabular text-[#94a3b8]">
                Run Time: {formatTime(hud.elapsedRunSeconds)}
              </span>
            </div>

            <h2
              id="gameover-modal-title"
              className="text-3xl font-display font-extrabold text-[#fef3c7] mb-1"
            >
              {hud.runOutcome === 'victory'
                ? 'Victory! Clearing Secured'
                : 'Bitten! Fort Overrun'}
            </h2>
            <p className="text-xs text-[#cbd5e1] mb-4">
              {hud.runOutcome === 'victory'
                ? 'Baron Blight bowed out dramatically and the shamblers wandered back to the swamp.'
                : 'Ranger Rue fought bravely with lantern and hammer before retreating to camp.'}
            </p>

            {/* Primary 4-Tile Result Strip: Score, XP Gained, Streak, Tickets Left */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Score</div>
                <div className="text-xl font-mono-tabular font-bold text-[#fbbf24]" data-testid="result-score">
                  {Math.round(hud.score)}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  Best: {Math.round(hud.bestScore)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">XP Gained</div>
                <div className="text-xl font-mono-tabular font-bold text-[#38bdf8]" data-testid="result-xp">
                  +{summary ? summary.xpGained : 0} XP
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  +{summary ? summary.coinsGained : 0} Coins
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Daily Streak</div>
                <div className="text-xl font-mono-tabular font-bold text-[#4ade80]" data-testid="result-streak">
                  {daily.streak} {daily.streak === 1 ? 'Day' : 'Days'}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  Milestones: 3/7/30d
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">Tickets Left</div>
                <div className="text-xl font-mono-tabular font-bold text-[#f59e0b]" data-testid="result-tickets">
                  {daily.tickets} / {daily.maxDailyTickets}
                </div>
                <div className="text-[10px] text-[#64748b] font-mono-tabular">
                  00:00 UTC Refill
                </div>
              </div>
            </div>

            {/* Level Progress Bar & Unlocks */}
            <div className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#fef3c7]">
                  Player Level {levelInfo.level} · {daily.equippedTitle}
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
                Next Level Reward: <span className="text-[#cbd5e1]">{levelInfo.nextRewardLabel}</span>
              </div>

              {summary && summary.newUnlocks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e293b] text-xs text-[#fbbf24] font-semibold">
                  New Unlocks Earned: {summary.newUnlocks.join(' · ')}
                </div>
              )}
            </div>

            {/* Daily Tasks Completed Summary */}
            <div className="p-3.5 rounded-lg bg-[#0b1016] border border-[#1e293b] mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold uppercase tracking-wider text-[#f59e0b]">
                  Daily Tasks Completed ({completedTasksCount} / {daily.tasks.length})
                </span>
                <span className="font-mono-tabular text-[11px] text-[#4ade80]">
                  {daily.allTasksBonusClaimed
                    ? 'All 3 Done! (+1 Ticket Tomorrow)'
                    : 'Complete all 3 for +1 Ticket Tomorrow'}
                </span>
              </div>
              <div className="space-y-1.5">
                {daily.tasks.map((task) => {
                  const prog = daily.taskProgress[task.id] ?? 0;
                  const done = prog >= task.target;
                  return (
                    <div key={task.id} className="flex items-center justify-between text-xs">
                      <span className={done ? 'text-[#4ade80] font-semibold' : 'text-[#cbd5e1]'}>
                        {done ? '✓ ' : '○ '}
                        {task.title}
                      </span>
                      <span className="font-mono-tabular text-[#94a3b8]">
                        {Math.round(prog)} / {task.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Re-Engagement Line ("Come back tomorrow") */}
            <div className="p-3 rounded-lg bg-[#161f2c] border border-[#334155] text-xs text-[#fef3c7] mb-5 flex items-center justify-between gap-2">
              <span>
                <strong>Come back tomorrow</strong> at 00:00 UTC (in {resetCountdown}) for 3 fresh tickets, new daily tasks, and to grow your {daily.streak}-day streak!
              </span>
              {daily.pendingBonusTicketsTomorrow > 0 && (
                <span className="font-mono-tabular text-[#4ade80] font-bold shrink-0">
                  +{daily.pendingBonusTicketsTomorrow} Bonus Queued
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
                  ? `Play Again (-1 Ticket · ${daily.tickets} Left)`
                  : 'No Tickets Left Today (0/3)'}
              </button>

              {daily.tickets <= 0 && daily.coins >= 50 && (
                <button
                  type="button"
                  onClick={onRefillTicketWithCoins}
                  className="py-3.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer whitespace-nowrap"
                >
                  Buy Ticket (50 Coins)
                </button>
              )}

              <button
                type="button"
                onClick={onReturnTitle}
                className="py-3.5 px-5 rounded-lg bg-[#161f2c] hover:bg-[#1e293b] border border-[#334155] text-[#cbd5e1] font-medium text-sm cursor-pointer transition-colors whitespace-nowrap"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Run, State Schema & Server Note Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(7, 10, 15, 0.9)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-xl bg-[#131b26] border border-[#334155] p-6 md:p-7 shadow-2xl text-[#f4efe6]">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4 mb-5">
              <div>
                <h2 id="guide-modal-title" className="text-2xl font-display font-bold text-[#fef3c7]">
                  Build or Bite — Zombie Bestiary, Daily Schema &amp; Guide
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  3D Forest Fort Defense · Tactical Undead Field Guide &amp; UTC Daily Progression
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseGuide}
                className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-sm font-medium text-[#e2dacb] cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>

            {/* Hero & Zombie Bestiary with Canonical Concept Art */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2.5">
                1. Hero &amp; Zombie Bestiary (Canonical Character Art &amp; Counters)
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
                      Ranger Rue <span className="text-xs font-normal text-[#cbd5e1]">· Player Hero (Field Craft &amp; Fort Defense)</span>
                    </span>
                    <span className="text-[10px] font-mono-tabular text-[#fef3c7] bg-[#161f2c] px-2 py-0.5 rounded border border-[#334155]">
                      Skill: Lantern Flare [Space]
                    </span>
                  </div>
                  <p className="text-xs text-[#e2dacb] leading-snug mb-1">
                    <strong className="text-[#fef3c7]">Reference Applied:</strong> Short stocky scout silhouette, spiky ginger hair under a pinched-crown ranger hat with silver shield badge, forest-green coat + 3-buckle brown leather vest, hip pocket compass, backpack with rolled cream sleeping mat, warm brass lantern (right hand), and faceted wooden mallet (left hand).
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
                  return (
                    <div
                      key={arch}
                      className="p-3 rounded-lg bg-[#0b1016] border border-[#1e293b] flex items-start gap-3"
                    >
                      {z.portraitUrl ? (
                        <img
                          src={z.portraitUrl}
                          alt={z.name}
                          className="w-14 h-14 rounded-lg object-cover border border-[#334155] shrink-0 bg-[#070b12]"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-lg border border-[#334155] shrink-0 bg-[#131b26] flex items-center justify-center font-display font-bold text-xs text-center px-1"
                          style={{ color: z.badgeColor }}
                        >
                          {z.name.split(' ')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className="font-display font-bold text-sm truncate"
                              style={{ color: z.badgeColor }}
                            >
                              {z.name}{' '}
                              <span className="text-[11px] font-normal text-[#94a3b8]">
                                · {z.subtitle}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono-tabular text-[#cbd5e1] bg-[#161f2c] px-1.5 py-0.5 rounded border border-[#334155] shrink-0">
                              {z.maxHp} HP
                              {z.armorHp ? ` + ${z.armorHp}A` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-[#e2dacb] leading-snug mb-1">
                            <strong className="text-[#fef3c7]">Behavior:</strong> {z.specialTrait}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#4ade80] leading-snug">
                          <strong>Counter:</strong> {z.tacticalCounter}
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
                1. LocalStorage State Schema (build_or_bite_daily_v1)
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

            {/* What Needs a Server Later Section */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2">
                2. What Needs a Real Server Later
              </h3>
              <ul className="space-y-1.5 text-xs text-[#e2dacb] list-disc pl-5">
                <li>
                  <strong>Authoritative UTC Clock &amp; Anti-Tamper Reset:</strong> Even using UTC dates (<code>new Date().toISOString()</code>), a client can change their OS system clock or edit <code>localStorage</code> directly. A backend must issue signed session timestamps and evaluate the <code>00:00 UTC</code> reset using server time.
                </li>
                <li>
                  <strong>Atomic Ticket Deduction &amp; Run Token Issuance:</strong> Starting a run should call <code>POST /api/runs/start</code> to atomically decrement <code>tickets</code> in the database and return a single-use <code>runId</code> nonce so players cannot refresh the tab to refund lost runs.
                </li>
                <li>
                  <strong>Server-Side Telemetry &amp; Streak/XP Validation:</strong> Submitting a run (<code>POST /api/runs/complete</code>) should verify plausible run duration, wave progression, and task deltas before awarding XP, Coins, and <code>3 / 7 / 30</code> day streak milestone rewards.
                </li>
                <li>
                  <strong>Cross-Device Account Sync:</strong> Persisting the schema in a cloud database (Firestore / PostgreSQL) tied to authenticated user accounts so cosmetics, titles, and streaks sync across mobile and desktop browsers.
                </li>
              </ul>
            </div>

            {/* Controls Reference */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f59e0b] mb-2">
                3. Controls Reference
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0b1016] p-3.5 rounded-lg border border-[#1e293b]">
                <div><strong className="text-[#fbbf24]">WASD / Arrows / Click:</strong> Move &amp; gather</div>
                <div><strong className="text-[#fbbf24]">Spacebar:</strong> Cast Lantern Flare (slow + knockback)</div>
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
