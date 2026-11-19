import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_QUEST_COUNT,
  DAILY_QUEST_POOL,
  LOGIN_STREAK_REWARDS,
  applyDailyLoginStreak,
  applyMatchToDailyQuests,
  claimDailyQuestReward,
  computeLevelInfo,
  countClaimableDailyQuests,
  diffCalendarDays,
  ensureDailyProgressionState,
  generateDailyQuests,
  getLocalDateKey,
  getLoginStreakRewardGems,
} from './dailyQuests';

test('generateDailyQuests returns 3 unique, varied challenges for a date', () => {
  const quests = generateDailyQuests('2026-11-15', 'guest');
  assert.equal(quests.length, DAILY_QUEST_COUNT);

  const ids = new Set(quests.map((q) => q.id));
  const metrics = new Set(quests.map((q) => q.metric));
  assert.equal(ids.size, 3);
  assert.equal(metrics.size, 3);

  for (const q of quests) {
    assert.equal(q.progress, 0);
    assert.equal(q.completed, false);
    assert.equal(q.claimed, false);
    assert.ok(q.target >= 1);
    assert.ok(q.rewardXp > 0);
    assert.ok(q.rewardGems > 0);
  }
});

test('generateDailyQuests changes selection across dates when randomized', () => {
  const seenSets = new Set<string>();
  for (let d = 1; d <= 10; d += 1) {
    const key = `2026-11-${String(d).padStart(2, '0')}`;
    const qIds = generateDailyQuests(key, 'guest')
      .map((q) => q.id)
      .sort()
      .join(',');
    seenSets.add(qIds);
  }
  assert.ok(seenSets.size > 1, 'Expected multiple distinct daily quest sets across dates');
});

test('ensureDailyProgressionState resets quests on a new calendar date while preserving XP and gems', () => {
  const day1 = ensureDailyProgressionState(null, '2026-11-15', 'guest');
  const upgraded = {
    ...day1,
    xp: 350,
    gems: 85,
    quests: day1.quests.map((q) => ({ ...q, progress: q.target, completed: true, claimed: true })),
  };

  const sameDay = ensureDailyProgressionState(upgraded, '2026-11-15', 'guest');
  assert.equal(sameDay.dateKey, '2026-11-15');
  assert.equal(sameDay.quests[0].claimed, true);

  const day2 = ensureDailyProgressionState(upgraded, '2026-11-16', 'guest');
  assert.equal(day2.dateKey, '2026-11-16');
  assert.equal(day2.xp, 350);
  assert.equal(day2.gems, 85);
  assert.equal(day2.quests.length, 3);
  for (const q of day2.quests) {
    assert.equal(q.progress, 0);
    assert.equal(q.completed, false);
    assert.equal(q.claimed, false);
  }
});

test('applyMatchToDailyQuests increments progress per metric and caps at target', () => {
  const killsTpl = DAILY_QUEST_POOL.find((q) => q.id === 'kills_5')!;
  const playTpl = DAILY_QUEST_POOL.find((q) => q.id === 'play_2')!;
  const winTpl = DAILY_QUEST_POOL.find((q) => q.id === 'win_1')!;

  const initial = {
    xp: 0,
    gems: 0,
    dateKey: '2026-11-15',
    loginStreak: 1,
    lastLoginDateKey: '2026-11-15',
    quests: [
      { ...killsTpl, progress: 0, completed: false, claimed: false },
      { ...playTpl, progress: 0, completed: false, claimed: false },
      { ...winTpl, progress: 0, completed: false, claimed: false },
    ],
  };

  const afterMatch1 = applyMatchToDailyQuests(initial, {
    kills: 3,
    victory: false,
    damageDealt: 1800,
    powerCubes: 2,
    mode: 'royale',
    placement: 3,
  });

  assert.equal(afterMatch1.state.quests[0].progress, 3);
  assert.equal(afterMatch1.state.quests[0].completed, false);
  assert.equal(afterMatch1.state.quests[1].progress, 1);
  assert.equal(afterMatch1.state.quests[1].completed, false);
  assert.equal(afterMatch1.state.quests[2].progress, 0);
  assert.equal(afterMatch1.state.quests[2].completed, false);

  const afterMatch2 = applyMatchToDailyQuests(afterMatch1.state, {
    kills: 4,
    victory: true,
    damageDealt: 3600,
    powerCubes: 5,
    mode: 'brawl',
  });

  assert.equal(afterMatch2.state.quests[0].progress, 5);
  assert.equal(afterMatch2.state.quests[0].completed, true);
  assert.equal(afterMatch2.state.quests[1].progress, 2);
  assert.equal(afterMatch2.state.quests[1].completed, true);
  assert.equal(afterMatch2.state.quests[2].progress, 1);
  assert.equal(afterMatch2.state.quests[2].completed, true);
  assert.equal(countClaimableDailyQuests(afterMatch2.state), 3);
});

