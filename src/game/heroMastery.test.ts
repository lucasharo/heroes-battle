import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTERY_POINTS_PER_KILL,
  MASTERY_POINTS_PER_MATCH,
  MASTERY_TIERS,
  applyMatchToHeroMastery,
  computeAccountMasterySummary,
  computeHeroMasteryPoints,
  computeHeroMasteryProgress,
  equipHeroMasteryFrame,
  evolveAccountMasteryFrames,
  evolveHeroMasteryFrameOnce,
  getNextFrameUpgradeCostGems,
  mergeHeroMasteryMaps,
  sanitizeHeroMasteryMap,
} from './heroMastery';

test('computeHeroMasteryPoints combines matches and kills accurately', () => {
  assert.equal(computeHeroMasteryPoints(0, 0), 0);
  assert.equal(
    computeHeroMasteryPoints(2, 4),
    2 * MASTERY_POINTS_PER_MATCH + 4 * MASTERY_POINTS_PER_KILL
  );
  assert.equal(computeHeroMasteryPoints(1, 2, 110), 180);
  assert.equal(computeHeroMasteryPoints(-3, -5, -10), 0);
});

test('computeHeroMasteryProgress unlocks tiers and frames at threshold points', () => {
  const recruta = computeHeroMasteryProgress('steelshot', {
    heroId: 'steelshot',
    matches: 0,
    kills: 0,
    equippedFrame: 'auto',
  });
  assert.equal(recruta.tier.level, 1);
  assert.equal(recruta.activeFrameId, 'recruta');
  assert.deepEqual(recruta.unlockedFrames, ['recruta']);
  assert.equal(recruta.nextTier?.frameId, 'bronze');

  // 1 match (40) + 2 kills (30) = 70 pts -> unlocks Bronze (60 pts)
  const bronze = computeHeroMasteryProgress('steelshot', {
    heroId: 'steelshot',
    matches: 1,
    kills: 2,
    equippedFrame: 'auto',
  });
  assert.equal(bronze.points, 70);
  assert.equal(bronze.tier.level, 2);
  assert.equal(bronze.activeFrameId, 'bronze');
  assert.deepEqual(bronze.unlockedFrames, ['recruta', 'bronze']);

  // High stats reach Lenda Suprema (level 6, 1250+ pts)
  const lenda = computeHeroMasteryProgress('kronos', {
    heroId: 'kronos',
    matches: 25,
    kills: 40,
    equippedFrame: 'auto',
  });
  assert.equal(lenda.tier.level, 6);
  assert.equal(lenda.activeFrameId, 'lenda');
  assert.equal(lenda.nextTier, null);
  assert.equal(lenda.progressPct, 100);
  assert.equal(lenda.unlockedFrames.length, MASTERY_TIERS.length);
});

test('applyMatchToHeroMastery increments matches and clamped kills and reports frame unlocks', () => {
  const first = applyMatchToHeroMastery({}, 'raidon', 3);
  assert.equal(first.updatedStats.matches, 1);
  assert.equal(first.updatedStats.kills, 3);
  // 1*40 + 3*15 = 85 pts -> unlocks Bronze immediately
  assert.equal(first.leveledUp, true);
  assert.deepEqual(first.newlyUnlockedFrames, ['bronze']);
  assert.equal(first.nextProgress.tier.level, 2);

  // Clamps out-of-range kills (>40) safely
  const second = applyMatchToHeroMastery(first.nextMap, 'raidon', 999);
  assert.equal(second.updatedStats.matches, 2);
  assert.equal(second.updatedStats.kills, 43);
  assert.equal(second.nextMap.raidon?.matches, 2);
});

test('equipHeroMasteryFrame allows unlocked frames and blocks locked ones', () => {
  const progressMap = applyMatchToHeroMastery({}, 'velvet', 10).nextMap; // 40 + 150 = 190 pts -> Prata (level 3)

  // Cannot equip Ouro (400 pts) while at 190 pts
  const lockedAttempt = equipHeroMasteryFrame(progressMap, 'velvet', 'ouro');
  assert.equal(lockedAttempt.equipped, false);
  assert.equal(
    computeHeroMasteryProgress('velvet', lockedAttempt.updatedStats).activeFrameId,
    'prata'
  );

  // Can equip Bronze (already unlocked)
  const bronzeEquip = equipHeroMasteryFrame(progressMap, 'velvet', 'bronze');
  assert.equal(bronzeEquip.equipped, true);
  assert.equal(
    computeHeroMasteryProgress('velvet', bronzeEquip.updatedStats).activeFrameId,
    'bronze'
  );

  // Can switch back to auto (highest unlocked -> prata)
  const autoEquip = equipHeroMasteryFrame(bronzeEquip.nextMap, 'velvet', 'auto');
  assert.equal(autoEquip.equipped, true);
  assert.equal(
    computeHeroMasteryProgress('velvet', autoEquip.updatedStats).activeFrameId,
    'prata'
  );
});

