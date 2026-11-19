import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMOTE_CATALOG,
  EMOTE_COOLDOWN_SEC,
  canTriggerEmote,
  computeEmoteWheelSlots,
  getEmoteCooldownRemaining,
  isValidEmoteId,
  pickBotReactionEmote,
  resolveEmoteSelectionFromOffset,
} from './emotes';

test('EMOTE_CATALOG exposes 6 unique emotes including GG, Smile, and Angry', () => {
  assert.equal(EMOTE_CATALOG.length, 6);
  const ids = new Set(EMOTE_CATALOG.map((e) => e.id));
  assert.equal(ids.size, 6);
  assert.equal(isValidEmoteId('gg'), true);
  assert.equal(isValidEmoteId('smile'), true);
  assert.equal(isValidEmoteId('angry'), true);
  assert.equal(isValidEmoteId('unknown'), false);
});

test('computeEmoteWheelSlots places slot 0 at top and distributes remaining slots symmetrically', () => {
  const slots = computeEmoteWheelSlots(EMOTE_CATALOG, 100);
  assert.equal(slots.length, 6);
  assert.equal(slots[0].emote.id, 'gg');
  assert.equal(Math.round(slots[0].x), 0);
  assert.equal(Math.round(slots[0].y), -100);
  // Bottom slot (index 3) sits directly opposite at (0, +100)
  assert.equal(slots[3].emote.id, 'angry');
  assert.equal(Math.round(slots[3].x), 0);
  assert.equal(Math.round(slots[3].y), 100);
});

test('resolveEmoteSelectionFromOffset returns null inside deadzone and selects accurate radial wedges', () => {
  assert.equal(resolveEmoteSelectionFromOffset(0, 0), null);
  assert.equal(resolveEmoteSelectionFromOffset(10, -12), null);

  // Straight up -> slot 0 ('gg')
  assert.equal(resolveEmoteSelectionFromOffset(0, -80)?.id, 'gg');
  // Upper right (~ -30 deg) -> slot 1 ('smile')
  assert.equal(resolveEmoteSelectionFromOffset(75, -43)?.id, 'smile');
  // Lower right (~ +30 deg) -> slot 2 ('nice')
  assert.equal(resolveEmoteSelectionFromOffset(75, 43)?.id, 'nice');
  // Straight down -> slot 3 ('angry')
  assert.equal(resolveEmoteSelectionFromOffset(0, 80)?.id, 'angry');
  // Lower left -> slot 4 ('oops')
  assert.equal(resolveEmoteSelectionFromOffset(-75, 43)?.id, 'oops');
  // Upper left -> slot 5 ('taunt')
  assert.equal(resolveEmoteSelectionFromOffset(-75, -43)?.id, 'taunt');
});

test('emote cooldown gating blocks spam and unlocks cleanly after EMOTE_COOLDOWN_SEC', () => {
  assert.equal(canTriggerEmote(null, 1000), true);
  assert.equal(getEmoteCooldownRemaining(null, 1000), 0);

  assert.equal(canTriggerEmote(1000, 1500), false);
  const rem = getEmoteCooldownRemaining(1000, 1500);
  assert.ok(Math.abs(rem - (EMOTE_COOLDOWN_SEC - 0.5)) < 0.001);

  assert.equal(canTriggerEmote(1000, 1000 + EMOTE_COOLDOWN_SEC * 1000), true);
  assert.equal(getEmoteCooldownRemaining(1000, 1000 + EMOTE_COOLDOWN_SEC * 1000), 0);
});

test('pickBotReactionEmote returns social responses appropriate to trigger context', () => {
  assert.equal(pickBotReactionEmote('reply', 'angry', 0.1), 'taunt');
  assert.equal(pickBotReactionEmote('reply', 'gg', 0.1), 'gg');
  assert.equal(pickBotReactionEmote('kill', undefined, 0.5), 'taunt');
  assert.equal(pickBotReactionEmote('low_hp', undefined, 0.2), 'oops');
});
