# Prompt 6 — Persistent Fort, Daily Progression, and Post-Task Play

Work on the latest user-authored version of the **Build or Bite** prototype in the GitHub repository. Before editing, inspect the current branch and its existing daily-system, persistence, task, construction, outcome, result-screen, and localization code. Do not overwrite newer user work or revert recent internationalization/navigation changes.

## Goal

Make the player's fort feel worth building by preserving completed buildings and upgrades across daily cycles, while limiting resource farming and construction to the active daily-progression window. When today's core daily tasks are finished, the player must still have a way to play for fun instead of hitting a dead end.

## Confirmed gameplay rules

### Persistent fort
- Preserve the player's built structures and their upgrade levels between runs and across daily resets. This includes structure type, placement/pad, upgrade path/level, and built fence-segment levels.
- Do not silently reset or remove the fort after defeating the boss, completing daily tasks, returning to the title screen, or starting a new run.
- Persist state using the prototype's existing persistence approach and add a schema version/migration if needed. Do not introduce a new backend or begin Devvit porting as part of this task.
- Preserve the player's current resource wallet across the daily lock/reset unless the existing design already has a clearly documented different rule. Daily locks must prevent earning/spending resources on construction, not delete resources the player already owns.
- Reset only run-specific state when a new run starts (for example, active zombies, projectiles, wave/day-in-run timers, temporary effects, and score). Restore persistent structures to full HP when a new daily cycle begins; combat damage must not permanently erase a player's saved upgrades.

### Daily progression and lock
- Keep the existing daily reset boundary at **00:00 UTC**. Show the countdown/next reset using the existing UI/localization patterns.
- While the current day's core tasks are not all complete, allow the existing resource gathering, building, upgrading, and repair actions subject to their normal costs and rules.
- As soon as all core daily tasks are complete, immediately lock **new resource gathering, building, upgrades, repairs, and salvage/demolition** until the next UTC daily reset. Enforce this in the game-action handlers/rules as well as in the UI; hiding or visually disabling a button alone is not sufficient.
- Do not lock hero movement, combat, Lantern Flare, defense, or already-built structures' normal operation.
- Do not automatically reset the fort or send the player back to a fresh base when the task set is complete. Show a clear message that today's construction progression is complete, the fort has been saved, and free play remains available.
- On the next daily reset, refresh daily tasks and reopen gathering/building/upgrading while keeping the saved fort and current resource wallet.

### Free Play / Demo after today's core tasks
- Provide a clearly labeled **Free Play** or **Demo** option after the daily progression lock.
- Free Play must let the player continue using the saved fort and hero combat/defense loop without farming or upgrading. Do not grant resource drops, construction progress, daily-ticket rewards, or repeatable XP from unlimited combat.
- Free Play must not consume another daily ticket unless the current product design explicitly requires a ticket; if tickets are consumed today, explain this in the UI before entry.
- Keep any existing victory/result screen intact; do not silently auto-restart after victory. The result screen must make clear which progress was saved and what resets only for the next run.

### Login reward and optional extras
- Reveal today's **Daily Check-In** reward after the player's first completed run of the UTC day, whether that run ended in victory or defeat. It should not require winning or completing all daily tasks.
- Allow the check-in reward to be claimed only once per UTC date. Persist the claim so refresh/restart cannot claim it repeatedly.
- Make the reward small and non-power-based (for example, modest XP/coins or a cosmetic-progress contribution); it must not bypass the daily gathering/build/upgrade lock.
- Optional bonus tasks may grant small XP, but they must be finite and capped per day. They must not grant farming resources or permanent combat power after the core daily tasks are complete.
- A community/subreddit task must be optional. Do not claim that a player joined a subreddit merely because they clicked a button. Use only a verifiable, supported Reddit-native action if one is already available; otherwise show it as an optional community invitation without a reward. Do not add external links or make community membership a gameplay requirement.

### Construction timer balance
- More advanced structures/upgrades may take longer to construct than basic ones, and show the expected duration before the player starts.
- A tool upgrade must not make ordinary construction slower. Prefer a modest construction-speed benefit from a better tool, while higher-tier structures can still take longer overall. Keep durations readable and capped; do not make waiting feel punitive.
- Preserve the existing day/night rule: construction and upgrades are unavailable at night; Rue remains playable in combat.

## UX and localization
- Keep all new player-facing text in the project's existing localization/i18n system; do not hard-code English-only UI strings if translations are supported.
- Use the existing result screen to clearly separate:
  1. **Saved permanently:** fort layout/upgrades, daily account progression, claimed check-in, XP/coins/unlocks.
  2. **Resets for a new run:** enemies, projectiles, temporary run score/effects, and run timers.
  3. **Locked until next UTC day:** resource gathering and construction actions after all core daily tasks are complete.
- Do not change the title **Build or Bite**, character art, layout, or unrelated systems.

## Implementation guardrails
- Inspect the latest GitHub code before editing; report its exact starting commit.
- Do not make unrequested decisions about the daily task count, resource costs, structure catalog, ticket economy, or enemy balance.
- If the code cannot meet a rule without an unresolved balance choice, stop and ask the user rather than inventing a rule.
- Keep changes focused. Add persistence migration/error handling so older saved state remains loadable; invalid/missing fort state should fall back safely without wiping valid daily progression.

## Acceptance tests
Add or update tests that verify:
1. Built structures, fence segments, placement, and upgrade levels survive title return, run restart, and daily reset.
2. Daily reset refreshes tasks and unlocks gathering/building/upgrading while preserving the fort and resource wallet.
3. Completing all core tasks locks gathering/build/upgrade/repair/salvage in both UI and action logic, but leaves hero movement/combat/defense available.
4. Free Play cannot farm resources or generate unlimited XP/tickets/upgrades.
5. Daily Check-In is granted only after the first completed run each UTC date, for either victory or defeat, and cannot be claimed twice.
6. Victory/result display does not auto-reset the fort; reset happens only when the player chooses a new run.
7. Construction timers match the stated balance and remain bounded.

Run typecheck, relevant tests, and production build. Finish with a concise report listing the starting commit, files changed, persistence/reset behavior, test results, and any unresolved questions. Do not claim visual validation unless you actually ran and visually checked the game.
