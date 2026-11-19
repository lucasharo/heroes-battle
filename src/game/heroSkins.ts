import { HEROES } from './heroes';
import { HeroMasteryProgress, computeHeroMasteryProgress, HeroMasteryStats } from './heroMastery';
import { HeroId, HeroSkinId } from './types';

export type SkinRarityLabel =
  | 'Padrão'
  | 'Inicial'
  | 'Épica'
  | 'Lendária'
  | 'Passe de Batalha';

export type SkinUnlockSource = 'default' | 'mastery' | 'battlepass';

export interface HeroSkinSpec {
  id: HeroSkinId;
  name: string;
  subtitle: string;
  rarity: SkinRarityLabel;
  unlockSource: SkinUnlockSource;
  accentColor: string;
  secondaryColor: string;
  portraitFilter: string;
  canvasFilter: string;
  auraColor: string | null;
  requiredPoints: number;
  requiredMasteryLevel: number;
  battlePassTier?: number;
  unlockHint: string;
}

export type HeroSkinsMap = Partial<Record<HeroId, HeroSkinId>>;

export const VALID_HERO_SKIN_IDS: readonly HeroSkinId[] = [
  'classic',
  'chroma',
  'solar',
  'eclipse',
  'vanguard',
  'infernal',
  'celestial',
] as const;

export const SKIN_UNLOCK_POINTS: Record<HeroSkinId, number> = {
  classic: 0,
  chroma: 0,
  solar: 60,
  eclipse: 180,
  vanguard: 0,
  infernal: 0,
  celestial: 0,
};

const CHROMA_SKIN_TITLES: Record<HeroId, { name: string; subtitle: string }> = {
  raidon: { name: 'Fúria Cibernética', subtitle: 'Traje prismático magenta com lâminas ionizadas.' },
  veinka: { name: 'Vingança Esmeralda', subtitle: 'Blindagem ágil de plasma esmeralda noturno.' },
  kong: { name: 'Titã Cobalto', subtitle: 'Armadura pesada reenergizada com núcleo azul.' },
  phoenix: { name: 'Chama Espectral', subtitle: 'Fogo arcano azulado com penas incandescentes.' },
  steelshot: { name: 'Pulso Carmesim', subtitle: 'Fuzileiro tático com visor e armadura neon.' },
  eldragon: { name: 'Escama Safira', subtitle: 'Couro dracônico energizado com faíscas frias.' },
  cluster: { name: 'Carga Tóxica', subtitle: 'Canhão de demolição com núcleo reativo verde.' },
  velvet: { name: 'Zero Absoluto', subtitle: 'Cristais árticos em espectro ultravioleta.' },
  meiro: { name: 'Lâmina Neon', subtitle: 'Katana vibracional de alta frequência.' },
  baston: { name: 'Guardião Elétrico', subtitle: 'Escudo balístico com bobinas de alta tensão.' },
  nina: { name: 'Estrela Synth', subtitle: 'Propulsores retrô-futuristas em néon vivo.' },
  drake: { name: 'Caçador Glacial', subtitle: 'Mira térmica calibrada para combate polar.' },
  knox: { name: 'Morteiro Arcano', subtitle: 'Munição alquímica com brilho violeta.' },
  kairo: { name: 'Fluxo Astral', subtitle: 'Punhos etéreos de energia estelar pura.' },
  boulder: { name: 'Granito Rúnico', subtitle: 'Rochas ancestrais com veios de mana.' },
  ryder: { name: 'Interceptador Ácido', subtitle: 'Engrenagens velozes com trilha fosforescente.' },
  solara: { name: 'Aurora Boreal', subtitle: 'Raios prismáticos com reflexos turquesa.' },
  frost: { name: 'Vórtice Rubi', subtitle: 'Cristalização térmica em espectro carmesim.' },
  valkyria: { name: 'Valquíria Vênus', subtitle: 'Asas energizadas com lâmina aurora.' },
  kronos: { name: 'Paradoxo Turquesa', subtitle: 'Cronômetro dimensional em fase invertida.' },
  titanx: { name: 'Protocolo Plasma', subtitle: 'Núcleo experimental de fusão esmeralda.' },
};

