import { ActorState, BushZone, DeathCamRelation, GameMode, KillStreakTier, Rect } from './types';

export const ARENA_SIZE = 2200;
export const ARENA_CENTER = ARENA_SIZE / 2;
export const MAX_STORM_RADIUS = 1320;
export const MIN_STORM_RADIUS = 220;

export function clampDt(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function computePowerMultiplier(powerCubes: number): number {
  const cubes = Math.max(0, powerCubes);
  return 1 + cubes * 0.1;
}

export function computeMaxHp(baseMaxHp: number, powerCubes: number): number {
  const cubes = Math.max(0, powerCubes);
  return Math.round(baseMaxHp * (1 + cubes * 0.12));
}

export function calculateDamage(
  baseDamage: number,
  attackerPowerCubes: number,
  critMultiplier = 1
): number {
  return Math.max(
    1,
    Math.round(baseDamage * computePowerMultiplier(attackerPowerCubes) * critMultiplier)
  );
}

export const COMBO_TAP_WINDOW_SEC = 0.95;

export interface ComboStepInput {
  ammo: number;
  maxAmmo: number;
  currentComboStep: number;
  comboWindowTimer: number;
  isDiscreteTap: boolean;
  allowHoldCombo?: boolean;
}

export interface ComboStepResult {
  nextComboStep: number;
  damageMultiplier: number;
  lockoutMultiplier: number;
  isComboAttack: boolean;
  isComboFinisher: boolean;
  nextComboWindowTimer: number;
}

export function canPassiveHoldFireBasic(input: {
  currentComboStep: number;
  comboWindowTimer: number;
  msSinceLastDiscreteTap: number;
  holdGraceMs?: number;
  virtualAimActive?: boolean;
}): boolean {
  const {
    msSinceLastDiscreteTap,
    holdGraceMs = 290,
    virtualAimActive = false,
  } = input;

  // Mobile twin-stick aim drag explicitly intends continuous aimed combo fire
  if (virtualAimActive) {
    return true;
  }

  // Prevent normal human click-release durations (<290ms) from firing an accidental 2nd shot
  if (msSinceLastDiscreteTap < holdGraceMs) {
    return false;
  }

  return true;
}

export function canQueueBasicComboTap(input: {
  ammo: number;
  maxAmmo: number;
  currentComboStep: number;
  comboTapQueue: number;
  pendingBufferedBasic: number;
}): boolean {
  const { ammo, maxAmmo, currentComboStep, comboTapQueue, pendingBufferedBasic } = input;
  if (ammo <= 0) return false;

  const canStartOrContinueCombo =
    (currentComboStep >= 1 && currentComboStep < 3) ||
    (ammo >= maxAmmo && maxAmmo >= 3);

  if (!canStartOrContinueCombo) return false;

  return comboTapQueue < Math.max(0, ammo - Math.max(0, pendingBufferedBasic));
}

export function resolveBasicAttackCombo(input: ComboStepInput): ComboStepResult {
  const {
    ammo,
    maxAmmo,
    currentComboStep,
    comboWindowTimer,
    isDiscreteTap,
    allowHoldCombo = false,
  } = input;

  const canCombo = isDiscreteTap || allowHoldCombo;
  if (!canCombo || ammo <= 0) {
    return {
      nextComboStep: 0,
      damageMultiplier: 1,
      lockoutMultiplier: 1,
      isComboAttack: false,
      isComboFinisher: false,
      nextComboWindowTimer: 0,
    };
  }

  // Continue an active combo started from full 3 bars
  if (comboWindowTimer > 0 && currentComboStep === 1) {
    return {
      nextComboStep: 2,
      damageMultiplier: 1.25,
      lockoutMultiplier: 0.62,
      isComboAttack: true,
      isComboFinisher: false,
      nextComboWindowTimer: COMBO_TAP_WINDOW_SEC,
    };
  }

  if (comboWindowTimer > 0 && currentComboStep === 2) {
    return {
      nextComboStep: 3,
      damageMultiplier: 1.65,
      lockoutMultiplier: 0.85,
      isComboAttack: true,
      isComboFinisher: true,
      nextComboWindowTimer: 0.55,
    };
  }

  // Start a new combo only when all 3 ammo bars are full
  if (ammo >= maxAmmo && maxAmmo >= 3) {
    return {
      nextComboStep: 1,
      damageMultiplier: 1,
      lockoutMultiplier: 0.65,
      isComboAttack: false,
      isComboFinisher: false,
      nextComboWindowTimer: COMBO_TAP_WINDOW_SEC,
    };
  }

  return {
    nextComboStep: 0,
    damageMultiplier: 1,
    lockoutMultiplier: 1,
    isComboAttack: false,
    isComboFinisher: false,
    nextComboWindowTimer: 0,
  };
}

export function applyDamageWithShield(
  hp: number,
  shield: number,
  incomingDamage: number
): { hp: number; shield: number; absorbed: number; hpDamage: number } {
  const dmg = Math.max(0, Math.round(incomingDamage));
  const absorbed = Math.min(shield, dmg);
  const remaining = dmg - absorbed;
  const nextShield = shield - absorbed;
  const nextHp = Math.max(0, hp - remaining);
  return {
    hp: nextHp,
    shield: nextShield,
    absorbed,
    hpDamage: hp - nextHp,
  };
}

export function resolveCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: Rect
): { x: number; y: number; collided: boolean } {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy, collided: false };
  }

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    return {
      x: cx + (dx / dist) * overlap,
      y: cy + (dy / dist) * overlap,
      collided: true,
    };
  }

  // Center is inside rect: push out along nearest edge
  const leftPen = cx - rect.x;
  const rightPen = rect.x + rect.w - cx;
  const topPen = cy - rect.y;
  const bottomPen = rect.y + rect.h - cy;
  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

  if (minPen === leftPen) return { x: rect.x - radius, y: cy, collided: true };
  if (minPen === rightPen) return { x: rect.x + rect.w + radius, y: cy, collided: true };
  if (minPen === topPen) return { x: cx, y: rect.y - radius, collided: true };
  return { x: cx, y: rect.y + rect.h + radius, collided: true };
}

