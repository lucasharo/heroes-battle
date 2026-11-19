import { ARENA_CENTER, ARENA_SIZE, circleIntersectsRect } from './physics';
import { BushZone, Crate, MapId, Rect } from './types';

export interface ArenaTheme {
  floorBase: string;
  tileCenterEven: string;
  tileCenterOdd: string;
  tileOuterEven: string;
  tileOuterOdd: string;
  bevelLight: string;
  bevelShadow: string;
  techAccent: string;
  conduitMain: string;
  conduitDiag: string;
  medallionRing: string;
  medallionInner: string;
  medallionFill: string;
  rimOuter: string;
  rimAccent: string;
  wallShadow: string;
  wallSide: string;
  wallRib: string;
  wallTop: string;
  wallTopHighlight: string;
  wallInnerDeck: string;
  wallInnerTrim: string;
  wallBolt: string;
  bushShadow: string;
  bushBase: string;
  bushOutline: string;
  bushCanopy: string;
  bushHighlight: string;
}

export interface MapMeta {
  id: MapId;
  name: string;
  shortName: string;
  subtitle: string;
  accent: string;
  theme: ArenaTheme;
}

export interface ArenaMap {
  id: MapId;
  meta: MapMeta;
  size: number;
  walls: Rect[];
  bushes: BushZone[];
  crateSpots: Array<{ x: number; y: number }>;
  royaleSpawns: Array<{ x: number; y: number; aimAngle: number }>;
  brawlAllySpawns: Array<{ x: number; y: number; aimAngle: number }>;
  brawlEnemySpawns: Array<{ x: number; y: number; aimAngle: number }>;
  allyTowerPos: { x: number; y: number };
  enemyTowerPos: { x: number; y: number };
}

