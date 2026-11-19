import React, { useEffect, useState } from 'react';
import { MAPS_META } from '../game/arena';
import { soundEngine } from '../game/audio';
import { BattlePassState, computeBattlePassSummary } from '../game/battlePass';
import {
  MatchRewardBreakdown,
  PlayerProgressionState,
  computeLevelInfo,
} from '../game/dailyQuests';
import { HEROES } from '../game/heroes';
import { getHeroSkinSpec } from '../game/heroSkins';
import {
  HeroMasteryProgress,
  MasteryFrameId,
  getMasteryTierByFrameId,
} from '../game/heroMastery';
import { getRankTier } from '../game/ranking';
import { LevelUpEvent } from '../game/levelUp';
import { GameMode, HudSnapshot } from '../game/types';
import { HeroMasteryFrame } from './HeroMasteryFrame';
import { LevelUpBackdropSparkles, LevelUpShowcase } from './LevelUpCelebration';
import { MatchDamageChart } from './MatchDamageChart';
import { VictoryOverlay } from './VictoryOverlay';

interface StatusModalProps {
  hud: HudSnapshot;
  isSignedIn: boolean;
  trophyDelta: number | null;
  totalTrophies: number | null;
  savingRank: boolean;
  progression: PlayerProgressionState;
  progressedQuestIds: string[];
  battlePass: BattlePassState;
  battlePassGain: { xpGained: number; tierUp: boolean; newTier: number } | null;
  heroMasteryProgress?: HeroMasteryProgress;
  masteryGainInfo?: { leveledUp: boolean; newlyUnlockedFrames: MasteryFrameId[] } | null;
  matchReward?: MatchRewardBreakdown | null;
  levelUpEvent?: LevelUpEvent | null;
  onClaimQuest: (questId: string) => void;
  onOpenQuests: () => void;
  onOpenBattlePass: () => void;
  onOpenRecentMatches: () => void;
  onOpenAuth: () => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  royale: 'Battle Royale',
  brawl: 'Deathmatch 4v4',
  superstar: 'Super Estrela 4v4',
  tower: 'Cerco à Torre 4v4',
};

