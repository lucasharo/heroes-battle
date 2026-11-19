import React, { useEffect } from 'react';
import { HEROES } from '../game/heroes';
import { getRankTier } from '../game/ranking';
import { RankingEntry, UserProfile } from '../game/types';

interface RankingModalProps {
  open: boolean;
  entries: RankingEntry[];
  loading: boolean;
  errorMsg: string | null;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  open,
  entries,
  loading,
  errorMsg,
  currentUser,
  onOpenAuth,
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

  const userIndex = currentUser
    ? entries.findIndex((item) => item.uid === currentUser.uid)
    : -1;
  const userTier = currentUser ? getRankTier(currentUser.trophies) : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(8, 12, 28, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ranking-modal-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border-2 border-amber-400/45 p-6 shadow-2xl flex flex-col gap-4 max-h-[88vh]"
        style={{ backgroundColor: '#101838' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              Temporada Oficial
            </span>
            <h2
              id="ranking-modal-title"
              className="font-display text-3xl font-extrabold text-white leading-tight"
            >
              Ranking Global da Arena
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ranking"
            className="w-8 h-8 rounded-lg border border-indigo-400/30 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Signed-in Player Summary or Guest Prompt */}
        {currentUser && userTier ? (
          <div
            className="rounded-xl border border-indigo-400/35 p-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
            style={{ backgroundColor: 'rgba(18, 28, 66, 0.9)' }}
          >
            <div className="flex items-center gap-3">
              <img
                src={HEROES[currentUser.favoriteHero]?.portraitUrl ?? HEROES.steelshot.portraitUrl}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-lg object-cover object-top border-2 border-amber-400"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-extrabold text-white">
                    {currentUser.displayName}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border"
                    style={{
                      color: userTier.color,
                      backgroundColor: userTier.bg,
                      borderColor: userTier.border,
                    }}
                  >
                    {userTier.label}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Posição:{' '}
                  <strong className="text-amber-400">
                    {userIndex >= 0 ? `#${userIndex + 1}` : 'Sem classificação'}
                  </strong>{' '}
                  · {currentUser.matches} partidas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center font-mono-num">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Troféus</div>
                <div className="text-base font-extrabold text-amber-400">
                  {currentUser.trophies}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Vitórias</div>
                <div className="text-base font-extrabold text-emerald-400">
                  {currentUser.wins}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Abates</div>
                <div className="text-base font-extrabold text-rose-400">
                  {currentUser.kills}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border border-amber-400/35 p-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0"
            style={{ backgroundColor: 'rgba(20, 29, 68, 0.85)' }}
          >
            <div className="text-xs text-slate-200 leading-relaxed">
              Entre ou crie uma conta para salvar seus{' '}
              <strong className="text-amber-400">Troféus, Vitórias e Abates</strong> no Ranking
              Global!
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
            >
              Entrar / Cadastrar
            </button>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[220px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-slate-300">
              Carregando classificação da arena...
            </div>
          ) : errorMsg ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs text-rose-200">
              Não foi possível carregar o ranking agora: {errorMsg}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-2">
              <div className="font-display text-2xl font-bold text-white">
                Arena pronta para novos campeões
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Nenhuma pontuação registrada ainda. Faça login e conclua uma partida para
                conquistar o 1º lugar no Ranking!
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = currentUser?.uid === entry.uid;
              const heroMeta = HEROES[entry.heroId] ?? HEROES.steelshot;
              const tier = getRankTier(entry.trophies);
              const rankBadgeColor =
                rank === 1
                  ? '#fbbf24'
                  : rank === 2
                  ? '#e2e8f0'
                  : rank === 3
                  ? '#d97706'
                  : '#64748b';

              return (
                <div
                  key={entry.uid}
                  className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                    isMe
                      ? 'border-amber-400 bg-indigo-950/90'
                      : 'border-indigo-400/20 bg-slate-950/55'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg font-extrabold text-slate-950 shrink-0"
                      style={{ backgroundColor: rankBadgeColor }}
                    >
                      #{rank}
                    </div>
                    <img
                      src={heroMeta.portraitUrl}
                      alt={heroMeta.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover object-top border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {entry.displayName}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                            Você
                          </span>
                        )}
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                          style={{
                            color: tier.color,
                            backgroundColor: tier.bg,
                            borderColor: tier.border,
                          }}
                        >
                          {tier.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Herói: {heroMeta.name} · {entry.wins}V / {entry.matches}J ·{' '}
                        {entry.kills} abates
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono-num">
                    <div className="text-base font-extrabold text-amber-400 leading-none">
                      {entry.trophies}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                      Troféus
                    </div>
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
