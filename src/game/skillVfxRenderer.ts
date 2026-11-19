import { clamp } from './physics';
import {
  SkillCastRingStyle,
  SkillDashStyle,
  SkillDecalStyle,
  SkillProjectileShape,
  SlashArcStyle,
  getHeroSkillVfx,
} from './skillVfx';
import { ActorState, Projectile, TelegraphZone } from './types';

export interface SkillRingEffect {
  active: boolean;
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  style: SkillCastRingStyle;
  lineWidth: number;
}

export interface DashGhost {
  active: boolean;
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  style: SkillDashStyle;
}

export interface GroundDecalEffect {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  style: SkillDecalStyle;
}

export type BeamEffectKind =
  | 'laser'
  | 'sky_pillar'
  | 'lightning'
  | 'cross_slash'
  | 'nova_flare'
  | 'wing_flare'
  | 'monolith_burst'
  | 'leap_arc';

export interface BeamEffect {
  active: boolean;
  kind: BeamEffectKind;
  x: number;
  y: number;
  x2: number;
  y2: number;
  width: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  seed: number;
}

export function drawSkillRingEffect(ctx: CanvasRenderingContext2D, r: SkillRingEffect): void {
  const t = clamp(1 - r.life / r.maxLife, 0, 1);
  const alpha = Math.max(0, 1 - t * t);
  const rad = r.startRadius + (r.endRadius - r.startRadius) * (1 - (1 - t) * (1 - t));

  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.globalAlpha = alpha;

  if (r.style === 'sonic_cone') {
    ctx.rotate(r.angle);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.55);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, rad, -0.78, 0.78);
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = Math.max(1.5, r.lineWidth * 0.45 * (1 - t * 0.5));
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.72, -0.55, 0.55);
    ctx.stroke();
  } else if (r.style === 'starburst') {
    const spikes = 10;
    ctx.rotate(r.angle + t * 0.65);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.5);
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const inner = rad * 0.52;
      const outer = rad;
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    }
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.76, 0, Math.PI * 2);
    ctx.stroke();
  } else if (r.style === 'rune_circle') {
    ctx.rotate(t * 1.4);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = r.secondaryColor;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, 3.2 * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (r.style === 'shock_diamond') {
    ctx.rotate(r.angle + Math.PI / 4);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    const s = rad * 0.85;
    ctx.strokeRect(-s, -s, s * 2, s * 2);

    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2;
    const s2 = rad * 0.62;
    ctx.strokeRect(-s2, -s2, s2 * 2, s2 * 2);
  } else if (r.style === 'lightning_crown') {
    ctx.rotate(r.angle + t * 0.9);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    ctx.beginPath();
    const pts = 16;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = i % 2 === 0 ? rad * 1.06 : rad * 0.72;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  } else if (r.style === 'tech_grid') {
    ctx.rotate(r.angle + t * 0.35);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.45, Math.sin(a) * rad * 0.45);
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      ctx.stroke();
    }
  } else if (r.style === 'petal_vortex') {
    ctx.rotate(r.angle + t * 2.1);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.save();
      ctx.rotate(a);
      ctx.strokeStyle = i % 2 === 0 ? r.color : r.secondaryColor;
      ctx.lineWidth = Math.max(2, r.lineWidth * 0.7 * (1 - t * 0.5));
      ctx.beginPath();
      ctx.arc(rad * 0.55, 0, rad * 0.48, -0.8, 0.8);
      ctx.stroke();
      ctx.restore();
    }
  } else if (r.style === 'chrono_gears') {
    ctx.rotate(t * 1.6);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.82, Math.sin(a) * rad * 0.82);
      ctx.lineTo(Math.cos(a) * rad * 1.05, Math.sin(a) * rad * 1.05);
      ctx.stroke();
    }
    ctx.rotate(-t * 3.1);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.56, 0, Math.PI * 1.5);
    ctx.stroke();
  } else if (r.style === 'flame_crown') {
    ctx.rotate(r.angle + t * 0.8);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    ctx.beginPath();
    const tongues = 12;
    for (let i = 0; i <= tongues; i++) {
      const a = (i / tongues) * Math.PI * 2;
      const rr = i % 2 === 0 ? rad * 1.08 : rad * 0.7;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.68, 0, Math.PI * 2);
    ctx.stroke();
  } else if (r.style === 'void_iris') {
    ctx.rotate(-t * 1.8);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.45);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad, a, a + 1.05);
      ctx.stroke();
    }
    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 0.72, rad * 0.42, r.angle, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (1 - t * 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = r.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.68, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawGroundDecal(
  ctx: CanvasRenderingContext2D,
  d: GroundDecalEffect,
  nowMs: number
): void {
  const alpha = clamp(d.life / d.maxLife, 0, 1);
  const fade = Math.min(1, alpha * 1.6) * 0.85;
  const r = d.radius;

  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.globalAlpha = fade;

  if (d.style === 'magma_crater') {
    ctx.fillStyle = 'rgba(24, 12, 8, 0.52)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.color;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const a = d.angle + (i * Math.PI * 2) / 7;
      ctx.strokeStyle = i % 2 === 0 ? d.color : d.secondaryColor;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a + 0.14) * r * 0.45, Math.sin(a + 0.14) * r * 0.45);
      ctx.lineTo(Math.cos(a - 0.08) * r * 0.82, Math.sin(a - 0.08) * r * 0.82);
      ctx.stroke();
    }
  } else if (d.style === 'tectonic_cracks') {
    ctx.fillStyle = 'rgba(28, 22, 16, 0.42)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a = d.angle + (i * Math.PI) / 4;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a + 0.15) * r * 0.5, Math.sin(a + 0.15) * r * 0.5);
      ctx.lineTo(Math.cos(a - 0.09) * r * 0.94, Math.sin(a - 0.09) * r * 0.94);
      ctx.stroke();

      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  } else if (d.style === 'frost_fracture') {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const a = d.angle + (i * Math.PI) / 3;
      const mx = Math.cos(a) * r * 0.55;
      const my = Math.sin(a) * r * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a + 0.65) * r * 0.28, my + Math.sin(a + 0.65) * r * 0.28);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a - 0.65) * r * 0.28, my + Math.sin(a - 0.65) * r * 0.28);
      ctx.stroke();
    }
  } else if (d.style === 'solar_mandala') {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = d.angle + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22);
      ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      ctx.stroke();
    }
  } else if (d.style === 'clock_sigil') {
    ctx.fillStyle = 'rgba(88, 28, 135, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
      ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      ctx.stroke();
    }
    const tick = nowMs * 0.002;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(tick) * r * 0.62, Math.sin(tick) * r * 0.62);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-tick * 0.5) * r * 0.42, Math.sin(-tick * 0.5) * r * 0.42);
    ctx.stroke();
  } else if (d.style === 'void_scar') {
    ctx.fillStyle = 'rgba(30, 12, 58, 0.46)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.62, d.angle, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.8;
    ctx.stroke();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.35);
    ctx.lineTo(r * 0.78, r * 0.35);
    ctx.moveTo(-r * 0.65, r * 0.42);
    ctx.lineTo(r * 0.65, -r * 0.42);
    ctx.stroke();
  } else if (d.style === 'tech_hex') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = d.angle + (i * Math.PI) / 3;
      const px = Math.cos(a) * r * 0.85;
      const py = Math.sin(a) * r * 0.85;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  } else if (d.style === 'sakura_slash') {
    ctx.rotate(d.angle);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.88, -r * 0.42);
    ctx.lineTo(r * 0.88, r * 0.42);
    ctx.moveTo(-r * 0.88, r * 0.42);
    ctx.lineTo(r * 0.88, -r * 0.42);
    ctx.stroke();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();
  } else if (d.style === 'acid_pool') {
    ctx.rotate(d.angle);
    ctx.fillStyle = 'rgba(132, 204, 22, 0.28)';
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const ox = Math.cos(a) * r * 0.32;
      const oy = Math.sin(a) * r * 0.24;
      ctx.beginPath();
      ctx.ellipse(ox, oy, r * 0.46, r * 0.3, a * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (d.style === 'storm_burn') {
    ctx.fillStyle = 'rgba(13, 148, 136, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = d.secondaryColor;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 6; i++) {
      const a = d.angle + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a + 0.18) * r * 0.44, Math.sin(a + 0.18) * r * 0.44);
      ctx.lineTo(Math.cos(a - 0.14) * r * 0.88, Math.sin(a - 0.14) * r * 0.88);
      ctx.stroke();
    }
  } else {
    // sniper_reticle
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = d.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(-r * 0.92, 0);
    ctx.lineTo(r * 0.92, 0);
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(0, r * 0.92);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBeamEffect(
  ctx: CanvasRenderingContext2D,
  b: BeamEffect,
  nowMs: number
): void {
  const t = clamp(1 - b.life / b.maxLife, 0, 1);
  const alpha = Math.max(0, 1 - t * t);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (b.kind === 'laser') {
    ctx.lineCap = 'round';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width * (1.25 - t * 0.55);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = b.secondaryColor;
    ctx.lineWidth = Math.max(2, b.width * 0.45 * (1 - t * 0.4));
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.4, b.width * 0.22 * (1 - t * 0.35));
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Muzzle star flare
    const flareR = b.width * 1.45 * (1 - t * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, flareR * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.kind === 'sky_pillar') {
    const colW = b.width * (1 - t * 0.45);
    const skyTop = b.y - 620;

    // Ground ellipse impact glow
    ctx.fillStyle = b.color;
    ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, colW * 1.65, colW * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer beam sheath
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - colW * 0.5, skyTop, colW, 620);

    // Secondary tinted column
    ctx.fillStyle = b.secondaryColor;
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillRect(b.x - colW * 0.28, skyTop, colW * 0.56, 620);

    // Razor bright white core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha;
    ctx.fillRect(b.x - colW * 0.13, skyTop, colW * 0.26, 620);

    // Rising energy rings along the column
    for (let k = 0; k < 3; k++) {
      const yRing = b.y - ((t * 420 + k * 150) % 440);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(b.x, yRing, colW * 0.78, colW * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (b.kind === 'lightning') {
    const dx = b.x2 - b.x;
    const dy = b.y2 - b.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const segments = Math.max(5, Math.min(11, Math.round(len / 34)));

    const traceBolt = (jitterAmp: number, phaseOffset: number) => {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      for (let i = 1; i < segments; i++) {
        const frac = i / segments;
        const hash = Math.sin((b.seed + i * 17.3 + phaseOffset) * 12.9898 + nowMs * 0.02);
        const offset = hash * jitterAmp;
        ctx.lineTo(b.x + dx * frac + nx * offset, b.y + dy * frac + ny * offset);
      }
      ctx.lineTo(b.x2, b.y2);
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width * (1.3 - t * 0.45);
    traceBolt(22, 0);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.6, b.width * 0.42 * (1 - t * 0.35));
    traceBolt(16, 1.4);
    ctx.stroke();
  } else if (b.kind === 'cross_slash') {
    const span = b.width * (0.75 + t * 0.45);
    ctx.translate(b.x, b.y);
    ctx.rotate(b.seed);
    for (const ang of [-0.68, 0.68]) {
      ctx.save();
      ctx.rotate(ang);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(4, 15 * (1 - t * 0.6));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, span, -0.95, 0.95);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, 5.5 * (1 - t * 0.5));
      ctx.beginPath();
      ctx.arc(0, 0, span * 0.96, -0.78, 0.78);
      ctx.stroke();
      ctx.restore();
    }
  } else if (b.kind === 'nova_flare') {
    const rad = b.width * (0.55 + t * 0.75);
    ctx.translate(b.x, b.y);
    ctx.rotate(b.seed + t * 0.9);

    ctx.fillStyle = b.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rr = i % 2 === 0 ? rad * 1.45 : rad * 0.26;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rr = i % 2 === 0 ? rad * 0.85 : rad * 0.14;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (b.kind === 'wing_flare') {
    const span = b.width * (0.8 + t * 0.45);
    ctx.translate(b.x, b.y - 6);
    ctx.rotate(b.seed + Math.PI / 2);
    for (const side of [-1, 1]) {
      ctx.fillStyle = b.color;
      ctx.strokeStyle = b.secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(side * 12, 0);
      ctx.quadraticCurveTo(side * span * 0.7, -span * 0.65, side * span, -span * 0.18);
      ctx.quadraticCurveTo(side * span * 0.65, span * 0.26, side * 14, 14);
      ctx.closePath();
      ctx.globalAlpha = alpha * 0.55;
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
  } else if (b.kind === 'monolith_burst') {
    const spikeRing = b.width;
    const pop = Math.sin(Math.min(1, t * 2.2) * (Math.PI / 2));
    ctx.translate(b.x, b.y);
    for (let i = 0; i < 8; i++) {
      const a = b.seed + (i * Math.PI) / 4;
      const sx = Math.cos(a) * spikeRing * 0.78;
      const sy = Math.sin(a) * spikeRing * 0.78;
      const h = (26 + (i % 2) * 14) * pop * (1 - t * 0.45);
      ctx.fillStyle = i % 2 === 0 ? b.color : b.secondaryColor;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy + 4);
      ctx.lineTo(sx, sy - h);
      ctx.lineTo(sx + 10, sy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (b.kind === 'leap_arc') {
    const mx = (b.x + b.x2) * 0.5;
    const my = (b.y + b.y2) * 0.5 - b.seed;
    ctx.lineCap = 'round';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = Math.max(3, b.width * (1 - t * 0.5));
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.quadraticCurveTo(mx, my, b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = b.secondaryColor;
    ctx.lineWidth = Math.max(1.5, b.width * 0.4 * (1 - t * 0.5));
    ctx.stroke();
  }

  ctx.restore();
}

export function drawStyledSlashArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  radius: number,
  alpha: number,
  color: string,
  secondaryColor: string,
  style: SlashArcStyle | undefined,
  comboStage: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  const isFinisher = comboStage >= 3;
  const arcSpread = isFinisher ? 1.18 : comboStage === 2 ? 1.02 : 0.92;

  if (style === 'katana_crimson') {
    // Razor-tapered Iaido crescent blade with sharp luminous inner edge
    ctx.fillStyle = color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, -arcSpread, arcSpread);
    ctx.quadraticCurveTo(
      radius * 0.52,
      0,
      Math.cos(-arcSpread) * radius * 0.88,
      Math.sin(-arcSpread) * radius * 0.88
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = (isFinisher ? 5.5 : 3.5) * alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, -arcSpread * 0.85, arcSpread * 0.85);
    ctx.stroke();
  } else if (style === 'electric_baton' || style === 'voltaic_palm') {
    // Crackling jagged electric arc + glowing palm/baton shockwave
    ctx.strokeStyle = color;
    ctx.lineWidth = (isFinisher ? 20 : 14) * alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.76, -arcSpread * 0.9, arcSpread * 0.9);
    ctx.stroke();

    // Jagged lightning filament along the swing path
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * alpha;
    ctx.beginPath();
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const a = -arcSpread + frac * arcSpread * 2;
      const jitter = (i % 2 === 0 ? 1 : -1) * (style === 'electric_baton' ? 8 : 6);
      const rr = radius * 0.82 + jitter;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else if (style === 'dragon_claw') {
    // Alternating twin bionic uppercut streaks
    const flip = comboStage % 2 === 0 ? -1 : 1;
    ctx.scale(1, flip);
    for (let lane = 0; lane < 2; lane++) {
      const rLane = radius * (0.72 + lane * 0.16);
      ctx.strokeStyle = lane === 0 ? color : secondaryColor;
      ctx.lineWidth = (isFinisher ? 13 : 9.5 - lane * 2.5) * alpha;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, rLane, -arcSpread * 0.85, arcSpread * 0.95);
      ctx.stroke();
    }
  } else if (style === 'seismic_hammer' || style === 'magma_fist') {
    // Heavy wide volcanic/hammer wedge shock arc + radial fracture spikes
    ctx.strokeStyle = color;
    ctx.lineWidth = (isFinisher ? 26 : 19) * alpha;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.74, -arcSpread, arcSpread);
    ctx.stroke();

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3.5 * alpha;
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.34;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.56, Math.sin(a) * radius * 0.56);
      ctx.lineTo(Math.cos(a) * radius * 0.98, Math.sin(a) * radius * 0.98);
      ctx.stroke();
    }
  } else if (style === 'halberd_sweep') {
    // Extended radiant cyan-gold Valkyrie halberd arc + twin feather sparks
    ctx.strokeStyle = color;
    ctx.lineWidth = (isFinisher ? 18 : 13) * alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, -arcSpread * 1.05, arcSpread * 1.05);
    ctx.stroke();

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4.2 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.93, -arcSpread * 0.95, arcSpread * 0.95);
    ctx.stroke();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = (isFinisher ? 22 : 16) * alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, -arcSpread, arcSpread);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawDashGhost(ctx: CanvasRenderingContext2D, g: DashGhost): void {
  const alpha = clamp(g.life / g.maxLife, 0, 1);
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angle);

  if (g.style === 'phoenix_wings' || g.style === 'valkyrie_wings') {
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(g.radius * 0.4, 0);
    ctx.quadraticCurveTo(-g.radius * 0.4, -g.radius * 1.9, -g.radius * 1.9, -g.radius * 1.2);
    ctx.quadraticCurveTo(-g.radius * 0.9, -g.radius * 0.3, -g.radius * 0.4, 0);
    ctx.quadraticCurveTo(-g.radius * 0.9, g.radius * 0.3, -g.radius * 1.9, g.radius * 1.2);
    ctx.quadraticCurveTo(-g.radius * 0.4, g.radius * 1.9, g.radius * 0.4, 0);
    ctx.fill();

    ctx.strokeStyle = g.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (g.style === 'lightning_arc' || g.style === 'voltaic_step') {
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-g.radius * 1.5, -g.radius * 0.45);
    ctx.lineTo(-g.radius * 0.4, g.radius * 0.25);
    ctx.lineTo(g.radius * 0.35, -g.radius * 0.3);
    ctx.lineTo(g.radius * 1.1, 0);
    ctx.stroke();

    ctx.fillStyle = g.secondaryColor;
    ctx.globalAlpha = alpha * 0.42;
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 0.75 * alpha, 0, Math.PI * 2);
    ctx.fill();
  } else if (g.style === 'void_rift' || g.style === 'cosmic_blink' || g.style === 'chrono_warp') {
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.radius * 0.55, g.radius * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = g.secondaryColor;
    ctx.globalAlpha = alpha * 0.35;
    ctx.fill();
  } else if (g.style === 'katana_wave' || g.style === 'dragon_uppercut') {
    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 5 * alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-g.radius * 0.2, 0, g.radius * 1.25, -0.95, 0.95);
    ctx.stroke();

    ctx.strokeStyle = g.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 1.05, -0.7, 0.7);
    ctx.stroke();
  } else if (g.style === 'aegis_bash' || g.style === 'titan_ram' || g.style === 'mecha_thruster') {
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(g.radius * 1.25, 0);
    ctx.lineTo(-g.radius * 0.9, -g.radius * 1.05);
    ctx.lineTo(-g.radius * 0.5, 0);
    ctx.lineTo(-g.radius * 0.9, g.radius * 1.05);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = g.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (g.style === 'avalanche_rock') {
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = g.color;
    ctx.strokeStyle = g.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, g.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (g.style === 'neon_skates' || g.style === 'cryo_slide') {
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-g.radius * 0.8, -g.radius * 0.55);
    ctx.lineTo(g.radius * 0.3, 0);
    ctx.lineTo(-g.radius * 0.8, g.radius * 0.55);
    ctx.stroke();
  } else {
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.radius * 1.05, g.radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSkillTelegraph(
  ctx: CanvasRenderingContext2D,
  tz: TelegraphZone,
  nowMs: number
): void {
  ctx.save();
  ctx.translate(tz.x, tz.y);

  if (tz.kind === 'fire_ring') {
    if (tz.vfxVariant === 'solar_sanctuary') {
      const pulse = 0.85 + Math.sin(nowMs * 0.012) * 0.15;
      const rot = nowMs * 0.0018;

      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(254, 240, 138, ${0.24 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * 0.46, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.8 * pulse})`;
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * tz.radius * 0.34, Math.sin(a) * tz.radius * 0.34);
        ctx.lineTo(Math.cos(a) * tz.radius * 0.94, Math.sin(a) * tz.radius * 0.94);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i * Math.PI) / 4;
        const px = Math.cos(a) * tz.radius * 0.68;
        const py = Math.sin(a) * tz.radius * 0.68;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = `rgba(250, 204, 21, ${0.95 * pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const pulse = 0.85 + Math.sin(nowMs * 0.015) * 0.15;
      const rot = nowMs * 0.0032;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(251, 146, 60, ${0.28 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * 0.56, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(0, 0, tz.radius * 0.78, a, a + 0.85);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = `rgba(251, 146, 60, ${0.92 * pulse})`;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (tz.kind === 'trap') {
    const pulse = 0.78 + Math.sin(nowMs * 0.012) * 0.22;
    if (tz.vfxVariant === 'seismic_mine') {
      const r = tz.radius * 0.68;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.strokeStyle = `rgba(250, 204, 21, ${0.88 * pulse})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const sonar = ((nowMs * 0.002) % 1) * r;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sonar, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? 18 : 11;
        if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (tz.vfxVariant === 'powder_mine') {
      const r = tz.radius * 0.68;
      ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
      ctx.strokeStyle = `rgba(251, 146, 60, ${0.9 * pulse})`;
      ctx.lineWidth = 2.8;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#9a3412';
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -9);
      ctx.lineTo(9, 9);
      ctx.moveTo(9, -9);
      ctx.lineTo(-9, 9);
      ctx.stroke();

      ctx.fillStyle = pulse > 0.85 ? '#ffffff' : '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const r = tz.radius * 0.65;
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.9 * pulse})`;
      ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#fda4af';
      ctx.fillStyle = '#881337';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fb7185';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + nowMs * 0.001;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Bespoke Ultimate R Telegraphs with animated sky payloads & custom geometry!
    const progress = clamp(tz.elapsed / tz.duration, 0, 1);
    const v = tz.vfxVariant;
    const rot = nowMs * 0.0045;

    if (v === 'kronos_collapse') {
      // Kronos R: Purple-gold rotating clockface singularity + counter-rotating gear ring
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(251, 191, 36, 0.26)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * (1 - progress * 0.45), 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(-rot * 0.8);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * 0.64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (tz.radius - 16), Math.sin(a) * (tz.radius - 16));
        ctx.lineTo(Math.cos(a) * tz.radius, Math.sin(a) * tz.radius);
        ctx.stroke();
      }

      ctx.lineCap = 'round';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rot * 3.2) * tz.radius * 0.7, Math.sin(rot * 3.2) * tz.radius * 0.7);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(-rot * 1.4) * tz.radius * 0.48, Math.sin(-rot * 1.4) * tz.radius * 0.48);
      ctx.stroke();
    } else if (v === 'frost_blizzard') {
      // Frost R: Spinning 6-branch icy cyclone + descending icicle spears!
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(224, 242, 254, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(rot * 1.2);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * tz.radius * 0.9, Math.sin(a) * tz.radius * 0.9);
        ctx.stroke();
      }
      ctx.restore();

      // Falling icicles from above
      const dropY = -300 * (1 - progress);
      for (let k = -1; k <= 1; k++) {
        const ix = k * 42;
        const iy = dropY - Math.abs(k) * 35;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ix, iy + 26);
        ctx.lineTo(ix - 8, iy - 18);
        ctx.lineTo(ix + 8, iy - 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (v === 'velvet_supernova') {
      // Velvet R: Swirling magenta-violet accretion disk pulling into a dark singularity
      ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(-rot * 1.6);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.strokeStyle = i % 2 === 0 ? '#f472b6' : '#c084fc';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.arc(0, 0, tz.radius * (0.28 + 0.65 * (1 - progress)), a, a + 1.15);
        ctx.stroke();
      }
      ctx.restore();

      // Dark event horizon + pink halo
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + progress * 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (v === 'solara_pillar') {
      // Solara R: Radiant golden sky column rays converging on sacred mandala
      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 249, 195, 0.36)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Shimmering vertical light shaft preview
      const beamW = 24 + progress * 48;
      ctx.fillStyle = `rgba(254, 240, 138, ${0.18 + progress * 0.28})`;
      ctx.fillRect(-beamW / 2, -460, beamW, 460);

      ctx.save();
      ctx.rotate(rot * 0.9);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.8;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * tz.radius * 0.3, Math.sin(a) * tz.radius * 0.3);
        ctx.lineTo(Math.cos(a) * tz.radius, Math.sin(a) * tz.radius);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (v === 'drake_predator') {
      // Drake R: Emerald tactical corner lock-on brackets snapping onto center
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Closing emerald brackets
      const br = tz.radius * (0.95 - progress * 0.58);
      const len = 24;
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 3.4;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(sx * br, sy * (br - len));
        ctx.lineTo(sx * br, sy * br);
        ctx.lineTo(sx * (br - len), sy * br);
        ctx.stroke();
      }
      // Vertical laser sightline from sky
      ctx.strokeStyle = `rgba(110, 231, 183, ${0.35 + progress * 0.55})`;
      ctx.lineWidth = 2 + progress * 3;
      ctx.beginPath();
      ctx.moveTo(0, -480);
      ctx.lineTo(0, 0);
      ctx.stroke();
    } else if (v === 'baston_aegis') {
      // Baston R: Concentric electric blue hexagonal tech-dome
      ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = Math.cos(a) * tz.radius;
        const py = Math.sin(a) * tz.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i * Math.PI) / 3;
        const rr = tz.radius * (0.3 + 0.65 * progress);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (v === 'crimson_orbital') {
      // Veinka R: Twin converging orbital laser beams + crimson locking crosshair
      ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.34)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Twin converging orbital tracers
      const spread = (1 - progress) * 140;
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2.5 + progress * 3;
      ctx.beginPath();
      ctx.moveTo(-spread, -460);
      ctx.lineTo(0, 0);
      ctx.moveTo(spread, -460);
      ctx.lineTo(0, 0);
      ctx.stroke();

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (v === 'phoenix_meteor') {
      // Phoenix R: Blazing meteor fireball visibly descending from the sky!
      ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Ground impact shadow growing as meteor descends
      ctx.fillStyle = `rgba(124, 45, 18, ${0.22 + progress * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26 + progress * 42, 14 + progress * 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Descending Meteor boulder in the sky
      const fallY = -430 * (1 - progress);
      const fallX = 110 * (1 - progress);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.65)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fallX + 28, fallY - 110);
      ctx.lineTo(fallX, fallY);
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(fallX, fallY, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(fallX - 4, fallY + 4, 19, 0, Math.PI * 2);
      ctx.fill();
    } else if (v === 'cluster_artillery' || v === 'titanx_barrage' || v === 'knox_volcano') {
      const rgb = v === 'titanx_barrage' ? '239, 68, 68' : v === 'knox_volcano' ? '251, 146, 60' : '250, 204, 21';
      ctx.fillStyle = `rgba(${rgb}, 0.16)`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${rgb}, 0.34)`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${rgb}, 0.95)`;
      ctx.lineWidth = 3.4;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Descending bomb / thermobaric missile / magma canister!
      const dropY = -360 * (1 - progress);
      ctx.strokeStyle = v === 'titanx_barrage' ? '#fbbf24' : '#fde047';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, dropY - 48);
      ctx.lineTo(0, dropY);
      ctx.stroke();

      ctx.fillStyle = v === 'titanx_barrage' ? '#ef4444' : v === 'knox_volcano' ? '#ea580c' : '#1e3a8a';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, dropY, 12, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Target cross X
      ctx.strokeStyle = `rgba(${rgb}, 0.95)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, -22);
      ctx.lineTo(22, 22);
      ctx.moveTo(22, -22);
      ctx.lineTo(-22, 22);
      ctx.stroke();
    } else {
      // Custom-tinted tectonic / dragon / storm / halo / crest / void slams
      const color =
        v === 'kairo_storm'
          ? '45, 212, 191'
          : v === 'ryder_void'
          ? '236, 72, 153'
          : v === 'valkyria_halo'
          ? '34, 211, 238'
          : v === 'dragon_slam'
          ? '249, 115, 22'
          : v === 'boulder_tectonic' || v === 'kong_fissure' || v === 'meiro_crest'
          ? '245, 158, 11'
          : tz.kind === 'orbital'
          ? '244, 63, 94'
          : tz.kind === 'slam'
          ? '245, 158, 11'
          : '251, 146, 60';

      ctx.fillStyle = `rgba(${color}, 0.17)`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${color}, 0.34)`;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Fissure cracks for tectonic / seismic slams
      if (v === 'boulder_tectonic' || v === 'kong_fissure' || v === 'dragon_slam') {
        ctx.strokeStyle = `rgba(${color}, 0.9)`;
        ctx.lineWidth = 2.8;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + 0.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a + 0.12) * tz.radius * 0.42, Math.sin(a + 0.12) * tz.radius * 0.42);
          ctx.lineTo(Math.cos(a - 0.08) * tz.radius * 0.85, Math.sin(a - 0.08) * tz.radius * 0.85);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = `rgba(${color}, 0.96)`;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, 0, tz.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawSkillProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  shape: SkillProjectileShape,
  nowMs: number
): void {
  const r = proj.radius;
  const sec = proj.secondaryColor ?? '#ffffff';

  if (shape === 'rail_lance' || shape === 'hyper_rail') {
    ctx.fillStyle = shape === 'hyper_rail' ? 'rgba(56, 189, 248, 0.34)' : 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.8, 0, r * 3.8, r * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 3.4, 0);
    ctx.lineTo(r * 0.4, -r * 0.95);
    ctx.lineTo(-r * 2.8, -r * 0.38);
    ctx.lineTo(-r * 3.3, 0);
    ctx.lineTo(-r * 2.8, r * 0.38);
    ctx.lineTo(r * 0.4, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = sec;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, 0, r * 0.35, r * 1.3, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-r * 1.8, -r * 0.22, r * 4.2, r * 0.44);
  } else if (shape === 'pulse_grenade') {
    const rot = nowMs * 0.014;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = sec;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'frost_prism' || shape === 'astral_lance') {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 3.3, r * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.9, 0);
    ctx.lineTo(r * 0.4, -r * 1.15);
    ctx.lineTo(-r * 1.1, -r * 0.55);
    ctx.lineTo(-r * 2.8, 0);
    ctx.lineTo(-r * 1.1, r * 0.55);
    ctx.lineTo(r * 0.4, r * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.moveTo(r * 1.7, 0);
    ctx.lineTo(0, -r * 0.5);
    ctx.lineTo(-r * 1.3, 0);
    ctx.lineTo(0, r * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'venom_dart' || shape === 'acid_fan' || shape === 'neon_smg') {
    ctx.fillStyle = 'rgba(163, 230, 53, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.6, 0, r * 2.8, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.6, 0);
    ctx.lineTo(r * 0.35, -r * 0.95);
    ctx.lineTo(r * 0.6, -r * 0.32);
    ctx.lineTo(-r * 2.3, -r * 0.32);
    ctx.lineTo(-r * 1.8, 0);
    ctx.lineTo(-r * 2.3, r * 0.32);
    ctx.lineTo(r * 0.6, r * 0.32);
    ctx.lineTo(r * 0.35, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.arc(r * 0.7, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'mag_slug' || shape === 'sniper_slug') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.26)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.6, 0, r * 3.4, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 3.1, 0);
    ctx.lineTo(-r * 1.4, -r * 0.68);
    ctx.lineTo(-r * 2.4, 0);
    ctx.lineTo(-r * 1.4, r * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = sec;
    ctx.lineWidth = 2;
    const coils = shape === 'mag_slug' ? [-r * 1.3, -r * 0.3, r * 0.7] : [0];
    for (const ox of coils) {
      ctx.beginPath();
      ctx.ellipse(ox, 0, r * 0.22, r * 1.08, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (shape === 'cryo_spear' || shape === 'ice_shard') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 3.1, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.9, 0);
    ctx.lineTo(r * 0.8, -r * 0.85);
    ctx.lineTo(r * 0.35, -r * 0.42);
    ctx.lineTo(-r * 0.4, -r * 1.0);
    ctx.lineTo(-r * 0.9, -r * 0.42);
    ctx.lineTo(-r * 2.4, 0);
    ctx.lineTo(-r * 0.9, r * 0.42);
    ctx.lineTo(-r * 0.4, r * 1.0);
    ctx.lineTo(r * 0.35, r * 0.42);
    ctx.lineTo(r * 0.8, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.fillRect(-r * 1.2, -r * 0.18, r * 2.8, r * 0.36);
  } else if (shape === 'shuriken_star') {
    // Raidon R: Spinning 4-blade glowing cyan cyber-shuriken
    const rot = nowMs * 0.022;
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#083344';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r * 1.85 : r * 0.58;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'katana_crescent' || shape === 'halberd_lance') {
    // Meiro / Valkyria R: Swept radiant crescent blade / winged spear wave
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.75, -1.18, 1.18);
    ctx.quadraticCurveTo(r * 0.35, 0, Math.cos(-1.18) * r * 1.75, Math.sin(-1.18) * r * 1.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = sec;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(r * 0.16, 0, r * 1.32, -0.85, 0.85);
    ctx.stroke();
  } else if (shape === 'lightning_orb') {
    // Kairo R: Crackling teal-white electric chi dragon sphere
    const rot = nowMs * 0.018;
    ctx.fillStyle = 'rgba(45, 212, 191, 0.34)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 1.35, -r * 0.3);
    ctx.lineTo(-r * 0.2, r * 0.25);
    ctx.lineTo(r * 0.4, -r * 0.35);
    ctx.lineTo(r * 1.35, r * 0.2);
    ctx.stroke();
    ctx.restore();
  } else if (shape === 'void_blade' || shape === 'void_boomerang') {
    // Ryder LMB / R: Spinning curved pink-purple void crescent dagger
    const rot = shape === 'void_blade' ? nowMs * 0.02 : nowMs * 0.014;
    ctx.rotate(rot);
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, -1.35, 1.35);
    ctx.quadraticCurveTo(0, 0, Math.cos(-1.35) * r * 1.55, Math.sin(-1.35) * r * 1.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = sec;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, -0.9, 0.9);
    ctx.stroke();
  } else if (shape === 'solar_orb') {
    // Solara LMB: Radiant golden sun flare orb with 4 rotating rays
    const rot = nowMs * 0.01;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = sec;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
      ctx.lineTo(Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'mecha_rocket') {
    // Titan-X LMB: Crimson mecha rocket with blazing golden exhaust jet
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-r * 1.4, -r * 0.48);
    ctx.lineTo(-r * 2.8, 0);
    ctx.lineTo(-r * 1.4, r * 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.1, 0);
    ctx.lineTo(r * 0.4, -r * 0.9);
    ctx.lineTo(-r * 1.5, -r * 0.72);
    ctx.lineTo(-r * 1.5, r * 0.72);
    ctx.lineTo(r * 0.4, r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.fillRect(-r * 0.9, -r * 0.3, r * 1.4, r * 0.6);
  } else if (shape === 'mortar_shell' || shape === 'lava_canister' || shape === 'bomblet') {
    ctx.fillStyle = shape === 'lava_canister' ? '#9a3412' : shape === 'bomblet' ? '#b45309' : '#1e3a8a';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.25, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = proj.color;
    ctx.fillRect(-r * 0.35, -r * 0.85, r * 0.7, r * 1.7);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(-r * 1.15, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'twin_needle') {
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.3, 0);
    ctx.lineTo(-r * 0.3, -r * 0.82);
    ctx.lineTo(-r * 2.2, 0);
    ctx.lineTo(-r * 0.3, r * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.ellipse(r * 0.35, 0, r * 0.95, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'crossbow_bolt') {
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.4, 0);
    ctx.lineTo(r * 0.6, -r * 0.95);
    ctx.lineTo(r * 0.9, -r * 0.32);
    ctx.lineTo(-r * 2.1, -r * 0.32);
    ctx.lineTo(-r * 2.5, -r * 0.75);
    ctx.lineTo(-r * 2.0, 0);
    ctx.lineTo(-r * 2.5, r * 0.75);
    ctx.lineTo(-r * 2.1, r * 0.32);
    ctx.lineTo(r * 0.9, r * 0.32);
    ctx.lineTo(r * 0.6, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.fillRect(-r * 1.4, -r * 0.18, r * 2.8, r * 0.36);
  } else if (shape === 'plasma_cannon') {
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(r * 2.1, 0);
    ctx.lineTo(r * 0.4, -r * 0.95);
    ctx.lineTo(-r * 1.9, -r * 0.65);
    ctx.lineTo(-r * 1.4, 0);
    ctx.lineTo(-r * 1.9, r * 0.65);
    ctx.lineTo(r * 0.4, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sec;
    ctx.fillRect(-r * 1.2, -r * 0.42, r * 1.5, r * 0.84);
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.arc(r * 0.6, 0, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'fire_orb') {
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 2.5, 0);
    ctx.quadraticCurveTo(-r * 1.1, -r * 1.25, r * 0.3, -r * 0.95);
    ctx.arc(r * 0.3, 0, r * 0.95, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(-r * 1.1, r * 1.25, -r * 2.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.45, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Kronos Q ('chrono_ray') & Basic ('chrono_orb'): Spinning purple-gold temporal clock gear bolt
    const rot = nowMs * 0.012;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, 0, r * 2.8, r * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 2.5, 0);
    ctx.lineTo(0, -r * 0.88);
    ctx.lineTo(-r * 2.2, 0);
    ctx.lineTo(0, r * 0.88);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(rot);
    ctx.strokeStyle = sec;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export function drawActorSkillAuras(
  ctx: CanvasRenderingContext2D,
  actor: ActorState,
  radius: number,
  nowMs: number
): void {
  const vfx = getHeroSkillVfx(actor.heroId);
  const eSpec = vfx.e;
  const qSpec = vfx.q;
  const hasShield = actor.shield > 0;
  const hasEActive = actor.eVfxTimer > 0;
  const isStealthed = actor.stealthTimer > 0;
  const isDashing = actor.dashTimer > 0;

  if (!hasShield && !hasEActive && !isStealthed && !isDashing && actor.speedBoostTimer <= 0) {
    return;
  }

  if (isDashing) {
    const dashColor =
      actor.activeDashStyle && eSpec.dashStyle === actor.activeDashStyle
        ? eSpec.primaryColor
        : qSpec.primaryColor;
    const dashSec =
      actor.activeDashStyle && eSpec.dashStyle === actor.activeDashStyle
        ? eSpec.secondaryColor
        : qSpec.secondaryColor;

    ctx.save();
    ctx.rotate(actor.aimAngle);
    ctx.strokeStyle = dashColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -4, radius + 16, -0.95, 0.95);
    ctx.stroke();

    ctx.strokeStyle = dashSec;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(4, -4, radius + 21, -0.65, 0.65);
    ctx.stroke();
    ctx.restore();
  }

  if (isStealthed) {
    const rot = nowMs * 0.004;
    ctx.save();
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.fillStyle = eSpec.glowColor;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, -4, radius + 17, rot, rot + Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    if (eSpec.auraStyle === 'eclipse_veil') {
      ctx.rotate(rot * 1.3);
      ctx.fillStyle = eSpec.primaryColor;
      ctx.beginPath();
      ctx.arc(radius + 20, -4, 6, -1.2, 1.2);
      ctx.fill();
    } else if (eSpec.auraStyle === 'tactical_cloak') {
      ctx.strokeStyle = eSpec.primaryColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(0, -4, radius + 21, a - 0.25, a + 0.25);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = eSpec.primaryColor;
      for (let i = 0; i < 3; i++) {
        const a = rot * 1.6 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (radius + 18), -4 + Math.sin(a) * (radius + 18), 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  if (actor.speedBoostTimer > 0 && !isStealthed && !hasShield) {
    const pulse = 0.65 + Math.sin(nowMs * 0.015) * 0.35;
    ctx.save();
    ctx.rotate(actor.aimAngle);
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.globalAlpha = 0.8 * pulse;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (const ox of [-radius - 10, -radius - 18]) {
      ctx.beginPath();
      ctx.moveTo(ox - 6, -9);
      ctx.lineTo(ox + 2, 0);
      ctx.lineTo(ox - 6, 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (!hasShield && !hasEActive) {
    return;
  }

  const shieldR = radius + 19;
  const style = eSpec.auraStyle;
  const rot = nowMs * 0.0028;

  ctx.save();
  ctx.translate(0, -6);

  if (style === 'hex_barrier') {
    ctx.rotate(rot * 0.7);
    ctx.fillStyle = 'rgba(96, 165, 250, 0.16)';
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * shieldR;
      const py = Math.sin(a) * shieldR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = eSpec.secondaryColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR * 0.84, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === 'titan_plates' || style === 'basalt_skin') {
    ctx.fillStyle = eSpec.glowColor.replace(/[\d.]+\)$/, '0.16)');
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rot * 0.65);
    const plates = style === 'basalt_skin' ? 5 : 4;
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 4.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < plates; i++) {
      const a = (i / plates) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, a, a + (Math.PI * 1.25) / plates);
      ctx.stroke();
    }
  } else if (style === 'crystal_armor') {
    ctx.rotate(-rot * 0.6);
    ctx.fillStyle = 'rgba(125, 211, 252, 0.18)';
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? shieldR + 3 : shieldR - 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.fill();
    ctx.stroke();
  } else if (style === 'phoenix_wings' || style === 'redemption_wings') {
    const flap = Math.sin(nowMs * 0.015) * 4;
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.fillStyle = eSpec.glowColor.replace(/[\d.]+\)$/, '0.24)');
    ctx.lineWidth = 2.6;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * radius * 0.55, 2);
      ctx.quadraticCurveTo(
        side * (shieldR + 14),
        -18 + flap,
        side * (shieldR + 16),
        6 + flap
      );
      ctx.quadraticCurveTo(side * (shieldR + 4), 16, side * radius * 0.5, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (hasShield) {
      ctx.strokeStyle = eSpec.secondaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (style === 'solar_blessing') {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.16)';
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rot);
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = eSpec.secondaryColor;
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (shieldR - 3), Math.sin(a) * (shieldR - 3));
      ctx.lineTo(Math.cos(a) * (shieldR + 7), Math.sin(a) * (shieldR + 7));
      ctx.stroke();
    }
  } else if (style === 'zen_aura' || style === 'flame_guard') {
    ctx.fillStyle = eSpec.glowColor.replace(/[\d.]+\)$/, '0.15)');
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const a = rot * 1.7 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * (shieldR + 2);
      const oy = Math.sin(a) * (shieldR + 2);
      ctx.fillStyle = eSpec.secondaryColor;
      ctx.beginPath();
      ctx.arc(ox, oy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  } else if (style === 'chrono_warp') {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(rot * 1.4);
    ctx.strokeStyle = eSpec.secondaryColor;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, shieldR + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style === 'samurai_stance') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rot * 1.2);
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();

    ctx.strokeStyle = eSpec.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR - 4, 0.7, 2.4);
    ctx.stroke();
  } else if (style === 'reactor_overdrive') {
    const pulse = 0.75 + Math.sin(nowMs * 0.015) * 0.25;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.17)';
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(rot * 0.8);
    ctx.fillStyle = eSpec.secondaryColor;
    ctx.globalAlpha = pulse;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.fillRect(Math.cos(a) * shieldR - 4, Math.sin(a) * shieldR - 4, 8, 8);
    }
  } else if (style === 'cosmic_blink') {
    ctx.rotate(rot * 1.5);
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = eSpec.secondaryColor;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const sx = Math.cos(a) * shieldR;
      const sy = Math.sin(a) * shieldR;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 5);
      ctx.lineTo(sx + 4, sy);
      ctx.lineTo(sx, sy + 5);
      ctx.lineTo(sx - 4, sy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'neon_skates') {
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 12, shieldR - 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === 'firework_jump') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.16)';
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(rot * 1.5);
    ctx.fillStyle = eSpec.secondaryColor;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (shieldR + 3), Math.sin(a) * (shieldR + 3), 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hasShield) {
    ctx.fillStyle = eSpec.glowColor.replace(/[\d.]+\)$/, '0.16)');
    ctx.strokeStyle = eSpec.primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(rot);
    ctx.strokeStyle = eSpec.secondaryColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, shieldR - 4, 0, Math.PI * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, shieldR - 4, Math.PI, Math.PI * 1.7);
    ctx.stroke();
  }

  ctx.restore();
}
