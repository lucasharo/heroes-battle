import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ElevenLabsAccountVoice,
  HERO_ELEVENLABS_SPECS,
  getHeroElevenLabsSpec,
  resolveVoiceForHero,
  sanitizeTtsRequest,
} from './elevenlabs.ts';

const MOCK_VOICES: ElevenLabsAccountVoice[] = [
  { voice_id: 'v-adam', name: 'Adam - Narration', labels: { gender: 'male' } },
  { voice_id: 'v-charlotte', name: 'Charlotte', labels: { gender: 'female' } },
  { voice_id: 'v-liam', name: 'Liam', labels: { gender: 'male' } },
  { voice_id: 'v-rachel', name: 'Rachel', labels: { gender: 'female' } },
  { voice_id: 'v-gigi', name: 'Gigi', labels: { gender: 'female' } },
  { voice_id: 'v-clyde', name: 'Clyde', labels: { gender: 'male' } },
];

test('all 21 heroes have valid ElevenLabs voice specifications', () => {
  const heroIds = Object.keys(HERO_ELEVENLABS_SPECS);
  assert.equal(heroIds.length, 21);
  for (const id of heroIds) {
    const spec = getHeroElevenLabsSpec(id);
    assert.ok(spec.preferredVoiceNames.length >= 4);
    assert.ok(spec.stability >= 0 && spec.stability <= 1);
    assert.ok(spec.similarityBoost >= 0 && spec.similarityBoost <= 1);
    assert.ok(spec.style >= 0 && spec.style <= 1);
  }
});

test('resolveVoiceForHero matches preferred names and falls back by gender deterministically', () => {
  assert.equal(resolveVoiceForHero('kong', MOCK_VOICES)?.voice_id, 'v-clyde');
  assert.equal(resolveVoiceForHero('phoenix', MOCK_VOICES)?.voice_id, 'v-rachel');
  assert.equal(resolveVoiceForHero('nina', MOCK_VOICES)?.voice_id, 'v-gigi');
  assert.equal(resolveVoiceForHero('raidon', MOCK_VOICES)?.voice_id, 'v-liam');

  // When preferred names don't exist in custom account voices, matches gender cleanly
  const customOnly: ElevenLabsAccountVoice[] = [
    { voice_id: 'custom-m1', name: 'Guerreiro BR', labels: { gender: 'male' } },
    { voice_id: 'custom-f1', name: 'Maga BR', labels: { gender: 'female' } },
  ];
  assert.equal(resolveVoiceForHero('solara', customOnly)?.voice_id, 'custom-f1');
  assert.equal(resolveVoiceForHero('boulder', customOnly)?.voice_id, 'custom-m1');
});

test('sanitizeTtsRequest validates heroId and bounded text safely', () => {
  assert.deepEqual(sanitizeTtsRequest({ heroId: 'raidon', text: 'Olá arena!' }), {
    heroId: 'raidon',
    text: 'Olá arena!',
  });
  assert.equal(sanitizeTtsRequest({ heroId: 'unknown', text: 'Olá' }), null);
  assert.equal(sanitizeTtsRequest({ heroId: 'raidon', text: '   ' }), null);
  assert.equal(sanitizeTtsRequest({ heroId: 'raidon', text: 'a'.repeat(241) }), null);
});
