import { HEROES } from './heroes';
import { HeroId } from './types';

export type MasteryFrameId =
  | 'recruta'
  | 'bronze'
  | 'prata'
  | 'ouro'
  | 'diamante'
  | 'lenda';

export interface MasteryTierSpec {
  level: number;
  frameId: MasteryFrameId;
  name: string;
  frameName: string;
  minPoints: number;
  minMatchesHint: number;
  upgradeCostGems: number | null;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  surfaceBg: string;
  description: string;
}

export interface HeroMasteryStats {
  heroId: HeroId;
  matches: number;
  kills: number;
  bonusPoints?: number;
  equippedFrame: MasteryFrameId | 'auto';
}

export type HeroMasteryMap = Partial<Record<HeroId, HeroMasteryStats>>;

export interface HeroMasteryProgress {
  heroId: HeroId;
  matches: number;
  kills: number;
  bonusPoints: number;
  points: number;
  tier: MasteryTierSpec;
  nextTier: MasteryTierSpec | null;
  pointsIntoTier: number;
  pointsForNextTier: number;
  progressPct: number;
  unlockedFrames: MasteryFrameId[];
  activeFrameId: MasteryFrameId;
  activeFrameSpec: MasteryTierSpec;
  equippedPreference: MasteryFrameId | 'auto';
}

export const MASTERY_POINTS_PER_MATCH = 40;
export const MASTERY_POINTS_PER_KILL = 15;
export const MAX_HERO_MATCHES = 100000;
export const MAX_HERO_KILLS = 1000000;
export const MAX_HERO_BONUS_POINTS = 100000;

export const MASTERY_TIERS: readonly MasteryTierSpec[] = [
  {
    level: 1,
    frameId: 'recruta',
    name: 'Recruta',
    frameName: 'Aço Padrão',
    minPoints: 0,
    minMatchesHint: 0,
    upgradeCostGems: 25,
    primaryColor: '#64748b',
    secondaryColor: '#94a3b8',
    glowColor: 'rgba(100, 116, 139, 0.22)',
    surfaceBg: 'rgba(15, 23, 42, 0.92)',
    description: 'Moldura tática inicial da Arena para novos combatentes.',
  },
  {
    level: 2,
    frameId: 'bronze',
    name: 'Veterano',
    frameName: 'Bronze Forjado',
    minPoints: 60,
    minMatchesHint: 1,
    upgradeCostGems: 35,
    primaryColor: '#d97706',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(217, 119, 6, 0.38)',
    surfaceBg: 'rgba(41, 24, 12, 0.92)',
    description: 'Borda de bronze rebitado com cantoneiras blindadas.',
  },
  {
    level: 3,
    frameId: 'prata',
    name: 'Especialista',
    frameName: 'Prata Cromada',
    minPoints: 180,
    minMatchesHint: 3,
    upgradeCostGems: 50,
    primaryColor: '#cbd5e1',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(148, 163, 184, 0.42)',
    surfaceBg: 'rgba(22, 32, 52, 0.92)',
    description: 'Liga metálica escovada com insígnia angular de precisão.',
  },
  {
    level: 4,
    frameId: 'ouro',
    name: 'Campeão',
    frameName: 'Ouro Imperial',
    minPoints: 400,
    minMatchesHint: 6,
    upgradeCostGems: 75,
    primaryColor: '#f59e0b',
    secondaryColor: '#fef08a',
    glowColor: 'rgba(245, 158, 11, 0.48)',
    surfaceBg: 'rgba(44, 30, 8, 0.94)',
    description: 'Chapas douradas chanfradas com garras reais nos cantos.',
  },
  {
    level: 5,
    frameId: 'diamante',
    name: 'Grão-Mestre',
    frameName: 'Diamante Prismático',
    minPoints: 750,
    minMatchesHint: 12,
    upgradeCostGems: 100,
    primaryColor: '#22d3ee',
    secondaryColor: '#e0f2fe',
    glowColor: 'rgba(34, 211, 238, 0.52)',
    surfaceBg: 'rgba(8, 36, 54, 0.94)',
    description: 'Cristal azulado lapidado com prismas geométricos nos vértices.',
  },
  {
    level: 6,
    frameId: 'lenda',
    name: 'Lenda Suprema',
    frameName: 'Coroa Solar',
    minPoints: 1250,
    minMatchesHint: 20,
    upgradeCostGems: null,
    primaryColor: '#fb7185',
    secondaryColor: '#fde047',
    glowColor: 'rgba(251, 113, 133, 0.58)',
    surfaceBg: 'rgba(54, 14, 32, 0.95)',
    description: 'Moldura mítica com coroa superior e asas solares douradas.',
  },
] as const;

