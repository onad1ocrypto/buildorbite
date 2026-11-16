# PROMPT 2 — Add the daily system to "Build or Bite"

Add a daily retention & progression system to the existing **Build or Bite** game. Implement it, document the state schema, and note what will need a real server later.

## 1. Tickets
- The player gets **3 tickets per day**. Each run costs **1 ticket**.
- Tickets refill at the **daily reset (00:00 UTC)**.
- Unused tickets do **not** carry over (cap at 3).

## 2. Daily tasks
- Each day, show **3 daily tasks** drawn from a pool, e.g.:
  - "Score 800+ in one run"
  - "Collect 20 wood"
  - "Use Lantern Flare 5 times"
  - "Build 5 buildings"
  - "Survive 2 nights in a row"
- Tasks refresh at the daily reset.
- Completing all 3 grants a **bonus** (e.g., +1 ticket tomorrow, or coins).

## 3. XP & player level
- Award XP per run (score + bonuses).
- Define level thresholds; each level unlocks a reward (new building, lantern color, or character variant).

## 4. Streak
- Streak **+1** if the player completes at least 1 run that day; otherwise it **resets**.
- Show the streak on the result card.
- Milestone rewards at **3 / 7 / 30** days.

## 5. Rewards & persistence
- Reward types: **tickets, coins, cosmetics (lantern colors), titles**.
- Persist state in **localStorage** for now, with a clear schema, e.g.:
  `tickets, xp, level, streak, lastPlayedDateUTC, tasks[], taskProgress, cosmetics[]`
- Handle the "day" using a **UTC date** (not device clock) to avoid timezone exploits.

## 6. Result card / re-engagement
- One end screen only, showing: result, score, XP gained, level progress, streak, tickets left, tasks completed, and a "Come back tomorrow" line.

## 7. Output format
- The implemented code changes.
- The exact state schema.
- A short "what needs a server later" note (e.g., server-side ticket/streak verification).
