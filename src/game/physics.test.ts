import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_LIST, createArenaMap, isSpawnClearOfWalls } from './arena';
import { HERO_LIST, HEROES } from './heroes';
import { VICTORY_FANFARE_NOTES, soundEngine } from './audio';
import { HERO_SKILL_VFX, getHeroSkillVfx } from './skillVfx';
import {
  ARENA_CENTER,
  BOT_FURY_GAIN_MULTIPLIER,
  BOT_RESPAWN_MAX_FURY,
  BOT_ULTIMATE_OPENING_LOCK_SEC,
  COMBO_TAP_WINDOW_SEC,
  KILL_STREAK_WINDOW_SEC,
  MAX_STORM_RADIUS,
  MIN_STORM_RADIUS,
  PASSIVE_FURY_RATE_BOT,
  PASSIVE_FURY_RATE_PLAYER,
  applyDamageWithShield,
  buildMatchDamageComparison,
  calculateDamage,
  canBotCastUltimate,
  canObserverSeeTarget,
  canPassiveHoldFireBasic,
  canQueueBasicComboTap,
  clampDt,
  computeDamageNumberStyle,
  computeFuryGain,
  computeMaxHp,
  computePowerMultiplier,
  computeStormRadius,
  computeViewportCameraScale,
  computeVirtualStickVector,
  createSparkBurstSpecs,
  evaluateMatchEnd,
  getKillStreakMeta,
  isOutsideStorm,
  resolveBasicAttackCombo,
  resolveBotRespawnFury,
  resolveCircleRectCollision,
  resolveKillStreak,
  resolvePlayerAimAngle,
  selectDeathCamTarget,
} from './physics';

import {
  RANK_TIERS,
  applyMatchStats,
  computeMatchTrophyDelta,
  getRankTier,
  sanitizeDisplayName,
  validateDisplayName,
  validateEmailInput,
  validatePasswordInput,
} from './ranking';

test('defines all 21 distinct Thetan Arena heroes across 3 rarity tiers with full ability kits', () => {
  assert.equal(HERO_LIST.length, 21);
  const ids = HERO_LIST.map((h) => h.id);
  assert.deepEqual(ids, [
    'steelshot',
    'raidon',
    'cluster',
    'baston',
    'nina',
    'drake',
    'knox',
    'kairo',
    'boulder',
    'veinka',
    'eldragon',
    'velvet',
    'ryder',
    'solara',
    'frost',
    'kong',
    'phoenix',
    'meiro',
    'valkyria',
    'kronos',
    'titanx',
  ]);

  const byTier = {
    comum: HERO_LIST.filter((h) => h.tier === 'comum'),
    epico: HERO_LIST.filter((h) => h.tier === 'epico'),
    lendario: HERO_LIST.filter((h) => h.tier === 'lendario'),
  };
  assert.equal(byTier.comum.length, 9);
  assert.equal(byTier.epico.length, 6);
  assert.equal(byTier.lendario.length, 6);
  assert.equal(HEROES.cluster.tier, 'comum');
  assert.equal(HEROES.velvet.tier, 'epico');
  assert.equal(HEROES.meiro.tier, 'lendario');
  assert.equal(HEROES.baston.tier, 'comum');
  assert.equal(HEROES.solara.tier, 'epico');
  assert.equal(HEROES.titanx.tier, 'lendario');

  for (const hero of HERO_LIST) {
    assert.ok(hero.maxHp > 0);
    assert.ok(hero.portraitUrl.length > 0);
    assert.ok(hero.skills.basic.name.length > 0);
    assert.ok(hero.skills.q.name.length > 0);
    assert.ok(hero.skills.e.name.length > 0);
    assert.ok(hero.skills.r.isFury === true);
  }
  assert.ok(HEROES.kong.maxHp > HEROES.veinka.maxHp);
  assert.ok(HEROES.veinka.attackRange > HEROES.kong.attackRange);
  assert.ok(HEROES.titanx.maxHp > HEROES.valkyria.maxHp);
});

test('clampDt caps frame spikes at 50ms', () => {
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(0.45), 0.05);
  assert.equal(clampDt(-1), 0);
});

test('power cubes scale attack damage and max HP', () => {
  assert.equal(computePowerMultiplier(0), 1);
  assert.equal(computePowerMultiplier(4), 1.4);
  assert.equal(calculateDamage(500, 2), 600);
  assert.equal(computeMaxHp(3000, 5), 4800);
});

test('shield absorbs incoming damage before reducing HP', () => {
  const partial = applyDamageWithShield(3000, 500, 300);
  assert.equal(partial.shield, 200);
  assert.equal(partial.hp, 3000);

  const overflow = applyDamageWithShield(3000, 200, 750);
  assert.equal(overflow.shield, 0);
  assert.equal(overflow.hp, 2450);

  const lethal = applyDamageWithShield(300, 0, 900);
  assert.equal(lethal.hp, 0);
});

