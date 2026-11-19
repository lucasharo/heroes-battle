import { HEROES } from './heroes';
import { GameMode, HeroId, HeroSkinId } from './types';

export const BATTLE_PASS_SEASON_ID = 'season1' as const;
export const BATTLE_PASS_SEASON_NAME = 'Temporada 1: Ascensão Cibernética';
export const BATTLE_PASS_ELITE_COST_GEMS = 250;
export const BATTLE_PASS_MAX_TIER = 12;
export const BATTLE_PASS_MAX_SEASON_XP = 2750;

export type BattlePassTrack = 'free' | 'elite';
export type BattlePassSkinId = Extract<HeroSkinId, 'vanguard' | 'infernal' | 'celestial'>;

export interface BattlePassGemReward {
  kind: 'gems';
  amount: number;
  label: string;
}

export interface BattlePassSkinReward {
  kind: 'skin';
  skinId: BattlePassSkinId;
  heroIds: readonly HeroId[] | 'all';
  label: string;
  description: string;
}

export type BattlePassReward = BattlePassGemReward | BattlePassSkinReward;

export interface BattlePassTierDefinition {
  tier: number;
  xpRequired: number;
  freeReward: BattlePassReward;
  eliteReward: BattlePassReward;
}

export interface BattlePassState {
  seasonId: typeof BATTLE_PASS_SEASON_ID;
  seasonXp: number;
  premiumUnlocked: boolean;
  claimedFreeTiers: number[];
  claimedEliteTiers: number[];
  unlockedCosmetics: string[];
}

export interface BattlePassSummary {
  seasonId: typeof BATTLE_PASS_SEASON_ID;
  seasonName: string;
  seasonXp: number;
  currentTier: number;
  maxTier: number;
  currentTierXpFloor: number;
  nextTierXpTarget: number | null;
  xpIntoCurrentTier: number;
  xpSpanForCurrentTier: number;
  progressPct: number;
  premiumUnlocked: boolean;
  claimableCount: number;
  claimableFreeTiers: number[];
  claimableEliteTiers: number[];
  unlockedSkinsCount: number;
}

