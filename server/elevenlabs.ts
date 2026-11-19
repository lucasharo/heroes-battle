export type ElevenLabsVoiceArchetype =
  | 'heavy'
  | 'sharp'
  | 'mystic'
  | 'energetic'
  | 'robotic';

export interface HeroElevenLabsSpec {
  gender: 'male' | 'female';
  archetype: ElevenLabsVoiceArchetype;
  preferredVoiceNames: readonly string[];
  stability: number;
  similarityBoost: number;
  style: number;
}

export interface ElevenLabsAccountVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string | undefined>;
}

export const HERO_ELEVENLABS_SPECS: Record<string, HeroElevenLabsSpec> = {
  raidon: {
    gender: 'male',
    archetype: 'sharp',
    preferredVoiceNames: ['Liam', 'Callum', 'Daniel', 'Charlie', 'Brian'],
    stability: 0.42,
    similarityBoost: 0.82,
    style: 0.45,
  },
  veinka: {
    gender: 'female',
    archetype: 'sharp',
    preferredVoiceNames: ['Charlotte', 'Domi', 'Bella', 'Laura', 'Sarah'],
    stability: 0.44,
    similarityBoost: 0.8,
    style: 0.42,
  },
  kong: {
    gender: 'male',
    archetype: 'heavy',
    preferredVoiceNames: ['Clyde', 'Adam', 'Bill', 'George', 'Arnold'],
    stability: 0.56,
    similarityBoost: 0.85,
    style: 0.55,
  },
  phoenix: {
    gender: 'female',
    archetype: 'mystic',
    preferredVoiceNames: ['Rachel', 'Serena', 'Matilda', 'Charlotte', 'Sarah'],
    stability: 0.48,
    similarityBoost: 0.82,
    style: 0.52,
  },
  steelshot: {
    gender: 'male',
    archetype: 'robotic',
    preferredVoiceNames: ['Brian', 'Chris', 'Callum', 'Daniel', 'Josh'],
    stability: 0.62,
    similarityBoost: 0.82,
    style: 0.3,
  },
  eldragon: {
    gender: 'male',
    archetype: 'energetic',
    preferredVoiceNames: ['Charlie', 'Josh', 'Will', 'Liam', 'Chris'],
    stability: 0.36,
    similarityBoost: 0.8,
    style: 0.62,
  },
  cluster: {
    gender: 'male',
    archetype: 'energetic',
    preferredVoiceNames: ['Will', 'Patrick', 'Sam', 'Charlie', 'Josh'],
    stability: 0.34,
    similarityBoost: 0.78,
    style: 0.68,
  },
  velvet: {
    gender: 'female',
    archetype: 'mystic',
    preferredVoiceNames: ['Lily', 'Serena', 'Rachel', 'Jessica', 'Sarah'],
    stability: 0.5,
    similarityBoost: 0.84,
    style: 0.48,
  },
  meiro: {
    gender: 'male',
    archetype: 'sharp',
    preferredVoiceNames: ['George', 'Daniel', 'Thomas', 'Brian', 'Liam'],
    stability: 0.6,
    similarityBoost: 0.85,
    style: 0.32,
  },
  baston: {
    gender: 'male',
    archetype: 'heavy',
    preferredVoiceNames: ['Bill', 'George', 'Brian', 'Adam', 'Clyde'],
    stability: 0.58,
    similarityBoost: 0.85,
    style: 0.4,
  },
  nina: {
    gender: 'female',
    archetype: 'energetic',
    preferredVoiceNames: ['Gigi', 'Jessica', 'Laura', 'Bella', 'Mimi'],
    stability: 0.32,
    similarityBoost: 0.78,
    style: 0.65,
  },
  drake: {
    gender: 'male',
    archetype: 'sharp',
    preferredVoiceNames: ['Daniel', 'Callum', 'Brian', 'Liam', 'George'],
    stability: 0.54,
    similarityBoost: 0.85,
    style: 0.34,
  },
  knox: {
    gender: 'male',
    archetype: 'energetic',
    preferredVoiceNames: ['Chris', 'Will', 'Charlie', 'Josh', 'Patrick'],
    stability: 0.35,
    similarityBoost: 0.8,
    style: 0.6,
  },
  kairo: {
    gender: 'male',
    archetype: 'sharp',
    preferredVoiceNames: ['Liam', 'Chris', 'Daniel', 'Thomas', 'Josh'],
    stability: 0.52,
    similarityBoost: 0.82,
    style: 0.38,
  },
  boulder: {
    gender: 'male',
    archetype: 'heavy',
    preferredVoiceNames: ['Arnold', 'Clyde', 'Bill', 'Adam', 'George'],
    stability: 0.64,
    similarityBoost: 0.86,
    style: 0.46,
  },
  ryder: {
    gender: 'male',
    archetype: 'sharp',
    preferredVoiceNames: ['Callum', 'Liam', 'Daniel', 'Chris', 'Charlie'],
    stability: 0.45,
    similarityBoost: 0.82,
    style: 0.44,
  },
  solara: {
    gender: 'female',
    archetype: 'mystic',
    preferredVoiceNames: ['Sarah', 'Matilda', 'Rachel', 'Lily', 'Charlotte'],
    stability: 0.52,
    similarityBoost: 0.84,
    style: 0.42,
  },
  frost: {
    gender: 'male',
    archetype: 'mystic',
    preferredVoiceNames: ['Thomas', 'George', 'Daniel', 'Brian', 'Callum'],
    stability: 0.58,
    similarityBoost: 0.84,
    style: 0.35,
  },
  valkyria: {
    gender: 'female',
    archetype: 'energetic',
    preferredVoiceNames: ['Laura', 'Charlotte', 'Matilda', 'Bella', 'Sarah'],
    stability: 0.4,
    similarityBoost: 0.82,
    style: 0.56,
  },
  kronos: {
    gender: 'male',
    archetype: 'mystic',
    preferredVoiceNames: ['George', 'Adam', 'Daniel', 'Bill', 'Brian'],
    stability: 0.6,
    similarityBoost: 0.86,
    style: 0.44,
  },
  titanx: {
    gender: 'male',
    archetype: 'robotic',
    preferredVoiceNames: ['Adam', 'Brian', 'Arnold', 'Clyde', 'Bill'],
    stability: 0.68,
    similarityBoost: 0.85,
    style: 0.25,
  },
};

