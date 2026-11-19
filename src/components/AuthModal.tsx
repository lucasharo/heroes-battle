import React, { useEffect, useState } from 'react';
import {
  validateDisplayName,
  validateEmailInput,
  validatePasswordInput,
} from '../game/ranking';
import { HeroId, UserProfile } from '../game/types';
import {
  loginWithEmail,
  loginWithGoogle,
  mapAuthErrorMessage,
  registerWithEmail,
} from '../services/accountService';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  favoriteHero: HeroId;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialMode = 'login',
  favoriteHero,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrorMsg(null);
    }
  }, [open, initialMode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      const nameErr = validateDisplayName(displayName);
      if (nameErr) {
        setErrorMsg(nameErr);
        return;
      }
    }
    const emailErr = validateEmailInput(email);
    if (emailErr) {
      setErrorMsg(emailErr);
      return;
    }
    const passErr = validatePasswordInput(password);
    if (passErr) {
      setErrorMsg(passErr);
      return;
    }

    setBusy(true);
    try {
      const profile =
        mode === 'login'
          ? await loginWithEmail(email, password, favoriteHero)
          : await registerWithEmail(email, password, displayName, favoriteHero);
      onSuccess(profile);
      onClose();
    } catch (err) {
      setErrorMsg(mapAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const profile = await loginWithGoogle(favoriteHero);
      onSuccess(profile);
      onClose();
    } catch (err) {
      setErrorMsg(mapAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(8, 12, 28, 0.84)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-md min-w-0 max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-indigo-400/40 p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
        style={{ backgroundColor: '#101838' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
              Conta Thetan Arena
            </span>
            <h2
              id="auth-modal-title"
              className="font-display text-3xl font-extrabold text-white leading-tight"
            >
              {mode === 'login' ? 'Entrar na Arena' : 'Criar Conta'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de autenticação"
            className="w-8 h-8 rounded-lg border border-indigo-400/30 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-lg font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Mode Switcher */}
        <div
          className="grid grid-cols-2 p-1 rounded-xl border border-indigo-400/30 gap-1"
          style={{ backgroundColor: 'rgba(9, 13, 30, 0.85)' }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg text-sm font-extrabold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg text-sm font-extrabold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Google Login CTA */}
        <button
          type="button"
          disabled={busy}
          onClick={handleGoogle}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 8.9 0 10.9 0 13s.6 4.1 1.6 6l3.7-4.2z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.1 7.4 24 12 24z"
            />
          </svg>
          <span>{busy ? 'Conectando...' : 'Entrar com Google'}</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
          <div className="h-px flex-1 bg-indigo-400/25" />
          <span>ou com e-mail e senha</span>
          <div className="h-px flex-1 bg-indigo-400/25" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-200">Nome de Guerreiro</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={24}
                placeholder="Ex: RelâmpagoBR"
                className="px-3 py-2 rounded-lg border border-indigo-400/35 bg-slate-950/75 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-200">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={160}
              placeholder="seu@email.com"
              className="px-3 py-2 rounded-lg border border-indigo-400/35 bg-slate-950/75 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-200">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="px-3 py-2 rounded-lg border border-indigo-400/35 bg-slate-950/75 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </label>

          {errorMsg && (
            <div
              role="alert"
              className="min-w-0 rounded-lg border border-rose-500/50 bg-rose-950/60 px-3 py-2 text-xs text-rose-200 leading-relaxed break-words [overflow-wrap:anywhere]"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-xl font-extrabold tracking-wide cursor-pointer disabled:opacity-60 mt-1"
          >
            {busy
              ? 'Processando...'
              : mode === 'login'
              ? 'Entrar com E-mail'
              : 'Cadastrar e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
