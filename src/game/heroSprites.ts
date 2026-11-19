import spriteClusterAttackUrl from '../assets/images/cluster_attack_sheet_1794670375123.jpg';
import spriteClusterPosesUrl from '../assets/images/cluster_cartoon_poses_1794670374875.jpg';
import spriteClusterWalkDiagUrl from '../assets/images/cluster_walk_diag_8f_1794670379398.jpg';
import spriteClusterWalkFbUrl from '../assets/images/cluster_walk_fb_8f_1794670377688.jpg';
import spriteClusterWalkSideUrl from '../assets/images/cluster_walk_side_8f_1794670376752.jpg';
import spriteEldragAttackUrl from '../assets/images/eldragon_attack_sheet_1794667914780.jpg';
import spriteEldragPosesUrl from '../assets/images/eldragon_cartoon_poses_1794667074433.jpg';
import spriteEldragWalkDiagUrl from '../assets/images/eldragon_walk_diag_8f_1794667077387.jpg';
import spriteEldragWalkFbUrl from '../assets/images/eldragon_walk_fb_8f_1794667915401.jpg';
import spriteEldragWalkSideUrl from '../assets/images/eldragon_walk_side_8f_1794667076543.jpg';
import spriteKongAttackUrl from '../assets/images/kong_attack_sheet_v2_1794667943555.jpg';
import spriteKongPosesUrl from '../assets/images/kong_cartoon_poses_1794667914912.jpg';
import spriteKongWalkDiagUrl from '../assets/images/kong_walk_diag_8f_1794667917685.jpg';
import spriteKongWalkFbUrl from '../assets/images/kong_walk_fb_8f_1794667919287.jpg';
import spriteKongWalkSideUrl from '../assets/images/kong_walk_side_8f_1794667916559.jpg';
import spritePhoenixAttackUrl from '../assets/images/phoenix_attack_sheet_1794668830539.jpg';
import spritePhoenixPosesUrl from '../assets/images/phoenix_cartoon_poses_1794668827069.jpg';
import spritePhoenixWalkDiagUrl from '../assets/images/phoenix_walk_diag_8f_1794668829499.jpg';
import spritePhoenixWalkFbUrl from '../assets/images/phoenix_walk_fb_8f_1794668833291.jpg';
import spritePhoenixWalkSideUrl from '../assets/images/phoenix_walk_side_8f_1794668828009.jpg';
import spriteRaidonAttackUrl from '../assets/images/raidon_attack_sheet_1794668818539.jpg';
import spriteRaidonPosesUrl from '../assets/images/raidon_cartoon_poses_1794668812931.jpg';
import spriteRaidonWalkDiagUrl from '../assets/images/raidon_walk_diag_8f_1794668816024.jpg';
import spriteRaidonWalkFbUrl from '../assets/images/raidon_walk_fb_8f_1794668818116.jpg';
import spriteRaidonWalkSideUrl from '../assets/images/raidon_walk_side_8f_1794668815117.jpg';
import spriteSteelshotPosesUrl from '../assets/images/sprite_steelshot_positions_1794622142588.jpg';
import spriteSteelshotAttackUrl from '../assets/images/steelshot_attack_sheet_1794667912720.jpg';
import spriteSteelshotExtraUrl from '../assets/images/steelshot_positions_extra_1794656546102.jpg';
import spriteSteelshotWalkDiagV2Url from '../assets/images/steelshot_walk_diag_v2_1794665041596.jpg';
import spriteSteelshotWalkFb8fUrl from '../assets/images/steelshot_walk_fb_8f_1794656545300.jpg';
import spriteSteelshotWalkSideV2Url from '../assets/images/steelshot_walk_side_v2_1794665040214.jpg';
import spriteVeinkaAttackUrl from '../assets/images/veinka_attack_sheet_1794668824173.jpg';
import spriteVeinkaPosesUrl from '../assets/images/veinka_cartoon_poses_1794668819980.jpg';
import spriteVeinkaWalkDiagUrl from '../assets/images/veinka_walk_diag_8f_1794668822420.jpg';
import spriteVeinkaWalkFbUrl from '../assets/images/veinka_walk_fb_8f_1794668823068.jpg';
import spriteVeinkaWalkSideUrl from '../assets/images/veinka_walk_side_8f_1794668821811.jpg';
import spriteMeiroPosesUrl from '../assets/images/meiro_cartoon_poses_1794671603278.jpg';
import spriteMeiroWalkSideUrl from '../assets/images/meiro_walk_side_8f_1794671606098.jpg';
import spriteVelvetAttackUrl from '../assets/images/velvet_attack_sheet_1794670379932.jpg';
import spriteVelvetWalkDiagUrl from '../assets/images/velvet_walk_diag_8f_1794670380862.jpg';
import spriteVelvetWalkSideUrl from '../assets/images/velvet_walk_side_8f_1794670379990.jpg';
import spriteBastonWalkSideUrl from '../assets/images/baston_walk_sheet_1794697400624.jpg';
import spriteKnoxAttackUrl from '../assets/images/knox_attack_sheet_1794697408296.jpg';
import spriteKairoWalkSideUrl from '../assets/images/kairo_walk_sheet_1794697410297.jpg';
import spriteBoulderAttackUrl from '../assets/images/boulder_attack_sheet_1794697412701.jpg';
import spriteNinaPosesUrl from '../assets/images/nina_poses_sheet_1794698707345.jpg';
import cutoutBastonUrl from '../assets/images/baston_cutout.png';
import cutoutKairoUrl from '../assets/images/kairo_cutout.png';
import cutoutDrakeUrl from '../assets/images/drake_cutout.png';
import cutoutRyderUrl from '../assets/images/ryder_cutout.png';
import cutoutSolaraUrl from '../assets/images/solara_cutout.png';
import cutoutFrostUrl from '../assets/images/frost_cutout.png';
import cutoutValkyriaUrl from '../assets/images/valkyria_cutout.png';
import cutoutKronosUrl from '../assets/images/kronos_cutout.png';
import cutoutTitanxUrl from '../assets/images/titanx_cutout.png';
import { HEROES } from './heroes';
import {
  type HeroActionEffectStyle,
  createHeroActionPose,
  createKatanaAttackPose,
  createSteppingCycleFromPose,
  createVelvetBackSprites,
} from './meiroSprites';
import { getHeroSkinSpec } from './heroSkins';
import {
  NEW_HERO_IDS,
  NewHeroId,
  buildNewHeroSprites,
  isNewProceduralHero,
} from './newHeroSprites';
import { ActorState, HeroId, HeroSkinId } from './types';

interface ProcessedSprite {
  normal: HTMLCanvasElement;
  flash: HTMLCanvasElement;
  aspect: number;
  relHeight: number;
  headShiftNorm: number;
}

