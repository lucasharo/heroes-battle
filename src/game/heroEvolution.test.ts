import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_LIST, HEROES } from './heroes';
import {
  HERO_EVOLUTION_TIERS,
  MAX_HERO_EVOLUTION_LEVEL,
  computeAccountEvolutionSummary,
  computeEvolvedHeroStats,
  evolveAllEligibleHeroes,
  evolveHeroOnce,
  getHeroEvolutionLevel,
  mergeHeroEvolutionMaps,
  sanitizeHeroEvolutionMap,
} from './heroEvolution';

test('hero evolution tiers define 5 progressive levels with scaling bonuses', () => {
  assert.equal(HERO_EVOLUTION_TIERS.length, MAX_HERO_EVOLUTION_LEVEL);
  assert.equal(HERO_EVOLUTION_TIERS[0].bonusPct, 0);
  assert.equal(HERO_EVOLUTION_TIERS[0].upgradeCostGems, 25);
  assert.equal(HERO_EVOLUTION_TIERS[4].bonusPct, 35);
  assert.equal(HERO_EVOLUTION_TIERS[4].upgradeCostGems, null);
});

test('computeEvolvedHeroStats scales HP and ATK accurately per evolution level', () => {
  const baseSteel = HEROES.steelshot;
  const lv1 = computeEvolvedHeroStats('steelshot', 1);
  assert.equal(lv1.maxHp, baseSteel.maxHp);
  assert.equal(lv1.attackDamage, baseSteel.attackDamage);

  const lv2 = computeEvolvedHeroStats('steelshot', 2);
  assert.equal(lv2.maxHp, Math.round(baseSteel.maxHp * 1.08));
  assert.equal(lv2.attackDamage, Math.round(baseSteel.attackDamage * 1.08));
  assert.ok(lv2.hpBonus > 0 && lv2.atkBonus > 0);

  const lv5 = computeEvolvedHeroStats('steelshot', 5);
  assert.equal(lv5.maxHp, Math.round(baseSteel.maxHp * 1.35));
  assert.equal(lv5.attackDamage, Math.round(baseSteel.attackDamage * 1.35));
});

test('evolveHeroOnce enforces gem balance, deducts exact cost, and caps at Nv.5', () => {
  const lowGems = evolveHeroOnce({}, 'steelshot', 20);
  assert.equal(lowGems.evolved, false);
  assert.equal(lowGems.reason, 'insufficient_gems');
  assert.equal(lowGems.nextGems, 20);

  const step1 = evolveHeroOnce({}, 'steelshot', 100);
  assert.equal(step1.evolved, true);
  assert.equal(getHeroEvolutionLevel(step1.nextMap, 'steelshot'), 2);
  assert.equal(step1.nextGems, 75);
  assert.equal(step1.upgrade?.costGems, 25);

  const maxRes = evolveHeroOnce({ steelshot: 5 }, 'steelshot', 999);
  assert.equal(maxRes.evolved, false);
  assert.equal(maxRes.reason, 'max_level');
  assert.equal(maxRes.nextGems, 999);
});

test('evolveAllEligibleHeroes upgrades prioritized hero first and spreads levels fairly across roster', () => {
  const res = evolveAllEligibleHeroes({}, 100, 'phoenix');
  assert.equal(res.evolvedCount, 4);
  assert.equal(res.totalCostGems, 100);
  assert.equal(res.nextGems, 0);
  assert.equal(res.upgrades[0].heroId, 'phoenix');
  assert.equal(getHeroEvolutionLevel(res.nextMap, 'phoenix'), 2);
  assert.equal(getHeroEvolutionLevel(res.nextMap, HERO_LIST[0].id), 2);
});

test('sanitizeHeroEvolutionMap drops invalid IDs and mergeHeroEvolutionMaps keeps highest level', () => {
  const sanitized = sanitizeHeroEvolutionMap({
    steelshot: 4,
    invalidHero: 5,
    raidon: 1,
    kong: 99,
  });
  assert.equal(sanitized.steelshot, 4);
  assert.equal(sanitized.kong, 5);
  assert.equal(sanitized.raidon, undefined);
  assert.equal('invalidHero' in sanitized, false);

  const merged = mergeHeroEvolutionMaps({ steelshot: 3, raidon: 2 }, { steelshot: 2, phoenix: 4 });
  assert.equal(merged.steelshot, 3);
  assert.equal(merged.raidon, 2);
  assert.equal(merged.phoenix, 4);

  const summary = computeAccountEvolutionSummary(merged, 50);
  assert.equal(summary.totalHeroes, 21);
  assert.equal(summary.evolvedHeroesCount, 3);
  assert.equal(summary.eligibleNowCount, 19);

  const summaryRich = computeAccountEvolutionSummary(merged, 110);
  assert.equal(summaryRich.eligibleNowCount, 21);
});