test('sanitizeHeroMasteryMap drops unknown hero keys and mergeHeroMasteryMaps keeps higher progress and bonusPoints', () => {
  const cleaned = sanitizeHeroMasteryMap({
    steelshot: {
      heroId: 'steelshot',
      matches: 4,
      kills: 11,
      bonusPoints: 250,
      equippedFrame: 'prata',
    },
    fake_hero_id: { heroId: 'fake_hero_id', matches: 99, kills: 99 },
  });
  assert.ok(cleaned.steelshot);
  assert.equal(cleaned.steelshot?.bonusPoints, 250);
  assert.equal('fake_hero_id' in cleaned, false);

  const merged = mergeHeroMasteryMaps(
    {
      steelshot: {
        heroId: 'steelshot',
        matches: 2,
        kills: 5,
        bonusPoints: 400,
        equippedFrame: 'auto',
      },
    },
    {
      steelshot: {
        heroId: 'steelshot',
        matches: 5,
        kills: 14,
        bonusPoints: 180,
        equippedFrame: 'bronze',
      },
      kong: { heroId: 'kong', matches: 1, kills: 2, equippedFrame: 'auto' },
    }
  );
  assert.equal(merged.steelshot?.matches, 5);
  assert.equal(merged.steelshot?.kills, 14);
  assert.equal(merged.steelshot?.bonusPoints, 400);
  assert.equal(merged.steelshot?.equippedFrame, 'bronze');
  assert.equal(merged.kong?.matches, 1);
});

test('evolveHeroMasteryFrameOnce upgrades hero frame tiers with Gems and enforces max level and budget', () => {
  assert.equal(getNextFrameUpgradeCostGems(1), 25);
  assert.equal(getNextFrameUpgradeCostGems(5), 100);
  assert.equal(getNextFrameUpgradeCostGems(6), null);

  const denied = evolveHeroMasteryFrameOnce({}, 'steelshot', 20);
  assert.equal(denied.evolved, false);
  assert.equal(denied.reason, 'insufficient_gems');

  // Nv.1 -> Nv.2 (25 Gemas) -> Nv.6 (total 285 Gemas)
  let map = {};
  let gems = 300;
  for (let expectedLvl = 2; expectedLvl <= 6; expectedLvl += 1) {
    const step = evolveHeroMasteryFrameOnce(map, 'steelshot', gems);
    assert.equal(step.evolved, true);
    assert.equal(step.upgrade?.newLevel, expectedLvl);
    map = step.nextMap;
    gems = step.nextGems;
  }
  assert.equal(gems, 15);
  const finalProg = computeHeroMasteryProgress('steelshot', (map as Record<string, never>).steelshot);
  assert.equal(finalProg.tier.level, 6);
  assert.equal(finalProg.activeFrameId, 'lenda');

  const maxed = evolveHeroMasteryFrameOnce(map, 'steelshot', 999);
  assert.equal(maxed.evolved, false);
  assert.equal(maxed.reason, 'max_level');
});

test('evolveAccountMasteryFrames upgrades all 21 heroes breadth-first prioritizing selected hero', () => {
  const fullBatch = evolveAccountMasteryFrames({}, 10000, 'phoenix');
  assert.equal(fullBatch.evolvedCount, 21 * 5);
  assert.equal(fullBatch.totalCostGems, 21 * 285);
  assert.equal(fullBatch.nextGems, 10000 - 21 * 285);

  const summary = computeAccountMasterySummary(fullBatch.nextMap, fullBatch.nextGems);
  assert.equal(summary.evolvedFramesCount, 21);
  assert.equal(summary.maxedFramesCount, 21);
  assert.equal(summary.eligibleNowCount, 0);
  assert.equal(summary.cheapestNextCostGems, null);

  const partial = evolveAccountMasteryFrames({}, 50, 'kronos');
  assert.equal(partial.evolvedCount, 2);
  assert.equal(partial.upgrades[0]?.heroId, 'kronos');
  assert.equal(partial.upgrades[0]?.newLevel, 2);
  assert.equal(partial.nextGems, 0);
});
