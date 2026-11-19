import { BakedSpriteFrame } from './meiroSprites';
import { HeroId } from './types';

export type NewHeroId =
  | 'baston'
  | 'nina'
  | 'drake'
  | 'knox'
  | 'kairo'
  | 'boulder'
  | 'ryder'
  | 'solara'
  | 'frost'
  | 'valkyria'
  | 'kronos'
  | 'titanx';

export interface NewHeroSpriteSet {
  idleGuard: BakedSpriteFrame;
  idleSide: BakedSpriteFrame;
  idleDiag: BakedSpriteFrame;
  idleFront: BakedSpriteFrame;
  idleBack: BakedSpriteFrame;
  idleBackDiag: BakedSpriteFrame;
  attackWindup: BakedSpriteFrame;
  attackSide: BakedSpriteFrame;
  attackDiag: BakedSpriteFrame;
  attackFront: BakedSpriteFrame;
  attackBackDiag: BakedSpriteFrame;
  attackSpecial: BakedSpriteFrame;
  walkSide8: BakedSpriteFrame[];
  walkDiag8: BakedSpriteFrame[];
  walkFront: BakedSpriteFrame[];
  walkBack: BakedSpriteFrame[];
  walkBackDiag: BakedSpriteFrame[];
}

export const NEW_HERO_IDS: NewHeroId[] = [
  'baston',
  'nina',
  'drake',
  'knox',
  'kairo',
  'boulder',
  'ryder',
  'solara',
  'frost',
  'valkyria',
  'kronos',
  'titanx',
];

export function isNewProceduralHero(id: HeroId): id is NewHeroId {
  return (NEW_HERO_IDS as string[]).includes(id);
}

const OUTLINE = '#090d16';

