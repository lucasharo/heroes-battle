// Sprite compositing helpers for generated pose sheets & Velvet back-view animation frames
// Produces 210px height sprites with white hit-flash buffers matching sliceSheetGrid output.

export interface BakedSpriteFrame {
  normal: HTMLCanvasElement;
  flash: HTMLCanvasElement;
  aspect: number;
  relHeight: number;
  headShiftNorm: number;
}

function finalizeBakedCanvas(
  src: HTMLCanvasElement,
  relHeight = 1,
  headShiftNorm = 0
): BakedSpriteFrame | null {
  const w = src.width;
  const h = src.height;
  const flash = document.createElement('canvas');
  flash.width = w;
  flash.height = h;
  const fCtx = flash.getContext('2d');
  if (!fCtx) return null;
  fCtx.drawImage(src, 0, 0);
  fCtx.globalCompositeOperation = 'source-in';
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 0, w, h);

  return {
    normal: src,
    flash,
    aspect: w / h,
    relHeight,
    headShiftNorm,
  };
}

export function createSteppingCycleFromPose(
  base: BakedSpriteFrame,
  frameCount = 6
): BakedSpriteFrame[] {
  const frames: BakedSpriteFrame[] = [];
  const src = base.normal;
  const w = src.width;
  const h = src.height;
  const splitY = Math.floor(h * 0.77);
  const legH = h - splitY;
  const halfW = Math.floor(w * 0.5);

  for (let i = 0; i < frameCount; i++) {
    const phase = (i / frameCount) * Math.PI * 2;
    const leftLift = Math.max(0, Math.sin(phase)) * 7;
    const rightLift = Math.max(0, -Math.sin(phase)) * 7;
    const strideX = Math.sin(phase) * 2.5;
    const bodyBob = -Math.abs(Math.cos(phase)) * 3;
    const sway = Math.sin(phase) * 1.6;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Upper torso & head with crisp stride bob
    ctx.drawImage(src, 0, 0, w, splitY, sway, bodyBob, w, splitY);
    // Alternating left & right boot lift & forward stride offset
    ctx.drawImage(
      src,
      0,
      splitY,
      halfW,
      legH,
      sway * 0.4 + strideX,
      splitY - leftLift,
      halfW,
      legH
    );
    ctx.drawImage(
      src,
      halfW,
      splitY,
      w - halfW,
      legH,
      halfW + sway * 0.4 - strideX,
      splitY - rightLift,
      w - halfW,
      legH
    );

    const baked = finalizeBakedCanvas(canvas, base.relHeight, base.headShiftNorm);
    if (baked) frames.push(baked);
  }

  return frames;
}

export type HeroActionEffectStyle =
  | 'katana_gold'
  | 'melee_cyan'
  | 'lightning_cyan'
  | 'flame_orange'
  | 'magma_amber'
  | 'sniper_green'
  | 'void_magenta'
  | 'solar_gold'
  | 'cryo_cyan'
  | 'valkyrie_cyan'
  | 'chrono_violet'
  | 'gatling_fire';