function hashHeroKey(heroId: string): number {
  let h = 0;
  for (let i = 0; i < heroId.length; i += 1) {
    h = (h * 31 + heroId.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getHeroElevenLabsSpec(heroId: string): HeroElevenLabsSpec {
  return (
    HERO_ELEVENLABS_SPECS[heroId] ?? {
      gender: 'male',
      archetype: 'sharp',
      preferredVoiceNames: ['Liam', 'Brian', 'Daniel', 'Adam'],
      stability: 0.48,
      similarityBoost: 0.82,
      style: 0.4,
    }
  );
}

export function resolveVoiceForHero(
  heroId: string,
  availableVoices: readonly ElevenLabsAccountVoice[]
): ElevenLabsAccountVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;
  const spec = getHeroElevenLabsSpec(heroId);

  // 1. Match preferred named voices (handles e.g. "Adam" or "Adam - Deep Narrator")
  for (const preferred of spec.preferredVoiceNames) {
    const target = preferred.toLowerCase();
    const match = availableVoices.find((v) => {
      const n = (v.name || '').trim().toLowerCase();
      return n === target || n.startsWith(`${target} `) || n.startsWith(`${target}-`);
    });
    if (match) return match;
  }

  // 2. Match voices sharing the hero's gender label
  const genderPool = availableVoices.filter(
    (v) => (v.labels?.gender || '').trim().toLowerCase() === spec.gender
  );
  const pool = genderPool.length > 0 ? genderPool : availableVoices;

  // 3. Deterministic pick per heroId so heroes keep distinct voices
  const idx = hashHeroKey(heroId) % pool.length;
  return pool[idx];
}

export function sanitizeTtsRequest(payload: unknown): {
  heroId: string;
  text: string;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const heroId = typeof raw.heroId === 'string' ? raw.heroId.trim().toLowerCase() : '';
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';

  if (!heroId || !(heroId in HERO_ELEVENLABS_SPECS)) return null;
  if (!text || text.length > 240) return null;

  return { heroId, text };
}
