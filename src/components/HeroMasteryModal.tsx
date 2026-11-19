import React, { useEffect } from 'react';
import {
  HeroMasteryMap,
  HeroMasteryProgress,
  MASTERY_POINTS_PER_KILL,
  MASTERY_POINTS_PER_MATCH,
  MASTERY_TIERS,
  MasteryFrameId,
  computeAccountMasterySummary,
  evolveAccountMasteryFrames,
  getNextFrameUpgradeCostGems,
} from '../game/heroMastery';
import { HeroSkinSpec } from '../game/heroSkins';
import { HeroConfig } from '../game/types';
import { HeroMasteryFrame, MasteryFrameEmblemIcon } from './HeroMasteryFrame';

interface HeroMasteryModalProps {
  open: boolean;
  hero: HeroConfig;
  progress: HeroMasteryProgress;
  heroMastery: HeroMasteryMap;
  playerGems: number;
  isSignedIn: boolean;
  syncing?: boolean;
  statusBanner?: string | null;
  equippedSkin?: HeroSkinSpec;
  onEquipFrame: (framePreference: MasteryFrameId | 'auto') => void;
  onEvolveHeroFrame: () => void;
  onEvolveAllFrames: () => void;
  onClose: () => void;
}

export const HeroMasteryModal: React.FC<HeroMasteryModalProps> = ({
  open,
  hero,
  progress,
  heroMastery,
  playerGems,
  isSignedIn,
  syncing = false,
  statusBanner,
  equippedSkin,
  onEquipFrame,
  onEvolveHeroFrame,
  onEvolveAllFrames,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const isAuto = progress.equippedPreference === 'auto';
  const nextUpgradeCost = getNextFrameUpgradeCostGems(progress.tier.level);
  const canAffordSelected =
    !syncing && nextUpgradeCost !== null && playerGems >= nextUpgradeCost;
  const accountSummary = computeAccountMasterySummary(heroMastery, playerGems);
  const batchPreview = evolveAccountMasteryFrames(heroMastery, playerGems, hero.id);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(6, 10, 26, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-mastery-modal-title"
      data-testid="hero-mastery-modal"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-indigo-400/40 p-5 sm:p-6 flex flex-col gap-3.5 shadow-2xl my-auto"
        style={{ backgroundColor: '#0e1634' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <HeroMasteryFrame
              frameId={progress.activeFrameId}
              masteryLevel={progress.tier.level}
              size="preview"
              className="w-16 h-16 shrink-0"
            >
              <img
                src={hero.portraitUrl}
                alt={hero.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-[50%_22%]"
                style={{
                  filter:
                    equippedSkin && equippedSkin.portraitFilter !== 'none'
                      ? equippedSkin.portraitFilter
                      : undefined,
                }}
              />
            </HeroMasteryFrame>

            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Maestria & Molduras · {progress.tier.name} ·{' '}
                {isSignedIn ? 'Firestore' : 'Modo Local'}
              </div>
              <h2
                id="hero-mastery-modal-title"
                className="font-display text-3xl font-extrabold text-white leading-tight truncate"
              >
                {hero.name} — Nível {progress.tier.level}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono-num mt-0.5">
                <span>{progress.matches} partidas</span>
                <span aria-hidden="true">·</span>
                <span>{progress.kills} abates</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-bold">{progress.points} pts</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de maestria"
            className="w-9 h-9 rounded-lg border border-indigo-400/35 bg-slate-950/80 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Account-wide Frame Evolution Action Bar */}
        <div
          className="rounded-xl border border-amber-400/35 bg-slate-950/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-xs">
              <span className="font-bold text-white">
                Molduras Nv.2+:{' '}
                <span className="font-mono-num text-amber-300">
                  {accountSummary.evolvedFramesCount}/{accountSummary.totalHeroes}
                </span>
              </span>
              <span className="font-bold text-white">
                Coroa Solar (Nv.6):{' '}
                <span className="font-mono-num text-emerald-300">
                  {accountSummary.maxedFramesCount}/{accountSummary.totalHeroes}
                </span>
              </span>
              <span className="font-bold text-fuchsia-300 font-mono-num">
                Suas Gemas: {playerGems}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Evolua suas molduras jogando partidas ou diretamente com Gemas na sua conta.
            </p>
          </div>

          <button
            type="button"
            data-testid="btn-evolve-all-frames"
            disabled={syncing || batchPreview.evolvedCount === 0}
            onClick={onEvolveAllFrames}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all shrink-0 ${
              !syncing && batchPreview.evolvedCount > 0
                ? 'bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 cursor-pointer shadow-lg'
                : 'border border-slate-700 bg-slate-950/80 text-slate-400 cursor-not-allowed'
            }`}
          >
            {syncing
              ? 'Sincronizando...'
              : batchPreview.evolvedCount > 0
              ? `Evoluir Molduras da Conta (${batchPreview.evolvedCount}x · ${batchPreview.totalCostGems} Gemas)`
              : accountSummary.maxedFramesCount === accountSummary.totalHeroes
              ? 'Todas no Nv.6 ✓'
              : `Precisa ${accountSummary.cheapestNextCostGems ?? 25} Gemas`}
          </button>
        </div>

        {/* Status Feedback Banner */}
        {statusBanner && (
          <div
            role="status"
            data-testid="mastery-status-banner"
            className="rounded-xl border border-emerald-400/50 bg-emerald-950/60 px-3.5 py-2 text-xs font-semibold text-emerald-200"
          >
            {statusBanner}
          </div>
        )}

        {/* Mastery Progress Bar */}
        <div className="rounded-xl border border-indigo-400/25 bg-slate-950/75 p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-200">
              {progress.nextTier
                ? `Próximo desbloqueio: Nv.${progress.nextTier.level} · ${progress.nextTier.frameName}`
                : 'Nível máximo alcançado — Todas as molduras desbloqueadas'}
            </span>
            <span className="font-mono-num font-extrabold text-amber-300 shrink-0">
              {progress.nextTier
                ? `${progress.points} / ${progress.nextTier.minPoints} pts`
                : `${progress.points} pts`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress.progressPct}%`,
                backgroundColor: progress.tier.primaryColor,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              +{MASTERY_POINTS_PER_MATCH} pts por partida · +{MASTERY_POINTS_PER_KILL} pts por abate
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {progress.nextTier && nextUpgradeCost !== null ? (
                <button
                  type="button"
                  data-testid="btn-evolve-hero-frame"
                  disabled={!canAffordSelected}
                  onClick={onEvolveHeroFrame}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border transition-colors whitespace-nowrap ${
                    canAffordSelected
                      ? 'border-amber-300 bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                      : 'border-slate-700 bg-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Evoluir Moldura Nv.{progress.nextTier.level} · {nextUpgradeCost} Gemas
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold border border-emerald-400/50 bg-emerald-500/15 text-emerald-300">
                  Moldura Máxima ✓
                </span>
              )}
              <button
                type="button"
                onClick={() => onEquipFrame('auto')}
                aria-pressed={isAuto}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                  isAuto
                    ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                {isAuto ? 'Modo Automático Ativo ✓' : 'Equipar Sempre Maior Nível'}
              </button>
            </div>
          </div>
        </div>

        {/* 6 Cosmetic Portrait Frames Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {MASTERY_TIERS.map((tier) => {
            const unlocked = progress.unlockedFrames.includes(tier.frameId);
            const equipped = progress.activeFrameId === tier.frameId;
            const remainingPts = Math.max(0, tier.minPoints - progress.points);

            return (
              <div
                key={tier.frameId}
                data-testid={`mastery-frame-option-${tier.frameId}`}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                  equipped
                    ? 'border-amber-400 bg-indigo-950/75'
                    : unlocked
                    ? 'border-indigo-400/35 bg-slate-950/75'
                    : 'border-slate-800 bg-slate-950/50 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HeroMasteryFrame
                    frameId={tier.frameId}
                    masteryLevel={tier.level}
                    size="card"
                    showLevelBadge={false}
                    className={`w-14 h-14 shrink-0 ${!unlocked ? 'grayscale opacity-65' : ''}`}
                  >
                    <img
                      src={hero.portraitUrl}
                      alt={`${hero.name} com moldura ${tier.frameName}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-[50%_22%]"
                      style={{
                        filter:
                          equippedSkin && equippedSkin.portraitFilter !== 'none'
                            ? equippedSkin.portraitFilter
                            : undefined,
                      }}
                    />
                  </HeroMasteryFrame>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tier.primaryColor }}>
                      <MasteryFrameEmblemIcon frameId={tier.frameId} className="w-3.5 h-3.5 shrink-0" />
                      <span>Nível {tier.level}</span>
                    </div>
                    <div className="text-sm font-extrabold text-white leading-tight truncate">
                      {tier.frameName}
                    </div>
                    <div className="text-[10px] font-mono-num text-slate-400 mt-0.5">
                      {tier.minPoints === 0 ? 'Inicial' : `${tier.minPoints} pts`}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {tier.description}
                </p>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => onEquipFrame(tier.frameId)}
                    disabled={equipped}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold transition-colors whitespace-nowrap ${
                      equipped
                        ? 'bg-emerald-500/20 border border-emerald-400/45 text-emerald-300 cursor-default'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {equipped ? 'Equipada ✓' : 'Equipar Moldura'}
                  </button>
                ) : (
                  <div className="w-full py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] font-semibold text-center font-mono-num">
                    Faltam {remainingPts} pts
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
