import { GameMode } from './types';

export type QuestMetric =
  | 'kills'
  | 'matches'
  | 'wins'
  | 'damage'
  | 'cubes'
  | 'royale_matches'
  | 'brawl_wins';

export type QuestCategory = 'combat' | 'play' | 'victory' | 'mode';

export interface DailyQuestTemplate {
  id: string;
  category: QuestCategory;
  metric: QuestMetric;
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardGems: number;
}

export interface DailyQuestItem {
  id: string;
  metric: QuestMetric;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXp: number;
  rewardGems: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerProgressionState {
  xp: number;
  gems: number;
  dateKey: string;
  quests: DailyQuestItem[];
  loginStreak: number;
  lastLoginDateKey: string | null;
}

export interface LoginStreakResult {
  state: PlayerProgressionState;
  awarded: boolean;
  streak: number;
  gemsGained: number;
  wasReset: boolean;
}

export const LOGIN_STREAK_REWARDS = [10, 15, 20, 25, 35, 45, 60] as const;

export const SEASON_WELCOME_GIFT_ID = 'season1_welcome_10k' as const;
export const SEASON_WELCOME_GIFT_GEMS = 10000;

export interface MatchRewardBreakdown {
  gems: number;
  xp: number;
}

export interface MatchQuestTelemetry {
  kills: number;
  victory: boolean;
  damageDealt: number;
  powerCubes: number;
  mode: GameMode;
  placement?: number;
}

export interface LevelInfo {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
}

export const DAILY_QUEST_COUNT = 3;

export const DAILY_QUEST_POOL: readonly DailyQuestTemplate[] = [
  {
    id: 'kills_5',
    category: 'combat',
    metric: 'kills',
    title: 'Caçador da Arena',
    description: 'Consiga 5 abates em partidas',
    target: 5,
    rewardXp: 150,
    rewardGems: 25,
  },
  {
    id: 'play_2',
    category: 'play',
    metric: 'matches',
    title: 'Aquecimento Diário',
    description: 'Jogue 2 partidas em qualquer modo',
    target: 2,
    rewardXp: 100,
    rewardGems: 20,
  },
  {
    id: 'win_1',
    category: 'victory',
    metric: 'wins',
    title: 'Campeão do Dia',
    description: 'Vença 1 partida na arena',
    target: 1,
    rewardXp: 200,
    rewardGems: 40,
  },
  {
    id: 'damage_5000',
    category: 'combat',
    metric: 'damage',
    title: 'Poder de Fogo',
    description: 'Cause 5.000 de dano aos oponentes',
    target: 5000,
    rewardXp: 160,
    rewardGems: 30,
  },
  {
    id: 'cubes_6',
    category: 'play',
    metric: 'cubes',
    title: 'Coletor de Energia',
    description: 'Colete 6 cubos de poder na arena',
    target: 6,
    rewardXp: 130,
    rewardGems: 25,
  },
  {
    id: 'kills_10',
    category: 'combat',
    metric: 'kills',
    title: 'Predador Implacável',
    description: 'Consiga 10 abates acumulados',
    target: 10,
    rewardXp: 240,
    rewardGems: 50,
  },
  {
    id: 'play_3',
    category: 'play',
    metric: 'matches',
    title: 'Veterano de Batalha',
    description: 'Jogue 3 partidas em qualquer modo',
    target: 3,
    rewardXp: 160,
    rewardGems: 30,
  },
  {
    id: 'royale_2',
    category: 'mode',
    metric: 'royale_matches',
    title: 'Sobrevivente Royale',
    description: 'Jogue 2 partidas no Battle Royale',
    target: 2,
    rewardXp: 150,
    rewardGems: 30,
  },
  {
    id: 'brawl_win_1',
    category: 'victory',
    metric: 'brawl_wins',
    title: 'Domínio 4v4',
    description: 'Vença 1 partida no Deathmatch 4v4',
    target: 1,
    rewardXp: 220,
    rewardGems: 45,
  },
];

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toDailyQuestItem(tpl: DailyQuestTemplate): DailyQuestItem {
  return {
    id: tpl.id,
    metric: tpl.metric,
    title: tpl.title,
    description: tpl.description,
    target: Math.max(1, Math.floor(tpl.target)),
    progress: 0,
    rewardXp: Math.max(0, Math.floor(tpl.rewardXp)),
    rewardGems: Math.max(0, Math.floor(tpl.rewardGems)),
    completed: false,
    claimed: false,
  };
}

/**
 * Generates 3 random daily challenges for the given calendar date.
 * Prefers distinct quest metrics/categories so the trio feels varied.
 */
export function generateDailyQuests(
  dateKey: string,
  salt = 'arena',
  randomFn?: () => number
): DailyQuestItem[] {
  const rng = randomFn ?? createMulberry32(hashSeed(`${dateKey}:${salt}`));
  const pool = [...DAILY_QUEST_POOL];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  const chosen: DailyQuestTemplate[] = [];
  const usedMetrics = new Set<QuestMetric>();
  const usedCategories = new Set<QuestCategory>();

  // Pass 1: pick distinct category + distinct metric
  for (const tpl of pool) {
    if (chosen.length >= DAILY_QUEST_COUNT) break;
    if (!usedCategories.has(tpl.category) && !usedMetrics.has(tpl.metric)) {
      chosen.push(tpl);
      usedCategories.add(tpl.category);
      usedMetrics.add(tpl.metric);
    }
  }

  // Pass 2: fill any remaining slots ensuring distinct metric & id
  for (const tpl of pool) {
    if (chosen.length >= DAILY_QUEST_COUNT) break;
    if (!usedMetrics.has(tpl.metric) && !chosen.some((c) => c.id === tpl.id)) {
      chosen.push(tpl);
      usedMetrics.add(tpl.metric);
    }
  }

  // Pass 3: safety fallback
  for (const tpl of pool) {
    if (chosen.length >= DAILY_QUEST_COUNT) break;
    if (!chosen.some((c) => c.id === tpl.id)) {
      chosen.push(tpl);
    }
  }

  return chosen.slice(0, DAILY_QUEST_COUNT).map(toDailyQuestItem);
}

export function sanitizeQuestItem(raw: Partial<DailyQuestItem> | null | undefined): DailyQuestItem | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.metric !== 'string') return null;
  const tpl = DAILY_QUEST_POOL.find((t) => t.id === raw.id);
  const target = Math.max(1, Math.min(100000, Math.floor(Number(raw.target ?? tpl?.target ?? 1))));
  const progress = Math.max(0, Math.min(target, Math.floor(Number(raw.progress ?? 0))));
  const completed = progress >= target || Boolean(raw.completed && progress >= target);
  return {
    id: raw.id.slice(0, 40),
    metric: (tpl?.metric ?? raw.metric) as QuestMetric,
    title: String(raw.title ?? tpl?.title ?? 'Missão Diária').slice(0, 64),
    description: String(raw.description ?? tpl?.description ?? 'Complete o objetivo').slice(0, 160),
    target,
    progress,
    rewardXp: Math.max(0, Math.min(1000, Math.floor(Number(raw.rewardXp ?? tpl?.rewardXp ?? 100)))),
    rewardGems: Math.max(0, Math.min(500, Math.floor(Number(raw.rewardGems ?? tpl?.rewardGems ?? 20)))),
    completed,
    claimed: completed ? Boolean(raw.claimed) : false,
  };
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKeyUtcMs(dateKey: string): number | null {
  if (!DATE_KEY_PATTERN.test(dateKey)) return null;
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const utc = Date.UTC(y, m - 1, d);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return utc;
}