export const VALID_MASTERY_FRAME_IDS: readonly MasteryFrameId[] = MASTERY_TIERS.map(
  (t) => t.frameId
);

export function isValidHeroId(value: unknown): value is HeroId {
  return typeof value === 'string' && value in HEROES;
}

export function isValidMasteryFramePreference(
  value: unknown
): value is MasteryFrameId | 'auto' {
  return (
    value === 'auto' ||
    (typeof value === 'string' &&
      (VALID_MASTERY_FRAME_IDS as readonly string[]).includes(value))
  );
}

export function getMasteryTierByFrameId(frameId: MasteryFrameId): MasteryTierSpec {
  return MASTERY_TIERS.find((t) => t.frameId === frameId) ?? MASTERY_TIERS[0];
}

export function getNextFrameUpgradeCostGems(currentLevel: number): number | null {
  const clamped = Math.max(1, Math.min(MASTERY_TIERS.length, Math.floor(currentLevel || 1)));
  return MASTERY_TIERS[clamped - 1]?.upgradeCostGems ?? null;
}

export function computeHeroMasteryPoints(
  matches: number,
  kills: number,
  bonusPoints = 0
): number {
  const safeMatches = Math.max(0, Math.min(MAX_HERO_MATCHES, Math.floor(matches || 0)));
  const safeKills = Math.max(0, Math.min(MAX_HERO_KILLS, Math.floor(kills || 0)));
  const safeBonus = Math.max(
    0,
    Math.min(MAX_HERO_BONUS_POINTS, Math.floor(bonusPoints || 0))
  );
  return (
    safeMatches * MASTERY_POINTS_PER_MATCH +
    safeKills * MASTERY_POINTS_PER_KILL +
    safeBonus
  );
}

export function getMasteryTierForPoints(points: number): {
  tier: MasteryTierSpec;
  nextTier: MasteryTierSpec | null;
} {
  const safePts = Math.max(0, Math.floor(points || 0));
  let current = MASTERY_TIERS[0];
  let next: MasteryTierSpec | null = MASTERY_TIERS[1] ?? null;

  for (let i = 0; i < MASTERY_TIERS.length; i += 1) {
    if (safePts >= MASTERY_TIERS[i].minPoints) {
      current = MASTERY_TIERS[i];
      next = MASTERY_TIERS[i + 1] ?? null;
    }
  }
  return { tier: current, nextTier: next };
}

export function sanitizeHeroMasteryStats(
  heroId: HeroId,
  raw?: Partial<HeroMasteryStats> | null
): HeroMasteryStats {
  const matches = Math.max(
    0,
    Math.min(MAX_HERO_MATCHES, Math.floor(Number(raw?.matches ?? 0) || 0))
  );
  const kills = Math.max(
    0,
    Math.min(MAX_HERO_KILLS, Math.floor(Number(raw?.kills ?? 0) || 0))
  );
  const bonusPoints = Math.max(
    0,
    Math.min(MAX_HERO_BONUS_POINTS, Math.floor(Number(raw?.bonusPoints ?? 0) || 0))
  );
  const equippedFrame = isValidMasteryFramePreference(raw?.equippedFrame)
    ? raw.equippedFrame
    : 'auto';
  return bonusPoints > 0
    ? { heroId, matches, kills, bonusPoints, equippedFrame }
    : { heroId, matches, kills, equippedFrame };
}

