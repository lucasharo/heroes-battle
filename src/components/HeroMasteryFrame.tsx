import React from 'react';
import {
  MasteryFrameId,
  getMasteryTierByFrameId,
} from '../game/heroMastery';

interface HeroMasteryFrameProps {
  frameId: MasteryFrameId;
  masteryLevel: number;
  size?: 'card' | 'spotlight' | 'preview';
  showLevelBadge?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FRAME_BORDER_STYLES: Record<
  MasteryFrameId,
  {
    outerBg: string;
    innerBorder: string;
    ringShadow: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  recruta: {
    outerBg: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #475569 100%)',
    innerBorder: '#475569',
    ringShadow: 'none',
    badgeBg: '#1e293b',
    badgeText: '#cbd5e1',
  },
  bronze: {
    outerBg: 'linear-gradient(135deg, #b45309 0%, #f59e0b 45%, #78350f 100%)',
    innerBorder: '#d97706',
    ringShadow: '0 0 12px rgba(217, 119, 6, 0.36)',
    badgeBg: '#78350f',
    badgeText: '#fde68a',
  },
  prata: {
    outerBg: 'linear-gradient(135deg, #e2e8f0 0%, #64748b 45%, #38bdf8 100%)',
    innerBorder: '#cbd5e1',
    ringShadow: '0 0 14px rgba(148, 163, 184, 0.42)',
    badgeBg: '#1e293b',
    badgeText: '#e2e8f0',
  },
  ouro: {
    outerBg: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 48%, #b45309 100%)',
    innerBorder: '#fbbf24',
    ringShadow: '0 0 16px rgba(245, 158, 11, 0.5)',
    badgeBg: '#451a03',
    badgeText: '#fef08a',
  },
  diamante: {
    outerBg: 'linear-gradient(135deg, #a5f3fc 0%, #06b6d4 50%, #3b82f6 100%)',
    innerBorder: '#22d3ee',
    ringShadow: '0 0 18px rgba(34, 211, 238, 0.54)',
    badgeBg: '#083344',
    badgeText: '#a5f3fc',
  },
  lenda: {
    outerBg: 'linear-gradient(135deg, #fde047 0%, #f43f5e 52%, #fbbf24 100%)',
    innerBorder: '#fb7185',
    ringShadow: '0 0 22px rgba(251, 113, 133, 0.56)',
    badgeBg: '#4c0519',
    badgeText: '#fde047',
  },
};

export const MasteryFrameEmblemIcon: React.FC<{
  frameId: MasteryFrameId;
  className?: string;
}> = ({ frameId, className = 'w-3.5 h-3.5' }) => {
  const tier = getMasteryTierByFrameId(frameId);
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {frameId === 'recruta' && (
        <polygon
          points="12,3 20,8 20,16 12,21 4,16 4,8"
          fill={tier.primaryColor}
          stroke="#090d16"
          strokeWidth="1.8"
        />
      )}
      {frameId === 'bronze' && (
        <>
          <polygon
            points="12,3 20,8 18,17 12,21 6,17 4,8"
            fill={tier.primaryColor}
            stroke="#090d16"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="3" fill={tier.secondaryColor} />
        </>
      )}
      {frameId === 'prata' && (
        <>
          <polygon
            points="12,2 21,9 17,20 7,20 3,9"
            fill={tier.primaryColor}
            stroke="#090d16"
            strokeWidth="1.6"
          />
          <path d="M8 12l4-4 4 4-4 5z" fill={tier.secondaryColor} />
        </>
      )}
      {frameId === 'ouro' && (
        <>
          <path
            d="M4 17l2-10 6 4 6-4 2 10H4z"
            fill={tier.primaryColor}
            stroke="#090d16"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="2.2" fill={tier.secondaryColor} />
        </>
      )}
      {frameId === 'diamante' && (
        <>
          <polygon
            points="12,2 21,10 12,22 3,10"
            fill={tier.primaryColor}
            stroke="#090d16"
            strokeWidth="1.6"
          />
          <polygon points="12,4 18,10 12,13 6,10" fill={tier.secondaryColor} />
        </>
      )}
      {frameId === 'lenda' && (
        <>
          <path
            d="M3 17L5 6l4.5 4L12 3l2.5 7L19 6l2 11H3z"
            fill={tier.secondaryColor}
            stroke="#090d16"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="4"
            y="17.5"
            width="16"
            height="3"
            rx="1"
            fill={tier.primaryColor}
            stroke="#090d16"
            strokeWidth="1.2"
          />
        </>
      )}
    </svg>
  );
};