export const StatusModal: React.FC<StatusModalProps> = ({
  hud,
  isSignedIn,
  trophyDelta,
  totalTrophies,
  savingRank,
  progression,
  progressedQuestIds,
  battlePass,
  battlePassGain,
  heroMasteryProgress,
  masteryGainInfo,
  matchReward = null,
  levelUpEvent = null,
  onClaimQuest,
  onOpenQuests,
  onOpenBattlePass,
  onOpenRecentMatches,
  onOpenAuth,
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  const hero = HEROES[hud.playerHero];
  const activeSkin = getHeroSkinSpec(hud.playerHero, hud.playerSkin);
  const mapName = MAPS_META[hud.mapId]?.name ?? 'Coliseu Cibernético';
  const modeLabel = MODE_LABELS[hud.mode];
  const allyTowerPct =
    hud.allyTowerMaxHp > 0 ? Math.max(0, Math.ceil((hud.allyTowerHp / hud.allyTowerMaxHp) * 100)) : 0;
  const enemyTowerPct =
    hud.enemyTowerMaxHp > 0 ? Math.max(0, Math.ceil((hud.enemyTowerHp / hud.enemyTowerMaxHp) * 100)) : 0;

  const [countProgress, setCountProgress] = useState(1);
  const [animatedDisplayLevel, setAnimatedDisplayLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!levelUpEvent) {
      setAnimatedDisplayLevel(null);
    } else {
      setAnimatedDisplayLevel(levelUpEvent.previousLevel);
    }
  }, [levelUpEvent]);

  useEffect(() => {
    if (hud.phase !== 'gameover' || !hud.victory) {
      setCountProgress(1);
      return;
    }

    soundEngine.playVictory();

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setCountProgress(1);
      return;
    }

    setCountProgress(0);
    let rafId = 0;
    const duration = 420;
    const startTs = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCountProgress(eased);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [hud.phase, hud.victory]);

  if (hud.phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-6"
        style={{ backgroundColor: 'rgba(9, 14, 26, 0.78)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        <div
          className="w-full max-w-md rounded-2xl border border-slate-700 p-7 flex flex-col gap-5 shadow-2xl"
          style={{ backgroundColor: '#111827' }}
        >
          <div>
            <span className="text-xs font-semibold tracking-wider text-amber-400">
              {hero.name} · {modeLabel} · {mapName}
            </span>
            <h2 id="pause-title" className="font-display text-4xl font-extrabold text-white mt-1">
              Partida Pausada
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-slate-800 p-3 bg-slate-950/60">
              <div className="text-[11px] text-slate-400">Abates</div>
              <div className="font-display text-2xl font-bold text-white tabular-nums mt-0.5">
                {hud.playerKills}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3 bg-slate-950/60">
              <div className="text-[11px] text-slate-400">Cubos</div>
              <div className="font-display text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
                {hud.powerCubes}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3 bg-slate-950/60">
              <div className="text-[11px] text-slate-400">Dano</div>
              <div className="font-display text-2xl font-bold text-amber-400 tabular-nums mt-0.5">
                {hud.damageDealt}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-xl font-extrabold tracking-wide whitespace-nowrap cursor-pointer"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm whitespace-nowrap cursor-pointer"
            >
              Reiniciar Partida
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 rounded-lg text-slate-400 hover:text-white font-semibold text-sm whitespace-nowrap cursor-pointer"
            >
              Trocar Herói / Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'gameover') {
    const scoreLine =
      hud.mode === 'royale'
        ? `Colocação #${hud.placement} de ${hud.totalCombatants}`
        : hud.mode === 'superstar'
        ? `Estrelas ★${hud.allyScore} × ★${hud.enemyScore}`
        : hud.mode === 'tower'
        ? `Torres ${allyTowerPct}% × ${enemyTowerPct}%`
        : `Placar ${hud.allyScore} × ${hud.enemyScore}`;
    const rankTier = totalTrophies !== null ? getRankTier(totalTrophies) : null;
    const isVictory = hud.victory;

    const displayedKills = Math.round(hud.playerKills * countProgress);
    const displayedCubes = Math.round(hud.powerCubes * countProgress);
    const displayedDamage = Math.round(hud.damageDealt * countProgress);

    return (
      <div
        className={`fixed inset-0 z-30 flex items-center justify-center overflow-y-auto px-4 sm:px-6 py-6 ${
          isVictory ? 'animate-victory-backdrop' : ''
        }`}
        style={{ backgroundColor: isVictory ? 'rgba(9, 14, 26, 0.78)' : 'rgba(9, 14, 26, 0.84)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameover-title"
      >
        {isVictory && <VictoryOverlay heroAccent={hero.accent} />}
        {levelUpEvent && (
          <LevelUpBackdropSparkles
            activeKey={`${levelUpEvent.previousLevel}-${levelUpEvent.newLevel}-${levelUpEvent.newXp}`}
          />
        )}

        <div
          className={`relative z-10 my-auto w-full max-w-lg rounded-2xl border shadow-2xl ${
            isVictory ? 'animate-victory-card' : ''
          }`}
          style={{
            backgroundColor: '#111827',
            borderColor: isVictory ? '#fbbf24' : '#f43f5e',
            boxShadow: isVictory
              ? '0 24px 70px rgba(245, 158, 11, 0.28), 0 0 0 1px rgba(251, 191, 36, 0.35)'
              : undefined,
          }}
        >
          {/* Victory Champion Crest anchored above card top edge */}
          {isVictory && (
            <div className="animate-victory-crest pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: '#1e1b18',
                  borderColor: '#fbbf24',
                  boxShadow: '0 8px 28px rgba(251, 191, 36, 0.45)',
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4Z"
                    fill="#fbbf24"
                    stroke="#fef08a"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 6H4.5C4.5 9.2 5.4 10.6 7 10.8M17 6H19.5C19.5 9.2 18.6 10.6 17 10.8"
                    stroke="#fbbf24"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 15V19M9 20H15"
                    stroke="#fde047"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Card inner surface with clipped sheen sweep */}
          <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${isVictory ? 'pt-8' : ''} flex flex-col gap-3`}>
            {isVictory && (
              <div
                className="animate-victory-sheen pointer-events-none absolute inset-y-0 w-24"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(253, 224, 71, 0.16) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />
            )}

            <div className="relative flex items-center gap-4">
              {heroMasteryProgress ? (
                <HeroMasteryFrame
                  frameId={heroMasteryProgress.activeFrameId}
                  masteryLevel={heroMasteryProgress.tier.level}
                  size="preview"
                  className="w-16 h-16 shrink-0"
                >
                  <img
                    src={hero.portraitUrl}
                    alt={hero.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                    style={{
                      filter:
                        activeSkin.portraitFilter !== 'none'
                          ? activeSkin.portraitFilter
                          : undefined,
                    }}
                  />
                </HeroMasteryFrame>
              ) : (
                <div className="relative shrink-0">
                  <img
                    src={hero.portraitUrl}
                    alt={hero.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover object-top border-2"
                    style={{
                      borderColor: isVictory ? '#fbbf24' : activeSkin.accentColor,
                      boxShadow: isVictory ? `0 0 22px ${activeSkin.accentColor}66` : undefined,
                      filter:
                        activeSkin.portraitFilter !== 'none'
                          ? activeSkin.portraitFilter
                          : undefined,
                    }}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-xs font-bold tracking-wider truncate ${
                    isVictory ? 'text-amber-300' : 'text-rose-400'
                  }`}
                >
                  {scoreLine} · {mapName}
                </span>
                <h2
                  id="gameover-title"
                  className="font-display text-4xl font-extrabold text-white leading-tight"
                >
                  {isVictory ? 'Vitória na Arena!' : hud.mode === 'royale' ? 'Eliminado' : 'Derrota'}
                </h2>
                {heroMasteryProgress && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono-num text-slate-300">
                    <span className="font-bold" style={{ color: heroMasteryProgress.tier.primaryColor }}>
                      Maestria {hero.name} Nv.{heroMasteryProgress.tier.level}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {heroMasteryProgress.matches}P · {heroMasteryProgress.kills} Abates
                    </span>
                    {masteryGainInfo?.newlyUnlockedFrames.length ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-sans font-extrabold text-[10px]">
                        Moldura {getMasteryTierByFrameId(masteryGainInfo.newlyUnlockedFrames[0]).frameName} Desbloqueada!
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div
                className={`rounded-lg border p-3 ${
                  isVictory
                    ? 'border-amber-500/35 bg-slate-950/75'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="text-[11px] text-slate-400">Abates</div>
                <div className="font-display text-2xl font-bold text-white tabular-nums mt-0.5">
                  {displayedKills}
                </div>
              </div>
              <div
                className={`rounded-lg border p-3 ${
                  isVictory
                    ? 'border-amber-500/35 bg-slate-950/75'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="text-[11px] text-slate-400">Cubos</div>
                <div className="font-display text-2xl font-bold text-emerald-400 tabular-nums mt-0.5">
                  {displayedCubes}
                </div>
              </div>
              <div
                className={`rounded-lg border p-3 ${
                  isVictory
                    ? 'border-amber-500/35 bg-slate-950/75'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="text-[11px] text-slate-400">Dano</div>
                <div className="font-display text-2xl font-bold text-amber-400 tabular-nums mt-0.5">
                  {displayedDamage}
                </div>
              </div>
            </div>

            <MatchDamageChart
              damageDealt={hud.damageDealt}
              damageTaken={hud.damageTaken}
              isVictory={isVictory}
            />

            {levelUpEvent && (
              <LevelUpShowcase
                event={levelUpEvent}
                onDisplayedLevelChange={setAnimatedDisplayLevel}
              />
            )}

            {/* Daily Quests Post-Match Strip */}
            {(() => {
              const levelInfo = computeLevelInfo(progression.xp);
              const displayedAccountLevel =
                levelUpEvent && animatedDisplayLevel !== null
                  ? animatedDisplayLevel
                  : levelInfo.level;
              return (
                <div
                  data-testid="gameover-daily-quests"
                  className="rounded-xl border border-cyan-400/35 bg-slate-950/75 px-3.5 py-2.5 flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        Missões Diárias
                      </span>
                      <span
                        data-testid="gameover-account-level"
                        className="text-[11px] font-mono-num font-bold text-slate-300 truncate tabular-nums"
                      >
                        Nv. {displayedAccountLevel} · {progression.gems} Gemas
                      </span>
                      {matchReward && (
                        <span
                          data-testid="gameover-match-reward"
                          className="px-1.5 py-0.5 rounded bg-fuchsia-400/20 border border-fuchsia-400/45 text-fuchsia-200 text-[10px] font-mono-num font-extrabold whitespace-nowrap"
                        >
                          +{matchReward.gems} Gemas · +{matchReward.xp} XP
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onOpenQuests}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline underline-offset-2 cursor-pointer shrink-0"
                    >
                      Abrir Painel
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {progression.quests.map((q) => {
                      const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
                      const canClaim = q.completed && !q.claimed;
                      const advanced = progressedQuestIds.includes(q.id);

                      return (
                        <div
                          key={q.id}
                          className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2.5 ${
                            canClaim
                              ? 'border-amber-400/70 bg-indigo-950/70'
                              : 'border-slate-800 bg-slate-900/70'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold text-white leading-snug">
                              <span>{q.description}</span>
                              {advanced && !q.completed && (
                                <span className="px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 text-[9px] font-extrabold uppercase shrink-0">
                                  +Progresso
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-950 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    q.completed ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono-num text-slate-300 shrink-0">
                                {q.progress}/{q.target}
                              </span>
                            </div>
                          </div>

                          {q.claimed ? (
                            <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-[10px] font-extrabold whitespace-nowrap shrink-0">
                              Resgatado ✓
                            </span>
                          ) : canClaim ? (
                            <button
                              type="button"
                              onClick={() => onClaimQuest(q.id)}
                              className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Resgatar +{q.rewardXp} XP
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono-num text-slate-400 whitespace-nowrap shrink-0">
                              +{q.rewardXp} XP · +{q.rewardGems} Gemas
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Seasonal Battle Pass Strip */}
            {(() => {
              const bpSummary = computeBattlePassSummary(battlePass);
              return (
                <div
                  data-testid="gameover-battle-pass"
                  className="rounded-xl border border-amber-400/35 bg-slate-950/75 px-3.5 py-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Passe de Batalha
                      </span>
                      <span className="text-[11px] font-mono-num font-bold text-white truncate">
                        Patamar {bpSummary.currentTier}/{bpSummary.maxTier}
                      </span>
                      {battlePassGain && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-mono-num text-[10px] font-extrabold">
                          +{battlePassGain.xpGained} XP
                        </span>
                      )}
                      {battlePassGain?.tierUp && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                          Subiu!
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onOpenBattlePass}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer shrink-0"
                    >
                      {bpSummary.claimableCount > 0
                        ? `Resgatar (${bpSummary.claimableCount})`
                        : 'Abrir Passe'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300"
                        style={{ width: `${bpSummary.progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-num text-slate-300 shrink-0">
                      {bpSummary.nextTierXpTarget
                        ? `${bpSummary.seasonXp}/${bpSummary.nextTierXpTarget} XP`
                        : 'Máx'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Ranking / Trophy Delta Strip */}
            {isSignedIn ? (
              <div className="rounded-xl border border-indigo-400/35 bg-slate-950/75 px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ranking Global
                  </div>
                  {savingRank ? (
                    <div className="text-xs font-bold text-amber-300 mt-0.5">
                      Salvando pontuação no Ranking...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`font-display text-xl font-extrabold tabular-nums ${
                          (trophyDelta ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {trophyDelta !== null
                          ? `${trophyDelta >= 0 ? `+${trophyDelta}` : trophyDelta} Troféus`
                          : 'Partida registrada'}
                      </span>
                    </div>
                  )}
                </div>

                  <div className="text-right flex flex-col items-end">
                    {totalTrophies !== null && rankTier && (
                      <>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border"
                          style={{
                            color: rankTier.color,
                            backgroundColor: rankTier.bg,
                            borderColor: rankTier.border,
                          }}
                        >
                          {rankTier.label}
                        </span>
                        <div className="text-xs font-extrabold text-amber-400 font-mono-num mt-1">
                          Total: {totalTrophies} 🏆
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={onOpenRecentMatches}
                      className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 underline underline-offset-2 cursor-pointer mt-1"
                    >
                      Partidas Recentes
                    </button>
                  </div>
                </div>
            ) : (
              <div className="rounded-xl border border-amber-400/35 bg-slate-950/75 px-3.5 py-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-300 leading-snug">
                  Jogue logado para salvar troféus e subir no Ranking
                </span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Entrar / Cadastrar
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-lg sm:text-xl font-extrabold tracking-wide whitespace-nowrap cursor-pointer"
              >
                Jogar Novamente
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm whitespace-nowrap cursor-pointer"
              >
                Trocar Herói
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