export function computeHeroMasteryProgress(
  heroId: HeroId,
  rawStats?: Partial<HeroMasteryStats> | null
): HeroMasteryProgress {
  const clean = sanitizeHeroMasteryStats(heroId, rawStats);
  const bonusPoints = clean.bonusPoints ?? 0;
  const points = computeHeroMasteryPoints(clean.matches, clean.kills, bonusPoints);
  const { tier, nextTier } = getMasteryTierForPoints(points);

  const unlockedFrames = MASTERY_TIERS.filter((t) => points >= t.minPoints).map(
    (t) => t.frameId
  );

  let activeFrameId: MasteryFrameId = tier.frameId;
  if (
    clean.equippedFrame !== 'auto' &&
    unlockedFrames.includes(clean.equippedFrame)
  ) {
    activeFrameId = clean.equippedFrame;
  }

  const pointsIntoTier = points - tier.minPoints;
  const pointsForNextTier = nextTier ? nextTier.minPoints - tier.minPoints : 0;
  const progressPct = nextTier
    ? Math.min(
        100,
        Math.max(0, Math.round((pointsIntoTier / Math.max(1, pointsForNextTier)) * 100))
      )
    : 100;

  return {
    heroId,
    matches: clean.matches,
    kills: clean.kills,
    bonusPoints,
    points,
    tier,
    nextTier,
    pointsIntoTier,
    pointsForNextTier,
    progressPct,
    unlockedFrames,
    activeFrameId,
    activeFrameSpec: getMasteryTierByFrameId(activeFrameId),
    equippedPreference: clean.equippedFrame,
  };
}

export function applyMatchToHeroMastery(
  map: HeroMasteryMap,
  heroId: HeroId,
  killsInMatch: number
): {
  nextMap: HeroMasteryMap;
  updatedStats: HeroMasteryStats;
  previousProgress: HeroMasteryProgress;
  nextProgress: HeroMasteryProgress;
  leveledUp: boolean;
  newlyUnlockedFrames: MasteryFrameId[];
} {
  const previousStats = sanitizeHeroMasteryStats(heroId, map[heroId]);
  const previousProgress = computeHeroMasteryProgress(heroId, previousStats);

  const clampedKills = Math.max(0, Math.min(40, Math.floor(killsInMatch || 0)));
  const updatedStats: HeroMasteryStats = {
    heroId,
    matches: Math.min(MAX_HERO_MATCHES, previousStats.matches + 1),
    kills: Math.min(MAX_HERO_KILLS, previousStats.kills + clampedKills),
    ...(previousStats.bonusPoints ? { bonusPoints: previousStats.bonusPoints } : {}),
    equippedFrame: previousStats.equippedFrame,
  };

  const nextMap: HeroMasteryMap = {
    ...map,
    [heroId]: updatedStats,
  };

  const nextProgress = computeHeroMasteryProgress(heroId, updatedStats);
  const leveledUp = nextProgress.tier.level > previousProgress.tier.level;
  const newlyUnlockedFrames = nextProgress.unlockedFrames.filter(
    (f) => !previousProgress.unlockedFrames.includes(f)
  );

  return {
    nextMap,
    updatedStats,
    previousProgress,
    nextProgress,
    leveledUp,
    newlyUnlockedFrames,
  };
}

export function equipHeroMasteryFrame(
  map: HeroMasteryMap,
  heroId: HeroId,
  framePreference: MasteryFrameId | 'auto'
): {
  nextMap: HeroMasteryMap;
  equipped: boolean;
  updatedStats: HeroMasteryStats;
} {
  const currentStats = sanitizeHeroMasteryStats(heroId, map[heroId]);
  const progress = computeHeroMasteryProgress(heroId, currentStats);

  if (
    framePreference !== 'auto' &&
    !progress.unlockedFrames.includes(framePreference)
  ) {
    return {
      nextMap: map,
      equipped: false,
      updatedStats: currentStats,
    };
  }

  const updatedStats: HeroMasteryStats = {
    ...currentStats,
    equippedFrame: framePreference,
  };
  return {
    nextMap: {
      ...map,
      [heroId]: updatedStats,
    },
    equipped: true,
    updatedStats,
  };
}

