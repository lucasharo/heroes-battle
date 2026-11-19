export type EmoteId = 'gg' | 'smile' | 'angry' | 'nice' | 'oops' | 'taunt';

export type BotEmoteTrigger = 'kill' | 'low_hp' | 'reply' | 'victory';

export interface EmoteDef {
  id: EmoteId;
  label: string;
  bubbleText: string;
  hotkey: string;
  accent: string;
  bgTint: string;
  borderColor: string;
  ariaLabel: string;
}

export interface EmoteWheelSlot {
  emote: EmoteDef;
  index: number;
  angleRad: number;
  angleDeg: number;
  x: number;
  y: number;
}

export const EMOTE_COOLDOWN_SEC = 2.4;
export const EMOTE_BUBBLE_DURATION_MS = 3000;
export const EMOTE_WHEEL_DEADZONE_PX = 24;

export const EMOTE_CATALOG: readonly EmoteDef[] = [
  {
    id: 'gg',
    label: 'GG!',
    bubbleText: 'GG!',
    hotkey: '1',
    accent: '#fbbf24',
    bgTint: 'rgba(245, 158, 11, 0.22)',
    borderColor: '#fbbf24',
    ariaLabel: 'Enviar emote GG!',
  },
  {
    id: 'smile',
    label: 'Sorriso',
    bubbleText: 'Sorriso!',
    hotkey: '2',
    accent: '#34d399',
    bgTint: 'rgba(16, 185, 129, 0.22)',
    borderColor: '#34d399',
    ariaLabel: 'Enviar emote Sorriso',
  },
  {
    id: 'nice',
    label: 'Boa!',
    bubbleText: 'Mandou bem!',
    hotkey: '3',
    accent: '#38bdf8',
    bgTint: 'rgba(56, 189, 248, 0.22)',
    borderColor: '#38bdf8',
    ariaLabel: 'Enviar emote Boa!',
  },
  {
    id: 'angry',
    label: 'Raiva',
    bubbleText: 'Grrr!',
    hotkey: '4',
    accent: '#fb7185',
    bgTint: 'rgba(244, 63, 94, 0.24)',
    borderColor: '#fb7185',
    ariaLabel: 'Enviar emote Raiva',
  },
  {
    id: 'oops',
    label: 'Ops!',
    bubbleText: 'Ops!',
    hotkey: '5',
    accent: '#c084fc',
    bgTint: 'rgba(168, 85, 247, 0.22)',
    borderColor: '#c084fc',
    ariaLabel: 'Enviar emote Ops!',
  },
  {
    id: 'taunt',
    label: 'Vem X1!',
    bubbleText: 'Vem X1!',
    hotkey: '6',
    accent: '#f97316',
    bgTint: 'rgba(249, 115, 22, 0.24)',
    borderColor: '#f97316',
    ariaLabel: 'Enviar emote Vem X1!',
  },
];

export const EMOTES_BY_ID: Record<EmoteId, EmoteDef> = EMOTE_CATALOG.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<EmoteId, EmoteDef>
);

export function isValidEmoteId(value: unknown): value is EmoteId {
  return typeof value === 'string' && value in EMOTES_BY_ID;
}

/**
 * Computes evenly spaced radial coordinates starting at -90 deg (12 o'clock)
 * moving clockwise so slot 0 sits cleanly at the top of the wheel.
 */
export function computeEmoteWheelSlots(
  emotes: readonly EmoteDef[] = EMOTE_CATALOG,
  radiusPx = 94
): EmoteWheelSlot[] {
  const count = Math.max(1, emotes.length);
  const stepRad = (Math.PI * 2) / count;
  const startRad = -Math.PI / 2;

  return emotes.map((emote, index) => {
    const angleRad = startRad + index * stepRad;
    const angleDeg = (angleRad * 180) / Math.PI;
    return {
      emote,
      index,
      angleRad,
      angleDeg,
      x: Math.round(Math.cos(angleRad) * radiusPx * 100) / 100,
      y: Math.round(Math.sin(angleRad) * radiusPx * 100) / 100,
    };
  });
}

/**
 * Given a pointer offset (dx, dy) relative to the radial wheel center, returns
 * the matching EmoteDef slice, or null when inside the cancel deadzone.
 */
export function resolveEmoteSelectionFromOffset(
  dx: number,
  dy: number,
  emotes: readonly EmoteDef[] = EMOTE_CATALOG,
  deadzonePx = EMOTE_WHEEL_DEADZONE_PX
): EmoteDef | null {
  if (emotes.length === 0) return null;
  const dist = Math.hypot(dx, dy);
  if (dist < deadzonePx) return null;

  const count = emotes.length;
  const stepRad = (Math.PI * 2) / count;
  // Normalize angle clockwise from top (-PI / 2), shifted by half a wedge so boundaries sit between slots
  const rawAngle = Math.atan2(dy, dx);
  const twoPi = Math.PI * 2;
  const relative = (((rawAngle - -Math.PI / 2 + stepRad / 2) % twoPi) + twoPi) % twoPi;
  const index = Math.floor(relative / stepRad) % count;
  return emotes[index] ?? null;
}

export function getEmoteCooldownRemaining(
  lastSentAtMs: number | null,
  nowMs: number,
  cooldownSec = EMOTE_COOLDOWN_SEC
): number {
  if (lastSentAtMs === null) return 0;
  const elapsedSec = Math.max(0, (nowMs - lastSentAtMs) / 1000);
  return Math.max(0, cooldownSec - elapsedSec);
}

export function canTriggerEmote(
  lastSentAtMs: number | null,
  nowMs: number,
  cooldownSec = EMOTE_COOLDOWN_SEC
): boolean {
  return getEmoteCooldownRemaining(lastSentAtMs, nowMs, cooldownSec) <= 0.001;
}

export function pickBotReactionEmote(
  trigger: BotEmoteTrigger,
  playerEmoteId?: EmoteId,
  roll = Math.random()
): EmoteId {
  const clamped = Math.max(0, Math.min(0.9999, roll));
  switch (trigger) {
    case 'kill':
      return clamped < 0.45 ? 'gg' : clamped < 0.8 ? 'taunt' : 'smile';
    case 'low_hp':
      return clamped < 0.6 ? 'oops' : 'angry';
    case 'victory':
      return clamped < 0.65 ? 'gg' : 'nice';
    case 'reply': {
      if (playerEmoteId === 'angry' || playerEmoteId === 'taunt') {
        return clamped < 0.5 ? 'taunt' : 'angry';
      }
      if (playerEmoteId === 'oops') {
        return clamped < 0.55 ? 'smile' : 'nice';
      }
      return clamped < 0.5 ? 'gg' : clamped < 0.85 ? 'smile' : 'nice';
    }
  }
}