const BATTLE_PASS_SKIN_HERO_HINT: Record<'vanguard' | 'infernal' | 'celestial', Partial<Record<HeroId, string>>> = {
  vanguard: {
    steelshot: 'Passe Temp. 1 · Patamar 2 (Grátis)',
    raidon: 'Passe Temp. 1 · Patamar 2 (Grátis)',
    nina: 'Passe Temp. 1 · Patamar 2 (Grátis)',
    phoenix: 'Passe Temp. 1 · Patamar 2 (Elite)',
    valkyria: 'Passe Temp. 1 · Patamar 6 (Grátis)',
    meiro: 'Passe Temp. 1 · Patamar 2 (Elite)',
    velvet: 'Passe Temp. 1 · Patamar 2 (Elite)',
    kong: 'Passe Temp. 1 · Patamar 6 (Grátis)',
    frost: 'Passe Temp. 1 · Patamar 6 (Grátis)',
    kronos: 'Passe Temp. 1 · Patamar 6 (Grátis)',
  },
  infernal: {
    phoenix: 'Passe Temp. 1 · Patamar 4 (Grátis)',
    eldragon: 'Passe Temp. 1 · Patamar 4 (Grátis)',
    baston: 'Passe Temp. 1 · Patamar 4 (Grátis)',
    steelshot: 'Passe Temp. 1 · Patamar 6 (Elite)',
    raidon: 'Passe Temp. 1 · Patamar 6 (Elite)',
    meiro: 'Passe Temp. 1 · Patamar 6 (Elite)',
    velvet: 'Passe Temp. 1 · Patamar 6 (Elite)',
    cluster: 'Passe Temp. 1 · Patamar 8 (Grátis)',
    drake: 'Passe Temp. 1 · Patamar 8 (Grátis)',
    knox: 'Passe Temp. 1 · Patamar 8 (Grátis)',
    kairo: 'Passe Temp. 1 · Patamar 8 (Grátis)',
  },
  celestial: {
    valkyria: 'Passe Temp. 1 · Patamar 10 (Grátis)',
    kronos: 'Passe Temp. 1 · Patamar 10 (Grátis)',
    solara: 'Passe Temp. 1 · Patamar 10 (Grátis)',
    steelshot: 'Passe Temp. 1 · Patamar 10 (Elite)',
    phoenix: 'Passe Temp. 1 · Patamar 10 (Elite)',
    raidon: 'Passe Temp. 1 · Patamar 10 (Elite)',
    kong: 'Passe Temp. 1 · Patamar 10 (Elite)',
    titanx: 'Passe Temp. 1 · Patamar 12 (Grátis)',
    veinka: 'Passe Temp. 1 · Patamar 12 (Grátis)',
    ryder: 'Passe Temp. 1 · Patamar 12 (Grátis)',
    boulder: 'Passe Temp. 1 · Patamar 12 (Grátis)',
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return [56, 189, 248];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clampByte(r), clampByte(g), clampByte(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rotateHexHue(hex: string, deg: number): string {
  const [r0, g0, b0] = hexToRgb(hex);
  const r = r0 / 255;
  const g = g0 / 255;
  const b = b0 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  h = (h + deg + 360) % 360;
  const boostedS = Math.min(0.95, Math.max(0.55, s));
  const balancedL = Math.min(0.68, Math.max(0.48, l));

  const c = (1 - Math.abs(2 * balancedL - 1)) * boostedS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = balancedL - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

export function isValidHeroSkinId(value: unknown): value is HeroSkinId {
  return (
    typeof value === 'string' &&
    (VALID_HERO_SKIN_IDS as readonly string[]).includes(value)
  );
}

export function isBattlePassCosmeticUnlocked(
  heroId: HeroId,
  skinId: HeroSkinId,
  unlockedCosmetics?: readonly string[] | null
): boolean {
  if (!unlockedCosmetics || unlockedCosmetics.length === 0) return false;
  return (
    unlockedCosmetics.includes(`${heroId}:${skinId}`) ||
    unlockedCosmetics.includes(`all:${skinId}`)
  );
}

export function getHeroSkinCatalog(heroId: HeroId): readonly HeroSkinSpec[] {
  const hero = HEROES[heroId];
  const chromaTitle = CHROMA_SKIN_TITLES[heroId];
  const chromaAccent = rotateHexHue(hero.accent, 145);
  const chromaSecondary = rotateHexHue(hero.secondaryColor, 145);

  return [
    {
      id: 'classic',
      name: 'Clássico',
      subtitle: 'Visual oficial padrão da Arena com cores originais.',
      rarity: 'Padrão',
      unlockSource: 'default',
      accentColor: hero.accent,
      secondaryColor: hero.secondaryColor,
      portraitFilter: 'none',
      canvasFilter: 'none',
      auraColor: null,
      requiredPoints: 0,
      requiredMasteryLevel: 1,
      unlockHint: 'Desbloqueada inicialmente',
    },
    {
      id: 'chroma',
      name: chromaTitle.name,
      subtitle: chromaTitle.subtitle,
      rarity: 'Inicial',
      unlockSource: 'default',
      accentColor: chromaAccent,
      secondaryColor: chromaSecondary,
      portraitFilter: 'hue-rotate(145deg) saturate(1.38) brightness(1.05)',
      canvasFilter: 'hue-rotate(145deg) saturate(1.38) brightness(1.05)',
      auraColor: chromaAccent,
      requiredPoints: 0,
      requiredMasteryLevel: 1,
      unlockHint: 'Grátis para equipar',
    },
    {
      id: 'solar',
      name: 'Forja Solar',
      subtitle: 'Armadura banhada a ouro imperial com brilho incandescente.',
      rarity: 'Épica',
      unlockSource: 'mastery',
      accentColor: '#FBBF24',
      secondaryColor: '#F97316',
      portraitFilter: 'sepia(0.55) hue-rotate(-8deg) saturate(2.1) brightness(1.08) contrast(1.05)',
      canvasFilter: 'sepia(0.55) hue-rotate(-8deg) saturate(2.1) brightness(1.08) contrast(1.05)',
      auraColor: '#FBBF24',
      requiredPoints: SKIN_UNLOCK_POINTS.solar,
      requiredMasteryLevel: 2,
      unlockHint: 'Maestria Nv.2 (60 pts)',
    },
    {
      id: 'eclipse',
      name: 'Eclipse Sombrio',
      subtitle: 'Espectro abissal violeta com aura de alta intensidade.',
      rarity: 'Lendária',
      unlockSource: 'mastery',
      accentColor: '#C084FC',
      secondaryColor: '#FB7185',
      portraitFilter: 'hue-rotate(250deg) saturate(1.5) contrast(1.16) brightness(0.92)',
      canvasFilter: 'hue-rotate(250deg) saturate(1.5) contrast(1.16) brightness(0.92)',
      auraColor: '#C084FC',
      requiredPoints: SKIN_UNLOCK_POINTS.eclipse,
      requiredMasteryLevel: 3,
      unlockHint: 'Maestria Nv.3 (180 pts)',
    },
    {
      id: 'vanguard',
      name: 'Vanguarda Cibernética',
      subtitle: 'Edição sazonal com blindagem de cobalto ionizado e visor turquesa.',
      rarity: 'Passe de Batalha',
      unlockSource: 'battlepass',
      accentColor: '#22D3EE',
      secondaryColor: '#3B82F6',
      portraitFilter: 'hue-rotate(185deg) saturate(1.45) contrast(1.08) brightness(1.04)',
      canvasFilter: 'hue-rotate(185deg) saturate(1.45) contrast(1.08) brightness(1.04)',
      auraColor: '#22D3EE',
      requiredPoints: 0,
      requiredMasteryLevel: 1,
      battlePassTier: 4,
      unlockHint:
        BATTLE_PASS_SKIN_HERO_HINT.vanguard[heroId] ??
        'Passe Temp. 1 · Patamar 4 (Elite)',
    },
    {
      id: 'infernal',
      name: 'Forja Infernal',
      subtitle: 'Armadura sazonal carmesim forjada em plasma vulcânico.',
      rarity: 'Passe de Batalha',
      unlockSource: 'battlepass',
      accentColor: '#FB7185',
      secondaryColor: '#F97316',
      portraitFilter: 'sepia(0.35) hue-rotate(-35deg) saturate(1.9) contrast(1.12) brightness(1.02)',
      canvasFilter: 'sepia(0.35) hue-rotate(-35deg) saturate(1.9) contrast(1.12) brightness(1.02)',
      auraColor: '#FB7185',
      requiredPoints: 0,
      requiredMasteryLevel: 1,
      battlePassTier: 8,
      unlockHint:
        BATTLE_PASS_SKIN_HERO_HINT.infernal[heroId] ??
        'Passe Temp. 1 · Patamar 8 (Elite)',
    },
    {
      id: 'celestial',
      name: 'Ápice Celestial',
      subtitle: 'Skin suprema da Temporada 1 com aura estelar dourada e celeste.',
      rarity: 'Passe de Batalha',
      unlockSource: 'battlepass',
      accentColor: '#FDE047',
      secondaryColor: '#38BDF8',
      portraitFilter: 'saturate(1.55) contrast(1.14) brightness(1.1)',
      canvasFilter: 'saturate(1.55) contrast(1.14) brightness(1.1)',
      auraColor: '#FDE047',
      requiredPoints: 0,
      requiredMasteryLevel: 1,
      battlePassTier: 12,
      unlockHint:
        BATTLE_PASS_SKIN_HERO_HINT.celestial[heroId] ??
        'Passe Temp. 1 · Patamar 12 (Elite)',
    },
  ];
}

export function getHeroSkinSpec(
  heroId: HeroId,
  skinId?: HeroSkinId | null
): HeroSkinSpec {
  const catalog = getHeroSkinCatalog(heroId);
  if (!skinId) return catalog[0];
  return catalog.find((s) => s.id === skinId) ?? catalog[0];
}

export function isHeroSkinUnlocked(
  skin: HeroSkinSpec,
  masteryPoints: number,
  heroId?: HeroId,
  unlockedCosmetics?: readonly string[] | null
): boolean {
  if (skin.unlockSource === 'battlepass') {
    if (!heroId) return false;
    return isBattlePassCosmeticUnlocked(heroId, skin.id, unlockedCosmetics);
  }
  return masteryPoints >= skin.requiredPoints;
}

export function getUnlockedHeroSkinIds(
  heroId: HeroId,
  mastery?: Partial<HeroMasteryStats> | HeroMasteryProgress | null,
  unlockedCosmetics?: readonly string[] | null
): HeroSkinId[] {
  const progress =
    mastery && 'points' in mastery
      ? mastery
      : computeHeroMasteryProgress(heroId, mastery as Partial<HeroMasteryStats> | null);
  return getHeroSkinCatalog(heroId)
    .filter((skin) =>
      isHeroSkinUnlocked(skin, progress.points, heroId, unlockedCosmetics)
    )
    .map((skin) => skin.id);
}

export function resolveEquippedHeroSkin(
  heroId: HeroId,
  savedSkinId?: unknown,
  mastery?: Partial<HeroMasteryStats> | HeroMasteryProgress | null,
  unlockedCosmetics?: readonly string[] | null
): HeroSkinSpec {
  const catalog = getHeroSkinCatalog(heroId);
  if (!isValidHeroSkinId(savedSkinId)) return catalog[0];
  const progress =
    mastery && 'points' in mastery
      ? mastery
      : computeHeroMasteryProgress(heroId, mastery as Partial<HeroMasteryStats> | null);
  const found = catalog.find((s) => s.id === savedSkinId);
  if (
    !found ||
    !isHeroSkinUnlocked(found, progress.points, heroId, unlockedCosmetics)
  ) {
    return catalog[0];
  }
  return found;
}

export function equipHeroSkin(
  skinsMap: HeroSkinsMap,
  heroId: HeroId,
  skinId: HeroSkinId,
  mastery?: Partial<HeroMasteryStats> | HeroMasteryProgress | null,
  unlockedCosmetics?: readonly string[] | null
): { nextMap: HeroSkinsMap; equipped: boolean; skin: HeroSkinSpec } {
  const catalog = getHeroSkinCatalog(heroId);
  const target = catalog.find((s) => s.id === skinId) ?? catalog[0];
  const progress =
    mastery && 'points' in mastery
      ? mastery
      : computeHeroMasteryProgress(heroId, mastery as Partial<HeroMasteryStats> | null);

  if (!isHeroSkinUnlocked(target, progress.points, heroId, unlockedCosmetics)) {
    return {
      nextMap: skinsMap,
      equipped: false,
      skin: resolveEquippedHeroSkin(
        heroId,
        skinsMap[heroId],
        progress,
        unlockedCosmetics
      ),
    };
  }

  return {
    nextMap: {
      ...skinsMap,
      [heroId]: target.id,
    },
    equipped: true,
    skin: target,
  };
}

export function sanitizeHeroSkinsMap(raw: unknown): HeroSkinsMap {
  if (!raw || typeof raw !== 'object') return {};
  const result: HeroSkinsMap = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== 'string' || !(key in HEROES)) continue;
    if (!isValidHeroSkinId(val)) continue;
    result[key as HeroId] = val;
  }
  return result;
}

export function mergeHeroSkinsMaps(
  localMap: HeroSkinsMap,
  remoteMap: HeroSkinsMap
): HeroSkinsMap {
  return {
    ...sanitizeHeroSkinsMap(localMap),
    ...sanitizeHeroSkinsMap(remoteMap),
  };
}
