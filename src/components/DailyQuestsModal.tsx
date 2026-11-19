import React, { useEffect } from 'react';
import {
  LOGIN_STREAK_REWARDS,
  PlayerProgressionState,
  computeLevelInfo,
  countClaimableDailyQuests,
  getLoginStreakRewardGems,
} from '../game/dailyQuests';
import { LoginStreakBonusInfo } from '../services/dailyQuestsService';

interface DailyQuestsModalProps {
  open: boolean;
  progression: PlayerProgressionState;
  loginBonus: LoginStreakBonusInfo | null;
  lastRewardBanner: { questTitle: string; xp: number; gems: number } | null;
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  open,
  progression,
  loginBonus,
  lastRewardBanner,
  onClaimQuest,
  onClose,
}) => {
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

  const levelInfo = computeLevelInfo(progression.xp);
  const claimableCount = countClaimableDailyQuests(progression);
  const completedCount = progression.quests.filter((q) => q.completed).length;
  const streak = Math.max(1, progression.loginStreak || 1);
  const todayStreakGems = getLoginStreakRewardGems(streak);
  const nextDayGems = getLoginStreakRewardGems(streak + 1);
  const cycleDay = ((streak - 1) % LOGIN_STREAK_REWARDS.length) + 1;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(8, 12, 28, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-quests-modal-title"
    >
      <div
        className="w-full max-w-xl rounded-2xl border-2 border-cyan-400/45 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
        style={{ backgroundColor: '#101838' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">
              Desafios do Dia · {progression.dateKey}
            </span>
            <h2
              id="daily-quests-modal-title"
              className="font-display text-3xl font-extrabold text-white leading-tight"
            >
              Missões Diárias
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar missões diárias"
            className="w-8 h-8 rounded-lg border border-indigo-400/30 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Player Level, XP Progress & Cosmetic Currency Wallet */}
        <div
          className="rounded-xl border border-indigo-400/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
          style={{ backgroundColor: 'rgba(18, 28, 66, 0.92)' }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center shrink-0 shadow-md">
              <span className="text-[9px] font-extrabold uppercase leading-none">Nível</span>
              <span className="font-display text-xl font-extrabold leading-none mt-0.5">
                {levelInfo.level}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white">Experiência (XP)</span>
                <span className="font-mono-num text-cyan-300 font-bold">
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-950 overflow-hidden border border-indigo-400/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all duration-300"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-mono-num">
                Total acumulado: {levelInfo.totalXp.toLocaleString('pt-BR')} XP · {completedCount}/3 concluídas
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border border-fuchsia-400/40 px-3 py-2 flex items-center justify-between sm:justify-center gap-2.5 shrink-0"
            style={{ backgroundColor: 'rgba(28, 18, 56, 0.88)' }}
          >
            <svg
              className="w-5 h-5 text-fuchsia-300 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 3h12l4 6-10 12L2 9l4-6zm2.2 2L5.5 9h13l-2.7-4H8.2zM6 11l6 7.2L18 11H6z" />
            </svg>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200/80">
                Gemas Cosméticas
              </div>
              <div
                data-testid="quests-wallet-gems"
                className="font-mono-num text-base font-extrabold text-fuchsia-300 leading-none mt-0.5"
              >
                {progression.gems.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Login Streak Counter & 7-Day Bonus Track */}
        <div
          data-testid="login-streak-panel"
          className="rounded-xl border border-amber-400/40 p-3.5 flex flex-col gap-2.5 shrink-0"
          style={{ backgroundColor: 'rgba(28, 22, 48, 0.88)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 2.2c.3 2.5-.8 4.4-2.3 5.9-1.1 1.1-1.9 2.2-1.9 3.7 0 1.2.8 2.3 1.9 2.6-.5-.9-.4-2 .4-2.8.8-.8 1.5-1.7 1.7-3 1.9 1.3 3.2 3.4 3.2 5.9 0 3.7-3 6.7-6.8 6.7S3 18.2 3 14.5c0-3.2 2-5.9 4.5-7.9 2-1.6 4.4-2.7 6-4.4z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Sequência de Login
                  </span>
                  <span
                    data-testid="quests-login-streak-count"
                    className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-num text-[10px] font-extrabold"
                  >
                    {streak} {streak === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {loginBonus
                    ? `Bônus de hoje creditado: +${loginBonus.gemsGained} Gemas!`
                    : `Bônus de hoje (+${todayStreakGems} Gemas) garantido · Amanhã: +${nextDayGems} Gemas`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {LOGIN_STREAK_REWARDS.map((reward, idx) => {
              const dayNum = idx + 1;
              const isToday = dayNum === cycleDay;
              const isReached = dayNum <= cycleDay;

              return (
                <div
                  key={dayNum}
                  className={`rounded-lg border px-1 py-1.5 text-center font-mono-num transition-colors ${
                    isToday
                      ? 'border-amber-400 bg-amber-400/20 text-amber-200 shadow-sm'
                      : isReached
                      ? 'border-emerald-400/45 bg-emerald-950/50 text-emerald-300'
                      : 'border-indigo-400/20 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase leading-none">
                    {dayNum === 7 ? '7+d' : `${dayNum}d`}
                  </div>
                  <div className="text-[11px] font-extrabold mt-1 leading-none">
                    +{reward}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward Claim Confirmation Toast */}
        {lastRewardBanner && (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/50 bg-emerald-950/60 px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-emerald-200"
          >
            <span>
              Recompensa resgatada: <strong className="text-white">{lastRewardBanner.questTitle}</strong>
            </span>
            <span className="font-mono-num font-extrabold text-emerald-300 whitespace-nowrap">
              +{lastRewardBanner.xp} XP · +{lastRewardBanner.gems} Gemas
            </span>
          </div>
        )}

        {/* 3 Daily Challenge Cards */}
        <div className="flex flex-col gap-2.5">
          {progression.quests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100));
            const canClaim = quest.completed && !quest.claimed;

            return (
              <div
                key={quest.id}
                data-testid={`daily-quest-card-${quest.id}`}
                className={`rounded-xl border p-3.5 flex flex-col gap-2.5 transition-colors ${
                  quest.claimed
                    ? 'border-emerald-500/35 bg-slate-950/50 opacity-85'
                    : canClaim
                    ? 'border-amber-400 bg-indigo-950/85 shadow-lg'
                    : 'border-indigo-400/25 bg-slate-950/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-xl font-extrabold text-white leading-none">
                        {quest.title}
                      </h3>
                      {canClaim && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                          Pronta
                        </span>
                      )}
                      {quest.claimed && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                          Resgatada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{quest.description}</p>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-[11px] font-extrabold">
                    <span className="px-2 py-1 rounded-md border border-cyan-400/35 bg-cyan-950/60 text-cyan-300 whitespace-nowrap">
                      +{quest.rewardXp} XP
                    </span>
                    <span className="px-2 py-1 rounded-md border border-fuchsia-400/35 bg-fuchsia-950/60 text-fuchsia-300 whitespace-nowrap">
                      +{quest.rewardGems} Gemas
                    </span>
                  </div>
                </div>

                {/* Progress bar + Claim CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] font-mono-num mb-1">
                      <span className="text-slate-400">Progresso</span>
                      <span className={quest.completed ? 'text-emerald-400 font-bold' : 'text-slate-200 font-bold'}>
                        {quest.progress.toLocaleString('pt-BR')} / {quest.target.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          quest.completed
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                            : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {quest.claimed ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-bold text-xs whitespace-nowrap shrink-0 cursor-default"
                    >
                      Resgatado ✓
                    </button>
                  ) : canClaim ? (
                    <button
                      type="button"
                      onClick={() => onClaimQuest(quest.id)}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-extrabold text-xs whitespace-nowrap shrink-0 cursor-pointer shadow-md"
                    >
                      Resgatar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 font-bold text-xs whitespace-nowrap shrink-0 cursor-not-allowed"
                    >
                      Em Progresso
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-slate-400">
          <span>
            {claimableCount > 0
              ? `${claimableCount} ${claimableCount === 1 ? 'recompensa disponível' : 'recompensas disponíveis'} para resgate`
              : 'Conclua partidas para avançar nos desafios diários.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-indigo-400/30 text-slate-200 hover:bg-white/10 font-semibold text-xs cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
