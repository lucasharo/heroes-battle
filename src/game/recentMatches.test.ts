import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GAME_MODE_LABELS,
  RECENT_MATCHES_LIMIT,
  buildMatchResultPayload,
  extractMatchTimestampMs,
  formatMatchDateTime,
  normalizeMatchResult,
  sortAndLimitRecentMatches,
} from './recentMatches';

test('buildMatchResultPayload clamps values to Firestore rule boundaries', () => {
  const payload = buildMatchResultPayload({
    uid: 'user-123',
    victory: true,
    heroId: 'raidon',
    mode: 'brawl',
    kills: 99,
    placement: 0,
    trophyDelta: 150,
    playedAtMs: 1763290000123,
  });

  assert.equal(payload.uid, 'user-123');
  assert.equal(payload.victory, true);
  assert.equal(payload.heroId, 'raidon');
  assert.equal(payload.mode, 'brawl');
  assert.equal(payload.kills, 40);
  assert.equal(payload.placement, 1);
  assert.equal(payload.trophyDelta, 80);
  assert.equal(payload.playedAtMs, 1763290000123);
});

test('normalizeMatchResult extracts Firestore Timestamp and falls back safely', () => {
  const entry = normalizeMatchResult('m1', {
    uid: 'u1',
    victory: false,
    heroId: 'unknown_hero',
    mode: 'invalid_mode',
    kills: 4,
    placement: 5,
    trophyDelta: -10,
    createdAt: { toMillis: () => 1763291111000 },
  });

  assert.equal(entry.id, 'm1');
  assert.equal(entry.victory, false);
  assert.equal(entry.heroId, 'steelshot');
  assert.equal(entry.mode, 'royale');
  assert.equal(entry.kills, 4);
  assert.equal(entry.placement, 5);
  assert.equal(entry.trophyDelta, -10);
  assert.equal(entry.playedAtMs, 1763291111000);
});

test('extractMatchTimestampMs prefers valid playedAtMs and handles Date/seconds fallbacks', () => {
  assert.equal(extractMatchTimestampMs({ toMillis: () => 1000 }, 2500), 2500);
  assert.equal(extractMatchTimestampMs({ seconds: 1700 }, 0), 1700000);
  assert.equal(extractMatchTimestampMs(undefined, 0), 0);
});

test('sortAndLimitRecentMatches orders newest first and caps to last 5 matches', () => {
  const list = Array.from({ length: 7 }, (_, i) =>
    normalizeMatchResult(`m-${i}`, {
      uid: 'u1',
      victory: i % 2 === 0,
      heroId: 'nina',
      mode: 'superstar',
      kills: i,
      placement: 1,
      trophyDelta: 20,
      playedAtMs: 1000 + i * 500,
    })
  );

  const top5 = sortAndLimitRecentMatches(list);
  assert.equal(top5.length, RECENT_MATCHES_LIMIT);
  assert.deepEqual(
    top5.map((m) => m.id),
    ['m-6', 'm-5', 'm-4', 'm-3', 'm-2']
  );
});

test('formatMatchDateTime and GAME_MODE_LABELS produce readable outputs', () => {
  const formatted = formatMatchDateTime(1763290000000, 'pt-BR');
  assert.ok(formatted.includes('·'));
  assert.equal(formatMatchDateTime(0), 'Data indisponível');
  assert.equal(GAME_MODE_LABELS.tower, 'Cerco à Torre');
});
