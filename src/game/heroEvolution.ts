import { HERO_LIST, HEROES } from './heroes';
import { isValidHeroId } from './heroMastery';
import { HeroId } from './types';

export const MIN_HERO_EVOLUTION_LEVEL = 1;
export const MAX_HERO_EVOLUTION_LEVEL = 5;

export interface HeroEvolutionTierSpec {
  level: number;
  title: string;
  bonusPct: number;
  badgeColor: string;
  upgradeCostGems: number | null;
}

export const HERO_EVOLUTION_TIERS: readonly HeroEvolutionTierSpec[] = [
  {
    level: 1,
    title: 'Base',
    bonusPct: 0,
    badgeColor: '#94A3B8',
    upgradeCostGems: 25,
  },
  {
    level: 2,
    title: 'Veterano',
    bonusPct: 8,
    badgeColor: '#38BDF8',
    upgradeCostGems: 45,
  },
  {
    level: 3,
    title: 'Campeão',
    bonusPct: 16,
    badgeColor: '#A78BFA',
    upgradeCostGems: 75,
  },
  {
    level: 4,
    title: 'Ascendente',
    bonusPct: 25,
    badgeColor: '#F59E0B',
    upgradeCostGems: 110,
  },
  {
    level: 5,
    title: 'Supremo',
    bonusPct: 35,
    badgeColor: '#FB7185',
    upgradeCostGems: null,
  },
] as const;

export type HeroEvolutionMap = Partial<Record<HeroId, number>>;

export function clampHeroEvolutionLevel(level: unknown): number {
  const num = typeof level === 'number' && Number.isFinite(level) ? Math.floor(level) : 1;
  return Math.max(MIN_HERO_EVOLUTION_LEVEL, Math.min(MAX_HERO_EVOLUTION_LEVEL, num));
}

export function getHeroEvolutionLevel(
  map: HeroEvolutionMap | null | undefined,
  heroId: HeroId
): number {
  if (!map) return MIN_HERO_EVOLUTION_LEVEL;
  return clampHeroEvolutionLevel(map[heroId] ?? MIN_HERO_EVOLUTION_LEVEL);
}

export function getHeroEvolutionSpec(level: number): HeroEvolutionTierSpec {
  const clamped = clampHeroEvolutionLevel(level);
  return HERO_EVOLUTION_TIERS[clamped - 1];
}

export function getNextEvolutionCostGems(currentLevel: number): number | null {
  return getHeroEvolutionSpec(currentLevel).upgradeCostGems;
}

export interface EvolvedHeroStats {
  level: number;
  title: string;
  bonusPct: number;
  damageMultiplier: number;
  baseMaxHp: number;
  baseAttackDamage: number;
  maxHp: number;
  attackDamage: number;
  hpBonus: number;
  atkBonus: number;
}

export function computeEvolvedHeroStats(
  heroId: HeroId,
  level: number
): EvolvedHeroStats {
  const hero = HEROES[heroId];
  const spec = getHeroEvolutionSpec(level);
  const multiplier = 1 + spec.bonusPct / 100;
  const maxHp = Math.round(hero.maxHp * multiplier);
  const attackDamage = Math.round(hero.attackDamage * multiplier);
  return {
    level: spec.level,
    title: spec.title,
    bonusPct: spec.bonusPct,
    damageMultiplier: multiplier,
    baseMaxHp: hero.maxHp,
    baseAttackDamage: hero.attackDamage,
    maxHp,
    attackDamage,
    hpBonus: maxHp - hero.maxHp,
    atkBonus: attackDamage - hero.attackDamage,
  };
}

export function canEvolveHero(
  map: HeroEvolutionMap,
  heroId: HeroId,
  availableGems: number
): boolean {
  const current = getHeroEvolutionLevel(map, heroId);
  const cost = getNextEvolutionCostGems(current);
  if (cost === null) return false;
  return Math.max(0, Math.floor(availableGems || 0)) >= cost;
}

export interface HeroEvolutionUpgradeEntry {
  heroId: HeroId;
  previousLevel: number;
  newLevel: number;
  costGems: number;
}

export interface EvolveHeroResult {
  evolved: boolean;
  reason?: 'max_level' | 'insufficient_gems';
  nextMap: HeroEvolutionMap;
  nextGems: number;
  upgrade: HeroEvolutionUpgradeEntry | null;
}

export function evolveHeroOnce(
  map: HeroEvolutionMap,
  heroId: HeroId,
  availableGems: number
): EvolveHeroResult {
  const gems = Math.max(0, Math.floor(availableGems || 0));
  const current = getHeroEvolutionLevel(map, heroId);
  const cost = getNextEvolutionCostGems(current);

  if (cost === null || current >= MAX_HERO_EVOLUTION_LEVEL) {
    return {
      evolved: false,
      reason: 'max_level',
      nextMap: sanitizeHeroEvolutionMap(map),
      nextGems: gems,
      upgrade: null,
    };
  }

  if (gems < cost) {
    return {
      evolved: false,
      reason: 'insufficient_gems',
      nextMap: sanitizeHeroEvolutionMap(map),
      nextGems: gems,
      upgrade: null,
    };
  }

  const nextLevel = current + 1;
  const nextMap = sanitizeHeroEvolutionMap(map);
  nextMap[heroId] = nextLevel;

  return {
    evolved: true,
    nextMap,
    nextGems: gems - cost,
    upgrade: {
      heroId,
      previousLevel: current,
      newLevel: nextLevel,
      costGems: cost,
    },
  };
}