export const MAPS_META: Record<MapId, MapMeta> = {
  coliseu: {
    id: 'coliseu',
    name: 'Coliseu Cibernético',
    shortName: 'Coliseu',
    subtitle: 'Arena clássica',
    accent: '#38BDF8',
    theme: {
      floorBase: '#1b2842',
      tileCenterEven: '#2a3d61',
      tileCenterOdd: '#243554',
      tileOuterEven: '#243656',
      tileOuterOdd: '#20304d',
      bevelLight: 'rgba(148, 197, 255, 0.1)',
      bevelShadow: 'rgba(6, 10, 24, 0.32)',
      techAccent: 'rgba(56, 189, 248, 0.12)',
      conduitMain: 'rgba(56, 189, 248, 0.22)',
      conduitDiag: 'rgba(251, 191, 36, 0.12)',
      medallionRing: 'rgba(251, 191, 36, 0.65)',
      medallionInner: 'rgba(56, 189, 248, 0.55)',
      medallionFill: 'rgba(245, 158, 11, 0.12)',
      rimOuter: '#090d16',
      rimAccent: '#f59e0b',
      wallShadow: 'rgba(6, 10, 22, 0.6)',
      wallSide: '#18243c',
      wallRib: '#253657',
      wallTop: '#3d5379',
      wallTopHighlight: '#6b87b8',
      wallInnerDeck: '#2c3d5e',
      wallInnerTrim: 'rgba(56, 189, 248, 0.55)',
      wallBolt: '#fbbf24',
      bushShadow: 'rgba(8, 42, 46, 0.52)',
      bushBase: '#1ea87a',
      bushOutline: '#0d5e5c',
      bushCanopy: '#52d681',
      bushHighlight: '#a3e67e',
    },
  },
  deserto: {
    id: 'deserto',
    name: 'Cânion Solar',
    shortName: 'Cânion',
    subtitle: 'Desfiladeiro aberto',
    accent: '#F97316',
    theme: {
      floorBase: '#3b2416',
      tileCenterEven: '#5c3a23',
      tileCenterOdd: '#4f311d',
      tileOuterEven: '#4a2e1c',
      tileOuterOdd: '#402717',
      bevelLight: 'rgba(253, 186, 116, 0.12)',
      bevelShadow: 'rgba(24, 10, 4, 0.36)',
      techAccent: 'rgba(251, 146, 60, 0.16)',
      conduitMain: 'rgba(245, 158, 11, 0.25)',
      conduitDiag: 'rgba(249, 115, 22, 0.18)',
      medallionRing: 'rgba(251, 191, 36, 0.72)',
      medallionInner: 'rgba(249, 115, 22, 0.6)',
      medallionFill: 'rgba(234, 88, 12, 0.14)',
      rimOuter: '#1c0f08',
      rimAccent: '#fb923c',
      wallShadow: 'rgba(22, 8, 2, 0.6)',
      wallSide: '#5a2210',
      wallRib: '#7c2d12',
      wallTop: '#b45309',
      wallTopHighlight: '#fbbf24',
      wallInnerDeck: '#92400e',
      wallInnerTrim: 'rgba(253, 224, 71, 0.5)',
      wallBolt: '#fef08a',
      bushShadow: 'rgba(18, 24, 6, 0.48)',
      bushBase: '#4d7c0f',
      bushOutline: '#1a2e05',
      bushCanopy: '#65a30d',
      bushHighlight: '#a3e635',
    },
  },
  cyber: {
    id: 'cyber',
    name: 'Laboratório Neon',
    shortName: 'Lab Neon',
    subtitle: 'Rotas táticas neon',
    accent: '#C084FC',
    theme: {
      floorBase: '#120d26',
      tileCenterEven: '#241948',
      tileCenterOdd: '#1c133a',
      tileOuterEven: '#1b1336',
      tileOuterOdd: '#160f2d',
      bevelLight: 'rgba(192, 132, 252, 0.14)',
      bevelShadow: 'rgba(6, 3, 18, 0.42)',
      techAccent: 'rgba(34, 211, 238, 0.15)',
      conduitMain: 'rgba(192, 132, 252, 0.28)',
      conduitDiag: 'rgba(34, 211, 238, 0.2)',
      medallionRing: 'rgba(192, 132, 252, 0.72)',
      medallionInner: 'rgba(34, 211, 238, 0.65)',
      medallionFill: 'rgba(168, 85, 247, 0.14)',
      rimOuter: '#080514',
      rimAccent: '#c084fc',
      wallShadow: 'rgba(6, 3, 18, 0.65)',
      wallSide: '#231347',
      wallRib: '#3b1d70',
      wallTop: '#4c1d95',
      wallTopHighlight: '#a855f7',
      wallInnerDeck: '#2e1065',
      wallInnerTrim: 'rgba(34, 211, 238, 0.62)',
      wallBolt: '#22d3ee',
      bushShadow: 'rgba(4, 24, 28, 0.5)',
      bushBase: '#0f766e',
      bushOutline: '#042f2e',
      bushCanopy: '#14b8a6',
      bushHighlight: '#5eead4',
    },
  },
  templo: {
    id: 'templo',
    name: 'Templo da Selva',
    shortName: 'Templo',
    subtitle: 'Ruínas e emboscadas',
    accent: '#34D399',
    theme: {
      floorBase: '#12241d',
      tileCenterEven: '#1e3a2f',
      tileCenterOdd: '#193228',
      tileOuterEven: '#183026',
      tileOuterOdd: '#142920',
      bevelLight: 'rgba(110, 231, 183, 0.1)',
      bevelShadow: 'rgba(4, 14, 10, 0.36)',
      techAccent: 'rgba(250, 204, 21, 0.12)',
      conduitMain: 'rgba(52, 211, 153, 0.22)',
      conduitDiag: 'rgba(250, 204, 21, 0.16)',
      medallionRing: 'rgba(250, 204, 21, 0.68)',
      medallionInner: 'rgba(52, 211, 153, 0.58)',
      medallionFill: 'rgba(16, 185, 129, 0.12)',
      rimOuter: '#07140e',
      rimAccent: '#10b981',
      wallShadow: 'rgba(4, 14, 10, 0.62)',
      wallSide: '#1c2b24',
      wallRib: '#2b4237',
      wallTop: '#475569',
      wallTopHighlight: '#94a3b8',
      wallInnerDeck: '#334155',
      wallInnerTrim: 'rgba(250, 204, 21, 0.52)',
      wallBolt: '#fde047',
      bushShadow: 'rgba(3, 18, 10, 0.52)',
      bushBase: '#166534',
      bushOutline: '#052e16',
      bushCanopy: '#16a34a',
      bushHighlight: '#4ade80',
    },
  },
};

export const MAP_LIST: MapMeta[] = [
  MAPS_META.coliseu,
  MAPS_META.deserto,
  MAPS_META.cyber,
  MAPS_META.templo,
];

