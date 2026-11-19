import React, { useEffect, useState } from 'react';
import { HEROES } from '../game/heroes';
import { GAME_MODE_LABELS, formatMatchDateTime } from '../game/recentMatches';
import { RecentMatchEntry, UserProfile } from '../game/types';

interface RecentMatchesModalProps {
  open: boolean;
  matches: RecentMatchEntry[];
  loading: boolean;
  errorMsg: string | null;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onClose: () => void;
}

export const RecentMatchesModal: React.FC<RecentMatchesModalProps> = ({
  open,
  matches,
  loading,
  errorMsg,
  currentUser,
  onOpenAuth,
  onClose,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

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

  const winsCount = matches.filter((m) => m.victory).length;
  const lossesCount = matches.length - winsCount;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(8, 12, 28, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recent-matches-modal-title"
    >
      <div
        data-testid="recent-matches-modal"
        className="w-full max-w-xl rounded-2xl border-2 border-indigo-400/45 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
        style={{ backgroundColor: '#101838' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
              Histórico na Nuvem · Últimas 5 Partidas
            </span>
            <h2
              id="recent-matches-modal-title"
              className="font-display text-3xl font-extrabold text-white leading-tight"
            >
              Partidas Recentes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar partidas recentes"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-indigo-400/30 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Account Summary or Sign-In Prompt */}
        {currentUser ? (
          <div
            className="rounded-xl border border-indigo-400/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
            style={{ backgroundColor: 'rgba(18, 28, 66, 0.9)' }}
          >
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-white truncate">
                {currentUser.displayName}
              </div>
              <div className="text-xs text-slate-300 font-mono-num mt-0.5">
                {matches.length > 0
                  ? `${matches.length} ${matches.length === 1 ? 'partida recente' : 'partidas recentes'} · ${winsCount}V / ${lossesCount}D`
                  : 'Nenhuma partida recente registrada'}
              </div>
            </div>
            <div className="text-right font-mono-num text-xs text-slate-300 shrink-0">
              Total na conta:{' '}
              <strong className="text-amber-300">{currentUser.matches} partidas</strong>
            </div>
          </div>
        ) : (
          <div
            data-testid="recent-matches-auth-prompt"
            className="rounded-xl border border-amber-400/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
            style={{ backgroundColor: 'rgba(20, 29, 68, 0.85)' }}
          >
            <div className="text-xs text-slate-200 leading-relaxed">
              Entre ou crie uma conta para consultar suas{' '}
              <strong className="text-amber-400">5 partidas mais recentes</strong> direto da sua
              coleção no Firestore.
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              Entrar / Cadastrar
            </button>
          </div>
        )}

        {/* Matches List */}
        {currentUser && (
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-2.5 min-h-[180px]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-10 text-sm text-slate-300">
                Carregando partidas recentes...
              </div>
            ) : errorMsg ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-xs text-rose-200">
                Não foi possível carregar as partidas recentes: {errorMsg}
              </div>
            ) : matches.length === 0 ? (
              <div
                data-testid="recent-matches-empty"
                className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-2"
              >
                <div className="font-display text-2xl font-bold text-white">
                  Nenhuma partida no histórico
                </div>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Conclua uma partida na arena conectado à sua conta para registrar seus resultados
                  (vitória/derrota, herói, modo e data).
                </p>
              </div>
            ) : (
              matches.map((match) => {
                const heroMeta = HEROES[match.heroId] ?? HEROES.steelshot;
                const modeLabel = GAME_MODE_LABELS[match.mode] ?? 'Battle Royale';
                const formattedDate = formatMatchDateTime(match.playedAtMs);
                const imgFailed = imgErrors[match.id];

                return (
                  <div
                    key={match.id}
                    data-testid="recent-match-row"
                    className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                      match.victory
                        ? 'border-emerald-400/35 bg-slate-950/70'
                        : 'border-rose-400/30 bg-slate-950/60'
                    }`}
                  >
                    {/* Hero Portrait + Match Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                        {!imgFailed ? (
                          <img
                            src={heroMeta.portraitUrl}
                            alt={heroMeta.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [match.id]: true }))
                            }
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center font-display text-lg font-extrabold"
                            style={{ backgroundColor: heroMeta.accentSoft, color: heroMeta.accent }}
                          >
                            {heroMeta.name[0]}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 font-display text-lg font-extrabold leading-none ${
                              match.victory ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {match.victory ? (
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                              </svg>
                            )}
                            {match.victory ? 'Vitória' : 'Derrota'}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-sm font-extrabold text-white truncate">
                            {heroMeta.name}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap font-mono-num">
                          <span className="text-indigo-200 font-semibold">{modeLabel}</span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kills & Trophy Delta */}
                    <div className="text-right shrink-0 font-mono-num">
                      <div
                        className={`text-sm font-extrabold leading-none ${
                          match.trophyDelta >= 0 ? 'text-amber-300' : 'text-rose-300'
                        }`}
                      >
                        {match.trophyDelta >= 0 ? `+${match.trophyDelta}` : match.trophyDelta} 🏆
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {match.kills} {match.kills === 1 ? 'abate' : 'abates'}
                        {match.mode === 'royale' ? ` · #${match.placement}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-indigo-400/30 text-slate-200 hover:bg-white/10 font-semibold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