export interface BatchEvolveResult {
  evolvedCount: number;
  totalCostGems: number;
  nextMap: HeroEvolutionMap;
  nextGems: number;
  upgrades: HeroEvolutionUpgradeEntry[];
}

export function evolveAllEligibleHeroes(
  map: HeroEvolutionMap,
  availableGems: number,
  priorityHeroId?: HeroId
): BatchEvolveResult {
  let workingMap = sanitizeHeroEvolutionMap(map);
  let remainingGems = Math.max(0, Math.floor(availableGems || 0));
  const upgrades: HeroEvolutionUpgradeEntry[] = [];
  let totalCostGems = 0;

  const baseOrder = HERO_LIST.map((h) => h.id);
  const orderedHeroes =
    priorityHeroId && baseOrder.includes(priorityHeroId)
      ? [priorityHeroId, ...baseOrder.filter((id) => id !== priorityHeroId)]
      : baseOrder;

  // Breadth-first across roster tiers (all Nv.1 -> Nv.2, then Nv.2 -> Nv.3, etc.)
  for (
    let targetFromLevel = MIN_HERO_EVOLUTION_LEVEL;
    targetFromLevel < MAX_HERO_EVOLUTION_LEVEL;
    targetFromLevel += 1
  ) {
    const cost = getNextEvolutionCostGems(targetFromLevel);
    if (cost === null || remainingGems < cost) break;

    for (const heroId of orderedHeroes) {
      if (remainingGems < cost) break;
      const current = getHeroEvolutionLevel(workingMap, heroId);
      if (current !== targetFromLevel) continue;
      const res = evolveHeroOnce(workingMap, heroId, remainingGems);
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

export interface AccountEvolutionSummary {
  totalHeroes: number;
  evolvedHeroesCount: number;
  maxedHeroesCount: number;
  totalBonusLevels: number;
  maxBonusLevels: number;
  eligibleNowCount: number;
  cheapestNextCostGems: number | null;
}

export function computeAccountEvolutionSummary(
  map: HeroEvolutionMap,
  availableGems: number
): AccountEvolutionSummary {
  const gems = Math.max(0, Math.floor(availableGems || 0));
  let evolvedHeroesCount = 0;
  let maxedHeroesCount = 0;
  let totalBonusLevels = 0;
  let eligibleNowCount = 0;
  let cheapestNextCostGems: number | null = null;

  for (const hero of HERO_LIST) {
    const level = getHeroEvolutionLevel(map, hero.id);
    if (level > MIN_HERO_EVOLUTION_LEVEL) evolvedHeroesCount += 1;
    if (level >= MAX_HERO_EVOLUTION_LEVEL) maxedHeroesCount += 1;
    totalBonusLevels += level - MIN_HERO_EVOLUTION_LEVEL;
    const cost = getNextEvolutionCostGems(level);
    if (cost !== null) {
      if (cheapestNextCostGems === null || cost < cheapestNextCostGems) {
        cheapestNextCostGems = cost;
      }
      if (gems >= cost) eligibleNowCount += 1;
    }
  }

  return {
    totalHeroes: HERO_LIST.length,
    evolvedHeroesCount,
    maxedHeroesCount,
    totalBonusLevels,
    maxBonusLevels: HERO_LIST.length * (MAX_HERO_EVOLUTION_LEVEL - MIN_HERO_EVOLUTION_LEVEL),
    eligibleNowCount,
    cheapestNextCostGems,
  };
}

export function sanitizeHeroEvolutionMap(raw: unknown): HeroEvolutionMap {
  if (!raw || typeof raw !== 'object') return {};
  const result: HeroEvolutionMap = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidHeroId(key)) continue;
    const level = clampHeroEvolutionLevel(val);
    if (level > MIN_HERO_EVOLUTION_LEVEL) {
      result[key] = level;
    }
  }
  return result;
}

export function mergeHeroEvolutionMaps(
  localMap: HeroEvolutionMap,
  remoteMap: HeroEvolutionMap
): HeroEvolutionMap {
  const merged: HeroEvolutionMap = {};
  for (const hero of HERO_LIST) {
    const best = Math.max(
      getHeroEvolutionLevel(localMap, hero.id),
      getHeroEvolutionLevel(remoteMap, hero.id)
    );
    if (best > MIN_HERO_EVOLUTION_LEVEL) {
      merged[hero.id] = best;
    }
  }
  return merged;
}
