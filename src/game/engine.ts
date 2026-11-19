import { createArenaMap, createInitialCrates, ArenaMap } from './arena';
import { soundEngine } from './audio';
import {
  EMOTE_BUBBLE_DURATION_MS,
  EmoteId,
  canTriggerEmote,
  getEmoteCooldownRemaining,
  isValidEmoteId,
  pickBotReactionEmote,
} from './emotes';
import { drawActorEmoteBubble } from './emoteRenderer';
import { HEROES, HERO_LIST } from './heroes';
import {
  clampHeroEvolutionLevel,
  computeEvolvedHeroStats,
} from './heroEvolution';
import { getHeroSkinSpec } from './heroSkins';
import { drawHeroCharacter, preloadHeroSprites, prioritizeHeroSprites } from './heroSprites';
import {
  getHeroSkillVfx,
  SkillCastRingStyle,
  SkillDashStyle,
  SkillDecalStyle,
  SkillProjectileShape,
  SlashArcStyle,
} from './skillVfx';
import {
  BeamEffect,
  BeamEffectKind,
  DashGhost,
  GroundDecalEffect,
  SkillRingEffect,
  drawActorSkillAuras,
  drawBeamEffect,
  drawDashGhost,
  drawGroundDecal,
  drawSkillProjectile,
  drawSkillRingEffect,
  drawSkillTelegraph,
  drawStyledSlashArc,
} from './skillVfxRenderer';
import {
  ARENA_CENTER,
  ARENA_SIZE,
  COMBO_TAP_WINDOW_SEC,
  MAX_STORM_RADIUS,
  PASSIVE_FURY_RATE_BOT,
  PASSIVE_FURY_RATE_PLAYER,
  applyDamageWithShield,
  calculateDamage,
  canBotCastUltimate,
  canObserverSeeTarget,
  canPassiveHoldFireBasic,
  canQueueBasicComboTap,
  circleIntersectsRect,
  clamp,
  clampDt,
  computeDamageNumberStyle,
  computeFuryGain,
  computeMaxHp,
  computeStormRadius,
  computeViewportCameraScale,
  createSparkBurstSpecs,
  distance,
  distanceSq,
  evaluateMatchEnd,
  getKillStreakMeta,
  isOutsideStorm,
  isPointInAnyBush,
  resolveBasicAttackCombo,
  resolveBotRespawnFury,
  resolveCircleRectCollision,
  resolveKillStreak,
  resolvePlayerAimAngle,
  selectDeathCamTarget,
} from './physics';
import {
  ActorState,
  Crate,
  DeathCamSnapshot,
  GameMode,
  GamePhase,
  HeroId,
  HeroSkinId,
  HudSnapshot,
  KillFeedItem,
  KillStreakAnnouncement,
  MapId,
  Pickup,
  Projectile,
  TelegraphZone,
  TowerState,
} from './types';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind?: 'dot' | 'spark';
  gravity?: number;
  drag?: number;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  scale: number;
  isCrit: boolean;
}

interface SlashArc {
  active: boolean;
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor?: string;
  slashStyle?: SlashArcStyle;
  comboStage?: number;
}

const BOT_NAMES = [
  'Kael',
  'Nyx',
  'Drako',
  'Zara',
  'Vex',
  'Torus',
  'Sora',
  'Bram',
  'Lyra',
  'Mako',
];

const PARTICLE_POOL_SIZE = 420;
const FLOAT_TEXT_POOL_SIZE = 48;
const SLASH_ARC_POOL_SIZE = 24;
const SKILL_RING_POOL_SIZE = 60;
const DASH_GHOST_POOL_SIZE = 44;
const GROUND_DECAL_POOL_SIZE = 32;
const BEAM_POOL_SIZE = 56;

