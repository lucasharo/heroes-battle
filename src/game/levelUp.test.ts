import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVEL_UP_ANIMATION_DURATION_MS,
  computeLevelCounterFrame,
  detectAccountLevelUp,
} from './levelUp';

test('detectAccountLevelUp returns null when XP stays within the same level', () => {
  const res = detectAccountLevelUp(50, 180, 'match');
  assert.equal(res, null);
});

test('detectAccountLevelUp returns LevelUpEvent when crossing single or multiple levels', () => {
  const single = detectAccountLevelUp(160, 260, 'match');
  assert.ok(single);
  assert.equal(single.previousLevel, 1);
  assert.equal(single.newLevel, 2);
  assert.equal(single.xpGained, 100);
  assert.equal(single.previousProgressPct, 80);
  assert.equal(single.currentLevelXp, 60);
  assert.equal(single.nextLevelXpTarget, 300);
  assert.equal(single.previousXp, 160);
  assert.equal(single.newXp, 260);
  assert.equal(single.source, 'match');

  const multi = detectAccountLevelUp(100, 550, 'quest');
  assert.ok(multi);
  assert.equal(multi.previousLevel, 1);
  assert.equal(multi.newLevel, 3);
  assert.equal(multi.xpGained, 450);
  assert.equal(multi.source, 'quest');
});

test('computeLevelCounterFrame progresses deterministically from charging to ascending to settled', () => {
  const event = detectAccountLevelUp(150, 560, 'match');
  assert.ok(event);

  const start = computeLevelCounterFrame(event, 0, LEVEL_UP_ANIMATION_DURATION_MS);
  assert.equal(start.phase, 'charging');
  assert.equal(start.displayedLevel, 1);
  assert.equal(start.displayedTotalXp, 150);
  assert.equal(start.displayedXpGained, 0);
  assert.equal(start.justLeveledUp, false);
  assert.equal(start.barFillPct, event.previousProgressPct);

  const chargingLate = computeLevelCounterFrame(
    event,
    LEVEL_UP_ANIMATION_DURATION_MS * 0.35,
    LEVEL_UP_ANIMATION_DURATION_MS
  );
  assert.equal(chargingLate.phase, 'charging');
  assert.ok(chargingLate.barFillPct >= event.previousProgressPct);
  assert.ok(chargingLate.displayedTotalXp > 150);

  const ascending = computeLevelCounterFrame(
    event,
    LEVEL_UP_ANIMATION_DURATION_MS * 0.65,
    LEVEL_UP_ANIMATION_DURATION_MS
  );
  assert.equal(ascending.phase, 'ascending');
  assert.ok(ascending.displayedLevel >= 2 && ascending.displayedLevel <= 3);
  assert.equal(ascending.justLeveledUp, true);

  const settled = computeLevelCounterFrame(
    event,
    LEVEL_UP_ANIMATION_DURATION_MS,
    LEVEL_UP_ANIMATION_DURATION_MS
  );
  assert.equal(settled.phase, 'settled');
  assert.equal(settled.displayedLevel, event.newLevel);
  assert.equal(settled.displayedTotalXp, event.newXp);
  assert.equal(settled.displayedXpGained, event.xpGained);
  assert.equal(settled.barFillPct, event.newProgressPct);
  assert.equal(settled.justLeveledUp, true);
});