export const BATTLE_PASS_TIERS: readonly BattlePassTierDefinition[] = [
  {
    tier: 1,
    xpRequired: 100,
    freeReward: {
      kind: 'gems',
      amount: 40,
      label: '+40 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 60,
      label: '+60 Gemas',
    },
  },
  {
    tier: 2,
    xpRequired: 240,
    freeReward: {
      kind: 'skin',
      skinId: 'vanguard',
      heroIds: ['steelshot', 'raidon', 'nina'],
      label: 'Skin Vanguarda Cibernética',
      description: 'Desbloqueia para Steelshot, Raidon e Nina.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'vanguard',
      heroIds: ['phoenix', 'valkyria', 'meiro', 'velvet'],
      label: 'Vanguarda · Esquadrão Alfa',
      description: 'Desbloqueia para Phoenix, Valkyria, Meiro e Velvet.',
    },
  },
  {
    tier: 3,
    xpRequired: 400,
    freeReward: {
      kind: 'gems',
      amount: 50,
      label: '+50 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 80,
      label: '+80 Gemas',
    },
  },
  {
    tier: 4,
    xpRequired: 580,
    freeReward: {
      kind: 'skin',
      skinId: 'infernal',
      heroIds: ['phoenix', 'eldragon', 'baston'],
      label: 'Skin Forja Infernal',
      description: 'Desbloqueia para Phoenix, El Dragón e Baston.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'vanguard',
      heroIds: 'all',
      label: 'Vanguarda · Todos os Heróis',
      description: 'Desbloqueia a skin Vanguarda Cibernética para todos os 21 heróis.',
    },
  },
  {
    tier: 5,
    xpRequired: 780,
    freeReward: {
      kind: 'gems',
      amount: 60,
      label: '+60 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 100,
      label: '+100 Gemas',
    },
  },
  {
    tier: 6,
    xpRequired: 1000,
    freeReward: {
      kind: 'skin',
      skinId: 'vanguard',
      heroIds: ['kong', 'valkyria', 'frost', 'kronos'],
      label: 'Skin Vanguarda Cibernética',
      description: 'Desbloqueia para Kong, Valkyria, Frost e Kronos.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'infernal',
      heroIds: ['steelshot', 'raidon', 'meiro', 'velvet'],
      label: 'Forja Infernal · Assalto',
      description: 'Desbloqueia para Steelshot, Raidon, Meiro e Velvet.',
    },
  },
  {
    tier: 7,
    xpRequired: 1240,
    freeReward: {
      kind: 'gems',
      amount: 75,
      label: '+75 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 120,
      label: '+120 Gemas',
    },
  },
  {
    tier: 8,
    xpRequired: 1500,
    freeReward: {
      kind: 'skin',
      skinId: 'infernal',
      heroIds: ['cluster', 'drake', 'knox', 'kairo'],
      label: 'Skin Forja Infernal',
      description: 'Desbloqueia para Cluster, Drake, Knox e Kairo.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'infernal',
      heroIds: 'all',
      label: 'Forja Infernal · Todos os Heróis',
      description: 'Desbloqueia a skin Forja Infernal para todos os 21 heróis.',
    },
  },
  {
    tier: 9,
    xpRequired: 1780,
    freeReward: {
      kind: 'gems',
      amount: 90,
      label: '+90 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 140,
      label: '+140 Gemas',
    },
  },
  {
    tier: 10,
    xpRequired: 2080,
    freeReward: {
      kind: 'skin',
      skinId: 'celestial',
      heroIds: ['valkyria', 'kronos', 'solara'],
      label: 'Skin Ápice Celestial',
      description: 'Desbloqueia para Valkyria, Kronos e Solara.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'celestial',
      heroIds: ['steelshot', 'phoenix', 'raidon', 'kong'],
      label: 'Ápice Celestial · Vanguarda',
      description: 'Desbloqueia para Steelshot, Phoenix, Raidon e Kong.',
    },
  },
  {
    tier: 11,
    xpRequired: 2400,
    freeReward: {
      kind: 'gems',
      amount: 110,
      label: '+110 Gemas',
    },
    eliteReward: {
      kind: 'gems',
      amount: 180,
      label: '+180 Gemas',
    },
  },
  {
    tier: 12,
    xpRequired: 2750,
    freeReward: {
      kind: 'skin',
      skinId: 'celestial',
      heroIds: ['titanx', 'veinka', 'ryder', 'boulder'],
      label: 'Skin Ápice Celestial',
      description: 'Desbloqueia para Titan-X, Veinka, Ryder e Boulder.',
    },
    eliteReward: {
      kind: 'skin',
      skinId: 'celestial',
      heroIds: 'all',
      label: 'Ápice Celestial · Todos os Heróis',
      description: 'Desbloqueia a skin lendária Ápice Celestial para todos os 21 heróis.',
    },
  },
] as const;

export function createDefaultBattlePassState(): BattlePassState {
  return {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp: 0,
    premiumUnlocked: false,
    claimedFreeTiers: [],
    claimedEliteTiers: [],
    unlockedCosmetics: [],
  };
}

export function isValidCosmeticToken(token: unknown): token is string {
  if (typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [heroScope, skinId] = parts;
  if (skinId !== 'vanguard' && skinId !== 'infernal' && skinId !== 'celestial') {
    return false;
  }
  return heroScope === 'all' || heroScope in HEROES;
}

export function rewardToCosmeticTokens(reward: BattlePassReward): string[] {
  if (reward.kind !== 'skin') return [];
  if (reward.heroIds === 'all') {
    return [`all:${reward.skinId}`];
  }
  return reward.heroIds.map((heroId) => `${heroId}:${reward.skinId}`);
}

function normalizeTierArray(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<number>();
  for (const item of raw) {
    const n = Number(item);
    if (Number.isInteger(n) && n >= 1 && n <= BATTLE_PASS_MAX_TIER) {
      valid.add(n);
    }
  }
  return Array.from(valid).sort((a, b) => a - b);
}

function normalizeCosmeticsArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>();
  for (const item of raw) {
    if (isValidCosmeticToken(item)) {
      valid.add(item);
    }
  }
  return Array.from(valid).slice(0, 40);
}

