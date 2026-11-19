import React, { useEffect, useState } from 'react';
import { MAP_LIST } from '../game/arena';
import { BattlePassState, computeBattlePassSummary } from '../game/battlePass';
import {
  HeroEvolutionMap,
  computeAccountEvolutionSummary,
  computeEvolvedHeroStats,
  getHeroEvolutionLevel,
  getHeroEvolutionSpec,
} from '../game/heroEvolution';
import {
  HeroMasteryMap,
  MASTERY_TIERS,
  computeHeroMasteryProgress,
} from '../game/heroMastery';
import {
  HeroSkinsMap,
  getHeroSkinCatalog,
  getUnlockedHeroSkinIds,
  isHeroSkinUnlocked,
  resolveEquippedHeroSkin,
} from '../game/heroSkins';
import { HERO_LIST, HERO_TIER_META, HEROES } from '../game/heroes';
import { getRankTier } from '../game/ranking';
import { GameMode, HeroId, HeroSkinId, HeroTier, MapId, UserProfile } from '../game/types';
import { LoginStreakBonusInfo } from '../services/dailyQuestsService';
import { SkillSlotIcon, ThetanTitleEmblem } from './GameIcons';
import { HeroMasteryFrame, MasteryFrameEmblemIcon } from './HeroMasteryFrame';

interface TitleScreenProps {
  selectedHero: HeroId;
  selectedMode: GameMode;
  selectedMap: MapId;
  currentUser: UserProfile | null;
  authReady: boolean;
  leaderboardCount: number;
  playerLevel: number;
  playerGems: number;
  loginStreak: number;
  loginBonus: LoginStreakBonusInfo | null;
  claimableQuestsCount: number;
  completedQuestsCount: number;
  heroMastery: HeroMasteryMap;
  heroSkins: HeroSkinsMap;
  heroEvolutions: HeroEvolutionMap;
  battlePass: BattlePassState;
  requestedRightTab?: { tab: 'heroes' | 'skins'; nonce: number } | null;
  disableStartHotkey?: boolean;
  onSelectHero: (heroId: HeroId) => void;
  onEquipSkin: (heroId: HeroId, skinId: HeroSkinId) => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectMap: (mapId: MapId) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenRanking: () => void;
  onOpenRecentMatches: () => void;
  onOpenQuests: () => void;
  onOpenBattlePass: () => void;
  onOpenMasteryModal: () => void;
  onOpenEvolutionModal: () => void;
  onDismissLoginBonus: () => void;
  welcomeGiftGems?: number | null;
  onDismissWelcomeGift?: () => void;
  onLogout: () => void;
  onStart: () => void;
  onOpenTraining: () => void;
}

const MODE_OPTIONS: Array<{
  id: GameMode;
  label: string;
  sub: string;
  activeBg: string;
}> = [
  { id: 'royale', label: 'Battle Royale', sub: '8 Heróis Solo', activeBg: '#fbbf24' },
  { id: 'brawl', label: 'Deathmatch 4v4', sub: '12 Abates', activeBg: '#38bdf8' },
  { id: 'superstar', label: 'Super Estrela', sub: 'Segure 10 ★', activeBg: '#facc15' },
  { id: 'tower', label: 'Cerco à Torre', sub: 'Destrua a Base', activeBg: '#fb7185' },
];

const TIER_FILTERS: Array<{ id: 'todos' | HeroTier; label: string }> = [
  { id: 'todos', label: 'Todos (21)' },
  { id: 'comum', label: 'Comum (9)' },
  { id: 'epico', label: 'Épico (6)' },
  { id: 'lendario', label: 'Lendário (6)' },
];

