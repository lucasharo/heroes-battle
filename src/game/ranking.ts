import { GameMode, HeroId, RankTierId } from './types';

export interface RankTierInfo {
  id: RankTierId;
  label: string;
  minTrophies: number;
  color: string;
  bg: string;
  border: string;
}

export const RANK_TIERS: RankTierInfo[] = [
  {
    id: 'bronze',
    label: 'Bronze',
    minTrophies: 0,
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.16)',
    border: 'rgba(217, 119, 6, 0.5)',
  },
  {
    id: 'prata',
    label: 'Prata',
    minTrophies: 200,
    color: '#CBD5E1',
    bg: 'rgba(203, 213, 225, 0.16)',
    border: 'rgba(203, 213, 225, 0.5)',
  },
  {
    id: 'ouro',
    label: 'Ouro',
    minTrophies: 500,
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.18)',
    border: 'rgba(251, 191, 36, 0.58)',
  },
  {
    id: 'diamante',
    label: 'Diamante',
    minTrophies: 900,
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.18)',
    border: 'rgba(56, 189, 248, 0.58)',
  },
  {
    id: 'mestre',
    label: 'Mestre',
    minTrophies: 1500,
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.18)',
    border: 'rgba(192, 132, 252, 0.6)',
  },
  {
    id: 'lendario',
    label: 'Lendário',
    minTrophies: 2300,
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.2)',
    border: 'rgba(251, 113, 133, 0.65)',
  },
];

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9À-ÿ _-]+$/;

export function getRankTier(trophies: number): RankTierInfo {
  const safe = Math.max(0, Math.floor(trophies));
  let matched = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (safe >= tier.minTrophies) {
      matched = tier;
    }
  }
  return matched;
}

export interface TrophyDeltaInput {
  victory: boolean;
  kills: number;
  mode: GameMode;
  placement?: number;
}

export function computeMatchTrophyDelta(input: TrophyDeltaInput): number {
  const kills = Math.max(0, Math.min(40, Math.floor(input.kills)));
  const killBonus = input.victory ? Math.min(25, kills * 3) : Math.min(8, kills * 2);

  if (input.victory) {
    const modeBonus = input.mode === 'royale' ? 12 : 4;
    return Math.min(80, 30 + killBonus + modeBonus);
  }

  if (input.mode === 'royale' && input.placement !== undefined) {
    if (input.placement <= 2) return Math.min(80, 16 + killBonus);
    if (input.placement <= 3) return Math.min(80, 8 + killBonus);
    if (input.placement <= 4) return Math.min(80, 2 + killBonus);
  }

  return Math.max(-16, -10 + killBonus);
}

export function applyMatchStats(
  prev: { trophies: number; wins: number; matches: number; kills: number },
  input: TrophyDeltaInput & { heroId: HeroId }
): {
  delta: number;
  trophies: number;
  wins: number;
  matches: number;
  kills: number;
  heroId: HeroId;
} {
  const delta = computeMatchTrophyDelta(input);
  const clampedKills = Math.max(0, Math.min(40, Math.floor(input.kills)));
  return {
    delta,
    trophies: Math.max(0, Math.min(1000000, prev.trophies + delta)),
    wins: Math.min(100000, prev.wins + (input.victory ? 1 : 0)),
    matches: Math.min(100000, prev.matches + 1),
    kills: Math.min(1000000, prev.kills + clampedKills),
    heroId: input.heroId,
  };
}

export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/[^a-zA-Z0-9À-ÿ _-]/g, '')
    .trim()
    .slice(0, DISPLAY_NAME_MAX)
    .trim();
  return trimmed.length >= DISPLAY_NAME_MIN ? trimmed : 'Guerreiro';
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
    return `O apelido deve ter entre ${DISPLAY_NAME_MIN} e ${DISPLAY_NAME_MAX} caracteres.`;
  }
  if (!DISPLAY_NAME_REGEX.test(trimmed)) {
    return 'Use apenas letras, números, espaços, "-" ou "_".';
  }
  return null;
}

export function validateEmailInput(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Informe um e-mail válido.';
  }
  return null;
}

export function validatePasswordInput(password: string): string | null {
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
}