interface HeroSpriteBank {
  idleGuard?: ProcessedSprite;
  idleSide?: ProcessedSprite;
  idleDiag?: ProcessedSprite;
  idleFront?: ProcessedSprite;
  idleBack?: ProcessedSprite;
  idleBackDiag?: ProcessedSprite;
  aimUp?: ProcessedSprite;
  actionStance?: ProcessedSprite;
  attackWindup?: ProcessedSprite;
  attackSide?: ProcessedSprite;
  attackAltSide?: ProcessedSprite;
  attackDiag?: ProcessedSprite;
  attackFront?: ProcessedSprite;
  attackBackDiag?: ProcessedSprite;
  attackSpecial?: ProcessedSprite;
  walkSide8: ProcessedSprite[];
  walkDiag8: ProcessedSprite[];
  walkFront: ProcessedSprite[];
  walkBack: ProcessedSprite[];
  walkBackDiag: ProcessedSprite[];
}

const spriteLoading: Partial<Record<HeroId, boolean>> = {};
const aiNewHeroLoaded: Partial<Record<NewHeroId, boolean>> = {};
const smoothAimMap = new WeakMap<ActorState, number>();

const emptyBank = (): HeroSpriteBank => ({
  walkSide8: [],
  walkDiag8: [],
  walkFront: [],
  walkBack: [],
  walkBackDiag: [],
});

const heroBanks: Record<HeroId, HeroSpriteBank> = {
  steelshot: emptyBank(),
  eldragon: emptyBank(),
  kong: emptyBank(),
  raidon: emptyBank(),
  veinka: emptyBank(),
  phoenix: emptyBank(),
  cluster: emptyBank(),
  velvet: emptyBank(),
  meiro: emptyBank(),
  baston: emptyBank(),
  nina: emptyBank(),
  drake: emptyBank(),
  knox: emptyBank(),
  kairo: emptyBank(),
  boulder: emptyBank(),
  ryder: emptyBank(),
  solara: emptyBank(),
  frost: emptyBank(),
  valkyria: emptyBank(),
  kronos: emptyBank(),
  titanx: emptyBank(),
};

const steelshotRaw: {
  positions?: Array<ProcessedSprite | null>;
  extra?: Array<ProcessedSprite | null>;
  attack?: Array<ProcessedSprite | null>;
  walkSideV2?: Array<ProcessedSprite | null>;
  walkDiagV2?: Array<ProcessedSprite | null>;
  walkFb8f?: Array<ProcessedSprite | null>;
} = {};

let onSpriteReadyCallback: (() => void) | null = null;

function chromaKeyImage(
  img: HTMLImageElement,
  preserveWarmLime = false
): {
  canvas: HTMLCanvasElement;
  data: Uint8ClampedArray;
  width: number;
  height: number;
} | null {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return null;

  const work = document.createElement('canvas');
  work.width = srcW;
  work.height = srcH;
  const wCtx = work.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return null;

  wCtx.drawImage(img, 0, 0, srcW, srcH);
  const imageData = wCtx.getImageData(0, 0, srcW, srcH);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    let g = data[i + 1];
    const b = data[i + 2];

    const maxRB = r > b ? r : b;
    const greenExcess = g - maxRB;

    if (preserveWarmLime && r >= 115) {
      continue;
    }

    if (greenExcess > 50 && g > 80) {
      data[i + 3] = 0;
      continue;
    }

    if (greenExcess > 15 && g > 46) {
      const t = (greenExcess - 15) / (50 - 15);
      const alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - t))));
      g = Math.min(g, maxRB);
      data[i + 1] = g;
      data[i + 3] = alpha;
    } else if (greenExcess > 0) {
      data[i + 1] = maxRB;
    }
  }

  wCtx.putImageData(imageData, 0, 0);
  return { canvas: work, data, width: srcW, height: srcH };
}

interface RawCellBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  headShiftNorm: number;
}

function measureSubRect(
  data: Uint8ClampedArray,
  srcW: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): RawCellBounds | null {
  let minX = x1;
  let minY = y1;
  let maxX = x0 - 1;
  let maxY = y0 - 1;

  for (let y = y0; y < y1; y++) {
    const rowOffset = y * srcW * 4;
    for (let x = x0; x < x1; x++) {
      if (data[rowOffset + x * 4 + 3] > 14) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const headMaxY = minY + Math.floor(cropH * 0.36);
  let sumX = 0;
  let count = 0;
  for (let y = minY; y <= headMaxY; y++) {
    const rowOffset = y * srcW * 4;
    for (let x = minX; x <= maxX; x++) {
      if (data[rowOffset + x * 4 + 3] > 40) {
        sumX += x;
        count++;
      }
    }
  }
  const headCenterX = count > 0 ? sumX / count : minX + cropW * 0.5;
  const rawShift = (headCenterX - (minX + cropW * 0.5)) / cropW;
  const headShiftNorm = Math.max(-0.14, Math.min(0.14, rawShift));

  return { minX, minY, maxX, maxY, headShiftNorm };
}

function bakeBounds(
  work: HTMLCanvasElement,
  bounds: RawCellBounds,
  refHeight: number
): ProcessedSprite | null {
  const cropW = bounds.maxX - bounds.minX + 1;
  const cropH = bounds.maxY - bounds.minY + 1;
  const aspect = cropW / cropH;
  const relHeight = refHeight > 0 ? cropH / refHeight : 1;

  const bakedH = 210;
  const bakedW = Math.max(1, Math.round(bakedH * aspect));

  const normal = document.createElement('canvas');
  normal.width = bakedW;
  normal.height = bakedH;
  const nCtx = normal.getContext('2d');
  if (!nCtx) return null;
  nCtx.imageSmoothingEnabled = true;
  nCtx.imageSmoothingQuality = 'high';
  nCtx.drawImage(
    work,
    bounds.minX,
    bounds.minY,
    cropW,
    cropH,
    0,
    0,
    bakedW,
    bakedH
  );

  const flash = document.createElement('canvas');
  flash.width = bakedW;
  flash.height = bakedH;
  const fCtx = flash.getContext('2d');
  if (!fCtx) return null;
  fCtx.drawImage(normal, 0, 0);
  fCtx.globalCompositeOperation = 'source-in';
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 0, bakedW, bakedH);

  return {
    normal,
    flash,
    aspect,
    relHeight,
    headShiftNorm: bounds.headShiftNorm,
  };
}

function findSeamSplits(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  count: number,
  horizontal: boolean
): number[] {
  const span = horizontal ? width : height;
  const cross = horizontal ? height : width;
  const splits: number[] = [0];

  for (let i = 1; i < count; i++) {
    const target = (span * i) / count;
    const minIdx = Math.max(1, Math.floor(target - span * 0.08));
    const maxIdx = Math.min(span - 1, Math.ceil(target + span * 0.08));
    let bestIdx = Math.round(target);
    let minOpaque = Infinity;

    for (let idx = minIdx; idx <= maxIdx; idx++) {
      let opaque = 0;
      if (horizontal) {
        for (let y = 0; y < cross; y++) {
          if (data[(y * width + idx) * 4 + 3] > 14) opaque++;
        }
      } else {
        const rowOffset = idx * width * 4;
        for (let x = 0; x < cross; x++) {
          if (data[rowOffset + x * 4 + 3] > 14) opaque++;
        }
      }
      if (
        opaque < minOpaque ||
        (opaque === minOpaque && Math.abs(idx - target) < Math.abs(bestIdx - target))
      ) {
        minOpaque = opaque;
        bestIdx = idx;
      }
    }
    splits.push(bestIdx);
  }

  splits.push(span);
  return splits;
}

function sliceSheetGrid(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  insetPx = 0,
  preserveWarmLime = false
): Array<ProcessedSprite | null> | null {
  const keyed = chromaKeyImage(img, preserveWarmLime);
  if (!keyed) return null;

  const { canvas, data, width, height } = keyed;
  const xSplits = findSeamSplits(data, width, height, cols, true);
  const ySplits = findSeamSplits(data, width, height, rows, false);

  const cellBounds: Array<RawCellBounds | null> = [];
  const heights: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.min(xSplits[c + 1] - 1, xSplits[c] + (c > 0 ? insetPx : 0));
      const x1 = Math.max(x0 + 1, xSplits[c + 1] - (c < cols - 1 ? insetPx : 0));
      const y0 = Math.min(ySplits[r + 1] - 1, ySplits[r] + (r > 0 ? insetPx : 0));
      const y1 = Math.max(y0 + 1, ySplits[r + 1] - (r < rows - 1 ? insetPx : 0));
      const b = measureSubRect(data, width, x0, y0, x1, y1);
      cellBounds.push(b);
      if (b) heights.push(b.maxY - b.minY + 1);
    }
  }

  if (heights.length === 0) return null;
  const sorted = [...heights].sort((a, b) => a - b);
  const medianH = sorted[Math.floor(sorted.length / 2)];

  return cellBounds.map((b) => (b ? bakeBounds(canvas, b, medianH) : null));
}

