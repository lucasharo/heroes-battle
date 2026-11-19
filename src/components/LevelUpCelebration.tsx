import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../game/audio';
import {
  LEVEL_UP_ANIMATION_DURATION_MS,
  LevelCounterFrame,
  LevelUpEvent,
  computeLevelCounterFrame,
} from '../game/levelUp';

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'star' | 'diamond' | 'mote';
}

interface PulseRing {
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export const LevelUpBackdropSparkles: React.FC<{ activeKey: string }> = ({ activeKey }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let viewW = window.innerWidth;
    let viewH = window.innerHeight;

    const syncSize = () => {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(viewW * dpr));
      canvas.height = Math.max(1, Math.floor(viewH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncSize();
    window.addEventListener('resize', syncSize);

    const palette = ['#fde047', '#fbbf24', '#38bdf8', '#a5f3fc', '#ffffff'];
    const particles: SparkleParticle[] = [];
    const rings: PulseRing[] = [
      {
        radius: 20,
        maxRadius: Math.max(viewW, viewH) * 0.44,
        color: '#fde047',
        alpha: 0.78,
        lineWidth: 5,
      },
      {
        radius: 10,
        maxRadius: Math.max(viewW, viewH) * 0.34,
        color: '#38bdf8',
        alpha: 0.65,
        lineWidth: 3.5,
      },
    ];

    const spawnRadialSparkles = (ox: number, oy: number, count: number, minSpeed: number, maxSpeed: number) => {
      for (let i = 0; i < count; i += 1) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const spd = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const maxLife = 1.6 + Math.random() * 1.4;
        const roll = Math.random();
        particles.push({
          x: ox,
          y: oy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 45,
          size: roll < 0.45 ? 7 + Math.random() * 6 : 4 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 3.8,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 6 + Math.random() * 7,
          color: palette[i % palette.length],
          life: maxLife,
          maxLife,
          kind: roll < 0.55 ? 'star' : roll < 0.84 ? 'diamond' : 'mote',
        });
      }
    };

    const spawnAmbientGlint = () => {
      const maxLife = 1.2 + Math.random() * 1.1;
      particles.push({
        x: viewW * (0.2 + Math.random() * 0.6),
        y: viewH * (0.3 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 28,
        vy: -36 - Math.random() * 54,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 2.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 7 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: maxLife,
        maxLife,
        kind: Math.random() < 0.7 ? 'star' : 'mote',
      });
    };

    // Wave 1: Initial burst around center modal
    spawnRadialSparkles(viewW * 0.5, viewH * 0.42, 34, 150, 440);

    // Wave 2: Secondary ascension burst timed with the level counter crossing into the new level
    const wave2Timer = window.setTimeout(() => {
      spawnRadialSparkles(viewW * 0.5, viewH * 0.36, 44, 210, 560);
      rings.push({
        radius: 18,
        maxRadius: Math.max(viewW, viewH) * 0.48,
        color: '#fbbf24',
        alpha: 0.85,
        lineWidth: 6,
      });
    }, 480);

    let rafId = 0;
    let lastTs = performance.now();
    let elapsedTotal = 0;
    let ambientTimer = 0;

    const drawFourPointStar = (radius: number) => {
      const inner = radius * 0.28;
      ctx.beginPath();
      for (let k = 0; k < 8; k += 1) {
        const r = k % 2 === 0 ? radius : inner;
        const a = (k * Math.PI) / 4;
        if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      elapsedTotal += dt;
      ambientTimer += dt;

      if (elapsedTotal < 3.4 && ambientTimer >= 0.085) {
        ambientTimer = 0;
        spawnAmbientGlint();
      }

      ctx.clearRect(0, 0, viewW, viewH);

      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const ring = rings[i];
        ring.radius += (ring.maxRadius - ring.radius) * Math.min(1, dt * 5.2) + 110 * dt;
        ring.alpha -= dt * 0.85;
        if (ring.alpha <= 0.01) {
          rings.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ring.alpha);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.beginPath();
        ctx.arc(viewW * 0.5, viewH * 0.42, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const drag = Math.exp(-2.1 * dt);
        p.vx *= drag;
        p.vy = p.vy * drag - 22 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;
        p.twinklePhase += p.twinkleSpeed * dt;

        const lifeRatio = Math.min(1, p.life / 0.55);
        const twinkle = 0.55 + 0.45 * Math.sin(p.twinklePhase);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, lifeRatio * twinkle));
        ctx.fillStyle = p.color;

        if (p.kind === 'star') {
          drawFourPointStar(p.size * (0.85 + 0.3 * twinkle));
        } else if (p.kind === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.8);
          ctx.lineTo(p.size * 0.5, 0);
          ctx.lineTo(0, p.size * 0.8);
          ctx.lineTo(-p.size * 0.5, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.length > 0 || rings.length > 0 || elapsedTotal < 3.5) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', syncSize);
      window.clearTimeout(wave2Timer);
      cancelAnimationFrame(rafId);
    };
  }, [activeKey]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[5]" aria-hidden="true">
      <div
        className="animate-levelup-halo absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full opacity-28"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, rgba(56, 189, 248, 0.28) 0deg 8deg, transparent 8deg 24deg, rgba(251, 191, 36, 0.25) 24deg 32deg, transparent 32deg 48deg)',
          maskImage: 'radial-gradient(circle, rgba(0,0,0,0.95) 14%, rgba(0,0,0,0.4) 44%, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(circle, rgba(0,0,0,0.95) 14%, rgba(0,0,0,0.4) 44%, transparent 72%)',
        }}
      />
      <canvas ref={canvasRef} data-testid="levelup-sparkles-canvas" className="absolute inset-0 w-full h-full" />
    </div>
  );
};