export function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function isPointInAnyBush(x: number, y: number, bushes: BushZone[]): boolean {
  for (let i = 0; i < bushes.length; i++) {
    if (pointInRect(x, y, bushes[i])) return true;
  }
  return false;
}

export function circleIntersectsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function canObserverSeeTarget(
  observer: Pick<ActorState, 'id' | 'team' | 'x' | 'y'>,
  target: Pick<ActorState, 'id' | 'team' | 'x' | 'y' | 'alive' | 'stealthTimer' | 'inBush' | 'revealedTimer'>
): boolean {
  if (!target.alive) return false;
  if (observer.id === target.id || observer.team === target.team) return true;
  if (target.revealedTimer > 0) return true;
  if (target.stealthTimer > 0) {
    return distanceSq(observer.x, observer.y, target.x, target.y) <= 120 * 120;
  }
  if (target.inBush) {
    return distanceSq(observer.x, observer.y, target.x, target.y) <= 210 * 210;
  }
  return true;
}

export function computeStormRadius(
  elapsedTime: number,
  mode: GameMode
): number {
  if (mode !== 'royale') {
    return MAX_STORM_RADIUS;
  }
  // Grace period of 10s before shrinking begins, reaches MIN_STORM_RADIUS at 95s
  if (elapsedTime <= 10) return MAX_STORM_RADIUS;
  const t = clamp((elapsedTime - 10) / 85, 0, 1);
  return MAX_STORM_RADIUS - (MAX_STORM_RADIUS - MIN_STORM_RADIUS) * t;
}

export function isOutsideStorm(x: number, y: number, stormRadius: number): boolean {
  return distance(x, y, ARENA_CENTER, ARENA_CENTER) > stormRadius;
}

export interface MatchEndExtras {
  starCountdownDone?: 'ally' | 'enemy' | null;
  allyTowerHp?: number;
  enemyTowerHp?: number;
  timeRemaining?: number;
}

