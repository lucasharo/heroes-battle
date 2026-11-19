import React from 'react';
import { HEROES } from '../game/heroes';
import { DeathCamSnapshot } from '../game/types';
import { PowerCubeIcon, SkullKillIcon, VitalityHeartIcon } from './GameIcons';

interface DeathCamOverlayProps {
  deathCam: DeathCamSnapshot;
  offsetForTopBanners?: boolean;
  onFocusHero: () => void;
}

export const DeathCamOverlay: React.FC<DeathCamOverlayProps> = ({
  deathCam,
  offsetForTopBanners = false,
  onFocusHero,
}) => {
  const hero = HEROES[deathCam.targetHero];
  const isKiller = deathCam.relation === 'killer';
  const accent = isKiller ? '#fb7185' : '#38bdf8';
  const borderColor = isKiller ? 'rgba(244, 63, 94, 0.72)' : 'rgba(56, 189, 248, 0.72)';
  const hpPct =
    deathCam.targetMaxHp > 0
      ? Math.max(0, Math.min(100, (deathCam.targetHp / deathCam.targetMaxHp) * 100))
      : 0;
  const shieldPct =
    deathCam.targetMaxHp > 0
      ? Math.max(0, Math.min(100, (deathCam.targetShield / deathCam.targetMaxHp) * 100))
      : 0;

  return (
    <>
      {/* Subtle tactical camera viewfinder corner brackets */}
      <div className="fixed inset-4 pointer-events-none z-10" aria-hidden="true">
        <div
          className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 rounded-tl-sm"
          style={{ borderColor: accent, opacity: 0.75 }}
        />
        <div
          className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 rounded-tr-sm"
          style={{ borderColor: accent, opacity: 0.75 }}
        />
        <div
          className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 rounded-bl-sm"
          style={{ borderColor: accent, opacity: 0.75 }}
        />
        <div
          className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 rounded-br-sm"
          style={{ borderColor: accent, opacity: 0.75 }}
        />
      </div>

      {/* Tactical Death Cam Banner & Target Readout */}
      <div
        role="status"
        aria-live="polite"
        data-testid="death-cam-overlay"
        className={`fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none ${
          offsetForTopBanners ? 'top-[7.5rem] lg:top-24' : 'top-[5.25rem] lg:top-5'
        }`}
      >
        <div
          className="rounded-xl border-2 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3.5 shadow-2xl w-[min(calc(100vw-1.25rem),460px)]"
          style={{
            backgroundColor: 'rgba(11, 17, 36, 0.94)',
            borderColor,
            boxShadow: isKiller
              ? '0 14px 36px rgba(244, 63, 94, 0.24)'
              : '0 14px 36px rgba(56, 189, 248, 0.22)',
          }}
        >
          {/* Target Hero Portrait */}
          <div className="relative shrink-0">
            <img
              src={hero.portraitUrl}
              alt={hero.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover object-top border-2"
              style={{ borderColor: accent }}
            />
            <svg
              viewBox="0 0 20 20"
              className="w-4 h-4 absolute -bottom-1 -right-1"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="9" fill="#090e1a" stroke={accent} strokeWidth="1.8" />
              <circle cx="10" cy="10" r="3" fill={accent} />
            </svg>
          </div>

          {/* Target Tactical Intel */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider leading-none whitespace-nowrap">
                <span style={{ color: accent }}>
                  {isKiller ? 'Câmara de Abate · Algoz' : 'Câmera Tática · Aliado'}
                </span>
                {deathCam.postRespawn && (
                  <>
                    <span className="text-slate-500" aria-hidden="true">·</span>
                    <span className="text-emerald-300">Pós-Respawn</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono-num text-slate-300 whitespace-nowrap">
                {deathCam.distanceMeters}m
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-display text-xl font-extrabold text-white leading-none truncate">
                  {deathCam.targetName}
                </span>
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                  {hero.name} · {hero.role}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono-num text-slate-200 whitespace-nowrap">
                <VitalityHeartIcon className="w-3.5 h-3.5" />
                <span>
                  {deathCam.targetHp}/{deathCam.targetMaxHp}
                </span>
              </div>
            </div>

            {/* Live Target HP + Shield Bar */}
            <div className="relative h-2 w-full rounded bg-slate-950 border border-slate-700/90 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-100"
                style={{
                  width: `${hpPct}%`,
                  backgroundColor: isKiller ? '#f43f5e' : '#38bdf8',
                }}
              />
              {shieldPct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400 h-1"
                  style={{ width: `${shieldPct}%` }}
                />
              )}
            </div>

            {/* Tactical Metrics + Respawn / Skip Action */}
            <div className="flex items-center justify-between gap-6 pt-0.5 text-xs font-mono-num text-slate-300">
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="flex items-center gap-1" title="Cubos de Poder">
                  <PowerCubeIcon className="w-3.5 h-3.5" />
                  <span>{deathCam.targetPowerCubes}</span>
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="flex items-center gap-1" title="Abates">
                  <SkullKillIcon className="w-3.5 h-3.5" />
                  <span>{deathCam.targetKills}</span>
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span
                  className={deathCam.targetFuryCharge >= 100 ? 'text-amber-300 font-bold' : 'text-amber-200/90'}
                >
                  Fúria {deathCam.targetFuryCharge}%
                </span>
              </div>

              {deathCam.postRespawn ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onFocusHero();
                  }}
                  className="pointer-events-auto px-2.5 py-0.5 rounded border border-emerald-400/60 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-sans text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Focar herói
                </button>
              ) : (
                <span className="font-sans text-[11px] font-semibold text-rose-200 whitespace-nowrap">
                  Retorno em <span className="font-mono-num">{deathCam.respawnRemaining.toFixed(1)}s</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