test('circle vs rect collision pushes actor outside obstacle', () => {
  const wall = { x: 100, y: 100, w: 100, h: 100 };
  const hit = resolveCircleRectCollision(90, 150, 22, wall);
  assert.equal(hit.collided, true);
  assert.equal(hit.x, 78);

  const clear = resolveCircleRectCollision(50, 50, 22, wall);
  assert.equal(clear.collided, false);
});

test('bush stealth hides enemies beyond reveal radius unless revealed', () => {
  const observer = { id: 'p1', team: 'ally' as const, x: 500, y: 500 };
  const farHidden = {
    id: 'e1',
    team: 'enemy' as const,
    x: 900,
    y: 500,
    alive: true,
    stealthTimer: 0,
    inBush: true,
    revealedTimer: 0,
  };
  assert.equal(canObserverSeeTarget(observer, farHidden), false);

  const nearBush = { ...farHidden, x: 640 };
  assert.equal(canObserverSeeTarget(observer, nearBush), true);

  const revealed = { ...farHidden, revealedTimer: 0.8 };
  assert.equal(canObserverSeeTarget(observer, revealed), true);
});

test('storm shrinks over time in Battle Royale but stays open in all 4v4 modes', () => {
  assert.equal(computeStormRadius(5, 'royale'), MAX_STORM_RADIUS);
  const mid = computeStormRadius(52.5, 'royale');
  assert.ok(mid < MAX_STORM_RADIUS && mid > MIN_STORM_RADIUS);
  assert.equal(computeStormRadius(120, 'royale'), MIN_STORM_RADIUS);
  assert.equal(computeStormRadius(120, 'brawl'), MAX_STORM_RADIUS);
  assert.equal(computeStormRadius(120, 'superstar'), MAX_STORM_RADIUS);
  assert.equal(computeStormRadius(120, 'tower'), MAX_STORM_RADIUS);

  assert.equal(isOutsideStorm(ARENA_CENTER, ARENA_CENTER, 220), false);
  assert.equal(isOutsideStorm(ARENA_CENTER + 300, ARENA_CENTER, 220), true);
});

test('match end conditions work for Royale, Deathmatch, Super Estrela, and Cerco à Torre', () => {
  assert.deepEqual(evaluateMatchEnd('royale', false, 4, 0, 0, 12), {
    ended: true,
    victory: false,
  });
  assert.deepEqual(evaluateMatchEnd('royale', true, 1, 0, 0, 12), {
    ended: true,
    victory: true,
  });
  assert.deepEqual(evaluateMatchEnd('brawl', false, 6, 12, 5, 12), {
    ended: true,
    victory: true,
  });
  assert.deepEqual(evaluateMatchEnd('brawl', true, 7, 8, 12, 12), {
    ended: true,
    victory: false,
  });

  // Super Estrela countdown & timer tiebreak
  assert.deepEqual(evaluateMatchEnd('superstar', true, 8, 10, 4, 10, { starCountdownDone: 'ally', timeRemaining: 40 }), {
    ended: true,
    victory: true,
  });
  assert.deepEqual(evaluateMatchEnd('superstar', true, 8, 5, 11, 10, { starCountdownDone: 'enemy', timeRemaining: 40 }), {
    ended: true,
    victory: false,
  });
  assert.deepEqual(evaluateMatchEnd('superstar', true, 8, 7, 9, 10, { starCountdownDone: null, timeRemaining: 0 }), {
    ended: true,
    victory: false,
  });

  // Cerco à Torre destruction & HP tiebreak
  assert.deepEqual(evaluateMatchEnd('tower', true, 8, 0, 0, 0, { allyTowerHp: 4200, enemyTowerHp: 0, timeRemaining: 55 }), {
    ended: true,
    victory: true,
  });
  assert.deepEqual(evaluateMatchEnd('tower', true, 8, 0, 0, 0, { allyTowerHp: 0, enemyTowerHp: 2100, timeRemaining: 55 }), {
    ended: true,
    victory: false,
  });
  assert.deepEqual(evaluateMatchEnd('tower', true, 8, 0, 0, 0, { allyTowerHp: 5000, enemyTowerHp: 3200, timeRemaining: 0 }), {
    ended: true,
    victory: true,
  });
});

test('all 4 maps have wall-clear spawns and tower bases', () => {
  assert.equal(MAP_LIST.length, 4);
  for (const meta of MAP_LIST) {
    const map = createArenaMap(meta.id);
    assert.equal(map.id, meta.id);
    for (const s of map.royaleSpawns) {
      assert.equal(isSpawnClearOfWalls(s.x, s.y, 28, map.walls), true, `${meta.id} royale spawn blocked`);
    }
    for (const s of map.brawlAllySpawns) {
      assert.equal(isSpawnClearOfWalls(s.x, s.y, 28, map.walls), true, `${meta.id} ally spawn blocked`);
    }
    for (const s of map.brawlEnemySpawns) {
      assert.equal(isSpawnClearOfWalls(s.x, s.y, 28, map.walls), true, `${meta.id} enemy spawn blocked`);
    }
    assert.equal(isSpawnClearOfWalls(map.allyTowerPos.x, map.allyTowerPos.y, 44, map.walls), true, `${meta.id} ally tower blocked`);
    assert.equal(isSpawnClearOfWalls(map.enemyTowerPos.x, map.enemyTowerPos.y, 44, map.walls), true, `${meta.id} enemy tower blocked`);
  }
});