function trimAndBakeFrame(
  canvas: HTMLCanvasElement,
  heroCenterX: number,
  refBodyHeight: number
): BakedSpriteFrame {
  const srcW = canvas.width;
  const srcH = canvas.height;
  const sCtx = canvas.getContext('2d', { willReadFrequently: true });
  let minX = 0;
  let minY = 0;
  let maxX = srcW - 1;
  let maxY = srcH - 1;

  if (sCtx) {
    const data = sCtx.getImageData(0, 0, srcW, srcH).data;
    minX = srcW;
    minY = srcH;
    maxX = -1;
    maxY = -1;
    for (let y = 0; y < srcH; y++) {
      const row = y * srcW * 4;
      for (let x = 0; x < srcW; x++) {
        if (data[row + x * 4 + 3] > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) {
      minX = 0;
      minY = 0;
      maxX = srcW - 1;
      maxY = srcH - 1;
    }
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);
  const aspect = cropW / cropH;
  const bakedH = 210;
  const bakedW = Math.max(1, Math.round(bakedH * aspect));

  const normal = document.createElement('canvas');
  normal.width = bakedW;
  normal.height = bakedH;
  const nCtx = normal.getContext('2d');
  if (nCtx) {
    nCtx.imageSmoothingEnabled = true;
    nCtx.imageSmoothingQuality = 'high';
    nCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, bakedW, bakedH);
  }

  const flash = document.createElement('canvas');
  flash.width = bakedW;
  flash.height = bakedH;
  const fCtx = flash.getContext('2d');
  if (fCtx) {
    fCtx.drawImage(normal, 0, 0);
    fCtx.globalCompositeOperation = 'source-in';
    fCtx.fillStyle = '#ffffff';
    fCtx.fillRect(0, 0, bakedW, bakedH);
  }

  const rawShift = (heroCenterX - (minX + cropW * 0.5)) / cropW;
  const headShiftNorm = Math.max(-0.28, Math.min(0.28, rawShift));
  const relHeight = refBodyHeight > 0 ? cropH / refBodyHeight : 1;

  return {
    normal,
    flash,
    aspect,
    relHeight,
    headShiftNorm,
  };
}

interface DrawPoseOpts {
  view: 'side' | 'diag' | 'front' | 'back' | 'backDiag';
  phase: number;
  moving: boolean;
  attackPhase: 'none' | 'windup' | 'strike' | 'special';
}

interface HeroStyleSpec {
  legMain: string;
  legShade: string;
  bootMain: string;
  bootTrim: string;
  torsoMain: string;
  torsoShade: string;
  torsoTrim: string;
  skinOrVisor: string;
  skinShade: string;
  eyeColor: string;
  hairOrHelm: string;
  hairHighlight: string;
  accent: string;
  bulky?: boolean;
  robe?: boolean;
}

const STYLES: Record<NewHeroId, HeroStyleSpec> = {
  baston: {
    legMain: '#2563eb',
    legShade: '#1e3a8a',
    bootMain: '#1d4ed8',
    bootTrim: '#38bdf8',
    torsoMain: '#2563eb',
    torsoShade: '#1e3a8a',
    torsoTrim: '#38bdf8',
    skinOrVisor: '#1e293b',
    skinShade: '#0f172a',
    eyeColor: '#22d3ee',
    hairOrHelm: '#2563eb',
    hairHighlight: '#60a5fa',
    accent: '#38bdf8',
    bulky: true,
  },
  nina: {
    legMain: '#14b8a6',
    legShade: '#0f766e',
    bootMain: '#1e293b',
    bootTrim: '#fb923c',
    torsoMain: '#14b8a6',
    torsoShade: '#0f766e',
    torsoTrim: '#fb923c',
    skinOrVisor: '#fde2b8',
    skinShade: '#eab38c',
    eyeColor: '#10b981',
    hairOrHelm: '#2dd4bf',
    hairHighlight: '#99f6e4',
    accent: '#a3e635',
  },
  drake: {
    legMain: '#065f46',
    legShade: '#022c22',
    bootMain: '#1f2937',
    bootTrim: '#10b981',
    torsoMain: '#065f46',
    torsoShade: '#022c22',
    torsoTrim: '#34d399',
    skinOrVisor: '#1e293b',
    skinShade: '#0f172a',
    eyeColor: '#4ade80',
    hairOrHelm: '#047857',
    hairHighlight: '#34d399',
    accent: '#22c55e',
  },
  knox: {
    legMain: '#ea580c',
    legShade: '#9a3412',
    bootMain: '#475569',
    bootTrim: '#facc15',
    torsoMain: '#ea580c',
    torsoShade: '#9a3412',
    torsoTrim: '#facc15',
    skinOrVisor: '#fed7aa',
    skinShade: '#fdba74',
    eyeColor: '#1e293b',
    hairOrHelm: '#f59e0b',
    hairHighlight: '#fef08a',
    accent: '#fb923c',
    bulky: true,
  },
  kairo: {
    legMain: '#115e59',
    legShade: '#042f2e',
    bootMain: '#1e293b',
    bootTrim: '#f8fafc',
    torsoMain: '#f8fafc',
    torsoShade: '#cbd5e1',
    torsoTrim: '#2dd4bf',
    skinOrVisor: '#fcd9a6',
    skinShade: '#e5a973',
    eyeColor: '#0f172a',
    hairOrHelm: '#1e293b',
    hairHighlight: '#475569',
    accent: '#22d3ee',
  },
  boulder: {
    legMain: '#57534e',
    legShade: '#292524',
    bootMain: '#44403c',
    bootTrim: '#f97316',
    torsoMain: '#57534e',
    torsoShade: '#292524',
    torsoTrim: '#f97316',
    skinOrVisor: '#44403c',
    skinShade: '#292524',
    eyeColor: '#fbbf24',
    hairOrHelm: '#57534e',
    hairHighlight: '#78716c',
    accent: '#f59e0b',
    bulky: true,
  },
  ryder: {
    legMain: '#312e81',
    legShade: '#1e1b4b',
    bootMain: '#4338ca',
    bootTrim: '#ec4899',
    torsoMain: '#4338ca',
    torsoShade: '#1e1b4b',
    torsoTrim: '#ec4899',
    skinOrVisor: '#312e81',
    skinShade: '#1e1b4b',
    eyeColor: '#f472b6',
    hairOrHelm: '#4f46e5',
    hairHighlight: '#a5b4fc',
    accent: '#ec4899',
  },
  solara: {
    legMain: '#fef3c7',
    legShade: '#d97706',
    bootMain: '#b45309',
    bootTrim: '#fde047',
    torsoMain: '#fffbeb',
    torsoShade: '#fde68a',
    torsoTrim: '#f59e0b',
    skinOrVisor: '#fde2b8',
    skinShade: '#eab38c',
    eyeColor: '#d97706',
    hairOrHelm: '#facc15',
    hairHighlight: '#fef9c3',
    accent: '#fde047',
    robe: true,
  },
  frost: {
    legMain: '#0f172a',
    legShade: '#020617',
    bootMain: '#0369a1',
    bootTrim: '#e0f2fe',
    torsoMain: '#0284c7',
    torsoShade: '#075985',
    torsoTrim: '#f8fafc',
    skinOrVisor: '#fde2b8',
    skinShade: '#eab38c',
    eyeColor: '#0ea5e9',
    hairOrHelm: '#38bdf8',
    hairHighlight: '#bae6fd',
    accent: '#7dd3fc',
    robe: true,
  },
  valkyria: {
    legMain: '#334155',
    legShade: '#0f172a',
    bootMain: '#e2e8f0',
    bootTrim: '#f59e0b',
    torsoMain: '#f1f5f9',
    torsoShade: '#94a3b8',
    torsoTrim: '#f59e0b',
    skinOrVisor: '#fde2b8',
    skinShade: '#eab38c',
    eyeColor: '#22d3ee',
    hairOrHelm: '#f8fafc',
    hairHighlight: '#ffffff',
    accent: '#22d3ee',
  },
  kronos: {
    legMain: '#3b0764',
    legShade: '#1e1b4b',
    bootMain: '#4c1d95',
    bootTrim: '#fbbf24',
    torsoMain: '#6b21a8',
    torsoShade: '#3b0764',
    torsoTrim: '#fbbf24',
    skinOrVisor: '#090d16',
    skinShade: '#020617',
    eyeColor: '#e879f9',
    hairOrHelm: '#581c87',
    hairHighlight: '#a855f7',
    accent: '#c084fc',
    robe: true,
  },
  titanx: {
    legMain: '#475569',
    legShade: '#1e293b',
    bootMain: '#dc2626',
    bootTrim: '#94a3b8',
    torsoMain: '#dc2626',
    torsoShade: '#991b1b',
    torsoTrim: '#fbbf24',
    skinOrVisor: '#dc2626',
    skinShade: '#991b1b',
    eyeColor: '#fde047',
    hairOrHelm: '#ef4444',
    hairHighlight: '#fca5a5',
    accent: '#fbbf24',
    bulky: true,
  },
};

function drawCelJointedLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  kneeX: number,
  kneeY: number,
  footX: number,
  footY: number,
  width: number,
  main: string,
  shade: string,
  bootMain: string,
  bootTrim: string,
  isSide: boolean,
  footTilt = 0
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Thick ink outline
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width + 7.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
  ctx.stroke();

  // Base leg color
  ctx.strokeStyle = main;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
  ctx.stroke();

  // Cel shadow along lower shin/back thigh
  ctx.strokeStyle = shade;
  ctx.lineWidth = width * 0.44;
  ctx.beginPath();
  ctx.moveTo(hipX - 1.5, hipY + 1);
  ctx.lineTo(kneeX - 1.5, kneeY + 1);
  ctx.lineTo(footX - 1.5, footY);
  ctx.stroke();

  // Knee pad armor detail
  ctx.fillStyle = bootTrim;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(kneeX - 5, kneeY - 5, 10, 9, 3.5);
  ctx.fill();
  ctx.stroke();

  // Boot with trim cuff & sole
  ctx.translate(footX + (isSide ? 3 : 0), footY + 2);
  ctx.rotate(footTilt);
  const bw = isSide ? 13 : 10.5;
  const bh = 6.5;

  ctx.fillStyle = bootMain;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.roundRect(-bw, -bh, bw * 2, bh * 2, 5);
  ctx.fill();
  ctx.stroke();

  // Boot cuff trim
  ctx.fillStyle = bootTrim;
  ctx.beginPath();
  ctx.roundRect(-bw * 0.85, -bh - 2, bw * 1.7, 5, 2.5);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCelArm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  width: number,
  main: string,
  shade: string,
  gloveColor: string
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width + 7;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.strokeStyle = main;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.strokeStyle = shade;
  ctx.lineWidth = width * 0.42;
  ctx.beginPath();
  ctx.moveTo(sx, sy + 1.5);
  ctx.lineTo(ex, ey + 1.5);
  ctx.stroke();

  // Shoulder pad
  ctx.fillStyle = main;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(sx, sy, width * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hand / Gauntlet
  ctx.fillStyle = gloveColor;
  ctx.beginPath();
  ctx.arc(ex, ey, width * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawAnimeEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  iris: string,
  rx = 5.8,
  ry = 7.4
) {
  // Eyelash / brow frame
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 2.2, ry + 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sclera white
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y + 0.4, rx + 0.6, ry + 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris color
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.ellipse(x + 0.5, y + 0.8, rx * 0.85, ry * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  // Deep pupil
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.ellipse(x + 0.5, y + 1.4, rx * 0.42, ry * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - rx * 0.28, y - ry * 0.34, rx * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + rx * 0.32, y + ry * 0.32, rx * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawGlowingSlashWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  startAng: number,
  endAng: number,
  outerColor: string,
  innerColor = '#ffffff'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.strokeStyle = outerColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(0, 0, r, startAng, endAng);
  ctx.stroke();

  ctx.strokeStyle = innerColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r, startAng + 0.12, endAng - 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawMuzzleBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerColor: string,
  size = 16
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = outerColor;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rad = i % 2 === 0 ? size : size * 0.44;
    const px = Math.cos(a) * rad * 1.15;
    const py = Math.sin(a) * rad * 0.85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderHeroFrame(heroId: NewHeroId, opts: DrawPoseOpts): BakedSpriteFrame {
  const W = 250;
  const H = 230;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const st = STYLES[heroId];

  const isSide = opts.view === 'side' || opts.view === 'diag' || opts.view === 'backDiag';
  const isBack = opts.view === 'back' || opts.view === 'backDiag';
  const isFront = opts.view === 'front';
  const isDiag = opts.view === 'diag';

  const stride = opts.moving ? Math.sin(opts.phase) : 0;
  const cosPhase = opts.moving ? Math.cos(opts.phase) : 0;
  const liftA = opts.moving ? Math.max(0, cosPhase) * 11 : 0;
  const liftB = opts.moving ? Math.max(0, -cosPhase) * 11 : 0;
  const bob = opts.moving ? -Math.abs(stride) * 4.5 : 0;
  const swayX = opts.moving ? cosPhase * 2 : 0;

  let bodyTilt = opts.moving && isSide ? 0.1 : 0;
  let weaponAngle = 0;
  let armReach = 0;
  let lungeX = 0;

  if (opts.attackPhase === 'windup') {
    bodyTilt = -0.17;
    weaponAngle = -0.78;
    armReach = -7;
    lungeX = -4;
  } else if (opts.attackPhase === 'strike') {
    bodyTilt = 0.16;
    weaponAngle = 0.32;
    armReach = 14;
    lungeX = 7;
  } else if (opts.attackPhase === 'special') {
    bodyTilt = 0.12;
    weaponAngle = -0.22;
    armReach = 12;
    lungeX = 5;
  } else if (opts.moving) {
    weaponAngle = stride * 0.16;
  }

  const heroCenterX = W * 0.5;
  const footGroundY = H - 20;

  ctx.save();
  ctx.translate(heroCenterX + lungeX + swayX * 0.5, footGroundY + bob);

  // Back wings / capes / halos behind torso & legs
  if (heroId === 'valkyria') {
    const spread =
      opts.attackPhase === 'special'
        ? 1.24
        : opts.attackPhase === 'strike'
          ? 1.12
          : 1 + Math.sin(opts.phase) * 0.08;
    const wingSides = isSide && !isFront ? [-1, 1] : [-1, 1];
    for (const side of wingSides) {
      if (isSide && side === 1 && !isDiag && !isBack) continue;
      ctx.save();
      ctx.translate(isSide ? -8 : side * 12, -88);
      ctx.scale(side * spread, 1);
      ctx.rotate(side === -1 ? -0.06 : 0.06);

      // Feathered cyan energy wing
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-56, -44);
      ctx.lineTo(-38, -14);
      ctx.lineTo(-62, -6);
      ctx.lineTo(-34, 8);
      ctx.lineTo(-48, 22);
      ctx.lineTo(-16, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner white feather glow
      ctx.fillStyle = '#ecfeff';
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(-42, -30);
      ctx.lineTo(-28, -4);
      ctx.lineTo(-40, 10);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();

      // Gold wing mount bracket
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-12, -8, 14, 18, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (heroId === 'kronos') {
    ctx.save();
    ctx.translate(isSide ? -8 : 0, -108);
    ctx.rotate(opts.moving ? opts.phase * 0.15 : opts.attackPhase === 'strike' ? 0.35 : 0);

    // Golden clock rune wheel behind head/shoulders
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();

    // 8 clock rune ticks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rx = Math.cos(a) * 50;
      const ry = Math.sin(a) * 50;
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else if (heroId === 'drake') {
    // Flowing dark emerald assassin cape
    const flutter = opts.moving ? stride * 7 : opts.attackPhase === 'strike' ? -8 : 0;
    ctx.save();
    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(isSide ? -12 : -22, -92);
    ctx.lineTo(isSide ? -36 + flutter : -28 + flutter * 0.5, -24);
    ctx.lineTo(isSide ? 10 : 28 + flutter * 0.5, -26);
    ctx.lineTo(isSide ? 8 : 22, -92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (heroId === 'solara') {
    // Flowing golden long hair back layer + spiked golden halo
    const hairFlutter = opts.moving ? stride * 6 : 0;
    ctx.save();
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, -124);
    ctx.quadraticCurveTo(-40 + hairFlutter, -84, -28 + hairFlutter, -48);
    ctx.lineTo(28 + hairFlutter, -48);
    ctx.quadraticCurveTo(40 + hairFlutter, -84, 24, -124);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Halo behind head
    ctx.translate(isSide ? -2 : 0, -162);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 10, -0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 10, -0.05, 0, Math.PI * 2);
    ctx.stroke();
    for (const sx of [-30, -15, 0, 15, 30]) {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx - 4, -8);
      ctx.lineTo(sx, -18);
      ctx.lineTo(sx + 4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Articulated Legs with bent knees in stride
  const legW = st.bulky ? 13.5 : 10.5;
  if (isSide) {
    const legSwing = stride * 17;
    const attackSpread = opts.attackPhase === 'strike' ? 12 : opts.attackPhase === 'windup' ? -6 : 0;
    const backHipX = -6;
    const backFootX = -8 - legSwing - attackSpread * 0.7;
    const backFootY = -2 - liftB;
    const backKneeX = (backHipX + backFootX) * 0.5 + 4;
    const backKneeY = (-46 + backFootY) * 0.5 - liftB * 0.25;

    const frontHipX = 6;
    const frontFootX = 8 + legSwing + attackSpread;
    const frontFootY = -2 - liftA;
    const frontKneeX = (frontHipX + frontFootX) * 0.5 + 6;
    const frontKneeY = (-46 + frontFootY) * 0.5 - liftA * 0.25;

    drawCelJointedLeg(
      ctx,
      backHipX,
      -46,
      backKneeX,
      backKneeY,
      backFootX,
      backFootY,
      legW,
      st.legMain,
      st.legShade,
      st.bootMain,
      st.bootTrim,
      true,
      stride * -0.18
    );
    drawCelJointedLeg(
      ctx,
      frontHipX,
      -46,
      frontKneeX,
      frontKneeY,
      frontFootX,
      frontFootY,
      legW,
      st.legMain,
      st.legShade,
      st.bootMain,
      st.bootTrim,
      true,
      stride * 0.18
    );
  } else {
    drawCelJointedLeg(
      ctx,
      -13,
      -44,
      -15,
      -24 - liftA * 0.5,
      -15,
      -2 - liftA,
      legW,
      st.legMain,
      st.legShade,
      st.bootMain,
      st.bootTrim,
      false
    );
    drawCelJointedLeg(
      ctx,
      13,
      -44,
      15,
      -24 - liftB * 0.5,
      15,
      -2 - liftB,
      legW,
      st.legMain,
      st.legShade,
      st.bootMain,
      st.bootTrim,
      false
    );
  }

  // Main upper torso pivot
  ctx.save();
  ctx.rotate(bodyTilt);

  // Back Arm (visible on side/diag)
  if (isSide && !isBack) {
    const backArmX = (opts.attackPhase === 'strike' ? -4 : -14) - stride * 8;
    const backArmY = opts.attackPhase === 'strike' ? -64 : -56;
    drawCelArm(
      ctx,
      -10,
      -84,
      backArmX,
      backArmY,
      st.bulky ? 11.5 : 8.5,
      st.torsoMain,
      st.torsoShade,
      st.bootTrim
    );
    if (heroId === 'nina') {
      // Offhand Lime SMG angled forward
      ctx.save();
      ctx.translate(backArmX, backArmY);
      ctx.rotate(opts.attackPhase === 'strike' ? 0.08 : -0.1);
      ctx.fillStyle = '#a3e635';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-2, -9, 28, 13, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, -9, 14, 6);
      if (opts.attackPhase === 'strike') {
        drawMuzzleBurst(ctx, 32, -2, '#bef264', 11);
      }
      ctx.restore();
    } else if (heroId === 'ryder') {
      // Offhand curved magenta void blade
      ctx.save();
      ctx.translate(backArmX, backArmY);
      ctx.rotate(opts.attackPhase === 'strike' ? -0.4 : 0.25);
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(22, -6, 30, -24);
      ctx.quadraticCurveTo(10, -16, -2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (heroId === 'titanx') {
      // Offhand 6-barrel gatling cannon
      ctx.save();
      ctx.translate(backArmX + 2, backArmY);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-4, -9, 30, 18, 5);
      ctx.fill();
      ctx.stroke();
      if (opts.attackPhase === 'strike') {
        drawMuzzleBurst(ctx, 32, 0, '#fbbf24', 13);
      }
      ctx.restore();
    }
  }

  // Torso (with cel shading + belt/trim)
  const torsoW = st.bulky ? 58 : 44;
  const torsoH = st.robe ? 60 : 50;
  ctx.fillStyle = st.torsoMain;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  if (st.robe) {
    ctx.moveTo(-torsoW * 0.46, -92);
    ctx.lineTo(torsoW * 0.46, -92);
    ctx.lineTo(torsoW * 0.68, -22);
    ctx.lineTo(-torsoW * 0.68, -22);
    ctx.closePath();
  } else {
    ctx.roundRect(-torsoW * 0.5, -94, torsoW, torsoH, 13);
  }
  ctx.fill();

  // Cel shading crescent on lower/left torso
  ctx.save();
  ctx.clip();
  ctx.fillStyle = st.torsoShade;
  ctx.beginPath();
  ctx.roundRect(-torsoW * 0.72, -62, torsoW * 0.9, torsoH, 12);
  ctx.fill();
  ctx.restore();

  // Re-stroke torso outline sharply
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  // Hero-specific chestplate, belt & coat trim details
  ctx.fillStyle = st.torsoTrim;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-torsoW * 0.36, -86, torsoW * 0.72, 16, 6);
  ctx.fill();
  ctx.stroke();

  // Waist belt
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-torsoW * 0.48, -50, torsoW * 0.96, 9, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = st.torsoTrim;
  ctx.beginPath();
  ctx.roundRect(-6, -51, 12, 11, 3);
  ctx.fill();
  ctx.stroke();

  if (heroId === 'titanx') {
    // Glowing golden arc core
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(isSide ? 10 : 0, -76, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Twin red-tipped shoulder missile pods!
    for (const sx of isSide ? [-20, 14] : [-35, 35]) {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(sx - 12, -108, 24, 24, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx - 9, -105, 18, 18);
      for (const mx of [-4, 4]) {
        for (const my of [-100, -92]) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(sx + mx, my, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (heroId === 'frost') {
    // Fluffy scalloped white fur collar & gold toggles
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.roundRect(-29, -98, 58, 16, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(isSide ? 8 : 0, -86, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'valkyria') {
    // White & gold valkyrie pauldrons + cyan chest gem
    for (const px of isSide ? [12] : [-25, 25]) {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(px, -88, 11, 8, px > 0 ? 0.3 : -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(isSide ? 8 : 0, -84);
    ctx.lineTo((isSide ? 8 : 0) + 6, -76);
    ctx.lineTo(isSide ? 8 : 0, -68);
    ctx.lineTo((isSide ? 8 : 0) - 6, -76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'ryder') {
    // Glowing magenta chest reactor V
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(isSide ? 10 : 0, -68);
    ctx.lineTo((isSide ? 10 : 0) - 9, -82);
    ctx.lineTo((isSide ? 10 : 0) + 9, -82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'kronos') {
    // Gold rune robe trim + violet chest orb
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(isSide ? 8 : 0, -80, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'kairo') {
    // V-neck cyan-trimmed martial arts gi + orange belt knot
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -92);
    ctx.lineTo(isSide ? 6 : 0, -68);
    ctx.lineTo(14, -92);
    ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-torsoW * 0.48, -51, torsoW * 0.96, 8, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Head
  const headR = st.bulky ? 35 : 33;
  const headY = -126;

  // Back hair/hood halo layer
  if (heroId === 'drake' || heroId === 'kronos') {
    ctx.fillStyle = st.hairOrHelm;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, headY - 2, headR + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Pointed hood tip
    ctx.beginPath();
    ctx.moveTo(-18, headY - headR);
    ctx.lineTo(0, headY - headR - 14);
    ctx.lineTo(18, headY - headR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'nina') {
    // Spiky windswept teal back hair
    ctx.fillStyle = '#0d9488';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, headY);
    ctx.lineTo(-44, headY - 12);
    ctx.lineTo(-32, headY - 22);
    ctx.lineTo(-42, headY - 34);
    ctx.lineTo(-14, headY - 38);
    ctx.lineTo(8, headY - 46);
    ctx.lineTo(26, headY - 32);
    ctx.lineTo(36, headY - 14);
    ctx.lineTo(24, headY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (heroId === 'frost') {
    // Spiky cryo-blue back hair spikes
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, headY - 4);
    ctx.lineTo(-44, headY - 22);
    ctx.lineTo(-28, headY - 30);
    ctx.lineTo(-18, headY - 48);
    ctx.lineTo(4, headY - 44);
    ctx.lineTo(24, headY - 42);
    ctx.lineTo(38, headY - 20);
    ctx.lineTo(28, headY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Head main base shape
  ctx.fillStyle = isBack ? st.hairOrHelm : st.skinOrVisor;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  if (heroId === 'titanx' || heroId === 'boulder') {
    ctx.roundRect(-headR, headY - headR * 0.92, headR * 2, headR * 1.84, 18);
  } else {
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
  }
  ctx.fill();

  // Cel shade under chin/side of head
  ctx.save();
  ctx.clip();
  ctx.fillStyle = isBack ? st.torsoShade : st.skinShade;
  ctx.beginPath();
  ctx.arc(-10, headY + 14, headR * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  // Front & Side Facial Features + Hair/Helmet Sculpt
  if (!isBack) {
    const faceOffset = isSide && !isDiag ? 10 : isDiag ? 6 : 0;

    if (heroId === 'baston') {
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, headY - 5, headR + 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 17, headY - 7, 34, 15, 6);
      ctx.fill();
      ctx.stroke();
      for (const ax of [-headR - 2, headR - 5]) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ax, headY - 38, 7, 22);
        ctx.strokeRect(ax, headY - 38, 7, 22);
      }
    } else if (heroId === 'nina') {
      // Cheek armor tabs
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.fillRect(-headR + 1, headY + 6, 8, 12);
      ctx.strokeRect(-headR + 1, headY + 6, 8, 12);

      // Spiky teal front bangs + lime forehead goggles
      ctx.fillStyle = '#2dd4bf';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, headY - 12, headR + 2, Math.PI * 0.95, Math.PI * 0.05);
      ctx.lineTo(18, headY - 10);
      ctx.lineTo(8, headY - 2);
      ctx.lineTo(0, headY - 14);
      ctx.lineTo(-10, headY - 3);
      ctx.lineTo(-22, headY - 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Goggles
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 23, headY - 35, 46, 17, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 18, headY - 32, 16, 11, 3);
      ctx.roundRect(faceOffset + 2, headY - 32, 16, 11, 3);
      ctx.fill();
      ctx.stroke();

      drawAnimeEye(ctx, faceOffset - 10, headY + 6, st.eyeColor);
      if (isFront || isDiag) {
        drawAnimeEye(ctx, faceOffset + 12, headY + 6, st.eyeColor);
      }
      // Confident smirk
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(faceOffset + 1, headY + 18, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (heroId === 'drake') {
      // Tactical mask & glowing emerald H-visor inside dark hood
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(faceOffset - 19, headY - 10, 38, 22, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 15, headY - 6, 30, 12, 4);
      ctx.fill();
      // H-bar glowing reflection
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(faceOffset - 11, headY - 1, 22, 3);
      ctx.fillRect(faceOffset - 7, headY - 5, 3, 10);
      ctx.fillRect(faceOffset + 4, headY - 5, 3, 10);
    } else if (heroId === 'kairo') {
      // Spiky Goku-style dark hair
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-29, headY - 6);
      ctx.lineTo(-40, headY - 34);
      ctx.lineTo(-16, headY - 30);
      ctx.lineTo(-4, headY - 52);
      ctx.lineTo(14, headY - 32);
      ctx.lineTo(36, headY - 40);
      ctx.lineTo(28, headY - 10);
      ctx.lineTo(12, headY - 16);
      ctx.lineTo(0, headY - 6);
      ctx.lineTo(-14, headY - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      drawAnimeEye(ctx, faceOffset - 10, headY + 4, st.eyeColor);
      if (isFront || isDiag) {
        drawAnimeEye(ctx, faceOffset + 12, headY + 4, st.eyeColor);
      }
      // Bold martial eyebrows
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(faceOffset - 17, headY - 7);
      ctx.lineTo(faceOffset - 4, headY - 3);
      if (isFront || isDiag) {
        ctx.moveTo(faceOffset + 19, headY - 7);
        ctx.lineTo(faceOffset + 6, headY - 3);
      }
      ctx.stroke();
    } else if (heroId === 'ryder') {
      // Curved indigo horns + sculpted knight visor + glowing magenta eyes
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(side * 16, headY - 22);
        ctx.quadraticCurveTo(side * 40, headY - 48, side * 26, headY - 56);
        ctx.quadraticCurveTo(side * 18, headY - 38, side * 9, headY - 26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Faceplate slits
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(faceOffset - 10, headY + 12, 20, 14);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(faceOffset - 4, headY + 14);
      ctx.lineTo(faceOffset - 4, headY + 24);
      ctx.moveTo(faceOffset + 4, headY + 14);
      ctx.lineTo(faceOffset + 4, headY + 24);
      ctx.stroke();

      // Glowing magenta eyes
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(faceOffset - 10, headY + 1, 8, 5, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (isFront || isDiag) {
        ctx.beginPath();
        ctx.ellipse(faceOffset + 11, headY + 1, 8, 5, -0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (heroId === 'solara') {
      // Layered blonde bangs + golden diamond tiara + warm amber eyes
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, headY - 8, headR + 3, Math.PI * 0.92, Math.PI * 0.08);
      ctx.lineTo(14, headY - 10);
      ctx.lineTo(0, headY - 18);
      ctx.lineTo(-14, headY - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden tiara
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(faceOffset - 14, headY - 18);
      ctx.lineTo(faceOffset, headY - 30);
      ctx.lineTo(faceOffset + 14, headY - 18);
      ctx.lineTo(faceOffset, headY - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      drawAnimeEye(ctx, faceOffset - 10, headY + 5, st.eyeColor);
      if (isFront || isDiag) {
        drawAnimeEye(ctx, faceOffset + 12, headY + 5, st.eyeColor);
      }
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(faceOffset + 1, headY + 18, 5.5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (heroId === 'frost') {
      // Spiky light-cyan hair + royal diamond ice crown
      ctx.fillStyle = '#7dd3fc';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(0, headY - 10, headR + 3, Math.PI * 0.94, Math.PI * 0.06);
      ctx.lineTo(14, headY - 4);
      ctx.lineTo(2, headY - 14);
      ctx.lineTo(-10, headY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ice crown
      ctx.save();
      ctx.translate(6, headY - 26);
      ctx.rotate(0.18);
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-19, -22);
      ctx.lineTo(-7, -10);
      ctx.lineTo(0, -26);
      ctx.lineTo(7, -10);
      ctx.lineTo(19, -22);
      ctx.lineTo(16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawAnimeEye(ctx, faceOffset - 10, headY + 5, st.eyeColor);
      if (isFront || isDiag) {
        drawAnimeEye(ctx, faceOffset + 12, headY + 5, st.eyeColor);
      }
      // Tiny ice cheek crystal marks
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(faceOffset - 18, headY + 14, 5, 4);
      if (isFront || isDiag) {
        ctx.fillRect(faceOffset + 14, headY + 14, 5, 4);
      }
    } else if (heroId === 'valkyria') {
      // Blonde side locks under helm
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-headR + 1, headY + 6, 9, 22, 4);
      ctx.roundRect(headR - 10, headY + 6, 9, 22, 4);
      ctx.fill();
      ctx.stroke();

      // White & gold Valkyrie helmet dome
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, headY - 5, headR + 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold helmet crest & halo above head
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-5, headY - headR - 3, 10, 26);
      ctx.strokeRect(-5, headY - headR - 3, 10, 26);

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.ellipse(0, headY - headR - 12, 22, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Winged ear fins
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#22d3ee';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(side * (headR - 2), headY - 4);
        ctx.lineTo(side * (headR + 15), headY - 28);
        ctx.lineTo(side * (headR - 4), headY - 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Dark visor V with glowing cyan eyes
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(faceOffset - 18, headY - 10, 36, 17, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(faceOffset - 8, headY - 2, 6.5, 4, 0.25, 0, Math.PI * 2);
      ctx.fill();
      if (isFront || isDiag) {
        ctx.beginPath();
        ctx.ellipse(faceOffset + 9, headY - 2, 6.5, 4, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (heroId === 'kronos') {
      // Ornate gold hood crest + void face + glowing magenta eyes
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(faceOffset - 12, headY - 26);
      ctx.lineTo(faceOffset, headY - 38);
      ctx.lineTo(faceOffset + 12, headY - 26);
      ctx.lineTo(faceOffset, headY - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.ellipse(faceOffset - 10, headY + 2, 8, 5, 0.22, 0, Math.PI * 2);
      ctx.fill();
      if (isFront || isDiag) {
        ctx.beginPath();
        ctx.ellipse(faceOffset + 11, headY + 2, 8, 5, -0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (heroId === 'titanx') {
      // Forehead cyan sensor + golden V-fin + metallic faceplate + yellow visor eyes
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.fillRect(-7, headY - headR - 4, 14, 12);
      ctx.strokeRect(-7, headY - headR - 4, 14, 12);

      // Golden V-fin horn
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, headY - 16);
      ctx.lineTo(-32, headY - 46);
      ctx.lineTo(-6, headY - 24);
      ctx.lineTo(0, headY - 18);
      ctx.lineTo(6, headY - 24);
      ctx.lineTo(32, headY - 46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Grey mech face mask
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 17, headY + 4, 34, 18, 5);
      ctx.fill();
      ctx.stroke();

      // Glowing yellow eyes
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(faceOffset - 20, headY - 9, 40, 14, 5);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(faceOffset - 9, headY - 2, 7.5, 4.2, 0.15, 0, Math.PI * 2);
      ctx.fill();
      if (isFront || isDiag) {
        ctx.beginPath();
        ctx.ellipse(faceOffset + 10, headY - 2, 7.5, 4.2, -0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Pure back view distinctive emblems (V-fin / crown / gold hood spine / hair bow)
    ctx.fillStyle = st.torsoTrim;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.5;
    if (heroId === 'titanx') {
      ctx.beginPath();
      ctx.moveTo(-26, headY - 40);
      ctx.lineTo(0, headY - 18);
      ctx.lineTo(26, headY - 40);
      ctx.lineTo(0, headY - 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (heroId === 'frost') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-14, headY - 26);
      ctx.lineTo(0, headY - 44);
      ctx.lineTo(14, headY - 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, headY - 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Front Arm + Hero Weapon + Built-In Strike FX
  if (!isBack) {
    const handX = (isSide ? 18 : 22) + armReach * (isSide ? 1 : 0.45);
    const handY = -68 + (opts.attackPhase === 'strike' ? -4 : 0);
    drawCelArm(
      ctx,
      isSide ? 4 : 18,
      -84,
      handX,
      handY,
      st.bulky ? 12 : 9,
      st.torsoMain,
      st.torsoShade,
      st.bootTrim
    );

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(weaponAngle);

    if (heroId === 'baston') {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-4, -38, 10, 44, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, -34, 8, 10);

      ctx.save();
      ctx.translate(isSide ? -26 : -40, 2);
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.roundRect(-12, -20, 24, 38, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -1, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (heroId === 'nina') {
      // Main neon-lime SMG
      ctx.fillStyle = '#a3e635';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.roundRect(-4, -10, 32, 15, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, -10, 16, 6);
      ctx.fillRect(2, 5, 8, 11);
      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 35, -3, '#a3e635', 14);
      }
    } else if (heroId === 'drake') {
      // Long scoped emerald rail-sniper
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.roundRect(-12, -7, 54, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#022c22';
      ctx.fillRect(8, -14, 18, 6);
      ctx.strokeRect(8, -14, 18, 6);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(28, -4, 14, 5);
      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 48, -1, '#4ade80', 15);
      }
    } else if (heroId === 'kairo') {
      // Glowing cyan lightning fist + crackle aura
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.arc(4, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ecfeff';
      ctx.beginPath();
      ctx.arc(5, -2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (heroId === 'ryder') {
      // Main curved magenta void blade + wide plasma crescent wave
      ctx.fillStyle = '#ec4899';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.quadraticCurveTo(26, -6, 36, -28);
      ctx.quadraticCurveTo(14, -18, -2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawGlowingSlashWave(ctx, 14, -12, 34, -1.1, 0.9, 'rgba(236, 72, 153, 0.85)');
      }
    } else if (heroId === 'solara') {
      // Golden sun-ring crystal staff
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.fillRect(-3, -40, 6, 66);
      ctx.strokeRect(-3, -40, 6, 66);

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -52, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.8;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -52, 8, 0, Math.PI * 2);
      ctx.fill();
      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 18, -52, '#fde047', 16);
      }
    } else if (heroId === 'frost') {
      // Diamond ice crystal trident staff
      ctx.fillStyle = '#075985';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.fillRect(-3, -40, 6, 66);
      ctx.strokeRect(-3, -40, 6, 66);

      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, -72);
      ctx.lineTo(14, -48);
      ctx.lineTo(0, -32);
      ctx.lineTo(-14, -48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 16, -48, '#38bdf8', 15);
      }
    } else if (heroId === 'valkyria') {
      // Long glowing cyan energy halberd spear
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.fillRect(-3, -48, 6, 78);
      ctx.strokeRect(-3, -48, 6, 78);

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(0, -78);
      ctx.lineTo(15, -46);
      ctx.lineTo(0, -38);
      ctx.lineTo(-15, -46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawGlowingSlashWave(ctx, 12, -32, 38, -1.0, 0.85, 'rgba(34, 211, 238, 0.9)');
      }
    } else if (heroId === 'kronos') {
      // Clockwork golden staff + purple temporal orb
      ctx.fillStyle = '#312e81';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.8;
      ctx.fillRect(-3, -40, 6, 66);
      ctx.strokeRect(-3, -40, 6, 66);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, -52, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(0, -61);
      ctx.moveTo(0, -52);
      ctx.lineTo(7, -48);
      ctx.stroke();

      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 18, -50, '#c084fc', 15);
      }
    } else if (heroId === 'titanx') {
      // Huge 6-barrel rotating gatling arm cannon
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-10, -14, 28, 28, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(14, -10, 26, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(20, -10, 5, 20);

      if (opts.attackPhase === 'strike' || opts.attackPhase === 'special') {
        drawMuzzleBurst(ctx, 48, 0, '#fbbf24', 17);
      }
    } else if (heroId === 'knox') {
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-8, -14, 38, 22, 6);
      ctx.fill();
      ctx.stroke();
    } else if (heroId === 'boulder') {
      ctx.fillStyle = '#57534e';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(-8, -10, 26, 26, 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore(); // upper body rotate
  ctx.restore(); // root translate

  // Reference body height keeps the hero proportional across idle, wide wing/halo/attack poses
  const refBodyHeight = st.bulky ? 170 : 164;
  return trimAndBakeFrame(canvas, heroCenterX, refBodyHeight);
}

export function buildNewHeroSprites(heroId: NewHeroId): NewHeroSpriteSet {
  const walkSide8: BakedSpriteFrame[] = [];
  const walkDiag8: BakedSpriteFrame[] = [];
  const walkFront: BakedSpriteFrame[] = [];
  const walkBack: BakedSpriteFrame[] = [];
  const walkBackDiag: BakedSpriteFrame[] = [];

  for (let i = 0; i < 8; i++) {
    const phase = (i / 8) * Math.PI * 2;
    walkSide8.push(renderHeroFrame(heroId, { view: 'side', phase, moving: true, attackPhase: 'none' }));
    walkDiag8.push(renderHeroFrame(heroId, { view: 'diag', phase, moving: true, attackPhase: 'none' }));
    if (i < 6) {
      const p6 = (i / 6) * Math.PI * 2;
      walkFront.push(renderHeroFrame(heroId, { view: 'front', phase: p6, moving: true, attackPhase: 'none' }));
      walkBack.push(renderHeroFrame(heroId, { view: 'back', phase: p6, moving: true, attackPhase: 'none' }));
    }
    if (i < 4) {
      const p4 = (i / 4) * Math.PI * 2;
      walkBackDiag.push(renderHeroFrame(heroId, { view: 'backDiag', phase: p4, moving: true, attackPhase: 'none' }));
    }
  }

  return {
    idleGuard: renderHeroFrame(heroId, { view: 'diag', phase: 0, moving: false, attackPhase: 'none' }),
    idleSide: renderHeroFrame(heroId, { view: 'side', phase: 0, moving: false, attackPhase: 'none' }),
    idleDiag: renderHeroFrame(heroId, { view: 'diag', phase: 0, moving: false, attackPhase: 'none' }),
    idleFront: renderHeroFrame(heroId, { view: 'front', phase: 0, moving: false, attackPhase: 'none' }),
    idleBack: renderHeroFrame(heroId, { view: 'back', phase: 0, moving: false, attackPhase: 'none' }),
    idleBackDiag: renderHeroFrame(heroId, { view: 'backDiag', phase: 0, moving: false, attackPhase: 'none' }),
    attackWindup: renderHeroFrame(heroId, { view: 'side', phase: 0, moving: false, attackPhase: 'windup' }),
    attackSide: renderHeroFrame(heroId, { view: 'side', phase: 0, moving: false, attackPhase: 'strike' }),
    attackDiag: renderHeroFrame(heroId, { view: 'diag', phase: 0, moving: false, attackPhase: 'strike' }),
    attackFront: renderHeroFrame(heroId, { view: 'front', phase: 0, moving: false, attackPhase: 'strike' }),
    attackBackDiag: renderHeroFrame(heroId, { view: 'backDiag', phase: 0, moving: false, attackPhase: 'strike' }),
    attackSpecial: renderHeroFrame(heroId, { view: 'diag', phase: 0, moving: false, attackPhase: 'special' }),
    walkSide8,
    walkDiag8,
    walkFront,
    walkBack,
    walkBackDiag,
  };
}