export function evaluateMatchEnd(
  mode: GameMode,
  playerAlive: boolean,
  aliveCount: number,
  allyScore: number,
  enemyScore: number,
  targetScore: number,
  extras?: MatchEndExtras
): { ended: boolean; victory: boolean } {
  if (mode === 'royale') {
    if (!playerAlive) {
      return { ended: true, victory: false };
    }
    if (aliveCount <= 1) {
      return { ended: true, victory: true };
    }
    return { ended: false, victory: false };
  }

  if (mode === 'superstar') {
    if (extras?.starCountdownDone === 'ally') {
      return { ended: true, victory: true };
    }
    if (extras?.starCountdownDone === 'enemy') {
      return { ended: true, victory: false };
    }
    if (extras?.timeRemaining !== undefined && extras.timeRemaining <= 0) {
      return { ended: true, victory: allyScore >= enemyScore };
    }
    return { ended: false, victory: false };
  }

  if (mode === 'tower') {
    const allyHp = extras?.allyTowerHp ?? 1;
    const enemyHp = extras?.enemyTowerHp ?? 1;
    if (enemyHp <= 0) {
      return { ended: true, victory: true };
    }
    if (allyHp <= 0) {
      return { ended: true, victory: false };
    }
    if (extras?.timeRemaining !== undefined && extras.timeRemaining <= 0) {
      return { ended: true, victory: allyHp >= enemyHp };
    }
    return { ended: false, victory: false };
  }

  // Brawl Deathmatch 4v4 mode
  if (allyScore >= targetScore) {
    return { ended: true, victory: true };
  }
  if (enemyScore >= targetScore) {
    return { ended: true, victory: false };
  }
  return { ended: false, victory: false };
}

export interface DamageNumberStyle {
  scale: number;
  fontSizePx: number;
  durationSec: number;
  isCrit: boolean;
}

export function computeDamageNumberStyle(
  damage: number,
  isHeavy = false
): DamageNumberStyle {
  const safeDamage = Number.isFinite(damage) ? Math.max(0, damage) : 0;
  const norm = clamp((safeDamage - 180) / 1620, 0, 1);
  const scale = Number((0.88 + norm * 0.92 + (isHeavy ? 0.16 : 0)).toFixed(3));
  const fontSizePx = Math.round(16 * scale);
  const durationSec = Number((0.68 + norm * 0.24 + (isHeavy ? 0.08 : 0)).toFixed(3));
  const isCrit = isHeavy || safeDamage >= 1150;
  return { scale, fontSizePx, durationSec, isCrit };
}

export const KILL_STREAK_WINDOW_SEC = 8.5;

export interface KillStreakMeta {
  count: number;
  title: string;
  subtitle: string;
  tier: KillStreakTier;
  accent: string;
}

export function getKillStreakMeta(streakCount: number): KillStreakMeta | null {
  const count = Math.floor(streakCount);
  if (count < 2) return null;
  if (count === 2) {
    return {
      count,
      title: 'Double Kill',
      subtitle: '2 abates em sequência',
      tier: 'double',
      accent: '#38bdf8',
    };
  }
  if (count === 3) {
    return {
      count,
      title: 'Triple Kill',
      subtitle: '3 abates em sequência',
      tier: 'triple',
      accent: '#fbbf24',
    };
  }
  if (count === 4) {
    return {
      count,
      title: 'Quadra Kill',
      subtitle: '4 abates em sequência',
      tier: 'quadra',
      accent: '#fb7185',
    };
  }
  return {
    count,
    title: 'Godlike',
    subtitle: `${count} abates em sequência`,
    tier: 'godlike',
    accent: '#fde047',
  };
}

export function resolveKillStreak(
  prevStreak: number,
  lastKillTimeSec: number | null,
  currentKillTimeSec: number,
  windowSec = KILL_STREAK_WINDOW_SEC
): { streakCount: number; banner: KillStreakMeta | null } {
  const withinWindow =
    lastKillTimeSec !== null &&
    currentKillTimeSec >= lastKillTimeSec &&
    currentKillTimeSec - lastKillTimeSec <= windowSec;
  const streakCount = withinWindow ? Math.max(1, prevStreak) + 1 : 1;
  return {
    streakCount,
    banner: getKillStreakMeta(streakCount),
  };
}

