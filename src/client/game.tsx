import { createRoot } from 'react-dom/client';
import App from '../App';
import { DAILY_STORAGE_KEY, DAILY_STATE_SAVED_EVENT } from '../game/dailySystem';
import type { DailyPersistenceState } from '../game/types';
import '../index.css';

const mount = document.getElementById('root');
if (!mount) {
  throw new Error('Build or Bite root element was not found.');
}

document.documentElement.dataset.devvitRuntime = 'true';
const root = createRoot(mount);

let pendingDailyState: DailyPersistenceState | null = null;
let saveTimer: number | undefined;
let saveInFlight = false;

async function flushRemoteSave(): Promise<void> {
  if (saveInFlight || !pendingDailyState) return;
  saveInFlight = true;
  const snapshot = pendingDailyState;
  pendingDailyState = null;

  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) throw new Error(`Save endpoint returned ${response.status}`);
    document.documentElement.dataset.saveSync = 'ok';
  } catch (error) {
    pendingDailyState ??= snapshot;
    document.documentElement.dataset.saveSync = 'error';
    console.error('Build or Bite save sync failed.', error);
  } finally {
    saveInFlight = false;
    if (pendingDailyState) {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => void flushRemoteSave(), 1500);
    }
  }
}

window.addEventListener(DAILY_STATE_SAVED_EVENT, (event) => {
  const state = (event as CustomEvent<DailyPersistenceState>).detail;
  if (!state || typeof state !== 'object') return;
  pendingDailyState = state;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void flushRemoteSave(), 250);
});

function showBootError(): void {
  const message = document.createElement('main');
  message.className = 'min-h-screen bg-[#0b1016] text-[#f4efe6] flex flex-col items-center justify-center gap-4 p-6 text-center';
  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold';
  title.textContent = 'Build or Bite could not load your Reddit save.';
  const detail = document.createElement('p');
  detail.className = 'max-w-lg text-sm text-slate-300';
  detail.textContent = 'Your Reddit session or saved game data is unavailable. Please try again. No local save was loaded.';
  const retry = document.createElement('button');
  retry.className = 'rounded-lg border border-amber-400 bg-amber-500 px-4 py-2 font-bold text-slate-950';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => void bootGame());
  message.append(title, detail, retry);
  mount?.replaceChildren(message);
}

async function bootGame(): Promise<void> {
  try {
    const response = await fetch('/api/profile', { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Profile endpoint returned ${response.status}`);
    const payload = (await response.json()) as { daily?: DailyPersistenceState };
    if (!payload.daily || typeof payload.daily !== 'object') {
      throw new Error('Profile response did not contain a valid daily save.');
    }
    // Reddit is a fresh account namespace: use the server profile, never import a
    // previous standalone browser save into a Reddit user's new game profile.
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(payload.daily));
    root.render(<App />);
  } catch (error) {
    console.error('Build or Bite Reddit profile bootstrap failed.', error);
    showBootError();
  }
}

void bootGame();
