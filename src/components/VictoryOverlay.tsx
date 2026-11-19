import React, { useEffect, useRef } from 'react';

interface VictoryOverlayProps {
  heroAccent: string;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vRot: number;
  flutterPhase: number;
  flutterSpeed: number;
  color: string;
  shape: 'ribbon' | 'diamond' | 'spark';
  life: number;
  maxLife: number;
}

interface ShockRing {
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({ heroAccent }) => {
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

    const palette = [
      '#fbbf24',
      '#fde047',
      '#f59e0b',
      '#ffffff',
      heroAccent || '#38bdf8',
      '#34d399',
    ];

    const pieces: ConfettiPiece[] = [];
    const rings: ShockRing[] = [
      {
        radius: 28,
        maxRadius: Math.max(viewW, viewH) * 0.42,
        color: '#fbbf24',
        alpha: 0.72,
        lineWidth: 6,
      },
      {
        radius: 16,
        maxRadius: Math.max(viewW, viewH) * 0.34,
        color: heroAccent || '#38bdf8',
        alpha: 0.58,
        lineWidth: 4,
      },
    ];

    const spawnBurst = (
      ox: number,
      oy: number,
      count: number,
      minSpeed: number,
      maxSpeed: number,
      angleMin: number,
      angleMax: number
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = angleMin + Math.random() * (angleMax - angleMin);
        const spd = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const roll = Math.random();
        const shape: ConfettiPiece['shape'] =
          roll < 0.68 ? 'ribbon' : roll < 0.88 ? 'diamond' : 'spark';
        const maxLife = 2.6 + Math.random() * 1.9;
        pieces.push({
          x: ox,
          y: oy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          w: shape === 'ribbon' ? 6 + Math.random() * 6 : 5 + Math.random() * 5,
          h: shape === 'ribbon' ? 10 + Math.random() * 7 : 5 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 8,
          flutterPhase: Math.random() * Math.PI * 2,
          flutterSpeed: 5 + Math.random() * 6,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape,
          life: maxLife,
          maxLife,
        });
      }
    };

    // Wave 1: Immediate center fireworks burst
    spawnBurst(viewW * 0.5, viewH * 0.45, 72, 240, 740, 0, Math.PI * 2);

    // Wave 2: Twin side cannons
    const wave2Timer = window.setTimeout(() => {
      spawnBurst(viewW * 0.14, viewH * 0.72, 48, 420, 820, -Math.PI * 0.46, -Math.PI * 0.14);
      spawnBurst(viewW * 0.86, viewH * 0.72, 48, 420, 820, -Math.PI * 0.86, -Math.PI * 0.54);
    }, 160);

    // Wave 3: Top golden shower
    const wave3Timer = window.setTimeout(() => {
      for (let i = 0; i < 42; i++) {
        const rx = viewW * (0.12 + Math.random() * 0.76);
        const maxLife = 2.8 + Math.random() * 1.4;
        pieces.push({
          x: rx,
          y: -14 - Math.random() * 40,
          vx: (Math.random() - 0.5) * 90,
          vy: 140 + Math.random() * 180,
          w: 7 + Math.random() * 5,
          h: 11 + Math.random() * 6,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 6,
          flutterPhase: Math.random() * Math.PI * 2,
          flutterSpeed: 4 + Math.random() * 5,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: i % 4 === 0 ? 'spark' : 'ribbon',
          life: maxLife,
          maxLife,
        });
      }
    }, 420);

    let rafId = 0;
    let lastTs = performance.now();
    let elapsedTotal = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      elapsedTotal += dt;

      ctx.clearRect(0, 0, viewW, viewH);

      // Expanding victory shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += (ring.maxRadius - ring.radius) * Math.min(1, dt * 6.5) + 120 * dt;
        ring.alpha -= dt * 0.92;
        if (ring.alpha <= 0.01) {
          rings.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ring.alpha);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.beginPath();
        ctx.arc(viewW * 0.5, viewH * 0.48, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Confetti ribbons & golden sparks
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.life -= dt;
        if (p.life <= 0 || p.y > viewH + 40) {
          pieces.splice(i, 1);
          continue;
        }

        const drag = Math.exp(-1.75 * dt);
        p.vx *= drag;
        p.vy = p.vy * drag + 360 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;
        p.flutterPhase += p.flutterSpeed * dt;

        const lifeAlpha = Math.min(1, p.life / 0.7);
        const tumble = Math.cos(p.flutterPhase);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = lifeAlpha * 0.92;
        ctx.fillStyle = p.color;

        if (p.shape === 'ribbon') {
          ctx.scale(1, Math.max(0.24, Math.abs(tumble)));
          ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.h * 0.65);
          ctx.lineTo(p.w * 0.55, 0);
          ctx.lineTo(0, p.h * 0.65);
          ctx.lineTo(-p.w * 0.55, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // 4-point star glint
          const rOuter = p.w * 0.72;
          const rInner = rOuter * 0.34;
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const r = k % 2 === 0 ? rOuter : rInner;
            const a = (k * Math.PI) / 4;
            if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (pieces.length > 0 || rings.length > 0 || elapsedTotal < 0.75) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', syncSize);
      window.clearTimeout(wave2Timer);
      window.clearTimeout(wave3Timer);
      cancelAnimationFrame(rafId);
    };
  }, [heroAccent]);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Radiant golden arena spotlight & rotating sunburst behind the victory card */}
      <div
        className="absolute left-1/2 top-1/2 w-[920px] h-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 191, 36, 0.32) 0%, rgba(245, 158, 11, 0.12) 34%, rgba(9, 14, 26, 0) 68%)',
        }}
      />
      <div
        className="animate-victory-sunburst absolute left-1/2 top-1/2 w-[780px] h-[780px] rounded-full opacity-30"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, rgba(251, 191, 36, 0.34) 0deg 10deg, transparent 10deg 26deg)',
          maskImage:
            'radial-gradient(circle, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.45) 45%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(circle, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.45) 45%, transparent 70%)',
        }}
      />

      {/* Hardware-accelerated fireworks & confetti canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
