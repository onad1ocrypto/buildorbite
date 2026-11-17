# Prompt 7 — Resolve AI Studio Sync Carefully and Make QA Testing Usable

You are working in my **current Google AI Studio project** for Build or Bite. I cannot use the other preview environment reliably, and syncing has caused confusion. Start by inspecting the actual AI Studio workspace and the latest GitHub `main` before editing. At the time this prompt was written, GitHub included commit `6a99038` (`dev: add test-only bypass for daily progression lock`), but check the current remote head rather than assuming it is still latest.

## First: prevent sync loss

1. Report the AI Studio workspace version/branch or available source state, the latest GitHub commit, and the files that differ or conflict.
2. Treat the current AI Studio workspace as my active working copy. Preserve all changes I made there, even if GitHub differs.
3. Do not replace whole files, reset/rebase over my work, or blindly copy GitHub files into AI Studio. Reconcile only the necessary code sections and preserve unrelated changes, including recent localization/i18n, title-screen, art, and persistent-fort work.
4. If a conflict cannot be safely resolved from the code, stop and ask me which version to keep. Do not push, deploy to Vercel, or publish anything.

## What the ticket/task rules mean

There are two separate systems:

- **Production daily tickets:** ordinary players receive 3 tickets per UTC day. Keep this rule and its reset behavior unchanged.
- **Daily progression lock:** after all 3 core daily tasks are complete, production players cannot gather resources, build, upgrade, repair, or salvage until the next 00:00 UTC reset. Existing fort/building progress remains saved. Combat and the existing Free Play/Demo behavior remain as currently designed.

A player may have many **development/playtest tickets**. Ticket count alone must not remove the production daily-task lock. The test mode requested below is only for development and must not alter production rules.

## Make a visible QA test mode that works in AI Studio Preview

The current GitHub implementation uses a development-only `?devTest=1` URL parameter. I cannot reliably use the other preview or manage a sync-conflict workflow around that URL. Replace or supplement the query-only activation with an obvious, easy-to-use **Test Run** control that is visible in the AI Studio development preview, guarded so it cannot be enabled in a production build. Do not require me to edit a URL manually.

- The Test Run starts a standard playable run without consuming tickets, even if the visible ticket count is zero.
- In Test Run only, bypass the `dailyProgressionLocked` restrictions so I can repeatedly test resource gathering, building, upgrading, repairing, and salvaging after the 3 daily tasks are complete.
- Preserve normal day/night rules: building/gathering restrictions that are unrelated to the daily-task lock (such as night-time construction restrictions) remain in force.
- Keep combat, zombie waves, the fort, existing persistence, and normal gameplay operational.
- Do not award or mutate production progression from Test Runs: no daily-task progress/rewards, XP, coins, streaks, check-in rewards, tickets, or production unlocks. Do not let Test Run completion overwrite or corrupt the player's normal daily profile. Prefer an isolated test save/profile for Test Run fort/resources; if that would require a broad persistence redesign, stop and ask before proceeding.
- Clearly label the active mode as **DEV TEST** and make it clear that tickets are not spent and daily progression rules are bypassed only for testing.
- If AI Studio Preview does not expose a reliable development-only environment signal, do not weaken the production guard. Explain the limitation and ask me before choosing another guard.

## Scope guardrails

- Work only in the current AI Studio project; do not modify my unrelated workspace files.
- Do not change the game's title, game balance, 3-ticket production rule, daily tasks, UTC reset, current production lock, art, map, or character designs.
- Do not add external services, connect new apps, deploy to Vercel, or begin Devvit porting.
- Keep all existing supported translations intact. New developer-only labels may be English, but must never appear in production.

## Validation and handoff

1. Add tests proving the test control is development-only, does not consume tickets or change production progression, and allows the locked resource/build actions only in Test Run.
2. Run the project's typecheck, relevant tests, and production build.
3. Verify that a production build ignores the Test Run control/override and still enforces 3 tickets/day plus the 3/3-task lock.
4. Tell me exactly how to start Test Run from the AI Studio Preview, which files you changed, what you preserved from each version, and the validation results. Do not claim visual verification unless you actually opened and inspected the AI Studio preview.