export const HeroMasteryFrame: React.FC<HeroMasteryFrameProps> = ({
  frameId,
  masteryLevel,
  size = 'card',
  showLevelBadge = true,
  className = '',
  children,
}) => {
  const palette = FRAME_BORDER_STYLES[frameId];
  const tier = getMasteryTierByFrameId(frameId);
  const padClass =
    size === 'spotlight'
      ? 'p-[3px] rounded-xl'
      : size === 'preview'
      ? 'p-[3px] rounded-xl'
      : 'p-[2.5px] rounded-lg';
  const innerRoundClass = size === 'card' ? 'rounded-[6px]' : 'rounded-[9px]';

  return (
    <div
      data-mastery-frame={frameId}
      className={`relative ${padClass} ${className}`}
      style={{
        background: palette.outerBg,
        boxShadow: palette.ringShadow,
      }}
    >
      <div
        className={`relative w-full h-full overflow-hidden bg-slate-900 ${innerRoundClass}`}
        style={{
          boxShadow: `inset 0 0 0 1px ${palette.innerBorder}55`,
        }}
      >
        {children}
      </div>

      {/* Ornate Cosmetic Frame SVG Overlay */}
      <svg
        viewBox="0 0 120 96"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
        aria-hidden="true"
      >
        {frameId === 'recruta' && (
          <>
            <path d="M2 12V2h10M108 2h10v10M2 84v10h10M108 94h10V84" fill="none" stroke={tier.secondaryColor} strokeWidth="2.4" strokeLinecap="square" />
          </>
        )}

        {frameId === 'bronze' && (
          <>
            <polygon points="1,1 16,1 1,16" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="119,1 104,1 119,16" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="1,95 16,95 1,80" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="119,95 104,95 119,80" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <circle cx="5.5" cy="5.5" r="1.8" fill={tier.secondaryColor} />
            <circle cx="114.5" cy="5.5" r="1.8" fill={tier.secondaryColor} />
            <circle cx="5.5" cy="90.5" r="1.8" fill={tier.secondaryColor} />
            <circle cx="114.5" cy="90.5" r="1.8" fill={tier.secondaryColor} />
          </>
        )}

        {frameId === 'prata' && (
          <>
            <path d="M1 18V1h18l-4 4H5v10z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <path d="M119 18V1h-18l4 4h10v10z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <path d="M1 78v17h18l-4-4H5V81z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <path d="M119 78v17h-18l4-4h10V81z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="48,1 72,1 66,7 54,7" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.2" />
          </>
        )}

        {frameId === 'ouro' && (
          <>
            <path d="M1 22V1h22l-5 5H6v12z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M119 22V1H97l5 5h12v12z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M1 74v21h22l-5-5H6V78z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M119 74v21H97l5-5h12V78z" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="46,1 74,1 69,8 60,11 51,8" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.3" />
            <circle cx="60" cy="4.5" r="2.2" fill="#f59e0b" stroke="#090d16" strokeWidth="1" />
          </>
        )}

        {frameId === 'diamante' && (
          <>
            <polygon points="1,1 22,1 14,9 9,14 1,22" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="119,1 98,1 106,9 111,14 119,22" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="1,95 22,95 14,87 9,82 1,74" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="119,95 98,95 106,87 111,82 119,74" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="60,0 68,6 60,12 52,6" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.3" />
            <line x1="25" y1="2" x2="48" y2="2" stroke={tier.secondaryColor} strokeWidth="1.6" />
            <line x1="72" y1="2" x2="95" y2="2" stroke={tier.secondaryColor} strokeWidth="1.6" />
          </>
        )}

        {frameId === 'lenda' && (
          <>
            <path d="M1 24V1h25l-7 6H7v11z" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M119 24V1H94l7 6h12v11z" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M1 72v23h25l-7-6H7V78z" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path d="M119 72v23H94l7-6h12V78z" fill={tier.secondaryColor} stroke="#090d16" strokeWidth="1.4" />
            <path
              d="M42 2h36l-5 8-7-4-6 6-6-6-7 4z"
              fill={tier.secondaryColor}
              stroke="#090d16"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <polygon points="60,2 64,6 60,10 56,6" fill={tier.primaryColor} stroke="#090d16" strokeWidth="1.1" />
            <path d="M2 36v24M118 36v24" stroke={tier.primaryColor} strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}
      </svg>

      {showLevelBadge && (
        <div
          className={`pointer-events-none absolute z-20 flex items-center gap-1 rounded px-1.5 py-0.5 border font-mono-num font-extrabold leading-none shadow-md ${
            size === 'spotlight'
              ? 'top-2 right-2 text-[11px]'
              : 'bottom-2 right-2 text-[10px]'
          }`}
          style={{
            backgroundColor: palette.badgeBg,
            borderColor: tier.primaryColor,
            color: palette.badgeText,
          }}
        >
          <MasteryFrameEmblemIcon frameId={frameId} className="w-3 h-3 shrink-0" />
          <span>Nv.{masteryLevel}</span>
        </div>
      )}
    </div>
  );
};