const RARITY_COLOR: Record<string, string> = {
  Padrão: '#94a3b8',
  Inicial: '#38bdf8',
  Épica: '#fbbf24',
  Lendária: '#c084fc',
  'Passe de Batalha': '#22d3ee',
};

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedHero,
  selectedMode,
  selectedMap,
  currentUser,
  authReady,
  leaderboardCount,
  playerLevel,
  playerGems,
  loginStreak,
  loginBonus,
  claimableQuestsCount,
  completedQuestsCount,
  heroMastery,
  heroSkins,
  heroEvolutions,
  battlePass,
  requestedRightTab,
  disableStartHotkey = false,
  onSelectHero,
  onEquipSkin,
  onSelectMode,
  onSelectMap,
  onOpenAuth,
  onOpenRanking,
  onOpenRecentMatches,
  onOpenQuests,
  onOpenBattlePass,
  onOpenMasteryModal,
  onOpenEvolutionModal,
  onDismissLoginBonus,
  welcomeGiftGems = null,
  onDismissWelcomeGift,
  onLogout,
  onStart,
  onOpenTraining,
}) => {
  const hero = HEROES[selectedHero];
  const heroTierMeta = HERO_TIER_META[hero.tier];
  const featuredEvolutionLevel = getHeroEvolutionLevel(heroEvolutions, selectedHero);
  const featuredEvolutionSpec = getHeroEvolutionSpec(featuredEvolutionLevel);
  const featuredEvolvedStats = computeEvolvedHeroStats(selectedHero, featuredEvolutionLevel);
  const accountEvolutionSummary = computeAccountEvolutionSummary(heroEvolutions, playerGems);
  const featuredMastery = computeHeroMasteryProgress(selectedHero, heroMastery[selectedHero]);
  const battlePassSummary = computeBattlePassSummary(battlePass);
  const skinCatalog = getHeroSkinCatalog(selectedHero);
  const unlockedSkinIds = getUnlockedHeroSkinIds(
    selectedHero,
    featuredMastery,
    battlePass.unlockedCosmetics
  );
  const activeSkin = resolveEquippedHeroSkin(
    selectedHero,
    heroSkins[selectedHero],
    featuredMastery,
    battlePass.unlockedCosmetics
  );

  const [rightTab, setRightTab] = useState<'heroes' | 'skins'>('heroes');
  const [tierFilter, setTierFilter] = useState<'todos' | HeroTier>('todos');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!requestedRightTab) return;
    setRightTab(requestedRightTab.tab);
  }, [requestedRightTab]);

  useEffect(() => {
    if (disableStartHotkey) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)
      ) {
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart, disableStartHotkey]);

  const skillList = [hero.skills.basic, hero.skills.q, hero.skills.e, hero.skills.r];
  const visibleHeroes =
    tierFilter === 'todos'
      ? HERO_LIST
      : HERO_LIST.filter((item) => item.tier === tierFilter);
  const rankTier = currentUser ? getRankTier(currentUser.trophies) : null;
  const favoriteSkin = currentUser
    ? resolveEquippedHeroSkin(
        currentUser.favoriteHero,
        heroSkins[currentUser.favoriteHero],
        heroMastery[currentUser.favoriteHero],
        battlePass.unlockedCosmetics
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-start lg:justify-between p-3.5 sm:p-4 md:p-5 pointer-events-auto lg:pointer-events-none overflow-y-auto lg:overflow-hidden"
      style={{
        background:
          'linear-gradient(100deg, rgba(11, 16, 44, 0.92) 0%, rgba(16, 24, 62, 0.76) 52%, rgba(13, 19, 46, 0.54) 100%)',
      }}
    >
      {/* Top Account & Global Ranking Bar */}
      <div className="max-w-[1380px] w-full mx-auto flex flex-wrap items-center justify-between gap-2 pb-3 lg:pb-2 shrink-0 pointer-events-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">
          Temporada Oficial · Arena 21 Heróis
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="title-wallet-badge"
            title={`Sequência de login diário: ${loginStreak} ${loginStreak === 1 ? 'dia' : 'dias'}`}
            className="px-2.5 py-1.5 rounded-lg border border-indigo-400/35 bg-slate-950/75 flex items-center gap-2 text-xs font-mono-num"
          >
            <span className="font-extrabold text-cyan-300">Nv. {playerLevel}</span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-extrabold text-fuchsia-300">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6 3h12l4 6-10 12L2 9l4-6zm2.2 2L5.5 9h13l-2.7-4H8.2zM6 11l6 7.2L18 11H6z" />
              </svg>
              {playerGems}
            </span>
            <span className="text-slate-600">·</span>
            <span
              data-testid="title-login-streak"
              className="flex items-center gap-1 font-extrabold text-amber-300"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 2.2c.3 2.5-.8 4.4-2.3 5.9-1.1 1.1-1.9 2.2-1.9 3.7 0 1.2.8 2.3 1.9 2.6-.5-.9-.4-2 .4-2.8.8-.8 1.5-1.7 1.7-3 1.9 1.3 3.2 3.4 3.2 5.9 0 3.7-3 6.7-6.8 6.7S3 18.2 3 14.5c0-3.2 2-5.9 4.5-7.9 2-1.6 4.4-2.7 6-4.4z" />
              </svg>
              {loginStreak}d
            </span>
          </div>

          <button
            type="button"
            data-testid="btn-open-battle-pass"
            onClick={onOpenBattlePass}
            className="px-3 py-1.5 rounded-lg border border-amber-400/55 bg-slate-950/75 hover:bg-amber-400/15 text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0 text-amber-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
            </svg>
            <span>Passe de Batalha</span>
            {battlePassSummary.claimableCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono-num text-[10px] font-extrabold">
                {battlePassSummary.claimableCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono-num text-[10px]">
                P{battlePassSummary.currentTier}/{battlePassSummary.maxTier}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenQuests}
            className="px-3 py-1.5 rounded-lg border border-cyan-400/50 bg-slate-950/75 hover:bg-cyan-400/15 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 3h6a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2-2zm0 2v1h6V5H9zm-.3 7.3-1.4 1.4 2.7 2.7 5.7-5.7-1.4-1.4-4.3 4.3-1.3-1.3z" />
            </svg>
            <span>Missões Diárias</span>
            {claimableQuestsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono-num text-[10px] font-extrabold">
                {claimableQuestsCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 font-mono-num text-[10px]">
                {completedQuestsCount}/3
              </span>
            )}
          </button>

          <button
            type="button"
            data-testid="btn-recent-matches"
            onClick={onOpenRecentMatches}
            className="px-3 py-1.5 rounded-lg border border-indigo-400/50 bg-slate-950/75 hover:bg-indigo-400/15 text-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
            </svg>
            <span>Partidas Recentes</span>
          </button>

          <button
            type="button"
            onClick={onOpenRanking}
            className="px-3 py-1.5 rounded-lg border border-amber-400/50 bg-slate-950/75 hover:bg-amber-400/15 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 4h14v3a5 5 0 0 1-4 4.9V15h3v2H6v-2h3v-3.1A5 5 0 0 1 5 7V4zm-2 1h1.5v3.5A2.5 2.5 0 0 1 2 6V5h1zm17 0h1v1a2.5 2.5 0 0 1-2.5 2.5V5H20zm-8 14h4v2H8v-2h4z" />
            </svg>
            <span>Ranking Global</span>
            {leaderboardCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono-num text-[10px]">
                {leaderboardCount}
              </span>
            )}
          </button>

          {currentUser && rankTier ? (
            <div
              className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-lg border border-indigo-400/40"
              style={{ backgroundColor: 'rgba(11, 17, 42, 0.9)' }}
            >
              <img
                src={HEROES[currentUser.favoriteHero]?.portraitUrl ?? HEROES.steelshot.portraitUrl}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded object-cover object-top border border-amber-400"
                style={{
                  filter:
                    favoriteSkin && favoriteSkin.portraitFilter !== 'none'
                      ? favoriteSkin.portraitFilter
                      : undefined,
                }}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white max-w-[130px] truncate">
                  {currentUser.displayName}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                  style={{
                    color: rankTier.color,
                    backgroundColor: rankTier.bg,
                    borderColor: rankTier.border,
                  }}
                >
                  {rankTier.label}
                </span>
                <span className="text-xs font-extrabold text-amber-400 font-mono-num">
                  {currentUser.trophies} 🏆
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-1 rounded text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : authReady ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-lg border border-indigo-400/45 bg-slate-950/75 hover:bg-indigo-950 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Criar Conta
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 px-2">Conectando...</span>
          )}
        </div>
      </div>

      {/* Welcome 10k Gems Account Gift Banner */}
      {welcomeGiftGems && welcomeGiftGems > 0 && (
        <div
          data-testid="welcome-gift-toast"
          role="status"
          className="max-w-[1380px] w-full mx-auto mb-2 pointer-events-auto shrink-0"
        >
          <div
            className="rounded-xl border border-fuchsia-400/60 px-3.5 py-2 flex items-center justify-between gap-3 text-xs shadow-lg"
            style={{ backgroundColor: 'rgba(34, 17, 56, 0.95)' }}
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-fuchsia-400 text-slate-950 font-mono-num font-extrabold text-[11px] shrink-0">
                Pacote da Temporada
              </span>
              <span className="text-slate-100 font-semibold truncate">
                Bônus exclusivo creditado na sua conta:
              </span>
              <span className="font-mono-num font-extrabold text-fuchsia-300 whitespace-nowrap shrink-0">
                +{welcomeGiftGems.toLocaleString('pt-BR')} Gemas
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenEvolutionModal}
                className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[11px] cursor-pointer whitespace-nowrap"
              >
                Evoluir Heróis
              </button>
              {onDismissWelcomeGift && (
                <button
                  type="button"
                  onClick={onDismissWelcomeGift}
                  aria-label="Fechar aviso de bônus da temporada"
                  className="w-6 h-6 rounded text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Login Streak Bonus Banner */}
      {loginBonus && (
        <div
          data-testid="login-streak-toast"
          role="status"
          className="max-w-[1380px] w-full mx-auto mb-2 pointer-events-auto shrink-0"
        >
          <div
            className="rounded-xl border border-amber-400/55 px-3.5 py-2 flex items-center justify-between gap-3 text-xs shadow-lg"
            style={{ backgroundColor: 'rgba(28, 22, 52, 0.94)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-num font-extrabold text-[11px] shrink-0">
                Dia {loginBonus.streak}
              </span>
              <span className="text-slate-100 font-semibold truncate">
                {loginBonus.wasReset
                  ? `Sequência reiniciada! Bônus diário recebido:`
                  : `Sequência de login diário ativa!`}
              </span>
              <span className="font-mono-num font-extrabold text-fuchsia-300 whitespace-nowrap shrink-0">
                +{loginBonus.gemsGained} Gemas
              </span>
            </div>
            <button
              type="button"
              onClick={onDismissLoginBonus}
              aria-label="Fechar aviso de bônus diário"
              className="w-6 h-6 rounded text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Split Stage: Left Heroic Spotlight + Mode/Map + Play CTA / Right Roster & Skins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-4 lg:flex-1 lg:items-center max-w-[1380px] w-full mx-auto lg:min-h-0 shrink-0">
        {/* Left: Emblem + Mode + Map + Featured Hero Showcase + Gold Play CTA */}
        <div className="lg:col-span-6 flex flex-col gap-3 pointer-events-auto">
          <ThetanTitleEmblem />

          {/* 4 Game Modes Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Modo de Jogo
            </span>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl border border-indigo-400/35"
              style={{ backgroundColor: 'rgba(12, 18, 46, 0.92)' }}
              role="group"
              aria-label="Modo de jogo"
            >
              {MODE_OPTIONS.map((opt) => {
                const active = selectedMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectMode(opt.id)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                      active
                        ? 'text-slate-950 shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    style={active ? { backgroundColor: opt.activeBg } : undefined}
                  >
                    <div className="text-xs font-extrabold leading-tight truncate">
                      {opt.label}
                    </div>
                    <div
                      className={`text-[10px] leading-tight truncate ${
                        active ? 'text-slate-900 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Arena Maps Selector (live canvas preview) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Mapa da Arena
            </span>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl border border-indigo-400/35"
              style={{ backgroundColor: 'rgba(12, 18, 46, 0.92)' }}
              role="group"
              aria-label="Mapa da arena"
            >
              {MAP_LIST.map((m) => {
                const active = selectedMap === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMap(m.id)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                      active
                        ? 'text-white shadow-md'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: 'rgba(28, 39, 86, 0.96)',
                            borderColor: m.accent,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.accent }}
                      />
                      <span className="text-xs font-extrabold leading-tight truncate">
                        {m.shortName}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                      {m.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Hero Showcase (Thetan Lobby Pedestal Card) */}
          <div
            data-testid="spotlight-hero-card"
            data-equipped-skin={activeSkin.id}
            className="rounded-xl border-2 p-3.5 flex flex-col sm:flex-row gap-3.5 items-stretch shadow-xl"
            style={{
              backgroundColor: 'rgba(14, 21, 52, 0.94)',
              borderColor: activeSkin.accentColor,
            }}
          >
            {/* Large Hero Portrait with Equipped Cosmetic Mastery Frame + Skin Visual Filter */}
            <HeroMasteryFrame
              frameId={featuredMastery.activeFrameId}
              masteryLevel={featuredMastery.tier.level}
              size="spotlight"
              className="w-full sm:w-36 h-40 sm:h-auto shrink-0"
            >
              {!imgErrors[hero.id] ? (
                <img
                  data-testid="spotlight-hero-portrait"
                  src={hero.portraitUrl}
                  alt={`Destaque ${hero.name} (${activeSkin.name})`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrors((prev) => ({ ...prev, [hero.id]: true }))}
                  className="w-full h-full object-cover object-top transition-[filter] duration-200"
                  style={{
                    filter:
                      activeSkin.portraitFilter !== 'none'
                        ? activeSkin.portraitFilter
                        : undefined,
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display text-4xl font-extrabold"
                  style={{
                    backgroundColor: hero.accentSoft,
                    color: activeSkin.accentColor,
                  }}
                >
                  {hero.name[0]}
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 px-2.5 py-1 text-center font-display text-base font-extrabold tracking-wider text-slate-950"
                style={{ backgroundColor: activeSkin.accentColor }}
              >
                {hero.role}
              </div>
            </HeroMasteryFrame>

            {/* Hero Kit Details + Mastery & Skin Strip */}
            <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      className="font-display text-3xl font-extrabold tracking-wide leading-none"
                      style={{ color: activeSkin.accentColor }}
                    >
                      {hero.name}
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider border"
                      style={{
                        color: heroTierMeta.color,
                        backgroundColor: heroTierMeta.bg,
                        borderColor: heroTierMeta.border,
                      }}
                    >
                      Nível {heroTierMeta.label}
                    </span>
                    <span
                      data-testid="spotlight-evolution-badge"
                      className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider border font-mono-num"
                      style={{
                        color: featuredEvolutionSpec.badgeColor,
                        backgroundColor: 'rgba(8, 12, 32, 0.85)',
                        borderColor: `${featuredEvolutionSpec.badgeColor}66`,
                      }}
                    >
                      Évo Nv.{featuredEvolutionLevel}
                      {featuredEvolvedStats.bonusPct > 0 ? ` (+${featuredEvolvedStats.bonusPct}%)` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                    {hero.title} · Skin:{' '}
                    <span
                      data-testid="spotlight-active-skin-name"
                      className="font-bold"
                      style={{ color: activeSkin.accentColor }}
                    >
                      {activeSkin.name}
                    </span>
                  </p>
                </div>
                <div
                  data-testid="spotlight-hero-stats"
                  className="text-right text-xs text-slate-200 font-mono-num shrink-0"
                >
                  <div>HP {featuredEvolvedStats.maxHp}</div>
                  <div className="text-amber-400">ATK {featuredEvolvedStats.attackDamage}</div>
                </div>
              </div>

              {/* Compact Hero Mastery & Cosmetic Shortcut Bar */}
              <div
                data-testid="spotlight-mastery-bar"
                className="rounded-lg border border-indigo-400/25 px-2.5 py-1.5 flex items-center justify-between gap-2"
                style={{ backgroundColor: 'rgba(8, 12, 32, 0.82)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white leading-tight truncate">
                    <MasteryFrameEmblemIcon
                      frameId={featuredMastery.activeFrameId}
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span style={{ color: featuredMastery.tier.primaryColor }}>
                      Maestria Nv.{featuredMastery.tier.level}
                    </span>
                    <span className="text-slate-500" aria-hidden="true">·</span>
                    <span className="text-slate-300 font-mono-num">
                      {featuredMastery.matches}P · {featuredMastery.kills} Abates
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${featuredMastery.progressPct}%`,
                          backgroundColor: featuredMastery.tier.primaryColor,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-num text-slate-400 shrink-0">
                      {featuredMastery.nextTier
                        ? `${featuredMastery.points}/${featuredMastery.nextTier.minPoints}`
                        : 'Máx'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid="btn-open-evolution"
                    onClick={onOpenEvolutionModal}
                    className="px-2 py-1.5 rounded-md border border-emerald-400/55 bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-200 text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Evoluir Nv.{featuredEvolutionLevel}
                  </button>
                  <button
                    type="button"
                    data-testid="btn-spotlight-skins"
                    onClick={() => setRightTab('skins')}
                    className={`px-2 py-1.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                      rightTab === 'skins'
                        ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                        : 'border-cyan-400/50 bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-200'
                    }`}
                  >
                    Skins ({unlockedSkinIds.length}/{skinCatalog.length})
                  </button>
                  <button
                    type="button"
                    data-testid="btn-open-mastery"
                    onClick={onOpenMasteryModal}
                    className="px-2 py-1.5 rounded-md border border-amber-400/50 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Molduras ({featuredMastery.unlockedFrames.length}/{MASTERY_TIERS.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {skillList.map((sk) => (
                  <div
                    key={sk.key}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-indigo-400/20"
                    style={{ backgroundColor: 'rgba(8, 12, 32, 0.78)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-slate-700"
                      style={{ backgroundColor: hero.accentSoft }}
                    >
                      <SkillSlotIcon heroId={hero.id} slot={sk.key} accent={activeSkin.accentColor} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-white truncate">
                        <span className="font-mono-num text-amber-400">[{sk.key}]</span>
                        <span className="truncate">{sk.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {sk.roleTag}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Start CTA + Hero Training Lab Button */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] border-b-4 border-amber-600 text-slate-950 font-display text-2xl sm:text-3xl font-extrabold tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xl"
            >
              Jogar Agora
            </button>
            <button
              type="button"
              data-testid="btn-open-training"
              onClick={onOpenTraining}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-cyan-400/60 bg-slate-950/85 hover:bg-cyan-400/15 active:scale-[0.98] text-cyan-200 font-display text-xl sm:text-2xl font-extrabold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 shrink-0 text-cyan-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-13a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z" />
              </svg>
              <span>Testar Poderes</span>
            </button>
            <span className="hidden xl:inline text-xs text-slate-300">
              Enter ou Espaço para jogar
            </span>
          </div>
        </div>

        {/* Right: Segmented Switcher (Heróis Roster | Skins Closet) */}
        <div className="lg:col-span-6 pointer-events-auto flex flex-col min-h-0">
          {/* Primary Section Header + Heróis / Skins Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 shrink-0">
            <div>
              <h3 className="font-display text-2xl font-bold tracking-wide text-white leading-none">
                {rightTab === 'heroes' ? 'Selecione seu Herói' : `Skins de ${hero.name}`}
              </h3>
              <span className="text-xs text-slate-300">
                {rightTab === 'heroes'
                  ? '21 Heróis Jogáveis · 3 Níveis (Comum, Épico e Lendário)'
                  : `Ativa: ${activeSkin.name} · ${unlockedSkinIds.length}/${skinCatalog.length} desbloqueadas`}
              </span>
            </div>

            {/* Segmented Tab Bar: Heróis vs Skins */}
            <div
              className="flex p-1 rounded-xl border border-indigo-400/35 gap-1"
              style={{ backgroundColor: 'rgba(11, 17, 42, 0.92)' }}
              role="tablist"
              aria-label="Seções de seleção do herói"
            >
              <button
                type="button"
                role="tab"
                data-testid="tab-heroes"
                aria-selected={rightTab === 'heroes'}
                onClick={() => setRightTab('heroes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  rightTab === 'heroes'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Heróis (21)
              </button>
              <button
                type="button"
                role="tab"
                data-testid="tab-skins"
                aria-selected={rightTab === 'skins'}
                onClick={() => setRightTab('skins')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  rightTab === 'skins'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Skins</span>
                <span
                  className={`font-mono-num text-[10px] px-1 rounded ${
                    rightTab === 'skins'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-cyan-400/20 text-cyan-200'
                  }`}
                >
                  {unlockedSkinIds.length}/{skinCatalog.length}
                </span>
              </button>
            </div>
          </div>

          {rightTab === 'heroes' ? (
            <>
              {/* Tier Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 shrink-0">
                <div
                  className="flex flex-wrap p-1 rounded-lg border border-indigo-400/30 gap-1"
                  style={{ backgroundColor: 'rgba(11, 17, 42, 0.9)' }}
                  role="group"
                  aria-label="Filtrar por nível"
                >
                  {TIER_FILTERS.map((tab) => {
                    const active = tierFilter === tab.id;
                    const tierColor =
                      tab.id === 'todos' ? '#fbbf24' : HERO_TIER_META[tab.id].color;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTierFilter(tab.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                        style={active ? { backgroundColor: tierColor } : undefined}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    data-testid="btn-roster-mastery"
                    onClick={onOpenMasteryModal}
                    className="px-3 py-1.5 rounded-lg border border-amber-400/55 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Evoluir Molduras
                  </button>
                  <button
                    type="button"
                    data-testid="btn-roster-evolution"
                    onClick={onOpenEvolutionModal}
                    className="px-3 py-1.5 rounded-lg border border-emerald-400/55 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <span>Evoluir Heróis</span>
                    {accountEvolutionSummary.eligibleNowCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 font-mono-num text-[10px] font-extrabold">
                        {accountEvolutionSummary.eligibleNowCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="lg:max-h-[465px] lg:overflow-y-auto pr-0.5 lg:pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-1">
                  {visibleHeroes.map((item) => {
                    const isSelected = item.id === selectedHero;
                    const imgFailed = imgErrors[item.id];
                    const tierMeta = HERO_TIER_META[item.tier];
                    const itemEvoLevel = getHeroEvolutionLevel(heroEvolutions, item.id);
                    const itemEvoSpec = getHeroEvolutionSpec(itemEvoLevel);
                    const itemEvolvedStats = computeEvolvedHeroStats(item.id, itemEvoLevel);
                    const mastery = computeHeroMasteryProgress(item.id, heroMastery[item.id]);
                    const itemSkin = resolveEquippedHeroSkin(
                      item.id,
                      heroSkins[item.id],
                      mastery,
                      battlePass.unlockedCosmetics
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`hero-card-${item.id}`}
                        data-evo-level={itemEvoLevel}
                        onClick={() => onSelectHero(item.id)}
                        aria-pressed={isSelected}
                        className={`group text-left rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col items-stretch ${
                          isSelected
                            ? 'border-amber-400 shadow-xl'
                            : 'border-indigo-400/25 hover:border-indigo-300/65'
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(25, 35, 82, 0.96)'
                            : 'rgba(13, 20, 48, 0.88)',
                        }}
                      >
                        {/* Hero Portrait with Unlocked Cosmetic Mastery Frame & Skin */}
                        <HeroMasteryFrame
                          frameId={mastery.activeFrameId}
                          masteryLevel={mastery.tier.level}
                          size="card"
                          className="w-full h-24 shrink-0"
                        >
                          {!imgFailed ? (
                            <img
                              src={item.portraitUrl}
                              alt={`Retrato de ${item.name}`}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setImgErrors((prev) => ({ ...prev, [item.id]: true }))
                              }
                              className="w-full h-full object-cover object-[50%_26%] transition-transform duration-200 group-hover:scale-105"
                              style={{
                                filter:
                                  itemSkin.portraitFilter !== 'none'
                                    ? itemSkin.portraitFilter
                                    : undefined,
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-display text-3xl font-extrabold"
                              style={{
                                backgroundColor: item.accentSoft,
                                color: itemSkin.accentColor,
                              }}
                            >
                              {item.name[0]}
                            </div>
                          )}
                          <span
                            className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border"
                            style={{
                              color: tierMeta.color,
                              backgroundColor: 'rgba(9, 13, 30, 0.88)',
                              borderColor: tierMeta.border,
                            }}
                          >
                            {tierMeta.label}
                          </span>
                          {isSelected ? (
                            <span className="absolute top-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                              Ativo
                            </span>
                          ) : itemEvoLevel > 1 ? (
                            <span
                              className="absolute top-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded font-mono-num text-[10px] font-extrabold border"
                              style={{
                                color: itemEvoSpec.badgeColor,
                                backgroundColor: 'rgba(9, 13, 30, 0.9)',
                                borderColor: `${itemEvoSpec.badgeColor}66`,
                              }}
                            >
                              Évo {itemEvoLevel}
                            </span>
                          ) : null}
                          <div
                            className="absolute inset-x-0 bottom-0 h-1 z-20"
                            style={{ backgroundColor: itemSkin.accentColor }}
                          />
                        </HeroMasteryFrame>

                        {/* Hero Info */}
                        <div className="p-2.5 flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            <div className="font-display text-xl font-extrabold text-white leading-none truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                              {itemSkin.id !== 'classic'
                                ? `${item.role} · ${itemSkin.name}`
                                : `${item.role} · ${item.title}`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-num mt-0.5 truncate">
                              <span
                                style={{ color: mastery.tier.primaryColor }}
                                className="font-bold"
                              >
                                {mastery.activeFrameSpec.frameName}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span>
                                {mastery.matches}P · {mastery.kills}K
                              </span>
                            </div>
                          </div>

                          <div className="mt-1.5 pt-1.5 border-t border-indigo-400/20 flex items-center justify-between text-[11px] text-slate-200 font-mono-num">
                            <span>HP {itemEvolvedStats.maxHp}</span>
                            <span className="text-amber-400">ATK {itemEvolvedStats.attackDamage}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Skins Closet Panel for the Currently Selected Hero */
            <div
              data-testid="skins-panel"
              className="lg:max-h-[505px] lg:overflow-y-auto pr-0.5 lg:pr-1 flex flex-col gap-3"
            >
              {/* Mastery / Unlock Overview Strip */}
              <div
                className="rounded-xl border border-indigo-400/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
                style={{ backgroundColor: 'rgba(11, 17, 42, 0.9)' }}
              >
                <div className="text-xs text-slate-200">
                  <span className="font-bold text-white">{hero.name}</span> possui{' '}
                  <span className="font-mono-num font-extrabold text-cyan-300">
                    {featuredMastery.points} pts
                  </span>{' '}
                  de Maestria (Nv.{featuredMastery.tier.level}).{' '}
                  <span className="text-slate-400">
                    Jogue partidas e elimine oponentes para liberar skins épicas e lendárias.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenMasteryModal}
                  className="px-2.5 py-1 rounded-lg border border-amber-400/45 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Progresso de Maestria
                </button>
              </div>

              {/* 4 Visual Variant Skin Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                {skinCatalog.map((skin) => {
                  const unlocked = isHeroSkinUnlocked(
                    skin,
                    featuredMastery.points,
                    selectedHero,
                    battlePass.unlockedCosmetics
                  );
                  const equipped = activeSkin.id === skin.id;
                  const remainingPts = Math.max(
                    0,
                    skin.requiredPoints - featuredMastery.points
                  );
                  const rarityColor = RARITY_COLOR[skin.rarity] ?? '#94a3b8';

                  return (
                    <div
                      key={skin.id}
                      data-testid={`skin-card-${skin.id}`}
                      data-unlocked={unlocked ? 'true' : 'false'}
                      data-equipped={equipped ? 'true' : 'false'}
                      className={`rounded-xl border-2 p-3 flex flex-col justify-between gap-3 transition-all ${
                        equipped
                          ? 'border-amber-400 shadow-xl'
                          : unlocked
                          ? 'border-indigo-400/35 hover:border-cyan-400/65'
                          : 'border-slate-800 opacity-85'
                      }`}
                      style={{
                        backgroundColor: equipped
                          ? 'rgba(26, 36, 84, 0.96)'
                          : 'rgba(12, 19, 46, 0.92)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Skin Portrait Preview */}
                        <div className="relative w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 bg-slate-950"
                          style={{ borderColor: skin.accentColor }}
                        >
                          {!imgErrors[hero.id] ? (
                            <img
                              src={hero.portraitUrl}
                              alt={`${hero.name} - ${skin.name}`}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover object-top transition-transform duration-200 ${
                                !unlocked ? 'opacity-65' : ''
                              }`}
                              style={{
                                filter:
                                  skin.portraitFilter !== 'none'
                                    ? skin.portraitFilter
                                    : undefined,
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-display text-3xl font-extrabold"
                              style={{
                                backgroundColor: hero.accentSoft,
                                color: skin.accentColor,
                              }}
                            >
                              {hero.name[0]}
                            </div>
                          )}
                          <div
                            className="absolute inset-x-0 bottom-0 h-1.5"
                            style={{ backgroundColor: skin.accentColor }}
                          />
                          {!unlocked && (
                            <div
                              aria-label="Skin bloqueada"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-950/90 border border-slate-700 flex items-center justify-center text-slate-300"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7zm3 8.73V17h-2v-1.27a1.5 1.5 0 1 1 2 0z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Skin Title, Rarity & Color Swatches */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[10px] font-extrabold uppercase tracking-wider"
                              style={{ color: rarityColor }}
                            >
                              {skin.rarity}
                            </span>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              title="Paleta da skin"
                              aria-hidden="true"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-slate-950"
                                style={{ backgroundColor: skin.accentColor }}
                              />
                              <span
                                className="w-3 h-3 rounded-full border border-slate-950"
                                style={{ backgroundColor: skin.secondaryColor }}
                              />
                            </div>
                          </div>

                          <h4 className="font-display text-xl font-extrabold text-white leading-tight mt-0.5 truncate">
                            {skin.name}
                          </h4>
                          <p className="text-xs text-slate-300 leading-snug mt-1">
                            {skin.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Equip / Unlocked / Locked Footer */}
                      {unlocked ? (
                        equipped ? (
                          <div
                            data-testid={`skin-equipped-badge-${skin.id}`}
                            className="w-full py-2 px-3 rounded-lg border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 text-xs font-extrabold text-center whitespace-nowrap"
                          >
                            Equipada ✓
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-testid={`equip-skin-btn-${skin.id}`}
                            onClick={() => onEquipSkin(selectedHero, skin.id)}
                            className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 text-xs font-extrabold text-center transition-all cursor-pointer whitespace-nowrap shadow-md"
                          >
                            Equipar Skin
                          </button>
                        )
                      ) : skin.unlockSource === 'battlepass' ? (
                        <button
                          type="button"
                          data-testid={`skin-locked-badge-${skin.id}`}
                          onClick={onOpenBattlePass}
                          className="w-full py-2 px-3 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <span className="truncate">{skin.unlockHint}</span>
                          <span className="text-[11px] font-extrabold text-amber-300 shrink-0">
                            Ver Passe →
                          </span>
                        </button>
                      ) : (
                        <div
                          data-testid={`skin-locked-badge-${skin.id}`}
                          className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-slate-950/90 text-slate-300 text-xs font-semibold flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{skin.unlockHint}</span>
                          <span className="font-mono-num text-[11px] font-bold text-amber-300 shrink-0">
                            -{remainingPts} pts
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="w-full text-center pt-3 pb-2">
        <p className="hidden sm:block text-xs text-slate-300 tracking-wide">
          WASD Mover · Mouse Mirar/Atirar · Q / E / R Habilidades · Esc Pausar
        </p>
        <p className="sm:hidden text-[11px] text-slate-300 tracking-wide">
          Joystick Esq. Mover · Botões Dir. Mirar/Atirar · Q / E / R Habilidades
        </p>
      </div>
    </div>
  );
};
