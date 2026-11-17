# Build or Bite

**A 3D dark-comedy forest-fort defense game: build by day, survive the night.**

> **Status:** playable web prototype. The current repository is a React + Vite browser game; a Reddit Devvit build has not yet been implemented.

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

The current web prototype stores player progression in browser `localStorage` (including `build_or_bite_daily_v1`). This is local to the browser/site origin, is not an account system, and is not authoritative against client-side tampering. The game does not currently have username/password authentication or a server-backed player database.

Before using persistent player accounts in a Reddit/Devvit build, the game will need a separate Devvit integration and server-side persistence design. The Devvit version is **planned, not implemented in this repository**.

## Technology

- React 19, TypeScript, and Vite
- Three.js for 3D rendering
- Tailwind CSS

The repository currently runs as a Vite SPA. Although Express and `@google/genai` are listed as dependencies, there is no active Express backend or Gemini API feature in the current game code.

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
```

## Repository layout

```text
buildorbite/
├── index.html
├── package.json
├── vite.config.ts
├── public/assets/aistudio/   # game title and character artwork
└── src/
    ├── App.tsx
    ├── components/           # screens, HUD, modals, boss health bar
    └── game/                 # simulation, rules, daily system, i18n, audio, tests
```

## Reddit event direction

The project is intended for a Reddit event, but this repository is not yet a Devvit app. A future Devvit version must be implemented and reviewed against the event's current rules before submission. No claim is made here that the app has been uploaded, privately playtested, approved, or published.
