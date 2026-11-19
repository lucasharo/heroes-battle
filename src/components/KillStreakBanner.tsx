import React from 'react';
import { KillStreakAnnouncement } from '../game/types';

interface KillStreakBannerProps {
  streak: KillStreakAnnouncement;
  offsetForSuperStar?: boolean;
}

const TIER_STYLES: Record<
  KillStreakAnnouncement['tier'],
  {
    border: string;
    bg: string;
    titleColor: string;
    glow: string;
    kicker: string;
  }
> = {
  double: {
    border: 'rgba(56, 189, 248, 0.72)',
    bg: 'rgba(11, 18, 40, 0.94)',
    titleColor: '#7dd3fc',
    glow: '0 10px 30px rgba(56, 189, 248, 0.24)',
    kicker: 'SEQUÊNCIA',
  },
  triple: {
    border: 'rgba(251, 191, 36, 0.82)',
    bg: 'rgba(17, 19, 36, 0.95)',
    titleColor: '#fde047',
    glow: '0 12px 34px rgba(251, 191, 36, 0.28)',
    kicker: 'DOMÍNIO',
  },
  quadra: {
    border: 'rgba(251, 113, 133, 0.86)',
    bg: 'rgba(24, 14, 34, 0.95)',
    titleColor: '#fda4af',
    glow: '0 14px 36px rgba(244, 63, 94, 0.32)',
    kicker: 'DEVASTAÇÃO',
  },
  godlike: {
    border: 'rgba(253, 224, 71, 0.95)',
    bg: 'rgba(20, 14, 42, 0.96)',
    titleColor: '#fef08a',
    glow: '0 16px 44px rgba(250, 204, 21, 0.38)',
    kicker: 'SUPREMACIA',
  },
};

export const KillStreakBanner: React.FC<KillStreakBannerProps> = ({
  streak,
  offsetForSuperStar = false,
}) => {
  const style = TIER_STYLES[streak.tier];
  const bladeCount = Math.min(5, Math.max(2, streak.count));

  return (
    <div
      key={streak.id}
      role="status"
      aria-live="polite"
      data-testid="kill-streak-banner"
      className={`fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none ${
        offsetForSuperStar ? 'top-[7.5rem] lg:top-20' : 'top-[5.25rem] lg:top-5'
      }`}
    >
      <div
        className="relative overflow-hidden rounded-xl border-2 px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3.5 max-w-[calc(100vw-1.25rem)] animate-killstreak-slam"
        style={{
          backgroundColor: style.bg,
          borderColor: style.border,
          boxShadow: style.glow,
        }}
      >
        {/* Top & bottom accent hairlines */}
        <div
          className="absolute inset-x-6 top-0 h-[2px]"
          style={{ backgroundColor: streak.accent }}
        />
        <div
          className="absolute inset-x-10 bottom-0 h-[1.5px] opacity-80"
          style={{ backgroundColor: streak.accent }}
        />

        {/* Custom vector streak blades / crown emblem */}
        <svg
          viewBox="0 0 36 36"
          className="w-9 h-9 shrink-0"
          aria-hidden="true"
        >
          <polygon
            points="18,2 33,10 33,26 18,34 3,26 3,10"
            fill="#090e1a"
            stroke={streak.accent}
            strokeWidth="2.2"
          />
          {streak.tier === 'godlike' ? (
            <path
              d="M9 24L11 13L15.5 18L18 10L20.5 18L25 13L27 24H9Z"
              fill={streak.accent}
              stroke="#090e1a"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          ) : (
            <g stroke={streak.accent} strokeWidth="2.4" strokeLinecap="round">
              {Array.from({ length: bladeCount }).map((_, idx) => {
                const offset = (idx - (bladeCount - 1) / 2) * 5.2;
                return (
                  <line
                    key={idx}
                    x1={18 + offset - 3}
                    y1={25}
                    x2={18 + offset + 3}
                    y2={11}
                  />
                );
              })}
            </g>
          )}
        </svg>

        <div className="flex flex-col items-start min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-300 leading-none">
            <span style={{ color: streak.accent }}>{style.kicker}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-slate-200">{streak.subtitle}</span>
          </div>
          <div
            className="font-display text-xl sm:text-3xl font-black italic uppercase tracking-wide leading-none mt-1 whitespace-nowrap"
            style={{
              color: style.titleColor,
              textShadow: '0 2px 0 #090e1a, 0 4px 12px rgba(0,0,0,0.65)',
            }}
          >
            {streak.title}
          </div>
        </div>
      </div>
    </div>
  );
};