export function diffCalendarDays(fromDateKey: string, toDateKey: string): number | null {
  const fromMs = parseDateKeyUtcMs(fromDateKey);
  const toMs = parseDateKeyUtcMs(toDateKey);
  if (fromMs === null || toMs === null) return null;
  return Math.round((toMs - fromMs) / 86400000);
}

export function getLoginStreakRewardGems(streak: number): number {
  const safeStreak = Math.max(1, Math.floor(streak));
  const idx = Math.min(LOGIN_STREAK_REWARDS.length - 1, safeStreak - 1);
  return LOGIN_STREAK_REWARDS[idx];
}

export function ensureDailyProgressionState(
  existing: Partial<PlayerProgressionState> | null | undefined,
  dateKey: string = getLocalDateKey(),
  salt = 'arena'
): PlayerProgressionState {
  const safeXp = Math.max(0, Math.min(10000000, Math.floor(Number(existing?.xp ?? 0))));
  const safeGems = Math.max(0, Math.min(10000000, Math.floor(Number(existing?.gems ?? 0))));
  const safeStreak = Math.max(
    0,
    Math.min(36500, Math.floor(Number(existing?.loginStreak ?? 0)))
  );
  const safeLastLogin =
    typeof existing?.lastLoginDateKey === 'string' &&
    parseDateKeyUtcMs(existing.lastLoginDateKey) !== null
      ? existing.lastLoginDateKey
      : null;

  if (existing && existing.dateKey === dateKey && Array.isArray(existing.quests)) {
    const validQuests = existing.quests
      .map((q) => sanitizeQuestItem(q))
      .filter((q): q is DailyQuestItem => q !== null);
    if (validQuests.length === DAILY_QUEST_COUNT) {
      return {
        xp: safeXp,
        gems: safeGems,
        dateKey,
        quests: validQuests,
        loginStreak: safeStreak,
        lastLoginDateKey: safeLastLogin,
      };
    }
  }

  return {
    xp: safeXp,
    gems: safeGems,
    dateKey,
    quests: generateDailyQuests(dateKey, salt),
    loginStreak: safeStreak,
    lastLoginDateKey: safeLastLogin,
  };
}

