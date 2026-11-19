import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLE_PASS_ELITE_COST_GEMS,
  BATTLE_PASS_MAX_TIER,
  BATTLE_PASS_SEASON_ID,
  BATTLE_PASS_TIERS,
  applyMatchToBattlePass,
  applyQuestBonusToBattlePass,
  claimAllAvailableBattlePassRewards,
  claimBattlePassReward,
  computeBattlePassSummary,
  computeMatchBattlePassXp,
  createDefaultBattlePassState,
  getBattlePassTierForXp,
  mergeBattlePassStates,
  sanitizeBattlePassState,
  unlockEliteBattlePass,
} from './battlePass';

test('Season 1 Battle Pass defines 12 strictly ascending XP tiers', () => {
  assert.equal(BATTLE_PASS_TIERS.length, BATTLE_PASS_MAX_TIER);
  let prevXp = 0;
  for (let i = 0; i < BATTLE_PASS_TIERS.length; i++) {
    const def = BATTLE_PASS_TIERS[i];
    assert.equal(def.tier, i + 1);
    assert.ok(def.xpRequired > prevXp);
    prevXp = def.xpRequired;
  }
});

test('match XP rewards performance cleanly within security bounds', () => {
  const lossXp = computeMatchBattlePassXp({
    victory: false,
    kills: 0,
    placement: 8,
    mode: 'royale',
  });
  const winXp = computeMatchBattlePassXp({
    victory: true,
    kills: 20,
    placement: 1,
    mode: 'royale',
  });
  assert.equal(lossXp, 65);
  assert.ok(winXp > lossXp);
  assert.ok(winXp <= 400);
});

test('applying matches unlocks tiers and allows claiming Free rewards + exclusive skins', () => {
  let state = createDefaultBattlePassState();
  assert.equal(getBattlePassTierForXp(state.seasonXp), 0);

  // Two strong wins push XP past Tier 2 (240 XP)
  const m1 = applyMatchToBattlePass(state, {
    victory: true,
    kills: 6,
    placement: 1,
    mode: 'royale',
  });
  assert.ok(m1.xpGained >= 240);
  assert.equal(m1.previousTier, 0);
  assert.ok(m1.newTier >= 2);
  assert.equal(m1.tierUp, true);
  state = m1.state;

  // Claim Tier 1 Free (+40 Gems)
  const claimT1 = claimBattlePassReward(state, 1, 'free');
  assert.equal(claimT1.claimed, true);
  assert.equal(claimT1.gemsGained, 40);
  state = claimT1.state;

  // Duplicate claim is rejected
  const dupClaim = claimBattlePassReward(state, 1, 'free');
  assert.equal(dupClaim.claimed, false);

  // Claim Tier 2 Free (Vanguard skin for steelshot, raidon, nina)
  const claimT2 = claimBattlePassReward(state, 2, 'free');
  assert.equal(claimT2.claimed, true);
  assert.equal(claimT2.gemsGained, 0);
  assert.deepEqual(claimT2.newlyUnlockedCosmetics, [
    'steelshot:vanguard',
    'raidon:vanguard',
    'nina:vanguard',
  ]);
  state = claimT2.state;

  // Elite track remains locked until purchased
  const lockedElite = claimBattlePassReward(state, 1, 'elite');
  assert.equal(lockedElite.claimed, false);
});

test('unlocking Elite Battle Pass deducts gems and enables claiming all unlocked Elite tiers', () => {
  let state = createDefaultBattlePassState();
  state.seasonXp = 600; // Reaches Tier 4

  const failUnlock = unlockEliteBattlePass(state, BATTLE_PASS_ELITE_COST_GEMS - 10);
  assert.equal(failUnlock.unlocked, false);
  assert.equal(failUnlock.gemsSpent, 0);

  const okUnlock = unlockEliteBattlePass(state, 400);
  assert.equal(okUnlock.unlocked, true);
  assert.equal(okUnlock.gemsSpent, BATTLE_PASS_ELITE_COST_GEMS);
  assert.equal(okUnlock.remainingGems, 150);
  state = okUnlock.state;

  const summary = computeBattlePassSummary(state);
  assert.equal(summary.currentTier, 4);
  assert.equal(summary.claimableFreeTiers.length, 4);
  assert.equal(summary.claimableEliteTiers.length, 4);
  assert.equal(summary.claimableCount, 8);

  const batchClaim = claimAllAvailableBattlePassRewards(state);
  assert.equal(batchClaim.claimedCount, 8);
  assert.equal(batchClaim.gemsGained, 40 + 50 + 60 + 80);
  assert.ok(batchClaim.newlyUnlockedCosmetics.includes('all:vanguard'));
  assert.ok(batchClaim.newlyUnlockedCosmetics.includes('phoenix:infernal'));

  const postSummary = computeBattlePassSummary(batchClaim.state);
  assert.equal(postSummary.claimableCount, 0);
});

test('sanitizeBattlePassState and mergeBattlePassStates strip forged tiers/tokens cleanly', () => {
  const dirty = sanitizeBattlePassState({
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp: 150, // Only Tier 1
    premiumUnlocked: false,
    claimedFreeTiers: [1, 2, 99, 'bad'],
    claimedEliteTiers: [1, 4],
    unlockedCosmetics: ['invalid:skin', 'steelshot:vanguard', 'raidon:classic'],
  });

  assert.equal(dirty.seasonXp, 150);
  assert.deepEqual(dirty.claimedFreeTiers, [1]);
  assert.deepEqual(dirty.claimedEliteTiers, []);
  assert.deepEqual(dirty.unlockedCosmetics, ['steelshot:vanguard']);

  const merged = mergeBattlePassStates(dirty, {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp: 300, // Tier 2
    premiumUnlocked: true,
    claimedFreeTiers: [2],
    claimedEliteTiers: [1],
    unlockedCosmetics: [],
  });
  assert.equal(merged.seasonXp, 300);
  assert.equal(merged.premiumUnlocked, true);
  assert.deepEqual(merged.claimedFreeTiers, [1, 2]);
  assert.deepEqual(merged.claimedEliteTiers, [1]);
  assert.ok(merged.unlockedCosmetics.includes('steelshot:vanguard'));
  assert.ok(merged.unlockedCosmetics.includes('raidon:vanguard'));
});

test('applyQuestBonusToBattlePass increments XP safely', () => {
  const base = createDefaultBattlePassState();
  const res = applyQuestBonusToBattlePass(base, 110);
  assert.equal(res.xpGained, 110);
  assert.equal(res.state.seasonXp, 110);
  assert.equal(res.tierUp, true);
});