function bakeTransparentSprite(
  img: HTMLImageElement,
  relScale = 1
): ProcessedSprite | null {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) return null;

  const work = document.createElement('canvas');
  work.width = srcW;
  work.height = srcH;
  const wCtx = work.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return null;
  wCtx.drawImage(img, 0, 0, srcW, srcH);

  const { data } = wCtx.getImageData(0, 0, srcW, srcH);
  const bounds = measureSubRect(data, srcW, 0, 0, srcW, srcH);
  if (!bounds) return null;

  const cropH = bounds.maxY - bounds.minY + 1;
  return bakeBounds(work, bounds, cropH / relScale);
}

function loadImage(url: string, onLoad: (img: HTMLImageElement) => void, onDone?: () => void) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    onLoad(img);
    onSpriteReadyCallback?.();
    onDone?.();
  };
  img.onerror = () => {
    onDone?.();
  };
  img.src = url;
}

function rebuildSteelshotBank() {
  const bank = heroBanks.steelshot;
  const pos = steelshotRaw.positions;
  const extra = steelshotRaw.extra;
  const atk = steelshotRaw.attack;
  const fb = steelshotRaw.walkFb8f;
  const sideV2 = steelshotRaw.walkSideV2;
  const diagV2 = steelshotRaw.walkDiagV2;

  if (pos) {
    bank.idleFront = pos[0] ?? undefined;
    bank.idleBack = pos[1] ?? undefined;
    bank.idleSide = pos[2] ?? undefined;
    bank.idleDiag = pos[3] ?? undefined;
    bank.idleGuard = pos[3] ?? pos[0] ?? undefined;
  }

  if (extra) {
    bank.idleBackDiag = extra[0] ?? undefined;
    bank.aimUp = extra[2] ?? undefined;
    bank.actionStance = extra[3] ?? undefined;
  }

  if (atk) {
    bank.attackSide = atk[0] ?? undefined;
    bank.attackDiag = atk[1] ?? undefined;
    bank.attackFront = atk[2] ?? undefined;
    bank.attackBackDiag = atk[3] ?? undefined;
    bank.attackWindup = extra?.[3] ?? atk[0] ?? undefined;
  }

  if (sideV2) {
    bank.walkSide8 = sideV2.filter((f): f is ProcessedSprite => Boolean(f));
  }
  if (diagV2) {
    bank.walkDiag8 = diagV2.filter((f): f is ProcessedSprite => Boolean(f));
  }
  if (fb) {
    bank.walkFront = [fb[1], fb[2], fb[3], fb[2], fb[1], fb[0]].filter(
      (f): f is ProcessedSprite => Boolean(f)
    );
    bank.walkBack = [fb[5], fb[7], fb[6], fb[4], fb[5], fb[7], fb[6], fb[4]].filter(
      (f): f is ProcessedSprite => Boolean(f)
    );
  }

  const bd: ProcessedSprite[] = [];
  if (extra?.[0]) bd.push(extra[0]);
  if (fb?.[5]) bd.push(fb[5]);
  if (fb?.[6]) bd.push(fb[6]);
  bank.walkBackDiag = bd;
}