export interface MasteryFrameUpgradeEntry {
  heroId: HeroId;
  previousLevel: number;
  newLevel: number;
  previousFrameId: MasteryFrameId;
  newFrameId: MasteryFrameId;
  targetMinPoints: number;
  addedBonusPoints: number;
  nextBonusPoints: number;
  costGems: number;
}

export interface EvolveMasteryFrameResult {
  evolved: boolean;
  reason?: 'max_level' | 'insufficient_gems';
  nextMap: HeroMasteryMap;
  nextGems: number;
  upgrade: MasteryFrameUpgradeEntry | null;
}

export function evolveHeroMasteryFrameOnce(
  map: HeroMasteryMap,
  heroId: HeroId,
  availableGems: number
): EvolveMasteryFrameResult {
  const gems = Math.max(0, Math.floor(availableGems || 0));
  const cleanMap = sanitizeHeroMasteryMap(map);
  const currentStats = sanitizeHeroMasteryStats(heroId, cleanMap[heroId]);
  const progress = computeHeroMasteryProgress(heroId, currentStats);

  if (!progress.nextTier) {
    return {
      evolved: false,
      reason: 'max_level',
      nextMap: cleanMap,
      nextGems: gems,
      upgrade: null,
    };
  }

  const cost = getNextFrameUpgradeCostGems(progress.tier.level);
  if (cost === null) {
    return {
      evolved: false,
      reason: 'max_level',
      nextMap: cleanMap,
      nextGems: gems,
      upgrade: null,
    };
  }

  if (gems < cost) {
    return {
      evolved: false,
      reason: 'insufficient_gems',
      nextMap: cleanMap,
      nextGems: gems,
      upgrade: null,
    };
  }

  const addedBonusPoints = Math.max(0, progress.nextTier.minPoints - progress.points);
  const nextBonusPoints = Math.min(
    MAX_HERO_BONUS_POINTS,
    (currentStats.bonusPoints ?? 0) + addedBonusPoints
  );

  const updatedStats: HeroMasteryStats = {
    heroId,
    matches: currentStats.matches,
    kills: currentStats.kills,
    bonusPoints: nextBonusPoints,
    equippedFrame: 'auto',
  };

  return {
    evolved: true,
    nextMap: {
      ...cleanMap,
      [heroId]: updatedStats,
    },
    nextGems: gems - cost,
    upgrade: {
      heroId,
      previousLevel: progress.tier.level,
      newLevel: progress.nextTier.level,
      previousFrameId: progress.tier.frameId,
      newFrameId: progress.nextTier.frameId,
      targetMinPoints: progress.nextTier.minPoints,
      addedBonusPoints,
      nextBonusPoints,
      costGems: cost,
    },
  };
}

export interface BatchFrameEvolveResult {
  evolvedCount: number;
  totalCostGems: number;
  nextMap: HeroMasteryMap;
  nextGems: number;
  upgrades: MasteryFrameUpgradeEntry[];
}

