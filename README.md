# Build or Bite

**A 3D dark-comedy forest fort defense game — build by day, survive the night.**

> ⚠️ **Status: prototype / work in progress.** This project is an early playable prototype and is **not finished**. Gameplay balance, content, and platform integration are still being developed.

---

## Overview

**Build or Bite** is a 3D browser game set in a clearing in a spooky forest. By **day**, you gather resources (wood, stone, food) and build up your fort — walls, towers, traps, campfires and catapults. By **night**, waves of "polite-yet-terrifying" zombies shamble in from the treeline. Survive all the waves to win; if the fort's health reaches zero, you lose.

Sessions are short (about **3 minutes**) and are designed for a **daily play habit**: a small, repeatable loop you can return to every day.

**Who it is for:** players who enjoy light strategy, base building, and spooky-but-funny characters. The game is **all-ages / SFW** (no gore) and runs in the browser on **desktop and mobile**.

## How to play

**Day phase (build)**
- Move with **WASD / arrow keys** or **click/tap** to walk.
- Collect resources from nodes in the forest.
- Place and upgrade buildings on the building pads.
- Press **Enter / N** to start the night early.

**Night phase (defend)**
- Zombies attack from the forest edges and target your walls and fort.
- Your towers and hero defend automatically.
- Use the **Lantern Flare** skill (**Space**) to slow and knock back zombies — it has a cooldown.
- Survive every wave to win.

**Controls:** WASD/arrows = move · mouse/tap = interact · **Space** = skill · **Enter/N** = start night · **P/Esc** = pause

## Features

- **Day/night core loop** — build, then defend.
- **6 building types** (palisade wall, watchtower, spike trap, campfire, catapult, guard tent) with **2 upgrade paths** each.
- **6 enemy types** — including **Shamble**, **The Grinner**, **Old Grumble**, **Gawp**, **Brine**, and the boss **Baron Blight**.
- **Hero** with an active skill.
- **Daily system** — 3 tickets per day, 3 daily tasks, XP + player level, streaks, and rewards.
- **Low-poly 3D art** with a warm lantern-lit night mood.
- **Sound effects** and responsive controls for desktop and mobile.

## Daily system (prototype)

- **Tickets:** 3 per day; each run costs 1. Tickets refill at the **daily reset (00:00 UTC)**.
- **Daily tasks:** 3 tasks drawn from a pool, refreshed daily; completing all 3 grants a bonus.
- **XP & levels:** earn XP per run; levels unlock rewards (buildings, cosmetics, variants).
- **Streaks:** complete at least 1 run per day to keep your streak; milestones at 3 / 7 / 30 days.
- **Persistence:** currently stored in the browser's `localStorage` (prototype only).

> **Note:** the current daily system is **client-side** and not secure against tampering. A production version must verify tickets, tasks, and streaks **server-side**.

## Technology

- **React 19 + TypeScript + Vite**
- **Three.js** (3D rendering)
- **Tailwind CSS**
- **Express** (server)
- **Google Gemini API** (`@google/genai`) for optional AI features

## Local setup

1. Install **Node.js** (and **Bun** or npm).
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run the dev server:
   ```bash
   bun run dev
   ```
   The app is served at `http://localhost:3000`.
4. (Optional) create a `.env` file based on `.env.example` and set `GEMINI_API_KEY` for AI features.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Enables AI features (Gemini API). |
| `APP_URL` | Optional | Public URL of the app (used for links/callbacks). |

## Repository structure

```
buildorbite/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── assets/aistudio/      # original design prompts
└── src/
    ├── App.tsx
    ├── components/           # GameCanvas, HudOverlay, Modals, TitleScreen
    └── game/                 # models, rules, dailySystem, types, audio + tests
```

## Planned platform (Reddit Devvit)

This prototype is a standalone web app. The intended final version will be ported to **Reddit Devvit Web**:

- `src/client` (Three.js webview) + `src/server` (`/api/` endpoints)
- `devvit.json` configuration
- Daily state (tickets, XP, streak, tasks) moved to **Redis**
- Daily posting via the **scheduler**
- Telemetry via **Devvit Journeys**

Per the hackathon rules, the app will be **uploaded privately and playtested** — **not published** — until the hackathon concludes.

## Hackathon submission (planned)

- **App listing:** (pending Devvit upload)
- **Demo post:** `r/playthisgames` (pending)
- **Repository:** private for now, to avoid plagiarism before submission.