test('3-bar rapid-click attack combo escalates damage on hits 2 and 3', () => {
  const hit1 = resolveBasicAttackCombo({
    ammo: 3,
    maxAmmo: 3,
    currentComboStep: 0,
    comboWindowTimer: 0,
    isDiscreteTap: true,
  });
  assert.equal(hit1.nextComboStep, 1);
  assert.equal(hit1.damageMultiplier, 1);
  assert.equal(hit1.isComboAttack, false);
  assert.ok(hit1.lockoutMultiplier < 1);
  assert.equal(hit1.nextComboWindowTimer, COMBO_TAP_WINDOW_SEC);

  const hit2 = resolveBasicAttackCombo({
    ammo: 2,
    maxAmmo: 3,
    currentComboStep: hit1.nextComboStep,
    comboWindowTimer: 0.3,
    isDiscreteTap: true,
  });
  assert.equal(hit2.nextComboStep, 2);
  assert.equal(hit2.damageMultiplier, 1.25);
  assert.equal(hit2.isComboAttack, true);
  assert.equal(hit2.isComboFinisher, false);

  const hit3 = resolveBasicAttackCombo({
    ammo: 1,
    maxAmmo: 3,
    currentComboStep: hit2.nextComboStep,
    comboWindowTimer: 0.25,
    isDiscreteTap: true,
  });
  assert.equal(hit3.nextComboStep, 3);
  assert.equal(hit3.damageMultiplier, 1.65);
  assert.equal(hit3.isComboAttack, true);
  assert.equal(hit3.isComboFinisher, true);

  const totalNormal = calculateDamage(500, 0, 1) * 3;
  const totalCombo =
    calculateDamage(500, 0, hit1.damageMultiplier) +
    calculateDamage(500, 0, hit2.damageMultiplier) +
    calculateDamage(500, 0, hit3.damageMultiplier);
  assert.ok(totalCombo > totalNormal);
});

test('holding from 3 full bars triggers player combo, while starting below 3 bars or bot passive attacks do not', () => {
  // Holding attack / dragging mobile aim stick with allowHoldCombo chains comboStep 1 -> 2 -> 3
  const hold1 = resolveBasicAttackCombo({
    ammo: 3,
    maxAmmo: 3,
    currentComboStep: 0,
    comboWindowTimer: 0,
    isDiscreteTap: false,
    allowHoldCombo: true,
  });
  assert.equal(hold1.nextComboStep, 1);
  const hold2 = resolveBasicAttackCombo({
    ammo: 2,
    maxAmmo: 3,
    currentComboStep: hold1.nextComboStep,
    comboWindowTimer: 0.5,
    isDiscreteTap: false,
    allowHoldCombo: true,
  });
  assert.equal(hold2.nextComboStep, 2);
  assert.equal(hold2.damageMultiplier, 1.25);
  const hold3 = resolveBasicAttackCombo({
    ammo: 1,
    maxAmmo: 3,
    currentComboStep: hold2.nextComboStep,
    comboWindowTimer: 0.5,
    isDiscreteTap: false,
    allowHoldCombo: true,
  });
  assert.equal(hold3.nextComboStep, 3);
  assert.equal(hold3.damageMultiplier, 1.65);

  // Bot attacks (both isDiscreteTap and allowHoldCombo false) do not chain combo
  const botShot = resolveBasicAttackCombo({
    ammo: 2,
    maxAmmo: 3,
    currentComboStep: 1,
    comboWindowTimer: 0.35,
    isDiscreteTap: false,
    allowHoldCombo: false,
  });
  assert.equal(botShot.nextComboStep, 0);
  assert.equal(botShot.damageMultiplier, 1);
  assert.equal(botShot.isComboAttack, false);

  // Starting with 2/3 bars cannot initiate combo
  const partialAmmo = resolveBasicAttackCombo({
    ammo: 2,
    maxAmmo: 3,
    currentComboStep: 0,
    comboWindowTimer: 0,
    isDiscreteTap: true,
  });
  assert.equal(partialAmmo.nextComboStep, 0);
  assert.equal(partialAmmo.damageMultiplier, 1);

  // Slow click after window expires breaks combo
  const expired = resolveBasicAttackCombo({
    ammo: 2,
    maxAmmo: 3,
    currentComboStep: 1,
    comboWindowTimer: 0,
    isDiscreteTap: true,
  });
  assert.equal(expired.nextComboStep, 0);
  assert.equal(expired.damageMultiplier, 1);
});

