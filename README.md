<p align="center">
  <img src="public/assets/aistudio/build-or-bite-title-removebg-preview_49acf47a.png" alt="Build or Bite" width="520" />
</p>

<p align="center"><strong>Build by day. Bite back at night.</strong><br />
A spooky-funny 3D fort-defense game built for Reddit.</p>

---

## The game

Help Ranger Rue gather supplies and turn a forest clearing into a fort. When night falls, fend off waves of cartoonish zombies and survive the final encounter with Baron Blight.

- **Gather & build:** collect wood, stone, and food; choose from six defensive structures.
- **Choose your upgrades:** pick one of two paths for each structure, then strengthen it to level 3. Fences can also reach level 3.
- **Survive three nights:** deploy your defenses, use the Lantern Flare, and protect the fort.
- **Return each day:** keep your fort and progress through daily tasks, XP, cosmetics, and streaks.
- **Play on desktop or mobile:** keyboard and mouse controls are complemented by touch controls.

## How to play

**Day:** move to resource nodes, gather supplies, and use the build pads or fence button to construct, upgrade, and repair defenses. Each day lasts 65 seconds of active simulation; you can start night early.

**Night:** Rue and the defenses attack automatically. Use Lantern Flare strategically. Night ends once all zombies in the wave, including those still waiting to spawn, are defeated. Clear the third night to win; a destroyed fort or ending the run early is a defeat.

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys, or click | Tap or drag |
| Build or upgrade | Select a pad or fence | Tap a pad or fence |
| Lantern Flare | Space | Flare button |
| Start night early | Enter / N | Night button |
| Pause | P / Esc | Pause button |

## Reddit identity, tickets & saves

The Reddit version uses the Reddit user ID supplied to the Devvit server. A player who is signed in to Reddit does **not** need to create a separate game account or password. A valid Reddit session is required to load a profile and start a standard run; if the identity or save is unavailable, the game cannot load the profile.

Each player starts with **up to 3 tickets per UTC day**. A standard run costs one ticket, and tickets reset at **00:00 UTC**; unused tickets do not carry over. The first successfully started standard run each UTC day advances the daily streak, even if the run is not finished or tasks are incomplete. Further starts on the same day do not add streak days; missing a full UTC day breaks the streak. Demo runs never spend tickets or advance the normal streak. The server tracks starts and associates the profile with the Reddit user ID. The client submits fort and resource snapshots; these and gameplay events are not fully server-simulated or tamper-proof.

Daily tasks and their rewards are for standard play. Completing all three locks further daily gathering and construction until the UTC reset; combat remains available.

### Playtest Demo

Devvit prerelease playtests provide an isolated **Demo / Test Run**. It does not consume tickets or change the normal profile. Tasks do not progress or pay rewards in Demo. Demo fort data is stored separately; **Reset Demo Data** clears that sandbox. The Demo control is not intended for production versions.

## Build and test

Requirements: Node.js, npm, and a Devvit developer account for Reddit playtesting.

```bash
npm install --legacy-peer-deps
npm run lint
node --import tsx --test src/components/*.test.tsx src/game/*.test.ts src/server/*.test.ts
npm run build
npm run build:devvit
```

For local standalone development, run `npm run dev`. The standalone browser version uses local storage rather than Reddit identity and server-enforced tickets.

To update a Devvit playtest:

```bash
npm run playtest:devvit -- <subreddit>
```

## Technology

React, TypeScript, Three.js, Vite, Tailwind CSS, and Reddit Devvit Web with a Hono server and Redis persistence.

```text
src/client/       Reddit splash and webview entrypoints
src/components/   Game screens, HUD, and menus
src/game/         Rules, simulation, audio, persistence, translations, tests
src/server/       Reddit identity, ticket, profile, and progression endpoints
public/assets/    Original title and character art, fonts, and music
```

## Credits

- **Day music:** “Spooky Dungeon” by Memoraphile / You're Perfect Studio — [OpenGameArt](https://opengameart.org/content/spooky-dungeon), CC0.
- **Night music:** “Spooky Tune” by tamesu — [OpenGameArt](https://opengameart.org/content/spooky-tune), CC0.
- **Creepster font:** distributed under the SIL Open Font License; see `public/assets/fonts/Creepster-OFL.txt`.

Music licensing details and source links are also recorded in `public/assets/music/CREDITS.md`.

## Submission status and limitations

A Reddit playtest has been confirmed playable by the developer. App Directory publication, production behavior, and the specific event's eligibility and submission requirements have not yet been verified. Automated tests and builds do not substitute for those checks.

The Reddit server enforces a daily ticket counter and bounds reported progression, but the game simulation, fort/resource snapshots, and victory events are client-reported. They are not authoritative against a determined attacker. Dependency security warnings should also be reviewed before release.
