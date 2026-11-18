import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HudOverlay } from './HudOverlay';
import { createDefaultDailyState } from '../game/dailySystem';
import { createInitialFenceSegments, createInitialPads, INITIAL_RESOURCES } from '../game/rules';
import type { HudSnapshot } from '../game/types';

function renderHud(demo: boolean, selectedPadId: number | null = null): string {
  const hud = {
    screen: 'playing', phase: 'day', dayNumber: 1, maxDays: 3,
    phaseTimeRemaining: 65, weather: 'clear', weatherTimeRemaining: 45,
    fortHp: 500, fortMaxHp: 500, fortGhostHp: 500,
    daily: createDefaultDailyState(), pads: createInitialPads(), fenceSegments: createInitialFenceSegments(),
    resources: INITIAL_RESOURCES, selectedPadId, selectedFenceId: null,
    isDevTestMode: demo, dockCollapsed: false, heroAnimState: 'idle',
    pendingConstruction: null, zombiesRemaining: 0, score: 0, flareCooldown: 0,
    bossActive: false, bossName: '', bossHp: 0, bossMaxHp: 1, statusBanner: null,
  } as HudSnapshot;
  const noop = () => {};
  return renderToStaticMarkup(<HudOverlay hud={hud} muted={false} lang="en"
    onSelectPad={noop} onSelectFence={noop} onBuildNextFence={noop} onBuildOnPad={noop}
    onUpgradeOnPad={noop} onRepairPad={noop} onDemolishPad={noop} onTriggerFlare={noop}
    onToggleMute={noop} onTogglePause={noop} onOpenGuide={noop}
    onToggleDock={noop} />);
}

test('task button is hidden in demo but remains in real play; in-game language menu is absent', () => {
  const demo = renderHud(true);
  const real = renderHud(false);
  assert.doesNotMatch(demo, /data-testid="btn-daily-tasks"/);
  assert.match(real, /data-testid="btn-daily-tasks"/);
  for (const html of [demo, real]) assert.doesNotMatch(html, /data-testid="hud-language-selector"/);
});

test('HUD exposes compact audio settings but no skip-night or question-mark buttons', () => {
  const html = renderHud(false);
  assert.match(html, /aria-label="Mute music and sound"/);
  assert.doesNotMatch(html, /aria-label="Audio settings"/);
  assert.doesNotMatch(html, /aria-label="How to Run and Controls"/);
  assert.doesNotMatch(html, /Night \[N\]/);
});


test('compact build menu keeps fence action and five defense choices without numbered shortcuts', () => {
  const html = renderHud(false, 1);
  assert.match(html, /data-testid="btn-build-fence"/);
  assert.match(html, /data-testid="pad-build-choice-menu"/);
  for (const name of ['watchtower', 'spiketrap', 'campfire', 'catapult', 'guardtent']) {
    assert.match(html, new RegExp(`data-testid="btn-build-${name}"`));
  }
  assert.doesNotMatch(html, /data-testid="btn-select-pad-/);
  assert.doesNotMatch(html, /data-testid="btn-build-palisade"/);
});