export function evolveAccountMasteryFrames(
  map: HeroMasteryMap,
  availableGems: number,
  priorityHeroId?: HeroId
): BatchFrameEvolveResult {
  let workingMap = sanitizeHeroMasteryMap(map);
  let remainingGems = Math.max(0, Math.floor(availableGems || 0));
  const upgrades: MasteryFrameUpgradeEntry[] = [];
  let totalCostGems = 0;

  const baseOrder = Object.keys(HEROES) as HeroId[];
  const orderedHeroes =
    priorityHeroId && baseOrder.includes(priorityHeroId)
      ? [priorityHeroId, ...baseOrder.filter((id) => id !== priorityHeroId)]
      : baseOrder;

  for (
    let targetFromLevel = 1;
    targetFromLevel < MASTERY_TIERS.length;
    targetFromLevel += 1
  ) {
    const cost = getNextFrameUpgradeCostGems(targetFromLevel);
    if (cost === null || remainingGems < cost) break;

    for (const heroId of orderedHeroes) {
      if (remainingGems < cost) break;
      const prog = computeHeroMasteryProgress(heroId, workingMap[heroId]);
      if (prog.tier.level !== targetFromLevel) continue;
      const res = evolveHeroMasteryFrameOnce(workingMap, heroId, remainingGems);
      if (res.evolved && res.upgrade) {
        workingMap = res.nextMap;
        remainingGems = res.nextGems;
        totalCostGems += res.upgrade.costGems;
        upgrades.push(res.upgrade);
      }
    }
  }

  return {
    evolvedCount: upgrades.length,
    totalCostGems,
    nextMap: workingMap,
    nextGems: remainingGems,
    upgrades,
  };
}

export interface AccountMasterySummary {
  totalHeroes: number;
  evolvedFramesCount: number;
  maxedFramesCount: number;
  eligibleNowCount: number;
  cheapestNextCostGems: number | null;
}

export function computeAccountMasterySummary(
  map: HeroMasteryMap,
  availableGems: number
): AccountMasterySummary {
  const gems = Math.max(0, Math.floor(availableGems || 0));
  const heroIds = Object.keys(HEROES) as HeroId[];
  let evolvedFramesCount = 0;
  let maxedFramesCount = 0;
  let eligibleNowCount = 0;
  let cheapestNextCostGems: number | null = null;

  for (const heroId of heroIds) {
    const prog = computeHeroMasteryProgress(heroId, map[heroId]);
    if (prog.tier.level > 1) evolvedFramesCount += 1;
    if (prog.tier.level >= MASTERY_TIERS.length) maxedFramesCount += 1;
    const cost = getNextFrameUpgradeCostGems(prog.tier.level);
    if (cost !== null) {
      if (cheapestNextCostGems === null || cost < cheapestNextCostGems) {
        cheapestNextCostGems = cost;
      }
      if (gems >= cost) eligibleNowCount += 1;
    }
  }

  return {
    totalHeroes: heroIds.length,
    evolvedFramesCount,
    maxedFramesCount,
    eligibleNowCount,
    cheapestNextCostGems,
  };
}

export function sanitizeHeroMasteryMap(raw: unknown): HeroMasteryMap {
  if (!raw || typeof raw !== 'object') return {};
  const result: HeroMasteryMap = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidHeroId(key)) continue;
    if (!val || typeof val !== 'object') continue;
    result[key] = sanitizeHeroMasteryStats(key, val as Partial<HeroMasteryStats>);
  }
  return result;
}

export function mergeHeroMasteryMaps(
  localMap: HeroMasteryMap,
  remoteMap: HeroMasteryMap
): HeroMasteryMap {
  const merged: HeroMasteryMap = { ...sanitizeHeroMasteryMap(localMap) };
  const cleanRemote = sanitizeHeroMasteryMap(remoteMap);

  for (const [heroKey, remoteStats] of Object.entries(cleanRemote)) {
    const heroId = heroKey as HeroId;
    if (!remoteStats) continue;
    const localStats = merged[heroId];
    if (!localStats) {
      merged[heroId] = remoteStats;
      continue;
    }
    const mergedMatches = Math.max(localStats.matches, remoteStats.matches);
    const mergedKills = Math.max(localStats.kills, remoteStats.kills);
    const mergedBonusPoints = Math.max(
      localStats.bonusPoints ?? 0,
      remoteStats.bonusPoints ?? 0
    );
    const equippedFrame =
      remoteStats.equippedFrame !== 'auto'
        ? remoteStats.equippedFrame
        : localStats.equippedFrame;
    merged[heroId] = sanitizeHeroMasteryStats(heroId, {
      heroId,
      matches: mergedMatches,
      kills: mergedKills,
      bonusPoints: mergedBonusPoints,
      equippedFrame,
    });
  }
  return merged;
}