test('canPassiveHoldFireBasic guards normal click release while enabling held combos and mobile aim-stick fire', () => {
  // Normal quick click-and-release (<290ms) does not accidentally double-fire
  assert.equal(
    canPassiveHoldFireBasic({
      currentComboStep: 1,
      comboWindowTimer: 0.45,
      msSinceLastDiscreteTap: 210,
    }),
    false
  );
  // Intentional hold past 290ms continues combo or auto-fires
  assert.equal(
    canPassiveHoldFireBasic({
      currentComboStep: 1,
      comboWindowTimer: 0.45,
      msSinceLastDiscreteTap: 310,
    }),
    true
  );
  // Mobile aim-stick drag fires immediately even inside active combo window
  assert.equal(
    canPassiveHoldFireBasic({
      currentComboStep: 1,
      comboWindowTimer: 0.45,
      msSinceLastDiscreteTap: 40,
      virtualAimActive: true,
    }),
    true
  );
});

test('canQueueBasicComboTap queues taps from 3 full bars, mid-combo, and immediately after comboStep 3', () => {
  // 3/3 bars with 1st click in bufferedAction allows queueing hits 2 and 3, capped at 2 queued
  assert.equal(
    canQueueBasicComboTap({
      ammo: 3,
      maxAmmo: 3,
      currentComboStep: 0,
      comboTapQueue: 0,
      pendingBufferedBasic: 1,
    }),
    true
  );
  assert.equal(
    canQueueBasicComboTap({
      ammo: 3,
      maxAmmo: 3,
      currentComboStep: 0,
      comboTapQueue: 2,
      pendingBufferedBasic: 1,
    }),
    false
  );
  // Mid-combo step 1 -> step 2 -> step 3
  assert.equal(
    canQueueBasicComboTap({
      ammo: 2,
      maxAmmo: 3,
      currentComboStep: 1,
      comboTapQueue: 0,
      pendingBufferedBasic: 0,
    }),
    true
  );
  // Fresh combo immediately after previous comboStep 3 once ammo is back to 3/3
  assert.equal(
    canQueueBasicComboTap({
      ammo: 3,
      maxAmmo: 3,
      currentComboStep: 3,
      comboTapQueue: 0,
      pendingBufferedBasic: 0,
    }),
    true
  );
});

test('ranking tiers and trophy progression stay bounded and accurate', () => {
  assert.equal(RANK_TIERS.length, 6);
  assert.equal(getRankTier(0).id, 'bronze');
  assert.equal(getRankTier(199).id, 'bronze');
  assert.equal(getRankTier(200).id, 'prata');
  assert.equal(getRankTier(500).id, 'ouro');
  assert.equal(getRankTier(900).id, 'diamante');
  assert.equal(getRankTier(1500).id, 'mestre');
  assert.equal(getRankTier(2300).id, 'lendario');

  const royaleWin = computeMatchTrophyDelta({ victory: true, kills: 6, mode: 'royale', placement: 1 });
  assert.ok(royaleWin > 30 && royaleWin <= 80);

  const royalePodium = computeMatchTrophyDelta({ victory: false, kills: 2, mode: 'royale', placement: 2 });
  assert.ok(royalePodium > 0 && royalePodium <= 80);

  const brawlLoss = computeMatchTrophyDelta({ victory: false, kills: 0, mode: 'brawl' });
  assert.ok(brawlLoss < 0);

  const clampedFloor = applyMatchStats(
    { trophies: 4, wins: 0, matches: 0, kills: 0 },
    { victory: false, kills: 0, mode: 'brawl', heroId: 'titanx' }
  );
  assert.equal(clampedFloor.trophies, 0);
  assert.equal(clampedFloor.matches, 1);
  assert.equal(clampedFloor.wins, 0);
  assert.equal(clampedFloor.heroId, 'titanx');

  const wonMatch = applyMatchStats(
    { trophies: 100, wins: 2, matches: 4, kills: 10 },
    { victory: true, kills: 5, mode: 'tower', heroId: 'valkyria' }
  );
  assert.equal(wonMatch.wins, 3);
  assert.equal(wonMatch.matches, 5);
  assert.equal(wonMatch.kills, 15);
  assert.ok(wonMatch.trophies > 100);
});

test('account display name, email, and password validators enforce safe inputs', () => {
  assert.equal(sanitizeDisplayName('  @# '), 'Guerreiro');
  assert.equal(sanitizeDisplayName('  Relâmpago_99! '), 'Relâmpago_99');

  assert.equal(validateDisplayName('A'), 'O apelido deve ter entre 2 e 24 caracteres.');
  assert.equal(validateDisplayName('Titan<script>'), 'Use apenas letras, números, espaços, "-" ou "_".');
  assert.equal(validateDisplayName('Valkyria_BR'), null);

  assert.equal(validateEmailInput('invalido'), 'Informe um e-mail válido.');
  assert.equal(validateEmailInput('player@arena.com'), null);

  assert.equal(validatePasswordInput('12345'), 'A senha deve ter pelo menos 6 caracteres.');
  assert.equal(validatePasswordInput('123456'), null);
});