function ensureSteelshotLoaded() {
  if (steelshotRaw.positions || spriteLoading.steelshot) return;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;

  spriteLoading.steelshot = true;
  let remaining = 6;
  const finishOne = () => {
    remaining -= 1;
    if (remaining <= 0) spriteLoading.steelshot = false;
  };

  loadImage(
    spriteSteelshotPosesUrl,
    (img) => {
      steelshotRaw.positions = sliceSheetGrid(img, 2, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
  loadImage(
    spriteSteelshotExtraUrl,
    (img) => {
      steelshotRaw.extra = sliceSheetGrid(img, 2, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
  loadImage(
    spriteSteelshotAttackUrl,
    (img) => {
      steelshotRaw.attack = sliceSheetGrid(img, 2, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
  loadImage(
    spriteSteelshotWalkSideV2Url,
    (img) => {
      steelshotRaw.walkSideV2 = sliceSheetGrid(img, 4, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
  loadImage(
    spriteSteelshotWalkDiagV2Url,
    (img) => {
      steelshotRaw.walkDiagV2 = sliceSheetGrid(img, 4, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
  loadImage(
    spriteSteelshotWalkFb8fUrl,
    (img) => {
      steelshotRaw.walkFb8f = sliceSheetGrid(img, 4, 2) ?? undefined;
      rebuildSteelshotBank();
    },
    finishOne
  );
}

interface SheetSuiteUrls {
  poses: string;
  attack: string;
  walkSide: string;
  walkDiag: string;
  walkFb: string;
  mapPoses: (quads: Array<ProcessedSprite | null>, bank: HeroSpriteBank) => void;
  mapAttack: (quads: Array<ProcessedSprite | null>, bank: HeroSpriteBank) => void;
  mapWalkDiag?: (frames: Array<ProcessedSprite | null>) => ProcessedSprite[];
  mapWalkFb?: (frames: Array<ProcessedSprite | null>, bank: HeroSpriteBank) => void;
}

type SuiteHeroId = Exclude<HeroId, 'steelshot' | 'velvet' | 'meiro' | NewHeroId>;

const SUITE_CONFIG: Record<SuiteHeroId, SheetSuiteUrls> = {
  eldragon: {
    poses: spriteEldragPosesUrl,
    attack: spriteEldragAttackUrl,
    walkSide: spriteEldragWalkSideUrl,
    walkDiag: spriteEldragWalkDiagUrl,
    walkFb: spriteEldragWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.attackAltSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
      b.idleSide = q[0] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackSide = q[0] ?? undefined;
      b.attackDiag = q[1] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
  },
  kong: {
    poses: spriteKongPosesUrl,
    attack: spriteKongAttackUrl,
    walkSide: spriteKongWalkSideUrl,
    walkDiag: spriteKongWalkDiagUrl,
    walkFb: spriteKongWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.idleSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackWindup = q[0] ?? undefined;
      b.attackSide = q[1] ?? undefined;
      b.attackDiag = q[2] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
    mapWalkDiag: (f) =>
      [f[0], f[1], f[2], f[3], f[4], f[5], f[7]].filter(
        (x): x is ProcessedSprite => Boolean(x)
      ),
    mapWalkFb: (f, b) => {
      b.walkFront = [f[0], f[1], f[2], f[3], f[2], f[1]].filter(
        (x): x is ProcessedSprite => Boolean(x)
      );
      b.walkBack = [f[5], f[6], f[7], f[6]].filter(
        (x): x is ProcessedSprite => Boolean(x)
      );
    },
  },
  raidon: {
    poses: spriteRaidonPosesUrl,
    attack: spriteRaidonAttackUrl,
    walkSide: spriteRaidonWalkSideUrl,
    walkDiag: spriteRaidonWalkDiagUrl,
    walkFb: spriteRaidonWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.idleSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackSide = q[0] ?? undefined;
      b.attackDiag = q[1] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
  },
  veinka: {
    poses: spriteVeinkaPosesUrl,
    attack: spriteVeinkaAttackUrl,
    walkSide: spriteVeinkaWalkSideUrl,
    walkDiag: spriteVeinkaWalkDiagUrl,
    walkFb: spriteVeinkaWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.idleSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackSide = q[0] ?? undefined;
      b.attackDiag = q[1] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
  },
  phoenix: {
    poses: spritePhoenixPosesUrl,
    attack: spritePhoenixAttackUrl,
    walkSide: spritePhoenixWalkSideUrl,
    walkDiag: spritePhoenixWalkDiagUrl,
    walkFb: spritePhoenixWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.idleSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackWindup = q[0] ?? undefined;
      b.attackSide = q[1] ?? undefined;
      b.attackDiag = q[2] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
  },
  cluster: {
    poses: spriteClusterPosesUrl,
    attack: spriteClusterAttackUrl,
    walkSide: spriteClusterWalkSideUrl,
    walkDiag: spriteClusterWalkDiagUrl,
    walkFb: spriteClusterWalkFbUrl,
    mapPoses: (q, b) => {
      b.idleGuard = q[0] ?? undefined;
      b.idleSide = q[1] ?? undefined;
      b.idleFront = q[2] ?? undefined;
      b.idleBack = q[3] ?? undefined;
    },
    mapAttack: (q, b) => {
      b.attackWindup = q[0] ?? undefined;
      b.attackSide = q[1] ?? undefined;
      b.attackDiag = q[2] ?? undefined;
      b.attackFront = q[2] ?? undefined;
      b.attackSpecial = q[3] ?? undefined;
    },
  },
};

function ensureSuiteLoaded(heroId: SuiteHeroId) {
  const bank = heroBanks[heroId];
  if (bank.idleGuard || spriteLoading[heroId]) return;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;

  const cfg = SUITE_CONFIG[heroId];
  spriteLoading[heroId] = true;
  let remaining = 5;
  const finishOne = () => {
    remaining -= 1;
    if (remaining <= 0) spriteLoading[heroId] = false;
  };

  loadImage(
    cfg.poses,
    (img) => {
      const quads = sliceSheetGrid(img, 2, 2);
      if (quads) cfg.mapPoses(quads, bank);
    },
    finishOne
  );
  loadImage(
    cfg.attack,
    (img) => {
      const quads = sliceSheetGrid(img, 2, 2);
      if (quads) cfg.mapAttack(quads, bank);
    },
    finishOne
  );
  loadImage(
    cfg.walkSide,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (frames) {
        bank.walkSide8 = frames.filter((f): f is ProcessedSprite => Boolean(f));
      }
    },
    finishOne
  );
  loadImage(
    cfg.walkDiag,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (frames) {
        bank.walkDiag8 = cfg.mapWalkDiag
          ? cfg.mapWalkDiag(frames)
          : frames.filter((f): f is ProcessedSprite => Boolean(f));
      }
    },
    finishOne
  );
  loadImage(
    cfg.walkFb,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (frames) {
        if (cfg.mapWalkFb) {
          cfg.mapWalkFb(frames, bank);
        } else {
          bank.walkFront = [frames[0], frames[1], frames[2], frames[3], frames[2], frames[1]].filter(
            (f): f is ProcessedSprite => Boolean(f)
          );
          bank.walkBack = [frames[4], frames[5], frames[6], frames[7], frames[6], frames[5]].filter(
            (f): f is ProcessedSprite => Boolean(f)
          );
        }
      }
    },
    finishOne
  );
}

function ensureVelvetLoaded() {
  const bank = heroBanks.velvet;
  if (bank.idleGuard || spriteLoading.velvet) return;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;

  spriteLoading.velvet = true;
  const backSprites = createVelvetBackSprites();
  bank.idleBack = backSprites.idleBack;
  bank.walkBack = backSprites.walkBack;
  bank.walkBackDiag = backSprites.walkBack.slice(0, 4);

  let remaining = 3;
  const finishOne = () => {
    remaining -= 1;
    if (remaining <= 0) spriteLoading.velvet = false;
  };

  loadImage(
    spriteVelvetWalkSideUrl,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (frames) {
        bank.walkSide8 = frames.filter((f): f is ProcessedSprite => Boolean(f));
        bank.idleSide = bank.walkSide8[0] ?? bank.idleSide;
      }
    },
    finishOne
  );
  loadImage(
    spriteVelvetWalkDiagUrl,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (frames) {
        bank.walkDiag8 = frames.filter((f): f is ProcessedSprite => Boolean(f));
        bank.idleGuard = bank.walkDiag8[0] ?? bank.idleGuard;
        bank.idleFront = bank.walkDiag8[2] ?? bank.walkDiag8[0] ?? bank.idleFront;
        bank.walkFront = bank.walkDiag8.slice(0, 6);
      }
    },
    finishOne
  );
  loadImage(
    spriteVelvetAttackUrl,
    (img) => {
      // Inset 8px so thin quadrant divider cross-lines are excluded cleanly
      const quads = sliceSheetGrid(img, 2, 2, 8);
      if (quads) {
        bank.attackWindup = quads[0] ?? undefined;
        bank.attackSide = quads[1] ?? undefined;
        bank.attackDiag = quads[2] ?? undefined;
        bank.attackFront = quads[2] ?? undefined;
        bank.attackSpecial = quads[3] ?? undefined;
        if (!bank.idleGuard) bank.idleGuard = quads[0] ?? undefined;
      }
    },
    finishOne
  );
}

function ensureMeiroLoaded() {
  const bank = heroBanks.meiro;
  if (bank.idleGuard || spriteLoading.meiro) return;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;

  spriteLoading.meiro = true;
  let remaining = 2;
  const finishOne = () => {
    remaining -= 1;
    if (remaining <= 0) spriteLoading.meiro = false;
  };

  loadImage(
    spriteMeiroPosesUrl,
    (img) => {
      const quads = sliceSheetGrid(img, 2, 2);
      if (!quads) return;
      const guard = quads[0] ?? undefined;
      const side = quads[1] ?? undefined;
      const front = quads[2] ?? undefined;
      const back = quads[3] ?? undefined;

      bank.idleGuard = guard;
      bank.idleSide = side ?? guard;
      bank.idleFront = front ?? guard;
      bank.idleBack = back ?? guard;
      bank.idleBackDiag = back ?? guard;

      if (front) {
        bank.walkFront = createSteppingCycleFromPose(front, 6);
      }
      if (back) {
        bank.walkBack = createSteppingCycleFromPose(back, 6);
        bank.walkBackDiag = bank.walkBack.slice(0, 4);
        bank.attackBackDiag = createKatanaAttackPose(back, 'slash') ?? back;
      }

      if (guard) {
        bank.attackWindup = createKatanaAttackPose(guard, 'windup');
        bank.attackDiag = createKatanaAttackPose(guard, 'cleave');
        bank.attackSpecial = createKatanaAttackPose(guard, 'slam');
      }
      if (side && !bank.attackSide) {
        bank.attackSide = createKatanaAttackPose(side, 'slash');
      }
      if (front) {
        bank.attackFront = createKatanaAttackPose(front, 'cleave');
      }
    },
    finishOne
  );

  loadImage(
    spriteMeiroWalkSideUrl,
    (img) => {
      const frames = sliceSheetGrid(img, 4, 2);
      if (!frames) return;
      const valid = frames.filter((f): f is ProcessedSprite => Boolean(f));
      bank.walkSide8 = valid;
      bank.walkDiag8 = valid;
      if (!bank.idleSide && valid[0]) bank.idleSide = valid[0];
      if (!bank.idleGuard && valid[0]) bank.idleGuard = valid[0];
      if (valid[1]) {
        bank.attackSide = createKatanaAttackPose(valid[1], 'slash') ?? valid[1];
      }
    },
    finishOne
  );
}

type CutoutHeroId =
  | 'drake'
  | 'ryder'
  | 'solara'
  | 'frost'
  | 'valkyria'
  | 'kronos'
  | 'titanx';

const CUTOUT_HERO_CFG: Record<
  CutoutHeroId,
  { url: string; relScale: number; style: HeroActionEffectStyle }
> = {
  drake: { url: cutoutDrakeUrl, relScale: 1.0, style: 'sniper_green' },
  ryder: { url: cutoutRyderUrl, relScale: 1.06, style: 'void_magenta' },
  solara: { url: cutoutSolaraUrl, relScale: 1.04, style: 'solar_gold' },
  frost: { url: cutoutFrostUrl, relScale: 1.02, style: 'cryo_cyan' },
  valkyria: { url: cutoutValkyriaUrl, relScale: 1.08, style: 'valkyrie_cyan' },
  kronos: { url: cutoutKronosUrl, relScale: 1.0, style: 'chrono_violet' },
  titanx: { url: cutoutTitanxUrl, relScale: 1.04, style: 'gatling_fire' },
};

function ensureNewHeroArtLoaded(heroId: NewHeroId) {
  if (aiNewHeroLoaded[heroId] || spriteLoading[heroId]) return;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;

  const bank = heroBanks[heroId];
  spriteLoading[heroId] = true;
  const finish = () => {
    aiNewHeroLoaded[heroId] = true;
    spriteLoading[heroId] = false;
  };

  if (heroId === 'baston' || heroId === 'kairo') {
    const isBaston = heroId === 'baston';
    const sheetUrl = isBaston ? spriteBastonWalkSideUrl : spriteKairoWalkSideUrl;
    const cutoutUrl = isBaston ? cutoutBastonUrl : cutoutKairoUrl;
    const relScale = isBaston ? 1.0 : 0.96;
    const actionStyle: HeroActionEffectStyle = isBaston ? 'melee_cyan' : 'lightning_cyan';
    let remaining = 2;
    const finishOne = () => {
      remaining -= 1;
      if (remaining <= 0) finish();
    };

    loadImage(
      sheetUrl,
      (img) => {
        const frames = sliceSheetGrid(img, 4, 2, 4);
        if (!frames) return;
        const valid = frames.filter((f): f is ProcessedSprite => Boolean(f));
        if (valid.length === 0) return;
        bank.walkSide8 = valid;
        bank.walkDiag8 = valid;
        bank.idleSide = valid[0];
        bank.idleGuard = valid[isBaston ? 2 : 1] ?? valid[0];
        bank.idleDiag = valid[isBaston ? 2 : 1] ?? valid[0];
        bank.idleBack = valid[0];
        bank.idleBackDiag = valid[0];
        const backCycle = createSteppingCycleFromPose(valid[0], 6);
        if (backCycle.length > 0) {
          bank.walkBack = backCycle;
          bank.walkBackDiag = backCycle.slice(0, 4);
        }
        bank.attackWindup =
          createHeroActionPose(valid[0], 'windup', actionStyle) ?? valid[0];
        bank.attackSide =
          createHeroActionPose(
            valid[isBaston ? 2 : 3] ?? valid[1] ?? valid[0],
            'slash',
            actionStyle
          ) ?? valid[0];
        bank.attackDiag =
          createHeroActionPose(valid[isBaston ? 1 : 2] ?? valid[0], 'cleave', actionStyle) ??
          valid[0];
        bank.attackBackDiag = bank.attackSide;
        bank.attackSpecial =
          createHeroActionPose(valid[isBaston ? 3 : 4] ?? valid[0], 'slam', actionStyle) ??
          valid[0];
      },
      finishOne
    );

    loadImage(
      cutoutUrl,
      (img) => {
        const front = bakeTransparentSprite(img, relScale);
        if (!front) return;
        bank.idleFront = front;
        const frontCycle = createSteppingCycleFromPose(front, 6);
        if (frontCycle.length > 0) bank.walkFront = frontCycle;
        bank.attackFront =
          createHeroActionPose(front, 'cleave', actionStyle) ?? front;
      },
      finishOne
    );
    return;
  }

  if (heroId === 'nina') {
    loadImage(
      spriteNinaPosesUrl,
      (img) => {
        const quads = sliceSheetGrid(img, 2, 2, 4, true);
        if (!quads) return;
        const guard = quads[0] ?? undefined;
        const sideFiring = quads[1] ?? undefined;
        const front = quads[2] ?? undefined;
        const back = quads[3] ?? undefined;

        if (guard) {
          bank.idleGuard = guard;
          bank.idleDiag = guard;
          bank.idleSide = guard;
          bank.attackWindup =
            createHeroActionPose(guard, 'windup', 'flame_orange') ?? guard;
          const sideCycle = createSteppingCycleFromPose(guard, 8);
          if (sideCycle.length > 0) {
            bank.walkSide8 = sideCycle;
            bank.walkDiag8 = sideCycle;
          }
        }
        if (sideFiring) {
          bank.attackSide = sideFiring;
          bank.attackDiag = sideFiring;
          bank.attackSpecial =
            createHeroActionPose(sideFiring, 'slam', 'flame_orange') ?? sideFiring;
        }
        if (front) {
          bank.idleFront = front;
          const frontCycle = createSteppingCycleFromPose(front, 6);
          if (frontCycle.length > 0) bank.walkFront = frontCycle;
          bank.attackFront =
            createHeroActionPose(front, 'cleave', 'flame_orange') ?? front;
        }
        if (back) {
          bank.idleBack = back;
          bank.idleBackDiag = back;
          const backCycle = createSteppingCycleFromPose(back, 6);
          if (backCycle.length > 0) {
            bank.walkBack = backCycle;
            bank.walkBackDiag = backCycle.slice(0, 4);
          }
          bank.attackBackDiag = back;
        }
      },
      finish
    );
    return;
  }

  if (heroId === 'knox' || heroId === 'boulder') {
    const sheetUrl = heroId === 'knox' ? spriteKnoxAttackUrl : spriteBoulderAttackUrl;
    const actionStyle: HeroActionEffectStyle =
      heroId === 'knox' ? 'flame_orange' : 'magma_amber';

    loadImage(
      sheetUrl,
      (img) => {
        const quads = sliceSheetGrid(img, 2, 2, 4);
        if (!quads) return;
        const guard = quads[0] ?? undefined;
        const strike = quads[1] ?? undefined;
        const front = quads[2] ?? undefined;
        const back = quads[3] ?? undefined;

        if (guard) {
          bank.idleGuard = guard;
          bank.idleDiag = guard;
          bank.idleSide = guard;
          bank.attackWindup =
            createHeroActionPose(guard, 'windup', actionStyle) ?? guard;
          const sideCycle = createSteppingCycleFromPose(guard, 8);
          if (sideCycle.length > 0) {
            bank.walkSide8 = sideCycle;
            bank.walkDiag8 = sideCycle;
          }
        }
        if (strike) {
          bank.attackSide = strike;
          bank.attackDiag = strike;
          bank.attackSpecial =
            createHeroActionPose(strike, 'slam', actionStyle) ?? strike;
        }
        if (front) {
          bank.idleFront = front;
          const frontCycle = createSteppingCycleFromPose(front, 6);
          if (frontCycle.length > 0) bank.walkFront = frontCycle;
          bank.attackFront =
            createHeroActionPose(front, 'cleave', actionStyle) ?? front;
        }
        if (back) {
          bank.idleBack = back;
          bank.idleBackDiag = back;
          const backCycle = createSteppingCycleFromPose(back, 6);
          if (backCycle.length > 0) {
            bank.walkBack = backCycle;
            bank.walkBackDiag = backCycle.slice(0, 4);
          }
          bank.attackBackDiag = back;
        }
      },
      finish
    );
    return;
  }

  const cutoutCfg = CUTOUT_HERO_CFG[heroId as CutoutHeroId];
  loadImage(
    cutoutCfg.url,
    (img) => {
      const pose = bakeTransparentSprite(img, cutoutCfg.relScale);
      if (!pose) return;
      bank.idleGuard = pose;
      bank.idleDiag = pose;
      bank.idleSide = pose;
      bank.idleFront = pose;
      bank.idleBack = pose;
      bank.idleBackDiag = pose;

      const walk8 = createSteppingCycleFromPose(pose, 8);
      if (walk8.length > 0) {
        bank.walkSide8 = walk8;
        bank.walkDiag8 = walk8;
      }
      const walk6 = createSteppingCycleFromPose(pose, 6);
      if (walk6.length > 0) {
        bank.walkFront = walk6;
        bank.walkBack = walk6;
        bank.walkBackDiag = walk6.slice(0, 4);
      }

      bank.attackWindup =
        createHeroActionPose(pose, 'windup', cutoutCfg.style) ?? pose;
      bank.attackSide =
        createHeroActionPose(pose, 'slash', cutoutCfg.style) ?? pose;
      bank.attackDiag =
        createHeroActionPose(pose, 'cleave', cutoutCfg.style) ?? pose;
      bank.attackFront =
        createHeroActionPose(pose, 'cleave', cutoutCfg.style) ?? pose;
      bank.attackBackDiag = bank.attackSide;
      bank.attackSpecial =
        createHeroActionPose(pose, 'slam', cutoutCfg.style) ?? pose;
    },
    finish
  );
}

function ensureHeroArtById(heroId: HeroId) {
  if (heroId === 'steelshot') ensureSteelshotLoaded();
  else if (heroId === 'velvet') ensureVelvetLoaded();
  else if (heroId === 'meiro') ensureMeiroLoaded();
  else if (isNewProceduralHero(heroId)) ensureNewHeroLoaded(heroId);
  else ensureSuiteLoaded(heroId);
}

function ensureNewHeroLoaded(heroId: NewHeroId) {
  const bank = heroBanks[heroId];
  if (!bank.idleGuard && typeof document !== 'undefined') {
    const set = buildNewHeroSprites(heroId);
    bank.idleGuard = set.idleGuard;
    bank.idleSide = set.idleSide;
    bank.idleDiag = set.idleDiag;
    bank.idleFront = set.idleFront;
    bank.idleBack = set.idleBack;
    bank.idleBackDiag = set.idleBackDiag;
    bank.attackWindup = set.attackWindup;
    bank.attackSide = set.attackSide;
    bank.attackDiag = set.attackDiag;
    bank.attackFront = set.attackFront;
    bank.attackBackDiag = set.attackBackDiag;
    bank.attackSpecial = set.attackSpecial;
    bank.walkSide8 = set.walkSide8;
    bank.walkDiag8 = set.walkDiag8;
    bank.walkFront = set.walkFront;
    bank.walkBack = set.walkBack;
    bank.walkBackDiag = set.walkBackDiag;
  }
  ensureNewHeroArtLoaded(heroId);
}

export function prioritizeHeroSprites(heroIds: HeroId[]) {
  for (const id of heroIds) {
    ensureHeroArtById(id);
  }
}

let bgPreloadScheduled = false;

export function preloadHeroSprites(onReady?: () => void) {
  if (onReady) {
    onSpriteReadyCallback = onReady;
  }
  if (bgPreloadScheduled || typeof window === 'undefined') return;
  bgPreloadScheduled = true;

  // Defer full 21-hero background preload slightly so active match/selected heroes
  // claim browser HTTP connections first and finish in <100ms.
  window.setTimeout(() => {
    for (const id of NEW_HERO_IDS) {
      ensureNewHeroLoaded(id);
    }
    ensureSteelshotLoaded();
    ensureVelvetLoaded();
    ensureMeiroLoaded();
    const suiteIds: SuiteHeroId[] = [
      'eldragon',
      'kong',
      'raidon',
      'veinka',
      'phoenix',
      'cluster',
    ];
    for (const id of suiteIds) {
      ensureSuiteLoaded(id);
    }
  }, 350);
}

function drawFallbackSilhouette(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  flash: boolean,
  facing: number,
  skinId?: HeroSkinId
) {
  const cfg = HEROES[heroId];
  const skin = getHeroSkinSpec(heroId, skinId);
  ctx.save();
  ctx.scale(facing, 1);
  ctx.fillStyle = flash
    ? '#ffffff'
    : skin.id === 'classic'
    ? cfg.armorColor
    : skin.secondaryColor;
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-14, -28, 28, 38, 10);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(4, -14, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function pickCycleFrame(
  list: ProcessedSprite[],
  fallback: ProcessedSprite | undefined,
  phase: number
): ProcessedSprite | undefined {
  if (list.length === 0) return fallback;
  const idx = Math.floor((phase / (Math.PI * 2)) * list.length) % list.length;
  return list[(idx + list.length) % list.length] ?? fallback;
}

function drawAttackEffectOverlay(
  ctx: CanvasRenderingContext2D,
  heroId: HeroId,
  rawAimAngle: number,
  swingProg: number,
  comboStep: number,
  skinId?: HeroSkinId
) {
  if (swingProg < 0.16 || swingProg > 0.88) return;
  const intensity = Math.sin(((swingProg - 0.16) / 0.72) * Math.PI);
  const skin = getHeroSkinSpec(heroId, skinId);
  const effectAccent = skin.accentColor;
  const comboBoost = comboStep >= 3 ? 1.58 : comboStep === 2 ? 1.26 : 1;

  if (
    heroId === 'steelshot' ||
    heroId === 'raidon' ||
    heroId === 'veinka' ||
    heroId === 'cluster' ||
    heroId === 'velvet' ||
    heroId === 'nina' ||
    heroId === 'drake' ||
    heroId === 'knox' ||
    heroId === 'frost' ||
    heroId === 'kronos' ||
    heroId === 'titanx' ||
    heroId === 'solara'
  ) {
    const reach =
      (heroId === 'veinka' || heroId === 'velvet' || heroId === 'drake'
        ? 36
        : heroId === 'steelshot' || heroId === 'cluster' || heroId === 'knox' || heroId === 'titanx'
        ? 34
        : 30) * (comboStep >= 3 ? 1.12 : 1);
    const mx = Math.cos(rawAimAngle) * reach;
    const my = -10 + Math.sin(rawAimAngle) * (reach * 0.72);
    const flareR =
      (heroId === 'steelshot' || heroId === 'cluster' ? 11 : 9) * intensity * comboBoost;

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(rawAimAngle);
    ctx.globalAlpha = Math.min(1, intensity * 1.15);
    if (comboStep >= 2) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(flareR * 0.4, 0, flareR * 1.85, flareR * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = effectAccent;
    ctx.beginPath();
    ctx.ellipse(flareR * 0.35, 0, flareR * 1.5, flareR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(0, 0, flareR * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Punch / Hammer / Katana / Fireball burst flash
    const reach = (heroId === 'kong' || heroId === 'meiro' ? 34 : 28) * (comboStep >= 3 ? 1.14 : 1);
    const mx = Math.cos(rawAimAngle) * reach;
    const my = -8 + Math.sin(rawAimAngle) * (reach * 0.68);
    ctx.save();
    ctx.translate(mx, my);
    ctx.globalAlpha = Math.min(0.95, intensity);
    if (comboStep >= 2) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = comboStep >= 3 ? 5.5 : 4;
      ctx.beginPath();
      ctx.arc(0, 0, (13 + 15 * swingProg) * comboBoost * 0.85, rawAimAngle - 1.05, rawAimAngle + 1.05);
      ctx.stroke();
    }
    ctx.strokeStyle = effectAccent;
    ctx.lineWidth = 3 * comboBoost;
    ctx.beginPath();
    ctx.arc(0, 0, (10 + 12 * swingProg) * (comboStep >= 3 ? 1.2 : 1), rawAimAngle - 0.85, rawAimAngle + 0.85);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawHeroCharacter(
  ctx: CanvasRenderingContext2D,
  actor: ActorState,
  nowMs: number,
  rawAimAngle: number
) {
  const bank = heroBanks[actor.heroId];
  if (!bank.idleGuard && !bank.idleFront) {
    if (actor.heroId === 'steelshot') ensureSteelshotLoaded();
    else if (actor.heroId === 'velvet') ensureVelvetLoaded();
    else if (actor.heroId === 'meiro') ensureMeiroLoaded();
    else if (isNewProceduralHero(actor.heroId)) ensureNewHeroLoaded(actor.heroId);
    else ensureSuiteLoaded(actor.heroId);
    if (!bank.idleGuard && !bank.idleFront) {
      const facing = Math.cos(rawAimAngle) >= 0 ? 1 : -1;
      drawFallbackSilhouette(ctx, actor.heroId, actor.hitFlash > 0, facing, actor.skinId);
      return;
    }
  }

  const isKong = actor.heroId === 'kong' || actor.heroId === 'boulder' || actor.heroId === 'titanx';
  const isMeiro = actor.heroId === 'meiro' || actor.heroId === 'baston';
  const swingDuration = isKong ? 0.32 : 0.28;
  const speed = Math.hypot(actor.vx, actor.vy);
  const isMoving = speed > 14;
  const isAttacking = actor.attackSwingTimer > 0 || actor.dashTimer > 0;

  // Walk naturally in movement direction unless firing/attacking!
  const desiredFacingAngle =
    isMoving && !isAttacking ? Math.atan2(actor.vy, actor.vx) : rawAimAngle;
  const prevAim = smoothAimMap.get(actor) ?? desiredFacingAngle;
  const angleDiff = Math.atan2(
    Math.sin(desiredFacingAngle - prevAim),
    Math.cos(desiredFacingAngle - prevAim)
  );
  const smoothFacing = prevAim + angleDiff * (isAttacking ? 0.72 : 0.26);
  smoothAimMap.set(actor, smoothFacing);

  const phase = actor.walkPhase;
  const deg =
    (Math.atan2(Math.sin(smoothFacing), Math.cos(smoothFacing)) * 180) / Math.PI;
  const absDeg = Math.abs(deg);

  const swingProg =
    actor.attackSwingTimer > 0
      ? 1 - Math.max(0, Math.min(1, actor.attackSwingTimer / swingDuration))
      : 0.5;

  let chosen: ProcessedSprite | undefined;
  let flipX = 1;
  let pitchTilt = 0;

  if (isAttacking) {
    const aimRight = Math.cos(rawAimAngle) >= 0;
    const aimDeg = (Math.atan2(Math.sin(rawAimAngle), Math.cos(rawAimAngle)) * 180) / Math.PI;
    const aimAbsDeg = Math.abs(aimDeg);
    flipX = aimRight ? 1 : -1;

    if (actor.dashTimer > 0 && bank.attackSpecial) {
      chosen = bank.attackSpecial;
    } else if (swingProg < 0.26 && bank.attackWindup) {
      chosen = bank.attackWindup;
    } else if (actor.heroId === 'eldragon') {
      if (aimDeg >= 64 && aimDeg <= 116 && bank.attackFront) {
        chosen = bank.attackFront;
        flipX = 1;
      } else if (actor.ammo % 2 === 1 && bank.attackDiag) {
        chosen = bank.attackDiag;
      } else if (swingProg < 0.48 && bank.attackSide) {
        chosen = bank.attackSide;
      } else {
        chosen = bank.attackAltSide ?? bank.attackSide;
      }
    } else if (aimDeg >= 66 && aimDeg <= 114 && bank.attackFront) {
      chosen = bank.attackFront;
      flipX = 1;
    } else if (aimDeg <= -24 && aimDeg >= -156 && (bank.attackBackDiag || bank.aimUp)) {
      chosen = bank.attackBackDiag ?? bank.aimUp;
    } else if (aimAbsDeg <= 24 || aimAbsDeg >= 156) {
      chosen = bank.attackSide ?? bank.actionStance ?? bank.idleSide;
      pitchTilt = Math.sin(rawAimAngle) * 0.1;
    } else {
      chosen = bank.attackDiag ?? bank.attackSide ?? bank.idleGuard;
      pitchTilt = Math.sin(rawAimAngle) * 0.06 * flipX;
    }
  } else if (isMoving) {
    if (deg >= 66 && deg <= 114) {
      chosen = pickCycleFrame(bank.walkFront, bank.idleFront, phase);
      flipX = 1;
    } else if (deg <= -66 && deg >= -114) {
      chosen = pickCycleFrame(bank.walkBack, bank.idleBack, phase);
      flipX = 1;
    } else if (absDeg <= 24 || absDeg >= 156) {
      const rightSide = absDeg <= 24;
      flipX = rightSide ? 1 : -1;
      chosen = pickCycleFrame(bank.walkSide8, bank.idleSide ?? bank.idleGuard, phase);
      pitchTilt = Math.sin(smoothFacing) * 0.1;
    } else if (deg < -24 && deg > -156 && bank.walkBackDiag.length > 0) {
      const rightSide = deg > -90;
      flipX = rightSide ? 1 : -1;
      chosen = pickCycleFrame(bank.walkBackDiag, bank.idleBackDiag ?? bank.idleBack, phase);
    } else {
      const rightSide = Math.cos(smoothFacing) >= 0;
      flipX = rightSide ? 1 : -1;
      chosen = pickCycleFrame(bank.walkDiag8, bank.idleGuard ?? bank.idleFront, phase);
      pitchTilt = Math.sin(smoothFacing) * 0.06 * flipX;
    }
  } else {
    if (deg >= 68 && deg <= 112 && bank.idleFront) {
      chosen = bank.idleFront;
      flipX = 1;
    } else if (deg <= -68 && deg >= -112 && bank.idleBack) {
      chosen = bank.idleBack;
      flipX = 1;
    } else if ((absDeg <= 24 || absDeg >= 156) && bank.idleSide) {
      flipX = absDeg <= 24 ? 1 : -1;
      chosen = bank.idleSide;
    } else if (deg <= -24 && deg >= -156 && (bank.idleBackDiag || bank.aimUp)) {
      flipX = Math.cos(smoothFacing) >= 0 ? 1 : -1;
      chosen = bank.idleBackDiag ?? bank.idleBack ?? bank.idleGuard;
    } else {
      flipX = Math.cos(smoothFacing) >= 0 ? 1 : -1;
      chosen = bank.idleGuard ?? bank.idleSide ?? bank.idleFront;
    }
  }

  const sprite = chosen ?? bank.idleFront ?? bank.idleGuard!;
  const baseH = isKong ? 94 : isMeiro ? 90 : 86;
  const drawH = baseH * sprite.relHeight;
  const drawW = drawH * sprite.aspect;
  const footY = isKong ? 20 : isMeiro ? 19 : 18;

  // Responsive stride cushion + forward run lean
  const walkBob = isMoving && !isAttacking ? -Math.abs(Math.sin(phase * 2)) * 2.4 : 0;
  const runLean = isMoving && !isAttacking ? Math.cos(smoothFacing) * 0.055 : 0;
  const idleBreathe = isMoving
    ? 1
    : 1 + Math.sin(nowMs * 0.0046 + actor.id.length * 1.6) * 0.018;

  // Punchy 3-stage attack animation transform (windup -> strike lunge -> recoil recovery)
  let atkScaleX = 1;
  let atkScaleY = 1;
  let atkOffsetX = 0;
  let atkOffsetY = 0;
  let atkTilt = 0;

  if (actor.attackSwingTimer > 0) {
    const isMelee =
      isKong ||
      isMeiro ||
      actor.heroId === 'eldragon' ||
      actor.heroId === 'kairo' ||
      actor.heroId === 'ryder' ||
      actor.heroId === 'valkyria';
    if (swingProg < 0.28) {
      const t = swingProg / 0.28;
      atkScaleX = 1 - 0.05 * t;
      atkScaleY = 1 + 0.05 * t;
      const pull = isMelee ? -4 * t : 0;
      atkOffsetX = Math.cos(rawAimAngle) * pull;
      atkOffsetY = Math.sin(rawAimAngle) * pull * 0.6;
      atkTilt = -0.08 * t * flipX;
    } else if (swingProg < 0.72) {
      const t = Math.sin(((swingProg - 0.28) / 0.44) * Math.PI);
      atkScaleX = 1 + 0.08 * t;
      atkScaleY = 1 - 0.06 * t;
      const push = isMelee ? 8 * t : -4 * t;
      atkOffsetX = Math.cos(rawAimAngle) * push;
      atkOffsetY = Math.sin(rawAimAngle) * push * 0.65;
      atkTilt = (isMelee ? 0.11 : -0.07) * t * flipX;
    } else {
      const t = 1 - (swingProg - 0.72) / 0.28;
      atkScaleX = 1 + 0.03 * t;
      atkScaleY = 1 - 0.02 * t;
      atkTilt = (isMelee ? 0.04 : -0.03) * t * flipX;
    }
  }

  const spriteImg = actor.hitFlash > 0 ? sprite.flash : sprite.normal;
  const skinSpec = getHeroSkinSpec(actor.heroId, actor.skinId);

  if (skinSpec.auraColor && actor.alive && actor.hitFlash <= 0) {
    const auraPulse = 0.22 + Math.sin(nowMs * 0.0055 + actor.id.length) * 0.08;
    ctx.save();
    ctx.globalAlpha = auraPulse;
    ctx.strokeStyle = skinSpec.auraColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, footY - 8, 22, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(atkOffsetX, footY + walkBob + atkOffsetY);
  ctx.rotate(pitchTilt + runLean + atkTilt);
  ctx.scale(flipX * atkScaleX, idleBreathe * atkScaleY);
  if (skinSpec.canvasFilter !== 'none' && actor.hitFlash <= 0) {
    ctx.filter = skinSpec.canvasFilter;
  }
  ctx.drawImage(
    spriteImg,
    -drawW * (0.5 + sprite.headShiftNorm),
    -drawH,
    drawW,
    drawH
  );
  ctx.restore();

  if (actor.attackSwingTimer > 0 && actor.hitFlash <= 0) {
    drawAttackEffectOverlay(
      ctx,
      actor.heroId,
      rawAimAngle,
      swingProg,
      actor.comboStep,
      actor.skinId
    );
  }
}
