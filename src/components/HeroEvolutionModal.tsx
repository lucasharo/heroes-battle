import React, { useEffect, useState } from 'react';
import { HERO_LIST, HEROES } from '../game/heroes';
import {
  HERO_EVOLUTION_TIERS,
  HeroEvolutionMap,
  MAX_HERO_EVOLUTION_LEVEL,
  computeAccountEvolutionSummary,
  computeEvolvedHeroStats,
  evolveAllEligibleHeroes,
  getHeroEvolutionLevel,
  getHeroEvolutionSpec,
  getNextEvolutionCostGems,
} from '../game/heroEvolution';
import { HeroMasteryMap, computeHeroMasteryProgress } from '../game/heroMastery';
import { HeroSkinsMap, resolveEquippedHeroSkin } from '../game/heroSkins';
import { HeroId } from '../game/types';
import { HeroMasteryFrame } from './HeroMasteryFrame';

interface HeroEvolutionModalProps {
  open: boolean;
  selectedHero: HeroId;
  heroEvolutions: HeroEvolutionMap;
  heroMastery: HeroMasteryMap;
  heroSkins: HeroSkinsMap;
  unlockedCosmetics: readonly string[];
  playerGems: number;
  isSignedIn: boolean;
  syncing?: boolean;
  statusBanner?: string | null;
  onSelectHero: (heroId: HeroId) => void;
  onEvolveHero: (heroId: HeroId) => void;
  onEvolveAll: () => void;
  onClose: () => void;
}