test('computeDamageNumberStyle scales floating damage text size and duration with damage dealt', () => {
  const chip = computeDamageNumberStyle(130, false);
  const standard = computeDamageNumberStyle(700, false);
  const heavy = computeDamageNumberStyle(1800, true);
  const zero = computeDamageNumberStyle(-50, false);
  const extreme = computeDamageNumberStyle(9999, true);

  assert.ok(chip.scale < standard.scale);
  assert.ok(standard.scale < heavy.scale);
  assert.ok(chip.fontSizePx < standard.fontSizePx);
  assert.ok(standard.fontSizePx < heavy.fontSizePx);
  assert.ok(chip.durationSec < heavy.durationSec);

  assert.equal(chip.isCrit, false);
  assert.equal(standard.isCrit, false);
  assert.equal(heavy.isCrit, true);

  assert.equal(zero.scale, 0.88);
  assert.equal(extreme.scale, 1.96);
});

test('resolveKillStreak chains Double Kill through Godlike within window and resets after expiry', () => {
  const first = resolveKillStreak(0, null, 10);
  assert.equal(first.streakCount, 1);
  assert.equal(first.banner, null);

  const second = resolveKillStreak(first.streakCount, 10, 14.5);
  assert.equal(second.streakCount, 2);
  assert.equal(second.banner?.title, 'Double Kill');
  assert.equal(second.banner?.tier, 'double');

  const third = resolveKillStreak(second.streakCount, 14.5, 19.0);
  assert.equal(third.streakCount, 3);
  assert.equal(third.banner?.title, 'Triple Kill');

  const fourth = resolveKillStreak(third.streakCount, 19.0, 22.0);
  assert.equal(fourth.streakCount, 4);
  assert.equal(fourth.banner?.title, 'Quadra Kill');

  const fifth = resolveKillStreak(fourth.streakCount, 22.0, 25.0);
  assert.equal(fifth.streakCount, 5);
  assert.equal(fifth.banner?.title, 'Godlike');
  assert.equal(fifth.banner?.subtitle, '5 abates em sequência');

  const sixth = resolveKillStreak(fifth.streakCount, 25.0, 28.0);
  assert.equal(sixth.streakCount, 6);
  assert.equal(sixth.banner?.title, 'Godlike');
  assert.equal(sixth.banner?.subtitle, '6 abates em sequência');

  const expired = resolveKillStreak(sixth.streakCount, 28.0, 28.0 + KILL_STREAK_WINDOW_SEC + 0.1);
  assert.equal(expired.streakCount, 1);
  assert.equal(expired.banner, null);
  assert.equal(getKillStreakMeta(1), null);
});

test('selectDeathCamTarget prioritizes live killer and falls back to nearest alive teammate', () => {
  const player = { id: 'player', team: 'ally' as const, x: 300, y: 1100 };
  const actors = [
    { id: 'player', team: 'ally' as const, x: 300, y: 1100, alive: false },
    { id: 'ally-far', team: 'ally' as const, x: 1400, y: 1100, alive: true },
    { id: 'ally-dead', team: 'ally' as const, x: 320, y: 1100, alive: false },
    { id: 'ally-near', team: 'ally' as const, x: 600, y: 1100, alive: true },
    { id: 'enemy-killer', team: 'enemy' as const, x: 900, y: 1100, alive: true },
  ];

  // Live killer takes top priority
  const onKiller = selectDeathCamTarget(player, 'enemy-killer', actors);
  assert.equal(onKiller?.actor.id, 'enemy-killer');
  assert.equal(onKiller?.relation, 'killer');
  assert.equal(onKiller?.distanceMeters, 20);

  // Dead killer falls back to nearest alive teammate
  const actorsDeadKiller = actors.map((a) =>
    a.id === 'enemy-killer' ? { ...a, alive: false } : a
  );
  const onTeammate = selectDeathCamTarget(player, 'enemy-killer', actorsDeadKiller);
  assert.equal(onTeammate?.actor.id, 'ally-near');
  assert.equal(onTeammate?.relation, 'teammate');
  assert.equal(onTeammate?.distanceMeters, 10);

  // No live killer and no live teammate returns null
  const none = selectDeathCamTarget({ id: 'p2', team: 0, x: 300, y: 300 }, null, [
    { id: 'p2', team: 0, x: 300, y: 300, alive: false },
    { id: 'bot-1', team: 1, x: 500, y: 500, alive: true },
  ]);
  assert.equal(none, null);
});

