import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_LIST } from './heroes';
import { soundEngine } from './audio';
import {
  HERO_VOICE_LINES,
  HERO_VOICE_PROFILES,
  VoiceLineContext,
  getHeroVoiceProfile,
  pickHeroVoiceLine,
} from './voiceLines';

test('all 21 heroes define thematic voice lines for select, match_start, and kill contexts', () => {
  const contexts: VoiceLineContext[] = ['select', 'match_start', 'kill'];
  for (const hero of HERO_LIST) {
    const lines = HERO_VOICE_LINES[hero.id];
    const profile = HERO_VOICE_PROFILES[hero.id];
    assert.ok(lines, `Missing voice lines for ${hero.id}`);
    assert.ok(profile, `Missing voice profile for ${hero.id}`);
    assert.ok(profile.pitch >= 0.5 && profile.pitch <= 1.5);
    assert.ok(profile.rate >= 0.7 && profile.rate <= 1.4);

    for (const ctx of contexts) {
      assert.equal(lines[ctx].length, 3, `${hero.id}.${ctx} should have 3 lines`);
      for (const line of lines[ctx]) {
        assert.ok(line.trim().length >= 8);
      }
    }
  }
});

test('pickHeroVoiceLine selects from pool and avoids immediate repetition', () => {
  const pool = HERO_VOICE_LINES.steelshot.select;
  const first = pickHeroVoiceLine('steelshot', 'select', null, () => 0);
  assert.equal(first, pool[0]);

  const second = pickHeroVoiceLine('steelshot', 'select', first, () => 0);
  assert.notEqual(second, first);
  assert.ok(pool.includes(second));

  const profile = getHeroVoiceProfile('kong');
  assert.equal(profile.cadenceStyle, 'heavy');
});

test('soundEngine.playVoiceLine triggers thematic events, notifies listeners, and respects mute', () => {
  soundEngine.setMuted(false);
  const received: string[] = [];
  const unsub = soundEngine.subscribeVoiceLine((ev) => {
    received.push(`${ev.heroId}:${ev.context}:${ev.text}`);
  });

  const baseCount = soundEngine.getVoiceLineTriggerCount();
  const ev1 = soundEngine.playVoiceLine('raidon', 'select');
  assert.ok(ev1);
  assert.equal(ev1.heroId, 'raidon');
  assert.equal(ev1.context, 'select');
  assert.ok(HERO_VOICE_LINES.raidon.select.includes(ev1.text as never));
  assert.equal(soundEngine.getVoiceLineTriggerCount(), baseCount + 1);
  assert.equal(soundEngine.getLastVoiceLine()?.id, ev1.id);
  assert.equal(received.length, 1);

  const ev2 = soundEngine.playVoiceLine('phoenix', 'match_start');
  assert.ok(ev2);
  assert.equal(ev2.context, 'match_start');
  assert.equal(received.length, 2);

  soundEngine.setMuted(true);
  const mutedAttempt = soundEngine.playVoiceLine('kong', 'kill');
  assert.equal(mutedAttempt, null);
  assert.equal(soundEngine.getVoiceLineTriggerCount(), baseCount + 2);

  soundEngine.setMuted(false);
  const killEv = soundEngine.playVoiceLine('kong', 'kill');
  assert.ok(killEv);
  assert.equal(killEv.context, 'kill');
  const throttledKill = soundEngine.playVoiceLine('kong', 'kill');
  assert.equal(throttledKill, null);
  unsub();
});
