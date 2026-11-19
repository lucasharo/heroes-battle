export type HeroTier = 'comum' | 'epico' | 'lendario';

export type HeroId =
  | 'raidon'
  | 'veinka'
  | 'kong'
  | 'phoenix'
  | 'steelshot'
  | 'eldragon'
  | 'cluster'
  | 'velvet'
  | 'meiro'
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

export type HeroSkinId =
  | 'classic'
  | 'chroma'
  | 'solar'
  | 'eclipse'
  | 'vanguard'
  | 'infernal'
  | 'celestial';

export type RankTierId = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'mestre' | 'lendario';

export interface RankingEntry {
  uid: string;
  displayName: string;
  heroId: HeroId;
  trophies: number;
  wins: number;
  matches: number;
  kills: number;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  favoriteHero: HeroId;
  trophies: number;
  wins: number;
  matches: number;
  kills: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type GameMode = 'royale' | 'brawl' | 'superstar' | 'tower';

export interface RecentMatchEntry {
  id: string;
  uid: string;
  victory: boolean;
  heroId: HeroId;
  mode: GameMode;
  kills: number;
  placement: number;
  trophyDelta: number;
  playedAtMs: number;
  createdAt?: unknown;
}

export type MapId = 'coliseu' | 'deserto' | 'cyber' | 'templo';

export type GamePhase = 'title' | 'playing' | 'training' | 'paused' | 'gameover';

export type TeamId = 'ally' | 'enemy' | number;

export interface SkillMeta {
  key: 'LMB' | 'Q' | 'E' | 'R';
  name: string;
  roleTag: string;
  description: string;
  cooldown: number;
  isFury?: boolean;
}

export interface HeroConfig {
  id: HeroId;
  tier: HeroTier;
  name: string;
  title: string;
  role: string;
  archetype: 'ambusher' | 'kiter' | 'brawler' | 'zoner';
  accent: string;
  accentSoft: string;
  armorColor: string;
  secondaryColor: string;
  portraitUrl: string;
  maxHp: number;
  speed: number;
  radius: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  maxAmmo: number;
  ammoReloadTime: number;
  projectileSpeed: number;
  skills: {
    basic: SkillMeta;
    q: SkillMeta;
    e: SkillMeta;
    r: SkillMeta;
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BushZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Crate {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  destroyed: boolean;
}

export interface Pickup {
  id: string;
  kind: 'cube' | 'heal' | 'star';
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  collected: boolean;
}

export interface TowerState {
  id: string;
  team: 'ally' | 'enemy';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  hitFlash: number;
  fireCooldown: number;
  aimAngle: number;
  destroyed: boolean;
}

import type { EmoteId } from './emotes';
import type {
  SkillDashStyle,
  SkillProjectileShape,
  TelegraphVfxVariant,
} from './skillVfx';

export interface TelegraphZone {
  id: string;
  ownerId: string;
  ownerTeam: TeamId;
  heroId?: HeroId;
  vfxVariant?: TelegraphVfxVariant;
  kind: 'orbital' | 'meteor' | 'slam' | 'trap' | 'fire_ring';
  x: number;
  y: number;
  radius: number;
  elapsed: number;
  duration: number;
  damage: number;
  slowDuration?: number;
  stunDuration?: number;
  burnDuration?: number;
  pullForce?: number;
  healZoneAmount?: number;
  revealDuration?: number;
  isUltimate?: boolean;
  furyGainScale?: number;
  triggered: boolean;
  tickTimer?: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  ownerTeam: TeamId;
  heroId: HeroId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  maxDist: number;
  traveled: number;
  color: string;
  secondaryColor?: string;
  vfxShape?: SkillProjectileShape;
  piercing: boolean;
  hitIds: string[];
  slowDuration?: number;
  aoeRadius?: number;
  isSkill?: boolean;
  comboStage?: number;
  burnDuration?: number;
  shieldBreak?: number;
  revealDuration?: number;
  lifestealPct?: number;
  healOnHeroHit?: number;
  furyGainOnHit?: number;
  executeBelowHpPct?: number;
  maxRangeBonusPct?: number;
  splitBomblets?: number;
  isUltimate?: boolean;
  furyGainScale?: number;
}

export interface ActorState {
  id: string;
  name: string;
  heroId: HeroId;
  skinId?: HeroSkinId;
  isPlayer: boolean;
  team: TeamId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  aimAngle: number;
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  powerCubes: number;
  starsHeld: number;
  kills: number;
  deaths: number;
  ammo: number;
  maxAmmo: number;
  ammoReloadTimer: number;
  attackLockout: number;
  qCooldown: number;
  eCooldown: number;
  furyCharge: number; // 0 to 100
  stealthTimer: number;
  speedBoostTimer: number;
  eVfxTimer: number;
  activeDashStyle?: SkillDashStyle;
  slowTimer: number;
  stunTimer: number;
  burnTimer: number;
  burnTickTimer: number;
  hitFlash: number;
  dashTimer: number;
  dashVx: number;
  dashVy: number;
  dashDamage: number;
  dashHitIds: string[];
  walkPhase: number;
  squashX: number;
  squashY: number;
  attackSwingTimer: number;
  comboStep: number;
  comboWindowTimer: number;
  comboTapQueue: number;
  alive: boolean;
  koTimer: number;
  respawnTimer: number;
  inBush: boolean;
  revealedTimer: number;
  aiThinkTimer: number;
  aiStrafeDir: number;
  aiTargetId: string | null;
  isDummy?: boolean;
  dummyRegenTimer?: number;
  homeX?: number;
  homeY?: number;
  visualLeapStartX?: number;
  visualLeapStartY?: number;
  visualLeapTimer?: number;
  visualLeapDuration?: number;
  visualLeapHeight?: number;
  activeEmote?: {
    id: EmoteId;
    startedAtMs: number;
    expiresAtMs: number;
  } | null;
}

export interface KillFeedItem {
  id: number;
  killerName: string;
  killerHero: HeroId;
  victimName: string;
  victimHero: HeroId;
  timestamp: number;
}

export type KillStreakTier = 'double' | 'triple' | 'quadra' | 'godlike';

export interface KillStreakAnnouncement {
  id: number;
  count: number;
  title: string;
  subtitle: string;
  tier: KillStreakTier;
  accent: string;
}

export type DeathCamRelation = 'killer' | 'teammate';

export interface DeathCamSnapshot {
  active: boolean;
  postRespawn: boolean;
  relation: DeathCamRelation;
  targetName: string;
  targetHero: HeroId;
  targetHp: number;
  targetMaxHp: number;
  targetShield: number;
  targetPowerCubes: number;
  targetKills: number;
  targetFuryCharge: number;
  distanceMeters: number;
  respawnRemaining: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  mapId: MapId;
  playerHero: HeroId;
  playerSkin: HeroSkinId;
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  powerCubes: number;
  starsHeld: number;
  ammo: number;
  maxAmmo: number;
  ammoReloadProgress: number;
  comboStep: number;
  qCooldown: number;
  qMaxCooldown: number;
  eCooldown: number;
  eMaxCooldown: number;
  furyCharge: number;
  aliveCount: number;
  totalCombatants: number;
  allyScore: number;
  enemyScore: number;
  targetScore: number;
  allyTowerHp: number;
  allyTowerMaxHp: number;
  enemyTowerHp: number;
  enemyTowerMaxHp: number;
  starCountdown: number | null;
  starLeader: 'ally' | 'enemy' | null;
  timeRemaining: number;
  playerKills: number;
  playerDeaths: number;
  elapsedTime: number;
  stormRadius: number;
  maxStormRadius: number;
  inStorm: boolean;
  inBush: boolean;
  isStealthed: boolean;
  respawnTimer: number;
  victory: boolean;
  placement: number;
  damageDealt: number;
  damageTaken: number;
  lastHitDamage: number;
  emoteCooldown: number;
  killFeed: KillFeedItem[];
  killStreak: KillStreakAnnouncement | null;
  deathCam: DeathCamSnapshot | null;
  minimapActors: Array<{
    x: number;
    y: number;
    isPlayer: boolean;
    isAlly: boolean;
    visible: boolean;
  }>;
  minimapCrates: Array<{ x: number; y: number }>;
}