export const HeroEvolutionModal: React.FC<HeroEvolutionModalProps> = ({
  open,
  selectedHero,
  heroEvolutions,
  heroMastery,
  heroSkins,
  unlockedCosmetics,
  playerGems,
  isSignedIn,
  syncing = false,
  statusBanner,
  onSelectHero,
  onEvolveHero,
  onEvolveAll,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'evolved' | 'ready'>('all');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const summary = computeAccountEvolutionSummary(heroEvolutions, playerGems);
  const batchPreview = evolveAllEligibleHeroes(heroEvolutions, playerGems, selectedHero);
  const focusHero = HEROES[selectedHero];
  const focusLevel = getHeroEvolutionLevel(heroEvolutions, selectedHero);
  const focusSpec = getHeroEvolutionSpec(focusLevel);
  const focusStats = computeEvolvedHeroStats(selectedHero, focusLevel);
  const focusNextStats =
    focusLevel < MAX_HERO_EVOLUTION_LEVEL
      ? computeEvolvedHeroStats(selectedHero, focusLevel + 1)
      : null;
  const focusCost = getNextEvolutionCostGems(focusLevel);
  const focusMastery = computeHeroMasteryProgress(selectedHero, heroMastery[selectedHero]);
  const focusSkin = resolveEquippedHeroSkin(
    selectedHero,
    heroSkins[selectedHero],
    focusMastery,
    unlockedCosmetics
  );

  const filteredHeroes = HERO_LIST.filter((hero) => {
    const lvl = getHeroEvolutionLevel(heroEvolutions, hero.id);
    const cost = getNextEvolutionCostGems(lvl);
    if (filter === 'evolved') return lvl > 1;
    if (filter === 'ready') return cost !== null && playerGems >= cost;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      style={{ backgroundColor: 'rgba(6, 9, 24, 0.86)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-evolution-title"
    >
      <div
        data-testid="hero-evolution-modal"
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl border-2 border-cyan-400/50 p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 overflow-hidden"
        style={{ backgroundColor: '#0b1128' }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Progressão Permanente da Conta · {isSignedIn ? 'Sincronizado com Firestore' : 'Modo Local'}
            </div>
            <h2
              id="hero-evolution-title"
              className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight"
            >
              Evolução de Heróis
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Evolução de Heróis"
            className="w-9 h-9 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Account Summary & Batch Account Upgrade Action */}
        <div
          className="rounded-xl border border-indigo-400/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
          style={{ backgroundColor: 'rgba(15, 23, 54, 0.92)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="font-bold text-white">
                Heróis Evoluídos:{' '}
                <span data-testid="evo-account-count" className="font-mono-num text-cyan-300">
                  {summary.evolvedHeroesCount}/{summary.totalHeroes}
                </span>
              </span>
              <span className="font-bold text-white">
                Níveis Ganhos:{' '}
                <span className="font-mono-num text-amber-300">
                  +{summary.totalBonusLevels}/{summary.maxBonusLevels}
                </span>
              </span>
              <span className="font-bold text-fuchsia-300 font-mono-num">
                Suas Gemas: {playerGems}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Cada evolução aumenta permanentemente o <span className="text-white font-semibold">HP</span> e o{' '}
              <span className="text-amber-300 font-semibold">ATK</span> do herói nas partidas e no Laboratório de Treino (Nv.1 a Nv.5 até +35%).
            </p>
          </div>

          <button
            type="button"
            data-testid="btn-evolve-all"
            disabled={syncing || batchPreview.evolvedCount === 0}
            onClick={onEvolveAll}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all shrink-0 ${
              !syncing && batchPreview.evolvedCount > 0
                ? 'bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 cursor-pointer shadow-lg'
                : 'border border-slate-700 bg-slate-950/80 text-slate-400 cursor-not-allowed'
            }`}
          >
            {syncing
              ? 'Sincronizando...'
              : batchPreview.evolvedCount > 0
              ? `Evoluir Heróis da Conta (${batchPreview.evolvedCount}x · ${batchPreview.totalCostGems} Gemas)`
              : summary.maxedHeroesCount === summary.totalHeroes
              ? 'Todos no Nv. Máximo ✓'
              : `Precisa ${summary.cheapestNextCostGems ?? 25} Gemas`}
          </button>
        </div>

        {/* Selected Hero Focus Strip */}
        <div
          data-testid="evo-focus-card"
          className="rounded-xl border border-cyan-400/35 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
          style={{ backgroundColor: 'rgba(13, 21, 50, 0.92)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <HeroMasteryFrame
              frameId={focusMastery.activeFrameId}
              masteryLevel={focusMastery.tier.level}
              size="card"
              className="w-14 h-14 shrink-0"
            >
              {!imgErrors[focusHero.id] ? (
                <img
                  src={focusHero.portraitUrl}
                  alt={focusHero.name}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [focusHero.id]: true }))
                  }
                  className="w-full h-full object-cover object-top"
                  style={{
                    filter:
                      focusSkin.portraitFilter !== 'none'
                        ? focusSkin.portraitFilter
                        : undefined,
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display text-2xl font-extrabold"
                  style={{ backgroundColor: focusHero.accentSoft, color: focusSkin.accentColor }}
                >
                  {focusHero.name[0]}
                </div>
              )}
            </HeroMasteryFrame>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-extrabold text-white leading-none">
                  {focusHero.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border"
                  style={{
                    color: focusSpec.badgeColor,
                    borderColor: `${focusSpec.badgeColor}66`,
                    backgroundColor: 'rgba(9, 14, 34, 0.85)',
                  }}
                >
                  Nv.{focusLevel} · {focusSpec.title} ({focusStats.bonusPct > 0 ? `+${focusStats.bonusPct}%` : 'Base'})
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-mono-num">
                <span className="text-slate-200">
                  HP <strong className="text-white">{focusStats.maxHp}</strong>
                  {focusNextStats && (
                    <span className="text-emerald-300"> → {focusNextStats.maxHp}</span>
                  )}
                </span>
                <span className="text-amber-300">
                  ATK <strong className="text-amber-200">{focusStats.attackDamage}</strong>
                  {focusNextStats && (
                    <span className="text-emerald-300"> → {focusNextStats.attackDamage}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {focusCost !== null ? (
            <button
              type="button"
              data-testid="btn-evolve-selected"
              disabled={syncing || playerGems < focusCost}
              onClick={() => onEvolveHero(selectedHero)}
              className={`px-3.5 py-2 rounded-lg font-extrabold text-xs whitespace-nowrap transition-all shrink-0 ${
                !syncing && playerGems >= focusCost
                  ? 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 cursor-pointer shadow-md'
                  : 'border border-slate-700 bg-slate-950/80 text-slate-400 cursor-not-allowed'
              }`}
            >
              Evoluir {focusHero.name} · {focusCost} Gemas
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-lg border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 text-xs font-extrabold whitespace-nowrap shrink-0">
              Evolução Máxima (Nv.5) ✓
            </div>
          )}
        </div>

        {/* Status Feedback Banner */}
        {statusBanner && (
          <div
            role="status"
            data-testid="evo-status-banner"
            className="rounded-xl border border-emerald-400/50 bg-emerald-950/60 px-3.5 py-2 text-xs font-semibold text-emerald-200 shrink-0"
          >
            {statusBanner}
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div
            className="flex flex-wrap p-1 rounded-xl border border-indigo-400/30 gap-1"
            style={{ backgroundColor: 'rgba(10, 16, 40, 0.9)' }}
            role="group"
            aria-label="Filtrar heróis para evolução"
          >
            {[
              { id: 'all' as const, label: `Todos (${HERO_LIST.length})` },
              { id: 'evolved' as const, label: `Evoluídos (${summary.evolvedHeroesCount})` },
              { id: 'ready' as const, label: `Prontos (${summary.eligibleNowCount})` },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono-num text-slate-400">
            Custos: {HERO_EVOLUTION_TIERS.filter((t) => t.upgradeCostGems !== null)
              .map((t) => `Nv.${t.level + 1}: ${t.upgradeCostGems}G`)
              .join(' · ')}
          </div>
        </div>

        {/* Scrollable 21-Hero Evolution Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {filteredHeroes.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-center text-xs text-slate-300">
              Nenhum herói encontrado neste filtro. Conclua Missões Diárias ou avance no Passe de Batalha para ganhar Gemas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pb-1">
              {filteredHeroes.map((hero) => {
                const lvl = getHeroEvolutionLevel(heroEvolutions, hero.id);
                const spec = getHeroEvolutionSpec(lvl);
                const stats = computeEvolvedHeroStats(hero.id, lvl);
                const nextStats =
                  lvl < MAX_HERO_EVOLUTION_LEVEL
                    ? computeEvolvedHeroStats(hero.id, lvl + 1)
                    : null;
                const cost = getNextEvolutionCostGems(lvl);
                const canAfford = cost !== null && playerGems >= cost;
                const isSelected = hero.id === selectedHero;
                const heroMasteryProg = computeHeroMasteryProgress(
                  hero.id,
                  heroMastery[hero.id]
                );
                const heroSkin = resolveEquippedHeroSkin(
                  hero.id,
                  heroSkins[hero.id],
                  heroMasteryProg,
                  unlockedCosmetics
                );

                return (
                  <div
                    key={hero.id}
                    data-testid={`evo-card-${hero.id}`}
                    data-evo-level={lvl}
                    className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'border-cyan-400/80 bg-slate-900/95'
                        : 'border-indigo-400/25 bg-slate-950/75'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectHero(hero.id)}
                        className="w-12 h-12 rounded-lg overflow-hidden border shrink-0 cursor-pointer bg-slate-950"
                        style={{ borderColor: spec.badgeColor }}
                        aria-label={`Selecionar ${hero.name}`}
                      >
                        {!imgErrors[hero.id] ? (
                          <img
                            src={hero.portraitUrl}
                            alt={hero.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [hero.id]: true }))
                            }
                            className="w-full h-full object-cover object-top"
                            style={{
                              filter:
                                heroSkin.portraitFilter !== 'none'
                                  ? heroSkin.portraitFilter
                                  : undefined,
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center font-display text-xl font-extrabold"
                            style={{ backgroundColor: hero.accentSoft, color: heroSkin.accentColor }}
                          >
                            {hero.name[0]}
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-display text-lg font-extrabold text-white leading-none truncate">
                            {hero.name}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-extrabold shrink-0"
                            style={{
                              color: spec.badgeColor,
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: `1px solid ${spec.badgeColor}55`,
                            }}
                          >
                            Nv.{lvl}/{MAX_HERO_EVOLUTION_LEVEL}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold mt-0.5" style={{ color: spec.badgeColor }}>
                          {spec.title} · {stats.bonusPct > 0 ? `+${stats.bonusPct}% Status` : 'Status Base'}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-mono-num text-slate-200">
                          <span>
                            HP {stats.maxHp}
                            {nextStats ? ` → ${nextStats.maxHp}` : ''}
                          </span>
                          <span className="text-amber-300">
                            ATK {stats.attackDamage}
                            {nextStats ? ` → ${nextStats.attackDamage}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {cost !== null ? (
                      <button
                        type="button"
                        data-testid={`evo-upgrade-${hero.id}`}
                        disabled={syncing || !canAfford}
                        onClick={() => onEvolveHero(hero.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all ${
                          !syncing && canAfford
                            ? 'bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] text-slate-950 cursor-pointer'
                            : 'border border-slate-800 bg-slate-900/70 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Evoluir Nv.{lvl + 1} · {cost} Gemas
                      </button>
                    ) : (
                      <div className="w-full py-1.5 px-2.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 text-xs font-extrabold text-center">
                        Supremo (Máx) ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