interface LevelUpShowcaseProps {
  event: LevelUpEvent;
  onDisplayedLevelChange?: (displayedLevel: number) => void;
}

const SPARKLE_POSITIONS: ReadonlyArray<{
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay: string;
  color: string;
  size: number;
}> = [
  { top: '-6px', left: '-6px', delay: '0ms', color: '#fde047', size: 14 },
  { top: '-8px', right: '-4px', delay: '260ms', color: '#38bdf8', size: 12 },
  { bottom: '-6px', left: '2px', delay: '520ms', color: '#a5f3fc', size: 11 },
  { bottom: '-6px', right: '-6px', delay: '780ms', color: '#fbbf24', size: 14 },
];

export const LevelUpShowcase: React.FC<LevelUpShowcaseProps> = ({
  event,
  onDisplayedLevelChange,
}) => {
  const [frame, setFrame] = useState<LevelCounterFrame>(() =>
    computeLevelCounterFrame(event, 0, LEVEL_UP_ANIMATION_DURATION_MS)
  );
  const lastSoundLevelRef = useRef<number>(event.previousLevel);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      const settled = computeLevelCounterFrame(
        event,
        LEVEL_UP_ANIMATION_DURATION_MS,
        LEVEL_UP_ANIMATION_DURATION_MS
      );
      setFrame(settled);
      onDisplayedLevelChange?.(settled.displayedLevel);
      if (lastSoundLevelRef.current < event.newLevel) {
        lastSoundLevelRef.current = event.newLevel;
        soundEngine.playLevelUp();
      }
      return;
    }

    lastSoundLevelRef.current = event.previousLevel;
    let rafId = 0;
    const startTs = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTs;
      const nextFrame = computeLevelCounterFrame(
        event,
        elapsed,
        LEVEL_UP_ANIMATION_DURATION_MS
      );
      setFrame(nextFrame);
      onDisplayedLevelChange?.(nextFrame.displayedLevel);

      if (nextFrame.displayedLevel > lastSoundLevelRef.current) {
        lastSoundLevelRef.current = nextFrame.displayedLevel;
        soundEngine.playLevelUp();
      }

      if (elapsed < LEVEL_UP_ANIMATION_DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [event, onDisplayedLevelChange]);

  const isAscending = frame.justLeveledUp;

  return (
    <div
      data-testid="levelup-showcase"
      data-phase={frame.phase}
      className="relative overflow-hidden rounded-xl border border-amber-400/75 px-3.5 py-3 shadow-lg"
      style={{
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.96) 0%, rgba(49, 46, 129, 0.86) 52%, rgba(23, 37, 84, 0.95) 100%)',
        boxShadow: isAscending
          ? '0 0 28px rgba(251, 191, 36, 0.34), inset 0 1px 0 rgba(253, 224, 71, 0.35)'
          : '0 0 14px rgba(56, 189, 248, 0.22)',
      }}
    >
      {/* Diagonal golden sheen sweep */}
      <div
        className="animate-victory-sheen pointer-events-none absolute inset-y-0 w-24"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(253, 224, 71, 0.26) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3.5">
        {/* Animated Crest + Sparkle Orbits + Numeric Level Counter */}
        <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
          <div
            className="animate-levelup-ring pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-300/65"
            aria-hidden="true"
          />
          <div
            className="animate-levelup-halo pointer-events-none absolute -inset-1 rounded-2xl opacity-75"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(251, 191, 36, 0.75), rgba(56, 189, 248, 0.15), rgba(253, 224, 71, 0.85), rgba(56, 189, 248, 0.2), rgba(251, 191, 36, 0.75))',
              padding: '2px',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            }}
            aria-hidden="true"
          />

          <div
            key={frame.displayedLevel}
            className={`relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center shadow-inner ${
              isAscending ? 'animate-levelup-pop' : ''
            }`}
            style={{
              background:
                'radial-gradient(circle at 30% 25%, #fef08a 0%, #f59e0b 48%, #78350f 100%)',
              borderColor: '#fef08a',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.5)',
            }}
          >
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-950/85 leading-none">
              Nível
            </span>
            <span
              data-testid="levelup-counter-value"
              className="font-display text-3xl font-extrabold text-slate-950 tabular-nums leading-none mt-0.5"
            >
              {frame.displayedLevel}
            </span>
          </div>

          {SPARKLE_POSITIONS.map((sp, idx) => (
            <svg
              key={idx}
              width={sp.size}
              height={sp.size}
              viewBox="0 0 24 24"
              fill={sp.color}
              aria-hidden="true"
              className="animate-levelup-sparkle pointer-events-none absolute"
              style={{
                top: sp.top,
                bottom: sp.bottom,
                left: sp.left,
                right: sp.right,
                animationDelay: sp.delay,
              }}
            >
              <path d="M12 1L14.7 9.3L23 12L14.7 14.7L12 23L9.3 14.7L1 12L9.3 9.3L12 1Z" />
            </svg>
          ))}
        </div>

        {/* Title, Incrementing XP Counter & Animated Bar */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-2xl font-extrabold tracking-wide text-amber-300 leading-none">
                Subiu de Nível!
              </span>
              <span className="text-xs font-mono-num font-bold text-cyan-200 whitespace-nowrap">
                Nv. {event.previousLevel} → Nv. {frame.displayedLevel}
              </span>
            </div>
            <span
              data-testid="levelup-xp-gain"
              className="text-xs font-mono-num font-extrabold text-emerald-300 tabular-nums whitespace-nowrap"
            >
              +{frame.displayedXpGained} XP
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <div className="relative flex-1 h-2.5 rounded-full bg-slate-950/90 border border-slate-700/80 overflow-hidden">
              <div
                data-testid="levelup-progress-bar"
                className="h-full rounded-full transition-[width] duration-75"
                style={{
                  width: `${frame.barFillPct}%`,
                  background: isAscending
                    ? 'linear-gradient(90deg, #38bdf8 0%, #fde047 55%, #f59e0b 100%)'
                    : 'linear-gradient(90deg, #22d3ee 0%, #38bdf8 100%)',
                }}
              />
            </div>
            <span
              data-testid="levelup-total-xp"
              className="text-[11px] font-mono-num font-bold text-slate-200 tabular-nums shrink-0"
            >
              {frame.displayedTotalXp} XP
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300 font-mono-num tabular-nums">
            <span>
              {frame.phase === 'charging'
                ? 'Carregando barra de experiência...'
                : `Novo patamar alcançado: Nível ${event.newLevel}`}
            </span>
            <span>
              {event.currentLevelXp}/{event.nextLevelXpTarget} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
