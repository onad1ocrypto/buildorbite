# PROMPT 1 — Build the 3D game "Build or Bite"

You are a senior game developer. Build a complete, playable 3D browser game called **Build or Bite** using **Three.js**. Output the full runnable code plus a short "how to run" note.

## 1. Concept
- **Genre:** 3D tower-defense / base-builder with dark-comedy tone (scary but funny).
- **Setting:** a clearing in a spooky forest.
- **Core loop:** **Build by day → Defend by night.**
- **Session length:** ~3 minutes per run.
- **Camera:** isometric / top-down 3/4 view (fixed ~45° tilt). Do NOT use a follow camera. Camera may pan/zoom slightly but must keep the whole fort readable.

## 2. Characters (low-poly, big expressions, exaggerated animation)
- **Ranger Rue (player):** short, stocky forest ranger. Lantern in left hand, hammer in right. Palette: forest green, bark brown, lantern orange. Slightly scared but hiding it.
- **Zombies (scary-funny):**
  - **Shamble** — slow, lost, keeps asking for directions.
  - **The Grinner** — permanent huge smile, friendly wave, still terrifying.
  - **Old Grumble** — striped pajamas, complains about the cold.
  - **Gawp** — stuck in a fence, cheerful, refuses to leave.
  - **Brine** — dripping swamp zombie, leaves a slime trail.
  - **Boss: Baron Blight** — theatrical, dramatic speeches before attacking.

## 3. Day phase (build)
- Move Rue with **WASD / arrow keys** and **click-to-move**; on mobile, **tap-to-move**.
- Gather resources (**wood / stone / food**) from nodes in the forest.
- Build and upgrade on placement pads: **palisade wall, watchtower, spike trap, campfire, catapult, guard tent**.
- Each building has **2 upgrade paths** (player chooses).
- Day timer ~60–90 seconds, then night begins automatically. Allow starting night early (**Enter / N**).

## 4. Night phase (defend)
- Waves of zombies enter from the forest edges and attack walls/fort.
- Defenses (towers + Rue) attack automatically.
- Rue skill: **Lantern Flare** (Space) — slows and lightly knocks back zombies in a radius; has a cooldown.
- **Win:** survive all waves. **Lose:** fort HP reaches 0.
- Night camera: slight zoom-in + subtle screen shake when the boss appears.

## 5. Art & tech
- Low-poly, flat-shaded, fog, lantern glow (warm orange) against cool night blues.
- All assets procedural/geometric (no external textures or models) so it runs standalone.
- Target 60fps; responsive for mobile + desktop; landscape-friendly.
- Controls: WASD/arrows, mouse click/tap, **Space** skill, **Enter/N** start night, **P/Esc** pause.

## 6. UI
- Minimal HUD: day/night indicator, resource count, fort HP, timer, ticket count.
- **Start screen:** game title, one-line description, "Play" button.
- **End screen:** result card (win/lose, score, time), "Play again".

## 7. Output format
- Complete runnable code (single project).
- Short "How to run" section.
- List of controls and a 3-bullet gameplay summary.