test('claimDailyQuestReward grants XP and gems once and blocks double claiming', () => {
  const playTpl = DAILY_QUEST_POOL.find((q) => q.id === 'play_2')!;
  const winTpl = DAILY_QUEST_POOL.find((q) => q.id === 'win_1')!;
  const killsTpl = DAILY_QUEST_POOL.find((q) => q.id === 'kills_5')!;

  const state = {
    xp: 50,
    gems: 10,
    dateKey: '2026-11-15',
    loginStreak: 2,
    lastLoginDateKey: '2026-11-15',
    quests: [
      { ...playTpl, progress: 2, completed: true, claimed: false },
      { ...winTpl, progress: 1, completed: true, claimed: false },
      { ...killsTpl, progress: 2, completed: false, claimed: false },
    ],
  };

  // Cannot claim incomplete quest
  const incompleteAttempt = claimDailyQuestReward(state, 'kills_5');
  assert.equal(incompleteAttempt.claimed, false);
  assert.equal(incompleteAttempt.state.xp, 50);

  // Claim completed quest
  const claimedPlay = claimDailyQuestReward(state, 'play_2');
  assert.equal(claimedPlay.claimed, true);
  assert.equal(claimedPlay.xpGained, playTpl.rewardXp);
  assert.equal(claimedPlay.gemsGained, playTpl.rewardGems);
  assert.equal(claimedPlay.state.xp, 50 + playTpl.rewardXp);
  assert.equal(claimedPlay.state.gems, 10 + playTpl.rewardGems);
  assert.equal(claimedPlay.state.quests[0].claimed, true);
  assert.equal(countClaimableDailyQuests(claimedPlay.state), 1);

  // Double-claim is blocked
  const duplicate = claimDailyQuestReward(claimedPlay.state, 'play_2');
  assert.equal(duplicate.claimed, false);
  assert.equal(duplicate.state.xp, claimedPlay.state.xp);
  assert.equal(duplicate.state.gems, claimedPlay.state.gems);
});

test('computeLevelInfo advances levels progressively from XP', () => {
  const lv1 = computeLevelInfo(0);
  assert.equal(lv1.level, 1);
  assert.equal(lv1.currentLevelXp, 0);
  assert.equal(lv1.nextLevelXp, 200);

  const lv2 = computeLevelInfo(250);
  assert.equal(lv2.level, 2);
  assert.equal(lv2.currentLevelXp, 50);
  assert.equal(lv2.nextLevelXp, 300);

  const lv3 = computeLevelInfo(500);
  assert.equal(lv3.level, 3);
  assert.equal(lv3.currentLevelXp, 0);
  assert.equal(lv3.nextLevelXp, 400);
});

test('getLocalDateKey formats YYYY-MM-DD cleanly', () => {
  const d = new Date(2026, 0, 5);
  assert.equal(getLocalDateKey(d), '2026-01-05');
});