export interface DeathCamTargetResult<T extends Pick<ActorState, 'id' | 'team' | 'x' | 'y' | 'alive'>> {
  actor: T;
  relation: DeathCamRelation;
  distanceMeters: number;
}

export function selectDeathCamTarget<
  T extends Pick<ActorState, 'id' | 'team' | 'x' | 'y' | 'alive'>,
>(
  player: Pick<ActorState, 'id' | 'team' | 'x' | 'y'>,
  killerId: string | null,
  actors: readonly T[]
): DeathCamTargetResult<T> | null {
  if (killerId && killerId !== player.id) {
    const killer = actors.find((a) => a.id === killerId && a.alive);
    if (killer) {
      return {
        actor: killer,
        relation: 'killer',
        distanceMeters: Math.max(1, Math.round(distance(player.x, player.y, killer.x, killer.y) / 30)),
      };
    }
  }

  let nearestAlly: T | null = null;
  let nearestDistSq = Infinity;

  for (const actor of actors) {
    if (!actor.alive || actor.id === player.id) continue;
    if (actor.team !== player.team) continue;
    const dSq = distanceSq(player.x, player.y, actor.x, actor.y);
    if (dSq < nearestDistSq) {
      nearestDistSq = dSq;
      nearestAlly = actor;
    }
  }

  if (!nearestAlly) return null;

  return {
    actor: nearestAlly,
    relation: 'teammate',
    distanceMeters: Math.max(1, Math.round(Math.sqrt(nearestDistSq) / 30)),
  };
}

export interface MatchDamageBarDatum {
  key: 'dealt' | 'taken';
  label: string;
  value: number;
  fill: string;
}

export interface MatchDamageComparisonResult {
  bars: [MatchDamageBarDatum, MatchDamageBarDatum];
  dealt: number;
  taken: number;
  netDiff: number;
}

export function buildMatchDamageComparison(
  damageDealt: number,
  damageTaken: number
): MatchDamageComparisonResult {
  const dealt = Number.isFinite(damageDealt) ? Math.max(0, Math.round(damageDealt)) : 0;
  const taken = Number.isFinite(damageTaken) ? Math.max(0, Math.round(damageTaken)) : 0;

  return {
    bars: [
      { key: 'dealt', label: 'Causado', value: dealt, fill: '#f59e0b' },
      { key: 'taken', label: 'Sofrido', value: taken, fill: '#f43f5e' },
    ],
    dealt,
    taken,
    netDiff: dealt - taken,
  };
}

export function computeViewportCameraScale(viewWidth: number, viewHeight: number): number {
  const safeW = Number.isFinite(viewWidth) && viewWidth > 0 ? viewWidth : 1280;
  const safeH = Number.isFinite(viewHeight) && viewHeight > 0 ? viewHeight : 720;
  if (safeW >= 760 && safeH >= 560) return 1;

  const widthScale = safeW / 690;
  const heightScale = safeH / 560;
  return clamp(Math.min(widthScale, heightScale), 0.56, 1);
}

export interface VirtualStickVector {
  x: number;
  y: number;
  magnitude: number;
  knobX: number;
  knobY: number;
}

export function computeVirtualStickVector(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzoneRatio = 0.14
): VirtualStickVector {
  const safeRadius = maxRadius > 0 ? maxRadius : 1;
  const dist = Math.hypot(dx, dy);
  if (!Number.isFinite(dist) || dist <= 0.0001) {
    return { x: 0, y: 0, magnitude: 0, knobX: 0, knobY: 0 };
  }

  const clampedDist = Math.min(dist, safeRadius);
  const nx = dx / dist;
  const ny = dy / dist;
  const knobX = nx * clampedDist;
  const knobY = ny * clampedDist;
  const rawMag = clampedDist / safeRadius;

  if (rawMag <= deadzoneRatio) {
    return { x: 0, y: 0, magnitude: 0, knobX, knobY };
  }

  const normalizedMag = clamp((rawMag - deadzoneRatio) / (1 - deadzoneRatio), 0, 1);
  return {
    x: nx * normalizedMag,
    y: ny * normalizedMag,
    magnitude: normalizedMag,
    knobX,
    knobY,
  };
}

