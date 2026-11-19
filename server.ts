import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  type ElevenLabsAccountVoice,
  getHeroElevenLabsSpec,
  resolveVoiceForHero,
  sanitizeTtsRequest,
} from './server/elevenlabs.ts';

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' ||
  (fs.existsSync(path.join(DIST_DIR, 'index.html')) &&
    process.env.npm_lifecycle_event === 'start');

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const VOICE_LIST_TTL_MS = 10 * 60 * 1000;
const MAX_AUDIO_CACHE_ENTRIES = 220;

let cachedVoices: ElevenLabsAccountVoice[] = [];
let cachedVoicesFetchedAt = 0;
let voicesFetchPromise: Promise<ElevenLabsAccountVoice[]> | null = null;

const audioCache = new Map<string, Buffer>();
const inFlightTts = new Map<string, Promise<Buffer>>();

function getElevenLabsKey(): string {
  return (process.env.ELEVENLABS_API_KEY || '').trim();
}

async function fetchAccountVoices(apiKey: string): Promise<ElevenLabsAccountVoice[]> {
  const now = Date.now();
  if (cachedVoices.length > 0 && now - cachedVoicesFetchedAt < VOICE_LIST_TTL_MS) {
    return cachedVoices;
  }
  if (voicesFetchPromise) {
    return voicesFetchPromise;
  }

  voicesFetchPromise = (async () => {
    const res = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const err = new Error(
        `ElevenLabs /voices failed (${res.status}): ${detail.slice(0, 200)}`
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = (await res.json()) as { voices?: ElevenLabsAccountVoice[] };
    const list = Array.isArray(json.voices) ? json.voices : [];
    if (list.length > 0) {
      cachedVoices = list;
      cachedVoicesFetchedAt = Date.now();
    }
    return list;
  })().finally(() => {
    voicesFetchPromise = null;
  });

  return voicesFetchPromise;
}

async function synthesizeWithElevenLabs(
  apiKey: string,
  voiceId: string,
  text: string,
  heroId: string,
  modelId: string
): Promise<Buffer> {
  const spec = getHeroElevenLabsSpec(heroId);
  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(
    voiceId
  )}?output_format=mp3_44100_128`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: spec.stability,
        similarity_boost: spec.similarityBoost,
        style: spec.style,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(
      `ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 260)}`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function setCachedAudio(key: string, buf: Buffer) {
  if (audioCache.has(key)) {
    audioCache.delete(key);
  } else if (audioCache.size >= MAX_AUDIO_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(key, buf);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/tts/status', async (_req, res) => {
    const apiKey = getElevenLabsKey();
    if (!apiKey) {
      return res.json({
        configured: false,
        provider: 'unconfigured',
        voiceCount: 0,
      });
    }

    try {
      const voices = await fetchAccountVoices(apiKey);
      return res.json({
        configured: true,
        provider: 'elevenlabs',
        voiceCount: voices.length,
      });
    } catch (err) {
      const status = (err as { status?: number }).status || 502;
      return res.status(status).json({
        configured: true,
        provider: 'elevenlabs',
        error: err instanceof Error ? err.message : 'Falha ao consultar vozes ElevenLabs.',
      });
    }
  });

  app.post('/api/tts', async (req, res) => {
    const apiKey = getElevenLabsKey();
    if (!apiKey) {
      return res.status(503).json({
        error:
          'Chave ELEVENLABS_API_KEY não configurada em Settings > Secrets.',
      });
    }

    const parsed = sanitizeTtsRequest(req.body);
    if (!parsed) {
      return res.status(400).json({ error: 'Parâmetros de voz inválidos.' });
    }

    const { heroId, text } = parsed;
    const cacheKey = `${heroId}::${text}`;

    const cached = audioCache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Voice-Provider', 'elevenlabs');
      res.setHeader('X-TTS-Cache', 'HIT');
      return res.send(cached);
    }

    try {
      let pending = inFlightTts.get(cacheKey);
      if (!pending) {
        pending = (async () => {
          const voices = await fetchAccountVoices(apiKey);
          const selectedVoice = resolveVoiceForHero(heroId, voices);
          if (!selectedVoice) {
            const err = new Error('Nenhuma voz encontrada na sua conta ElevenLabs.') as Error & {
              status?: number;
            };
            err.status = 404;
            throw err;
          }

          try {
            return await synthesizeWithElevenLabs(
              apiKey,
              selectedVoice.voice_id,
              text,
              heroId,
              'eleven_multilingual_v2'
            );
          } catch (primaryErr) {
            const code = (primaryErr as { status?: number }).status;
            if (code === 400 || code === 404 || code === 422) {
              return await synthesizeWithElevenLabs(
                apiKey,
                selectedVoice.voice_id,
                text,
                heroId,
                'eleven_flash_v2_5'
              );
            }
            throw primaryErr;
          }
        })();

        inFlightTts.set(cacheKey, pending);
        pending.finally(() => {
          if (inFlightTts.get(cacheKey) === pending) {
            inFlightTts.delete(cacheKey);
          }
        });
      }

      const audioBuffer = await pending;
      setCachedAudio(cacheKey, audioBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Voice-Provider', 'elevenlabs');
      res.setHeader('X-TTS-Cache', 'MISS');
      return res.send(audioBuffer);
    } catch (err) {
      const status = (err as { status?: number }).status || 502;
      const message =
        err instanceof Error ? err.message : 'Erro ao sintetizar voz na ElevenLabs.';
      console.error('[TTS ElevenLabs]', message);
      return res.status(status).json({ error: message });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