export function deriveExpectedCosmeticsFromClaims(
  claimedFreeTiers: readonly number[],
  claimedEliteTiers: readonly number[],
  premiumUnlocked: boolean
): string[] {
  const set = new Set<string>();
  for (const tierNum of claimedFreeTiers) {
    const def = BATTLE_PASS_TIERS.find((t) => t.tier === tierNum);
    if (!def) continue;
    for (const token of rewardToCosmeticTokens(def.freeReward)) {
      set.add(token);
    }
  }
  if (premiumUnlocked) {
    for (const tierNum of claimedEliteTiers) {
      const def = BATTLE_PASS_TIERS.find((t) => t.tier === tierNum);
      if (!def) continue;
      for (const token of rewardToCosmeticTokens(def.eliteReward)) {
        set.add(token);
      }
    }
  }
  return Array.from(set).slice(0, 40);
}

export function sanitizeBattlePassState(raw: unknown): BattlePassState {
  if (!raw || typeof raw !== 'object') {
    return createDefaultBattlePassState();
  }
  const obj = raw as Record<string, unknown>;
  const seasonXp = Math.min(
    100000,
    Math.max(0, Math.floor(Number(obj.seasonXp ?? 0) || 0))
  );
  const premiumUnlocked = Boolean(obj.premiumUnlocked);
  const maxUnlockedTier = getBattlePassTierForXp(seasonXp);

  const claimedFreeTiers = normalizeTierArray(obj.claimedFreeTiers).filter(
    (t) => t <= maxUnlockedTier
  );
  const claimedEliteTiers = premiumUnlocked
    ? normalizeTierArray(obj.claimedEliteTiers).filter((t) => t <= maxUnlockedTier)
    : [];

  const unlockedSet = new Set<string>([
    ...normalizeCosmeticsArray(obj.unlockedCosmetics),
    ...deriveExpectedCosmeticsFromClaims(
      claimedFreeTiers,
      claimedEliteTiers,
      premiumUnlocked
    ),
  ]);

  return {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp,
    premiumUnlocked,
    claimedFreeTiers,
    claimedEliteTiers,
    unlockedCosmetics: Array.from(unlockedSet).slice(0, 40),
  };
}

export function mergeBattlePassStates(
  local: BattlePassState,
  remote: BattlePassState
): BattlePassState {
  const cleanLocal = sanitizeBattlePassState(local);
  const cleanRemote = sanitizeBattlePassState(remote);
  const seasonXp = Math.max(cleanLocal.seasonXp, cleanRemote.seasonXp);
  const premiumUnlocked = cleanLocal.premiumUnlocked || cleanRemote.premiumUnlocked;
  const maxUnlockedTier = getBattlePassTierForXp(seasonXp);

  const claimedFreeTiers = Array.from(
    new Set([...cleanLocal.claimedFreeTiers, ...cleanRemote.claimedFreeTiers])
  )
    .filter((t) => t <= maxUnlockedTier)
    .sort((a, b) => a - b);

  const claimedEliteTiers = premiumUnlocked
    ? Array.from(
        new Set([
          ...cleanLocal.claimedEliteTiers,
          ...cleanRemote.claimedEliteTiers,
        ])
      )
        .filter((t) => t <= maxUnlockedTier)
        .sort((a, b) => a - b)
    : [];

  const unlockedCosmetics = Array.from(
    new Set([
      ...cleanLocal.unlockedCosmetics,
      ...cleanRemote.unlockedCosmetics,
      ...deriveExpectedCosmeticsFromClaims(
        claimedFreeTiers,
        claimedEliteTiers,
        premiumUnlocked
      ),
    ])
  ).slice(0, 40);

  return {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp,
    premiumUnlocked,
    claimedFreeTiers,
    claimedEliteTiers,
    unlockedCosmetics,
  };
}

export function getBattlePassTierForXp(seasonXp: number): number {
  const safeXp = Math.max(0, Math.floor(seasonXp));
  let tier = 0;
  for (const def of BATTLE_PASS_TIERS) {
    if (safeXp >= def.xpRequired) {
      tier = def.tier;
    }
  }
  return tier;
}