function buildSharedSpawns() {
  const c = ARENA_CENTER;
  const royaleSpawns: Array<{ x: number; y: number; aimAngle: number }> = [];
  const spawnRing = 820;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.round(c + Math.cos(angle) * spawnRing);
    const y = Math.round(c + Math.sin(angle) * spawnRing);
    royaleSpawns.push({
      x,
      y,
      aimAngle: Math.atan2(c - y, c - x),
    });
  }

  const brawlAllySpawns = [
    { x: 210, y: c - 260, aimAngle: 0 },
    { x: 210, y: c - 80, aimAngle: 0 },
    { x: 210, y: c + 80, aimAngle: 0 },
    { x: 210, y: c + 260, aimAngle: 0 },
  ];

  const brawlEnemySpawns = [
    { x: ARENA_SIZE - 210, y: c - 260, aimAngle: Math.PI },
    { x: ARENA_SIZE - 210, y: c - 80, aimAngle: Math.PI },
    { x: ARENA_SIZE - 210, y: c + 80, aimAngle: Math.PI },
    { x: ARENA_SIZE - 210, y: c + 260, aimAngle: Math.PI },
  ];

  return {
    royaleSpawns,
    brawlAllySpawns,
    brawlEnemySpawns,
    allyTowerPos: { x: 380, y: c },
    enemyTowerPos: { x: ARENA_SIZE - 380, y: c },
  };
}