test('applyDailyLoginStreak rewards Day 1, prevents same-day double reward, increments on consecutive days, and resets after missed day', () => {
  const fresh = ensureDailyProgressionState(null, '2026-11-15', 'guest');
  assert.equal(fresh.loginStreak, 0);
  assert.equal(fresh.lastLoginDateKey, null);

  // Day 1 login
  const day1 = applyDailyLoginStreak(fresh, '2026-11-15');
  assert.equal(day1.awarded, true);
  assert.equal(day1.streak, 1);
  assert.equal(day1.gemsGained, LOGIN_STREAK_REWARDS[0]);
  assert.equal(day1.state.gems, LOGIN_STREAK_REWARDS[0]);
  assert.equal(day1.state.loginStreak, 1);
  assert.equal(day1.state.lastLoginDateKey, '2026-11-15');
  assert.equal(day1.wasReset, false);

  // Same-day reload does not re-reward
  const sameDay = applyDailyLoginStreak(day1.state, '2026-11-15');
  assert.equal(sameDay.awarded, false);
  assert.equal(sameDay.gemsGained, 0);
  assert.equal(sameDay.state.gems, day1.state.gems);
  assert.equal(sameDay.state.loginStreak, 1);

  // Consecutive Day 2 login
  const day2 = applyDailyLoginStreak(day1.state, '2026-11-16');
  assert.equal(day2.awarded, true);
  assert.equal(day2.streak, 2);
  assert.equal(day2.gemsGained, LOGIN_STREAK_REWARDS[1]);
  assert.equal(day2.state.gems, LOGIN_STREAK_REWARDS[0] + LOGIN_STREAK_REWARDS[1]);
  assert.equal(day2.wasReset, false);

  // Missed a day (jump from Nov 16 -> Nov 18) resets streak to 1 and grants Day 1 reward
  const missed = applyDailyLoginStreak(day2.state, '2026-11-18');
  assert.equal(missed.awarded, true);
  assert.equal(missed.streak, 1);
  assert.equal(missed.wasReset, true);
  assert.equal(missed.gemsGained, LOGIN_STREAK_REWARDS[0]);
  assert.equal(missed.state.lastLoginDateKey, '2026-11-18');
});

test('diffCalendarDays and getLoginStreakRewardGems handle month boundaries and 7+ day cap', () => {
  assert.equal(diffCalendarDays('2026-01-31', '2026-02-01'), 1);
  assert.equal(diffCalendarDays('2026-02-28', '2026-03-01'), 1);
  assert.equal(getLoginStreakRewardGems(1), 10);
  assert.equal(getLoginStreakRewardGems(7), 60);
  assert.equal(getLoginStreakRewardGems(12), 60);
});

test('computeMatchGemReward and applyMatchRewardToProgression award bounded Gems and XP for matches', async () => {
  const {
    SEASON_WELCOME_GIFT_GEMS,
    SEASON_WELCOME_GIFT_ID,
    applyMatchRewardToProgression,
    computeMatchGemReward,
  } = await import('./dailyQuests');

  assert.equal(SEASON_WELCOME_GIFT_ID, 'season1_welcome_10k');
  assert.equal(SEASON_WELCOME_GIFT_GEMS, 10000);

  const lossZeroKills = computeMatchGemReward({
    kills: 0,
    victory: false,
    damageDealt: 100,
    powerCubes: 0,
    mode: 'brawl',
  });
  assert.equal(lossZeroKills.gems, 10);
  assert.equal(lossZeroKills.xp, 30);

  const top3Royale = computeMatchGemReward({
    kills: 2,
    victory: false,
    damageDealt: 1200,
    powerCubes: 3,
    mode: 'royale',
    placement: 2,
  });
  assert.equal(top3Royale.gems, 10 + 5 + 4);
  assert.equal(top3Royale.xp, 30 + 20);

  const winHighKills = computeMatchGemReward({
    kills: 20,
    victory: true,
    damageDealt: 9000,
    powerCubes: 10,
    mode: 'royale',
    placement: 1,
  });
  assert.equal(winHighKills.gems, 40);
  assert.equal(winHighKills.xp, 130);

  const fresh = ensureDailyProgressionState(null, '2026-11-17', 'guest');
  const next = applyMatchRewardToProgression(fresh, {
    kills: 3,
    victory: true,
    damageDealt: 3000,
    powerCubes: 4,
    mode: 'brawl',
  });
  assert.equal(next.reward.gems, 10 + 15 + 6);
  assert.equal(next.state.gems, fresh.gems + next.reward.gems);
  assert.equal(next.state.xp, fresh.xp + next.reward.xp);
});