test('all 21 heroes define distinct LMB, Q, E, and R skill VFX specs matching their kit archetype', () => {
  const hexColorRe = /^#[0-9a-f]{6}$/i;
  const basicSlashStyles = new Set<string>();
  const basicProjectileShapes = new Set<string>();
  const qDashStyles = new Set<string>();
  const qProjectileShapes = new Set<string>();
  const qZoneVariants = new Set<string>();
  const eAuraStyles = new Set<string>();
  const rVariants = new Set<string>();
  const rSignatures = new Set<string>();
  const rDecals = new Set<string>();

  const meleeHeroIds = new Set([
    'kong',
    'eldragon',
    'meiro',
    'baston',
    'kairo',
    'boulder',
    'valkyria',
  ]);

  for (const hero of HERO_LIST) {
    const spec = getHeroSkillVfx(hero.id);
    assert.equal(spec, HERO_SKILL_VFX[hero.id]);
    assert.equal(spec.heroId, hero.id);

    const isMelee = meleeHeroIds.has(hero.id);
    assert.equal(hero.attackRange <= 200, isMelee, `${hero.id} attackRange melee mismatch`);

    assert.match(spec.basic.primaryColor, hexColorRe);
    assert.match(spec.basic.secondaryColor, hexColorRe);
    if (isMelee) {
      assert.ok(spec.basic.slashStyle, `${hero.id} melee basic missing slashStyle`);
      basicSlashStyles.add(spec.basic.slashStyle);
    } else {
      assert.ok(spec.basic.projectileShape, `${hero.id} ranged basic missing projectileShape`);
      basicProjectileShapes.add(spec.basic.projectileShape);
    }

    assert.match(spec.q.primaryColor, hexColorRe);
    assert.match(spec.q.secondaryColor, hexColorRe);
    assert.ok(spec.q.glowColor.startsWith('rgba('));
    assert.ok(spec.q.castRingStyle.length > 0);

    if (spec.q.kind === 'projectile') {
      assert.ok(spec.q.projectileShape, `${hero.id} Q projectile missing shape`);
      qProjectileShapes.add(spec.q.projectileShape);
    } else if (spec.q.kind === 'dash_trail') {
      assert.ok(spec.q.dashStyle, `${hero.id} Q dash missing dashStyle`);
      qDashStyles.add(spec.q.dashStyle);
    } else {
      assert.ok(spec.q.zoneVariant, `${hero.id} Q zone/mine missing zoneVariant`);
      qZoneVariants.add(spec.q.zoneVariant);
    }

    assert.match(spec.e.primaryColor, hexColorRe);
    assert.match(spec.e.secondaryColor, hexColorRe);
    assert.ok(spec.e.glowColor.startsWith('rgba('));
    assert.ok(spec.e.auraStyle.length > 0);
    eAuraStyles.add(spec.e.auraStyle);

    assert.match(spec.r.primaryColor, hexColorRe);
    assert.match(spec.r.secondaryColor, hexColorRe);
    assert.ok(spec.r.glowColor.startsWith('rgba('));
    assert.ok(spec.r.castRingStyle.length > 0);
    assert.ok(spec.r.rVariant.length > 0);
    assert.ok(spec.r.signatureEffect.length > 0);
    assert.ok(spec.r.decalStyle.length > 0);
    rVariants.add(spec.r.rVariant);
    rSignatures.add(spec.r.signatureEffect);
    rDecals.add(spec.r.decalStyle);
  }

  // Every melee hero LMB has its own slash arc style (7/7)
  assert.equal(basicSlashStyles.size, 7);
  // Every ranged hero LMB has its own projectile silhouette (14/14)
  assert.equal(basicProjectileShapes.size, 14);
  // Every hero E has its own unique aura style (21/21 distinct auras)
  assert.equal(eAuraStyles.size, 21);
  // Every projectile hero has a unique projectile shape (7/7)
  assert.equal(qProjectileShapes.size, 7);
  // Every Q dash hero has a unique dash trail style (10/10)
  assert.equal(qDashStyles.size, 10);
  // Every Q AoE/mine hero has a unique zone variant (4/4)
  assert.equal(qZoneVariants.size, 4);
  // Every hero R ultimate has its own unique telegraph/effect variant and signature (21/21)
  assert.equal(rVariants.size, 21);
  assert.equal(rSignatures.size, 21);
  assert.ok(rDecals.size >= 9);
  // Veinka E drop trap has its own crimson snare variant
  assert.equal(HERO_SKILL_VFX.veinka.e.zoneVariant, 'crimson_snare');
});