export function computeBattlePassSummary(state: BattlePassState): BattlePassSummary {
  const safeState = sanitizeBattlePassState(state);
  const currentTier = getBattlePassTierForXp(safeState.seasonXp);
  const currentTierDef =
    currentTier > 0 ? BATTLE_PASS_TIERS[currentTier - 1] : null;
  const nextTierDef =
    currentTier < BATTLE_PASS_MAX_TIER ? BATTLE_PASS_TIERS[currentTier] : null;

  const currentTierXpFloor = currentTierDef ? currentTierDef.xpRequired : 0;
  const nextTierXpTarget = nextTierDef ? nextTierDef.xpRequired : null;
  const xpIntoCurrentTier = Math.max(0, safeState.seasonXp - currentTierXpFloor);
  const xpSpanForCurrentTier = nextTierXpTarget
    ? Math.max(1, nextTierXpTarget - currentTierXpFloor)
    : 1;
  const progressPct = nextTierXpTarget
    ? Math.min(100, Math.round((xpIntoCurrentTier / xpSpanForCurrentTier) * 100))
    : 100;

  const claimableFreeTiers: number[] = [];
  const claimableEliteTiers: number[] = [];

  for (const def of BATTLE_PASS_TIERS) {
    if (def.tier > currentTier) break;
    if (!safeState.claimedFreeTiers.includes(def.tier)) {
      claimableFreeTiers.push(def.tier);
    }
    if (safeState.premiumUnlocked && !safeState.claimedEliteTiers.includes(def.tier)) {
      claimableEliteTiers.push(def.tier);
    }
  }

  return {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonName: BATTLE_PASS_SEASON_NAME,
    seasonXp: safeState.seasonXp,
    currentTier,
    maxTier: BATTLE_PASS_MAX_TIER,
    currentTierXpFloor,
    nextTierXpTarget,
    xpIntoCurrentTier,
    xpSpanForCurrentTier,
    progressPct,
    premiumUnlocked: safeState.premiumUnlocked,
    claimableCount: claimableFreeTiers.length + claimableEliteTiers.length,
    claimableFreeTiers,
    claimableEliteTiers,
    unlockedSkinsCount: safeState.unlockedCosmetics.length,
  };
}

export function computeMatchBattlePassXp(summary: {
  victory: boolean;
  kills: number;
  placement: number;
  mode: GameMode;
}): number {
  const baseXp = summary.victory ? 120 : 65;
  const killBonus = Math.min(12, Math.max(0, Math.floor(summary.kills))) * 15;
  let placementBonus = 0;
  if (summary.mode === 'royale') {
    if (summary.placement === 1) placementBonus = 45;
    else if (summary.placement <= 3) placementBonus = 25;
    else if (summary.placement <= 5) placementBonus = 10;
  } else if (summary.victory) {
    placementBonus = 25;
  }
  return Math.min(400, baseXp + killBonus + placementBonus);
}

export function applyMatchToBattlePass(
  state: BattlePassState,
  summary: {
    victory: boolean;
    kills: number;
    placement: number;
    mode: GameMode;
  }
): {
  state: BattlePassState;
  xpGained: number;
  previousTier: number;
  newTier: number;
  tierUp: boolean;
} {
  const clean = sanitizeBattlePassState(state);
  const xpGained = computeMatchBattlePassXp(summary);
  const previousTier = getBattlePassTierForXp(clean.seasonXp);
  const nextXp = Math.min(100000, clean.seasonXp + xpGained);
  const newTier = getBattlePassTierForXp(nextXp);

  return {
    state: {
      ...clean,
      seasonXp: nextXp,
    },
    xpGained,
    previousTier,
    newTier,
    tierUp: newTier > previousTier,
  };
}

export function applyQuestBonusToBattlePass(
  state: BattlePassState,
  bonusXp: number = 40
): { state: BattlePassState; xpGained: number; tierUp: boolean } {
  const clean = sanitizeBattlePassState(state);
  const safeBonus = Math.min(200, Math.max(0, Math.floor(bonusXp)));
  const prevTier = getBattlePassTierForXp(clean.seasonXp);
  const nextXp = Math.min(100000, clean.seasonXp + safeBonus);
  const nextTier = getBattlePassTierForXp(nextXp);
  return {
    state: {
      ...clean,
      seasonXp: nextXp,
    },
    xpGained: safeBonus,
    tierUp: nextTier > prevTier,
  };
}

