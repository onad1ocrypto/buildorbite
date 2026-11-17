import { useEffect, useRef, useState } from 'react';
import { GameCanvas, GameControllerApi } from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { Modals } from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { soundFX } from './game/audio';
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
  const [muted, setMuted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [lang, setLang] = useState<LanguageCode>(() => loadLanguageFromStorage());
  const showDevTestControl = canShowDevTestControl(import.meta.env.DEV);

  const handleSelectLanguage = (nextLang: LanguageCode) => {
    setLang(nextLang);
    saveLanguageToStorage(nextLang);
  };

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const autostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';
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
        isDevelopmentTestMode(import.meta.env.DEV, window.location.search),
      daily: initialDaily,
      lastRunSummary: null,
      isFreePlay: false,
    };
  });

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

  const handleToggleMute = () => {
    const nextMuted = soundFX.toggleMute();
    setMuted(nextMuted);
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#0b1016] select-none"
      data-lang={lang}
    >
      {hud.isDevTestMode && (
        <div
          data-testid="dev-test-active-banner"
          className="fixed top-13 left-3 z-[60] px-3 py-1 rounded-full bg-[#581c87]/95 border border-[#c084fc] text-[10px] font-bold tracking-wide text-white shadow-lg pointer-events-none"
          title="Development-only: daily task locks are bypassed and tickets are not spent."
        >
          🧪 DEV TEST · NO TICKETS SPENT · DAILY LOCK BYPASSED
        </div>
      )}

      {/* 3D WebGL Viewport */}
      <GameCanvas onHudUpdate={setHud} controllerRef={controllerRef} lang={lang} />

      {/* Title Screen Overlay */}
      {hud.screen === 'title' && !showGuide && (
        <TitleScreen
          onStartGame={() => controllerRef.current?.startGame()}
          onStartDevTestRun={() => controllerRef.current?.startDevTestRun()}
          onStartFreePlay={() => controllerRef.current?.startFreePlay()}
          devTestMode={hud.isDevTestMode}
          showDevTestControl={showDevTestControl}
          onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
          onOpenGuide={() => setShowGuide(true)}
          bestScore={hud.bestScore}
          daily={hud.daily}
          onEquipLantern={(id) => controllerRef.current?.equipLantern(id)}
          onEquipTitle={(t) => controllerRef.current?.equipTitle(t)}
          onRefillTicketWithCoins={() =>
            controllerRef.current?.refillTicketWithCoins()
          }
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
        onRefillTicketWithCoins={() => controllerRef.current?.refillTicketWithCoins()}
        onStartFreePlay={() => controllerRef.current?.startFreePlay()}
        onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
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
        onStartFreePlay={() => controllerRef.current?.startFreePlay()}
        onClaimDailyCheckIn={() => controllerRef.current?.claimDailyCheckInReward()}
        onReturnTitle={() => controllerRef.current?.returnToTitle()}
        onOpenGuide={() => setShowGuide(true)}
        onFinishRunEarly={() => controllerRef.current?.finishRunEarly()}
        onRefillTicketWithCoins={() =>
          controllerRef.current?.refillTicketWithCoins()
        }
      />
    </main>
  );
}
