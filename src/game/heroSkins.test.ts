import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_LIST } from './heroes';
import { computeHeroMasteryProgress } from './heroMastery';
import {
  VALID_HERO_SKIN_IDS,
  equipHeroSkin,
  getHeroSkinCatalog,
  getHeroSkinSpec,
  getUnlockedHeroSkinIds,
  mergeHeroSkinsMaps,
  resolveEquippedHeroSkin,
  rotateHexHue,
  sanitizeHeroSkinsMap,
} from './heroSkins';

test('every hero has a complete 7-skin catalog with mastery and Battle Pass skins', () => {
  for (const hero of HERO_LIST) {
    const catalog = getHeroSkinCatalog(hero.id);
    assert.equal(catalog.length, VALID_HERO_SKIN_IDS.length);
    assert.equal(catalog[0].id, 'classic');
    assert.equal(catalog[0].portraitFilter, 'none');
    assert.equal(catalog[1].id, 'chroma');
    assert.equal(catalog[1].requiredPoints, 0);
    assert.equal(catalog[2].id, 'solar');
    assert.equal(catalog[2].requiredPoints, 60);
    assert.equal(catalog[3].id, 'eclipse');
    assert.equal(catalog[3].requiredPoints, 180);
    assert.equal(catalog[4].id, 'vanguard');
    assert.equal(catalog[4].unlockSource, 'battlepass');
    assert.equal(catalog[5].id, 'infernal');
    assert.equal(catalog[5].unlockSource, 'battlepass');
    assert.equal(catalog[6].id, 'celestial');
    assert.equal(catalog[6].unlockSource, 'battlepass');
  }
});

test('Battle Pass cosmetics unlock hero-specific and all-hero skins cleanly', () => {
  assert.equal(
    getUnlockedHeroSkinIds('steelshot', null, ['steelshot:vanguard']).includes('vanguard'),
    true
  );
  assert.equal(
    getUnlockedHeroSkinIds('kong', null, ['steelshot:vanguard']).includes('vanguard'),
    false
  );
  assert.equal(
    getUnlockedHeroSkinIds('kong', null, ['all:celestial']).includes('celestial'),
    true
  );
  const equipped = equipHeroSkin({}, 'steelshot', 'vanguard', null, ['steelshot:vanguard']);
  assert.equal(equipped.equipped, true);
  assert.equal(equipped.nextMap.steelshot, 'vanguard');
  const locked = equipHeroSkin({}, 'steelshot', 'infernal', null, ['steelshot:vanguard']);
  assert.equal(locked.equipped, false);
});

test('classic and chroma skins are unlocked immediately while solar and eclipse require mastery', () => {
  const zeroUnlocked = getUnlockedHeroSkinIds('steelshot', null);
  assert.deepEqual(zeroUnlocked, ['classic', 'chroma']);

  // 1 match (40) + 2 kills (30) = 70 pts -> unlocks solar (60)
  const midMastery = computeHeroMasteryProgress('steelshot', {
    heroId: 'steelshot',
    matches: 1,
    kills: 2,
    equippedFrame: 'auto',
  });
  assert.deepEqual(getUnlockedHeroSkinIds('steelshot', midMastery), [
    'classic',
    'chroma',
    'solar',
  ]);

  // 3 matches (120) + 4 kills (60) = 180 pts -> unlocks eclipse (180)
  const highMastery = computeHeroMasteryProgress('steelshot', {
    heroId: 'steelshot',
    matches: 3,
    kills: 4,
    equippedFrame: 'auto',
  });
  assert.deepEqual(getUnlockedHeroSkinIds('steelshot', highMastery), [
    'classic',
    'chroma',
    'solar',
    'eclipse',
  ]);
});

test('equipHeroSkin equips unlocked skins and rejects locked ones cleanly', () => {
  const chromaAttempt = equipHeroSkin({}, 'raidon', 'chroma', null);
  assert.equal(chromaAttempt.equipped, true);
  assert.equal(chromaAttempt.nextMap.raidon, 'chroma');
  assert.equal(chromaAttempt.skin.id, 'chroma');

  const lockedAttempt = equipHeroSkin(chromaAttempt.nextMap, 'raidon', 'eclipse', null);
  assert.equal(lockedAttempt.equipped, false);
  assert.equal(lockedAttempt.nextMap.raidon, 'chroma');
  assert.equal(lockedAttempt.skin.id, 'chroma');

  const unlockedMastery = computeHeroMasteryProgress('raidon', {
    heroId: 'raidon',
    matches: 5,
    kills: 2,
    equippedFrame: 'auto',
  });
  const eclipseEquip = equipHeroSkin(
    chromaAttempt.nextMap,
    'raidon',
    'eclipse',
    unlockedMastery
  );
  assert.equal(eclipseEquip.equipped, true);
  assert.equal(eclipseEquip.nextMap.raidon, 'eclipse');
  assert.equal(eclipseEquip.skin.id, 'eclipse');
});

test('resolveEquippedHeroSkin falls back to classic if saved skin is locked or invalid', () => {
  assert.equal(resolveEquippedHeroSkin('kong', 'solar', null).id, 'classic');
  assert.equal(resolveEquippedHeroSkin('kong', 'chroma', null).id, 'chroma');
  assert.equal(resolveEquippedHeroSkin('kong', 'unknown_skin', null).id, 'classic');
  assert.equal(getHeroSkinSpec('kong', 'classic').id, 'classic');
});

test('sanitizeHeroSkinsMap and mergeHeroSkinsMaps validate hero IDs and skin IDs', () => {
  const cleaned = sanitizeHeroSkinsMap({
    steelshot: 'chroma',
    kong: 'not_a_skin',
    invalid_hero: 'chroma',
  });
  assert.deepEqual(cleaned, { steelshot: 'chroma' });

  const merged = mergeHeroSkinsMaps(
    { steelshot: 'chroma', veinka: 'classic' },
    { veinka: 'solar', phoenix: 'eclipse' }
  );
  assert.deepEqual(merged, {
    steelshot: 'chroma',
    veinka: 'solar',
    phoenix: 'eclipse',
  });
});

test('rotateHexHue returns valid 6-digit uppercase hex strings', () => {
  const rotated = rotateHexHue('#38BDF8', 145);
  assert.match(rotated, /^#[0-9A-F]{6}$/);
  assert.notEqual(rotated, '#38BDF8');
});
