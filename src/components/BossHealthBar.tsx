import React from 'react';
import { computeBossHealthBarState } from '../game/rules';

export interface BossHealthBarProps {
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossSpeech?: string | null;
  bossTag?: string;
  portraitUrl?: string | null;
}

export const BossHealthBar: React.FC<BossHealthBarProps> = ({
  bossActive,
  bossName,
  bossHp,
  bossMaxHp,
  bossSpeech = null,
  bossTag = 'BOSS',
  portraitUrl = null,
}) => {
  if (!bossActive) return null;

  const { currentHp, maxHp, pct, isCritical } = computeBossHealthBarState(bossHp, bossMaxHp);

  return (
    <section
      data-testid="boss-health-bar"
      data-critical={isCritical ? 'true' : 'false'}
      role="region"
      aria-label={`${bossName} ${currentHp} of ${maxHp} HP`}
      className={`pointer-events-none w-full max-w-[460px] rounded-xl border-2 px-3 py-2 shadow-2xl transition-colors duration-200 ${
        isCritical
          ? 'border-[#ef4444] shadow-[0_10px_30px_rgba(220,38,38,0.55)]'
          : 'border-[#eab308] shadow-[0_10px_30px_rgba(126,34,206,0.55)]'
      }`}
      style={{
        background: isCritical
          ? 'linear-gradient(180deg, rgba(45, 10, 22, 0.96) 0%, rgba(20, 7, 15, 0.96) 100%)'
          : 'linear-gradient(180deg, rgba(35, 14, 58, 0.96) 0%, rgba(15, 9, 28, 0.96) 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={bossName}
            className={`w-11 h-11 rounded-lg object-cover border-2 shrink-0 bg-[#090d16] ${
              isCritical ? 'border-[#ef4444]' : 'border-[#eab308]'
            }`}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`w-11 h-11 rounded-lg border-2 shrink-0 bg-[#090d16] flex items-center justify-center text-lg font-bold ${
              isCritical ? 'border-[#ef4444] text-[#fca5a5]' : 'border-[#eab308] text-[#fde047]'
            }`}
          >
            ☠
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-[#991b1b] border border-[#eab308]/80 text-[9.5px] font-mono-tabular font-extrabold uppercase tracking-widest text-[#fef08a] shrink-0">
                ☠ {bossTag}
              </span>
              <h3
                data-testid="boss-health-name"
                className="font-display font-extrabold text-sm sm:text-[15px] text-[#fef3c7] tracking-wide truncate"
              >
                {bossName}
              </h3>
            </div>

            <div
              data-testid="boss-health-value"
              className={`font-mono-tabular font-extrabold text-xs sm:text-[13px] whitespace-nowrap shrink-0 ${
                isCritical ? 'text-[#fca5a5]' : 'text-[#fde047]'
              }`}
            >
              {currentHp} / {maxHp} HP
            </div>
          </div>

          <div
            role="progressbar"
            aria-label={bossName}
            aria-valuemin={0}
            aria-valuemax={maxHp}
            aria-valuenow={currentHp}
            className={`relative w-full h-3.5 rounded-md bg-[#090d16] border overflow-hidden ${
              isCritical ? 'border-[#ef4444]/80' : 'border-[#a855f7]/80'
            }`}
          >
            <div
              data-testid="boss-health-fill"
              className={`h-full transition-all duration-150 relative ${
                isCritical
                  ? 'bg-gradient-to-r from-[#7f1d1d] via-[#ef4444] to-[#fb7185]'
                  : 'bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#f59e0b]'
              }`}
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-x-0 top-0 h-[35%] bg-white/20 pointer-events-none" />
            </div>

            {/* Quarter threshold markers */}
            <div className="absolute inset-y-0 left-1/4 w-[1px] bg-[#090d16]/75 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#090d16]/75 pointer-events-none" />
            <div className="absolute inset-y-0 left-3/4 w-[1px] bg-[#090d16]/75 pointer-events-none" />
          </div>

          {bossSpeech && (
            <div
              data-testid="boss-health-speech"
              className="text-[10.5px] italic text-[#fde68a] truncate mt-1"
            >
              “{bossSpeech}”
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
