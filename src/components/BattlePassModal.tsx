import React, { useEffect, useState } from 'react';
import {
  BATTLE_PASS_ELITE_COST_GEMS,
  BATTLE_PASS_MAX_SEASON_XP,
  BATTLE_PASS_SEASON_NAME,
  BATTLE_PASS_TIERS,
  BattlePassReward,
  BattlePassState,
  BattlePassTrack,
  computeBattlePassSummary,
} from '../game/battlePass';
import { HEROES } from '../game/heroes';
import { getHeroSkinSpec } from '../game/heroSkins';
import { HeroId } from '../game/types';

interface BattlePassModalProps {
  open: boolean;
  battlePass: BattlePassState;
  playerGems: number;
  selectedHero: HeroId;
  lastBanner: string | null;
  onClaimReward: (tier: number, track: BattlePassTrack) => void;
  onClaimAll: () => void;
  onUnlockElite: () => void;
  onInspectHeroSkin: (heroId: HeroId) => void;
  onClose: () => void;
}

const RewardCell: React.FC<{
  tier: number;
  track: BattlePassTrack;
  reward: BattlePassReward;
  tierReached: boolean;
  trackUnlocked: boolean;
  claimed: boolean;
  selectedHero: HeroId;
  onClaim: () => void;
  onInspectHeroSkin: (heroId: HeroId) => void;
}> = ({
  tier,
  track,
  reward,
  tierReached,
  trackUnlocked,
  claimed,
  selectedHero,
  onClaim,
  onInspectHeroSkin,
}) => {
  const canClaim = tierReached && trackUnlocked && !claimed;
  const isElite = track === 'elite';

  const previewHeroId: HeroId | null =
    reward.kind === 'skin'
      ? reward.heroIds === 'all'
        ? selectedHero
        : reward.heroIds[0] ?? selectedHero
      : null;
  const previewHero = previewHeroId ? HEROES[previewHeroId] : null;
  const previewSkin =
    reward.kind === 'skin' && previewHeroId
      ? getHeroSkinSpec(previewHeroId, reward.skinId)
      : null;

  return (
    <div
      data-testid={`bp-cell-${tier}-${track}`}
      className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all ${
        claimed
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : canClaim
          ? isElite
            ? 'border-amber-400 bg-amber-950/25 shadow-lg'
            : 'border-cyan-400 bg-cyan-950/25 shadow-lg'
          : isElite && !trackUnlocked
          ? 'border-amber-500/20 bg-slate-950/60 opacity-85'
          : 'border-indigo-400/25 bg-slate-950/75'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {reward.kind === 'gems' ? (
          <div
            className="w-11 h-11 rounded-xl border border-fuchsia-400/45 flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(42, 18, 66, 0.85)' }}
          >
            <svg
              className="w-5 h-5 text-fuchsia-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 3h12l4 6-10 12L2 9l4-6zm2.2 2L5.5 9h13l-2.7-4H8.2zM6 11l6 7.2L18 11H6z" />
            </svg>
          </div>
        ) : (
          previewHero &&
          previewSkin && (
            <button
              type="button"
              onClick={() => onInspectHeroSkin(previewHero.id)}
              title={`Visualizar ${previewSkin.name} em ${previewHero.name}`}
              className="relative w-11 h-12 rounded-xl overflow-hidden border-2 shrink-0 bg-slate-950 cursor-pointer hover:scale-105 transition-transform"
              style={{ borderColor: previewSkin.accentColor }}
            >
              <img
                src={previewHero.portraitUrl}
                alt={`${previewHero.name} - ${previewSkin.name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
                style={{
                  filter:
                    previewSkin.portraitFilter !== 'none'
                      ? previewSkin.portraitFilter
                      : undefined,
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ backgroundColor: previewSkin.accentColor }}
              />
            </button>
          )
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider ${
                isElite ? 'text-amber-300' : 'text-cyan-300'
              }`}
            >
              {isElite ? 'Passe Elite' : 'Passe Grátis'}
            </span>
            {reward.kind === 'skin' && (
              <span
                className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider border"
                style={{
                  color: previewSkin?.accentColor ?? '#38bdf8',
                  borderColor: `${previewSkin?.accentColor ?? '#38bdf8'}55`,
                  backgroundColor: 'rgba(10, 16, 40, 0.9)',
                }}
              >
                Cosmético
              </span>
            )}
          </div>

          <div className="text-sm font-extrabold text-white leading-tight mt-0.5 truncate">
            {reward.label}
          </div>

          {reward.kind === 'skin' ? (
            <p className="text-[11px] text-slate-300 leading-snug mt-0.5 line-clamp-2">
              {reward.description}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              Moeda cosmética para o Passe Elite
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {claimed ? (
          <div className="w-full py-1.5 px-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-[11px] font-extrabold text-center whitespace-nowrap">
            Resgatado ✓
          </div>
        ) : canClaim ? (
          <button
            type="button"
            data-testid={`bp-claim-${tier}-${track}`}
            onClick={onClaim}
            className={`w-full py-1.5 px-3 rounded-lg font-extrabold text-xs text-slate-950 whitespace-nowrap cursor-pointer shadow-md active:scale-[0.98] transition-all ${
              isElite
                ? 'bg-amber-400 hover:bg-amber-300'
                : 'bg-cyan-400 hover:bg-cyan-300'
            }`}
          >
            Resgatar Recompensa
          </button>
        ) : !trackUnlocked ? (
          <div className="w-full py-1.5 px-2.5 rounded-lg border border-amber-500/30 bg-slate-900/90 text-amber-200/80 text-[11px] font-bold text-center whitespace-nowrap">
            Requer Passe Elite
          </div>
        ) : (
          <div className="w-full py-1.5 px-2.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] font-semibold text-center whitespace-nowrap">
            Bloqueado · Patamar {tier}
          </div>
        )}
      </div>
    </div>
  );
};

export const BattlePassModal: React.FC<BattlePassModalProps> = ({
  open,
  battlePass,
  playerGems,
  selectedHero,
  lastBanner,
  onClaimReward,
  onClaimAll,
  onUnlockElite,
  onInspectHeroSkin,
  onClose,
}) => {
  const [trackFilter, setTrackFilter] = useState<'all' | 'claimable' | 'skins'>('all');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const summary = computeBattlePassSummary(battlePass);
  const canAffordElite = playerGems >= BATTLE_PASS_ELITE_COST_GEMS;

  const visibleTiers = BATTLE_PASS_TIERS.filter((def) => {
    if (trackFilter === 'skins') {
      return def.freeReward.kind === 'skin' || def.eliteReward.kind === 'skin';
    }
    if (trackFilter === 'claimable') {
      return (
        summary.claimableFreeTiers.includes(def.tier) ||
        summary.claimableEliteTiers.includes(def.tier)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(8, 12, 28, 0.86)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-pass-modal-title"
      data-testid="battle-pass-modal"
    >
      <div
        className="w-full max-w-4xl rounded-2xl border-2 border-amber-400/50 p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92dvh]"
        style={{ backgroundColor: '#0e1635' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              {BATTLE_PASS_SEASON_NAME} · 12 Patamares
            </span>
            <h2
              id="battle-pass-modal-title"
              className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight"
            >
              Passe de Batalha
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Passe de Batalha"
            className="w-8 h-8 rounded-lg border border-indigo-400/35 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Top Seasonal Progress & Elite Activation Banner */}
        <div
          className="rounded-xl border border-indigo-400/35 p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shrink-0"
          style={{ backgroundColor: 'rgba(16, 26, 64, 0.92)' }}
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex flex-col items-center justify-center shrink-0 shadow-lg border border-amber-200/60">
              <span className="text-[9px] font-extrabold uppercase leading-none">
                Patamar
              </span>
              <span
                data-testid="bp-current-tier"
                className="font-display text-2xl font-extrabold leading-none mt-0.5"
              >
                {summary.currentTier}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white truncate">
                  {summary.nextTierXpTarget
                    ? `Próximo patamar (${summary.currentTier + 1}/${summary.maxTier})`
                    : 'Passe Completo! Todos os patamares alcançados'}
                </span>
                <span
                  data-testid="bp-season-xp"
                  className="font-mono-num font-extrabold text-cyan-300 shrink-0"
                >
                  {summary.nextTierXpTarget
                    ? `${summary.seasonXp} / ${summary.nextTierXpTarget} XP`
                    : `${summary.seasonXp} / ${BATTLE_PASS_MAX_SEASON_XP} XP`}
                </span>
              </div>

              <div className="mt-1.5 h-2.5 rounded-full bg-slate-950 overflow-hidden border border-indigo-400/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 transition-all duration-300"
                  style={{ width: `${summary.progressPct}%` }}
                />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-300">
                <span>
                  Jogue partidas (+65 a +345 XP) e conclua missões diárias (+40 XP)
                </span>
                <span className="font-mono-num text-amber-300 font-bold">
                  {summary.unlockedSkinsCount} desbloqueios de skins obtidos
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {summary.claimableCount > 0 && (
              <button
                type="button"
                data-testid="bp-claim-all"
                onClick={onClaimAll}
                className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 font-extrabold text-xs whitespace-nowrap cursor-pointer shadow-md"
              >
                Resgatar Tudo ({summary.claimableCount})
              </button>
            )}

            {summary.premiumUnlocked ? (
              <div
                data-testid="bp-elite-active"
                className="px-3.5 py-2 rounded-xl border border-amber-400/60 bg-amber-400/15 text-amber-200 font-extrabold text-xs whitespace-nowrap flex items-center gap-1.5"
              >
                <span>Passe Elite Ativo ✓</span>
              </div>
            ) : (
              <button
                type="button"
                data-testid="bp-unlock-elite"
                disabled={!canAffordElite}
                onClick={onUnlockElite}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  canAffordElite
                    ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer shadow-lg'
                    : 'border border-amber-400/30 bg-slate-950/80 text-amber-200/60 cursor-not-allowed'
                }`}
              >
                <span>Ativar Passe Elite · {BATTLE_PASS_ELITE_COST_GEMS} Gemas</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {lastBanner && (
          <div
            role="status"
            data-testid="bp-status-banner"
            className="rounded-xl border border-emerald-400/50 bg-emerald-950/60 px-3.5 py-2 text-xs font-semibold text-emerald-200 shrink-0"
          >
            {lastBanner}
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div
            className="flex flex-wrap sm:flex-nowrap max-w-full p-1 rounded-xl border border-indigo-400/30 gap-1"
            style={{ backgroundColor: 'rgba(10, 16, 40, 0.9)' }}
            role="group"
            aria-label="Filtrar patamares do Passe de Batalha"
          >
            {[
              { id: 'all' as const, label: 'Todos (12)' },
              { id: 'skins' as const, label: 'Skins Exclusivas (6)' },
              {
                id: 'claimable' as const,
                label: `Disponíveis (${summary.claimableCount})`,
              },
            ].map((tab) => {
              const active = trackFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTrackFilter(tab.id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-num text-fuchsia-300 font-bold">
            <span>Suas Gemas: {playerGems.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Tiered Free vs Elite Track Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5">
          {visibleTiers.length === 0 ? (
            <div className="rounded-xl border border-indigo-400/25 bg-slate-950/60 p-6 text-center text-xs text-slate-300">
              Nenhuma recompensa disponível para resgate imediato. Jogue partidas para ganhar XP Sazonal!
            </div>
          ) : (
            visibleTiers.map((def) => {
              const reached = summary.currentTier >= def.tier;
              const freeClaimed = battlePass.claimedFreeTiers.includes(def.tier);
              const eliteClaimed = battlePass.claimedEliteTiers.includes(def.tier);

              return (
                <div
                  key={def.tier}
                  data-testid={`bp-tier-row-${def.tier}`}
                  className={`rounded-xl border p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch ${
                    reached
                      ? 'border-cyan-400/45 bg-indigo-950/45'
                      : 'border-indigo-400/20 bg-slate-950/55'
                  }`}
                >
                  {/* Tier Milestone Column */}
                  <div className="md:col-span-2 flex md:flex-col items-center justify-between md:justify-center gap-2 rounded-lg border border-indigo-400/20 bg-slate-950/75 px-3 py-2 text-center">
                    <div className="flex md:flex-col items-center gap-2 md:gap-0.5">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg font-extrabold ${
                          reached
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {def.tier}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Patamar {def.tier}
                      </span>
                    </div>
                    <span
                      className={`font-mono-num text-[11px] font-extrabold ${
                        reached ? 'text-emerald-300' : 'text-slate-300'
                      }`}
                    >
                      {def.xpRequired} XP
                    </span>
                  </div>

                  {/* Free Track Reward */}
                  <div className="md:col-span-5">
                    <RewardCell
                      tier={def.tier}
                      track="free"
                      reward={def.freeReward}
                      tierReached={reached}
                      trackUnlocked={true}
                      claimed={freeClaimed}
                      selectedHero={selectedHero}
                      onClaim={() => onClaimReward(def.tier, 'free')}
                      onInspectHeroSkin={onInspectHeroSkin}
                    />
                  </div>

                  {/* Elite Track Reward */}
                  <div className="md:col-span-5">
                    <RewardCell
                      tier={def.tier}
                      track="elite"
                      reward={def.eliteReward}
                      tierReached={reached}
                      trackUnlocked={summary.premiumUnlocked}
                      claimed={eliteClaimed}
                      selectedHero={selectedHero}
                      onClaim={() => onClaimReward(def.tier, 'elite')}
                      onInspectHeroSkin={onInspectHeroSkin}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