export class ThetanEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: ArenaMap;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  private phase: GamePhase = 'title';
  private mode: GameMode = 'royale';
  private mapId: MapId = 'coliseu';
  private selectedHero: HeroId = 'raidon';
  private selectedSkin: HeroSkinId = 'classic';
  private playerEvolutionLevel = 1;

  private actors: ActorState[] = [];
  private crates: Crate[] = [];
  private pickups: Pickup[] = [];
  private projectiles: Projectile[] = [];
  private telegraphs: TelegraphZone[] = [];
  private towers: TowerState[] = [];
  private killFeed: KillFeedItem[] = [];
  private killFeedSeq = 1;
  private killStreakSeq = 1;
  private playerKillStreak = 0;
  private playerLastKillTime: number | null = null;
  private activeKillStreak: KillStreakAnnouncement | null = null;
  private killStreakTimer = 0;
  private lastKillerId: string | null = null;
  private deathCamPostRespawnTimer = 0;
  private activeDeathCam: DeathCamSnapshot | null = null;
  private activeDeathCamTargetId: string | null = null;
  private entitySeq = 1;

  private particles: Particle[] = [];
  private particleCursor = 0;
  private floatTexts: FloatingText[] = [];
  private floatTextCursor = 0;
  private slashArcs: SlashArc[] = [];
  private slashArcCursor = 0;
  private skillRings: SkillRingEffect[] = [];
  private skillRingCursor = 0;
  private dashGhosts: DashGhost[] = [];
  private dashGhostCursor = 0;
  private groundDecals: GroundDecalEffect[] = [];
  private groundDecalCursor = 0;
  private beams: BeamEffect[] = [];
  private beamCursor = 0;

  private elapsedTime = 0;
  private timeRemaining = 120;
  private stormRadius = MAX_STORM_RADIUS;
  private stormTickTimer = 0;
  private starSpawnTimer = 0;
  private starCountdown: number | null = null;
  private starLeader: 'ally' | 'enemy' | null = null;
  private allyScore = 0;
  private enemyScore = 0;
  private targetScore = 12;
  private playerDamageDealt = 0;
  private playerDamageTaken = 0;
  private lastHitDamage = 0;
  private playerPlacement = 1;
  private victory = false;
  private endBeatTimer = 0;
  private pendingEnd: { ended: boolean; victory: boolean } | null = null;
  private lastPlayerEmoteAtMs: number | null = null;
  private pendingBotEmotes: Array<{ actorId: string; emoteId: EmoteId; triggerAtMs: number }> = [];

  private isInteractivePhase(): boolean {
    return this.phase === 'playing' || this.phase === 'training';
  }

  private camX = ARENA_CENTER;
  private camY = ARENA_CENTER;
  private trauma = 0;
  private hitstopTimer = 0;

  // Input state
  private heldKeys = new Set<string>();
  private justPressed = new Set<string>();
  private bufferedAction: { type: 'q' | 'e' | 'r' | 'basic'; expiresAt: number; isDiscrete?: boolean } | null = null;
  private mouseDown = false;
  private lastDiscreteTapMs = -10000;
  private pointerClientX = 0;
  private pointerClientY = 0;
  private hasPointerMoved = false;
  private touchControlsActive = false;
  private lastTouchInputMs = -10000;
  private virtualMoveX = 0;
  private virtualMoveY = 0;
  private virtualAimActive = false;
  private virtualAimAngle = 0;
  private virtualFireHeld = false;
  private lastVirtualAimMs = 0;

  private hudTimer = 0;
  private lastHudKey = '';
  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onPhaseChange: (phase: GamePhase) => void;

  private resizeObserver: ResizeObserver | null = null;
  private viewWidth = 1280;
  private viewHeight = 720;
  private cameraScale = 1;
  private dpr = 1;
  private arenaCache: HTMLCanvasElement | null = null;
  private grassTuftSprites: HTMLCanvasElement[] = [];
  private needsStaticRedraw = true;

  constructor(
    canvas: HTMLCanvasElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onPhaseChange: (phase: GamePhase) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudUpdate = onHudUpdate;
    this.onPhaseChange = onPhaseChange;
    this.map = createArenaMap(this.mapId);

    this.initPools();
    this.buildArenaCache();
    preloadHeroSprites(() => {
      this.needsStaticRedraw = true;
    });
    this.setupShowcaseScene();
    this.bindEvents();
    this.syncCanvasSize();
  }

  private drawArenaFloorTo(ctx: CanvasRenderingContext2D) {
    const theme = this.map.meta.theme;
    ctx.fillStyle = theme.floorBase;
    ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

    const tile = 110;
    const cols = Math.ceil(ARENA_SIZE / tile);
    const rows = Math.ceil(ARENA_SIZE / tile);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tile;
        const y = r * tile;
        const alt = (r + c) % 2 === 0;
        const distCenter = Math.hypot(x + tile / 2 - ARENA_CENTER, y + tile / 2 - ARENA_CENTER);
        const inCenterZone = distCenter < 480;

        ctx.fillStyle = inCenterZone
          ? alt
            ? theme.tileCenterEven
            : theme.tileCenterOdd
          : alt
          ? theme.tileOuterEven
          : theme.tileOuterOdd;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);

        ctx.fillStyle = theme.bevelLight;
        ctx.fillRect(x + 2, y + 2, tile - 4, 3);
        ctx.fillRect(x + 2, y + 2, 3, tile - 4);
        ctx.fillStyle = theme.bevelShadow;
        ctx.fillRect(x + 2, y + tile - 5, tile - 4, 3);

        if ((r + c) % 4 === 0) {
          ctx.fillStyle = theme.techAccent;
          ctx.fillRect(x + 10, y + 10, 8, 8);
          ctx.fillRect(x + tile - 18, y + tile - 18, 8, 8);
        }
      }
    }

    ctx.strokeStyle = theme.conduitMain;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, ARENA_CENTER);
    ctx.lineTo(ARENA_SIZE - 120, ARENA_CENTER);
    ctx.moveTo(ARENA_CENTER, 120);
    ctx.lineTo(ARENA_CENTER, ARENA_SIZE - 120);
    ctx.stroke();

    ctx.strokeStyle = theme.conduitDiag;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 220);
    ctx.lineTo(ARENA_CENTER - 230, ARENA_CENTER - 230);
    ctx.moveTo(ARENA_SIZE - 220, 220);
    ctx.lineTo(ARENA_CENTER + 230, ARENA_CENTER - 230);
    ctx.moveTo(220, ARENA_SIZE - 220);
    ctx.lineTo(ARENA_CENTER - 230, ARENA_CENTER + 230);
    ctx.moveTo(ARENA_SIZE - 220, ARENA_SIZE - 220);
    ctx.lineTo(ARENA_CENTER + 230, ARENA_CENTER + 230);
    ctx.stroke();

    // Left (Blue Team) & Right (Red Team) spawn pads
    for (const [sx, color, border] of [
      [280, 'rgba(56, 189, 248, 0.14)', 'rgba(56, 189, 248, 0.45)'],
      [ARENA_SIZE - 280, 'rgba(244, 63, 94, 0.14)', 'rgba(244, 63, 94, 0.45)'],
    ] as const) {
      ctx.save();
      ctx.translate(sx, ARENA_CENTER);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 125, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 125, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Center Battle Medallion
    ctx.save();
    ctx.translate(ARENA_CENTER, ARENA_CENTER);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
    ctx.beginPath();
    ctx.arc(0, 0, 235, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.medallionFill;
    ctx.beginPath();
    ctx.arc(0, 0, 215, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.medallionRing;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 215, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = theme.medallionInner;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = theme.medallionFill;
    ctx.fillRect(-84, -84, 168, 168);
    ctx.strokeStyle = theme.medallionRing;
    ctx.lineWidth = 3;
    ctx.strokeRect(-84, -84, 168, 168);

    ctx.fillStyle = theme.techAccent;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.medallionRing;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = theme.rimOuter;
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, ARENA_SIZE - 18, ARENA_SIZE - 18);
    ctx.strokeStyle = theme.rimAccent;
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, ARENA_SIZE - 36, ARENA_SIZE - 36);
  }

  private drawArenaWallsTo(ctx: CanvasRenderingContext2D) {
    const theme = this.map.meta.theme;
    for (const w of this.map.walls) {
      ctx.fillStyle = theme.wallShadow;
      ctx.beginPath();
      ctx.roundRect(w.x + 8, w.y + 15, w.w, w.h, 12);
      ctx.fill();

      ctx.fillStyle = theme.wallSide;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(w.x, w.y, w.w, w.h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.wallRib;
      const ribStep = 26;
      for (let rx = w.x + 12; rx < w.x + w.w - 14; rx += ribStep) {
        ctx.fillRect(rx, w.y + w.h - 12, 10, 9);
      }

      const topH = Math.max(18, w.h - 16);
      ctx.fillStyle = theme.wallTop;
      ctx.beginPath();
      ctx.roundRect(w.x + 3, w.y + 2, w.w - 6, topH, 9);
      ctx.fill();

      ctx.strokeStyle = theme.wallTopHighlight;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(w.x + 4, w.y + 3, w.w - 8, topH - 2, 8);
      ctx.stroke();

      if (w.w > 46 && topH > 24) {
        ctx.fillStyle = theme.wallInnerDeck;
        ctx.beginPath();
        ctx.roundRect(w.x + 10, w.y + 8, w.w - 20, topH - 12, 5);
        ctx.fill();

        ctx.strokeStyle = theme.wallInnerTrim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(w.x + 10, w.y + 8, w.w - 20, topH - 12, 5);
        ctx.stroke();

        ctx.fillStyle = theme.wallBolt;
        for (const [bx, by] of [
          [w.x + 14, w.y + 12],
          [w.x + w.w - 14, w.y + 12],
          [w.x + 14, w.y + topH - 8],
          [w.x + w.w - 14, w.y + topH - 8],
        ]) {
          ctx.beginPath();
          ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private buildArenaCache() {
    if (typeof document === 'undefined') return;
    const offscreen = document.createElement('canvas');
    offscreen.width = ARENA_SIZE;
    offscreen.height = ARENA_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    this.drawArenaFloorTo(ctx);
    this.drawArenaWallsTo(ctx);

    this.arenaCache = offscreen;
    this.buildGrassTuftSprites();
  }

  private buildGrassTuftSprites() {
    if (typeof document === 'undefined') return;
    const theme = this.map.meta.theme;
    const sprites: HTMLCanvasElement[] = [];

    const drawStalk = (
      g: CanvasRenderingContext2D,
      x: number,
      baseY: number,
      w: number,
      h: number,
      shadeBias: number
    ) => {
      const topY = baseY - h;
      const grad = g.createLinearGradient(0, topY, 0, baseY);
      grad.addColorStop(0, shadeBias > 0 ? theme.bushHighlight : theme.bushCanopy);
      grad.addColorStop(0.45, shadeBias > 0 ? theme.bushCanopy : theme.bushBase);
      grad.addColorStop(1, theme.bushOutline);

      g.fillStyle = grad;
      g.fillRect(x, topY, w, h);

      // Subtle 2.5D prism right-side shadow facet
      g.fillStyle = 'rgba(4, 30, 38, 0.2)';
      g.fillRect(x + w - Math.max(1.2, w * 0.24), topY, Math.max(1.2, w * 0.24), h);

      // Crisp sunlit flat top cap
      g.fillStyle = shadeBias > 0 ? 'rgba(235, 255, 200, 0.42)' : 'rgba(200, 255, 210, 0.28)';
      g.fillRect(x, topY, w - 1, 2.2);
    };

    // 0..3: full lush vertical-stalk clusters; 4..5: smaller perimeter tufts
    const layouts: Array<{
      warm: boolean;
      stalks: Array<[number, number, number, number, number]>;
    }> = [
      {
        warm: true,
        stalks: [
          [-14, -2, 6, 15, 0],
          [-8, -3, 6.5, 22, 1],
          [-2, -4, 7, 27, 1],
          [5, -3, 6.5, 21, 0],
          [11, -2, 5.5, 14, 0],
          [-11, 2, 5.5, 13, 1],
          [-4, 3, 6.5, 17, 1],
          [3, 2, 6, 15, 0],
        ],
      },
      {
        warm: false,
        stalks: [
          [-13, -2, 5.5, 14, 0],
          [-7, -4, 6.5, 21, 1],
          [-1, -3, 7, 25, 0],
          [6, -4, 6.5, 22, 1],
          [12, -1, 5.5, 13, 0],
          [-9, 2, 6, 14, 0],
          [-2, 3, 6.5, 18, 1],
          [5, 2, 5.5, 14, 1],
        ],
      },
      {
        warm: true,
        stalks: [
          [-15, -1, 5.5, 13, 1],
          [-9, -3, 6.5, 20, 1],
          [-3, -5, 6.5, 28, 1],
          [4, -3, 7, 23, 0],
          [11, -2, 5.5, 16, 1],
          [-11, 2, 5.5, 12, 0],
          [-4, 3, 6, 16, 1],
          [3, 3, 6.5, 15, 1],
        ],
      },
      {
        warm: false,
        stalks: [
          [-13, -3, 6, 17, 0],
          [-7, -4, 6.5, 24, 1],
          [0, -4, 6.5, 26, 1],
          [7, -3, 6, 19, 0],
          [12, -1, 5.5, 13, 0],
          [-9, 2, 6, 14, 1],
          [-2, 2, 6.5, 17, 0],
          [5, 3, 6, 13, 1],
        ],
      },
      {
        warm: true,
        stalks: [
          [-9, -1, 5, 12, 0],
          [-4, -2, 6, 18, 1],
          [2, -1, 5.5, 14, 1],
          [-6, 2, 5, 11, 1],
          [0, 2, 5.5, 13, 0],
        ],
      },
      {
        warm: false,
        stalks: [
          [-8, -1, 5.5, 14, 1],
          [-2, -2, 6, 17, 0],
          [4, -1, 5, 12, 1],
          [-4, 2, 5.5, 12, 0],
          [2, 2, 5, 10, 1],
        ],
      },
    ];

    for (const layout of layouts) {
      const c = document.createElement('canvas');
      c.width = 56;
      c.height = 50;
      const g = c.getContext('2d');
      if (!g) continue;

      const cx = 28;
      const by = 43;

      // Soft root ambient shadow at clump base
      g.fillStyle = theme.bushShadow;
      g.globalAlpha = 0.45;
      g.beginPath();
      g.ellipse(cx, by + 1, 16, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;

      for (const [ox, oy, w, h, bias] of layout.stalks) {
        drawStalk(g, cx + ox, by + oy, w, h, layout.warm ? bias : Math.max(0, bias - 0.5));
      }

      sprites.push(c);
    }

    this.grassTuftSprites = sprites;
  }

  private initPools() {
    this.particles = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      color: '#fff',
      kind: 'dot',
      gravity: 0,
      drag: 5,
    }));

    this.floatTexts = Array.from({ length: FLOAT_TEXT_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: -40,
      life: 0,
      maxLife: 0.8,
      text: '',
      color: '#fff',
      scale: 1,
      isCrit: false,
    }));

    this.slashArcs = Array.from({ length: SLASH_ARC_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      angle: 0,
      radius: 100,
      life: 0,
      maxLife: 0.2,
      color: '#fff',
    }));

    this.skillRings = Array.from({ length: SKILL_RING_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      startRadius: 12,
      endRadius: 80,
      angle: 0,
      life: 0,
      maxLife: 0.35,
      color: '#fff',
      secondaryColor: '#fff',
      style: 'shockwave',
      lineWidth: 4,
    }));

    this.dashGhosts = Array.from({ length: DASH_GHOST_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      angle: 0,
      radius: 24,
      life: 0,
      maxLife: 0.22,
      color: '#fff',
      secondaryColor: '#fff',
      style: 'lightning_arc',
    }));

    this.groundDecals = Array.from({ length: GROUND_DECAL_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      radius: 100,
      angle: 0,
      life: 0,
      maxLife: 2.2,
      color: '#fb923c',
      secondaryColor: '#fde047',
      style: 'magma_crater',
    }));

    this.beams = Array.from({ length: BEAM_POOL_SIZE }, () => ({
      active: false,
      kind: 'laser',
      x: 0,
      y: 0,
      x2: 0,
      y2: 0,
      width: 12,
      life: 0,
      maxLife: 0.28,
      color: '#38bdf8',
      secondaryColor: '#ffffff',
      seed: 0,
    }));
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    kind: 'dot' | 'spark' = 'dot',
    gravity = 0,
    drag = 5
  ) {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.kind = kind;
    p.gravity = gravity;
    p.drag = drag;
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed = 220, size = 5) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.85);
      this.spawnParticle(
        x,
        y,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        size * (0.6 + Math.random() * 0.8),
        color,
        0.24 + Math.random() * 0.28
      );
    }
  }

  private spawnSparks(
    x: number,
    y: number,
    options: {
      impactAngle: number | null;
      count: number;
      minSpeed: number;
      maxSpeed: number;
      spreadRad: number;
      colors: readonly string[];
      baseSize: number;
      gravity?: number;
      drag?: number;
    }
  ) {
    const specs = createSparkBurstSpecs(options);
    for (const s of specs) {
      this.spawnParticle(
        x,
        y,
        s.vx,
        s.vy,
        s.size,
        s.color,
        s.maxLife,
        'spark',
        s.gravity,
        s.drag
      );
    }
  }

  private spawnFloatText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
    duration = 0.72,
    vx = (Math.random() - 0.5) * 18,
    isCrit = false
  ) {
    const f = this.floatTexts[this.floatTextCursor];
    this.floatTextCursor = (this.floatTextCursor + 1) % FLOAT_TEXT_POOL_SIZE;
    f.active = true;
    f.x = x + (Math.random() - 0.5) * 22;
    f.y = y - 24;
    f.vx = vx;
    f.vy = -(62 + scale * 18);
    f.life = duration;
    f.maxLife = duration;
    f.text = text;
    f.color = color;
    f.scale = scale;
    f.isCrit = isCrit;
  }

  private spawnSlashArc(
    x: number,
    y: number,
    angle: number,
    radius: number,
    color: string,
    comboStage = 1,
    slashStyle?: SlashArcStyle,
    secondaryColor = '#ffffff'
  ) {
    const s = this.slashArcs[this.slashArcCursor];
    this.slashArcCursor = (this.slashArcCursor + 1) % SLASH_ARC_POOL_SIZE;
    s.active = true;
    s.x = x;
    s.y = y;
    s.angle = angle;
    s.radius = radius;
    s.life = comboStage >= 3 ? 0.24 : 0.18;
    s.maxLife = s.life;
    s.color = color;
    s.secondaryColor = secondaryColor;
    s.slashStyle = slashStyle;
    s.comboStage = comboStage;
  }

  private spawnSkillRing(
    x: number,
    y: number,
    startRadius: number,
    endRadius: number,
    angle: number,
    color: string,
    secondaryColor: string,
    style: SkillCastRingStyle,
    maxLife = 0.34,
    lineWidth = 4.5
  ) {
    const r = this.skillRings[this.skillRingCursor];
    this.skillRingCursor = (this.skillRingCursor + 1) % SKILL_RING_POOL_SIZE;
    r.active = true;
    r.x = x;
    r.y = y;
    r.startRadius = startRadius;
    r.endRadius = endRadius;
    r.angle = angle;
    r.life = maxLife;
    r.maxLife = maxLife;
    r.color = color;
    r.secondaryColor = secondaryColor;
    r.style = style;
    r.lineWidth = lineWidth;
  }

  private spawnDashGhost(
    x: number,
    y: number,
    angle: number,
    radius: number,
    color: string,
    secondaryColor: string,
    style: SkillDashStyle,
    maxLife = 0.22
  ) {
    const g = this.dashGhosts[this.dashGhostCursor];
    this.dashGhostCursor = (this.dashGhostCursor + 1) % DASH_GHOST_POOL_SIZE;
    g.active = true;
    g.x = x;
    g.y = y;
    g.angle = angle;
    g.radius = radius;
    g.life = maxLife;
    g.maxLife = maxLife;
    g.color = color;
    g.secondaryColor = secondaryColor;
    g.style = style;
  }

  private spawnDualBurst(
    x: number,
    y: number,
    primaryColor: string,
    secondaryColor: string,
    count: number,
    speed = 220,
    size = 5
  ) {
    const half = Math.max(1, Math.floor(count / 2));
    this.spawnBurst(x, y, primaryColor, half, speed, size);
    this.spawnBurst(x, y, secondaryColor, count - half, speed * 0.85, size * 0.85);
  }

  private spawnGroundDecal(
    x: number,
    y: number,
    radius: number,
    color: string,
    secondaryColor: string,
    style: SkillDecalStyle,
    maxLife = 2.4,
    angle = Math.random() * Math.PI * 2
  ) {
    const d = this.groundDecals[this.groundDecalCursor];
    this.groundDecalCursor = (this.groundDecalCursor + 1) % GROUND_DECAL_POOL_SIZE;
    d.active = true;
    d.x = x;
    d.y = y;
    d.radius = radius;
    d.angle = angle;
    d.life = maxLife;
    d.maxLife = maxLife;
    d.color = color;
    d.secondaryColor = secondaryColor;
    d.style = style;
  }

  private spawnBeam(
    kind: BeamEffectKind,
    x: number,
    y: number,
    x2: number,
    y2: number,
    color: string,
    secondaryColor: string,
    width = 14,
    maxLife = 0.28,
    seed = Math.random() * 10
  ) {
    const b = this.beams[this.beamCursor];
    this.beamCursor = (this.beamCursor + 1) % BEAM_POOL_SIZE;
    b.active = true;
    b.kind = kind;
    b.x = x;
    b.y = y;
    b.x2 = x2;
    b.y2 = y2;
    b.width = width;
    b.life = maxLife;
    b.maxLife = maxLife;
    b.color = color;
    b.secondaryColor = secondaryColor;
    b.seed = seed;
  }

  private createActor(
    id: string,
    name: string,
    heroId: HeroId,
    isPlayer: boolean,
    team: ActorState['team'],
    x: number,
    y: number,
    aimAngle: number
  ): ActorState {
    const cfg = HEROES[heroId];
    const baseMaxHp = isPlayer
      ? computeEvolvedHeroStats(heroId, this.playerEvolutionLevel).maxHp
      : cfg.maxHp;
    return {
      id,
      name,
      heroId,
      isPlayer,
      team,
      x,
      y,
      vx: 0,
      vy: 0,
      aimAngle,
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      ghostHp: baseMaxHp,
      shield: 0,
      powerCubes: 0,
      starsHeld: 0,
      kills: 0,
      deaths: 0,
      ammo: cfg.maxAmmo,
      maxAmmo: cfg.maxAmmo,
      ammoReloadTimer: 0,
      attackLockout: 0,
      qCooldown: 0,
      eCooldown: 0,
      furyCharge: 0,
      stealthTimer: 0,
      speedBoostTimer: 0,
      eVfxTimer: 0,
      slowTimer: 0,
      stunTimer: 0,
      burnTimer: 0,
      burnTickTimer: 0,
      hitFlash: 0,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      dashDamage: 0,
      dashHitIds: [],
      walkPhase: 0,
      squashX: 1,
      squashY: 1,
      attackSwingTimer: 0,
      comboStep: 0,
      comboWindowTimer: 0,
      comboTapQueue: 0,
      alive: true,
      koTimer: 0,
      respawnTimer: 0,
      inBush: false,
      revealedTimer: 0,
      aiThinkTimer: Math.random() * 0.25,
      aiStrafeDir: Math.random() > 0.5 ? 1 : -1,
      aiTargetId: null,
    };
  }

  public previewMap(mapId: MapId) {
    if (this.mapId === mapId) return;
    this.mapId = mapId;
    this.map = createArenaMap(mapId);
    this.buildArenaCache();
    this.needsStaticRedraw = true;
    if (this.phase === 'title') {
      this.setupShowcaseScene();
    }
  }

  public previewHeroSkin(heroId: HeroId, skinId: HeroSkinId = 'classic') {
    this.selectedHero = heroId;
    this.selectedSkin = skinId;
    if (this.phase === 'title') {
      const showcaseLead = this.actors[0];
      if (showcaseLead) {
        showcaseLead.heroId = heroId;
        showcaseLead.skinId = skinId;
        showcaseLead.name = HEROES[heroId].name;
      }
      prioritizeHeroSprites([heroId]);
      this.emitHud(true);
    }
  }

  private setupShowcaseScene() {
    this.crates = createInitialCrates(this.map);
    this.pickups = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.towers = [];
    this.actors = [];

    const otherHeroes: HeroId[] = HERO_LIST.map((h) => h.id).filter(
      (id) => id !== this.selectedHero
    );
    for (let i = 0; i < 8; i++) {
      const sp = this.map.royaleSpawns[i];
      const hid = i === 0 ? this.selectedHero : otherHeroes[(i - 1) % otherHeroes.length];
      const actor = this.createActor(
        `showcase-${i}`,
        HEROES[hid].name,
        hid,
        false,
        i,
        sp.x,
        sp.y,
        sp.aimAngle
      );
      if (i === 0) {
        actor.skinId = this.selectedSkin;
      }
      this.actors.push(actor);
    }
    prioritizeHeroSprites(Array.from(new Set(this.actors.map((a) => a.heroId))));
  }

  public startMatch(
    heroId: HeroId,
    mode: GameMode,
    mapId: MapId = this.mapId,
    skinId: HeroSkinId = this.selectedSkin,
    evolutionLevel: number = 1
  ) {
    this.selectedHero = heroId;
    this.selectedSkin = skinId;
    this.playerEvolutionLevel = clampHeroEvolutionLevel(evolutionLevel);
    this.mode = mode;
    if (mapId !== this.mapId) {
      this.mapId = mapId;
      this.map = createArenaMap(mapId);
      this.buildArenaCache();
    }
    this.phase = 'playing';
    document.body.dataset.state = 'playing';
    this.onPhaseChange('playing');

    this.clearInputs();
    this.crates = createInitialCrates(this.map);
    this.pickups = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.towers = [];
    this.killFeed = [];
    this.playerKillStreak = 0;
    this.playerLastKillTime = null;
    this.activeKillStreak = null;
    this.killStreakTimer = 0;
    this.lastKillerId = null;
    this.deathCamPostRespawnTimer = 0;
    this.activeDeathCam = null;
    this.activeDeathCamTargetId = null;
    this.elapsedTime = 0;
    this.timeRemaining = mode === 'royale' ? 180 : 120;
    this.stormRadius = MAX_STORM_RADIUS;
    this.stormTickTimer = 0;
    this.starSpawnTimer = 4.2;
    this.starCountdown = null;
    this.starLeader = null;
    this.allyScore = 0;
    this.enemyScore = 0;
    this.targetScore = mode === 'superstar' ? 10 : 12;
    this.playerDamageDealt = 0;
    this.playerDamageTaken = 0;
    this.lastHitDamage = 0;
    this.playerPlacement = mode === 'royale' ? 8 : 1;
    this.victory = false;
    soundEngine.resetVictoryCooldown();
    soundEngine.playVoiceLine(heroId, 'match_start');
    this.pendingEnd = null;
    this.endBeatTimer = 0;
    this.hitstopTimer = 0;
    this.trauma = 0;
    this.lastPlayerEmoteAtMs = null;
    this.pendingBotEmotes = [];

    for (const p of this.particles) p.active = false;
    for (const f of this.floatTexts) f.active = false;
    for (const s of this.slashArcs) s.active = false;
    for (const r of this.skillRings) r.active = false;
    for (const g of this.dashGhosts) g.active = false;
    for (const d of this.groundDecals) d.active = false;
    for (const b of this.beams) b.active = false;

    const allHeroes: HeroId[] = HERO_LIST.map((h) => h.id);
    this.actors = [];

    if (mode === 'royale') {
      const spawns = this.map.royaleSpawns;
      const playerSpawn = spawns[0];
      const player = this.createActor(
        'player',
        'Você',
        heroId,
        true,
        0,
        playerSpawn.x,
        playerSpawn.y,
        playerSpawn.aimAngle
      );
      player.skinId = skinId;
      this.actors.push(player);

      for (let i = 1; i < spawns.length; i++) {
        const sp = spawns[i];
        const botHero = allHeroes[(i + Math.floor(Math.random() * allHeroes.length)) % allHeroes.length];
        this.actors.push(
          this.createActor(
            `bot-${i}`,
            BOT_NAMES[i - 1],
            botHero,
            false,
            i,
            sp.x,
            sp.y,
            sp.aimAngle
          )
        );
      }
      this.camX = player.x;
      this.camY = player.y;
    } else {
      // All 4v4 Team Modes: Deathmatch ('brawl'), Super Estrela ('superstar'), Cerco à Torre ('tower')
      const allySpawns = this.map.brawlAllySpawns;
      const enemySpawns = this.map.brawlEnemySpawns;

      const player = this.createActor(
        'player',
        'Você',
        heroId,
        true,
        'ally',
        allySpawns[1].x,
        allySpawns[1].y,
        allySpawns[1].aimAngle
      );
      player.skinId = skinId;
      this.actors.push(player);

      const otherHeroes = allHeroes.filter((h) => h !== heroId);
      const allyIndices = [0, 2, 3];
      allyIndices.forEach((spIdx, k) => {
        const sp = allySpawns[spIdx];
        const h = otherHeroes[(k * 2 + Math.floor(Math.random() * otherHeroes.length)) % otherHeroes.length];
        this.actors.push(
          this.createActor(`ally-${k}`, BOT_NAMES[k], h, false, 'ally', sp.x, sp.y, sp.aimAngle)
        );
      });

      enemySpawns.forEach((sp, k) => {
        const h = allHeroes[(k * 2 + 1) % allHeroes.length];
        this.actors.push(
          this.createActor(
            `enemy-${k}`,
            BOT_NAMES[k + 4],
            h,
            false,
            'enemy',
            sp.x,
            sp.y,
            sp.aimAngle
          )
        );
      });

      if (mode === 'superstar') {
        // Seed initial twin golden stars at center plaza
        for (const offsetX of [-36, 36]) {
          this.pickups.push({
            id: `pk-${this.entitySeq++}`,
            kind: 'star',
            x: ARENA_CENTER + offsetX,
            y: ARENA_CENTER,
            vx: offsetX * 1.4,
            vy: (Math.random() - 0.5) * 40,
            age: 0,
            collected: false,
          });
        }
      } else if (mode === 'tower') {
        this.towers = [
          {
            id: 'tower-ally',
            team: 'ally',
            x: this.map.allyTowerPos.x,
            y: this.map.allyTowerPos.y,
            hp: 8500,
            maxHp: 8500,
            radius: 44,
            hitFlash: 0,
            fireCooldown: 0.6,
            aimAngle: 0,
            destroyed: false,
          },
          {
            id: 'tower-enemy',
            team: 'enemy',
            x: this.map.enemyTowerPos.x,
            y: this.map.enemyTowerPos.y,
            hp: 8500,
            maxHp: 8500,
            radius: 44,
            hitFlash: 0,
            fireCooldown: 0.6,
            aimAngle: Math.PI,
            destroyed: false,
          },
        ];
      }
    }

    prioritizeHeroSprites([
      heroId,
      ...Array.from(new Set(this.actors.map((a) => a.heroId))).filter((id) => id !== heroId),
    ]);

    const playerActor = this.actors.find((a) => a.isPlayer);
    if (playerActor) {
      const halfW = Math.min(ARENA_SIZE / 2, this.viewWidth / 2);
      const halfH = Math.min(ARENA_SIZE / 2, this.viewHeight / 2);
      this.camX = clamp(playerActor.x, halfW, ARENA_SIZE - halfW);
      this.camY = clamp(playerActor.y, halfH, ARENA_SIZE - halfH);
    }

    this.emitHud(true);
  }

  public setPhase(nextPhase: GamePhase) {
    if (this.phase === nextPhase) return;
    this.phase = nextPhase;
    this.needsStaticRedraw = true;
    document.body.dataset.state = nextPhase;
    if (nextPhase !== 'playing') {
      this.clearInputs();
    }
    this.emitHud(true);
    this.onPhaseChange(nextPhase);
  }

  public returnToTitle() {
    this.phase = 'title';
    this.needsStaticRedraw = true;
    document.body.dataset.state = 'title';
    this.clearInputs();
    this.playerKillStreak = 0;
    this.playerLastKillTime = null;
    this.activeKillStreak = null;
    this.killStreakTimer = 0;
    this.lastKillerId = null;
    this.deathCamPostRespawnTimer = 0;
    this.activeDeathCam = null;
    this.activeDeathCamTargetId = null;
    this.setupShowcaseScene();
    this.onPhaseChange('title');
    this.emitHud(true);
  }

  public startTraining(
    heroId: HeroId,
    mapId: MapId = this.mapId,
    skinId: HeroSkinId = this.selectedSkin,
    evolutionLevel: number = 1
  ) {
    this.selectedHero = heroId;
    this.selectedSkin = skinId;
    this.playerEvolutionLevel = clampHeroEvolutionLevel(evolutionLevel);
    this.mode = 'brawl';
    if (mapId !== this.mapId) {
      this.mapId = mapId;
      this.map = createArenaMap(mapId);
      this.buildArenaCache();
    }
    this.phase = 'training';
    document.body.dataset.state = 'training';
    this.onPhaseChange('training');

    this.clearInputs();
    this.crates = createInitialCrates(this.map);
    this.pickups = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.towers = [];
    this.killFeed = [];
    this.playerKillStreak = 0;
    this.playerLastKillTime = null;
    this.activeKillStreak = null;
    this.killStreakTimer = 0;
    this.lastKillerId = null;
    this.deathCamPostRespawnTimer = 0;
    this.activeDeathCam = null;
    this.activeDeathCamTargetId = null;
    this.elapsedTime = 0;
    this.timeRemaining = 0;
    this.stormRadius = MAX_STORM_RADIUS;
    this.stormTickTimer = 0;
    this.starSpawnTimer = 0;
    this.starCountdown = null;
    this.starLeader = null;
    this.allyScore = 0;
    this.enemyScore = 0;
    this.targetScore = 0;
    this.playerDamageDealt = 0;
    this.playerDamageTaken = 0;
    this.lastHitDamage = 0;
    this.playerPlacement = 1;
    this.victory = false;
    soundEngine.resetVictoryCooldown();
    this.pendingEnd = null;
    this.endBeatTimer = 0;
    this.hitstopTimer = 0;
    this.trauma = 0;
    this.lastPlayerEmoteAtMs = null;
    this.pendingBotEmotes = [];

    for (const p of this.particles) p.active = false;
    for (const f of this.floatTexts) f.active = false;
    for (const s of this.slashArcs) s.active = false;
    for (const r of this.skillRings) r.active = false;
    for (const g of this.dashGhosts) g.active = false;
    for (const d of this.groundDecals) d.active = false;
    for (const b of this.beams) b.active = false;

    const player = this.createActor(
      'player',
      'Você',
      heroId,
      true,
      'ally',
      ARENA_CENTER - 165,
      ARENA_CENTER,
      0
    );
    player.skinId = skinId;
    player.furyCharge = 100;
    this.resolveActorCollisions(player);
    this.actors = [player, ...this.createTrainingDummies()];

    prioritizeHeroSprites([
      heroId,
      ...Array.from(new Set(this.actors.map((a) => a.heroId))).filter((id) => id !== heroId),
    ]);

    const halfW = Math.min(ARENA_SIZE / 2, this.viewWidth / (2 * this.cameraScale));
    const halfH = Math.min(ARENA_SIZE / 2, this.viewHeight / (2 * this.cameraScale));
    this.camX = clamp(player.x + 80, halfW, ARENA_SIZE - halfW);
    this.camY = clamp(player.y, halfH, ARENA_SIZE - halfH);

    this.emitHud(true);
  }

  private createTrainingDummies(): ActorState[] {
    const specs: Array<{
      id: string;
      name: string;
      heroId: HeroId;
      x: number;
      y: number;
    }> = [
      {
        id: 'dummy-main',
        name: 'Alvo Principal',
        heroId: 'boulder',
        x: ARENA_CENTER + 95,
        y: ARENA_CENTER,
      },
      {
        id: 'dummy-group-a',
        name: 'Alvo Grupo A',
        heroId: 'raidon',
        x: ARENA_CENTER + 215,
        y: ARENA_CENTER - 95,
      },
      {
        id: 'dummy-group-b',
        name: 'Alvo Grupo B',
        heroId: 'velvet',
        x: ARENA_CENTER + 215,
        y: ARENA_CENTER + 95,
      },
      {
        id: 'dummy-moving',
        name: 'Alvo Móvel',
        heroId: 'ryder',
        x: ARENA_CENTER + 335,
        y: ARENA_CENTER,
      },
    ];

    return specs.map((sp) => {
      const dummy = this.createActor(sp.id, sp.name, sp.heroId, false, 'enemy', sp.x, sp.y, Math.PI);
      dummy.maxHp = 6000;
      dummy.hp = 6000;
      dummy.ghostHp = 6000;
      dummy.isDummy = true;
      dummy.dummyRegenTimer = 0;
      this.resolveActorCollisions(dummy);
      dummy.homeX = dummy.x;
      dummy.homeY = dummy.y;
      return dummy;
    });
  }

  public switchTrainingHero(
    heroId: HeroId,
    skinId: HeroSkinId = 'classic',
    evolutionLevel: number = 1
  ) {
    if (this.phase !== 'training') return;
    this.selectedHero = heroId;
    this.selectedSkin = skinId;
    this.playerEvolutionLevel = clampHeroEvolutionLevel(evolutionLevel);
    const player = this.actors.find((a) => a.isPlayer);
    if (player) {
      const cfg = HEROES[heroId];
      const evolved = computeEvolvedHeroStats(heroId, this.playerEvolutionLevel);
      const skin = getHeroSkinSpec(heroId, skinId);
      player.heroId = heroId;
      player.skinId = skinId;
      player.maxHp = evolved.maxHp;
      player.hp = evolved.maxHp;
      player.ghostHp = evolved.maxHp;
      player.shield = 0;
      player.ammo = cfg.maxAmmo;
      player.maxAmmo = cfg.maxAmmo;
      player.ammoReloadTimer = 0;
      player.attackLockout = 0;
      player.qCooldown = 0;
      player.eCooldown = 0;
      player.furyCharge = 100;
      player.dashTimer = 0;
      player.activeDashStyle = undefined;
      player.stealthTimer = 0;
      player.speedBoostTimer = 0;
      player.slowTimer = 0;
      player.stunTimer = 0;
      player.burnTimer = 0;
      player.comboStep = 0;
      player.comboWindowTimer = 0;
      player.comboTapQueue = 0;
      player.alive = true;
      this.resolveActorCollisions(player);
      this.spawnSkillRing(player.x, player.y, 16, 72, 0, skin.accentColor, '#ffffff', 'shockwave', 0.32, 4);
      this.spawnBurst(player.x, player.y, skin.accentColor, 14, 210, 4.5);
    }
    prioritizeHeroSprites([heroId]);
    this.emitHud(true);
  }

  public refreshTrainingLab() {
    if (this.phase !== 'training') return;
    this.playerDamageDealt = 0;
    this.playerDamageTaken = 0;
    this.lastHitDamage = 0;
    this.projectiles = [];
    this.telegraphs = [];
    this.crates = createInitialCrates(this.map);

    const player = this.actors.find((a) => a.isPlayer);
    if (player) {
      const cfg = HEROES[player.heroId];
      const evolved = computeEvolvedHeroStats(player.heroId, this.playerEvolutionLevel);
      player.maxHp = evolved.maxHp;
      player.hp = evolved.maxHp;
      player.ghostHp = evolved.maxHp;
      player.shield = 0;
      player.ammo = cfg.maxAmmo;
      player.ammoReloadTimer = 0;
      player.attackLockout = 0;
      player.qCooldown = 0;
      player.eCooldown = 0;
      player.furyCharge = 100;
      player.dashTimer = 0;
      player.stealthTimer = 0;
      player.speedBoostTimer = 0;
      player.comboStep = 0;
      player.comboTapQueue = 0;
      player.alive = true;
      this.spawnSkillRing(player.x, player.y, 12, 62, 0, '#fbbf24', '#38bdf8', 'shockwave', 0.28, 3.5);
    }

    for (const actor of this.actors) {
      if (!actor.isDummy) continue;
      actor.alive = true;
      actor.hp = actor.maxHp;
      actor.ghostHp = actor.maxHp;
      actor.shield = 0;
      actor.stunTimer = 0;
      actor.slowTimer = 0;
      actor.burnTimer = 0;
      actor.dummyRegenTimer = 0;
      if (actor.homeX !== undefined) actor.x = actor.homeX;
      if (actor.homeY !== undefined) actor.y = actor.homeY;
    }

    this.emitHud(true);
  }

  public focusPlayerCamera() {
    this.deathCamPostRespawnTimer = 0;
    const player = this.actors.find((a) => a.isPlayer);
    if (player?.alive) {
      this.lastKillerId = null;
      this.activeDeathCam = null;
      this.activeDeathCamTargetId = null;
    }
    this.emitHud(true);
  }

  public triggerPlayerEmote(emoteId: EmoteId): boolean {
    if (!this.isInteractivePhase() || !isValidEmoteId(emoteId)) return false;
    const player = this.actors.find((a) => a.isPlayer);
    if (!player || !player.alive) return false;

    const now = performance.now();
    if (!canTriggerEmote(this.lastPlayerEmoteAtMs, now)) {
      return false;
    }

    this.lastPlayerEmoteAtMs = now;
    player.activeEmote = {
      id: emoteId,
      startedAtMs: now,
      expiresAtMs: now + EMOTE_BUBBLE_DURATION_MS,
    };
    soundEngine.playEmote(emoteId);

    // Queue natural social reactions from nearby visible bots or training dummies
    let repliesQueued = 0;
    for (const actor of this.actors) {
      if (actor.isPlayer || !actor.alive) continue;
      if (distance(player.x, player.y, actor.x, actor.y) > 720) continue;
      if (!actor.isDummy && !canObserverSeeTarget(player, actor)) continue;
      if (Math.random() < (actor.isDummy ? 0.65 : 0.45)) {
        this.pendingBotEmotes.push({
          actorId: actor.id,
          emoteId: pickBotReactionEmote('reply', emoteId),
          triggerAtMs: now + 420 + repliesQueued * 280 + Math.random() * 320,
        });
        repliesQueued += 1;
        if (repliesQueued >= 2) break;
      }
    }

    this.emitHud(true);
    return true;
  }

  public triggerDeathCamPreview(mode: 'killer' | 'teammate' | 'postRespawn') {
    const player = this.actors.find((a) => a.isPlayer);
    if (!player) return;
    const enemy = this.actors.find((a) => a.alive && a.team !== player.team);
    const ally = this.actors.find((a) => a.alive && a.id !== player.id && a.team === player.team);
    if (mode === 'teammate' && ally) {
      player.alive = false;
      player.hp = 0;
      player.respawnTimer = 3.8;
      this.lastKillerId = null;
      this.deathCamPostRespawnTimer = 0;
      ally.powerCubes = Math.max(2, ally.powerCubes);
      ally.kills = Math.max(2, ally.kills);
      ally.furyCharge = 68;
      this.camX = ally.x;
      this.camY = ally.y;
    } else if (mode === 'postRespawn' && (enemy || ally)) {
      const target = enemy ?? ally!;
      player.alive = true;
      player.hp = player.maxHp;
      player.respawnTimer = 0;
      this.lastKillerId = enemy ? enemy.id : null;
      this.deathCamPostRespawnTimer = 2.6;
      target.powerCubes = Math.max(3, target.powerCubes);
      target.kills = Math.max(3, target.kills);
      target.furyCharge = 84;
      this.camX = target.x;
      this.camY = target.y;
    } else if (enemy) {
      player.alive = false;
      player.hp = 0;
      player.respawnTimer = 3.8;
      this.lastKillerId = enemy.id;
      this.deathCamPostRespawnTimer = 0;
      enemy.powerCubes = Math.max(3, enemy.powerCubes);
      enemy.kills = Math.max(4, enemy.kills);
      enemy.furyCharge = 92;
      enemy.hp = Math.round(enemy.maxHp * 0.68);
      this.camX = enemy.x;
      this.camY = enemy.y;
    }
    this.updateDeathCamState(player);
    this.emitHud(true);
  }

  public triggerKillStreakPreview(streakCount: number) {
    const meta = getKillStreakMeta(streakCount);
    if (!meta) return;
    this.playerKillStreak = meta.count;
    this.playerLastKillTime = this.elapsedTime;
    this.activeKillStreak = {
      id: this.killStreakSeq++,
      ...meta,
    };
    this.killStreakTimer = 2.6;
    const player = this.actors.find((a) => a.isPlayer);
    if (player) {
      player.kills = Math.max(player.kills, meta.count);
      this.spawnBurst(player.x, player.y, meta.accent, 22, 280, 5.5);
    }
    this.emitHud(true);
  }

  public triggerVictoryBeat(kills = 5, cubes = 4, damage = 6840, damageTaken = 2460) {
    const player = this.actors.find((a) => a.isPlayer);
    if (player) {
      player.kills = kills;
      player.powerCubes = cubes;
      this.spawnBurst(player.x, player.y, '#fbbf24', 32, 340, 7);
      this.spawnBurst(player.x, player.y, HEROES[player.heroId].accent, 24, 280, 6);
    }
    this.playerDamageDealt = damage;
    this.playerDamageTaken = damageTaken;
    this.playerPlacement = 1;
    this.allyScore = this.targetScore;
    this.pendingEnd = { ended: true, victory: true };
    this.endBeatTimer = 0.65;
  }

  public togglePause() {
    if (this.phase === 'playing') {
      this.setPhase('paused');
    } else if (this.phase === 'paused') {
      this.setPhase('playing');
    }
  }

  public startLoop() {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = clampDt(rawDt);
      if (this.phase === 'paused' || this.phase === 'gameover') {
        if (this.needsStaticRedraw) {
          this.render(now);
          this.needsStaticRedraw = false;
        }
      } else {
        this.update(dt, now);
        this.render(now);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
    this.resizeObserver?.disconnect();
  }

  private clearInputs() {
    this.heldKeys.clear();
    this.justPressed.clear();
    this.bufferedAction = null;
    this.mouseDown = false;
    this.lastDiscreteTapMs = -10000;
    this.hasPointerMoved = false;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualAimActive = false;
    this.virtualFireHeld = false;
    this.lastVirtualAimMs = 0;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;

    if (code === 'Escape' || code === 'KeyP') {
      if (this.phase === 'playing' || this.phase === 'paused') {
        e.preventDefault();
        this.togglePause();
        return;
      }
      if (code === 'Escape' && this.phase === 'training') {
        e.preventDefault();
        this.returnToTitle();
        return;
      }
    }

    if (code === 'KeyM' && this.isInteractivePhase()) {
      soundEngine.setMuted(!soundEngine.isMuted());
      this.emitHud();
      return;
    }

    if (!this.isInteractivePhase()) return;

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }

    if (!this.heldKeys.has(code)) {
      this.justPressed.add(code);
      const now = performance.now();
      if (code === 'KeyQ') {
        this.bufferedAction = { type: 'q', expiresAt: now + 130 };
        this.cancelPostRespawnDeathCamOnAction();
      }
      if (code === 'KeyE') {
        this.bufferedAction = { type: 'e', expiresAt: now + 130 };
        this.cancelPostRespawnDeathCamOnAction();
      }
      if (code === 'KeyR') {
        this.bufferedAction = { type: 'r', expiresAt: now + 130 };
        this.cancelPostRespawnDeathCamOnAction();
      }
      if (code === 'Space') {
        this.registerBasicTap(now);
        this.cancelPostRespawnDeathCamOnAction();
      }
    }
    this.heldKeys.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      this.lastTouchInputMs = performance.now();
      this.hasPointerMoved = false;
      this.touchControlsActive = true;
      return;
    }
    if (!this.isInteractivePhase()) return;
    if (e.target !== this.canvas) return;
    if (performance.now() - this.lastTouchInputMs < 800) return;
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
    this.hasPointerMoved = true;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      this.lastTouchInputMs = performance.now();
      this.hasPointerMoved = false;
      this.touchControlsActive = true;
      return;
    }
    if (!this.isInteractivePhase()) return;
    if (e.target !== this.canvas) return;
    if (e.pointerType !== 'touch' && performance.now() - this.lastTouchInputMs < 350) return;
    this.pointerClientX = e.clientX;
    this.pointerClientY = e.clientY;
    this.hasPointerMoved = true;
    if (e.button === 0) {
      this.mouseDown = true;
      this.registerBasicTap(performance.now());
      this.cancelPostRespawnDeathCamOnAction();
    } else if (e.button === 2) {
      this.bufferedAction = { type: 'r', expiresAt: performance.now() + 130 };
      this.cancelPostRespawnDeathCamOnAction();
    }
  };

  private cancelPostRespawnDeathCamOnAction() {
    if (this.deathCamPostRespawnTimer > 0) {
      const player = this.actors.find((a) => a.isPlayer);
      if (player?.alive) {
        this.deathCamPostRespawnTimer = 0;
        this.lastKillerId = null;
        this.activeDeathCam = null;
        this.activeDeathCamTargetId = null;
      }
    }
  }

  private registerBasicTap(nowMs: number) {
    this.lastDiscreteTapMs = nowMs;
    const player = this.actors.find((a) => a.isPlayer);
    if (player && player.alive && player.stunTimer <= 0) {
      const pendingBasic = this.bufferedAction?.type === 'basic' ? 1 : 0;
      if (player.attackLockout > 0 || player.dashTimer > 0 || pendingBasic > 0) {
        if (
          canQueueBasicComboTap({
            ammo: player.ammo,
            maxAmmo: player.maxAmmo,
            currentComboStep: player.comboStep,
            comboTapQueue: player.comboTapQueue,
            pendingBufferedBasic: pendingBasic,
          })
        ) {
          player.comboTapQueue += 1;
          player.comboWindowTimer = Math.max(
            player.comboWindowTimer,
            player.attackLockout + player.dashTimer + COMBO_TAP_WINDOW_SEC
          );
        }
        return;
      }
    }
    this.bufferedAction = { type: 'basic', expiresAt: nowMs + 380, isDiscrete: true };
  }

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  private onContextMenu = (e: MouseEvent) => {
    if (this.isInteractivePhase()) {
      e.preventDefault();
    }
  };

  private onWindowBlur = () => {
    this.clearInputs();
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.clearInputs();
    }
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => {
      this.syncCanvasSize();
    });
    this.resizeObserver.observe(this.canvas);
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private syncCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width || window.innerWidth));
    const h = Math.max(240, Math.round(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.viewWidth = w;
    this.viewHeight = h;
    this.cameraScale = computeViewportCameraScale(w, h);
    this.dpr = dpr;

    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.needsStaticRedraw = true;
    }
  }

  private screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    return {
      x: this.camX + (localX - this.viewWidth / 2) / this.cameraScale,
      y: this.camY + (localY - this.viewHeight / 2) / this.cameraScale,
    };
  }

  private autoAimTowardNearestEnemy(player: ActorState) {
    const cfg = HEROES[player.heroId];
    const maxAimDist = Math.max(cfg.attackRange * 1.25, 420);
    let bestDistSq = maxAimDist * maxAimDist;
    let bestTarget: ActorState | null = null;
    for (const other of this.actors) {
      if (!other.alive || other.id === player.id) continue;
      if (this.mode !== 'royale' && other.team === player.team) continue;
      if (!canObserverSeeTarget(player, other)) continue;
      const dSq = distanceSq(player.x, player.y, other.x, other.y);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestTarget = other;
      }
    }
    if (bestTarget) {
      player.aimAngle = Math.atan2(bestTarget.y - player.y, bestTarget.x - player.x);
    }
  }

  public setTouchControlsActive(active: boolean) {
    this.touchControlsActive = active;
    if (active) {
      this.hasPointerMoved = false;
    }
  }

  public setVirtualMove(dx: number, dy: number) {
    this.virtualMoveX = clamp(dx, -1, 1);
    this.virtualMoveY = clamp(dy, -1, 1);
    if (Math.hypot(dx, dy) > 0.04) {
      this.touchControlsActive = true;
      this.lastTouchInputMs = performance.now();
      this.hasPointerMoved = false;
    }
  }

  public setVirtualAim(dx: number, dy: number, firing: boolean) {
    const now = performance.now();
    this.touchControlsActive = true;
    this.lastTouchInputMs = now;
    this.hasPointerMoved = false;
    const mag = Math.hypot(dx, dy);
    if (mag > 0.14) {
      this.virtualAimActive = true;
      this.virtualAimAngle = Math.atan2(dy, dx);
      this.lastVirtualAimMs = now;
    } else {
      this.virtualAimActive = false;
    }
    this.virtualFireHeld = firing;
    if (firing) {
      this.cancelPostRespawnDeathCamOnAction();
    }
  }

  public triggerVirtualAttackTap() {
    if (!this.isInteractivePhase()) return;
    const now = performance.now();
    this.touchControlsActive = true;
    this.lastTouchInputMs = now;
    this.hasPointerMoved = false;
    const player = this.actors.find((a) => a.isPlayer);
    const recentlyManuallyAimed = this.virtualAimActive || now - this.lastVirtualAimMs < 900;
    if (player && player.alive && !recentlyManuallyAimed) {
      this.autoAimTowardNearestEnemy(player);
    }
    this.registerBasicTap(now);
    this.cancelPostRespawnDeathCamOnAction();
  }

  public triggerSkillFromUi(slot: 'basic' | 'q' | 'e' | 'r') {
    if (!this.isInteractivePhase()) return;
    const now = performance.now();
    if (this.touchControlsActive) {
      this.lastTouchInputMs = now;
      this.hasPointerMoved = false;
    }
    const player = this.actors.find((a) => a.isPlayer);
    const recentlyManuallyAimed = this.virtualAimActive || now - this.lastVirtualAimMs < 900;
    if (player && player.alive && !recentlyManuallyAimed && !this.hasPointerMoved) {
      this.autoAimTowardNearestEnemy(player);
    }
    if (slot === 'basic') {
      this.registerBasicTap(now);
    } else {
      this.bufferedAction = { type: slot, expiresAt: now + 150 };
    }
    this.cancelPostRespawnDeathCamOnAction();
  }

  private update(dt: number, nowMs: number) {
    // Visual effects always run smoothly even during hitstop
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    this.updateParticlesAndTexts(dt);

    if (this.phase === 'title') {
      const t = nowMs / 1000;
      this.camX = ARENA_CENTER + Math.cos(t * 0.22) * 320;
      this.camY = ARENA_CENTER + Math.sin(t * 0.17) * 230;
      for (const a of this.actors) {
        a.walkPhase += dt * 3;
        a.aimAngle += dt * 0.45;
      }
      return;
    }

    if (!this.isInteractivePhase()) {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.elapsedTime += dt;
    if (this.phase === 'playing' && this.mode !== 'royale') {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    }
    if (this.killStreakTimer > 0) {
      this.killStreakTimer = Math.max(0, this.killStreakTimer - dt);
      if (this.killStreakTimer === 0 && this.activeKillStreak) {
        this.activeKillStreak = null;
      }
    }

    if (this.pendingEnd) {
      this.endBeatTimer -= dt;
      if (this.endBeatTimer <= 0) {
        this.victory = this.pendingEnd.victory;
        if (this.victory) soundEngine.playVictory();
        else soundEngine.playDefeat();
        this.setPhase('gameover');
        return;
      }
    }

    // Update storm radius
    this.stormRadius =
      this.phase === 'training' ? MAX_STORM_RADIUS : computeStormRadius(this.elapsedTime, this.mode);
    if (this.phase === 'playing' && this.mode === 'royale') {
      this.stormTickTimer += dt;
      if (this.stormTickTimer >= 1.0) {
        this.stormTickTimer -= 1.0;
        for (const actor of this.actors) {
          if (actor.alive && isOutsideStorm(actor.x, actor.y, this.stormRadius)) {
            this.damageActor(actor, null, 280, false, '#a855f7');
          }
        }
      }
    }

    if (this.phase === 'playing') {
      if (this.mode === 'superstar') {
        this.updateSuperStar(dt);
      } else if (this.mode === 'tower') {
        this.updateTowers(dt);
      }
    }

    // Update crate flash
    for (const crate of this.crates) {
      if (crate.hitFlash > 0) {
        crate.hitFlash = Math.max(0, crate.hitFlash - dt);
      }
    }

    // Update actors
    const player = this.actors.find((a) => a.isPlayer);
    for (const actor of this.actors) {
      if (actor.activeEmote && nowMs >= actor.activeEmote.expiresAtMs) {
        actor.activeEmote = null;
      }
      this.updateActor(actor, dt, nowMs, player);
    }

    if (this.pendingBotEmotes.length > 0) {
      const remaining: Array<{ actorId: string; emoteId: EmoteId; triggerAtMs: number }> = [];
      for (const queued of this.pendingBotEmotes) {
        if (nowMs >= queued.triggerAtMs) {
          const target = this.actors.find((a) => a.id === queued.actorId && a.alive);
          if (target && !target.activeEmote) {
            target.activeEmote = {
              id: queued.emoteId,
              startedAtMs: nowMs,
              expiresAtMs: nowMs + EMOTE_BUBBLE_DURATION_MS,
            };
          }
        } else {
          remaining.push(queued);
        }
      }
      this.pendingBotEmotes = remaining;
    }

    if (this.deathCamPostRespawnTimer > 0) {
      this.deathCamPostRespawnTimer = Math.max(0, this.deathCamPostRespawnTimer - dt);
    }
    this.updateDeathCamState(player);

    this.updateProjectiles(dt);
    this.updateTelegraphs(dt);
    this.updatePickups(dt);

    // Camera follow Death Cam target (killer or nearest teammate) or player smoothly inside arena bounds
    const deathCamFocus =
      this.activeDeathCamTargetId
        ? this.actors.find((a) => a.id === this.activeDeathCamTargetId && a.alive)
        : undefined;
    const camFocus = deathCamFocus ?? player;
    if (camFocus) {
      const rawTargetX = camFocus.x + Math.cos(camFocus.aimAngle) * 44;
      const rawTargetY = camFocus.y + Math.sin(camFocus.aimAngle) * 44;
      const halfW = Math.min(ARENA_SIZE / 2, this.viewWidth / (2 * this.cameraScale));
      const halfH = Math.min(ARENA_SIZE / 2, this.viewHeight / (2 * this.cameraScale));
      const targetX = clamp(rawTargetX, halfW, ARENA_SIZE - halfW);
      const targetY = clamp(rawTargetY, halfH, ARENA_SIZE - halfH);
      const smooth = 1 - Math.exp(-8.5 * dt);
      this.camX += (targetX - this.camX) * smooth;
      this.camY += (targetY - this.camY) * smooth;
    }

    // Check match end conditions (skipped in Training Sandbox)
    if (this.phase === 'playing' && !this.pendingEnd) {
      const aliveCount = this.actors.filter((a) => a.alive).length;
      const playerAlive = player ? player.alive : false;
      const allyTower = this.towers.find((t) => t.team === 'ally');
      const enemyTower = this.towers.find((t) => t.team === 'enemy');
      const starCountdownDone =
        this.mode === 'superstar' && this.starCountdown !== null && this.starCountdown <= 0
          ? this.starLeader
          : null;
      const outcome = evaluateMatchEnd(
        this.mode,
        playerAlive,
        aliveCount,
        this.allyScore,
        this.enemyScore,
        this.targetScore,
        {
          starCountdownDone,
          allyTowerHp: allyTower ? allyTower.hp : 1,
          enemyTowerHp: enemyTower ? enemyTower.hp : 1,
          timeRemaining: this.timeRemaining,
        }
      );
      if (outcome.ended) {
        if (this.mode === 'royale') {
          this.playerPlacement = outcome.victory ? 1 : Math.max(2, aliveCount + 1);
        }
        if (outcome.victory && player) {
          this.spawnBurst(player.x, player.y, '#fbbf24', 34, 340, 7);
          this.spawnBurst(player.x, player.y, HEROES[player.heroId].accent, 24, 280, 6);
          this.spawnSlashArc(player.x, player.y, 0, 74, '#fbbf24', 3);
        }
        this.pendingEnd = outcome;
        this.endBeatTimer = outcome.victory ? 0.72 : 0.55;
      }
    }

    this.justPressed.clear();
    this.hudTimer += dt;
    if (this.hudTimer >= 0.14) {
      this.hudTimer = 0;
      this.emitHud();
    }
  }

  private updateSuperStar(dt: number) {
    this.starSpawnTimer -= dt;
    if (this.starSpawnTimer <= 0) {
      this.starSpawnTimer = 4.6;
      const activeStars = this.pickups.filter((p) => !p.collected && p.kind === 'star').length;
      if (activeStars < 6) {
        const ang = Math.random() * Math.PI * 2;
        this.pickups.push({
          id: `pk-${this.entitySeq++}`,
          kind: 'star',
          x: ARENA_CENTER + Math.cos(ang) * 14,
          y: ARENA_CENTER + Math.sin(ang) * 14,
          vx: Math.cos(ang) * 95,
          vy: Math.sin(ang) * 95,
          age: 0,
          collected: false,
        });
        this.spawnBurst(ARENA_CENTER, ARENA_CENTER, '#facc15', 10, 170, 5);
      }
    }

    let allyStars = 0;
    let enemyStars = 0;
    for (const a of this.actors) {
      if (!a.alive) continue;
      if (a.team === 'ally') allyStars += a.starsHeld;
      else if (a.team === 'enemy') enemyStars += a.starsHeld;
    }
    this.allyScore = allyStars;
    this.enemyScore = enemyStars;

    if (allyStars >= this.targetScore && allyStars > enemyStars) {
      if (this.starLeader !== 'ally') {
        this.starLeader = 'ally';
        this.starCountdown = 8.0;
      } else {
        this.starCountdown = Math.max(0, (this.starCountdown ?? 8.0) - dt);
      }
    } else if (enemyStars >= this.targetScore && enemyStars > allyStars) {
      if (this.starLeader !== 'enemy') {
        this.starLeader = 'enemy';
        this.starCountdown = 8.0;
      } else {
        this.starCountdown = Math.max(0, (this.starCountdown ?? 8.0) - dt);
      }
    } else {
      this.starLeader = null;
      this.starCountdown = null;
    }
  }

  private updateTowers(dt: number) {
    for (const tower of this.towers) {
      if (tower.destroyed) continue;
      tower.hitFlash = Math.max(0, tower.hitFlash - dt);
      tower.fireCooldown = Math.max(0, tower.fireCooldown - dt);

      let target: ActorState | null = null;
      let bestDist = 365;
      for (const actor of this.actors) {
        if (!actor.alive || actor.team === tower.team) continue;
        const d = distance(tower.x, tower.y, actor.x, actor.y);
        if (d <= bestDist) {
          bestDist = d;
          target = actor;
        }
      }

      if (target) {
        tower.aimAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
        if (tower.fireCooldown <= 0) {
          tower.fireCooldown = 0.85;
          const boltColor = tower.team === 'ally' ? '#38bdf8' : '#f43f5e';
          const muzzleDist = tower.radius + 12;
          this.projectiles.push({
            id: `proj-${this.entitySeq++}`,
            ownerId: tower.id,
            ownerTeam: tower.team,
            heroId: 'steelshot',
            x: tower.x + Math.cos(tower.aimAngle) * muzzleDist,
            y: tower.y + Math.sin(tower.aimAngle) * muzzleDist,
            vx: Math.cos(tower.aimAngle) * 960,
            vy: Math.sin(tower.aimAngle) * 960,
            radius: 9,
            damage: 410,
            maxDist: 420,
            traveled: 0,
            color: boltColor,
            piercing: false,
            hitIds: [],
            isSkill: false,
          });
          this.spawnBurst(
            tower.x + Math.cos(tower.aimAngle) * muzzleDist,
            tower.y + Math.sin(tower.aimAngle) * muzzleDist,
            boltColor,
            5,
            130,
            4
          );
        }
      }
    }
  }

  private damageTower(tower: TowerState, amount: number, attacker: ActorState | null) {
    if (tower.destroyed || amount <= 0) return;
    tower.hp = Math.max(0, tower.hp - amount);
    tower.hitFlash = 0.08;
    const hitColor = tower.team === 'ally' ? '#38bdf8' : '#f43f5e';
    this.spawnBurst(tower.x, tower.y, hitColor, 8, 175, 4.5);
    const dmgStyle = computeDamageNumberStyle(amount, false);
    this.spawnFloatText(
      tower.x,
      tower.y - 42,
      `-${Math.round(amount)}`,
      dmgStyle.isCrit ? '#fde047' : '#fbbf24',
      dmgStyle.scale,
      dmgStyle.durationSec,
      (Math.random() - 0.5) * 38,
      dmgStyle.isCrit
    );

    if (attacker) {
      attacker.furyCharge = Math.min(
        100,
        attacker.furyCharge + computeFuryGain({ baseGain: 8, isPlayer: attacker.isPlayer })
      );
      if (attacker.isPlayer) {
        this.playerDamageDealt += amount;
        soundEngine.playHit(false);
      }
    }

    if (tower.hp <= 0) {
      tower.destroyed = true;
      this.spawnBurst(tower.x, tower.y, '#fbbf24', 36, 360, 8);
      this.trauma = Math.min(1, this.trauma + 0.55);
      soundEngine.playKill();
    }
  }

  private updateParticlesAndTexts(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      const damp = Math.exp(-(p.drag ?? 5) * dt);
      p.vx *= damp;
      p.vy *= damp;
    }

    for (const f of this.floatTexts) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.x += f.vx * dt;
      f.vx *= Math.exp(-4.5 * dt);
      f.y += f.vy * dt;
      f.vy *= Math.exp(-2.6 * dt);
    }

    for (const s of this.slashArcs) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) s.active = false;
    }

    for (const r of this.skillRings) {
      if (!r.active) continue;
      r.life -= dt;
      if (r.life <= 0) r.active = false;
    }

    for (const g of this.dashGhosts) {
      if (!g.active) continue;
      g.life -= dt;
      if (g.life <= 0) g.active = false;
    }

    for (const d of this.groundDecals) {
      if (!d.active) continue;
      d.life -= dt;
      if (d.life <= 0) d.active = false;
    }

    for (const b of this.beams) {
      if (!b.active) continue;
      b.life -= dt;
      if (b.life <= 0) b.active = false;
    }
  }

  private updateActor(
    actor: ActorState,
    dt: number,
    nowMs: number,
    player: ActorState | undefined
  ) {
    // KO transition / Respawn in all 4v4 Team Modes
    if (!actor.alive) {
      if (actor.koTimer > 0) {
        actor.koTimer = Math.max(0, actor.koTimer - dt);
      }
      if (actor.isDummy) {
        actor.respawnTimer -= dt;
        if (actor.respawnTimer <= 0) {
          const cfgDummy = HEROES[actor.heroId];
          actor.x = actor.homeX ?? ARENA_CENTER + 120;
          actor.y = actor.homeY ?? ARENA_CENTER;
          actor.aimAngle = Math.PI;
          actor.maxHp = 6000;
          actor.hp = actor.maxHp;
          actor.ghostHp = actor.maxHp;
          actor.shield = 0;
          actor.alive = true;
          actor.stunTimer = 0;
          actor.slowTimer = 0;
          actor.burnTimer = 0;
          actor.dummyRegenTimer = 0;
          this.spawnSkillRing(
            actor.x,
            actor.y,
            10,
            48,
            0,
            cfgDummy.accent,
            '#34d399',
            'shockwave',
            0.25,
            3
          );
        }
        return;
      }
      if (this.mode !== 'royale') {
        actor.respawnTimer -= dt;
        if (actor.respawnTimer <= 0) {
          this.respawnBrawlActor(actor);
        }
      }
      return;
    }

    const cfg = HEROES[actor.heroId];
    actor.ghostHp += (actor.hp - actor.ghostHp) * Math.min(1, dt * 6.5);
    actor.hitFlash = Math.max(0, actor.hitFlash - dt);
    actor.attackLockout = Math.max(0, actor.attackLockout - dt);
    actor.qCooldown = Math.max(0, actor.qCooldown - dt);
    actor.eCooldown = Math.max(0, actor.eCooldown - dt);
    actor.stealthTimer = Math.max(0, actor.stealthTimer - dt);
    actor.speedBoostTimer = Math.max(0, actor.speedBoostTimer - dt);
    actor.eVfxTimer = Math.max(0, actor.eVfxTimer - dt);
    actor.slowTimer = Math.max(0, actor.slowTimer - dt);
    actor.stunTimer = Math.max(0, actor.stunTimer - dt);
    actor.revealedTimer = Math.max(0, actor.revealedTimer - dt);
    actor.attackSwingTimer = Math.max(0, actor.attackSwingTimer - dt);
    if (actor.visualLeapTimer && actor.visualLeapTimer > 0) {
      actor.visualLeapTimer = Math.max(0, actor.visualLeapTimer - dt);
    }
    if (actor.comboWindowTimer > 0) {
      actor.comboWindowTimer = Math.max(0, actor.comboWindowTimer - dt);
      if (actor.comboWindowTimer <= 0) {
        actor.comboStep = 0;
        actor.comboTapQueue = 0;
      }
    }

    // Passive fury regen (Training Lab grants fast practice for player; bots charge fairly in matches)
    const furyRate =
      this.phase === 'training' && actor.isPlayer
        ? 16
        : actor.isPlayer
        ? PASSIVE_FURY_RATE_PLAYER
        : PASSIVE_FURY_RATE_BOT;
    actor.furyCharge = Math.min(100, actor.furyCharge + dt * furyRate);

    if (actor.isDummy) {
      actor.dummyRegenTimer = Math.max(0, (actor.dummyRegenTimer ?? 0) - dt);
      if (actor.dummyRegenTimer <= 0 && actor.hp < actor.maxHp) {
        actor.hp = Math.min(actor.maxHp, actor.hp + 2400 * dt);
      }
    }

    // Burn damage over time
    if (actor.burnTimer > 0) {
      actor.burnTimer = Math.max(0, actor.burnTimer - dt);
      actor.burnTickTimer += dt;
      if (actor.burnTickTimer >= 0.45) {
        actor.burnTickTimer -= 0.45;
        this.damageActor(actor, null, 130, false, '#fb923c');
        if (!actor.alive) return;
      }
    }

    // Ammo reload
    if (actor.ammo < actor.maxAmmo) {
      actor.ammoReloadTimer += dt;
      if (actor.ammoReloadTimer >= cfg.ammoReloadTime) {
        actor.ammoReloadTimer = 0;
        actor.ammo += 1;
      }
    } else {
      actor.ammoReloadTimer = 0;
    }

    // Damping squash & stretch
    actor.squashX += (1 - actor.squashX) * Math.min(1, dt * 14);
    actor.squashY += (1 - actor.squashY) * Math.min(1, dt * 14);

    // Dash override movement
    if (actor.dashTimer > 0) {
      actor.dashTimer = Math.max(0, actor.dashTimer - dt);
      actor.x += actor.dashVx * dt;
      actor.y += actor.dashVy * dt;
      this.resolveActorCollisions(actor);

      // Per-hero dash ribbon / ghost / ember trail
      const vfx = getHeroSkillVfx(actor.heroId);
      const isEDash = Boolean(actor.activeDashStyle && vfx.e.dashStyle === actor.activeDashStyle);
      const dashColor = isEDash ? vfx.e.primaryColor : vfx.q.primaryColor;
      const dashSec = isEDash ? vfx.e.secondaryColor : vfx.q.secondaryColor;
      const dashStyle = actor.activeDashStyle ?? vfx.q.dashStyle ?? 'lightning_arc';

      if (Math.random() < 0.78) {
        this.spawnDashGhost(
          actor.x,
          actor.y,
          Math.atan2(actor.dashVy, actor.dashVx),
          cfg.radius,
          dashColor,
          dashSec,
          dashStyle,
          0.22
        );
      }
      if (Math.random() < 0.52) {
        this.spawnParticle(
          actor.x + (Math.random() - 0.5) * 18,
          actor.y + (Math.random() - 0.5) * 18,
          -actor.dashVx * 0.14 + (Math.random() - 0.5) * 45,
          -actor.dashVy * 0.14 + (Math.random() - 0.5) * 45,
          4.5,
          Math.random() > 0.45 ? dashColor : dashSec,
          0.28
        );
      }

      if (actor.dashDamage > 0) {
        for (const other of this.actors) {
          if (!other.alive || other.team === actor.team || actor.dashHitIds.includes(other.id)) {
            continue;
          }
          if (distance(actor.x, actor.y, other.x, other.y) <= cfg.radius + HEROES[other.heroId].radius + 26) {
            actor.dashHitIds.push(other.id);
            this.damageActor(other, actor, actor.dashDamage, true, dashColor);
            this.spawnSkillRing(other.x, other.y, 12, 54, actor.aimAngle, dashColor, dashSec, 'shockwave', 0.24, 3.5);
            if (
              actor.heroId === 'kong' ||
              actor.heroId === 'baston' ||
              actor.heroId === 'boulder' ||
              actor.heroId === 'titanx'
            ) {
              other.stunTimer = Math.max(other.stunTimer, 0.55);
              this.spawnFloatText(other.x, other.y - 16, 'ATORDOADO', '#fbbf24', 0.9);
            } else if (actor.heroId === 'raidon') {
              actor.ammo = Math.min(actor.maxAmmo, actor.ammo + 1);
              this.spawnFloatText(actor.x, actor.y - 34, '+1 MUNIÇÃO', '#22d3ee', 0.85);
            } else if (actor.heroId === 'eldragon') {
              actor.furyCharge = Math.min(
                100,
                actor.furyCharge + computeFuryGain({ baseGain: 7, isPlayer: actor.isPlayer })
              );
              other.burnTimer = Math.max(other.burnTimer, 1.0);
            } else if (actor.heroId === 'ryder') {
              other.slowTimer = Math.max(other.slowTimer, 1.3);
              this.spawnFloatText(other.x, other.y - 16, 'LENTIDÃO', '#ec4899', 0.85);
            } else if (actor.heroId === 'valkyria') {
              if (other.shield > 0) {
                other.shield = Math.max(0, other.shield - 350);
              }
              const healV = Math.round(actor.maxHp * 0.05);
              actor.hp = Math.min(actor.maxHp, actor.hp + healV);
            } else if (actor.heroId === 'meiro') {
              const healM = Math.round(actor.maxHp * 0.04);
              actor.hp = Math.min(actor.maxHp, actor.hp + healM);
            } else if (actor.heroId === 'kairo') {
              for (const chain of this.actors) {
                if (!chain.alive || chain.team === actor.team || chain.id === other.id) continue;
                if (distance(other.x, other.y, chain.x, chain.y) <= 135) {
                  this.damageActor(chain, actor, Math.round(actor.dashDamage * 0.45), false, '#2dd4bf', false, 0.5);
                  this.spawnBeam('lightning', other.x, other.y - 8, chain.x, chain.y - 8, '#2dd4bf', '#e0f2fe', 8, 0.24);
                  this.spawnDualBurst(chain.x, chain.y, '#2dd4bf', '#e0f2fe', 8, 150, 4);
                  break;
                }
              }
            } else if (actor.heroId === 'phoenix') {
              other.burnTimer = Math.max(other.burnTimer, 1.5);
            }
          }
        }
        for (const crate of this.crates) {
          if (crate.destroyed || actor.dashHitIds.includes(crate.id)) continue;
          if (distance(actor.x, actor.y, crate.x, crate.y) <= cfg.radius + 36) {
            actor.dashHitIds.push(crate.id);
            this.damageCrate(crate, actor.dashDamage, actor);
          }
        }
        for (const tower of this.towers) {
          if (tower.destroyed || tower.team === actor.team || actor.dashHitIds.includes(tower.id)) {
            continue;
          }
          if (distance(actor.x, actor.y, tower.x, tower.y) <= cfg.radius + tower.radius + 18) {
            actor.dashHitIds.push(tower.id);
            this.damageTower(tower, actor.dashDamage, actor);
          }
        }
      }

      if (actor.dashTimer <= 0) {
        actor.activeDashStyle = undefined;
      }
    } else if (actor.stunTimer <= 0) {
      actor.activeDashStyle = undefined;
      if (actor.isPlayer) {
        this.handlePlayerControls(actor, dt, nowMs);
      } else if (actor.isDummy) {
        this.handleDummyBehavior(actor, dt);
      } else {
        this.handleBotBehavior(actor, dt, player);
      }
    }

    // Bush check
    actor.inBush = isPointInAnyBush(actor.x, actor.y, this.map.bushes);
  }

  private handleDummyBehavior(actor: ActorState, dt: number) {
    if (actor.id !== 'dummy-moving') {
      actor.vx = 0;
      actor.vy = 0;
      actor.aimAngle = Math.PI;
      return;
    }
    const baseY = actor.homeY ?? ARENA_CENTER;
    const targetY = baseY + Math.sin(this.elapsedTime * 1.45) * 145;
    const dy = targetY - actor.y;
    const slowMult = actor.slowTimer > 0 ? 0.55 : 1;
    const step = clamp(dy * 4.5, -165 * slowMult, 165 * slowMult);
    actor.vy = step;
    actor.vx = 0;
    actor.y += step * dt;
    actor.walkPhase += Math.abs(step) * dt * 0.08;
    actor.aimAngle = Math.PI;
    this.resolveActorCollisions(actor);
  }

  private handlePlayerControls(actor: ActorState, dt: number, nowMs: number) {
    const cfg = HEROES[actor.heroId];

    let moveX = this.virtualMoveX;
    let moveY = this.virtualMoveY;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveY -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveY += 1;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;

    const useMouseAim = this.hasPointerMoved && !this.touchControlsActive && !this.virtualAimActive;
    const worldPtr = useMouseAim
      ? this.screenToWorld(this.pointerClientX, this.pointerClientY)
      : null;
    const mouseAimAngle = worldPtr
      ? Math.atan2(worldPtr.y - actor.y, worldPtr.x - actor.x)
      : actor.aimAngle;
    const manualAimHoldActive = this.virtualAimActive || nowMs - this.lastVirtualAimMs < 650;

    actor.aimAngle = resolvePlayerAimAngle({
      currentAimAngle: actor.aimAngle,
      virtualAimActive: this.virtualAimActive,
      virtualAimAngle: this.virtualAimAngle,
      manualAimHoldActive,
      useMouseAim,
      mouseAimAngle,
      moveX,
      moveY,
    });

    const len = Math.hypot(moveX, moveY);
    const mult =
      (actor.speedBoostTimer > 0 ? 1.35 : 1) * (actor.slowTimer > 0 ? 0.65 : 1);
    const maxSpd = cfg.speed * mult;
    let targetVx = 0;
    let targetVy = 0;

    if (len > 0.01) {
      const clampedLen = Math.min(1, len);
      const normX = moveX / len;
      const normY = moveY / len;
      targetVx = normX * clampedLen * maxSpd;
      targetVy = normY * clampedLen * maxSpd;
    }

    // Smooth responsive acceleration/deceleration (eliminates stiff stop/start snapping)
    const accelRate = len > 0.01 ? 22 : 20;
    const blend = Math.min(1, 1 - Math.exp(-accelRate * dt));
    actor.vx += (targetVx - actor.vx) * blend;
    actor.vy += (targetVy - actor.vy) * blend;

    const curSpd = Math.hypot(actor.vx, actor.vy);
    if (curSpd > 6) {
      const prevStep = Math.floor(actor.walkPhase / Math.PI);
      actor.x += actor.vx * dt;
      actor.y += actor.vy * dt;
      actor.walkPhase += (curSpd * dt) / 22;
      if (Math.floor(actor.walkPhase / Math.PI) !== prevStep && curSpd > 90 && !actor.inBush) {
        this.spawnBurst(actor.x, actor.y + 14, 'rgba(148, 163, 184, 0.45)', 2, 34);
      }
      this.resolveActorCollisions(actor);
    } else {
      actor.vx = 0;
      actor.vy = 0;
    }

    // Buffered / held attacks & skills
    const worldCursor =
      useMouseAim && worldPtr
        ? worldPtr
        : {
            x: actor.x + Math.cos(actor.aimAngle) * Math.max(220, cfg.attackRange * 0.72),
            y: actor.y + Math.sin(actor.aimAngle) * Math.max(220, cfg.attackRange * 0.72),
          };

    if (this.bufferedAction && nowMs <= this.bufferedAction.expiresAt) {
      const act = this.bufferedAction.type;
      if (act === 'q' && actor.qCooldown <= 0) {
        this.executeSkillQ(actor, worldCursor.x, worldCursor.y);
        this.bufferedAction = null;
        return;
      }
      if (act === 'e' && actor.eCooldown <= 0) {
        this.executeSkillE(actor, worldCursor.x, worldCursor.y);
        this.bufferedAction = null;
        return;
      }
      if (act === 'r' && actor.furyCharge >= 100) {
        this.executeSkillR(actor, worldCursor.x, worldCursor.y);
        this.bufferedAction = null;
        return;
      }
      if (act === 'basic' && actor.attackLockout <= 0 && actor.ammo > 0) {
        const isDiscrete = Boolean(this.bufferedAction.isDiscrete);
        this.bufferedAction = null;
        this.executeBasicAttack(actor, isDiscrete);
        return;
      }
    }

    if (actor.comboTapQueue > 0 && actor.attackLockout <= 0 && actor.ammo > 0) {
      actor.comboTapQueue -= 1;
      this.executeBasicAttack(actor, true);
      return;
    }

    if (
      (this.mouseDown || this.virtualFireHeld || this.heldKeys.has('Space')) &&
      actor.attackLockout <= 0 &&
      actor.ammo > 0 &&
      canPassiveHoldFireBasic({
        currentComboStep: actor.comboStep,
        comboWindowTimer: actor.comboWindowTimer,
        msSinceLastDiscreteTap: nowMs - this.lastDiscreteTapMs,
        virtualAimActive: this.virtualAimActive || this.virtualFireHeld,
      })
    ) {
      actor.comboTapQueue = 0;
      this.executeBasicAttack(actor, false, true);
    }
  }

  private handleBotBehavior(actor: ActorState, dt: number, player: ActorState | undefined) {
    const cfg = HEROES[actor.heroId];
    actor.aiThinkTimer -= dt;

    // Storm safety priority
    const distCenter = distance(actor.x, actor.y, ARENA_CENTER, ARENA_CENTER);
    const stormUnsafe = this.mode === 'royale' && distCenter > this.stormRadius - 130;

    // Pick closest visible enemy (grace period first 4.5s bots prioritize crates before hunting player)
    let targetEnemy: ActorState | null = null;
    let bestEnemyDist = Infinity;

    // Attack token pool: count how many bots currently target player
    let botsTargetingPlayer = 0;
    for (const other of this.actors) {
      if (!other.isPlayer && other.alive && other.aiTargetId === 'player') {
        botsTargetingPlayer++;
      }
    }

    for (const other of this.actors) {
      if (!other.alive || other.team === actor.team) continue;
      if (other.isPlayer && this.elapsedTime < 4.5) continue;
      if (other.isPlayer && actor.aiTargetId !== 'player' && botsTargetingPlayer >= 3) continue;
      if (!canObserverSeeTarget(actor, other)) continue;
      const d = distance(actor.x, actor.y, other.x, other.y);
      const effDist = this.mode === 'superstar' && other.starsHeld > 0 ? Math.max(0, d - 220) : d;
      if (effDist < bestEnemyDist) {
        bestEnemyDist = d;
        targetEnemy = other;
      }
    }
    actor.aiTargetId = targetEnemy ? targetEnemy.id : null;

    // Find nearest crate if no enemy close
    let targetCrate: Crate | null = null;
    let bestCrateDist = Infinity;
    for (const crate of this.crates) {
      if (crate.destroyed) continue;
      const d = distance(actor.x, actor.y, crate.x, crate.y);
      if (d < bestCrateDist) {
        bestCrateDist = d;
        targetCrate = crate;
      }
    }

    // Find nearby pickup (prioritize golden stars across wide range in Super Estrela)
    let targetPickup: Pickup | null = null;
    let bestPickupScore = this.mode === 'superstar' ? 920 : 280;
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      const d = distance(actor.x, actor.y, pk.x, pk.y);
      const score = pk.kind === 'star' ? d * 0.55 : d;
      if (d < (pk.kind === 'star' ? 920 : 280) && score < bestPickupScore) {
        bestPickupScore = score;
        targetPickup = pk;
      }
    }

    const enemyTower =
      this.mode === 'tower'
        ? this.towers.find((t) => !t.destroyed && t.team !== actor.team) || null
        : null;
    const enemyTowerDist = enemyTower
      ? distance(actor.x, actor.y, enemyTower.x, enemyTower.y)
      : Infinity;

    if (actor.aiThinkTimer <= 0) {
      actor.aiThinkTimer = 0.35 + Math.random() * 0.25;
      if (Math.random() < 0.35) actor.aiStrafeDir *= -1;
    }

    let desiredMoveX = 0;
    let desiredMoveY = 0;

    if (stormUnsafe) {
      const toCenterAngle = Math.atan2(ARENA_CENTER - actor.y, ARENA_CENTER - actor.x);
      desiredMoveX = Math.cos(toCenterAngle);
      desiredMoveY = Math.sin(toCenterAngle);
    } else if (targetPickup) {
      const a = Math.atan2(targetPickup.y - actor.y, targetPickup.x - actor.x);
      desiredMoveX = Math.cos(a);
      desiredMoveY = Math.sin(a);
    } else if (targetEnemy && bestEnemyDist < 680) {
      const angleToEnemy = Math.atan2(targetEnemy.y - actor.y, targetEnemy.x - actor.x);
      actor.aimAngle = angleToEnemy;

      // Distinct per-archetype movement policies
      if (cfg.archetype === 'kiter') {
        if (bestEnemyDist < 260) {
          desiredMoveX = -Math.cos(angleToEnemy);
          desiredMoveY = -Math.sin(angleToEnemy);
        } else if (bestEnemyDist > 450) {
          desiredMoveX = Math.cos(angleToEnemy);
          desiredMoveY = Math.sin(angleToEnemy);
        } else {
          desiredMoveX = Math.cos(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
          desiredMoveY = Math.sin(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
        }
      } else if (cfg.archetype === 'brawler') {
        if (bestEnemyDist > 125) {
          desiredMoveX = Math.cos(angleToEnemy);
          desiredMoveY = Math.sin(angleToEnemy);
        } else {
          desiredMoveX = Math.cos(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
          desiredMoveY = Math.sin(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
        }
      } else if (cfg.archetype === 'ambusher') {
        const hpRatio = actor.hp / actor.maxHp;
        if (hpRatio < 0.3 && actor.eCooldown <= 0) {
          this.executeSkillE(actor, targetEnemy.x, targetEnemy.y);
        }
        const flankOffset = bestEnemyDist < 210 ? (Math.PI / 2) * actor.aiStrafeDir : 0.4 * actor.aiStrafeDir;
        desiredMoveX = Math.cos(angleToEnemy + flankOffset);
        desiredMoveY = Math.sin(angleToEnemy + flankOffset);
      } else {
        if (bestEnemyDist < 220) {
          desiredMoveX = -Math.cos(angleToEnemy);
          desiredMoveY = -Math.sin(angleToEnemy);
        } else if (bestEnemyDist > 370) {
          desiredMoveX = Math.cos(angleToEnemy);
          desiredMoveY = Math.sin(angleToEnemy);
        } else {
          desiredMoveX = Math.cos(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
          desiredMoveY = Math.sin(angleToEnemy + (Math.PI / 2) * actor.aiStrafeDir);
        }
      }

      // Bot skill usage (bots respect opening lock and fair ultimate readiness)
      if (
        canBotCastUltimate({ elapsedTime: this.elapsedTime, furyCharge: actor.furyCharge }) &&
        bestEnemyDist < cfg.attackRange + 80
      ) {
        this.executeSkillR(actor, targetEnemy.x, targetEnemy.y);
      } else if (actor.qCooldown <= 0 && bestEnemyDist < cfg.attackRange + 60) {
        this.executeSkillQ(actor, targetEnemy.x, targetEnemy.y);
      } else if (
        actor.eCooldown <= 0 &&
        (((actor.heroId === 'kong' ||
          actor.heroId === 'meiro' ||
          actor.heroId === 'baston' ||
          actor.heroId === 'boulder' ||
          actor.heroId === 'titanx' ||
          actor.heroId === 'valkyria') &&
          actor.hp < actor.maxHp * 0.65) ||
          ((actor.heroId === 'veinka' ||
            actor.heroId === 'steelshot' ||
            actor.heroId === 'cluster' ||
            actor.heroId === 'velvet' ||
            actor.heroId === 'nina' ||
            actor.heroId === 'drake' ||
            actor.heroId === 'knox' ||
            actor.heroId === 'frost') &&
            bestEnemyDist < 200) ||
          ((actor.heroId === 'eldragon' ||
            actor.heroId === 'kairo' ||
            actor.heroId === 'ryder') &&
            bestEnemyDist < 320) ||
          ((actor.heroId === 'phoenix' ||
            actor.heroId === 'solara' ||
            actor.heroId === 'kronos') &&
            actor.hp < actor.maxHp * 0.55))
      ) {
        this.executeSkillE(actor, targetEnemy.x, targetEnemy.y);
      } else if (actor.attackLockout <= 0 && actor.ammo > 0 && bestEnemyDist <= cfg.attackRange * 0.96) {
        this.executeBasicAttack(actor);
      }
    } else if (enemyTower) {
      const a = Math.atan2(enemyTower.y - actor.y, enemyTower.x - actor.x);
      actor.aimAngle = a;
      const desiredStand = Math.max(110, cfg.attackRange * 0.78);
      if (enemyTowerDist > desiredStand) {
        desiredMoveX = Math.cos(a);
        desiredMoveY = Math.sin(a);
      } else {
        desiredMoveX = Math.cos(a + (Math.PI / 2) * actor.aiStrafeDir);
        desiredMoveY = Math.sin(a + (Math.PI / 2) * actor.aiStrafeDir);
      }
      if (
        canBotCastUltimate({ elapsedTime: this.elapsedTime, furyCharge: actor.furyCharge }) &&
        enemyTowerDist <= cfg.attackRange + 60
      ) {
        this.executeSkillR(actor, enemyTower.x, enemyTower.y);
      } else if (actor.qCooldown <= 0 && enemyTowerDist <= cfg.attackRange + 40) {
        this.executeSkillQ(actor, enemyTower.x, enemyTower.y);
      } else if (actor.attackLockout <= 0 && actor.ammo > 0 && enemyTowerDist <= cfg.attackRange + enemyTower.radius) {
        this.executeBasicAttack(actor);
      }
    } else if (targetCrate) {
      const a = Math.atan2(targetCrate.y - actor.y, targetCrate.x - actor.x);
      actor.aimAngle = a;
      if (bestCrateDist > cfg.attackRange * 0.72) {
        desiredMoveX = Math.cos(a);
        desiredMoveY = Math.sin(a);
      }
      if (actor.attackLockout <= 0 && actor.ammo > 0 && bestCrateDist <= cfg.attackRange) {
        this.executeBasicAttack(actor);
      }
    } else {
      const a = Math.atan2(ARENA_CENTER - actor.y, ARENA_CENTER - actor.x);
      actor.aimAngle = a;
      desiredMoveX = Math.cos(a);
      desiredMoveY = Math.sin(a);
    }

    const moveLen = Math.hypot(desiredMoveX, desiredMoveY);
    if (moveLen > 0.01) {
      const mult =
        (actor.speedBoostTimer > 0 ? 1.35 : 1) * (actor.slowTimer > 0 ? 0.65 : 1);
      const spd = cfg.speed * 0.92 * mult;
      actor.vx = (desiredMoveX / moveLen) * spd;
      actor.vy = (desiredMoveY / moveLen) * spd;
      actor.x += actor.vx * dt;
      actor.y += actor.vy * dt;
      actor.walkPhase += (spd * dt) / 22;
      this.resolveActorCollisions(actor);
    } else {
      actor.vx = 0;
      actor.vy = 0;
    }
  }

  private resolveActorCollisions(actor: ActorState) {
    const r = HEROES[actor.heroId].radius;
    actor.x = clamp(actor.x, r + 16, ARENA_SIZE - r - 16);
    actor.y = clamp(actor.y, r + 16, ARENA_SIZE - r - 16);

    for (const wall of this.map.walls) {
      const res = resolveCircleRectCollision(actor.x, actor.y, r, wall);
      actor.x = res.x;
      actor.y = res.y;
    }

    for (const crate of this.crates) {
      if (crate.destroyed) continue;
      const dx = actor.x - crate.x;
      const dy = actor.y - crate.y;
      const minDist = r + 24;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < minDist) {
        const push = minDist - d;
        actor.x += (dx / d) * push;
        actor.y += (dy / d) * push;
      }
    }

    for (const tower of this.towers) {
      if (tower.destroyed) continue;
      const dx = actor.x - tower.x;
      const dy = actor.y - tower.y;
      const minDist = r + tower.radius;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < minDist) {
        const push = minDist - d;
        actor.x += (dx / d) * push;
        actor.y += (dy / d) * push;
      }
    }
  }

  private executeBasicAttack(actor: ActorState, isDiscreteTap = false, allowHoldCombo = false) {
    const cfg = HEROES[actor.heroId];
    const combo = resolveBasicAttackCombo({
      ammo: actor.ammo,
      maxAmmo: actor.maxAmmo,
      currentComboStep: actor.comboStep,
      comboWindowTimer: actor.comboWindowTimer,
      isDiscreteTap,
      allowHoldCombo,
    });

    actor.ammo = Math.max(0, actor.ammo - 1);
    actor.comboStep = combo.nextComboStep;
    if (combo.isComboFinisher) {
      actor.comboTapQueue = 0;
    }
    actor.attackLockout = cfg.attackCooldown * combo.lockoutMultiplier;
    actor.comboWindowTimer =
      combo.nextComboWindowTimer > 0 ? actor.attackLockout + combo.nextComboWindowTimer : 0;

    actor.revealedTimer = Math.max(actor.revealedTimer, 1.1);
    actor.stealthTimer = 0;
    const baseSwing =
      actor.heroId === 'kong' ||
      actor.heroId === 'meiro' ||
      actor.heroId === 'baston' ||
      actor.heroId === 'boulder' ||
      actor.heroId === 'titanx'
        ? 0.32
        : 0.28;
    actor.attackSwingTimer = combo.isComboFinisher ? baseSwing + 0.08 : baseSwing;
    actor.squashX = combo.isComboFinisher ? 1.3 : combo.isComboAttack ? 1.24 : 1.18;
    actor.squashY = combo.isComboFinisher ? 0.74 : combo.isComboAttack ? 0.8 : 0.84;

    const baseAttackDamage = actor.isPlayer
      ? computeEvolvedHeroStats(actor.heroId, this.playerEvolutionLevel).attackDamage
      : cfg.attackDamage;
    const dmg = calculateDamage(baseAttackDamage, actor.powerCubes, combo.damageMultiplier);
    const comboStage = combo.nextComboStep >= 2 ? combo.nextComboStep : 1;
    const isHeavyHero =
      actor.heroId === 'kong' ||
      actor.heroId === 'meiro' ||
      actor.heroId === 'baston' ||
      actor.heroId === 'boulder' ||
      actor.heroId === 'titanx';

    if (actor.isPlayer) {
      if (combo.isComboAttack) {
        soundEngine.playComboShoot(
          combo.isComboFinisher ? 3 : 2,
          isHeavyHero ? 'heavy' : 'light'
        );
        this.spawnFloatText(
          actor.x,
          actor.y - 16,
          combo.isComboFinisher ? 'COMBO x3! +65%' : 'COMBO x2!',
          combo.isComboFinisher ? '#fde047' : '#fbbf24',
          combo.isComboFinisher ? 1.15 : 0.96
        );
        this.emitHud(true);
      } else {
        soundEngine.playShoot(isHeavyHero ? 'heavy' : 'light');
        if (combo.nextComboStep === 1) {
          this.emitHud(true);
        }
      }
    }

    const basicVfx = getHeroSkillVfx(actor.heroId).basic;

    if (
      actor.heroId === 'kong' ||
      actor.heroId === 'eldragon' ||
      actor.heroId === 'meiro' ||
      actor.heroId === 'baston' ||
      actor.heroId === 'kairo' ||
      actor.heroId === 'boulder' ||
      actor.heroId === 'valkyria'
    ) {
      // Melee shockwave arc cleave / bionic boxing / plasma katana / halberd combo
      const isDragon = actor.heroId === 'eldragon' || actor.heroId === 'kairo';
      const isMeiro = actor.heroId === 'meiro' || actor.heroId === 'valkyria';
      const rangeMult = combo.isComboFinisher ? 1.22 : combo.isComboAttack ? 1.1 : 1;
      const effRange = cfg.attackRange * rangeMult;
      const arcColor = combo.isComboFinisher
        ? '#fde047'
        : combo.isComboAttack
        ? '#fbbf24'
        : basicVfx.primaryColor;
      this.spawnSlashArc(
        actor.x,
        actor.y,
        actor.aimAngle,
        effRange,
        arcColor,
        comboStage,
        basicVfx.slashStyle,
        basicVfx.secondaryColor
      );
      this.spawnBurst(
        actor.x + Math.cos(actor.aimAngle) * (isDragon ? 48 : 68),
        actor.y + Math.sin(actor.aimAngle) * (isDragon ? 48 : 68),
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        combo.isComboFinisher ? 14 : isDragon ? 7 : 8,
        combo.isComboFinisher ? 240 : isDragon ? 170 : 190,
        combo.isComboFinisher ? 6.5 : 5
      );
      if (actor.isPlayer) {
        this.trauma = Math.min(
          1,
          this.trauma + (combo.isComboFinisher ? 0.24 : isDragon ? 0.1 : 0.14)
        );
      }

      // El Dragon quick forward boxing step
      if (actor.heroId === 'eldragon') {
        actor.x += Math.cos(actor.aimAngle) * 12;
        actor.y += Math.sin(actor.aimAngle) * 12;
        this.resolveActorCollisions(actor);
      }

      // Meiro 3rd combo hit fires an extended katana wind crescent projectile
      if (actor.heroId === 'meiro' && combo.isComboFinisher) {
        this.spawnProjectile(
          actor,
          actor.aimAngle,
          Math.round(dmg * 0.58),
          285,
          820,
          10,
          basicVfx.primaryColor,
          true,
          undefined,
          false,
          0.7,
          comboStage,
          'katana_crescent',
          basicVfx.secondaryColor
        );
      }
      // Kong 3rd combo hit unleashes a heavy frontal shockwave tremor
      if (actor.heroId === 'kong' && combo.isComboFinisher) {
        this.spawnSkillRing(
          actor.x + Math.cos(actor.aimAngle) * 55,
          actor.y + Math.sin(actor.aimAngle) * 55,
          16,
          105,
          actor.aimAngle,
          basicVfx.primaryColor,
          basicVfx.secondaryColor,
          'sonic_cone',
          0.26,
          4.5
        );
      }

      let kairoFirstHit: ActorState | null = null;
      for (const other of this.actors) {
        if (!other.alive || other.team === actor.team) continue;
        const d = distance(actor.x, actor.y, other.x, other.y);
        if (d <= effRange + HEROES[other.heroId].radius) {
          const ang = Math.atan2(other.y - actor.y, other.x - actor.x);
          const diff = Math.abs(
            Math.atan2(Math.sin(ang - actor.aimAngle), Math.cos(ang - actor.aimAngle))
          );
          if (diff <= (combo.isComboFinisher ? 1.22 : 1.05)) {
            let finalDmg = dmg;
            if (actor.heroId === 'valkyria' && other.shield > 0) {
              finalDmg = Math.round(dmg * 1.25);
            }
            this.damageActor(other, actor, finalDmg, combo.isComboFinisher, arcColor);
            if (actor.heroId === 'eldragon') {
              actor.furyCharge = Math.min(
                100,
                actor.furyCharge +
                  computeFuryGain({
                    baseGain: combo.isComboFinisher ? 8 : 5,
                    isPlayer: actor.isPlayer,
                  })
              );
            } else if (actor.heroId === 'baston' && combo.isComboFinisher) {
              other.stunTimer = Math.max(other.stunTimer, 0.28);
              this.spawnFloatText(other.x, other.y - 16, 'CHOQUE!', '#60a5fa', 0.85);
            } else if (actor.heroId === 'boulder' && combo.isComboFinisher) {
              other.burnTimer = Math.max(other.burnTimer, 0.9);
            } else if (actor.heroId === 'kairo' && !kairoFirstHit) {
              kairoFirstHit = other;
            }
            const baseKb =
              actor.heroId === 'boulder'
                ? 30
                : actor.heroId === 'kong'
                ? 26
                : actor.heroId === 'valkyria'
                ? 22
                : isDragon
                ? 12
                : 18;
            const kb = baseKb * (combo.isComboFinisher ? 1.55 : 1);
            other.x += Math.cos(ang) * kb;
            other.y += Math.sin(ang) * kb;
            this.resolveActorCollisions(other);
          }
        }
      }

      // Kairo 3rd combo hit chains lightning to nearest enemy within 140px
      if (actor.heroId === 'kairo' && combo.isComboFinisher && kairoFirstHit) {
        let closestChain: ActorState | null = null;
        let closestDist = 145;
        for (const cand of this.actors) {
          if (!cand.alive || cand.team === actor.team || cand.id === kairoFirstHit.id) continue;
          const dc = distance(kairoFirstHit.x, kairoFirstHit.y, cand.x, cand.y);
          if (dc <= closestDist) {
            closestDist = dc;
            closestChain = cand;
          }
        }
        if (closestChain) {
          this.damageActor(closestChain, actor, Math.round(dmg * 0.48), false, '#2dd4bf', false, 0.5);
          this.spawnBeam(
            'lightning',
            kairoFirstHit.x,
            kairoFirstHit.y - 8,
            closestChain.x,
            closestChain.y - 8,
            '#2dd4bf',
            '#e0f2fe',
            9,
            0.24
          );
          closestChain.slowTimer = Math.max(closestChain.slowTimer, 0.65);
          this.spawnDualBurst(closestChain.x, closestChain.y, '#2dd4bf', '#e0f2fe', 10, 170, 4.2);
          this.spawnFloatText(closestChain.x, closestChain.y - 18, 'RAIO EM CADEIA!', '#2dd4bf', 0.85);
        }
      }

      for (const crate of this.crates) {
        if (crate.destroyed) continue;
        const d = distance(actor.x, actor.y, crate.x, crate.y);
        if (d <= effRange + 26) {
          const ang = Math.atan2(crate.y - actor.y, crate.x - actor.x);
          const diff = Math.abs(
            Math.atan2(Math.sin(ang - actor.aimAngle), Math.cos(ang - actor.aimAngle))
          );
          if (diff <= 1.2) {
            this.damageCrate(crate, dmg, actor);
          }
        }
      }
      for (const tower of this.towers) {
        if (tower.destroyed || tower.team === actor.team) continue;
        const d = distance(actor.x, actor.y, tower.x, tower.y);
        if (d <= effRange + tower.radius + 12) {
          const ang = Math.atan2(tower.y - actor.y, tower.x - actor.x);
          const diff = Math.abs(
            Math.atan2(Math.sin(ang - actor.aimAngle), Math.cos(ang - actor.aimAngle))
          );
          if (diff <= 1.25) {
            this.damageTower(tower, dmg, actor);
          }
        }
      }
      return;
    }

    const speedMult = combo.isComboFinisher ? 1.22 : combo.isComboAttack ? 1.1 : 1;
    const radMult = combo.isComboFinisher ? 1.42 : combo.isComboAttack ? 1.2 : 1;
    const muzzleX = actor.x + Math.cos(actor.aimAngle) * (cfg.radius + 14);
    const muzzleY = actor.y + Math.sin(actor.aimAngle) * (cfg.radius + 14);
    if (combo.isComboAttack) {
      this.spawnBurst(
        muzzleX,
        muzzleY,
        combo.isComboFinisher ? '#fde047' : '#fbbf24',
        combo.isComboFinisher ? 12 : 6,
        combo.isComboFinisher ? 220 : 150,
        combo.isComboFinisher ? 5.5 : 4
      );
      if (actor.isPlayer && combo.isComboFinisher) {
        this.trauma = Math.min(1, this.trauma + 0.16);
      }
    }

    if (actor.heroId === 'raidon') {
      // Twin needle bolts (Finisher fires 3-bolt fan + extra fury on hit)
      const offsets = combo.isComboFinisher ? [-0.09, 0, 0.09] : [-0.07, 0.07];
      const perBolt = combo.isComboFinisher ? Math.round(dmg * 0.4) : Math.round(dmg * 0.56);
      for (let i = 0; i < offsets.length; i++) {
        const a = actor.aimAngle + offsets[i];
        this.spawnProjectile(
          actor,
          a,
          perBolt,
          cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
          cfg.projectileSpeed * speedMult,
          6 * radMult,
          combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
          combo.isComboFinisher && i === 1,
          undefined,
          false,
          undefined,
          comboStage,
          basicVfx.projectileShape,
          basicVfx.secondaryColor,
          { furyGainOnHit: 2, furyGainScale: combo.isComboFinisher ? 0.36 : 0.5 }
        );
      }
    } else if (actor.heroId === 'veinka') {
      // Long-range crossbow bolt deals +25% bonus damage at outer range
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
        cfg.projectileSpeed * speedMult,
        7 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        combo.isComboFinisher,
        undefined,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { maxRangeBonusPct: 0.25 }
      );
    } else if (actor.heroId === 'phoenix') {
      // Incandescent orb: AoE blast + burn DoT
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.08 : 1),
        cfg.projectileSpeed * speedMult,
        10 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        false,
        combo.isComboFinisher ? 116 : combo.isComboAttack ? 94 : 78,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { burnDuration: 1.5 }
      );
    } else if (actor.heroId === 'steelshot') {
      // Canhão 0A: heavy plasma cannon that shatters enemy shields
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.12 : 1),
        cfg.projectileSpeed * speedMult,
        8.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        combo.isComboFinisher,
        undefined,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { shieldBreak: 240 }
      );
    } else if (actor.heroId === 'cluster') {
      // Morteiro Rápido: explosive shell splits into 2 mini bomblets on impact
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
        cfg.projectileSpeed * speedMult,
        10.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        false,
        combo.isComboFinisher ? 128 : combo.isComboAttack ? 102 : 84,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { splitBomblets: 2 }
      );
    } else if (actor.heroId === 'velvet') {
      // Raio Estelar: astral lance with 18% cosmic lifesteal on hero hit
      if (combo.isComboFinisher) {
        const perBeam = Math.round(dmg * 0.54);
        for (const off of [-0.045, 0.045]) {
          this.spawnProjectile(
            actor,
            actor.aimAngle + off,
            perBeam,
            cfg.attackRange * 1.12,
            cfg.projectileSpeed * speedMult,
            8 * radMult,
            '#fde047',
            true,
            undefined,
            false,
            undefined,
            comboStage,
            basicVfx.projectileShape,
            basicVfx.secondaryColor,
            { lifestealPct: 0.18, furyGainScale: 0.55 }
          );
        }
      } else {
        this.spawnProjectile(
          actor,
          actor.aimAngle,
          dmg,
          cfg.attackRange,
          cfg.projectileSpeed * speedMult,
          7.5 * radMult,
          basicVfx.primaryColor,
          false,
          undefined,
          false,
          undefined,
          comboStage,
          basicVfx.projectileShape,
          basicVfx.secondaryColor,
          { lifestealPct: 0.18 }
        );
      }
    } else if (actor.heroId === 'nina') {
      // Submetralhadoras Neon: twin corrosive SMG darts applying venom DoT
      const offsets = combo.isComboFinisher ? [-0.08, 0, 0.08] : [-0.06, 0.06];
      const perBolt = combo.isComboFinisher ? Math.round(dmg * 0.42) : Math.round(dmg * 0.56);
      for (let i = 0; i < offsets.length; i++) {
        this.spawnProjectile(
          actor,
          actor.aimAngle + offsets[i],
          perBolt,
          cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
          cfg.projectileSpeed * speedMult,
          6.2 * radMult,
          combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
          combo.isComboFinisher && i === 1,
          undefined,
          false,
          undefined,
          comboStage,
          basicVfx.projectileShape,
          basicVfx.secondaryColor,
          { burnDuration: 0.9, furyGainScale: combo.isComboFinisher ? 0.36 : 0.5 }
        );
      }
    } else if (actor.heroId === 'drake') {
      // Rifle Fantasma: sniper slug deals +25% execute damage below 45% HP
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.12 : 1),
        cfg.projectileSpeed * speedMult,
        6.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        combo.isComboFinisher,
        undefined,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { executeBelowHpPct: 0.45 }
      );
    } else if (actor.heroId === 'knox') {
      // Canhão de Lava: AoE magma blast + intense burn
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.08 : 1),
        cfg.projectileSpeed * speedMult,
        10.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        false,
        combo.isComboFinisher ? 128 : combo.isComboAttack ? 102 : 84,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { burnDuration: 1.65 }
      );
    } else if (actor.heroId === 'ryder') {
      // Lâminas do Vazio: spinning void boomerangs applying mark slow
      const offsets = combo.isComboFinisher ? [-0.1, 0, 0.1] : [-0.08, 0.08];
      const perBolt = combo.isComboFinisher ? Math.round(dmg * 0.43) : Math.round(dmg * 0.55);
      for (let i = 0; i < offsets.length; i++) {
        this.spawnProjectile(
          actor,
          actor.aimAngle + offsets[i],
          perBolt,
          cfg.attackRange * (combo.isComboFinisher ? 1.12 : 1),
          cfg.projectileSpeed * speedMult,
          7 * radMult,
          combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
          combo.isComboFinisher && i === 1,
          undefined,
          false,
          0.5,
          comboStage,
          basicVfx.projectileShape,
          basicVfx.secondaryColor,
          { furyGainScale: combo.isComboFinisher ? 0.36 : 0.5 }
        );
      }
    } else if (actor.heroId === 'solara') {
      // Orbe Solar: radiant AoE blast + heals Solara on hero hit
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.08 : 1),
        cfg.projectileSpeed * speedMult,
        9.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        false,
        combo.isComboFinisher ? 115 : combo.isComboAttack ? 92 : 76,
        false,
        undefined,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { healOnHeroHit: 95 }
      );
    } else if (actor.heroId === 'kronos') {
      // Pulso Cronológico: time-warping AoE orb with slow + bonus fury charge
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.08 : 1),
        cfg.projectileSpeed * speedMult,
        9.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        false,
        combo.isComboFinisher ? 112 : combo.isComboAttack ? 90 : 72,
        false,
        0.65,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor,
        { furyGainOnHit: 3 }
      );
    } else if (actor.heroId === 'frost') {
      // Lança Glacial: piercing cryo shard on finisher + reliable chill slow
      this.spawnProjectile(
        actor,
        actor.aimAngle,
        dmg,
        cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
        cfg.projectileSpeed * speedMult,
        7.5 * radMult,
        combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
        combo.isComboFinisher,
        undefined,
        false,
        combo.isComboFinisher ? 1.15 : 0.75,
        comboStage,
        basicVfx.projectileShape,
        basicVfx.secondaryColor
      );
    } else if (actor.heroId === 'titanx') {
      // Metralhadora Plasma: twin mecha rockets with mini-splash explosion
      const offsets = combo.isComboFinisher ? [-0.09, 0, 0.09] : [-0.07, 0.07];
      const perBolt = combo.isComboFinisher ? Math.round(dmg * 0.42) : Math.round(dmg * 0.55);
      for (const off of offsets) {
        this.spawnProjectile(
          actor,
          actor.aimAngle + off,
          perBolt,
          cfg.attackRange * (combo.isComboFinisher ? 1.1 : 1),
          cfg.projectileSpeed * speedMult,
          8 * radMult,
          combo.isComboFinisher ? '#fde047' : basicVfx.primaryColor,
          false,
          combo.isComboFinisher ? 72 : 52,
          false,
          undefined,
          comboStage,
          basicVfx.projectileShape,
          basicVfx.secondaryColor,
          { furyGainScale: combo.isComboFinisher ? 0.36 : 0.5 }
        );
      }
    }
  }

  private executeSkillQ(actor: ActorState, targetX: number, targetY: number) {
    const cfg = HEROES[actor.heroId];
    const qVfx = getHeroSkillVfx(actor.heroId).q;
    actor.qCooldown = cfg.skills.q.cooldown;
    actor.revealedTimer = Math.max(actor.revealedTimer, 1.0);
    actor.stealthTimer = 0;
    if (actor.isPlayer) soundEngine.playSkill();

    const aim = Math.atan2(targetY - actor.y, targetX - actor.x);
    actor.aimAngle = aim;

    // Cast shockwave / rune / cone ring tailored to each hero's Q
    this.spawnSkillRing(
      actor.x,
      actor.y,
      14,
      78,
      aim,
      qVfx.primaryColor,
      qVfx.secondaryColor,
      qVfx.castRingStyle,
      0.32,
      4.5
    );

    if (actor.heroId === 'raidon') {
      // Corte Relâmpago (Dash + slash)
      actor.dashTimer = 0.22;
      actor.dashVx = Math.cos(aim) * 980;
      actor.dashVy = Math.sin(aim) * 980;
      actor.dashDamage = calculateDamage(720, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = qVfx.dashStyle;
      actor.squashX = 1.32;
      actor.squashY = 0.72;
      this.spawnSlashArc(actor.x, actor.y, aim, 92, qVfx.primaryColor, 3);
      this.spawnDualBurst(actor.x, actor.y, qVfx.primaryColor, qVfx.secondaryColor, 14, 240, 4.5);
    } else if (actor.heroId === 'veinka') {
      // Tiro Perfurante
      const dmg = calculateDamage(980, actor.powerCubes);
      this.spawnProjectile(
        actor,
        aim,
        dmg,
        720,
        1380,
        11,
        qVfx.primaryColor,
        true,
        undefined,
        true,
        undefined,
        undefined,
        qVfx.projectileShape,
        qVfx.secondaryColor
      );
      this.spawnBeam(
        'laser',
        actor.x + Math.cos(aim) * 22,
        actor.y + Math.sin(aim) * 22,
        actor.x + Math.cos(aim) * 320,
        actor.y + Math.sin(aim) * 320,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        9,
        0.22
      );
      this.spawnSparks(actor.x + Math.cos(aim) * 22, actor.y + Math.sin(aim) * 22, {
        impactAngle: aim,
        count: 10,
        minSpeed: 220,
        maxSpeed: 380,
        spreadRad: 0.7,
        colors: [qVfx.primaryColor, qVfx.secondaryColor, '#ffffff'],
        baseSize: 3.2,
      });
      this.spawnDualBurst(
        actor.x + Math.cos(aim) * 24,
        actor.y + Math.sin(aim) * 24,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        10,
        180,
        4
      );
      actor.squashX = 0.85;
      actor.squashY = 1.18;
    } else if (actor.heroId === 'kong') {
      // Investida Blindada
      actor.dashTimer = 0.28;
      actor.dashVx = Math.cos(aim) * 760;
      actor.dashVy = Math.sin(aim) * 760;
      actor.dashDamage = calculateDamage(820, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = qVfx.dashStyle;
      actor.squashX = 1.28;
      actor.squashY = 0.78;
      this.spawnDualBurst(actor.x, actor.y, qVfx.primaryColor, qVfx.secondaryColor, 14, 230, 5.5);
    } else if (actor.heroId === 'phoenix') {
      // Anel de Fogo at cursor clamped to 340
      const dist = Math.min(340, distance(actor.x, actor.y, targetX, targetY));
      const zx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const zy = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: qVfx.zoneVariant,
        kind: 'fire_ring',
        x: zx,
        y: zy,
        radius: 145,
        elapsed: 0,
        duration: 3.0,
        damage: calculateDamage(210, actor.powerCubes),
        furyGainScale: 0.25,
        triggered: false,
        tickTimer: 0,
      });
      this.spawnSkillRing(zx, zy, 24, 152, 0, qVfx.primaryColor, qVfx.secondaryColor, 'flame_crown', 0.44, 4.8);
      this.spawnDualBurst(zx, zy, qVfx.primaryColor, qVfx.secondaryColor, 16, 220, 5);
    } else if (actor.heroId === 'steelshot') {
      // Granada de Pulso (AoE EMP shield-breaker + slow projectile)
      const dmg = calculateDamage(760, actor.powerCubes);
      this.spawnProjectile(
        actor,
        aim,
        dmg,
        480,
        860,
        11,
        qVfx.primaryColor,
        false,
        118,
        true,
        1.5,
        undefined,
        qVfx.projectileShape,
        qVfx.secondaryColor,
        { shieldBreak: 480 }
      );
      this.spawnSparks(actor.x + Math.cos(aim) * 24, actor.y + Math.sin(aim) * 24, {
        impactAngle: aim,
        count: 10,
        minSpeed: 200,
        maxSpeed: 360,
        spreadRad: 0.85,
        colors: [qVfx.primaryColor, qVfx.secondaryColor, '#ffffff'],
        baseSize: 3.4,
      });
      this.spawnDualBurst(
        actor.x + Math.cos(aim) * 24,
        actor.y + Math.sin(aim) * 24,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        10,
        190,
        4.5
      );
      actor.squashX = 0.86;
      actor.squashY = 1.16;
    } else if (actor.heroId === 'eldragon') {
      // Gancho Relâmpago (high-speed boxing uppercut dash)
      actor.dashTimer = 0.2;
      actor.dashVx = Math.cos(aim) * 1040;
      actor.dashVy = Math.sin(aim) * 1040;
      actor.dashDamage = calculateDamage(780, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = qVfx.dashStyle;
      actor.squashX = 1.3;
      actor.squashY = 0.74;
      this.spawnSlashArc(actor.x, actor.y, aim, 86, qVfx.primaryColor, 3, 'dragon_claw', qVfx.secondaryColor);
      this.spawnDualBurst(actor.x, actor.y, qVfx.primaryColor, qVfx.secondaryColor, 14, 240, 5);
    } else if (actor.heroId === 'cluster') {
      // Mina Sísmica (places high-damage stun trap mine ahead)
      const dist = Math.min(230, distance(actor.x, actor.y, targetX, targetY));
      const mx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const my = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: qVfx.zoneVariant,
        kind: 'trap',
        x: mx,
        y: my,
        radius: 68,
        elapsed: 0,
        duration: 7.5,
        damage: calculateDamage(860, actor.powerCubes),
        stunDuration: 1.05,
        triggered: false,
      });
      this.spawnSkillRing(mx, my, 12, 68, 0, qVfx.primaryColor, qVfx.secondaryColor, 'shockwave', 0.34, 3.8);
      this.spawnDualBurst(mx, my, qVfx.primaryColor, qVfx.secondaryColor, 12, 165, 4.5);
    } else if (actor.heroId === 'velvet') {
      // Prisma Congelante (piercing + slow + astral lifesteal beam)
      const dmg = calculateDamage(940, actor.powerCubes);
      this.spawnProjectile(
        actor,
        aim,
        dmg,
        680,
        1340,
        12,
        qVfx.primaryColor,
        true,
        undefined,
        true,
        1.8,
        undefined,
        qVfx.projectileShape,
        qVfx.secondaryColor,
        { lifestealPct: 0.25 }
      );
      this.spawnBeam(
        'laser',
        actor.x + Math.cos(aim) * 22,
        actor.y + Math.sin(aim) * 22,
        actor.x + Math.cos(aim) * 340,
        actor.y + Math.sin(aim) * 340,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        10,
        0.24
      );
      this.spawnDualBurst(
        actor.x + Math.cos(aim) * 24,
        actor.y + Math.sin(aim) * 24,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        12,
        195,
        4.5
      );
      actor.squashX = 0.85;
      actor.squashY = 1.18;
    } else if (actor.heroId === 'meiro' || actor.heroId === 'valkyria' || actor.heroId === 'ryder' || actor.heroId === 'kairo') {
      // Pierce dash (katana / halberd / void / voltaic)
      actor.dashTimer = 0.22;
      actor.dashVx = Math.cos(aim) * 990;
      actor.dashVy = Math.sin(aim) * 990;
      actor.dashDamage = calculateDamage(860, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = qVfx.dashStyle;
      actor.squashX = 1.34;
      actor.squashY = 0.72;
      this.spawnSlashArc(
        actor.x,
        actor.y,
        aim,
        94,
        qVfx.primaryColor,
        3,
        getHeroSkillVfx(actor.heroId).basic.slashStyle,
        qVfx.secondaryColor
      );
      this.spawnSparks(actor.x, actor.y, {
        impactAngle: aim + Math.PI,
        count: 10,
        minSpeed: 180,
        maxSpeed: 320,
        spreadRad: 1.1,
        colors: [qVfx.primaryColor, qVfx.secondaryColor, '#ffffff'],
        baseSize: 3.3,
      });
      this.spawnDualBurst(actor.x, actor.y, qVfx.primaryColor, qVfx.secondaryColor, 16, 250, 5);
    } else if (actor.heroId === 'baston' || actor.heroId === 'boulder' || actor.heroId === 'titanx') {
      // Heavy stun shield/boulder/thruster charge
      actor.dashTimer = 0.26;
      actor.dashVx = Math.cos(aim) * 780;
      actor.dashVy = Math.sin(aim) * 780;
      actor.dashDamage = calculateDamage(810, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = qVfx.dashStyle;
      actor.squashX = 1.28;
      actor.squashY = 0.78;
      this.spawnDualBurst(actor.x, actor.y, qVfx.primaryColor, qVfx.secondaryColor, 15, 230, 5.2);
    } else if (actor.heroId === 'nina' || actor.heroId === 'drake' || actor.heroId === 'frost' || actor.heroId === 'kronos') {
      // Unique long-range piercing skill shots
      const dmg = calculateDamage(actor.heroId === 'drake' ? 990 : 910, actor.powerCubes);
      const extraProps: Partial<Projectile> = {};
      if (actor.heroId === 'nina') {
        extraProps.burnDuration = 1.85;
      } else if (actor.heroId === 'drake') {
        extraProps.revealDuration = 3.2;
        extraProps.executeBelowHpPct = 0.5;
      } else if (actor.heroId === 'kronos') {
        actor.eCooldown = Math.max(0, actor.eCooldown - 1.5);
        this.spawnFloatText(actor.x, actor.y - 34, '-1.5s E', '#c084fc', 0.85);
      }
      this.spawnProjectile(
        actor,
        aim,
        dmg,
        actor.heroId === 'drake' ? 760 : 700,
        actor.heroId === 'drake' ? 1420 : 1340,
        12,
        qVfx.primaryColor,
        true,
        undefined,
        true,
        actor.heroId === 'frost' ? 2.2 : actor.heroId === 'kronos' ? 2.0 : actor.heroId === 'drake' ? 0.6 : 1.5,
        undefined,
        qVfx.projectileShape,
        qVfx.secondaryColor,
        extraProps
      );
      if (actor.heroId === 'drake' || actor.heroId === 'frost' || actor.heroId === 'kronos') {
        this.spawnBeam(
          'laser',
          actor.x + Math.cos(aim) * 22,
          actor.y + Math.sin(aim) * 22,
          actor.x + Math.cos(aim) * (actor.heroId === 'drake' ? 420 : 320),
          actor.y + Math.sin(aim) * (actor.heroId === 'drake' ? 420 : 320),
          qVfx.primaryColor,
          qVfx.secondaryColor,
          actor.heroId === 'drake' ? 8 : 10,
          0.24
        );
      }
      this.spawnSparks(actor.x + Math.cos(aim) * 24, actor.y + Math.sin(aim) * 24, {
        impactAngle: aim,
        count: 10,
        minSpeed: 210,
        maxSpeed: 370,
        spreadRad: 0.75,
        colors: [qVfx.primaryColor, qVfx.secondaryColor, '#ffffff'],
        baseSize: 3.3,
      });
      this.spawnDualBurst(
        actor.x + Math.cos(aim) * 24,
        actor.y + Math.sin(aim) * 24,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        12,
        195,
        4.2
      );
      actor.squashX = 0.85;
      actor.squashY = 1.18;
    } else if (actor.heroId === 'knox') {
      // Mina de Pólvora (incendiary trap + burn)
      const dist = Math.min(230, distance(actor.x, actor.y, targetX, targetY));
      const mx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const my = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: qVfx.zoneVariant,
        kind: 'trap',
        x: mx,
        y: my,
        radius: 68,
        elapsed: 0,
        duration: 7.5,
        damage: calculateDamage(840, actor.powerCubes),
        stunDuration: 0.9,
        burnDuration: 1.9,
        triggered: false,
      });
      this.spawnSkillRing(mx, my, 12, 72, 0, qVfx.primaryColor, qVfx.secondaryColor, 'starburst', 0.36, 4);
      this.spawnDualBurst(mx, my, qVfx.primaryColor, qVfx.secondaryColor, 14, 175, 4.8);
    } else if (actor.heroId === 'solara') {
      // Santuário Ardente (damages enemies AND heals Solara & allies inside!)
      const dist = Math.min(340, distance(actor.x, actor.y, targetX, targetY));
      const zx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const zy = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: qVfx.zoneVariant,
        kind: 'fire_ring',
        x: zx,
        y: zy,
        radius: 150,
        elapsed: 0,
        duration: 3.2,
        damage: calculateDamage(215, actor.powerCubes),
        healZoneAmount: 115,
        furyGainScale: 0.25,
        triggered: false,
        tickTimer: 0,
      });
      this.spawnSkillRing(zx, zy, 20, 154, 0, qVfx.primaryColor, qVfx.secondaryColor, 'rune_circle', 0.44, 4.5);
      this.spawnDualBurst(zx, zy, qVfx.primaryColor, qVfx.secondaryColor, 16, 210, 4.8);
    }
  }

  private executeSkillE(actor: ActorState, targetX: number, targetY: number) {
    const cfg = HEROES[actor.heroId];
    const eVfx = getHeroSkillVfx(actor.heroId).e;
    actor.eCooldown = cfg.skills.e.cooldown;
    if (actor.isPlayer) soundEngine.playSkill();

    const aim = Math.atan2(targetY - actor.y, targetX - actor.x);

    // Hero-specific cast aura ring on every E activation
    this.spawnSkillRing(
      actor.x,
      actor.y,
      16,
      86,
      aim,
      eVfx.primaryColor,
      eVfx.secondaryColor,
      eVfx.castRingStyle,
      0.38,
      4.5
    );

    if (actor.heroId === 'raidon') {
      // Manto Sombrio (stealth + speed + smoke ring slowing nearby enemies)
      actor.stealthTimer = 2.6;
      actor.speedBoostTimer = 2.6;
      actor.eVfxTimer = 2.6;
      actor.revealedTimer = 0;
      for (const other of this.actors) {
        if (!other.alive || other.team === actor.team) continue;
        if (distance(actor.x, actor.y, other.x, other.y) <= 135) {
          other.slowTimer = Math.max(other.slowTimer, 1.3);
        }
      }
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 175, 5.5);
      this.spawnFloatText(actor.x, actor.y, 'FURTIVO', eVfx.primaryColor, 0.9);
    } else if (actor.heroId === 'veinka') {
      // Salto & Armadilha (dash away from aim, drop trap)
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: eVfx.zoneVariant,
        kind: 'trap',
        x: actor.x,
        y: actor.y,
        radius: 56,
        elapsed: 0,
        duration: 6.0,
        damage: calculateDamage(540, actor.powerCubes),
        stunDuration: 1.0,
        triggered: false,
      });
      actor.dashTimer = 0.2;
      actor.dashVx = -Math.cos(aim) * 860;
      actor.dashVy = -Math.sin(aim) * 860;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      actor.eVfxTimer = 0.65;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 14, 185, 4.5);
    } else if (actor.heroId === 'kong') {
      // Escudo Titânico + Rugido sísmico que repele inimigos próximos
      actor.shield = Math.min(2000, actor.shield + 1200);
      const healAmt = Math.round(actor.maxHp * 0.12);
      actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
      actor.eVfxTimer = 2.4;
      for (const other of this.actors) {
        if (!other.alive || other.team === actor.team) continue;
        const d = distance(actor.x, actor.y, other.x, other.y);
        if (d <= 155) {
          const pushAng = Math.atan2(other.y - actor.y, other.x - actor.x);
          this.damageActor(other, actor, calculateDamage(320, actor.powerCubes), false, eVfx.primaryColor);
          other.x += Math.cos(pushAng) * 44;
          other.y += Math.sin(pushAng) * 44;
          this.resolveActorCollisions(other);
        }
      }
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 18, 210, 5.5);
      this.spawnFloatText(actor.x, actor.y, 'RUGIDO TITÂNICO!', eVfx.primaryColor, 0.95);
    } else if (actor.heroId === 'phoenix') {
      // Asas da Fênix
      actor.dashTimer = 0.24;
      actor.dashVx = Math.cos(aim) * 880;
      actor.dashVy = Math.sin(aim) * 880;
      actor.dashDamage = calculateDamage(420, actor.powerCubes);
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      actor.eVfxTimer = 0.95;
      const healAmt = Math.round(actor.maxHp * 0.14);
      actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
      this.spawnFloatText(actor.x, actor.y, `+${healAmt}`, '#34d399', 0.95);
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 18, 230, 6);
    } else if (actor.heroId === 'steelshot') {
      // Propulsor Tático (reverse jump + shield + instant +1 ammo reload)
      actor.shield = Math.min(1600, actor.shield + 750);
      actor.ammo = Math.min(actor.maxAmmo, actor.ammo + 1);
      actor.dashTimer = 0.19;
      actor.dashVx = -Math.cos(aim) * 860;
      actor.dashVy = -Math.sin(aim) * 860;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      actor.eVfxTimer = 1.6;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 200, 5);
      this.spawnFloatText(actor.x, actor.y, '+ESCUDO & +1 MUNIÇÃO', eVfx.primaryColor, 0.92);
    } else if (actor.heroId === 'eldragon') {
      // Guarda Flamejante (shield + speed + scorching flame aura burst)
      actor.shield = Math.min(1600, actor.shield + 650);
      actor.speedBoostTimer = 2.5;
      actor.eVfxTimer = 2.5;
      for (const other of this.actors) {
        if (!other.alive || other.team === actor.team) continue;
        if (distance(actor.x, actor.y, other.x, other.y) <= 135) {
          this.damageActor(other, actor, calculateDamage(360, actor.powerCubes), false, eVfx.primaryColor);
          other.burnTimer = Math.max(other.burnTimer, 1.4);
        }
      }
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 18, 210, 5.2);
      this.spawnFloatText(actor.x, actor.y, 'GUARDA ÍGNEA!', eVfx.primaryColor, 0.95);
    } else if (actor.heroId === 'cluster') {
      // Salto Explosivo (detonates blast at launch spot + reverse recoil jump + shield)
      this.triggerAoeExplosion(
        actor.x,
        actor.y,
        128,
        calculateDamage(420, actor.powerCubes),
        actor.id,
        actor.team,
        eVfx.primaryColor
      );
      actor.shield = Math.min(1600, actor.shield + 600);
      actor.speedBoostTimer = 2.0;
      actor.eVfxTimer = 2.0;
      actor.dashTimer = 0.19;
      actor.dashVx = -Math.cos(aim) * 840;
      actor.dashVy = -Math.sin(aim) * 840;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 220, 5);
      this.spawnFloatText(actor.x, actor.y, 'PROPULSOR!', eVfx.primaryColor, 0.92);
    } else if (actor.heroId === 'velvet') {
      // Teleporte Cósmico (fast forward blink dash + speed boost)
      actor.speedBoostTimer = 1.8;
      actor.eVfxTimer = 1.8;
      actor.dashTimer = 0.16;
      actor.dashVx = Math.cos(aim) * 1200;
      actor.dashVy = Math.sin(aim) * 1200;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 18, 240, 5);
      this.spawnFloatText(actor.x, actor.y, 'SALTO ASTRAL!', '#e879f9', 0.92);
    } else if (actor.heroId === 'meiro' || actor.heroId === 'baston' || actor.heroId === 'boulder' || actor.heroId === 'titanx' || actor.heroId === 'valkyria' || actor.heroId === 'solara') {
      // Differentiated tank/paladin E kits
      const shieldBonus =
        actor.heroId === 'titanx' ? 1350 : actor.heroId === 'boulder' ? 1250 : actor.heroId === 'solara' ? 750 : 1050;
      actor.shield = Math.min(2200, actor.shield + shieldBonus);
      const healAmt = Math.round(actor.maxHp * (actor.heroId === 'solara' ? 0.16 : 0.12));
      actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
      actor.speedBoostTimer = 2.2;
      actor.eVfxTimer = 2.4;

      if (actor.heroId === 'boulder') {
        actor.slowTimer = 0;
        actor.burnTimer = 0;
        actor.stunTimer = 0;
        this.spawnFloatText(actor.x, actor.y, 'IMUNE & ESCUDO!', eVfx.primaryColor, 0.95);
      } else if (actor.heroId === 'baston') {
        for (const ally of this.actors) {
          if (!ally.alive || ally.id === actor.id || ally.team !== actor.team) continue;
          if (distance(actor.x, actor.y, ally.x, ally.y) <= 240) {
            ally.shield = Math.min(1800, ally.shield + 650);
            this.spawnFloatText(ally.x, ally.y - 20, '+650 ESCUDO', '#60a5fa', 0.85);
          }
        }
        this.spawnFloatText(actor.x, actor.y, 'DOMO DE EQUIPE!', eVfx.primaryColor, 0.95);
      } else if (actor.heroId === 'solara') {
        for (const ally of this.actors) {
          if (!ally.alive || ally.id === actor.id || ally.team !== actor.team) continue;
          if (distance(actor.x, actor.y, ally.x, ally.y) <= 240) {
            const allyHeal = Math.round(ally.maxHp * 0.12);
            ally.hp = Math.min(ally.maxHp, ally.hp + allyHeal);
            this.spawnFloatText(ally.x, ally.y - 20, `+${allyHeal}`, '#34d399', 0.85);
          }
        }
        this.spawnFloatText(actor.x, actor.y, 'BÊNÇÃO SOLAR!', eVfx.primaryColor, 0.95);
      } else if (actor.heroId === 'valkyria') {
        for (const other of this.actors) {
          if (!other.alive || other.team === actor.team) continue;
          if (distance(actor.x, actor.y, other.x, other.y) <= 270) {
            other.revealedTimer = Math.max(other.revealedTimer, 2.8);
          }
        }
        this.spawnFloatText(actor.x, actor.y, 'VISÃO SAGRADA!', eVfx.primaryColor, 0.95);
      } else if (actor.heroId === 'meiro') {
        actor.slowTimer = 0;
        actor.burnTimer = 0;
        this.spawnFloatText(actor.x, actor.y, 'POSTURA PURA!', eVfx.primaryColor, 0.95);
      } else {
        // Titan-X reactor overdrive shockwave
        actor.ammo = Math.min(actor.maxAmmo, actor.ammo + 1);
        this.spawnFloatText(actor.x, actor.y, 'REATOR ATIVO!', eVfx.primaryColor, 0.95);
      }
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 20, 230, 5.5);
    } else if (actor.heroId === 'ryder' || actor.heroId === 'drake') {
      // Stealth + evasion boost
      actor.stealthTimer = 2.4;
      actor.speedBoostTimer = 2.4;
      actor.eVfxTimer = 2.4;
      actor.revealedTimer = 0;
      if (actor.heroId === 'drake') {
        actor.dashTimer = 0.16;
        actor.dashVx = -Math.cos(aim) * 820;
        actor.dashVy = -Math.sin(aim) * 820;
        actor.dashDamage = 0;
        actor.dashHitIds = [];
        actor.activeDashStyle = eVfx.dashStyle;
      }
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 185, 5.5);
      this.spawnFloatText(actor.x, actor.y, 'FURTIVO', eVfx.primaryColor, 0.92);
    } else if (actor.heroId === 'kairo') {
      // Aura Zen: shield + speed + FULL AMMO REFILL!
      actor.shield = Math.min(1600, actor.shield + 600);
      actor.speedBoostTimer = 2.5;
      actor.eVfxTimer = 2.5;
      actor.ammo = actor.maxAmmo;
      actor.ammoReloadTimer = 0;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 200, 5);
      this.spawnFloatText(actor.x, actor.y, 'AURA ZEN & MUNIÇÃO!', eVfx.primaryColor, 0.95);
    } else if (actor.heroId === 'knox' || actor.heroId === 'frost') {
      if (actor.heroId === 'frost') {
        // Cryo Slide leaves an icy nova slowing nearby enemies
        for (const other of this.actors) {
          if (!other.alive || other.team === actor.team) continue;
          if (distance(actor.x, actor.y, other.x, other.y) <= 150) {
            this.damageActor(other, actor, calculateDamage(340, actor.powerCubes), false, eVfx.primaryColor);
            other.slowTimer = Math.max(other.slowTimer, 1.6);
          }
        }
      } else {
        // Knox Salto de Fogos leaves scorching sparks behind
        for (const other of this.actors) {
          if (!other.alive || other.team === actor.team) continue;
          if (distance(actor.x, actor.y, other.x, other.y) <= 135) {
            other.burnTimer = Math.max(other.burnTimer, 1.4);
          }
        }
      }
      // Reverse jump + shield
      actor.shield = Math.min(1700, actor.shield + (actor.heroId === 'frost' ? 780 : 650));
      actor.dashTimer = 0.19;
      actor.dashVx = -Math.cos(aim) * 840;
      actor.dashVy = -Math.sin(aim) * 840;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      actor.eVfxTimer = 2.0;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 16, 220, 5);
      this.spawnFloatText(actor.x, actor.y, actor.heroId === 'frost' ? 'NOVA DE GELO!' : '+ESCUDO', eVfx.primaryColor, 0.92);
    } else if (actor.heroId === 'nina' || actor.heroId === 'kronos') {
      // Forward blink/skate dash + speed/shield (+ Kronos trims Q cooldown!)
      actor.speedBoostTimer = 2.0;
      actor.eVfxTimer = 2.0;
      if (actor.heroId === 'kronos') {
        actor.shield = Math.min(1600, actor.shield + 650);
        actor.qCooldown = Math.max(0, actor.qCooldown - 1.5);
      } else {
        actor.ammo = Math.min(actor.maxAmmo, actor.ammo + 1);
      }
      actor.dashTimer = 0.17;
      actor.dashVx = Math.cos(aim) * 1140;
      actor.dashVy = Math.sin(aim) * 1140;
      actor.dashDamage = 0;
      actor.dashHitIds = [];
      actor.activeDashStyle = eVfx.dashStyle;
      this.spawnDualBurst(actor.x, actor.y, eVfx.primaryColor, eVfx.secondaryColor, 18, 230, 5);
      this.spawnFloatText(actor.x, actor.y, actor.heroId === 'kronos' ? 'SALTO TEMPORAL!' : 'TURBO!', eVfx.primaryColor, 0.92);
    }
  }

  private executeSkillR(actor: ActorState, targetX: number, targetY: number) {
    const cfg = HEROES[actor.heroId];
    const rVfx = getHeroSkillVfx(actor.heroId).r;
    actor.furyCharge = 0;
    actor.revealedTimer = Math.max(actor.revealedTimer, 1.3);
    actor.stealthTimer = 0;
    if (actor.isPlayer) {
      soundEngine.playFury();
      this.trauma = Math.min(1, this.trauma + 0.35);
    }

    const aim = Math.atan2(targetY - actor.y, targetX - actor.x);

    this.spawnSkillRing(
      actor.x,
      actor.y,
      18,
      104,
      aim,
      rVfx.primaryColor,
      rVfx.secondaryColor,
      rVfx.castRingStyle,
      0.42,
      5.2
    );

    if (actor.heroId === 'raidon') {
      // Chuva de Lâminas (10 spinning cyber-shurikens + X-slash + decal)
      const dmg = calculateDamage(680, actor.powerCubes);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        this.spawnProjectile(
          actor,
          a,
          dmg,
          350,
          900,
          10.5,
          rVfx.primaryColor,
          true,
          undefined,
          true,
          1.6,
          undefined,
          rVfx.projectileShape,
          rVfx.secondaryColor,
          { isUltimate: true }
        );
      }
      this.spawnBeam('cross_slash', actor.x, actor.y - 8, actor.x, actor.y - 8, rVfx.primaryColor, rVfx.secondaryColor, 105, 0.34, aim);
      this.spawnGroundDecal(actor.x, actor.y, 130, rVfx.primaryColor, rVfx.secondaryColor, rVfx.decalStyle, 2.2, aim);
      this.spawnSparks(actor.x, actor.y - 8, {
        impactAngle: null,
        count: 20,
        minSpeed: 240,
        maxSpeed: 440,
        spreadRad: Math.PI * 2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.8,
      });
      this.spawnDualBurst(actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 20, 260, 5);
      this.spawnFloatText(actor.x, actor.y, 'CHUVA DE LÂMINAS!', rVfx.primaryColor, 1.1);
    } else if (actor.heroId === 'veinka') {
      // Bombardeio Orbital Carmesim (+ laser target lock + reveal)
      const dist = Math.min(520, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 80, ARENA_SIZE - 80);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 80, ARENA_SIZE - 80);
      this.spawnBeam(
        'laser',
        actor.x + Math.cos(aim) * 22,
        actor.y + Math.sin(aim) * 22,
        tx,
        ty,
        rVfx.primaryColor,
        rVfx.secondaryColor,
        8,
        0.38
      );
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'orbital',
        x: tx,
        y: ty,
        radius: 170,
        elapsed: 0,
        duration: 0.55,
        damage: calculateDamage(1480, actor.powerCubes),
        slowDuration: 1.5,
        revealDuration: 2.5,
        isUltimate: true,
        triggered: false,
      });
    } else if (actor.heroId === 'kong') {
      // Salto Esmagador (parabolic leap + fissura sísmica)
      const startX = actor.x;
      const startY = actor.y;
      const dist = Math.min(340, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      actor.x = tx;
      actor.y = ty;
      this.resolveActorCollisions(actor);
      const leapDur = 0.34;
      actor.visualLeapStartX = startX;
      actor.visualLeapStartY = startY;
      actor.visualLeapDuration = leapDur;
      actor.visualLeapTimer = leapDur;
      actor.visualLeapHeight = 118;
      actor.squashX = 1.38;
      actor.squashY = 0.68;
      this.spawnBeam('leap_arc', startX, startY, actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 18, leapDur + 0.12, 118);
      this.spawnSparks(startX, startY, {
        impactAngle: aim + Math.PI,
        count: 14,
        minSpeed: 180,
        maxSpeed: 340,
        spreadRad: 1.2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'slam',
        x: actor.x,
        y: actor.y,
        radius: 195,
        elapsed: 0,
        duration: leapDur,
        damage: calculateDamage(1320, actor.powerCubes),
        stunDuration: 0.95,
        isUltimate: true,
        triggered: false,
      });
    } else if (actor.heroId === 'phoenix') {
      // Meteoro Solar (+ burn)
      const dist = Math.min(460, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 80, ARENA_SIZE - 80);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 80, ARENA_SIZE - 80);
      this.spawnSparks(actor.x, actor.y - 12, {
        impactAngle: null,
        count: 16,
        minSpeed: 180,
        maxSpeed: 340,
        spreadRad: Math.PI * 2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'meteor',
        x: tx,
        y: ty,
        radius: 190,
        elapsed: 0,
        duration: 0.62,
        damage: calculateDamage(1520, actor.powerCubes),
        burnDuration: 2.2,
        isUltimate: true,
        triggered: false,
      });
    } else if (actor.heroId === 'steelshot') {
      // Hipercarga 0A (triple hyper rail + full railgun laser beams + hex decal)
      const dmg = calculateDamage(940, actor.powerCubes);
      for (const off of [-0.14, 0, 0.14]) {
        const shotAng = aim + off;
        this.spawnProjectile(
          actor,
          shotAng,
          dmg,
          680,
          1320,
          12,
          rVfx.primaryColor,
          true,
          undefined,
          true,
          1.0,
          undefined,
          rVfx.projectileShape,
          rVfx.secondaryColor,
          { shieldBreak: 500, isUltimate: true }
        );
        this.spawnBeam(
          'laser',
          actor.x + Math.cos(shotAng) * 24,
          actor.y + Math.sin(shotAng) * 24,
          actor.x + Math.cos(shotAng) * 680,
          actor.y + Math.sin(shotAng) * 680,
          rVfx.primaryColor,
          rVfx.secondaryColor,
          14,
          0.32
        );
      }
      this.spawnGroundDecal(actor.x, actor.y, 92, rVfx.primaryColor, rVfx.secondaryColor, rVfx.decalStyle, 2.0, aim);
      this.spawnSparks(actor.x + Math.cos(aim) * 24, actor.y + Math.sin(aim) * 24, {
        impactAngle: aim,
        count: 18,
        minSpeed: 240,
        maxSpeed: 460,
        spreadRad: 0.9,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.8,
      });
      this.spawnDualBurst(actor.x + Math.cos(aim) * 26, actor.y + Math.sin(aim) * 26, rVfx.primaryColor, rVfx.secondaryColor, 18, 240, 5);
      this.spawnFloatText(actor.x, actor.y, 'HIPERCARGA 0A!', rVfx.primaryColor, 1.08);
    } else if (actor.heroId === 'eldragon') {
      // Meteoro do Dragão (parabolic leap slam + stun + burn)
      const startX = actor.x;
      const startY = actor.y;
      const dist = Math.min(380, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      actor.x = tx;
      actor.y = ty;
      this.resolveActorCollisions(actor);
      const leapDur = 0.3;
      actor.visualLeapStartX = startX;
      actor.visualLeapStartY = startY;
      actor.visualLeapDuration = leapDur;
      actor.visualLeapTimer = leapDur;
      actor.visualLeapHeight = 104;
      actor.squashX = 1.36;
      actor.squashY = 0.68;
      this.spawnBeam('leap_arc', startX, startY, actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 17, leapDur + 0.12, 104);
      this.spawnSparks(startX, startY, {
        impactAngle: aim + Math.PI,
        count: 14,
        minSpeed: 200,
        maxSpeed: 360,
        spreadRad: 1.1,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'slam',
        x: actor.x,
        y: actor.y,
        radius: 185,
        elapsed: 0,
        duration: leapDur,
        damage: calculateDamage(1380, actor.powerCubes),
        stunDuration: 0.85,
        burnDuration: 1.6,
        isUltimate: true,
        triggered: false,
      });
      this.spawnFloatText(actor.x, actor.y, 'METEORO DO DRAGÃO!', rVfx.primaryColor, 1.08);
    } else if (actor.heroId === 'cluster') {
      // Chuva de Bombas (3 sweeping artillery strikes)
      const baseDist = Math.min(440, distance(actor.x, actor.y, targetX, targetY));
      const dmg = calculateDamage(760, actor.powerCubes);
      this.spawnSparks(actor.x + Math.cos(aim) * 20, actor.y + Math.sin(aim) * 20, {
        impactAngle: aim,
        count: 14,
        minSpeed: 210,
        maxSpeed: 380,
        spreadRad: 0.9,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      for (let k = 0; k < 3; k++) {
        const d = clamp(baseDist - 90 + k * 90, 90, 480);
        const tx = clamp(actor.x + Math.cos(aim) * d, 80, ARENA_SIZE - 80);
        const ty = clamp(actor.y + Math.sin(aim) * d, 80, ARENA_SIZE - 80);
        this.telegraphs.push({
          id: `tz-${this.entitySeq++}`,
          ownerId: actor.id,
          ownerTeam: actor.team,
          heroId: actor.heroId,
          vfxVariant: rVfx.rVariant,
          kind: 'meteor',
          x: tx,
          y: ty,
          radius: 145,
          elapsed: 0,
          duration: 0.38 + k * 0.18,
          damage: dmg,
          isUltimate: true,
          triggered: false,
        });
      }
      this.spawnFloatText(actor.x, actor.y, 'CHUVA DE BOMBAS!', rVfx.primaryColor, 1.08);
    } else if (actor.heroId === 'velvet') {
      // Supernova Astral (gravity vortex pulls enemies inward before detonating!)
      const dist = Math.min(500, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 80, ARENA_SIZE - 80);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 80, ARENA_SIZE - 80);
      this.spawnSparks(actor.x, actor.y - 10, {
        impactAngle: aim,
        count: 14,
        minSpeed: 190,
        maxSpeed: 350,
        spreadRad: 1.2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'orbital',
        x: tx,
        y: ty,
        radius: 195,
        elapsed: 0,
        duration: 0.62,
        damage: calculateDamage(1520, actor.powerCubes),
        slowDuration: 1.8,
        stunDuration: 0.65,
        pullForce: 190,
        isUltimate: true,
        triggered: false,
      });
      this.spawnFloatText(actor.x, actor.y, 'SUPERNOVA ASTRAL!', rVfx.primaryColor, 1.1);
    } else if (actor.heroId === 'meiro' || actor.heroId === 'kairo' || actor.heroId === 'valkyria' || actor.heroId === 'ryder') {
      // Unique radial/spiral waves + signature beams + slam per hero!
      const count = actor.heroId === 'ryder' ? 12 : 8;
      const waveDmg = calculateDamage(actor.heroId === 'ryder' ? 540 : 650, actor.powerCubes);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (actor.heroId === 'ryder' ? 0.18 : 0);
        this.spawnProjectile(
          actor,
          a,
          waveDmg,
          365,
          actor.heroId === 'ryder' ? 920 : 880,
          11.5,
          rVfx.primaryColor,
          true,
          undefined,
          true,
          actor.heroId === 'ryder' ? 1.5 : 1.1,
          undefined,
          rVfx.projectileShape,
          rVfx.secondaryColor,
          { isUltimate: true }
        );
      }
      if (actor.heroId === 'meiro') {
        const healM = Math.round(actor.maxHp * 0.1);
        actor.hp = Math.min(actor.maxHp, actor.hp + healM);
        this.spawnBeam('cross_slash', actor.x, actor.y - 8, actor.x, actor.y - 8, rVfx.primaryColor, rVfx.secondaryColor, 155, 0.38, aim);
        this.spawnBeam('cross_slash', actor.x, actor.y - 8, actor.x, actor.y - 8, rVfx.secondaryColor, '#ffffff', 120, 0.32, aim + Math.PI / 4);
      } else if (actor.heroId === 'valkyria') {
        actor.shield = Math.min(2200, actor.shield + 500);
        this.spawnBeam('wing_flare', actor.x, actor.y, actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 118, 0.5, aim);
        this.spawnBeam('sky_pillar', actor.x, actor.y, actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 54, 0.44);
      } else if (actor.heroId === 'kairo') {
        actor.ammo = actor.maxAmmo;
        for (let b = 0; b < 6; b++) {
          const ba = (b / 6) * Math.PI * 2 + 0.25;
          this.spawnBeam(
            'lightning',
            actor.x,
            actor.y - 8,
            actor.x + Math.cos(ba) * 255,
            actor.y + Math.sin(ba) * 255,
            rVfx.primaryColor,
            rVfx.secondaryColor,
            12,
            0.34,
            b + 1
          );
        }
      } else {
        // ryder
        this.spawnBeam('cross_slash', actor.x, actor.y - 8, actor.x, actor.y - 8, rVfx.primaryColor, rVfx.secondaryColor, 145, 0.38, aim);
      }
      this.spawnGroundDecal(actor.x, actor.y, 155, rVfx.primaryColor, rVfx.secondaryColor, rVfx.decalStyle, 2.4, aim);
      this.spawnSparks(actor.x, actor.y - 8, {
        impactAngle: null,
        count: 22,
        minSpeed: 240,
        maxSpeed: 460,
        spreadRad: Math.PI * 2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 4.0,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'slam',
        x: actor.x,
        y: actor.y,
        radius: actor.heroId === 'ryder' ? 160 : 175,
        elapsed: 0,
        duration: 0.26,
        damage: calculateDamage(actor.heroId === 'ryder' ? 840 : 940, actor.powerCubes),
        stunDuration: actor.heroId === 'ryder' ? 0.6 : 0.85,
        isUltimate: true,
        triggered: false,
      });
      this.spawnDualBurst(actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 24, 280, 6);
      this.spawnFloatText(actor.x, actor.y, `${cfg.skills.r.name.toUpperCase()}!`, rVfx.primaryColor, 1.1);
    } else if (actor.heroId === 'baston' || actor.heroId === 'boulder') {
      // Baston Aegis hex slam (+shield) / Boulder Tectonic slam (parabolic leap + large stun)
      const startX = actor.x;
      const startY = actor.y;
      const dist = Math.min(340, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 60, ARENA_SIZE - 60);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 60, ARENA_SIZE - 60);
      actor.x = tx;
      actor.y = ty;
      this.resolveActorCollisions(actor);
      const leapDur = 0.32;
      const leapH = actor.heroId === 'boulder' ? 115 : 98;
      actor.visualLeapStartX = startX;
      actor.visualLeapStartY = startY;
      actor.visualLeapDuration = leapDur;
      actor.visualLeapTimer = leapDur;
      actor.visualLeapHeight = leapH;
      actor.squashX = 1.38;
      actor.squashY = 0.68;
      if (actor.heroId === 'baston') {
        actor.shield = Math.min(2400, actor.shield + 600);
      }
      this.spawnBeam('leap_arc', startX, startY, actor.x, actor.y, rVfx.primaryColor, rVfx.secondaryColor, 17, leapDur + 0.12, leapH);
      this.spawnSparks(startX, startY, {
        impactAngle: aim + Math.PI,
        count: 14,
        minSpeed: 190,
        maxSpeed: 340,
        spreadRad: 1.1,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.6,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'slam',
        x: actor.x,
        y: actor.y,
        radius: actor.heroId === 'boulder' ? 220 : 195,
        elapsed: 0,
        duration: leapDur,
        damage: calculateDamage(1340, actor.powerCubes),
        stunDuration: actor.heroId === 'boulder' ? 1.1 : 0.95,
        isUltimate: true,
        triggered: false,
      });
      this.spawnFloatText(actor.x, actor.y, `${cfg.skills.r.name.toUpperCase()}!`, rVfx.primaryColor, 1.1);
    } else if (actor.heroId === 'nina') {
      // Tempestade Neon (7-bolt toxic acid fan + acid ground decal + cone shockwave)
      const dmg = calculateDamage(620, actor.powerCubes);
      for (let i = -3; i <= 3; i++) {
        this.spawnProjectile(
          actor,
          aim + i * 0.11,
          dmg,
          540,
          1140,
          10.5,
          rVfx.primaryColor,
          true,
          undefined,
          true,
          0.9,
          undefined,
          rVfx.projectileShape,
          rVfx.secondaryColor,
          { burnDuration: 2.0, isUltimate: true }
        );
      }
      this.spawnSkillRing(actor.x, actor.y, 18, 175, aim, rVfx.primaryColor, rVfx.secondaryColor, 'sonic_cone', 0.38, 6);
      this.spawnGroundDecal(
        actor.x + Math.cos(aim) * 115,
        actor.y + Math.sin(aim) * 115,
        125,
        rVfx.primaryColor,
        rVfx.secondaryColor,
        rVfx.decalStyle,
        2.6,
        aim
      );
      this.spawnSparks(actor.x + Math.cos(aim) * 24, actor.y + Math.sin(aim) * 24, {
        impactAngle: aim,
        count: 18,
        minSpeed: 230,
        maxSpeed: 420,
        spreadRad: 1.0,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.7,
      });
      this.spawnDualBurst(actor.x + Math.cos(aim) * 26, actor.y + Math.sin(aim) * 26, rVfx.primaryColor, rVfx.secondaryColor, 18, 240, 5);
      this.spawnFloatText(actor.x, actor.y, 'TEMPESTADE NEON!', rVfx.primaryColor, 1.08);
    } else if (actor.heroId === 'drake' || actor.heroId === 'solara' || actor.heroId === 'frost' || actor.heroId === 'kronos') {
      // Bespoke orbital ultimates: Drake rapid predator lock, Solara radiant heal+burn, Frost deep blizzard, Kronos clockwork pull singularity
      const dist = Math.min(500, distance(actor.x, actor.y, targetX, targetY));
      const tx = clamp(actor.x + Math.cos(aim) * dist, 80, ARENA_SIZE - 80);
      const ty = clamp(actor.y + Math.sin(aim) * dist, 80, ARENA_SIZE - 80);
      if (actor.heroId === 'drake') {
        this.spawnBeam(
          'laser',
          actor.x + Math.cos(aim) * 22,
          actor.y + Math.sin(aim) * 22,
          tx,
          ty,
          rVfx.primaryColor,
          rVfx.secondaryColor,
          7,
          0.38
        );
      }
      this.spawnSparks(actor.x, actor.y - 10, {
        impactAngle: aim,
        count: 14,
        minSpeed: 190,
        maxSpeed: 350,
        spreadRad: 1.2,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.5,
      });
      this.telegraphs.push({
        id: `tz-${this.entitySeq++}`,
        ownerId: actor.id,
        ownerTeam: actor.team,
        heroId: actor.heroId,
        vfxVariant: rVfx.rVariant,
        kind: 'orbital',
        x: tx,
        y: ty,
        radius: actor.heroId === 'frost' || actor.heroId === 'kronos' ? 200 : 185,
        elapsed: 0,
        duration: actor.heroId === 'drake' ? 0.42 : actor.heroId === 'kronos' ? 0.64 : 0.54,
        damage: calculateDamage(1520, actor.powerCubes),
        slowDuration: actor.heroId === 'frost' ? 2.6 : 2.0,
        stunDuration: actor.heroId === 'kronos' ? 1.0 : actor.heroId === 'frost' ? 0.9 : actor.heroId === 'solara' ? 0.5 : undefined,
        pullForce: actor.heroId === 'kronos' ? 215 : undefined,
        healZoneAmount: actor.heroId === 'solara' ? 480 : undefined,
        burnDuration: actor.heroId === 'solara' ? 1.5 : undefined,
        revealDuration: actor.heroId === 'drake' ? 3.2 : undefined,
        isUltimate: true,
        triggered: false,
      });
      this.spawnFloatText(actor.x, actor.y, `${cfg.skills.r.name.toUpperCase()}!`, rVfx.primaryColor, 1.1);
    } else if (actor.heroId === 'knox' || actor.heroId === 'titanx') {
      // 3-strike volcanic / thermobaric barrage (+ burn DoT)
      const baseDist = Math.min(440, distance(actor.x, actor.y, targetX, targetY));
      const dmg = calculateDamage(790, actor.powerCubes);
      this.spawnSparks(actor.x + Math.cos(aim) * 20, actor.y + Math.sin(aim) * 20, {
        impactAngle: aim,
        count: 16,
        minSpeed: 220,
        maxSpeed: 400,
        spreadRad: 0.95,
        colors: [rVfx.primaryColor, rVfx.secondaryColor, '#ffffff'],
        baseSize: 3.7,
      });
      for (let k = 0; k < 3; k++) {
        const d = clamp(baseDist - 90 + k * 90, 90, 480);
        const tx = clamp(actor.x + Math.cos(aim) * d, 80, ARENA_SIZE - 80);
        const ty = clamp(actor.y + Math.sin(aim) * d, 80, ARENA_SIZE - 80);
        this.telegraphs.push({
          id: `tz-${this.entitySeq++}`,
          ownerId: actor.id,
          ownerTeam: actor.team,
          heroId: actor.heroId,
          vfxVariant: rVfx.rVariant,
          kind: 'meteor',
          x: tx,
          y: ty,
          radius: 150,
          elapsed: 0,
          duration: 0.36 + k * 0.18,
          damage: dmg,
          burnDuration: actor.heroId === 'knox' ? 2.0 : 1.4,
          isUltimate: true,
          triggered: false,
        });
      }
      this.spawnFloatText(actor.x, actor.y, `${cfg.skills.r.name.toUpperCase()}!`, rVfx.primaryColor, 1.1);
    }
  }

  private spawnProjectile(
    owner: ActorState,
    angle: number,
    damage: number,
    maxDist: number,
    speed: number,
    radius: number,
    color: string,
    piercing: boolean,
    aoeRadius?: number,
    isSkill?: boolean,
    slowDuration?: number,
    comboStage?: number,
    vfxShape?: SkillProjectileShape,
    secondaryColor?: string,
    extra?: Partial<Projectile>
  ) {
    const startOffset = HEROES[owner.heroId].radius + 10;
    this.projectiles.push({
      id: `proj-${this.entitySeq++}`,
      ownerId: owner.id,
      ownerTeam: owner.team,
      heroId: owner.heroId,
      x: owner.x + Math.cos(angle) * startOffset,
      y: owner.y + Math.sin(angle) * startOffset,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      damage,
      maxDist,
      traveled: 0,
      color,
      secondaryColor,
      vfxShape,
      piercing,
      hitIds: [],
      slowDuration,
      aoeRadius,
      isSkill,
      comboStage,
      ...extra,
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const stepX = proj.vx * dt;
      const stepY = proj.vy * dt;
      proj.x += stepX;
      proj.y += stepY;
      proj.traveled += Math.hypot(stepX, stepY);

      if (proj.isSkill && proj.vfxShape && Math.random() < 0.55) {
        this.spawnParticle(
          proj.x + (Math.random() - 0.5) * 10,
          proj.y + (Math.random() - 0.5) * 10,
          -proj.vx * 0.08 + (Math.random() - 0.5) * 30,
          -proj.vy * 0.08 + (Math.random() - 0.5) * 30,
          3.8,
          Math.random() > 0.45 ? proj.color : proj.secondaryColor ?? proj.color,
          0.22
        );
      }

      let remove =
        proj.traveled >= proj.maxDist ||
        proj.x < 0 ||
        proj.x > ARENA_SIZE ||
        proj.y < 0 ||
        proj.y > ARENA_SIZE;

      // Wall collision
      if (!remove) {
        for (const wall of this.map.walls) {
          if (circleIntersectsRect(proj.x, proj.y, proj.radius, wall)) {
            this.spawnBurst(proj.x, proj.y, proj.color, 6, 150, 3.5);
            remove = true;
            break;
          }
        }
      }

      // Crate collision
      if (!remove) {
        for (const crate of this.crates) {
          if (crate.destroyed || proj.hitIds.includes(crate.id)) continue;
          if (distance(proj.x, proj.y, crate.x, crate.y) <= proj.radius + 25) {
            proj.hitIds.push(crate.id);
            const owner = this.actors.find((a) => a.id === proj.ownerId) || null;
            this.damageCrate(crate, proj.damage, owner);
            if (!proj.piercing) {
              if (proj.aoeRadius) {
                this.triggerAoeExplosion(proj.x, proj.y, proj.aoeRadius, proj.damage, proj.ownerId, proj.ownerTeam, proj.color, proj);
              }
              remove = true;
              break;
            }
          }
        }
      }

      // Tower collision
      if (!remove) {
        for (const tower of this.towers) {
          if (tower.destroyed || tower.team === proj.ownerTeam || proj.hitIds.includes(tower.id)) {
            continue;
          }
          if (distance(proj.x, proj.y, tower.x, tower.y) <= proj.radius + tower.radius) {
            proj.hitIds.push(tower.id);
            const owner = this.actors.find((a) => a.id === proj.ownerId) || null;
            if (proj.aoeRadius) {
              this.triggerAoeExplosion(proj.x, proj.y, proj.aoeRadius, proj.damage, proj.ownerId, proj.ownerTeam, proj.color, proj);
            } else {
              this.damageTower(tower, proj.damage, owner);
            }
            if (!proj.piercing) {
              remove = true;
              break;
            }
          }
        }
      }

      // Actor collision
      if (!remove) {
        for (const actor of this.actors) {
          if (!actor.alive || actor.team === proj.ownerTeam || proj.hitIds.includes(actor.id)) {
            continue;
          }
          const hitRadius = HEROES[actor.heroId].radius + proj.radius;
          if (distanceSq(proj.x, proj.y, actor.x, actor.y) <= hitRadius * hitRadius) {
            proj.hitIds.push(actor.id);
            const attacker = this.actors.find((a) => a.id === proj.ownerId) || null;

            let hitDmg = proj.damage;
            if (proj.maxRangeBonusPct && proj.traveled >= proj.maxDist * 0.55) {
              hitDmg = Math.round(hitDmg * (1 + proj.maxRangeBonusPct));
            }
            if (proj.executeBelowHpPct && actor.hp / actor.maxHp <= proj.executeBelowHpPct) {
              hitDmg = Math.round(hitDmg * 1.25);
            }

            if (proj.aoeRadius) {
              this.triggerAoeExplosion(
                proj.x,
                proj.y,
                proj.aoeRadius,
                hitDmg,
                proj.ownerId,
                proj.ownerTeam,
                proj.color,
                proj
              );
            } else {
              if (proj.shieldBreak && actor.shield > 0) {
                actor.shield = Math.max(0, actor.shield - proj.shieldBreak);
                this.spawnFloatText(actor.x, actor.y - 26, 'ESCUDO QUEBRADO!', '#38bdf8', 0.86);
              }
              this.damageActor(
                actor,
                attacker,
                hitDmg,
                Boolean(proj.isSkill || (proj.comboStage ?? 0) >= 3),
                proj.color,
                Boolean(proj.isUltimate),
                proj.furyGainScale ?? 1
              );
              if (proj.slowDuration) {
                actor.slowTimer = Math.max(actor.slowTimer, proj.slowDuration);
              }
              if (proj.burnDuration) {
                actor.burnTimer = Math.max(actor.burnTimer, proj.burnDuration);
              }
              if (proj.revealDuration) {
                actor.revealedTimer = Math.max(actor.revealedTimer, proj.revealDuration);
              }
              if (attacker && proj.lifestealPct) {
                const heal = Math.round(hitDmg * proj.lifestealPct);
                attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                this.spawnFloatText(attacker.x, attacker.y - 24, `+${heal}`, '#e879f9', 0.8);
              }
              if (attacker && proj.healOnHeroHit) {
                attacker.hp = Math.min(attacker.maxHp, attacker.hp + proj.healOnHeroHit);
              }
              if (attacker && proj.furyGainOnHit) {
                const bonusFury = computeFuryGain({
                  baseGain: proj.furyGainOnHit,
                  isPlayer: attacker.isPlayer,
                  isUltimateSource: proj.isUltimate,
                  furyGainScale: proj.furyGainScale,
                });
                attacker.furyCharge = Math.min(100, attacker.furyCharge + bonusFury);
              }
            }

            if (!proj.piercing) {
              remove = true;
              break;
            }
          }
        }
      }

      if (remove) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerAoeExplosion(
    x: number,
    y: number,
    radius: number,
    damage: number,
    ownerId: string,
    ownerTeam: ActorState['team'],
    color: string,
    proj?: Projectile
  ) {
    const attacker = this.actors.find((a) => a.id === ownerId) || null;
    this.spawnBurst(x, y, color, 16, 250, 6);
    if (attacker) {
      const qVfx = getHeroSkillVfx(attacker.heroId).q;
      this.spawnSkillRing(
        x,
        y,
        16,
        radius,
        0,
        qVfx.primaryColor,
        qVfx.secondaryColor,
        qVfx.castRingStyle,
        0.34,
        4.8
      );
    }
    let hitAnyHero = false;
    for (const actor of this.actors) {
      if (!actor.alive || actor.team === ownerTeam) continue;
      if (distance(x, y, actor.x, actor.y) <= radius + HEROES[actor.heroId].radius) {
        hitAnyHero = true;
        if (proj?.shieldBreak && actor.shield > 0) {
          actor.shield = Math.max(0, actor.shield - proj.shieldBreak);
          this.spawnFloatText(actor.x, actor.y - 26, 'EMP!', '#38bdf8', 0.85);
        }
        this.damageActor(
          actor,
          attacker,
          damage,
          Boolean(proj?.isSkill),
          color,
          Boolean(proj?.isUltimate),
          proj?.furyGainScale ?? 1
        );
        if (proj?.burnDuration || attacker?.heroId === 'phoenix') {
          actor.burnTimer = Math.max(actor.burnTimer, proj?.burnDuration ?? 1.4);
        }
        if (proj?.slowDuration) {
          actor.slowTimer = Math.max(actor.slowTimer, proj.slowDuration);
        }
      }
    }
    if (hitAnyHero && attacker) {
      if (proj?.healOnHeroHit) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + proj.healOnHeroHit);
        this.spawnFloatText(attacker.x, attacker.y - 22, `+${proj.healOnHeroHit}`, '#facc15', 0.82);
      }
      if (proj?.furyGainOnHit) {
        const bonusFury = computeFuryGain({
          baseGain: proj.furyGainOnHit,
          isPlayer: attacker.isPlayer,
          isUltimateSource: proj.isUltimate,
          furyGainScale: proj.furyGainScale,
        });
        attacker.furyCharge = Math.min(100, attacker.furyCharge + bonusFury);
      }
    }
    // Cluster splitting bomblets
    if (proj?.splitBomblets && proj.splitBomblets > 0 && attacker) {
      const baseAngle = Math.atan2(proj.vy, proj.vx);
      const count = proj.splitBomblets;
      for (let b = 0; b < count; b++) {
        const off = b === 0 ? -0.75 : 0.75;
        const a = baseAngle + off;
        this.projectiles.push({
          id: `proj-${this.entitySeq++}`,
          ownerId: attacker.id,
          ownerTeam: attacker.team,
          heroId: attacker.heroId,
          x: x + Math.cos(a) * 16,
          y: y + Math.sin(a) * 16,
          vx: Math.cos(a) * 520,
          vy: Math.sin(a) * 520,
          radius: 7,
          damage: Math.round(damage * 0.36),
          maxDist: 105,
          traveled: 0,
          color: '#fb923c',
          secondaryColor: '#fde047',
          vfxShape: 'bomblet',
          piercing: false,
          hitIds: [],
          aoeRadius: 48,
          isUltimate: proj.isUltimate,
          furyGainScale: 0.3,
        });
      }
    }

    for (const crate of this.crates) {
      if (crate.destroyed) continue;
      if (distance(x, y, crate.x, crate.y) <= radius + 24) {
        this.damageCrate(crate, damage, attacker);
      }
    }
    for (const tower of this.towers) {
      if (tower.destroyed || tower.team === ownerTeam) continue;
      if (distance(x, y, tower.x, tower.y) <= radius + tower.radius) {
        this.damageTower(tower, damage, attacker);
      }
    }
  }

  private updateTelegraphs(dt: number) {
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tz = this.telegraphs[i];
      tz.elapsed += dt;
      const attacker = this.actors.find((a) => a.id === tz.ownerId) || null;

      if (tz.kind === 'fire_ring') {
        const ringColor = tz.vfxVariant === 'solar_sanctuary' ? '#facc15' : '#fb923c';
        const ringSec = tz.vfxVariant === 'solar_sanctuary' ? '#fef9c3' : '#fde047';
        if (Math.random() < 0.35) {
          const ang = Math.random() * Math.PI * 2;
          const distR = Math.random() * tz.radius * 0.85;
          this.spawnParticle(
            tz.x + Math.cos(ang) * distR,
            tz.y + Math.sin(ang) * distR,
            0,
            -38,
            4.2,
            Math.random() > 0.4 ? ringColor : ringSec,
            0.35
          );
        }
        tz.tickTimer = (tz.tickTimer || 0) + dt;
        if (tz.tickTimer >= 0.45) {
          tz.tickTimer -= 0.45;
          for (const actor of this.actors) {
            if (!actor.alive) continue;
            if (actor.team === tz.ownerTeam) {
              if (tz.healZoneAmount && distance(tz.x, tz.y, actor.x, actor.y) <= tz.radius) {
                actor.hp = Math.min(actor.maxHp, actor.hp + tz.healZoneAmount);
                this.spawnFloatText(actor.x, actor.y - 24, `+${tz.healZoneAmount}`, '#34d399', 0.82);
              }
              continue;
            }
            if (distance(tz.x, tz.y, actor.x, actor.y) <= tz.radius) {
              this.damageActor(
                actor,
                attacker,
                tz.damage,
                false,
                ringColor,
                Boolean(tz.isUltimate),
                tz.furyGainScale ?? 1
              );
              actor.burnTimer = Math.max(actor.burnTimer, 1.0);
            }
          }
          for (const tower of this.towers) {
            if (tower.destroyed || tower.team === tz.ownerTeam) continue;
            if (distance(tz.x, tz.y, tower.x, tower.y) <= tz.radius + tower.radius) {
              this.damageTower(tower, tz.damage, attacker);
            }
          }
        }
        if (tz.elapsed >= tz.duration) {
          this.telegraphs.splice(i, 1);
        }
        continue;
      }

      if (tz.kind === 'trap') {
        const trapColor =
          tz.vfxVariant === 'seismic_mine'
            ? '#facc15'
            : tz.vfxVariant === 'powder_mine'
            ? '#fb923c'
            : '#f43f5e';
        const trapSec =
          tz.vfxVariant === 'seismic_mine'
            ? '#38bdf8'
            : tz.vfxVariant === 'powder_mine'
            ? '#fde047'
            : '#fda4af';
        const trapLabel =
          tz.vfxVariant === 'seismic_mine'
            ? 'SÍSMICO!'
            : tz.vfxVariant === 'powder_mine'
            ? 'BOOM!'
            : 'PRESO!';
        for (const actor of this.actors) {
          if (!actor.alive || actor.team === tz.ownerTeam) continue;
          if (distance(tz.x, tz.y, actor.x, actor.y) <= tz.radius) {
            this.damageActor(
              actor,
              attacker,
              tz.damage,
              true,
              trapColor,
              Boolean(tz.isUltimate),
              tz.furyGainScale ?? 1
            );
            actor.stunTimer = Math.max(actor.stunTimer, tz.stunDuration || 0.9);
            if (tz.burnDuration) {
              actor.burnTimer = Math.max(actor.burnTimer, tz.burnDuration);
            }
            this.spawnDualBurst(tz.x, tz.y, trapColor, trapSec, 18, 240, 5.2);
            this.spawnSkillRing(
              tz.x,
              tz.y,
              14,
              tz.radius * 1.45,
              0,
              trapColor,
              trapSec,
              tz.vfxVariant === 'powder_mine' ? 'starburst' : 'shockwave',
              0.32,
              4.5
            );
            this.spawnFloatText(actor.x, actor.y - 16, trapLabel, trapColor, 1);
            tz.triggered = true;
            break;
          }
        }
        if (tz.triggered || tz.elapsed >= tz.duration) {
          this.telegraphs.splice(i, 1);
        }
        continue;
      }

      // Gravity vortex pull during Velvet/Kronos windup
      if (tz.pullForce && !tz.triggered) {
        for (const actor of this.actors) {
          if (!actor.alive || actor.team === tz.ownerTeam) continue;
          const dist = distance(tz.x, tz.y, actor.x, actor.y);
          if (dist > 14 && dist <= tz.radius * 1.15) {
            const pullAng = Math.atan2(tz.y - actor.y, tz.x - actor.x);
            actor.x += Math.cos(pullAng) * tz.pullForce * dt;
            actor.y += Math.sin(pullAng) * tz.pullForce * dt;
            this.resolveActorCollisions(actor);
          }
        }
      }

      // Timed impact zones (orbital, meteor, slam)
      if (tz.elapsed >= tz.duration && !tz.triggered) {
        tz.triggered = true;
        const rVfx = tz.heroId ? getHeroSkillVfx(tz.heroId).r : null;
        const burstColor = rVfx
          ? rVfx.primaryColor
          : tz.kind === 'orbital'
          ? '#f43f5e'
          : tz.kind === 'slam'
          ? '#f59e0b'
          : '#fb923c';
        const burstSec = rVfx ? rVfx.secondaryColor : '#ffffff';

        // Ground scar decal left by every major ultimate detonation
        if (rVfx) {
          this.spawnGroundDecal(
            tz.x,
            tz.y,
            tz.radius * 0.9,
            burstColor,
            burstSec,
            rVfx.decalStyle,
            2.6
          );
        }

        // Signature multi-layered detonation VFX tailored per hero ultimate
        if (
          tz.vfxVariant === 'crimson_orbital' ||
          tz.vfxVariant === 'solara_pillar' ||
          tz.vfxVariant === 'drake_predator'
        ) {
          const beamW =
            tz.vfxVariant === 'solara_pillar' ? 88 : tz.vfxVariant === 'crimson_orbital' ? 76 : 62;
          this.spawnBeam('sky_pillar', tz.x, tz.y, tz.x, tz.y, burstColor, burstSec, beamW, 0.56);
          this.spawnSkillRing(
            tz.x,
            tz.y,
            24,
            tz.radius * 1.12,
            0,
            burstColor,
            burstSec,
            rVfx?.castRingStyle ?? 'rune_circle',
            0.44,
            6.2
          );
          this.spawnSkillRing(
            tz.x,
            tz.y,
            10,
            tz.radius * 0.72,
            0.4,
            burstSec,
            '#ffffff',
            'starburst',
            0.34,
            4
          );
        } else if (
          tz.vfxVariant === 'velvet_supernova' ||
          tz.vfxVariant === 'kronos_collapse' ||
          tz.vfxVariant === 'phoenix_meteor'
        ) {
          this.spawnBeam(
            'nova_flare',
            tz.x,
            tz.y - 6,
            tz.x,
            tz.y - 6,
            burstColor,
            burstSec,
            tz.radius * 0.92,
            0.48
          );
          if (tz.vfxVariant === 'phoenix_meteor') {
            this.spawnBeam('sky_pillar', tz.x, tz.y, tz.x, tz.y, burstColor, '#fef08a', 66, 0.42);
          }
          this.spawnSkillRing(
            tz.x,
            tz.y,
            26,
            tz.radius * 1.15,
            0,
            burstColor,
            burstSec,
            rVfx?.castRingStyle ?? 'starburst',
            0.46,
            6
          );
          this.spawnSkillRing(
            tz.x,
            tz.y,
            tz.radius * 0.95,
            18,
            0.6,
            burstSec,
            '#ffffff',
            tz.vfxVariant === 'kronos_collapse' ? 'chrono_gears' : 'void_iris',
            0.38,
            4.2
          );
        } else if (
          tz.vfxVariant === 'boulder_tectonic' ||
          tz.vfxVariant === 'frost_blizzard' ||
          tz.vfxVariant === 'knox_volcano' ||
          tz.vfxVariant === 'cluster_artillery' ||
          tz.vfxVariant === 'titanx_barrage'
        ) {
          this.spawnBeam(
            'monolith_burst',
            tz.x,
            tz.y,
            tz.x,
            tz.y,
            burstColor,
            burstSec,
            tz.radius * 0.72,
            0.52
          );
          this.spawnSkillRing(
            tz.x,
            tz.y,
            22,
            tz.radius * 1.1,
            0,
            burstColor,
            burstSec,
            rVfx?.castRingStyle ?? 'shockwave',
            0.42,
            6
          );
          this.spawnSkillRing(
            tz.x,
            tz.y,
            12,
            tz.radius * 0.78,
            0,
            burstSec,
            '#ffffff',
            'starburst',
            0.34,
            4
          );
        } else if (tz.vfxVariant === 'baston_aegis') {
          for (let k = 0; k < 6; k++) {
            const ba = (k / 6) * Math.PI * 2;
            this.spawnBeam(
              'lightning',
              tz.x,
              tz.y - 6,
              tz.x + Math.cos(ba) * tz.radius * 0.9,
              tz.y + Math.sin(ba) * tz.radius * 0.9,
              burstColor,
              burstSec,
              11,
              0.34,
              k + 2
            );
          }
          this.spawnSkillRing(tz.x, tz.y, 20, tz.radius * 1.08, 0, burstColor, burstSec, 'tech_grid', 0.44, 5.8);
        } else if (tz.vfxVariant === 'dragon_slam') {
          this.spawnBeam('cross_slash', tz.x, tz.y - 6, tz.x, tz.y - 6, burstColor, burstSec, tz.radius * 0.84, 0.36, 0.4);
          this.spawnSkillRing(tz.x, tz.y, 20, tz.radius * 1.1, 0, burstColor, burstSec, 'flame_crown', 0.42, 6);
        } else if (tz.vfxVariant === 'kong_fissure') {
          this.spawnBeam('monolith_burst', tz.x, tz.y, tz.x, tz.y, burstColor, burstSec, tz.radius * 0.68, 0.46);
          this.spawnSkillRing(tz.x, tz.y, 24, tz.radius * 1.14, 0, burstColor, burstSec, 'shockwave', 0.44, 6.4);
        } else {
          this.spawnSkillRing(
            tz.x,
            tz.y,
            24,
            tz.radius * 1.05,
            0,
            burstColor,
            burstSec,
            rVfx?.castRingStyle ?? 'shockwave',
            0.38,
            5.5
          );
        }

        this.spawnDualBurst(tz.x, tz.y, burstColor, burstSec, 28, 340, 7.2);
        this.spawnSparks(tz.x, tz.y - 6, {
          impactAngle: null,
          count: 24,
          minSpeed: 230,
          maxSpeed: 460,
          spreadRad: Math.PI * 2,
          colors: [burstColor, burstSec, '#ffffff'],
          baseSize: 4.1,
          gravity: 400,
        });
        this.trauma = Math.min(1, this.trauma + 0.42);
        soundEngine.playHit(true);

        for (const actor of this.actors) {
          if (!actor.alive) continue;
          if (actor.team === tz.ownerTeam) {
            if (tz.healZoneAmount && distance(tz.x, tz.y, actor.x, actor.y) <= tz.radius + 20) {
              actor.hp = Math.min(actor.maxHp, actor.hp + tz.healZoneAmount);
              this.spawnFloatText(actor.x, actor.y - 24, `+${tz.healZoneAmount}`, '#34d399', 0.95);
            }
            continue;
          }
          if (distance(tz.x, tz.y, actor.x, actor.y) <= tz.radius + HEROES[actor.heroId].radius) {
            this.damageActor(
              actor,
              attacker,
              tz.damage,
              true,
              burstColor,
              Boolean(tz.isUltimate),
              tz.furyGainScale ?? 1
            );
            if (tz.stunDuration) {
              actor.stunTimer = Math.max(actor.stunTimer, tz.stunDuration);
            }
            if (tz.slowDuration) {
              actor.slowTimer = Math.max(actor.slowTimer, tz.slowDuration);
            }
            if (tz.burnDuration) {
              actor.burnTimer = Math.max(actor.burnTimer, tz.burnDuration);
            }
            if (tz.revealDuration) {
              actor.revealedTimer = Math.max(actor.revealedTimer, tz.revealDuration);
            }
          }
        }
        for (const crate of this.crates) {
          if (crate.destroyed) continue;
          if (distance(tz.x, tz.y, crate.x, crate.y) <= tz.radius + 26) {
            this.damageCrate(crate, tz.damage, attacker);
          }
        }
        for (const tower of this.towers) {
          if (tower.destroyed || tower.team === tz.ownerTeam) continue;
          if (distance(tz.x, tz.y, tower.x, tower.y) <= tz.radius + tower.radius) {
            this.damageTower(tower, tz.damage, attacker);
          }
        }
        this.telegraphs.splice(i, 1);
      }
    }
  }

  private damageCrate(crate: Crate, dmg: number, attacker: ActorState | null) {
    if (crate.destroyed) return;
    crate.hp -= dmg;
    crate.hitFlash = 0.06;
    const hitAngle = attacker
      ? Math.atan2(crate.y - attacker.y, crate.x - attacker.x)
      : null;
    this.spawnBurst(crate.x, crate.y, '#fbbf24', 4, 120, 3.8);
    this.spawnSparks(crate.x, crate.y - 6, {
      impactAngle: hitAngle,
      count: 6,
      minSpeed: 170,
      maxSpeed: 310,
      spreadRad: Math.PI * 0.95,
      colors: ['#fde047', '#fbbf24', '#ffffff'],
      baseSize: 3.1,
      gravity: 380,
    });
    if (attacker) {
      attacker.furyCharge = Math.min(
        100,
        attacker.furyCharge + computeFuryGain({ baseGain: 3, isPlayer: attacker.isPlayer })
      );
      if (attacker.isPlayer) {
        soundEngine.playHit(false);
      }
    }

    if (crate.hp <= 0) {
      crate.destroyed = true;
      this.spawnBurst(crate.x, crate.y, '#f59e0b', 12, 200, 5.5);
      this.spawnSparks(crate.x, crate.y - 8, {
        impactAngle: null,
        count: 18,
        minSpeed: 220,
        maxSpeed: 460,
        spreadRad: Math.PI * 2,
        colors: ['#fef08a', '#fde047', '#f97316', '#ffffff'],
        baseSize: 4.1,
        gravity: 420,
        drag: 3.0,
      });
      if (attacker?.isPlayer) soundEngine.playCrateBreak();
      this.pickups.push({
        id: `pk-${this.entitySeq++}`,
        kind: 'cube',
        x: crate.x,
        y: crate.y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        age: 0,
        collected: false,
      });
    }
  }

  private damageActor(
    victim: ActorState,
    attacker: ActorState | null,
    amount: number,
    isHeavy: boolean,
    color: string,
    isUltimateSource = false,
    furyGainScale = 1
  ) {
    if (!victim.alive) return;
    const res = applyDamageWithShield(victim.hp, victim.shield, amount);
    victim.hp = res.hp;
    victim.shield = res.shield;
    victim.hitFlash = 0.055;
    victim.revealedTimer = Math.max(victim.revealedTimer, 1.2);
    victim.squashX = 0.84;
    victim.squashY = 1.18;

    this.spawnBurst(victim.x, victim.y, color, isHeavy ? 10 : 5, isHeavy ? 220 : 140, 4.2);
    if (attacker && attacker.id !== victim.id) {
      const hitAngle = Math.atan2(victim.y - attacker.y, victim.x - attacker.x);
      this.spawnSparks(victim.x, victim.y - 10, {
        impactAngle: hitAngle,
        count: isHeavy ? 14 : 8,
        minSpeed: isHeavy ? 240 : 185,
        maxSpeed: isHeavy ? 450 : 340,
        spreadRad: isHeavy ? Math.PI * 0.95 : Math.PI * 0.72,
        colors: ['#fef08a', color, '#ffffff', '#fbbf24'],
        baseSize: isHeavy ? 3.9 : 3.2,
        gravity: 390,
        drag: 3.3,
      });
    }
    const dmgStyle = computeDamageNumberStyle(amount, isHeavy);
    const observer = this.actors.find((a) => a.isPlayer);
    if (!observer || canObserverSeeTarget(observer, victim)) {
      const dmgColor = victim.isPlayer
        ? '#fb7185'
        : attacker === null
          ? color
          : dmgStyle.isCrit
            ? '#fde047'
            : '#f8fafc';
      this.spawnFloatText(
        victim.x,
        victim.y - 84,
        `-${Math.round(amount)}`,
        dmgColor,
        dmgStyle.scale,
        dmgStyle.durationSec,
        (Math.random() - 0.5) * 44,
        dmgStyle.isCrit
      );
    }

    if (attacker) {
      const furyDelta = computeFuryGain({
        baseGain: isHeavy ? 16 : 11,
        isPlayer: attacker.isPlayer,
        isUltimateSource,
        furyGainScale,
      });
      if (furyDelta > 0) {
        attacker.furyCharge = Math.min(100, attacker.furyCharge + furyDelta);
      }
      if (attacker.isPlayer) {
        this.playerDamageDealt += amount;
        this.lastHitDamage = Math.round(amount);
        soundEngine.playHit(isHeavy);
        if (isHeavy) {
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.038);
          this.trauma = Math.min(1, this.trauma + 0.2);
        }
      }
    }

    if (victim.isDummy) {
      victim.dummyRegenTimer = 2.6;
    }

    if (victim.isPlayer) {
      this.playerDamageTaken += amount;
      soundEngine.playHit(isHeavy);
      this.trauma = Math.min(1, this.trauma + 0.24);
    }

    if (victim.hp <= 0) {
      this.handleKill(victim, attacker);
    }
  }

  private handleKill(victim: ActorState, killer: ActorState | null) {
    victim.alive = false;
    victim.koTimer = 0.38;
    victim.deaths += 1;
    victim.respawnTimer = victim.isDummy ? 1.1 : 4.2;

    this.spawnBurst(victim.x, victim.y, HEROES[victim.heroId].accent, 24, 300, 6);

    if (victim.isDummy) {
      if (killer?.isPlayer) {
        soundEngine.playKill();
        soundEngine.playVoiceLine(killer.heroId, 'kill');
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);
        this.trauma = Math.min(1, this.trauma + 0.25);
        this.spawnFloatText(victim.x, victim.y - 48, 'ELIMINADO', '#fbbf24', 1.1);
      }
      return;
    }

    if (victim.isPlayer) {
      this.playerKillStreak = 0;
      this.playerLastKillTime = null;
      this.lastKillerId = killer && killer.id !== victim.id ? killer.id : null;
      this.deathCamPostRespawnTimer = 0;
    }

    if (killer) {
      killer.kills += 1;
      killer.furyCharge = Math.min(
        100,
        killer.furyCharge + computeFuryGain({ baseGain: 25, isPlayer: killer.isPlayer })
      );
      if (killer.isPlayer) {
        soundEngine.playKill();
        soundEngine.playVoiceLine(killer.heroId, 'kill');
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.055);
        this.trauma = Math.min(1, this.trauma + 0.35);

        const streakResult = resolveKillStreak(
          this.playerKillStreak,
          this.playerLastKillTime,
          this.elapsedTime
        );
        this.playerKillStreak = streakResult.streakCount;
        this.playerLastKillTime = this.elapsedTime;
        if (streakResult.banner) {
          this.activeKillStreak = {
            id: this.killStreakSeq++,
            ...streakResult.banner,
          };
          this.killStreakTimer = 2.6;
          soundEngine.playKillStreak(streakResult.banner.count);
          this.emitHud(true);
        }
      } else if (this.phase === 'playing' && killer.alive && Math.random() < 0.42) {
        const now = performance.now();
        this.pendingBotEmotes.push({
          actorId: killer.id,
          emoteId: pickBotReactionEmote('kill'),
          triggerAtMs: now + 320,
        });
      }
      if (this.mode === 'brawl') {
        if (killer.team === 'ally') this.allyScore += 1;
        else if (killer.team === 'enemy') this.enemyScore += 1;
      }
    } else if (this.mode === 'brawl') {
      if (victim.team === 'ally') this.enemyScore += 1;
      else if (victim.team === 'enemy') this.allyScore += 1;
    }

    // Scatter carried Super Estrelas on KO
    if (this.mode === 'superstar' && victim.starsHeld > 0) {
      const starsToDrop = victim.starsHeld;
      victim.starsHeld = 0;
      for (let i = 0; i < starsToDrop; i++) {
        const a = (i / starsToDrop) * Math.PI * 2 + Math.random() * 0.4;
        this.pickups.push({
          id: `pk-${this.entitySeq++}`,
          kind: 'star',
          x: victim.x,
          y: victim.y,
          vx: Math.cos(a) * 185,
          vy: Math.sin(a) * 185,
          age: 0,
          collected: false,
        });
      }
    }

    // Drop power cubes & heal orb in Royale
    const dropCount = this.mode === 'royale' ? Math.max(1, Math.min(3, 1 + Math.floor(victim.powerCubes / 2))) : 1;
    for (let i = 0; i < dropCount; i++) {
      const a = (i / dropCount) * Math.PI * 2;
      this.pickups.push({
        id: `pk-${this.entitySeq++}`,
        kind: i === 0 && dropCount > 1 ? 'heal' : 'cube',
        x: victim.x,
        y: victim.y,
        vx: Math.cos(a) * 140,
        vy: Math.sin(a) * 140,
        age: 0,
        collected: false,
      });
    }

    this.killFeed.unshift({
      id: this.killFeedSeq++,
      killerName: killer ? killer.name : 'Tempestade',
      killerHero: killer ? killer.heroId : victim.heroId,
      victimName: victim.name,
      victimHero: victim.heroId,
      timestamp: this.elapsedTime,
    });
    if (this.killFeed.length > 4) this.killFeed.length = 4;
  }

  private respawnBrawlActor(actor: ActorState) {
    const spawns = actor.team === 'ally' ? this.map.brawlAllySpawns : this.map.brawlEnemySpawns;
    const sp = spawns[Math.floor(Math.random() * spawns.length)];
    const cfg = HEROES[actor.heroId];
    actor.x = sp.x;
    actor.y = sp.y;
    actor.aimAngle = sp.aimAngle;
    const respawnBaseHp = actor.isPlayer
      ? computeEvolvedHeroStats(actor.heroId, this.playerEvolutionLevel).maxHp
      : cfg.maxHp;
    actor.maxHp = computeMaxHp(respawnBaseHp, actor.powerCubes);
    actor.hp = actor.maxHp;
    actor.ghostHp = actor.maxHp;
    actor.shield = 0;
    actor.ammo = cfg.maxAmmo;
    actor.comboStep = 0;
    actor.comboWindowTimer = 0;
    actor.comboTapQueue = 0;
    actor.alive = true;
    actor.stunTimer = 0;
    actor.burnTimer = 0;
    actor.slowTimer = 0;
    actor.dashTimer = 0;
    actor.eVfxTimer = 0;
    actor.activeDashStyle = undefined;
    actor.visualLeapTimer = 0;
    if (!actor.isPlayer) {
      actor.furyCharge = resolveBotRespawnFury(actor.furyCharge);
    }
    if (actor.isPlayer) {
      this.deathCamPostRespawnTimer = 1.6;
    }
    this.spawnBurst(actor.x, actor.y, cfg.accent, 14, 180, 5);
  }

  private updateDeathCamState(player: ActorState | undefined) {
    if (!player || (player.alive && this.deathCamPostRespawnTimer <= 0)) {
      this.lastKillerId = null;
      this.activeDeathCam = null;
      this.activeDeathCamTargetId = null;
      return;
    }

    const selection = selectDeathCamTarget(player, this.lastKillerId, this.actors);
    if (!selection) {
      this.activeDeathCam = null;
      this.activeDeathCamTargetId = null;
      return;
    }

    const target = selection.actor;
    this.activeDeathCamTargetId = target.id;
    this.activeDeathCam = {
      active: true,
      postRespawn: player.alive && this.deathCamPostRespawnTimer > 0,
      relation: selection.relation,
      targetName: target.name,
      targetHero: target.heroId,
      targetHp: Math.round(target.hp),
      targetMaxHp: Math.round(target.maxHp),
      targetShield: Math.round(target.shield),
      targetPowerCubes: target.powerCubes,
      targetKills: target.kills,
      targetFuryCharge: Math.round(target.furyCharge),
      distanceMeters: selection.distanceMeters,
      respawnRemaining: player.alive ? 0 : Math.max(0, player.respawnTimer),
    };
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.age += dt;
      pk.x += pk.vx * dt;
      pk.y += pk.vy * dt;
      pk.vx *= Math.exp(-6 * dt);
      pk.vy *= Math.exp(-6 * dt);

      for (const actor of this.actors) {
        if (!actor.alive) continue;
        if (distance(actor.x, actor.y, pk.x, pk.y) <= HEROES[actor.heroId].radius + 22) {
          pk.collected = true;
          if (pk.kind === 'star') {
            actor.starsHeld += 1;
            actor.hp = Math.min(actor.maxHp, actor.hp + 260);
            actor.furyCharge = Math.min(100, actor.furyCharge + 12);
            this.spawnFloatText(actor.x, actor.y, '+1 ESTRELA!', '#fde047', 1.05);
            this.spawnBurst(pk.x, pk.y, '#facc15', 10, 185, 4.5);
          } else if (pk.kind === 'cube') {
            actor.powerCubes += 1;
            const prevMax = actor.maxHp;
            const cubeBaseHp = actor.isPlayer
              ? computeEvolvedHeroStats(actor.heroId, this.playerEvolutionLevel).maxHp
              : HEROES[actor.heroId].maxHp;
            actor.maxHp = computeMaxHp(cubeBaseHp, actor.powerCubes);
            actor.hp = Math.min(actor.maxHp, actor.hp + (actor.maxHp - prevMax) + 320);
            this.spawnFloatText(actor.x, actor.y, '+1 PODER', '#10b981', 0.95);
            this.spawnBurst(pk.x, pk.y, '#10b981', 8, 160, 4);
          } else {
            const heal = Math.round(actor.maxHp * 0.25);
            actor.hp = Math.min(actor.maxHp, actor.hp + heal);
            this.spawnFloatText(actor.x, actor.y, `+${heal}`, '#34d399', 0.95);
            this.spawnBurst(pk.x, pk.y, '#10b981', 8, 160, 4);
          }
          if (actor.isPlayer) soundEngine.playPickup();
          break;
        }
      }

      if (pk.collected) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private render(nowMs: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Background deep arena void
    ctx.fillStyle = '#090e1a';
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

    const shakeMag = this.trauma * this.trauma * 12;
    const shakeX = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeY = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;

    const halfWorldW = this.viewWidth / (2 * this.cameraScale);
    const halfWorldH = this.viewHeight / (2 * this.cameraScale);

    ctx.save();
    ctx.translate(this.viewWidth / 2, this.viewHeight / 2);
    ctx.scale(this.cameraScale, this.cameraScale);
    ctx.translate(-this.camX + shakeX, -this.camY + shakeY);

    if (this.arenaCache) {
      const sx = clamp(Math.floor(this.camX - halfWorldW - 24), 0, ARENA_SIZE);
      const sy = clamp(Math.floor(this.camY - halfWorldH - 24), 0, ARENA_SIZE);
      const ex = clamp(Math.ceil(this.camX + halfWorldW + 24), 0, ARENA_SIZE);
      const ey = clamp(Math.ceil(this.camY + halfWorldH + 24), 0, ARENA_SIZE);
      const sw = Math.max(1, ex - sx);
      const sh = Math.max(1, ey - sy);
      ctx.drawImage(this.arenaCache, sx, sy, sw, sh, sx, sy, sw, sh);
    } else {
      this.drawFloor(ctx);
      this.drawWalls(ctx);
    }
    if (this.mode === 'superstar') {
      const pulse = 0.55 + Math.sin(nowMs * 0.005) * 0.22;
      ctx.save();
      ctx.translate(ARENA_CENTER, ARENA_CENTER);
      ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    this.drawGroundDecals(ctx, nowMs);
    this.drawTelegraphs(ctx, nowMs);
    this.drawSkillRings(ctx);
    this.drawPickups(ctx, nowMs);
    this.drawCrates(ctx);
    this.drawTowers(ctx, nowMs);
    this.drawDashGhosts(ctx);
    this.drawSlashArcs(ctx);
    this.drawActors(ctx, nowMs);
    this.drawProjectiles(ctx, nowMs);
    this.drawBeams(ctx, nowMs);
    this.drawBushes(ctx, nowMs);
    this.drawParticles(ctx);
    if (this.phase === 'playing') {
      this.drawStorm(ctx, nowMs);
    }
    this.drawActorEmoteBubbles(ctx, nowMs);
    this.drawFloatTexts(ctx);

    if (
      this.isInteractivePhase() &&
      (this.virtualAimActive || this.hasPointerMoved || this.touchControlsActive)
    ) {
      this.drawPlayerAimReticle(ctx);
    }

    ctx.restore();

    if (this.phase === 'playing') {
      this.drawCanvasMinimap(ctx);
    }

    ctx.restore();
  }

  private drawCanvasMinimap(ctx: CanvasRenderingContext2D) {
    const isCompactViewport = this.viewWidth < 900 || this.viewHeight < 560;
    const size = isCompactViewport ? 70 : 104;
    const mx = isCompactViewport ? 10 : 16;
    const my = isCompactViewport ? 74 : Math.max(132, this.viewHeight - size - 16);
    const player = this.actors.find((a) => a.isPlayer);

    ctx.save();
    ctx.fillStyle = 'rgba(13, 20, 44, 0.9)';
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 2;
    ctx.fillRect(mx, my, size, size);
    ctx.strokeRect(mx, my, size, size);

    // Arena walls on minimap
    ctx.fillStyle = 'rgba(148, 163, 184, 0.38)';
    for (const w of this.map.walls) {
      ctx.fillRect(
        mx + (w.x / ARENA_SIZE) * size,
        my + (w.y / ARENA_SIZE) * size,
        Math.max(2, (w.w / ARENA_SIZE) * size),
        Math.max(2, (w.h / ARENA_SIZE) * size)
      );
    }

    // Crates
    ctx.fillStyle = '#fbbf24';
    for (const c of this.crates) {
      if (c.destroyed) continue;
      ctx.fillRect(mx + (c.x / ARENA_SIZE) * size - 1, my + (c.y / ARENA_SIZE) * size - 1, 2.5, 2.5);
    }

    // Golden Stars on minimap (Super Estrela mode)
    for (const pk of this.pickups) {
      if (pk.collected || pk.kind !== 'star') continue;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(mx + (pk.x / ARENA_SIZE) * size, my + (pk.y / ARENA_SIZE) * size, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Towers on minimap (Cerco à Torre mode)
    for (const tower of this.towers) {
      if (tower.destroyed) continue;
      ctx.fillStyle = tower.team === 'ally' ? '#38bdf8' : '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const tx = mx + (tower.x / ARENA_SIZE) * size;
      const ty = my + (tower.y / ARENA_SIZE) * size;
      ctx.fillRect(tx - 4, ty - 4, 8, 8);
      ctx.strokeRect(tx - 4, ty - 4, 8, 8);
    }

    // Storm circle
    if (this.mode === 'royale' && this.stormRadius < MAX_STORM_RADIUS - 5) {
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx + size / 2, my + size / 2, (this.stormRadius / ARENA_SIZE) * size, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Visible actors
    for (const a of this.actors) {
      if (!a.alive) continue;
      if (player && !a.isPlayer && !canObserverSeeTarget(player, a)) continue;
      const ax = mx + (a.x / ARENA_SIZE) * size;
      const ay = my + (a.y / ARENA_SIZE) * size;
      const isAlly = player ? a.team === player.team : a.isPlayer;
      ctx.fillStyle = a.isPlayer ? '#22c55e' : isAlly ? '#38bdf8' : '#ef4444';
      ctx.beginPath();
      ctx.arc(ax, ay, a.isPlayer ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawFloor(ctx: CanvasRenderingContext2D) {
    this.drawArenaFloorTo(ctx);
  }

  private drawWalls(ctx: CanvasRenderingContext2D) {
    this.drawArenaWallsTo(ctx);
  }

  private drawBushes(ctx: CanvasRenderingContext2D, nowMs: number) {
    const player = this.actors.find((a) => a.isPlayer);
    const theme = this.map.meta.theme;
    const halfWorldW = this.viewWidth / (2 * this.cameraScale);
    const halfWorldH = this.viewHeight / (2 * this.cameraScale);
    const viewLeft = this.camX - halfWorldW - 64;
    const viewRight = this.camX + halfWorldW + 64;
    const viewTop = this.camY - halfWorldH - 64;
    const viewBottom = this.camY + halfWorldH + 64;

    for (const b of this.map.bushes) {
      if (b.x + b.w < viewLeft || b.x > viewRight || b.y + b.h < viewTop || b.y > viewBottom) {
        continue;
      }
      const playerInside =
        player &&
        player.alive &&
        player.x >= b.x - 24 &&
        player.x <= b.x + b.w + 24 &&
        player.y >= b.y - 24 &&
        player.y <= b.y + b.h + 24;

      ctx.save();
      if (playerInside) ctx.globalAlpha = 0.45;

      // Soft root ground shadow (no hard rectangular frame)
      ctx.fillStyle = theme.bushShadow;
      ctx.beginPath();
      ctx.roundRect(b.x + 6, b.y + 10, Math.max(20, b.w - 12), Math.max(20, b.h - 10), 22);
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = (playerInside ? 0.45 : 1) * 0.45;
      ctx.fillStyle = theme.bushOutline;
      ctx.beginPath();
      ctx.roundRect(b.x + 12, b.y + 14, Math.max(14, b.w - 24), Math.max(14, b.h - 20), 18);
      ctx.fill();
      ctx.restore();

      // Painter-ordered rows of Thetan Arena vertical gradient grass stalk clusters
      const rowStep = 12;
      const colStep = 18;
      const rows = Math.max(3, Math.round((b.h - 20) / rowStep) + 1);
      const sprites = this.grassTuftSprites;

      if (sprites.length > 0) {
        for (let r = 0; r < rows; r++) {
          const rowFrac = rows === 1 ? 0.5 : r / (rows - 1);
          const tyBase = b.y + 20 + rowFrac * Math.max(8, b.h - 22);
          const isEdgeRow = r === 0 || r === rows - 1;
          const cornerInset = rows >= 4 && isEdgeRow ? 10 : 0;
          const stagger = r % 2 === 1 ? colStep * 0.48 : 0;
          const innerW = Math.max(18, b.w - 28 - cornerInset * 2 - (r % 2 === 1 ? 6 : 0));
          const cols = Math.max(3, Math.round(innerW / colStep) + 1);
          const startX = b.x + 14 + cornerInset + stagger * 0.45;

          for (let c = 0; c < cols; c++) {
            const frac = cols === 1 ? 0.5 : c / (cols - 1);
            const hash = ((r * 73856093) ^ (c * 19349663) ^ Math.round(b.x + b.y)) & 31;
            const isEdge = isEdgeRow || c === 0 || c === cols - 1;
            // Slightly break outer corners for an organic stepped grass silhouette
            if (isEdgeRow && (c === 0 || c === cols - 1) && (hash & 3) === 0) {
              continue;
            }
            const jx = ((hash % 5) - 2) * (isEdge ? 2.4 : 1.5);
            const jy = (((hash >> 2) % 3) - 1) * (isEdge ? 2.1 : 1.4);
            const tx = startX + frac * innerW + jx;
            const ty = tyBase + jy;
            const sw = Math.sin(nowMs * 0.0026 + tx * 0.024 + ty * 0.016) * 1.5;
            const sprite =
              isEdge && sprites.length >= 6 && (hash & 1) === 1
                ? sprites[4 + ((hash >> 1) & 1)]
                : sprites[hash & 3];
            ctx.drawImage(sprite, tx - 28 + sw, ty - 43);
          }
        }
      }

      ctx.restore();
    }
  }

  private drawCrates(ctx: CanvasRenderingContext2D) {
    for (const c of this.crates) {
      if (c.destroyed) continue;
      ctx.save();
      ctx.translate(c.x, c.y);

      // Shadow
      ctx.fillStyle = 'rgba(6, 10, 22, 0.56)';
      ctx.beginPath();
      ctx.roundRect(-23, -15, 50, 48, 9);
      ctx.fill();

      // 2.5D Lower bronze chest rim
      ctx.fillStyle = c.hitFlash > 0 ? '#ffffff' : '#92400e';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.roundRect(-24, -24, 48, 48, 9);
      ctx.fill();
      ctx.stroke();

      if (c.hitFlash <= 0) {
        // Raised gold top deck
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-21, -22, 42, 39, 7);
        ctx.fill();

        // Top bevel highlight
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-17, -20, 34, 3);

        // Dark metallic recessed core frame
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-13, -15, 26, 26, 5);
        ctx.fill();
        ctx.stroke();

        // Glowing emerald Power Crystal core with facet specular
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(11, -2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-11, -2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(7, -3);
        ctx.lineTo(0, -1);
        ctx.closePath();
        ctx.fill();

        // Corner steel rivets
        ctx.fillStyle = '#fef3c7';
        for (const [rx, ry] of [
          [-17, -17],
          [17, -17],
          [-17, 13],
          [17, 13],
        ]) {
          ctx.beginPath();
          ctx.arc(rx, ry, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Crate HP bar when damaged
      if (c.hp < c.maxHp) {
        const pct = Math.max(0, c.hp / c.maxHp);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-22, -36, 44, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-20, -34, 40 * pct, 4);
      }

      ctx.restore();
    }
  }

  private drawTowers(ctx: CanvasRenderingContext2D, nowMs: number) {
    for (const tower of this.towers) {
      ctx.save();
      ctx.translate(tower.x, tower.y);
      const isAlly = tower.team === 'ally';
      const mainColor = isAlly ? '#38bdf8' : '#f43f5e';
      const darkRim = isAlly ? '#0c4a6e' : '#881337';

      // Ground defense radius ring
      if (!tower.destroyed) {
        ctx.strokeStyle = isAlly ? 'rgba(56, 189, 248, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, 365, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Shadow
      ctx.fillStyle = 'rgba(6, 10, 22, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 18, tower.radius * 1.18, tower.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (tower.destroyed) {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, tower.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // Octagonal Armored Base
      ctx.fillStyle = tower.hitFlash > 0 ? '#ffffff' : darkRim;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, tower.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = tower.hitFlash > 0 ? '#ffffff' : '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -4, tower.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating Plasma Turret Head
      ctx.save();
      ctx.translate(0, -6);
      ctx.rotate(tower.aimAngle);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(6, -10, tower.radius * 0.95, 20, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc(0, 0, tower.radius * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const pulse = 0.6 + Math.sin(nowMs * 0.008) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, tower.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Overhead Tower HP Bar
      const barW = 104;
      const barH = 11;
      const barY = -tower.radius - 28;
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4, 4);
      ctx.fill();
      const pct = clamp(tower.hp / tower.maxHp, 0, 1);
      ctx.fillStyle = mainColor;
      ctx.fillRect(-barW / 2, barY, barW * pct, barH);

      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      const label = `${isAlly ? 'TORRE ALIADA' : 'TORRE INIMIGA'} ${Math.ceil(pct * 100)}%`;
      ctx.strokeText(label, 0, barY - 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(label, 0, barY - 3);

      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D, nowMs: number) {
    const bob = Math.sin(nowMs * 0.0055) * 3.5;
    for (const pk of this.pickups) {
      ctx.save();
      ctx.translate(pk.x, pk.y + bob);

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 15 - bob, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (pk.kind === 'star') {
        const pulse = 0.25 + Math.sin(nowMs * 0.01) * 0.15;
        ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const rad = i % 2 === 0 ? 15 : 6.8;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(-2, -2, 3.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (pk.kind === 'cube') {
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(8, -1);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2.5, -6, 5, 12);
        ctx.fillRect(-6, -2.5, 12, 5);
      }
      ctx.restore();
    }
  }

  private drawGroundDecals(ctx: CanvasRenderingContext2D, nowMs: number) {
    for (const d of this.groundDecals) {
      if (!d.active) continue;
      drawGroundDecal(ctx, d, nowMs);
    }
  }

  private drawTelegraphs(ctx: CanvasRenderingContext2D, nowMs: number) {
    for (const tz of this.telegraphs) {
      drawSkillTelegraph(ctx, tz, nowMs);
    }
  }

  private drawBeams(ctx: CanvasRenderingContext2D, nowMs: number) {
    for (const b of this.beams) {
      if (!b.active) continue;
      drawBeamEffect(ctx, b, nowMs);
    }
  }

  private drawSkillRings(ctx: CanvasRenderingContext2D) {
    for (const r of this.skillRings) {
      if (!r.active) continue;
      drawSkillRingEffect(ctx, r);
    }
  }

  private drawDashGhosts(ctx: CanvasRenderingContext2D) {
    for (const g of this.dashGhosts) {
      if (!g.active) continue;
      drawDashGhost(ctx, g);
    }
  }

  private drawSlashArcs(ctx: CanvasRenderingContext2D) {
    for (const s of this.slashArcs) {
      if (!s.active) continue;
      const alpha = s.life / s.maxLife;
      const stage = s.comboStage ?? 1;
      drawStyledSlashArc(
        ctx,
        s.x,
        s.y,
        s.angle,
        s.radius,
        alpha,
        s.color,
        s.secondaryColor ?? '#ffffff',
        s.slashStyle,
        stage
      );
    }
  }

  private drawActors(ctx: CanvasRenderingContext2D, nowMs: number) {
    const player = this.actors.find((a) => a.isPlayer);
    const deathCamTarget = this.activeDeathCamTargetId
      ? this.actors.find((a) => a.id === this.activeDeathCamTargetId && a.alive)
      : undefined;
    const visionObserver = deathCamTarget ?? player;

    for (const actor of this.actors) {
      if (!actor.alive && actor.koTimer <= 0) continue;

      if (
        this.isInteractivePhase() &&
        visionObserver &&
        !actor.isPlayer &&
        !actor.isDummy &&
        actor.id !== deathCamTarget?.id
      ) {
        if (!canObserverSeeTarget(visionObserver, actor)) {
          continue;
        }
      }

      const cfg = HEROES[actor.heroId];
      let drawX = actor.x;
      let drawY = actor.y;
      let leapOffsetY = 0;
      let leapShadowScale = 1;
      if (
        actor.alive &&
        actor.visualLeapTimer &&
        actor.visualLeapTimer > 0 &&
        actor.visualLeapDuration &&
        actor.visualLeapStartX !== undefined &&
        actor.visualLeapStartY !== undefined
      ) {
        const t = clamp(1 - actor.visualLeapTimer / actor.visualLeapDuration, 0, 1);
        drawX = actor.visualLeapStartX + (actor.x - actor.visualLeapStartX) * t;
        drawY = actor.visualLeapStartY + (actor.y - actor.visualLeapStartY) * t;
        const arc = Math.sin(Math.PI * t);
        leapOffsetY = arc * (actor.visualLeapHeight ?? 100);
        leapShadowScale = 1 - arc * 0.36;
      }

      ctx.save();
      ctx.translate(drawX, drawY);

      if (!actor.alive) {
        const k = actor.koTimer / 0.38;
        ctx.globalAlpha = k;
        ctx.rotate((1 - k) * 0.9);
        ctx.scale(k, k);
      } else if (actor.stealthTimer > 0 || actor.inBush) {
        ctx.globalAlpha = actor.isPlayer || (player && actor.team === player.team) ? 0.55 : 0.78;
      }

      // Ground contact shadow
      ctx.fillStyle = 'rgba(6, 10, 22, 0.56)';
      ctx.beginPath();
      ctx.ellipse(
        0,
        cfg.radius * 1.04,
        cfg.radius * 1.24 * leapShadowScale,
        cfg.radius * 0.52 * leapShadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Thetan-style directional ground circle ring
      const isAlly = player ? actor.team === player.team : actor.isPlayer;
      const ringColor = actor.isPlayer ? '#22c55e' : isAlly ? '#38bdf8' : '#ef4444';
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = actor.isPlayer ? 3.8 : 2.8;
      ctx.beginPath();
      ctx.arc(0, 11, cfg.radius + 10, 0, Math.PI * 2);
      ctx.stroke();

      // Tactical Death Cam focus lock ring around tracked killer or teammate
      if (deathCamTarget && actor.id === deathCamTarget.id && actor.alive) {
        const pulse = 0.65 + Math.sin(nowMs * 0.01) * 0.3;
        const dcColor = this.activeDeathCam?.relation === 'killer' ? '#fb7185' : '#38bdf8';
        ctx.save();
        ctx.strokeStyle = dcColor;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(0, 11, cfg.radius + 20, nowMs * 0.002, nowMs * 0.002 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Aim direction arrow on ground ring
      ctx.save();
      ctx.translate(0, 11);
      ctx.rotate(actor.aimAngle);
      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.moveTo(cfg.radius + 18, 0);
      ctx.lineTo(cfg.radius + 8, -5.5);
      ctx.lineTo(cfg.radius + 8, 5.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (leapOffsetY > 0) {
        ctx.translate(0, -leapOffsetY);
      }

      // Hero-specific active shield, stealth, dash, and E-skill geometric auras
      drawActorSkillAuras(ctx, actor, cfg.radius, nowMs);

      // Cel-shaded cartoon chibi character sprite matching hero portraits
      ctx.save();
      ctx.scale(actor.squashX, actor.squashY);
      drawHeroCharacter(ctx, actor, nowMs, actor.aimAngle);
      ctx.restore();

      if (actor.alive) {
        this.drawActorOverheadBar(ctx, actor, isAlly);
      }

      ctx.restore();
    }
  }

  private drawActorEmoteBubbles(ctx: CanvasRenderingContext2D, nowMs: number) {
    const player = this.actors.find((a) => a.isPlayer);
    const deathCamTarget = this.activeDeathCamTargetId
      ? this.actors.find((a) => a.id === this.activeDeathCamTargetId && a.alive)
      : undefined;
    const visionObserver = deathCamTarget ?? player;

    for (const actor of this.actors) {
      if (!actor.alive || !actor.activeEmote) continue;
      if (
        this.isInteractivePhase() &&
        visionObserver &&
        !actor.isPlayer &&
        !actor.isDummy &&
        actor.id !== deathCamTarget?.id &&
        !canObserverSeeTarget(visionObserver, actor)
      ) {
        continue;
      }
      drawActorEmoteBubble(ctx, actor, nowMs);
    }
  }

  private drawActorOverheadBar(ctx: CanvasRenderingContext2D, actor: ActorState, isAlly: boolean) {
    const cfg = HEROES[actor.heroId];
    const barW = 68;
    const barH = 9;
    const topY = -cfg.radius - 70;

    // Super Estrela carried badge
    if (actor.starsHeld > 0) {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-22, topY - 36, 44, 18, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#090d16';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${actor.starsHeld}`, 0, topY - 27);
    }

    // Power Cube diamond badge
    if (actor.powerCubes > 0) {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-barW / 2 - 12, topY - 4);
      ctx.lineTo(-barW / 2 - 3, topY + 4.5);
      ctx.lineTo(-barW / 2 - 12, topY + 13);
      ctx.lineTo(-barW / 2 - 21, topY + 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(actor.powerCubes), -barW / 2 - 12, topY + 4.5);
    }

    // Name label with dark cel stroke
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3.5;
    ctx.strokeText(actor.name, 0, topY - 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(actor.name, 0, topY - 3);

    // HP background frame
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-barW / 2 - 2, topY - 2, barW + 4, barH + 4, 3);
    ctx.fill();

    // Trailing ghost bar
    const ghostPct = clamp(actor.ghostHp / actor.maxHp, 0, 1);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-barW / 2, topY, barW * ghostPct, barH);

    // Live HP fill (Thetan Arena colors: Green player, Blue ally, Red enemy)
    const hpPct = clamp(actor.hp / actor.maxHp, 0, 1);
    ctx.fillStyle = actor.isPlayer ? '#22c55e' : isAlly ? '#38bdf8' : '#ef4444';
    ctx.fillRect(-barW / 2, topY, barW * hpPct, barH);

    // Segment tick marks every 1000 HP (classic Thetan Arena / Brawl HP bar readability)
    const segments = Math.floor(actor.maxHp / 1000);
    ctx.fillStyle = 'rgba(9, 13, 22, 0.55)';
    for (let s = 1; s <= segments; s++) {
      const tx = -barW / 2 + ((s * 1000) / actor.maxHp) * barW;
      if (tx < barW / 2 - 2) {
        ctx.fillRect(tx, topY, 1.5, barH);
      }
    }

    // Shield overlay
    if (actor.shield > 0) {
      const shPct = clamp(actor.shield / actor.maxHp, 0, 1);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-barW / 2, topY, barW * shPct, 3.5);
    }

    // Player 3-charge ammo pips under HP bar
    if (actor.isPlayer) {
      const pipW = (barW - 4) / actor.maxAmmo;
      const comboGlow = actor.comboStep >= 2;
      for (let i = 0; i < actor.maxAmmo; i++) {
        ctx.fillStyle = comboGlow ? '#f59e0b' : '#090d16';
        ctx.fillRect(-barW / 2 + i * (pipW + 2) - 0.5, topY + barH + 2.5, pipW + 1, 4.5);
        ctx.fillStyle = i < actor.ammo ? (actor.comboStep >= 1 ? '#f97316' : '#fbbf24') : '#334155';
        ctx.fillRect(-barW / 2 + i * (pipW + 2), topY + barH + 3, pipW, 3.5);
      }
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, nowMs: number) {
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.rotate(angle);

      const r = proj.radius;
      if ((proj.comboStage ?? 0) >= 2) {
        ctx.save();
        ctx.globalAlpha = proj.comboStage === 3 ? 0.55 : 0.35;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, 0, r * 2.9, r * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (proj.vfxShape) {
        drawSkillProjectile(ctx, proj, proj.vfxShape, nowMs);
        ctx.restore();
        continue;
      }
      if (proj.ownerId.startsWith('tower-')) {
        ctx.fillStyle = proj.color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.heroId === 'raidon' || proj.heroId === 'nina' || proj.heroId === 'ryder') {
        // Sleek plasma bolt / twin SMG dart / void dagger
        ctx.fillStyle = proj.color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 2.1, 0);
        ctx.lineTo(-r * 0.4, -r * 0.85);
        ctx.lineTo(-r * 2.2, 0);
        ctx.lineTo(-r * 0.4, r * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ecfeff';
        ctx.beginPath();
        ctx.ellipse(r * 0.35, 0, r * 0.95, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.heroId === 'veinka' || proj.heroId === 'drake' || proj.heroId === 'frost') {
        // Glowing energy crossbow arrow / sniper rail / ice lance
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

        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-r * 1.4, -r * 0.18, r * 2.8, r * 0.36);
      } else if (proj.heroId === 'kong') {
        // Heavy golden-amber seismic shockwave crescent
        ctx.fillStyle = proj.color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5, -1.1, 1.1);
        ctx.quadraticCurveTo(r * 0.4, 0, Math.cos(-1.1) * r * 1.5, Math.sin(-1.1) * r * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r * 0.15, 0, r * 1.15, -0.75, 0.75);
        ctx.stroke();
      } else if (proj.heroId === 'steelshot' || proj.heroId === 'titanx') {
        // Plasma cannon bolt / heavy mech rocket
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

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-r * 1.2, -r * 0.42, r * 1.5, r * 0.84);
        ctx.fillStyle = '#ecfeff';
        ctx.beginPath();
        ctx.arc(r * 0.6, 0, r * 0.46, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.heroId === 'cluster' || proj.heroId === 'knox') {
        // Mortar / lava grenade shell
        ctx.fillStyle = proj.heroId === 'knox' ? '#9a3412' : '#1e3a8a';
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
        ctx.arc(-r * 1.15, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.heroId === 'velvet' || proj.heroId === 'kronos') {
        // Astral star lance / temporal beam bolt
        ctx.fillStyle = proj.color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 2.5, 0);
        ctx.lineTo(r * 0.3, -r * 0.95);
        ctx.lineTo(-r * 2.1, -r * 0.35);
        ctx.lineTo(-r * 2.7, 0);
        ctx.lineTo(-r * 2.1, r * 0.35);
        ctx.lineTo(r * 0.3, r * 0.95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath();
        ctx.ellipse(r * 0.3, 0, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.heroId === 'meiro' || proj.heroId === 'kairo' || proj.heroId === 'valkyria') {
        // Crescent slash / voltaic wave / angelic lance wave
        ctx.fillStyle = proj.color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.65, -1.15, 1.15);
        ctx.quadraticCurveTo(r * 0.35, 0, Math.cos(-1.15) * r * 1.65, Math.sin(-1.15) * r * 1.65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(r * 0.15, 0, r * 1.25, -0.8, 0.8);
        ctx.stroke();
      } else {
        // Phoenix blazing multi-tone fireball with flame tail
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
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.kind === 'spark') {
        const speed = Math.hypot(p.vx, p.vy);
        const angle = speed > 0.001 ? Math.atan2(p.vy, p.vx) : 0;
        const streakLen = Math.max(4.5, Math.min(24, speed * 0.048) * (0.45 + 0.55 * alpha));
        const dx = Math.cos(angle) * streakLen;
        const dy = Math.sin(angle) * streakLen;
        ctx.lineCap = 'round';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.4, p.size * (0.55 + 0.45 * alpha));
        ctx.beginPath();
        ctx.moveTo(p.x - dx * 0.65, p.y - dy * 0.65);
        ctx.lineTo(p.x + dx * 0.35, p.y + dy * 0.35);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, p.size * 0.38);
        ctx.beginPath();
        ctx.moveTo(p.x - dx * 0.2, p.y - dy * 0.2);
        ctx.lineTo(p.x + dx * 0.35, p.y + dy * 0.35);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawStorm(ctx: CanvasRenderingContext2D, nowMs: number) {
    if (this.mode !== 'royale') return;
    ctx.save();
    if (this.stormRadius < MAX_STORM_RADIUS - 12) {
      const left = this.camX - this.viewWidth / 2 - 40;
      const top = this.camY - this.viewHeight / 2 - 40;
      ctx.beginPath();
      ctx.rect(left, top, this.viewWidth + 80, this.viewHeight + 80);
      ctx.arc(ARENA_CENTER, ARENA_CENTER, this.stormRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(126, 34, 206, 0.24)';
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(217, 70, 239, ${0.65 + Math.sin(nowMs * 0.008) * 0.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ARENA_CENTER, ARENA_CENTER, this.stormRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawFloatTexts(ctx: CanvasRenderingContext2D) {
    for (const f of this.floatTexts) {
      if (!f.active) continue;
      const progress = clamp(1 - f.life / f.maxLife, 0, 1);
      const pop =
        progress < 0.18
          ? 0.72 + Math.sin((progress / 0.18) * Math.PI * 0.65) * 0.52
          : 1;
      const alpha = Math.min(1, (f.life / f.maxLife) * 1.45);
      const fontSize = Math.max(12, Math.round(16 * f.scale * pop));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${f.isCrit ? 900 : 800} ${fontSize}px "Barlow Condensed", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#090e1a';
      ctx.lineWidth = 3.5 + f.scale * 1.3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  private drawPlayerAimReticle(ctx: CanvasRenderingContext2D) {
    const player = this.actors.find((a) => a.isPlayer);
    if (!player || !player.alive) return;

    const cfg = HEROES[player.heroId];
    const isActivelyVirtualAiming = this.virtualAimActive;
    const useMouseReticle = this.hasPointerMoved && !this.touchControlsActive && !isActivelyVirtualAiming;
    const mobileRangePreview = isActivelyVirtualAiming
      ? Math.min(cfg.attackRange, 260)
      : Math.min(cfg.attackRange, 190);
    const worldPtr = useMouseReticle
      ? this.screenToWorld(this.pointerClientX, this.pointerClientY)
      : {
          x: player.x + Math.cos(player.aimAngle) * mobileRangePreview,
          y: player.y + Math.sin(player.aimAngle) * mobileRangePreview,
        };

    const cos = Math.cos(player.aimAngle);
    const sin = Math.sin(player.aimAngle);
    const lineStart = cfg.radius + 18;
    const lineDist = Math.min(cfg.attackRange, distance(player.x, player.y, worldPtr.x, worldPtr.y));

    ctx.save();

    // Hero-anchored directional pointer chevron so attack facing is unmistakable at a glance
    ctx.save();
    ctx.translate(player.x + cos * (cfg.radius + 13), player.y + sin * (cfg.radius + 13));
    ctx.rotate(player.aimAngle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -7);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fillStyle = isActivelyVirtualAiming ? '#fbbf24' : 'rgba(251, 191, 36, 0.88)';
    ctx.strokeStyle = '#090e1a';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    // Aim trajectory dashed beam
    if (lineDist > lineStart) {
      ctx.strokeStyle = isActivelyVirtualAiming
        ? 'rgba(251, 191, 36, 0.75)'
        : this.touchControlsActive
        ? 'rgba(251, 191, 36, 0.42)'
        : 'rgba(248, 250, 252, 0.24)';
      ctx.lineWidth = isActivelyVirtualAiming ? 2.6 : 1.8;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(player.x + cos * lineStart, player.y + sin * lineStart);
      ctx.lineTo(player.x + cos * lineDist, player.y + sin * lineDist);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Target reticle at aim point
    const reticleX = useMouseReticle ? worldPtr.x : player.x + cos * lineDist;
    const reticleY = useMouseReticle ? worldPtr.y : player.y + sin * lineDist;
    ctx.translate(reticleX, reticleY);
    ctx.strokeStyle = isActivelyVirtualAiming ? '#fbbf24' : cfg.accent;
    ctx.lineWidth = isActivelyVirtualAiming ? 2.4 : 1.8;
    ctx.globalAlpha = isActivelyVirtualAiming ? 1 : this.touchControlsActive ? 0.78 : 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, isActivelyVirtualAiming ? 13 : 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-7, 0);
    ctx.moveTo(7, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -7);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();
  }

  public emitHud(force = false) {
    const player = this.actors.find((a) => a.isPlayer);
    const cfg = HEROES[player?.heroId || this.selectedHero];
    const aliveCount = this.actors.filter((a) => a.alive).length;

    const hp = Math.round(player?.hp ?? cfg.maxHp);
    const shield = Math.round(player?.shield ?? 0);
    const cubes = player?.powerCubes ?? 0;
    const ammo = player?.ammo ?? cfg.maxAmmo;
    const reloadBucket = player ? Math.round((player.ammoReloadTimer / cfg.ammoReloadTime) * 5) : 0;
    const comboStep = player?.comboStep ?? 0;
    const qTenths = Math.ceil((player?.qCooldown ?? 0) * 10);
    const eTenths = Math.ceil((player?.eCooldown ?? 0) * 10);
    const fury = Math.round(player?.furyCharge ?? 0);
    const sec = Math.floor(this.elapsedTime);
    const inStorm = player ? isOutsideStorm(player.x, player.y, this.stormRadius) : false;
    const inBush = player?.inBush ?? false;
    const isStealthed = (player?.stealthTimer ?? 0) > 0;
    const respTenths = Math.ceil((player?.respawnTimer ?? 0) * 10);
    const starsHeld = player?.starsHeld ?? 0;
    const allyTower = this.towers.find((t) => t.team === 'ally');
    const enemyTower = this.towers.find((t) => t.team === 'enemy');
    const allyTowerHp = allyTower ? Math.round(allyTower.hp) : 0;
    const allyTowerMaxHp = allyTower ? allyTower.maxHp : 8500;
    const enemyTowerHp = enemyTower ? Math.round(enemyTower.hp) : 0;
    const enemyTowerMaxHp = enemyTower ? enemyTower.maxHp : 8500;
    const starCdTenths = this.starCountdown !== null ? Math.ceil(this.starCountdown * 10) : -1;
    const remSec = Math.ceil(this.timeRemaining);

    const streakId = this.activeKillStreak?.id ?? 0;
    const emoteCooldown = Number(
      getEmoteCooldownRemaining(this.lastPlayerEmoteAtMs, performance.now()).toFixed(1)
    );
    const emoteTenths = Math.ceil(emoteCooldown * 10);
    const dc = this.activeDeathCam;
    const dcKey = dc
      ? `${dc.relation}|${dc.postRespawn ? 1 : 0}|${dc.targetName}|${dc.targetHp}|${dc.targetShield}|${dc.targetKills}|${dc.targetFuryCharge}|${dc.distanceMeters}|${Math.ceil(dc.respawnRemaining * 10)}`
      : 'none';
    const activeSkin = player?.skinId ?? this.selectedSkin;
    const hudKey = `${this.phase}|${this.mode}|${this.mapId}|${player?.heroId || this.selectedHero}|${activeSkin}|${hp}|${shield}|${cubes}|${starsHeld}|${ammo}|${reloadBucket}|${comboStep}|${qTenths}|${eTenths}|${fury}|${aliveCount}|${this.allyScore}|${this.enemyScore}|${allyTowerHp}|${enemyTowerHp}|${starCdTenths}|${this.starLeader}|${remSec}|${sec}|${inStorm}|${inBush}|${isStealthed}|${respTenths}|${this.playerDamageDealt}|${this.lastHitDamage}|${emoteTenths}|${this.killFeed.length}|${streakId}|${dcKey}`;
    if (!force && hudKey === this.lastHudKey) {
      return;
    }
    this.lastHudKey = hudKey;

    this.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      mapId: this.mapId,
      playerHero: player ? player.heroId : this.selectedHero,
      playerSkin: activeSkin,
      hp,
      maxHp: Math.round(player?.maxHp ?? cfg.maxHp),
      ghostHp: Math.round(player?.ghostHp ?? cfg.maxHp),
      shield,
      powerCubes: cubes,
      starsHeld,
      ammo,
      maxAmmo: player?.maxAmmo ?? cfg.maxAmmo,
      ammoReloadProgress: player ? player.ammoReloadTimer / cfg.ammoReloadTime : 0,
      comboStep,
      qCooldown: player?.qCooldown ?? 0,
      qMaxCooldown: cfg.skills.q.cooldown,
      eCooldown: player?.eCooldown ?? 0,
      eMaxCooldown: cfg.skills.e.cooldown,
      furyCharge: fury,
      aliveCount,
      totalCombatants: this.actors.length,
      allyScore: this.allyScore,
      enemyScore: this.enemyScore,
      targetScore: this.targetScore,
      allyTowerHp,
      allyTowerMaxHp,
      enemyTowerHp,
      enemyTowerMaxHp,
      starCountdown: this.starCountdown,
      starLeader: this.starLeader,
      timeRemaining: this.timeRemaining,
      playerKills: player?.kills ?? 0,
      playerDeaths: player?.deaths ?? 0,
      elapsedTime: this.elapsedTime,
      stormRadius: Math.round(this.stormRadius),
      maxStormRadius: MAX_STORM_RADIUS,
      inStorm,
      inBush,
      isStealthed,
      respawnTimer: player?.respawnTimer ?? 0,
      victory: this.victory,
      placement: this.playerPlacement,
      damageDealt: Math.round(this.playerDamageDealt),
      damageTaken: Math.round(this.playerDamageTaken),
      lastHitDamage: this.lastHitDamage,
      emoteCooldown,
      killFeed: [...this.killFeed],
      killStreak: this.activeKillStreak,
      deathCam: this.activeDeathCam ? { ...this.activeDeathCam } : null,
      minimapActors: [],
      minimapCrates: [],
    });
  }
}

export { HERO_LIST };