export function applyDailyLoginStreak(
  state: PlayerProgressionState,
  todayKey: string = getLocalDateKey()
): LoginStreakResult {
  const currentStreak = Math.max(0, Math.min(36500, Math.floor(state.loginStreak || 0)));
  const lastKey = state.lastLoginDateKey;

  if (lastKey === todayKey && currentStreak >= 1) {
    return {
      state,
      awarded: false,
      streak: currentStreak,
      gemsGained: 0,
      wasReset: false,
    };
  }

  const dayDiff = lastKey ? diffCalendarDays(lastKey, todayKey) : null;
  if (dayDiff !== null && dayDiff < 0) {
    return {
      state,
      awarded: false,
      streak: currentStreak,
      gemsGained: 0,
      wasReset: false,
    };
  }

  const isConsecutive = dayDiff === 1 && currentStreak >= 1;
  const nextStreak = isConsecutive ? Math.min(36500, currentStreak + 1) : 1;
  const wasReset = !isConsecutive && currentStreak >= 1 && dayDiff !== null && dayDiff > 1;
  const gemsGained = getLoginStreakRewardGems(nextStreak);

  return {
    state: {
      ...state,
      gems: Math.min(10000000, state.gems + gemsGained),
      loginStreak: nextStreak,
      lastLoginDateKey: todayKey,
    },
    awarded: true,
    streak: nextStreak,
    gemsGained,
    wasReset,
  };
}

export function getMatchMetricIncrement(
  metric: QuestMetric,
  match: MatchQuestTelemetry
): number {
  switch (metric) {
    case 'matches':
      return 1;
    case 'kills':
      return Math.max(0, Math.min(100, Math.floor(match.kills)));
    case 'wins':
      return match.victory ? 1 : 0;
    case 'damage':
      return Math.max(0, Math.min(100000, Math.round(match.damageDealt)));
    case 'cubes':
      return Math.max(0, Math.min(100, Math.floor(match.powerCubes)));
    case 'royale_matches':
      return match.mode === 'royale' ? 1 : 0;
    case 'brawl_wins':
      return match.mode === 'brawl' && match.victory ? 1 : 0;
    default:
      return 0;
  }
}