export interface AimResolutionInput {
  currentAimAngle: number;
  virtualAimActive: boolean;
  virtualAimAngle: number;
  manualAimHoldActive: boolean;
  useMouseAim: boolean;
  mouseAimAngle: number;
  moveX: number;
  moveY: number;
}

export function resolvePlayerAimAngle(input: AimResolutionInput): number {
  if (input.virtualAimActive) {
    return input.virtualAimAngle;
  }
  if (input.useMouseAim) {
    return input.mouseAimAngle;
  }
  if (!input.manualAimHoldActive) {
    const moveLen = Math.hypot(input.moveX, input.moveY);
    if (moveLen > 0.01) {
      return Math.atan2(input.moveY, input.moveX);
    }
  }
  return input.currentAimAngle;
}

export interface SparkBurstInput {
  impactAngle: number | null;
  count: number;
  minSpeed: number;
  maxSpeed: number;
  spreadRad: number;
  colors: readonly string[];
  baseSize: number;
  gravity?: number;
  drag?: number;
  randomValues?: readonly number[];
}

export interface SparkParticleSpec {
  vx: number;
  vy: number;
  size: number;
  maxLife: number;
  color: string;
  gravity: number;
  drag: number;
}

export function createSparkBurstSpecs(input: SparkBurstInput): SparkParticleSpec[] {
  const safeCount = Math.max(0, Math.floor(input.count));
  if (safeCount === 0) return [];

  const minSpd = Math.max(20, input.minSpeed);
  const maxSpd = Math.max(minSpd, input.maxSpeed);
  const palette = input.colors.length > 0 ? input.colors : ['#fef08a', '#fbbf24', '#ffffff'];
  const gravity = input.gravity ?? 380;
  const drag = input.drag ?? 3.4;
  const baseSize = Math.max(1.5, input.baseSize);

  let randIdx = 0;
  const nextRand = (): number => {
    if (input.randomValues && input.randomValues.length > 0) {
      const val = input.randomValues[randIdx % input.randomValues.length];
      randIdx += 1;
      return clamp(val, 0, 0.999999);
    }
    return Math.random();
  };

  const specs: SparkParticleSpec[] = [];
  for (let i = 0; i < safeCount; i++) {
    const angle =
      input.impactAngle !== null
        ? input.impactAngle + (nextRand() - 0.5) * input.spreadRad
        : (Math.PI * 2 * i) / safeCount + (nextRand() - 0.5) * 0.45;
    const speed = minSpd + nextRand() * (maxSpd - minSpd);
    const maxLife = 0.19 + nextRand() * 0.19;
    const size = baseSize * (0.75 + nextRand() * 0.6);
    const color = palette[i % palette.length];

    specs.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      maxLife,
      color,
      gravity,
      drag,
    });
  }

  return specs;
}

export const PASSIVE_FURY_RATE_PLAYER = 2.2;
export const PASSIVE_FURY_RATE_BOT = 1.4;
export const BOT_FURY_GAIN_MULTIPLIER = 0.65;
export const BOT_ULTIMATE_OPENING_LOCK_SEC = 10.0;
export const BOT_RESPAWN_MAX_FURY = 70;

export function computeFuryGain(input: {
  baseGain: number;
  isPlayer: boolean;
  isUltimateSource?: boolean;
  furyGainScale?: number;
}): number {
  if (input.isUltimateSource) return 0;
  const base = Math.max(0, input.baseGain);
  const scale = clamp(input.furyGainScale ?? 1, 0, 2);
  const actorFactor = input.isPlayer ? 1 : BOT_FURY_GAIN_MULTIPLIER;
  return base * scale * actorFactor;
}

export function canBotCastUltimate(input: {
  elapsedTime: number;
  furyCharge: number;
}): boolean {
  return input.furyCharge >= 100 && input.elapsedTime >= BOT_ULTIMATE_OPENING_LOCK_SEC;
}

export function resolveBotRespawnFury(currentFuryCharge: number): number {
  return clamp(currentFuryCharge, 0, BOT_RESPAWN_MAX_FURY);
}
