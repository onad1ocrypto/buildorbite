# Build or Bite

**A 3D dark-comedy forest-fort defense game: build by day, survive the night.**

> **Status:** playable web prototype with an initial Reddit Devvit Web integration. The Devvit client/server build compiles; Reddit identity-scoped Redis saves and server-side daily ticket checks are implemented, but the app has not yet been playtested in Reddit or reviewed against event submission rules. It is **not ready for submission yet**.

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

The Devvit client bootstraps from a Redis profile namespaced to Reddit's server-provided user ID and syncs the daily game save back to the server. The server separately counts run starts by Reddit user and UTC date and enforces the three-ticket daily cap; the browser cannot reset that counter or select another user's key. No username/password or external database login is used. Other gameplay rewards and save fields are still submitted by the client, so they are persistent and account-scoped but are not yet fully server-authoritative. Reddit playtesting remains unfinished.

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
npx tsx --test src/game/dailySystem.test.ts src/game/rules.test.ts src/game/i18n.test.ts
npm run build
npm run build:devvit
```

`npm run build:devvit` builds the Devvit client/server app. `npm run playtest:devvit` requires a Reddit developer login and a test subreddit; it has not been run from this workspace.

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

The project is intended for a Reddit event. The repository now has a minimal Devvit Web packaging scaffold, but the full game-state integration and Reddit playtest are still pending. The current scaffold does not imply that the app has been uploaded, privately playtested, approved, or published. Confirm the specific event's submission and publication rules before release.
