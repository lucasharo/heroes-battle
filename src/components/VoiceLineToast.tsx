import React, { useState } from 'react';
import { HEROES } from '../game/heroes';
import { HeroMasteryMap, computeHeroMasteryProgress } from '../game/heroMastery';
import { HeroSkinsMap, resolveEquippedHeroSkin } from '../game/heroSkins';
import { GamePhase } from '../game/types';
import { VoiceLineContext, VoiceLineEvent } from '../game/voiceLines';
import { HeroMasteryFrame } from './HeroMasteryFrame';

interface VoiceLineToastProps {
  event: VoiceLineEvent | null;
  heroSkins: HeroSkinsMap;
  heroMastery: HeroMasteryMap;
  unlockedCosmetics?: readonly string[];
  phase: GamePhase;
}

const CONTEXT_LABEL: Record<VoiceLineContext, string> = {
  select: 'Seleção',
  match_start: 'Início',
  kill: 'Abate',
};

export const VoiceLineToast: React.FC<VoiceLineToastProps> = ({
  event,
  heroSkins,
  heroMastery,
  unlockedCosmetics,
  phase,
}) => {
  const [failedPortraits, setFailedPortraits] = useState<Record<string, boolean>>({});

  if (!event) return null;

  const hero = HEROES[event.heroId];
  const mastery = computeHeroMasteryProgress(event.heroId, heroMastery[event.heroId]);
  const skin = resolveEquippedHeroSkin(
    event.heroId,
    heroSkins[event.heroId],
    mastery,
    unlockedCosmetics
  );
  const portraitFailed = Boolean(failedPortraits[event.heroId]);

  const positionClass =
    phase === 'title'
      ? 'bottom-3 left-1/2 -translate-x-1/2 sm:bottom-5 sm:left-6 sm:translate-x-0'
      : 'top-16 left-1/2 -translate-x-1/2 sm:top-auto sm:bottom-4 sm:left-4 sm:translate-x-0';

  return (
    <div
      key={event.id}
      data-testid="voice-line-toast"
      data-hero={event.heroId}
      data-context={event.context}
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed ${positionClass} z-40 w-[min(92vw,420px)] px-2 transition-all duration-200`}
    >
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2 border-2 shadow-2xl backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(10, 15, 34, 0.92)',
          borderColor: skin.accentColor,
          boxShadow: `0 12px 30px rgba(0, 0, 0, 0.55), 0 0 18px ${skin.accentColor}30`,
        }}
      >
        <HeroMasteryFrame
          frameId={mastery.activeFrameId}
          masteryLevel={mastery.tier.level}
          size="card"
          showLevelBadge={false}
          className="w-11 h-11 shrink-0"
        >
          {!portraitFailed ? (
            <img
              src={hero.portraitUrl}
              alt={hero.name}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedPortraits((prev) => ({ ...prev, [event.heroId]: true }))
              }
              className="w-full h-full object-cover object-[50%_24%]"
              style={{
                filter: skin.portraitFilter !== 'none' ? skin.portraitFilter : undefined,
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-display text-lg font-extrabold"
              style={{
                backgroundColor: hero.accentSoft,
                color: skin.accentColor,
              }}
            >
              {hero.name[0]}
            </div>
          )}
        </HeroMasteryFrame>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-display text-xs font-extrabold uppercase tracking-wider truncate"
              style={{ color: skin.accentColor }}
            >
              {event.heroName}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border"
              style={{
                color: '#e2e8f0',
                backgroundColor: 'rgba(30, 41, 59, 0.85)',
                borderColor: 'rgba(148, 163, 184, 0.35)',
              }}
            >
              {CONTEXT_LABEL[event.context]}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-bold text-slate-100 leading-snug line-clamp-2">
            “{event.text}”
          </p>
        </div>
      </div>
    </div>
  );
};