export function createHeroActionPose(
  base: BakedSpriteFrame,
  mode: 'windup' | 'slash' | 'cleave' | 'slam',
  style: HeroActionEffectStyle = 'katana_gold'
): BakedSpriteFrame | undefined {
  const src = base.normal;
  const pad = 34;
  const w = src.width + pad * 2;
  const h = src.height + pad;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const cx = w * 0.5;
  const cy = h;

  ctx.save();
  ctx.translate(cx, cy);
  if (mode === 'windup') {
    ctx.rotate(-0.13);
    ctx.scale(0.96, 1.05);
  } else if (mode === 'slash') {
    ctx.translate(4, 0);
    ctx.rotate(0.12);
    ctx.scale(1.07, 0.96);
  } else if (mode === 'cleave') {
    ctx.translate(2, 0);
    ctx.rotate(0.08);
    ctx.scale(1.04, 0.98);
  } else {
    ctx.translate(4, -10);
    ctx.rotate(0.14);
    ctx.scale(1.06, 1.02);
  }
  ctx.drawImage(src, -src.width * 0.5, -src.height);

  if (mode !== 'windup') {
    const outerColor =
      style === 'melee_cyan' ||
      style === 'lightning_cyan' ||
      style === 'cryo_cyan' ||
      style === 'valkyrie_cyan'
        ? 'rgba(34, 211, 238, 0.9)'
        : style === 'flame_orange' || style === 'magma_amber' || style === 'gatling_fire'
          ? 'rgba(251, 146, 60, 0.88)'
          : style === 'sniper_green'
            ? 'rgba(74, 222, 128, 0.9)'
            : style === 'void_magenta'
              ? 'rgba(232, 121, 249, 0.9)'
              : style === 'chrono_violet'
                ? 'rgba(192, 132, 252, 0.9)'
                : style === 'solar_gold'
                  ? 'rgba(250, 204, 21, 0.92)'
                  : 'rgba(254, 240, 138, 0.78)';
    const innerColor =
      style === 'melee_cyan' || style === 'lightning_cyan' || style === 'cryo_cyan'
        ? 'rgba(236, 254, 255, 0.96)'
        : style === 'sniper_green'
          ? 'rgba(220, 252, 231, 0.96)'
          : style === 'void_magenta' || style === 'chrono_violet'
            ? 'rgba(253, 244, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.92)';

    if (style === 'lightning_cyan') {
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = mode === 'slam' ? 7 : 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const ox = src.width * 0.24;
      const oy = -src.height * 0.44;
      ctx.moveTo(ox - 10, oy - 28);
      ctx.lineTo(ox + 16, oy - 12);
      ctx.lineTo(ox + 2, oy);
      ctx.lineTo(ox + 24, oy + 14);
      ctx.lineTo(ox - 6, oy + 32);
      ctx.stroke();
      ctx.strokeStyle = innerColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (style === 'melee_cyan' || style === 'valkyrie_cyan' || style === 'void_magenta') {
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = mode === 'slam' ? 9 : 6.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(10, -src.height * 0.44, src.width * 0.44, -0.95, 0.78);
      ctx.stroke();

      ctx.strokeStyle = innerColor;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(12, -src.height * 0.44, src.width * 0.44, -0.72, 0.58);
      ctx.stroke();
    } else if (style === 'sniper_green' || style === 'gatling_fire') {
      const mx = src.width * 0.34;
      const my = -src.height * (style === 'gatling_fire' ? 0.38 : 0.43);
      ctx.save();
      ctx.translate(mx, my);
      ctx.fillStyle = outerColor;
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(28, 0);
      ctx.lineTo(-4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.arc(4, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (style === 'solar_gold' || style === 'cryo_cyan' || style === 'chrono_violet') {
      const mx = src.width * 0.28;
      const my = -src.height * 0.46;
      ctx.save();
      ctx.translate(mx, my);
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, mode === 'slam' ? 22 : 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.arc(0, 0, mode === 'slam' ? 9 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.strokeStyle = outerColor;
      ctx.lineWidth = mode === 'slam' ? 7.5 : 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (mode === 'slam') {
        ctx.arc(10, -src.height * 0.46, src.width * 0.46, -1.1, 0.7);
      } else {
        ctx.arc(8, -src.height * 0.42, src.width * 0.44, -0.7, 0.65);
      }
      ctx.stroke();
    }
  }
  ctx.restore();

  return finalizeBakedCanvas(canvas, base.relHeight * (h / src.height), base.headShiftNorm) ?? undefined;
}

export function createKatanaAttackPose(
  base: BakedSpriteFrame,
  mode: 'windup' | 'slash' | 'cleave' | 'slam'
): BakedSpriteFrame | undefined {
  return createHeroActionPose(base, mode, 'katana_gold');
}

function drawRoundedLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  fill: string,
  outline = '#090d16'
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function renderVelvetBackFrame(legPhase: number): BakedSpriteFrame | null {
  const W = 190;
  const H = 210;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = W * 0.5;
  const stride = Math.sin(legPhase);
  const liftA = Math.max(0, Math.cos(legPhase)) * 7;
  const liftB = Math.max(0, -Math.cos(legPhase)) * 7;
  const bob = Math.abs(Math.sin(legPhase)) * -3.5;

  ctx.save();
  ctx.translate(cx, H - 14 + bob);

  // Legs
  drawRoundedLimb(ctx, -11, -38, -13, -2 - liftA, 11, '#2e1065');
  drawRoundedLimb(ctx, 11, -38, 13, -2 - liftB, 11, '#2e1065');
  for (const [fx, fy] of [
    [-13, -2 - liftA],
    [13, -2 - liftB],
  ]) {
    ctx.fillStyle = '#4c1d95';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 9.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Flowing dark-violet & gold-trimmed coat tails (back view)
  ctx.fillStyle = '#3b0764';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -84);
  ctx.lineTo(-32 + stride * 4, -22);
  ctx.lineTo(32 + stride * 4, -22);
  ctx.lineTo(22, -84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Purple twin-tails hair & head (back view)
  const sway = stride * 5;
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#9333ea';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(side * 24, -132);
    ctx.quadraticCurveTo(side * 58, -120, side * 52 + sway, -68);
    ctx.quadraticCurveTo(side * 34, -84, side * 24, -108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Magenta star hair clip
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(side * 27, -126, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Head back
  ctx.fillStyle = '#7e22ce';
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -122, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  return finalizeBakedCanvas(canvas);
}

export function createVelvetBackSprites(): {
  idleBack: BakedSpriteFrame | undefined;
  walkBack: BakedSpriteFrame[];
} {
  const walkBack: BakedSpriteFrame[] = [];
  for (let i = 0; i < 6; i++) {
    const f = renderVelvetBackFrame((i / 6) * Math.PI * 2);
    if (f) walkBack.push(f);
  }
  return {
    idleBack: renderVelvetBackFrame(0) ?? undefined,
    walkBack,
  };
}
