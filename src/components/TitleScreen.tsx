import React, { useEffect, useRef, useState } from 'react';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../game/i18n';
import { HERO_RUE_PORTRAIT_URL } from '../game/rules';
import { DailyPersistenceState } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onStartDevTestRun: () => void;
  showDevTestControl: boolean;
  devTestMode: boolean;
  onClaimDailyCheckIn: () => void;
  onOpenGuide: () => void;
  bestScore: number;
  daily: DailyPersistenceState;
  onEquipTitle: (title: string) => void;
  lang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onStartDevTestRun,
  showDevTestControl,
  devTestMode,
  onClaimDailyCheckIn,
  onOpenGuide,
  bestScore,
  daily,
  onEquipTitle,
  lang,
  onSelectLanguage,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  const tr = TRANSLATIONS[lang];
  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  const todayUTC = daily.lastResetDateUTC;
  const checkInClaimedToday = daily.lastCheckInClaimedDateUTC === todayUTC;
  const checkInReady =
    !checkInClaimedToday &&
    (daily.checkInEligibleDateUTC === todayUTC);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div
      className="title-screen fixed inset-0 z-20 flex flex-col p-2 sm:p-3 pointer-events-none overflow-y-auto"
      style={{
        background:
          `linear-gradient(90deg, rgba(9,8,18,.88), rgba(9,8,18,.55), rgba(9,8,18,.45)), url(${HERO_RUE_PORTRAIT_URL}) center / cover no-repeat`,
      }}
    >
      {/* Top Bar: Compact Player Summary Pill (Left) + Click-to-Open Language Dropdown (Right) */}
      <div className="w-full max-w-[1180px] mx-auto flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Compact Player Profile Pill */}
        <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d131c]/90 border border-[#334155] text-xs text-[#cbd5e1] shadow-lg">
          <img
            src={HERO_RUE_PORTRAIT_URL}
            alt="Ranger Rue"
            className="w-6 h-6 rounded-md object-cover border border-[#f59e0b]"
          />
          <span className="font-mono-tabular font-bold text-[#fbbf24]">
            LVL {daily.level}
          </span>
          <span className="text-[#475569]">·</span>
          <span className="font-semibold text-[#fef3c7]">{daily.equippedTitle}</span>
          <span className="text-[#475569]">·</span>
          <span className="font-mono-tabular text-[#4ade80]">
            {tr.streakHeader(daily.streak, daily.bestStreak)}
          </span>
          <span className="text-[#475569]">·</span>
          <span className="font-mono-tabular text-[#38bdf8]">
            {tr.coinsHeader(daily.coins)}
          </span>
          <span className="text-[#475569]">·</span>
          <span
            className="font-mono-tabular font-bold text-[#f59e0b]"
            data-testid="title-tickets"
          >
            {tr.dailyTicketsHeader(daily.tickets, daily.maxDailyTickets)}
          </span>
          {bestScore > 0 && (
            <>
              <span className="text-[#475569]">·</span>
              <span className="font-mono-tabular text-[#fde047]">
                {tr.bestScoreLabel} {Math.round(bestScore)}
              </span>
            </>
          )}
        </div>

        {/* Click-to-Open Language Dropdown Menu */}
        <div
          ref={langMenuRef}
          className="relative"
          data-testid="title-language-selector"
        >
          <button
            type="button"
            data-testid="btn-language-menu"
            onClick={() => setLangMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0d131c]/95 hover:bg-[#161f2c] border border-[#334155] text-xs font-semibold text-[#fef3c7] shadow-lg cursor-pointer transition-colors"
          >
            <span>🌐 {tr.languageMenuLabel}</span>
            <span className="font-bold text-[#fbbf24]">
              {currentLangOption.shortLabel} · {currentLangOption.nativeName}
            </span>
            <span className="text-[#94a3b8] text-[10px]">{langMenuOpen ? '▴' : '▾'}</span>
          </button>

          {langMenuOpen && (
            <div
              data-testid="language-dropdown-menu"
              className="absolute right-0 top-full mt-1.5 z-40 w-48 rounded-xl bg-[#0d131c] border border-[#334155] p-1.5 shadow-2xl flex flex-col gap-1"
            >
              {SUPPORTED_LANGUAGES.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    data-testid={`lang-btn-${opt.code}`}
                    onClick={() => {
                      onSelectLanguage(opt.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#f59e0b] text-[#090d16] font-bold'
                        : 'text-[#cbd5e1] hover:bg-[#1e293b]'
                    }`}
                  >
                    <span>{opt.nativeName}</span>
                    <span className="font-mono-tabular text-[10px] opacity-85">
                      {opt.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center Focal Hero Section: Clean, Uncluttered Logo + Tagline + Primary Actions */}
      <div className="title-main w-full max-w-xl mx-auto my-auto flex flex-col items-center justify-center text-center pointer-events-auto px-2 py-1">
        {/* Custom Uploaded Build or Bite Title Logo Image */}
        <div className="mb-1 w-full max-w-[280px] sm:max-w-[340px]">
          <img
            src="/assets/aistudio/build-or-bite-title-removebg-preview_49acf47a.png"
            alt="Build or Bite — 3D Forest Fort Defense"
            data-testid="title-logo-img"
            className="w-full h-auto max-h-[20vh] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.92)] select-none mx-auto"
          />
        </div>

        {/* One-line description */}
        <p
          data-testid="title-tagline"
          className="horror-title-text text-base sm:text-lg text-[#fff1dc] leading-snug mb-2 max-w-md drop-shadow"
        >
          {tr.tagline}
        </p>

        {/* Daily Progression Complete Notice when 3/3 tasks are done */}
        {daily.dailyProgressionLocked && (
          <div
            data-testid="title-daily-lock-banner"
            className="w-full max-w-lg mb-3 px-3.5 py-2 rounded-xl bg-[#11221c]/95 border border-[#22c55e]/60 text-xs text-[#fef3c7] shadow-lg"
          >
            <div className="font-bold text-[#4ade80] mb-0.5">
              🔒 {tr.dailyProgressionCompleteTitle}
            </div>
            <div className="text-[11px] text-[#cbd5e1]">{tr.dailyProgressionCompleteDesc}</div>
          </div>
        )}

        {/* Daily Check-In Claim Button on Title Screen when eligible */}
        {checkInReady && (
          <button
            type="button"
            data-testid="title-btn-claim-checkin"
            onClick={(e) => {
              e.currentTarget.blur();
              onClaimDailyCheckIn();
            }}
            className="mb-3 px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#22c55e] text-[#090d16] font-display font-bold text-xs shadow-lg cursor-pointer transition-transform active:translate-y-0.5"
          >
            {tr.dailyCheckInClaimBtn}
          </button>
        )}

        {/* Primary Play CTA (-1 Ticket) + Demo / Test Run CTA + Secondary Compact Actions */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1">
          <button
            type="button"
            data-start="true"
            disabled={daily.tickets <= 0 && !devTestMode}
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className={`px-5 py-2.5 rounded-xl font-display font-bold text-base tracking-wide transition-transform duration-150 whitespace-nowrap shrink-0 ${
              daily.tickets > 0 || devTestMode
                ? 'bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#090d16] shadow-[0_6px_22px_rgba(245,158,11,0.4)] cursor-pointer'
                : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {devTestMode
              ? '🧪 DEMO / TEST RUN (No Ticket)'
              : daily.tickets > 0
              ? tr.playRunBtn(daily.tickets)
              : tr.noTicketsBtn(daily.maxDailyTickets)}
          </button>

          {showDevTestControl && (
            <button
              type="button"
              data-testid="btn-dev-test-run"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartDevTestRun();
              }}
              title="Isolated Demo / Test Mode: Test gathering, building, and combat with 0 tickets spent and zero effect on your saved profile."
              className="px-4 py-2.5 rounded-xl bg-[#422006]/95 hover:bg-[#713f12] border border-[#f59e0b] text-[#fde68a] font-display font-bold text-xs tracking-wide transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer"
            >
              🧪 Demo / Test Run (No Ticket)
            </button>
          )}

          <button
            type="button"
            data-testid="btn-guide"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenGuide();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#131b26]/95 hover:bg-[#1e293b] text-[#e2dacb] border border-[#334155] font-medium text-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 shadow-md"
          >
            {tr.howToRunBtn}
          </button>
        </div>

        {daily.unlockedTitles.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#94a3b8]">{tr.rangerTitleLabel}:</span>
            {daily.unlockedTitles.map((t) => (
              <button key={t} type="button" onClick={() => onEquipTitle(t)}
                className={`px-2 py-1 rounded text-[11px] cursor-pointer ${daily.equippedTitle === t ? 'bg-[#f59e0b] text-[#090d16] font-bold' : 'bg-[#161f2c] text-[#cbd5e1]'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clean bottom safe margin spacer */}
      <div className="h-2 pointer-events-none" />
    </div>
  );
};
