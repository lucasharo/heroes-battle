import { HEROES } from './heroes';
import { GameMode, HeroId, RecentMatchEntry } from './types';

export const RECENT_MATCHES_LIMIT = 5;

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  royale: 'Battle Royale',
  brawl: 'Deathmatch 4v4',
  superstar: 'Super Estrela',
  tower: 'Cerco à Torre',
};

const VALID_MODES = new Set<GameMode>(['royale', 'brawl', 'superstar', 'tower']);

export function sanitizeHeroId(heroId: unknown): HeroId {
  if (typeof heroId === 'string' && heroId in HEROES) {
    return heroId as HeroId;
  }
  return 'steelshot';
}

export function sanitizeGameMode(mode: unknown): GameMode {
  if (typeof mode === 'string' && VALID_MODES.has(mode as GameMode)) {
    return mode as GameMode;
  }
  return 'royale';
}

export function extractMatchTimestampMs(createdAt: unknown, playedAtMs?: unknown): number {
  if (typeof playedAtMs === 'number' && Number.isFinite(playedAtMs) && playedAtMs > 0) {
    return Math.floor(playedAtMs);
  }
  if (createdAt && typeof createdAt === 'object') {
    const maybeTs = createdAt as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
    };
    if (typeof maybeTs.toMillis === 'function') {
      const ms = maybeTs.toMillis();
      if (Number.isFinite(ms) && ms > 0) return Math.floor(ms);
    }
    if (typeof maybeTs.toDate === 'function') {
      const ms = maybeTs.toDate().getTime();
      if (Number.isFinite(ms) && ms > 0) return Math.floor(ms);
    }
    if (typeof maybeTs.seconds === 'number' && Number.isFinite(maybeTs.seconds)) {
      return Math.floor(maybeTs.seconds * 1000);
    }
  }
  if (typeof createdAt === 'number' && Number.isFinite(createdAt) && createdAt > 0) {
    return Math.floor(createdAt);
  }
  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return 0;
}

export function formatMatchDateTime(timestampMs: number, locale = 'pt-BR'): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return 'Data indisponível';
  }
  try {
    const date = new Date(timestampMs);
    const datePart = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return `${datePart} · ${timePart}`;
  } catch {
    return new Date(timestampMs).toISOString().slice(0, 16).replace('T', ' · ');
  }
}

export function buildMatchResultPayload(params: {
  uid: string;
  victory: boolean;
  heroId: HeroId;
  mode: GameMode;
  kills: number;
  placement?: number;
  trophyDelta: number;
  playedAtMs?: number;
}): Omit<RecentMatchEntry, 'id' | 'createdAt'> {
  const safeUid = params.uid.slice(0, 128);
  const safeKills = Math.max(0, Math.min(40, Math.floor(Number(params.kills) || 0)));
  const fallbackPlacement = params.victory ? 1 : 2;
  const safePlacement = Math.max(
    1,
    Math.min(8, Math.floor(Number(params.placement ?? fallbackPlacement) || fallbackPlacement))
  );
  const safeDelta = Math.max(-80, Math.min(80, Math.trunc(Number(params.trophyDelta) || 0)));
  const rawTime = params.playedAtMs ?? Date.now();
  const safeTime = Math.max(0, Math.min(4102444800000, Math.floor(Number(rawTime) || Date.now())));

  return {
    uid: safeUid,
    victory: Boolean(params.victory),
    heroId: sanitizeHeroId(params.heroId),
    mode: sanitizeGameMode(params.mode),
    kills: safeKills,
    placement: safePlacement,
    trophyDelta: safeDelta,
    playedAtMs: safeTime,
  };
}

export function normalizeMatchResult(
  id: string,
  raw: Record<string, unknown>
): RecentMatchEntry {
  const playedAtMs = extractMatchTimestampMs(raw.createdAt, raw.playedAtMs);
  return {
    id,
    uid: typeof raw.uid === 'string' ? raw.uid : '',
    victory: Boolean(raw.victory),
    heroId: sanitizeHeroId(raw.heroId),
    mode: sanitizeGameMode(raw.mode),
    kills: Math.max(0, Math.floor(Number(raw.kills ?? 0) || 0)),
    placement: Math.max(1, Math.min(8, Math.floor(Number(raw.placement ?? 1) || 1))),
    trophyDelta: Math.trunc(Number(raw.trophyDelta ?? 0) || 0),
    playedAtMs,
    createdAt: raw.createdAt,
  };
}

export function sortAndLimitRecentMatches(
  matches: RecentMatchEntry[],
  maxItems = RECENT_MATCHES_LIMIT
): RecentMatchEntry[] {
  return [...matches]
    .sort((a, b) => b.playedAtMs - a.playedAtMs)
    .slice(0, Math.max(1, maxItems));
}
