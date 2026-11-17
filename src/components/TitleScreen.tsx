import React, { useEffect, useRef, useState } from 'react';
import { LANTERN_COSMETICS } from '../game/dailySystem';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../game/i18n';
import { HERO_RUE_PORTRAIT_URL } from '../game/rules';
import { DailyPersistenceState } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onStartFreePlay: () => void;
  onClaimDailyCheckIn: () => void;
  onOpenGuide: () => void;
  bestScore: number;
  daily: DailyPersistenceState;
  onEquipLantern: (lanternId: string) => void;
  onEquipTitle: (title: string) => void;
  onRefillTicketWithCoins: () => void;
  lang: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onStartFreePlay,
  onClaimDailyCheckIn,
  onOpenGuide,
  bestScore,
  daily,
  onEquipLantern,
  onEquipTitle,
  onRefillTicketWithCoins,
  lang,
  onSelectLanguage,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showCosmetics, setShowCosmetics] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  const tr = TRANSLATIONS[lang];
  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  const todayUTC = daily.lastResetDateUTC;
  const checkInClaimedToday = daily.lastCheckInClaimedDateUTC === todayUTC;
  const checkInReady =
    !checkInClaimedToday &&
    (daily.checkInEligibleDateUTC === todayUTC || daily.lastPlayedDateUTC === todayUTC);

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
      className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-8 pointer-events-none overflow-y-auto"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, rgba(8,12,18,0.45) 0%, rgba(8,12,18,0.82) 100%)',
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
                {tr.bestScoreLabel}: {Math.round(bestScore)}
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
            <span>🌐 Language:</span>
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
      <div className="w-full max-w-xl mx-auto my-auto flex flex-col items-center text-center pointer-events-auto px-3 py-4">
        {/* Custom Uploaded Build or Bite Title Logo Image */}
        <div className="mb-3 w-full max-w-[310px] sm:max-w-[420px]">
          <img
            src="/assets/aistudio/build-or-bite-title-removebg-preview_49acf47a.png"
            alt="Build or Bite — 3D Forest Fort Defense"
            data-testid="title-logo-img"
            className="w-full h-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.92)] select-none mx-auto"
          />
        </div>

        {/* One-line description */}
        <p
          data-testid="title-tagline"
          className="text-xs sm:text-sm md:text-base text-[#e2dacb] font-medium leading-relaxed mb-4 max-w-md drop-shadow"
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

        {/* Primary Play CTA (-1 Ticket) + Free Play / Demo CTA + Secondary Compact Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
          <button
            type="button"
            data-start="true"
            disabled={daily.tickets <= 0}
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className={`px-7 py-3.5 rounded-xl font-display font-bold text-base tracking-wide transition-transform duration-150 whitespace-nowrap shrink-0 ${
              daily.tickets > 0
                ? 'bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#090d16] shadow-[0_6px_22px_rgba(245,158,11,0.4)] cursor-pointer'
                : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {daily.tickets > 0
              ? tr.playRunBtn(daily.tickets)
              : tr.noTicketsBtn(daily.maxDailyTickets)}
          </button>

          <button
            type="button"
            data-testid="btn-free-play"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartFreePlay();
            }}
            title={tr.freePlayNoRewardsNote}
            className={`px-4 py-3.5 rounded-xl font-display font-bold text-xs tracking-wide transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer border ${
              daily.dailyProgressionLocked || daily.tickets <= 0
                ? 'bg-[#14532d] hover:bg-[#166534] border-[#4ade80] text-[#fef3c7]'
                : 'bg-[#0d131c]/95 hover:bg-[#1e293b] border-[#38bdf8]/60 text-[#38bdf8]'
            }`}
          >
            {tr.freePlayBtn}
          </button>

          <button
            type="button"
            data-testid="btn-add-tickets"
            onClick={(e) => {
              e.currentTarget.blur();
              onRefillTicketWithCoins();
            }}
            className="px-3.5 py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0 shadow-md"
          >
            {tr.addReviewTicketsBtn}
          </button>

          <button
            type="button"
            data-testid="btn-guide"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenGuide();
            }}
            className="px-4 py-3.5 rounded-xl bg-[#131b26]/95 hover:bg-[#1e293b] text-[#e2dacb] border border-[#334155] font-medium text-xs transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 shadow-md"
          >
            {tr.howToRunBtn}
          </button>
        </div>

        {/* Compact Collapsible Cosmetics Toggle so Title Screen stays 100% clean */}
        <div className="w-full max-w-md flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowCosmetics((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d131c]/90 hover:bg-[#161f2c] border border-[#1e293b] text-[11px] text-[#cbd5e1] cursor-pointer transition-colors"
          >
            <span>🏮 {tr.lanternCosmeticTitle}:</span>
            <strong className="text-[#fbbf24]">
              {tr.translateLanternName(
                daily.equippedLanternId,
                LANTERN_COSMETICS[daily.equippedLanternId]?.name ?? ''
              )}
            </strong>
            <span className="text-[#94a3b8]">{showCosmetics ? '▴' : '▾'}</span>
          </button>

          {showCosmetics && (
            <div className="mt-2 w-full p-3 rounded-xl bg-[#0d131c]/95 border border-[#334155] shadow-xl">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {Object.values(LANTERN_COSMETICS).map((item) => {
                  const unlocked = daily.cosmetics.includes(item.id);
                  const active = daily.equippedLanternId === item.id;
                  const locName = tr.translateLanternName(item.id, item.name);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => onEquipLantern(item.id)}
                      title={unlocked ? locName : `${locName} (${item.unlockSource})`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#1e293b] border-[#fbbf24] text-[#fef3c7] font-semibold cursor-pointer'
                          : unlocked
                          ? 'bg-[#131b26] border-[#334155] text-[#cbd5e1] hover:border-[#64748b] cursor-pointer'
                          : 'bg-[#090d14] border-[#1e293b] text-[#475569] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.hexColor }}
                      />
                      <span>{locName.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {daily.unlockedTitles.length > 1 && (
                <div className="mt-2 pt-2 border-t border-[#1e293b] flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#94a3b8]">{tr.rangerTitleLabel}:</span>
                  {daily.unlockedTitles.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onEquipTitle(t)}
                      className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                        daily.equippedTitle === t
                          ? 'bg-[#f59e0b] text-[#090d16] font-bold'
                          : 'bg-[#161f2c] text-[#cbd5e1] hover:bg-[#1e293b]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clean bottom safe margin spacer */}
      <div className="h-2 pointer-events-none" />
    </div>
  );
};