export function createArenaMap(mapId: MapId = 'coliseu'): ArenaMap {
  const c = ARENA_CENTER; // 1100
  const meta = MAPS_META[mapId];
  const spawns = buildSharedSpawns();

  if (mapId === 'deserto') {
    const walls: Rect[] = [
      // Wide canyon ridges flanking the center sun plaza
      { x: c - 360, y: c - 220, w: 140, h: 74 },
      { x: c + 220, y: c - 220, w: 140, h: 74 },
      { x: c - 360, y: c + 146, w: 140, h: 74 },
      { x: c + 220, y: c + 146, w: 140, h: 74 },

      // Twin north/south sandstone monoliths
      { x: c - 64, y: c - 460, w: 128, h: 86 },
      { x: c - 64, y: c + 374, w: 128, h: 86 },

      // Outer diagonal desert mesas (kept clear of towers & royale ring)
      { x: 540, y: 480, w: 130, h: 80 },
      { x: ARENA_SIZE - 670, y: 480, w: 130, h: 80 },
      { x: 540, y: ARENA_SIZE - 560, w: 130, h: 80 },
      { x: ARENA_SIZE - 670, y: ARENA_SIZE - 560, w: 130, h: 80 },

      // Flank guard rocks near side corridors
      { x: 520, y: c - 50, w: 72, h: 100 },
      { x: ARENA_SIZE - 592, y: c - 50, w: 72, h: 100 },
    ];

    const bushes: BushZone[] = [
      { id: 'd-c1', x: c - 170, y: c - 315, w: 340, h: 72 },
      { id: 'd-c2', x: c - 170, y: c + 243, w: 340, h: 72 },
      { id: 'd-w', x: 640, y: c - 140, w: 84, h: 280 },
      { id: 'd-e', x: ARENA_SIZE - 724, y: c - 140, w: 84, h: 280 },
      { id: 'd-nw', x: 350, y: 600, w: 140, h: 140 },
      { id: 'd-ne', x: ARENA_SIZE - 490, y: 600, w: 140, h: 140 },
      { id: 'd-sw', x: 350, y: ARENA_SIZE - 740, w: 140, h: 140 },
      { id: 'd-se', x: ARENA_SIZE - 490, y: ARENA_SIZE - 740, w: 140, h: 140 },
    ];

    const crateSpots = [
      { x: c, y: c - 75 },
      { x: c, y: c + 75 },
      { x: c - 180, y: c },
      { x: c + 180, y: c },
      { x: c - 460, y: c - 340 },
      { x: c + 460, y: c - 340 },
      { x: c - 460, y: c + 340 },
      { x: c + 460, y: c + 340 },
      { x: 320, y: 420 },
      { x: ARENA_SIZE - 320, y: 420 },
      { x: 320, y: ARENA_SIZE - 420 },
      { x: ARENA_SIZE - 320, y: ARENA_SIZE - 420 },
    ];

    return { id: mapId, meta, size: ARENA_SIZE, walls, bushes, crateSpots, ...spawns };
  }

  if (mapId === 'cyber') {
    const walls: Rect[] = [
      // Central cyber-core split barriers (vertical flank cover around mid arena)
      { x: c - 240, y: c - 310, w: 86, h: 170 },
      { x: c + 154, y: c - 310, w: 86, h: 170 },
      { x: c - 240, y: c + 140, w: 86, h: 170 },
      { x: c + 154, y: c + 140, w: 86, h: 170 },

      // Horizontal mid-bridge reactor shields
      { x: c - 95, y: c - 500, w: 190, h: 74 },
      { x: c - 95, y: c + 426, w: 190, h: 74 },

      // Lane choke bunkers (clear of towers at x=380/1820)
      { x: 560, y: c - 240, w: 84, h: 130 },
      { x: 560, y: c + 110, w: 84, h: 130 },
      { x: ARENA_SIZE - 644, y: c - 240, w: 84, h: 130 },
      { x: ARENA_SIZE - 644, y: c + 110, w: 84, h: 130 },

      // Outer cyber vault corners
      { x: 420, y: 380, w: 150, h: 72 },
      { x: ARENA_SIZE - 570, y: 380, w: 150, h: 72 },
      { x: 420, y: ARENA_SIZE - 452, w: 150, h: 72 },
      { x: ARENA_SIZE - 570, y: ARENA_SIZE - 452, w: 150, h: 72 },
    ];

    const bushes: BushZone[] = [
      { id: 'c-top', x: c - 110, y: c - 375, w: 220, h: 86 },
      { id: 'c-bot', x: c - 110, y: c + 289, w: 220, h: 86 },
      { id: 'c-mid-w', x: c - 410, y: c - 95, w: 95, h: 190 },
      { id: 'c-mid-e', x: c + 315, y: c - 95, w: 95, h: 190 },
      { id: 'c-nw', x: 580, y: 510, w: 150, h: 110 },
      { id: 'c-ne', x: ARENA_SIZE - 730, y: 510, w: 150, h: 110 },
      { id: 'c-sw', x: 580, y: ARENA_SIZE - 620, w: 150, h: 110 },
      { id: 'c-se', x: ARENA_SIZE - 730, y: ARENA_SIZE - 620, w: 150, h: 110 },
    ];

    const crateSpots = [
      { x: c - 60, y: c },
      { x: c + 60, y: c },
      { x: c, y: c - 195 },
      { x: c, y: c + 195 },
      { x: c - 350, y: c - 350 },
      { x: c + 350, y: c - 350 },
      { x: c - 350, y: c + 350 },
      { x: c + 350, y: c + 350 },
      { x: 640, y: 310 },
      { x: ARENA_SIZE - 640, y: 310 },
      { x: 640, y: ARENA_SIZE - 310 },
      { x: ARENA_SIZE - 640, y: ARENA_SIZE - 310 },
    ];

    return { id: mapId, meta, size: ARENA_SIZE, walls, bushes, crateSpots, ...spawns };
  }

  if (mapId === 'templo') {
    const walls: Rect[] = [
      // Four ancient stone sanctum L-pillars around center shrine
      { x: c - 300, y: c - 300, w: 130, h: 74 },
      { x: c - 300, y: c - 300, w: 74, h: 130 },

      { x: c + 170, y: c - 300, w: 130, h: 74 },
      { x: c + 226, y: c - 300, w: 74, h: 130 },

      { x: c - 300, y: c + 226, w: 130, h: 74 },
      { x: c - 300, y: c + 170, w: 74, h: 130 },

      { x: c + 170, y: c + 226, w: 130, h: 74 },
      { x: c + 226, y: c + 170, w: 74, h: 130 },

      // Temple outer gate pillars along river lanes
      { x: c - 540, y: c - 260, w: 80, h: 120 },
      { x: c - 540, y: c + 140, w: 80, h: 120 },
      { x: c + 460, y: c - 260, w: 80, h: 120 },
      { x: c + 460, y: c + 140, w: 80, h: 120 },

      // North & South shrine altars
      { x: c - 100, y: 430, w: 200, h: 76 },
      { x: c - 100, y: ARENA_SIZE - 506, w: 200, h: 76 },
    ];

    const bushes: BushZone[] = [
      // Dense jungle stealth patches around center & flanks
      { id: 't-cn', x: c - 150, y: c - 330, w: 300, h: 92 },
      { id: 't-cs', x: c - 150, y: c + 238, w: 300, h: 92 },
      { id: 't-cw', x: c - 440, y: c - 130, w: 100, h: 260 },
      { id: 't-ce', x: c + 340, y: c - 130, w: 100, h: 260 },
      { id: 't-nw', x: 460, y: 490, w: 180, h: 130 },
      { id: 't-ne', x: ARENA_SIZE - 640, y: 490, w: 180, h: 130 },
      { id: 't-sw', x: 460, y: ARENA_SIZE - 620, w: 180, h: 130 },
      { id: 't-se', x: ARENA_SIZE - 640, y: ARENA_SIZE - 620, w: 180, h: 130 },
      { id: 't-w-edge', x: 240, y: c - 150, w: 86, h: 300 },
      { id: 't-e-edge', x: ARENA_SIZE - 326, y: c - 150, w: 86, h: 300 },
    ];

    const crateSpots = [
      { x: c - 52, y: c },
      { x: c + 52, y: c },
      { x: c, y: c - 52 },
      { x: c, y: c + 52 },
      { x: c - 400, y: c - 400 },
      { x: c + 400, y: c - 400 },
      { x: c - 400, y: c + 400 },
      { x: c + 400, y: c + 400 },
      { x: 310, y: 660 },
      { x: ARENA_SIZE - 310, y: 660 },
      { x: 310, y: ARENA_SIZE - 660 },
      { x: ARENA_SIZE - 310, y: ARENA_SIZE - 660 },
    ];

    return { id: mapId, meta, size: ARENA_SIZE, walls, bushes, crateSpots, ...spawns };
  }

  // Default: 'coliseu' — Symmetric cyber-temple arena walls with wide >= 140px corridors
  const walls: Rect[] = [
    { x: c - 260, y: c - 260, w: 96, h: 96 },
    { x: c + 164, y: c - 260, w: 96, h: 96 },
    { x: c - 260, y: c + 164, w: 96, h: 96 },
    { x: c + 164, y: c + 164, w: 96, h: 96 },

    { x: c - 540, y: c - 70, w: 84, h: 140 },
    { x: c + 456, y: c - 70, w: 84, h: 140 },

    { x: c - 70, y: c - 540, w: 140, h: 84 },
    { x: c - 70, y: c + 456, w: 140, h: 84 },

    { x: 340, y: 340, w: 140, h: 72 },
    { x: 340, y: 340, w: 72, h: 140 },

    { x: ARENA_SIZE - 480, y: 340, w: 140, h: 72 },
    { x: ARENA_SIZE - 412, y: 340, w: 72, h: 140 },

    { x: 340, y: ARENA_SIZE - 412, w: 140, h: 72 },
    { x: 340, y: ARENA_SIZE - 480, w: 72, h: 140 },

    { x: ARENA_SIZE - 480, y: ARENA_SIZE - 412, w: 140, h: 72 },
    { x: ARENA_SIZE - 412, y: ARENA_SIZE - 480, w: 72, h: 140 },
  ];

  const bushes: BushZone[] = [
    { id: 'b-c1', x: c - 140, y: c - 360, w: 280, h: 78 },
    { id: 'b-c2', x: c - 140, y: c + 282, w: 280, h: 78 },
    { id: 'b-c3', x: c - 360, y: c - 140, w: 78, h: 280 },
    { id: 'b-c4', x: c + 282, y: c - 140, w: 78, h: 280 },

    { id: 'b-nw', x: 530, y: 470, w: 150, h: 120 },
    { id: 'b-ne', x: ARENA_SIZE - 680, y: 470, w: 150, h: 120 },
    { id: 'b-sw', x: 530, y: ARENA_SIZE - 590, w: 150, h: 120 },
    { id: 'b-se', x: ARENA_SIZE - 680, y: ARENA_SIZE - 590, w: 150, h: 120 },

    { id: 'b-w', x: 240, y: c - 110, w: 130, h: 220 },
    { id: 'b-e', x: ARENA_SIZE - 370, y: c - 110, w: 130, h: 220 },
  ];

  const crateSpots: Array<{ x: number; y: number }> = [
    { x: c - 50, y: c },
    { x: c + 50, y: c },
    { x: c, y: c - 50 },
    { x: c, y: c + 50 },

    { x: c - 380, y: c - 380 },
    { x: c + 380, y: c - 380 },
    { x: c - 380, y: c + 380 },
    { x: c + 380, y: c + 380 },

    { x: 300, y: 650 },
    { x: 650, y: 300 },
    { x: ARENA_SIZE - 300, y: 650 },
    { x: ARENA_SIZE - 650, y: 300 },
    { x: 300, y: ARENA_SIZE - 650 },
    { x: 650, y: ARENA_SIZE - 300 },
    { x: ARENA_SIZE - 300, y: ARENA_SIZE - 650 },
    { x: ARENA_SIZE - 650, y: ARENA_SIZE - 300 },
  ];

  return { id: mapId, meta, size: ARENA_SIZE, walls, bushes, crateSpots, ...spawns };
}

export function createInitialCrates(map: ArenaMap): Crate[] {
  return map.crateSpots.map((spot, idx) => ({
    id: `crate-${idx}`,
    x: spot.x,
    y: spot.y,
    hp: 1400,
    maxHp: 1400,
    hitFlash: 0,
    destroyed: false,
  }));
}

export function isSpawnClearOfWalls(x: number, y: number, radius: number, walls: Rect[]): boolean {
  for (let i = 0; i < walls.length; i++) {
    if (circleIntersectsRect(x, y, radius + 24, walls[i])) {
      return false;
    }
  }
  return true;
}
