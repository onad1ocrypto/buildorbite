# Build or Bite

**A 3D dark-comedy forest-fort defense game: build by day, survive the night.**

> **Status:** playable web prototype with a Reddit Devvit Web integration. Reddit identity-scoped Redis saves, server-side daily ticket checks, and server-calculated XP/coin/task/check-in rewards are implemented, with fort layout/resource snapshots still client-submitted. A Devvit playtest install succeeded in `r/playthisgames` (v0.0.1.1); that install does not create a playable post automatically. A moderator-only subreddit menu action is included to create the game post. Its inline entrypoint uses the game's original title-logo asset and a Start Run button. Pressing it starts a server-authorized run (spending one daily ticket) in the expanded game view. App Directory review/publication and event-rule checks are not confirmed, so this is **not yet confirmed ready for submission**.

## Game overview

**Build or Bite** is set in a spooky forest clearing. During the day, Ranger Rue gathers wood, stone, and food, then builds and upgrades the fort. At night, waves of cartoonish undead attack. Survive the final night to win; if the fort is destroyed, the run ends in defeat.

The intended tone is spooky but funny. The game supports desktop keyboard/mouse and touch interaction.

## How to play

### Day
- Move with **WASD / arrow keys**, click to move, or touch-drag on the ground.
- Gather wood, stone, and food from resource nodes.
- Build, upgrade, repair, or salvage fort structures using the pads and menus.
- Use **Enter** or **N** to start the night early.
- Daytime weather cycles through clear, rain, and fog. The weather indicator can also be used to cycle conditions.

### Night
- Undead attack the fort and its structures.
- The hero and defensive structures fight automatically.
- Use **Space** or the Flare button to cast Lantern Flare; it has a cooldown.
- Survive the waves through the final night.

**Controls:** WASD/arrows = move · click/touch = interact or move · Space = Lantern Flare · Enter/N = start night early · P/Esc = pause

## Current features

- Three-day day/night survival loop.
- Six building types: Palisade Wall, Watchtower, Spike Trap, Campfire, Catapult, and Guard Tent; each has two upgrade paths.
- Nine undead archetypes, including Baron Blight, with a boss health display.
- Dynamic daytime weather: clear, rain, and fog affect the environment and resource gathering/regrowth.
- Daily tickets, daily tasks, XP/levels, streaks, check-in rewards, and persistent fort progression.
- Responsive 3D scene, sound effects, and multiple UI languages.

## Daily tickets and progression

- A normal player has **at most 3 tickets per UTC day**. A standard run costs 1 ticket.
- Tickets reset at **00:00 UTC**; unused tickets do not carry over.
- Three daily tasks are selected for each UTC day. Completing all three grants the configured task bonus and locks further daily progression activities (such as gathering, building, upgrading, repairing, and salvaging) until the next UTC reset. Combat is not part of that lock.
- Demo/Test Run is a development/preview testing tool, not a player-facing Free Play mode. It spends no tickets, bypasses the daily progression lock for testing, and writes its test fort separately from the normal save. It is intended to be unavailable in Production.
- A **new local profile** starts at **0 XP / Level 1**. Existing browser saves are migrated to preserve recorded progression, so an old saved level can remain visible in that browser.

## Save data and limitations

The current standalone web game stores player progression in browser `localStorage` (including `build_or_bite_daily_v1`). This is local to the browser/site origin, is not an account system, and is not authoritative against client-side tampering. New local profiles start at 0 XP / Level 1; migration preserves progression from older browser saves.

The Devvit client bootstraps from a Redis profile namespaced to Reddit's server-provided user ID. The server counts run starts per player and UTC date, enforces the three-ticket cap, and calculates XP, coins, daily task rewards, streaks, and check-in rewards. Client profile saves cannot set those progression fields; run rewards are bounded and run/event requests are idempotency-protected. Fort layout and resource-wallet snapshots are still client-submitted save data with basic bounds, not a server-simulated economy. No username/password or external database login is used. Reddit playtesting remains unfinished.

## Technology

- React 19, TypeScript, and Vite
- Three.js for 3D rendering
- Tailwind CSS

The standalone game still runs as a Vite SPA. A separate Vite configuration builds the Devvit post client and Hono server. Express and `@google/genai` remain listed as dependencies but are not used by the current game features.

## Local development

Requirements: Node.js and npm.

```bash
npm install --legacy-peer-deps
npm run dev
```

Vite serves the app at `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npx tsx --test src/server/playerPolicy.test.ts src/game/dailySystem.test.ts src/game/rules.test.ts src/game/i18n.test.ts
npm run build
npm run build:devvit
```

`npm run build:devvit` builds the Devvit client/server app. `npm run playtest:devvit -- <subreddit>` requires a Reddit developer login and test subreddit. After installing/updating the playtest, a subreddit moderator must open the subreddit menu and select **Create Build or Bite post**; this creates the interactive post separately from the installation. Confirm the post is visible and playable in Reddit before capturing gameplay or treating the playtest as complete.

## Repository layout

```text
buildorbite/
├── index.html
├── package.json
├── devvit.json               # Reddit post/server entrypoints
├── vite.config.ts             # standalone web app
├── vite.config.devvit.ts      # Devvit Web build
├── public/assets/aistudio/    # game title and character artwork
└── src/
    ├── App.tsx
    ├── client/                # Devvit webview entrypoint
    ├── components/            # screens, HUD, modals, boss health bar
    ├── game/                  # simulation, rules, daily system, i18n, audio, tests
    └── server/                # Devvit Redis profile and ticket API
```

## Reddit event direction

The project is intended for a Reddit event. A playtest install alone does not prove that a game post exists or works. Do not claim App Directory approval or publication unless confirmed in the Developer Portal; verify the specific event's submission and publication rules before release.