export function claimBattlePassReward(
  state: BattlePassState,
  tier: number,
  track: BattlePassTrack
): {
  claimed: boolean;
  state: BattlePassState;
  gemsGained: number;
  newlyUnlockedCosmetics: string[];
  reward: BattlePassReward | null;
} {
  const clean = sanitizeBattlePassState(state);
  const def = BATTLE_PASS_TIERS.find((t) => t.tier === tier);
  if (!def) {
    return {
      claimed: false,
      state: clean,
      gemsGained: 0,
      newlyUnlockedCosmetics: [],
      reward: null,
    };
  }

  const currentTier = getBattlePassTierForXp(clean.seasonXp);
  if (tier > currentTier) {
    return {
      claimed: false,
      state: clean,
      gemsGained: 0,
      newlyUnlockedCosmetics: [],
      reward: null,
    };
  }

  if (track === 'elite' && !clean.premiumUnlocked) {
    return {
      claimed: false,
      state: clean,
      gemsGained: 0,
      newlyUnlockedCosmetics: [],
      reward: null,
    };
  }

  const alreadyClaimed =
    track === 'free'
      ? clean.claimedFreeTiers.includes(tier)
      : clean.claimedEliteTiers.includes(tier);

  if (alreadyClaimed) {
    return {
      claimed: false,
      state: clean,
      gemsGained: 0,
      newlyUnlockedCosmetics: [],
      reward: null,
    };
  }

  const reward = track === 'free' ? def.freeReward : def.eliteReward;
  const tokens = rewardToCosmeticTokens(reward);
  const existingSet = new Set(clean.unlockedCosmetics);
  const newlyUnlockedCosmetics = tokens.filter((tk) => !existingSet.has(tk));
  for (const tk of tokens) {
    existingSet.add(tk);
  }

  const nextFree =
    track === 'free'
      ? [...clean.claimedFreeTiers, tier].sort((a, b) => a - b)
      : clean.claimedFreeTiers;
  const nextElite =
    track === 'elite'
      ? [...clean.claimedEliteTiers, tier].sort((a, b) => a - b)
      : clean.claimedEliteTiers;

  return {
    claimed: true,
    state: {
      ...clean,
      claimedFreeTiers: nextFree,
      claimedEliteTiers: nextElite,
      unlockedCosmetics: Array.from(existingSet).slice(0, 40),
    },
    gemsGained: reward.kind === 'gems' ? reward.amount : 0,
    newlyUnlockedCosmetics,
    reward,
  };
}

export function claimAllAvailableBattlePassRewards(
  state: BattlePassState
): {
  claimedCount: number;
  state: BattlePassState;
  gemsGained: number;
  newlyUnlockedCosmetics: string[];
} {
  let curr = sanitizeBattlePassState(state);
  const summary = computeBattlePassSummary(curr);
  let claimedCount = 0;
  let gemsGained = 0;
  const newTokens = new Set<string>();

  for (const tier of summary.claimableFreeTiers) {
    const res = claimBattlePassReward(curr, tier, 'free');
    if (res.claimed) {
      curr = res.state;
      claimedCount++;
      gemsGained += res.gemsGained;
      for (const tk of res.newlyUnlockedCosmetics) newTokens.add(tk);
    }
  }

  for (const tier of summary.claimableEliteTiers) {
    const res = claimBattlePassReward(curr, tier, 'elite');
    if (res.claimed) {
      curr = res.state;
      claimedCount++;
      gemsGained += res.gemsGained;
      for (const tk of res.newlyUnlockedCosmetics) newTokens.add(tk);
    }
  }

  return {
    claimedCount,
    state: curr,
    gemsGained,
    newlyUnlockedCosmetics: Array.from(newTokens),
  };
}

export function unlockEliteBattlePass(
  state: BattlePassState,
  currentGems: number
): {
  unlocked: boolean;
  state: BattlePassState;
  remainingGems: number;
  gemsSpent: number;
} {
  const clean = sanitizeBattlePassState(state);
  const safeGems = Math.max(0, Math.floor(currentGems));
  if (clean.premiumUnlocked || safeGems < BATTLE_PASS_ELITE_COST_GEMS) {
    return {
      unlocked: false,
      state: clean,
      remainingGems: safeGems,
      gemsSpent: 0,
    };
  }

  return {
    unlocked: true,
    state: {
      ...clean,
      premiumUnlocked: true,
    },
    remainingGems: safeGems - BATTLE_PASS_ELITE_COST_GEMS,
    gemsSpent: BATTLE_PASS_ELITE_COST_GEMS,
  };
}