test('soundEngine plays triumphant victory fanfare once per match end and respects mute/reset', () => {
  assert.ok(VICTORY_FANFARE_NOTES.length >= 8);
  const peakFreq = Math.max(...VICTORY_FANFARE_NOTES.map((n) => n.freqStart));
  assert.ok(peakFreq >= 1300, 'Victory fanfare should include triumphant upper harmonic shimmer');
  for (const note of VICTORY_FANFARE_NOTES) {
    assert.ok(note.delaySec >= 0);
    assert.ok(note.durationSec > 0);
    assert.ok(note.volume > 0 && note.volume <= 0.25);
  }

  soundEngine.setMuted(false);
  soundEngine.resetVictoryCooldown();
  const baseCount = soundEngine.getVictoryTriggerCount();

  // First victory trigger succeeds
  assert.equal(soundEngine.playVictory(), true);
  assert.equal(soundEngine.getVictoryTriggerCount(), baseCount + 1);

  // Duplicate trigger during the same end-of-match screen is deduplicated
  assert.equal(soundEngine.playVictory(), false);
  assert.equal(soundEngine.getVictoryTriggerCount(), baseCount + 1);

  // Muted prevents trigger even after cooldown reset
  soundEngine.resetVictoryCooldown();
  soundEngine.setMuted(true);
  assert.equal(soundEngine.playVictory(), false);
  assert.equal(soundEngine.getVictoryTriggerCount(), baseCount + 1);

  // Unmuted after reset plays again for the next match
  soundEngine.setMuted(false);
  soundEngine.resetVictoryCooldown();
  assert.equal(soundEngine.playVictory(), true);
  assert.equal(soundEngine.getVictoryTriggerCount(), baseCount + 2);
});

test('buildMatchDamageComparison formats damage dealt vs damage taken safely for Recharts', () => {
  const positive = buildMatchDamageComparison(6840.4, 2459.7);
  assert.equal(positive.dealt, 6840);
  assert.equal(positive.taken, 2460);
  assert.equal(positive.netDiff, 4380);
  assert.equal(positive.bars.length, 2);
  assert.deepEqual(positive.bars[0], {
    key: 'dealt',
    label: 'Causado',
    value: 6840,
    fill: '#f59e0b',
  });
  assert.deepEqual(positive.bars[1], {
    key: 'taken',
    label: 'Sofrido',
    value: 2460,
    fill: '#f43f5e',
  });

  const negative = buildMatchDamageComparison(1200, 3100);
  assert.equal(negative.netDiff, -1900);

  const clamped = buildMatchDamageComparison(-150, Number.NaN);
  assert.equal(clamped.dealt, 0);
  assert.equal(clamped.taken, 0);
  assert.equal(clamped.netDiff, 0);
});

test('computeViewportCameraScale zooms out smoothly on mobile and keeps 1.0 on desktop', () => {
  assert.equal(computeViewportCameraScale(1440, 900), 1);
  assert.equal(computeViewportCameraScale(1280, 720), 1);

  const portraitScale = computeViewportCameraScale(390, 844);
  assert.ok(portraitScale >= 0.56 && portraitScale < 0.7);

  const landscapeScale = computeViewportCameraScale(844, 390);
  assert.ok(landscapeScale >= 0.65 && landscapeScale < 0.85);
});

test('computeVirtualStickVector filters deadzone, clamps radius, and normalizes direction', () => {
  const zero = computeVirtualStickVector(0, 0, 40);
  assert.equal(zero.x, 0);
  assert.equal(zero.y, 0);
  assert.equal(zero.magnitude, 0);

  // Inside 14% deadzone of radius 40 (<= 5.6px)
  const dead = computeVirtualStickVector(3, 2, 40, 0.14);
  assert.equal(dead.x, 0);
  assert.equal(dead.y, 0);
  assert.equal(dead.magnitude, 0);

  // Far outside radius clamps to magnitude 1 along normalized axis
  const maxRight = computeVirtualStickVector(120, 0, 40, 0.14);
  assert.equal(maxRight.x, 1);
  assert.equal(maxRight.y, 0);
  assert.equal(maxRight.magnitude, 1);
  assert.equal(maxRight.knobX, 40);
  assert.equal(maxRight.knobY, 0);

  // Diagonal pull stays circularly clamped (unit length <= 1)
  const diag = computeVirtualStickVector(80, 80, 40, 0.14);
  assert.ok(Math.abs(Math.hypot(diag.x, diag.y) - 1) < 0.0001);
  assert.ok(Math.abs(Math.hypot(diag.knobX, diag.knobY) - 40) < 0.0001);
});

test('resolvePlayerAimAngle prioritizes virtual aim stick, holds recent manual aim, and falls back to movement', () => {
  // Active virtual aim overrides movement direction (e.g. moving left while shooting up-right)
  const aimedUpRight = resolvePlayerAimAngle({
    currentAimAngle: 0,
    virtualAimActive: true,
    virtualAimAngle: -Math.PI / 4,
    manualAimHoldActive: false,
    useMouseAim: true,
    mouseAimAngle: Math.PI,
    moveX: -1,
    moveY: 0,
  });
  assert.ok(Math.abs(aimedUpRight - -Math.PI / 4) < 0.0001);

  // Brief hold after releasing aim stick preserves aimed angle while moving
  const held = resolvePlayerAimAngle({
    currentAimAngle: -Math.PI / 2,
    virtualAimActive: false,
    virtualAimAngle: -Math.PI / 2,
    manualAimHoldActive: true,
    useMouseAim: false,
    mouseAimAngle: 0,
    moveX: 1,
    moveY: 0,
  });
  assert.ok(Math.abs(held - -Math.PI / 2) < 0.0001);

  // Once hold expires on mobile (useMouseAim=false), walking updates facing/aim direction
  const walkLeft = resolvePlayerAimAngle({
    currentAimAngle: 0,
    virtualAimActive: false,
    virtualAimAngle: 0,
    manualAimHoldActive: false,
    useMouseAim: false,
    mouseAimAngle: 0,
    moveX: -1,
    moveY: 0,
  });
  assert.ok(Math.abs(walkLeft - Math.PI) < 0.0001);

  // Desktop mouse aim applies when useMouseAim is true and virtual aim is inactive
  const mouseDown = resolvePlayerAimAngle({
    currentAimAngle: 0,
    virtualAimActive: false,
    virtualAimAngle: 0,
    manualAimHoldActive: false,
    useMouseAim: true,
    mouseAimAngle: Math.PI / 2,
    moveX: -1,
    moveY: 0,
  });
  assert.ok(Math.abs(mouseDown - Math.PI / 2) < 0.0001);
});