export function applyMatchToDailyQuests(
  state: PlayerProgressionState,
  match: MatchQuestTelemetry
): {
  state: PlayerProgressionState;
  progressedIds: string[];
  newlyCompletedIds: string[];
} {
  const progressedIds: string[] = [];
  const newlyCompletedIds: string[] = [];

  const nextQuests = state.quests.map((quest) => {
    if (quest.completed) return quest;
    const inc = getMatchMetricIncrement(quest.metric, match);
    if (inc <= 0) return quest;

    const nextProgress = Math.min(quest.target, quest.progress + inc);
    const nowCompleted = nextProgress >= quest.target;
    if (nextProgress > quest.progress) {
      progressedIds.push(quest.id);
    }
    if (!quest.completed && nowCompleted) {
      newlyCompletedIds.push(quest.id);
    }
    return {
      ...quest,
      progress: nextProgress,
      completed: nowCompleted,
    };
  });

  return {
    state: {
      ...state,
      quests: nextQuests,
    },
    progressedIds,
    newlyCompletedIds,
  };
}

export function claimDailyQuestReward(
  state: PlayerProgressionState,
  questId: string
): {
  state: PlayerProgressionState;
  claimed: boolean;
  xpGained: number;
  gemsGained: number;
} {
  const targetQuest = state.quests.find((q) => q.id === questId);
  if (!targetQuest || !targetQuest.completed || targetQuest.claimed) {
    return { state, claimed: false, xpGained: 0, gemsGained: 0 };
  }

  const nextQuests = state.quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );

  return {
    state: {
      ...state,
      xp: Math.min(10000000, state.xp + targetQuest.rewardXp),
      gems: Math.min(10000000, state.gems + targetQuest.rewardGems),
      quests: nextQuests,
    },
    claimed: true,
    xpGained: targetQuest.rewardXp,
    gemsGained: targetQuest.rewardGems,
  };
}

export function computeLevelInfo(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = safeXp;
  let nextLevelXp = 200;

  while (remaining >= nextLevelXp && level < 999) {
    remaining -= nextLevelXp;
    level += 1;
    nextLevelXp = 200 + (level - 1) * 100;
  }

  const progressPct = nextLevelXp > 0 ? Math.min(100, Math.round((remaining / nextLevelXp) * 100)) : 0;
  return {
    level,
    totalXp: safeXp,
    currentLevelXp: remaining,
    nextLevelXp,
    progressPct,
  };
}

export function computeMatchGemReward(
  match: MatchQuestTelemetry
): MatchRewardBreakdown {
  const safeKills = Math.max(0, Math.min(40, Math.floor(match.kills || 0)));
  const baseGems = 10;
  const victoryBonusGems = match.victory ? 15 : 0;
  const placementBonusGems =
    !match.victory &&
    match.mode === 'royale' &&
    typeof match.placement === 'number' &&
    match.placement >= 1 &&
    match.placement <= 3
      ? 5
      : 0;
  const killBonusGems = Math.min(15, safeKills * 2);

  const gems = Math.min(
    45,
    baseGems + victoryBonusGems + placementBonusGems + killBonusGems
  );

  const baseXp = 30;
  const victoryBonusXp = match.victory ? 40 : 0;
  const killBonusXp = Math.min(60, safeKills * 10);
  const xp = Math.min(130, baseXp + victoryBonusXp + killBonusXp);

  return { gems, xp };
}

export function applyMatchRewardToProgression(
  state: PlayerProgressionState,
  match: MatchQuestTelemetry
): {
  state: PlayerProgressionState;
  reward: MatchRewardBreakdown;
} {
  const reward = computeMatchGemReward(match);
  return {
    state: {
      ...state,
      xp: Math.min(10000000, state.xp + reward.xp),
      gems: Math.min(10000000, state.gems + reward.gems),
    },
    reward,
  };
}

export function countClaimableDailyQuests(state: PlayerProgressionState): number {
  return state.quests.filter((q) => q.completed && !q.claimed).length;
}
