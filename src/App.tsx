import { useEffect, useRef, useState } from 'react';
import { GameCanvas, GameControllerApi } from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { Modals } from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { soundFX } from './game/audio';
import { GameMusic } from './game/music';
import {
  canShowDevTestControl,
  isDevelopmentTestMode,
  loadDailyStateFromStorage,
} from './game/dailySystem';
import {
  LanguageCode,
  loadLanguageFromStorage,
  saveLanguageToStorage,
} from './game/i18n';
import {
  DAY_DURATION_SECONDS,
  FORT_MAX_HP,
  INITIAL_RESOURCES,
  LANTERN_FLARE_COOLDOWN,
  MAX_DAYS,
  restoreFenceSegmentsFromPersistence,
  restorePadsFromPersistence,
  WEATHER_CYCLE_DURATION,
} from './game/rules';
import { BuildingType, HudSnapshot } from './game/types';

export default function App() {
  const controllerRef = useRef<GameControllerApi | null>(null);
  const autoStartRequestedRef = useRef(false);
  const musicRef = useRef<GameMusic | null>(null);
  if (!musicRef.current) musicRef.current = new GameMusic();
  const [muted, setMuted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [lang, setLang] = useState<LanguageCode>(() => loadLanguageFromStorage());
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV as string | undefined;
  const isDevvitPlaytest = document.documentElement.dataset.devvitPlaytest === 'true';
  const showDevTestControl =
    canShowDevTestControl(import.meta.env.DEV, vercelEnv) || isDevvitPlaytest;

  const handleSelectLanguage = (nextLang: LanguageCode) => {
    setLang(nextLang);
    saveLanguageToStorage(nextLang);
  };

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const autostart =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('autostart') === '1' ||
        document.body.dataset.autostart === '1');
    const initialDaily = loadDailyStateFromStorage();
    return {
      screen: autostart ? 'playing' : 'title',
      phase: 'day',
      weather: 'clear',
      weatherTimeRemaining: WEATHER_CYCLE_DURATION,
      dayNumber: 1,
      maxDays: MAX_DAYS,
      phaseTimeRemaining: DAY_DURATION_SECONDS,
      fortHp: FORT_MAX_HP,
      fortMaxHp: FORT_MAX_HP,
      fortGhostHp: FORT_MAX_HP,
      resources: {
        wood: initialDaily.savedResources?.wood ?? INITIAL_RESOURCES.wood,
        stone: initialDaily.savedResources?.stone ?? INITIAL_RESOURCES.stone,
        food: initialDaily.savedResources?.food ?? INITIAL_RESOURCES.food,
        tickets: initialDaily.tickets,
      },
      score: 0,
      bestScore: 0,
      zombiesRemaining: 0,
      totalWaveZombies: 0,
      zombiesDefeated: 0,
      flareCooldown: 0,
      flareMaxCooldown: LANTERN_FLARE_COOLDOWN,
      selectedPadId: null,
      selectedFenceId: null,
      pads: restorePadsFromPersistence(initialDaily.savedPads, true),
      fenceSegments: restoreFenceSegmentsFromPersistence(initialDaily.savedFenceSegments, true),
      bossActive: false,
      bossName: 'Baron Blight',
      bossHp: 0,
      bossMaxHp: 560,
      bossSpeech: null,
      statusBanner: null,
      runOutcome: null,
      elapsedRunSeconds: 0,
      cameraZoom: 1.0,
      dockCollapsed: false,
      heroAnimState: 'idle',
      pendingConstruction: null,
      isDevTestMode:
        typeof window !== 'undefined' &&
        isDevelopmentTestMode(
          import.meta.env.DEV,
          window.location.search,
          false,
          vercelEnv,
          document.documentElement.dataset.devvitPlaytest === 'true'
        ),
      daily: initialDaily,
      lastRunSummary: null,
    };
  });

  useEffect(() => {
    musicRef.current?.sync(hud.phase, hud.screen === 'playing', muted);
  }, [hud.phase, hud.screen, muted]);

  useEffect(() => {
    const retryMusic = () => musicRef.current?.retry();
    window.addEventListener('pointerdown', retryMusic);
    window.addEventListener('keydown', retryMusic);
    return () => {
      window.removeEventListener('pointerdown', retryMusic);
      window.removeEventListener('keydown', retryMusic);
      musicRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyM') {
        const nextMuted = soundFX.toggleMute();
        setMuted(nextMuted);
      } else if (e.code === 'Escape' && showGuide) {
        setShowGuide(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGuide]);

  useEffect(() => {
    const shouldStartDevvitRun =
      document.documentElement.dataset.devvitRuntime === 'true' &&
      (new URLSearchParams(window.location.search).get('autostart') === '1' ||
        document.body.dataset.autostart === '1');
    if (!shouldStartDevvitRun) return;

    let timeoutId = 0;
    let attempts = 0;
    const startWhenReady = () => {
      if (autoStartRequestedRef.current) return;
      if (controllerRef.current) {
        autoStartRequestedRef.current = true;
        controllerRef.current.startGame();
        return;
      }
      attempts += 1;
      if (attempts < 120) timeoutId = window.setTimeout(startWhenReady, 50);
    };
    startWhenReady();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = soundFX.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#0b1016] select-none"
      data-lang={lang}
    >
      {hud.isDevTestMode && hud.screen === 'title' && (
        <div
          data-testid="dev-test-active-banner"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[25] flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-[#581c87]/95 border border-[#c084fc] text-[10px] font-bold tracking-wide text-white shadow-lg pointer-events-auto"
          title="Demo / Test Mode: Isolated sandbox — no tickets spent, production save untouched."
        >
          <span>🧪 DEMO / TEST MODE · NO TICKETS SPENT · PRODUCTION SAVE ISOLATED</span>
          <button
            type="button"
            data-testid="btn-reset-demo-data"
            onClick={() => controllerRef.current?.clearDemoData()}
            className="px-1.5 py-0.5 rounded bg-[#3b0764] hover:bg-[#4c1d95] border border-[#d8b4fe]/60 text-[9px] font-semibold cursor-pointer"
          >
            Reset Demo Data
          </button>
          <button
            type="button"
            data-testid="btn-exit-demo-mode"
            onClick={() => controllerRef.current?.returnToTitle()}
            className="px-1.5 py-0.5 rounded bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#cbd5e1]/50 text-[9px] font-semibold cursor-pointer"
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* 3D WebGL Viewport */}
      <GameCanvas onHudUpdate={setHud} controllerRef={controllerRef} lang={lang} />

      {/* Title Screen Overlay */}
      {hud.screen === 'title' && !showGuide && (
        <TitleScreen
          onStartGame={() => controllerRef.current?.startGame()}
          onStartDevTestRun={() => controllerRef.current?.startDevTestRun()}
          devTestMode={hud.isDevTestMode}
          showDevTestControl={showDevTestControl}
          onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
          onOpenGuide={() => setShowGuide(true)}
          bestScore={hud.bestScore}
          daily={hud.daily}
          onEquipLantern={(id) => controllerRef.current?.equipLantern(id)}
          onEquipTitle={(t) => controllerRef.current?.equipTitle(t)}
          lang={lang}
          onSelectLanguage={handleSelectLanguage}
        />
      )}

      {/* Low-Occlusion World-Matched HUD Overlay */}
      <HudOverlay
        hud={hud}
        muted={muted}
        lang={lang}
        onSelectLanguage={handleSelectLanguage}
        onSelectPad={(padId) => controllerRef.current?.selectPad(padId)}
        onSelectFence={(fenceId) => controllerRef.current?.selectFence(fenceId)}
        onBuildNextFence={() => controllerRef.current?.buildNextFence()}
        onBuildOnPad={(type: BuildingType) =>
          controllerRef.current?.buildOnSelectedPad(type)
        }
        onUpgradeOnPad={(pathId: 'pathA' | 'pathB') =>
          controllerRef.current?.upgradeSelectedPad(pathId)
        }
        onRepairPad={() => controllerRef.current?.repairSelectedPad()}
        onDemolishPad={() => controllerRef.current?.demolishSelectedPad()}
        onTriggerFlare={() => controllerRef.current?.triggerLanternFlare()}
        onStartNightEarly={() => controllerRef.current?.startNightEarly()}
        onCycleWeather={() => controllerRef.current?.cycleWeather()}
        onToggleMute={handleToggleMute}
        onTogglePause={() => controllerRef.current?.togglePause()}
        onOpenGuide={() => setShowGuide(true)}
        onToggleDock={() => controllerRef.current?.toggleDock()}
        onAdjustZoom={(delta) => controllerRef.current?.adjustZoom(delta)}
        onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
        onResetDemoData={() => controllerRef.current?.clearDemoData()}
        onExitDemoMode={() => controllerRef.current?.returnToTitle()}
      />

      {/* Pause, Unified End Screen Result Card, and Schema/Guide Modals */}
      <Modals
        hud={hud}
        devTestMode={hud.isDevTestMode}
        showDevTestControl={showDevTestControl}
        lang={lang}
        onSelectLanguage={handleSelectLanguage}
        showGuide={showGuide}
        onCloseGuide={() => setShowGuide(false)}
        onResume={() => controllerRef.current?.togglePause()}
        onRestart={() => controllerRef.current?.restartGame()}
        onStartDevTestRun={() => controllerRef.current?.startDevTestRun()}
        onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
        onReturnTitle={() => controllerRef.current?.returnToTitle()}
        onOpenGuide={() => setShowGuide(true)}
        onFinishRunEarly={() => controllerRef.current?.finishRunEarly()}
      />
    </main>
  );
}