test('createSparkBurstSpecs generates directional enemy impact sparks and radial crate shatter sparks', () => {
  // Directional hit sparks biased along impactAngle (e.g. rightward = 0 rad)
  const hitSparks = createSparkBurstSpecs({
    impactAngle: 0,
    count: 8,
    minSpeed: 200,
    maxSpeed: 380,
    spreadRad: Math.PI * 0.7,
    colors: ['#fef08a', '#22d3ee', '#ffffff'],
    baseSize: 3.4,
    randomValues: [0.5, 0.4, 0.5, 0.5],
  });
  assert.equal(hitSparks.length, 8);
  for (const s of hitSparks) {
    assert.ok(s.vx > 0, 'directional sparks should project along impact direction');
    assert.ok(Math.hypot(s.vx, s.vy) >= 200 && Math.hypot(s.vx, s.vy) <= 380);
    assert.ok(s.maxLife >= 0.19 && s.maxLife <= 0.39);
    assert.ok(s.gravity > 0);
  }

  // Omnidirectional crate shatter sparks cover multiple quadrants
  const crateSparks = createSparkBurstSpecs({
    impactAngle: null,
    count: 16,
    minSpeed: 220,
    maxSpeed: 440,
    spreadRad: Math.PI * 2,
    colors: ['#fde047', '#f59e0b', '#ffffff'],
    baseSize: 4,
    randomValues: [0.5, 0.6, 0.5, 0.5],
  });
  assert.equal(crateSparks.length, 16);
  assert.ok(crateSparks.some((s) => s.vx > 0) && crateSparks.some((s) => s.vx < 0));
  assert.ok(crateSparks.some((s) => s.vy > 0) && crateSparks.some((s) => s.vy < 0));
});

test('bot fury gain is strictly slower than player, never self-charges off R, and gates opening R casts', () => {
  assert.ok(PASSIVE_FURY_RATE_BOT < PASSIVE_FURY_RATE_PLAYER);
  assert.ok(BOT_FURY_GAIN_MULTIPLIER > 0 && BOT_FURY_GAIN_MULTIPLIER < 1);

  // Ultimate (R) damage never awards fury back to prevent recursive R loops
  assert.equal(
    computeFuryGain({ baseGain: 16, isPlayer: true, isUltimateSource: true }),
    0
  );
  assert.equal(
    computeFuryGain({ baseGain: 16, isPlayer: false, isUltimateSource: true }),
    0
  );

  // Normal hit scales multi-pellet shots cleanly and keeps bots below player rate
  const playerHit = computeFuryGain({ baseGain: 11, isPlayer: true });
  const botHit = computeFuryGain({ baseGain: 11, isPlayer: false });
  assert.equal(playerHit, 11);
  assert.ok(botHit > 0 && botHit < playerHit);
  assert.ok(Math.abs(botHit - 11 * BOT_FURY_GAIN_MULTIPLIER) < 0.001);

  // Multi-pellet scaling reduces per-bolt fury proportionally
  const playerPellet = computeFuryGain({ baseGain: 11, isPlayer: true, furyGainScale: 0.5 });
  assert.equal(playerPellet, 5.5);

  // Bots cannot cast R during opening seconds even if somehow charged, and unlock after opening lock
  assert.equal(
    canBotCastUltimate({ elapsedTime: BOT_ULTIMATE_OPENING_LOCK_SEC - 0.1, furyCharge: 100 }),
    false
  );
  assert.equal(
    canBotCastUltimate({ elapsedTime: BOT_ULTIMATE_OPENING_LOCK_SEC, furyCharge: 99 }),
    false
  );
  assert.equal(
    canBotCastUltimate({ elapsedTime: BOT_ULTIMATE_OPENING_LOCK_SEC, furyCharge: 100 }),
    true
  );

  // Bot respawn caps retained fury so bots don't respawn immediately holding R
  assert.equal(resolveBotRespawnFury(100), BOT_RESPAWN_MAX_FURY);
  assert.equal(resolveBotRespawnFury(42), 42);
  assert.equal(resolveBotRespawnFury(-5), 0);
});
