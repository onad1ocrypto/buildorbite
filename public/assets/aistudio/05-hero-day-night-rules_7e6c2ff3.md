# Prompt 5 — Hero Rules: Build by Day, Fight by Night

Update the existing **Build or Bite** game prototype. Implement only the player-hero action rules described below. First inspect the current codebase and reuse its existing phase/state system, action handlers, UI patterns, and terminology. Do not replace or redesign unrelated game systems.

## Locked gameplay rule

- **Day / Build phase:** Ranger Rue can place/build and upgrade available structures, including palisade fence segments and weapons/support buildings, using the game's existing costs and placement rules.
- **Night / Defense phase:** Ranger Rue cannot place/build, upgrade, or move a structure. The hero's role is to join the defense: the player can still move Rue, use the existing melee attack, and use existing combat skills/abilities, subject to their existing cooldowns and rules.
- Structures that were completed before night remain in place and continue their existing behavior. Do not remove, disable, or reset them when night begins.
- When the game changes from day to night, stop offering new construction/upgrade actions immediately. Do not let keyboard, mouse, touch, hotkeys, or direct action calls bypass the restriction.
- When the game returns to day, restore building and upgrade actions according to existing resource, placement, and phase rules.

## UX requirements

- Keep the current game UI and art direction. Do not redesign the HUD.
- During night, make build/upgrade controls clearly unavailable (disabled or otherwise visibly locked using existing UI conventions). If a player tries to use one, show a brief, clear in-game message in English, such as **“Night has fallen — defend the fort!”** Do not show repeated messages continuously while a button is held.
- During day, keep existing build/upgrade controls available and retain their current feedback for insufficient resources or invalid placement.
- Make the current phase/action availability clear enough that players understand they should fight at night and prepare/build during the day.

## Scope guardrails

- Do not change the day/night duration, wave schedule, zombie stats, hero movement/combat balance, available structures, construction costs, map layout, art assets, or save/daily systems.
- Do not introduce a new repair action, emergency building, build timer, extra currency, or new rule not specified above.
- Do not change unrelated names, story, or game text. All new player-facing text must be in English.
- Preserve the existing code style and architecture. Avoid broad refactors.

## Validation

1. Add or update automated tests for the phase restriction: building and upgrading are accepted during day and rejected during night; combat actions remain available at night; existing structures persist across the day-to-night transition.
2. Run the project's typecheck and relevant tests. Fix errors caused by this change.
3. Summarize the exact files changed and test results. Do not claim visual/gameplay validation unless you actually ran the game and checked it.
