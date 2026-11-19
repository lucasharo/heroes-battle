import { HeroId } from './types';

export type SkillQKind = 'dash_trail' | 'projectile' | 'aoe_zone' | 'trap_mine';
export type SkillEKind = 'stealth_buff' | 'trap_backflip' | 'shield_aura' | 'dash_buff';
export type SkillRKind = 'radial_burst' | 'orbital_strike' | 'leap_slam' | 'barrage' | 'fan_volley';

export type SkillCastRingStyle =
  | 'shockwave'
  | 'starburst'
  | 'rune_circle'
  | 'shock_diamond'
  | 'sonic_cone'
  | 'lightning_crown'
  | 'tech_grid'
  | 'petal_vortex'
  | 'chrono_gears'
  | 'flame_crown'
  | 'void_iris';

export type SkillDecalStyle =
  | 'magma_crater'
  | 'tectonic_cracks'
  | 'frost_fracture'
  | 'solar_mandala'
  | 'clock_sigil'
  | 'void_scar'
  | 'tech_hex'
  | 'sakura_slash'
  | 'acid_pool'
  | 'sniper_reticle'
  | 'storm_burn';

export type SkillRSignature =
  | 'cyber_shuriken_nova'
  | 'orbital_ion_beam'
  | 'leap_fissure_web'
  | 'sky_meteor_impact'
  | 'triple_hyper_rail'
  | 'dragon_claw_meteor'
  | 'carpet_bomb_drop'
  | 'gravity_singularity'
  | 'sakura_x_slash'
  | 'hex_shield_dome'
  | 'acid_vapor_fan'
  | 'satellite_lock_beam'
  | 'volcanic_geysers'
  | 'chain_lightning_storm'
  | 'basalt_monoliths'
  | 'dimensional_void_tear'
  | 'celestial_sun_pillar'
  | 'cryo_icicle_cyclone'
  | 'angelic_wing_spears'
  | 'clockwork_time_collapse'
  | 'thermobaric_missile_salvo';

export type SkillProjectileShape =
  // Q signature shapes
  | 'rail_lance'
  | 'pulse_grenade'
  | 'frost_prism'
  | 'venom_dart'
  | 'mag_slug'
  | 'cryo_spear'
  | 'chrono_ray'
  // Basic & R signature shapes
  | 'twin_needle'
  | 'crossbow_bolt'
  | 'fire_orb'
  | 'plasma_cannon'
  | 'mortar_shell'
  | 'astral_lance'
  | 'neon_smg'
  | 'sniper_slug'
  | 'lava_canister'
  | 'void_boomerang'
  | 'solar_orb'
  | 'ice_shard'
  | 'chrono_orb'
  | 'mecha_rocket'
  | 'shuriken_star'
  | 'katana_crescent'
  | 'lightning_orb'
  | 'halberd_lance'
  | 'void_blade'
  | 'hyper_rail'
  | 'acid_fan'
  | 'bomblet';

export type SlashArcStyle =
  | 'seismic_hammer'
  | 'dragon_claw'
  | 'katana_crimson'
  | 'electric_baton'
  | 'voltaic_palm'
  | 'magma_fist'
  | 'halberd_sweep';

export type SkillZoneVariant =
  | 'phoenix_vortex'
  | 'solar_sanctuary'
  | 'seismic_mine'
  | 'powder_mine'
  | 'crimson_snare';

export type SkillRVariant =
  | 'raidon_shuriken'
  | 'crimson_orbital'
  | 'kong_fissure'
  | 'phoenix_meteor'
  | 'hyper_rail'
  | 'dragon_slam'
  | 'cluster_artillery'
  | 'velvet_supernova'
  | 'meiro_crest'
  | 'baston_aegis'
  | 'neon_fan'
  | 'drake_predator'
  | 'knox_volcano'
  | 'kairo_storm'
  | 'boulder_tectonic'
  | 'ryder_void'
  | 'solara_pillar'
  | 'frost_blizzard'
  | 'valkyria_halo'
  | 'kronos_collapse'
  | 'titanx_barrage';

export type TelegraphVfxVariant = SkillZoneVariant | SkillRVariant;

export type SkillDashStyle =
  | 'lightning_arc'
  | 'titan_ram'
  | 'dragon_uppercut'
  | 'katana_wave'
  | 'valkyrie_wings'
  | 'void_rift'
  | 'voltaic_step'
  | 'aegis_bash'
  | 'avalanche_rock'
  | 'mecha_thruster'
  | 'phoenix_wings'
  | 'cosmic_blink'
  | 'neon_skates'
  | 'thruster_recoil'
  | 'blast_recoil'
  | 'chrono_warp'
  | 'firework_recoil'
  | 'cryo_slide'
  | 'stealth_recoil'
  | 'snare_backflip';

export type SkillAuraStyle =
  | 'shadow_cloak'
  | 'crimson_snare'
  | 'titan_plates'
  | 'phoenix_wings'
  | 'thruster_shield'
  | 'flame_guard'
  | 'blast_jump'
  | 'cosmic_blink'
  | 'samurai_stance'
  | 'hex_barrier'
  | 'neon_skates'
  | 'tactical_cloak'
  | 'firework_jump'
  | 'zen_aura'
  | 'basalt_skin'
  | 'eclipse_veil'
  | 'solar_blessing'
  | 'crystal_armor'
  | 'redemption_wings'
  | 'chrono_warp'
  | 'reactor_overdrive';

export interface SkillBasicVfxSpec {
  primaryColor: string;
  secondaryColor: string;
  projectileShape?: SkillProjectileShape;
  slashStyle?: SlashArcStyle;
}

export interface SkillQVfxSpec {
  kind: SkillQKind;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  castRingStyle: SkillCastRingStyle;
  projectileShape?: SkillProjectileShape;
  zoneVariant?: SkillZoneVariant;
  dashStyle?: SkillDashStyle;
}

export interface SkillEVfxSpec {
  kind: SkillEKind;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  castRingStyle: SkillCastRingStyle;
  auraStyle: SkillAuraStyle;
  dashStyle?: SkillDashStyle;
  zoneVariant?: SkillZoneVariant;
}

export interface SkillRVfxSpec {
  kind: SkillRKind;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  castRingStyle: SkillCastRingStyle;
  rVariant: SkillRVariant;
  signatureEffect: SkillRSignature;
  decalStyle: SkillDecalStyle;
  projectileShape?: SkillProjectileShape;
}

export interface HeroSkillVfxSpec {
  heroId: HeroId;
  basic: SkillBasicVfxSpec;
  q: SkillQVfxSpec;
  e: SkillEVfxSpec;
  r: SkillRVfxSpec;
}

export const HERO_SKILL_VFX: Record<HeroId, HeroSkillVfxSpec> = {
  raidon: {
    heroId: 'raidon',
    basic: {
      primaryColor: '#22d3ee',
      secondaryColor: '#ecfeff',
      projectileShape: 'twin_needle',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#22d3ee',
      secondaryColor: '#ecfeff',
      glowColor: 'rgba(34, 211, 238, 0.45)',
      castRingStyle: 'lightning_crown',
      dashStyle: 'lightning_arc',
    },
    e: {
      kind: 'stealth_buff',
      primaryColor: '#38bdf8',
      secondaryColor: '#0f172a',
      glowColor: 'rgba(56, 189, 248, 0.38)',
      castRingStyle: 'void_iris',
      auraStyle: 'shadow_cloak',
    },
    r: {
      kind: 'radial_burst',
      primaryColor: '#22d3ee',
      secondaryColor: '#cffafe',
      glowColor: 'rgba(34, 211, 238, 0.55)',
      castRingStyle: 'starburst',
      rVariant: 'raidon_shuriken',
      signatureEffect: 'cyber_shuriken_nova',
      decalStyle: 'sakura_slash',
      projectileShape: 'shuriken_star',
    },
  },
  veinka: {
    heroId: 'veinka',
    basic: {
      primaryColor: '#f43f5e',
      secondaryColor: '#ffe4e6',
      projectileShape: 'crossbow_bolt',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#fb7185',
      secondaryColor: '#fff1f2',
      glowColor: 'rgba(244, 63, 94, 0.48)',
      castRingStyle: 'sonic_cone',
      projectileShape: 'rail_lance',
    },
    e: {
      kind: 'trap_backflip',
      primaryColor: '#f43f5e',
      secondaryColor: '#fda4af',
      glowColor: 'rgba(244, 63, 94, 0.42)',
      castRingStyle: 'petal_vortex',
      auraStyle: 'crimson_snare',
      dashStyle: 'snare_backflip',
      zoneVariant: 'crimson_snare',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#f43f5e',
      secondaryColor: '#fecdd3',
      glowColor: 'rgba(244, 63, 94, 0.58)',
      castRingStyle: 'shock_diamond',
      rVariant: 'crimson_orbital',
      signatureEffect: 'orbital_ion_beam',
      decalStyle: 'sniper_reticle',
    },
  },
  kong: {
    heroId: 'kong',
    basic: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef08a',
      slashStyle: 'seismic_hammer',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#f59e0b',
      secondaryColor: '#fef08a',
      glowColor: 'rgba(245, 158, 11, 0.46)',
      castRingStyle: 'sonic_cone',
      dashStyle: 'titan_ram',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#fbbf24',
      secondaryColor: '#34d399',
      glowColor: 'rgba(251, 191, 36, 0.45)',
      castRingStyle: 'tech_grid',
      auraStyle: 'titan_plates',
    },
    r: {
      kind: 'leap_slam',
      primaryColor: '#f59e0b',
      secondaryColor: '#fef08a',
      glowColor: 'rgba(245, 158, 11, 0.56)',
      castRingStyle: 'shockwave',
      rVariant: 'kong_fissure',
      signatureEffect: 'leap_fissure_web',
      decalStyle: 'tectonic_cracks',
    },
  },
  phoenix: {
    heroId: 'phoenix',
    basic: {
      primaryColor: '#fb923c',
      secondaryColor: '#fef08a',
      projectileShape: 'fire_orb',
    },
    q: {
      kind: 'aoe_zone',
      primaryColor: '#fb923c',
      secondaryColor: '#fde047',
      glowColor: 'rgba(251, 146, 60, 0.5)',
      castRingStyle: 'flame_crown',
      zoneVariant: 'phoenix_vortex',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#f97316',
      secondaryColor: '#fef08a',
      glowColor: 'rgba(249, 115, 22, 0.48)',
      castRingStyle: 'flame_crown',
      auraStyle: 'phoenix_wings',
      dashStyle: 'phoenix_wings',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#fb923c',
      secondaryColor: '#fef08a',
      glowColor: 'rgba(249, 115, 22, 0.6)',
      castRingStyle: 'flame_crown',
      rVariant: 'phoenix_meteor',
      signatureEffect: 'sky_meteor_impact',
      decalStyle: 'magma_crater',
    },
  },
  steelshot: {
    heroId: 'steelshot',
    basic: {
      primaryColor: '#38bdf8',
      secondaryColor: '#fbbf24',
      projectileShape: 'plasma_cannon',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#fbbf24',
      secondaryColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.48)',
      castRingStyle: 'tech_grid',
      projectileShape: 'pulse_grenade',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#38bdf8',
      secondaryColor: '#e0f2fe',
      glowColor: 'rgba(56, 189, 248, 0.45)',
      castRingStyle: 'sonic_cone',
      auraStyle: 'thruster_shield',
      dashStyle: 'thruster_recoil',
    },
    r: {
      kind: 'fan_volley',
      primaryColor: '#38bdf8',
      secondaryColor: '#fde047',
      glowColor: 'rgba(56, 189, 248, 0.58)',
      castRingStyle: 'tech_grid',
      rVariant: 'hyper_rail',
      signatureEffect: 'triple_hyper_rail',
      decalStyle: 'tech_hex',
      projectileShape: 'hyper_rail',
    },
  },
  eldragon: {
    heroId: 'eldragon',
    basic: {
      primaryColor: '#f97316',
      secondaryColor: '#fde047',
      slashStyle: 'dragon_claw',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#f97316',
      secondaryColor: '#fde047',
      glowColor: 'rgba(249, 115, 22, 0.48)',
      castRingStyle: 'flame_crown',
      dashStyle: 'dragon_uppercut',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#fb923c',
      secondaryColor: '#ef4444',
      glowColor: 'rgba(251, 146, 60, 0.45)',
      castRingStyle: 'flame_crown',
      auraStyle: 'flame_guard',
    },
    r: {
      kind: 'leap_slam',
      primaryColor: '#f97316',
      secondaryColor: '#fde047',
      glowColor: 'rgba(249, 115, 22, 0.58)',
      castRingStyle: 'flame_crown',
      rVariant: 'dragon_slam',
      signatureEffect: 'dragon_claw_meteor',
      decalStyle: 'magma_crater',
    },
  },
  cluster: {
    heroId: 'cluster',
    basic: {
      primaryColor: '#facc15',
      secondaryColor: '#1e3a8a',
      projectileShape: 'mortar_shell',
    },
    q: {
      kind: 'trap_mine',
      primaryColor: '#facc15',
      secondaryColor: '#1e3a8a',
      glowColor: 'rgba(250, 204, 21, 0.48)',
      castRingStyle: 'tech_grid',
      zoneVariant: 'seismic_mine',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#facc15',
      secondaryColor: '#fb923c',
      glowColor: 'rgba(250, 204, 21, 0.44)',
      castRingStyle: 'starburst',
      auraStyle: 'blast_jump',
      dashStyle: 'blast_recoil',
    },
    r: {
      kind: 'barrage',
      primaryColor: '#facc15',
      secondaryColor: '#f97316',
      glowColor: 'rgba(250, 204, 21, 0.56)',
      castRingStyle: 'tech_grid',
      rVariant: 'cluster_artillery',
      signatureEffect: 'carpet_bomb_drop',
      decalStyle: 'tech_hex',
    },
  },
  velvet: {
    heroId: 'velvet',
    basic: {
      primaryColor: '#c084fc',
      secondaryColor: '#f472b6',
      projectileShape: 'astral_lance',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#e879f9',
      secondaryColor: '#fdf4ff',
      glowColor: 'rgba(192, 132, 252, 0.5)',
      castRingStyle: 'void_iris',
      projectileShape: 'frost_prism',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#c084fc',
      secondaryColor: '#f0abfc',
      glowColor: 'rgba(192, 132, 252, 0.48)',
      castRingStyle: 'void_iris',
      auraStyle: 'cosmic_blink',
      dashStyle: 'cosmic_blink',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#c084fc',
      secondaryColor: '#f472b6',
      glowColor: 'rgba(192, 132, 252, 0.58)',
      castRingStyle: 'void_iris',
      rVariant: 'velvet_supernova',
      signatureEffect: 'gravity_singularity',
      decalStyle: 'void_scar',
    },
  },
  meiro: {
    heroId: 'meiro',
    basic: {
      primaryColor: '#fbbf24',
      secondaryColor: '#ef4444',
      slashStyle: 'katana_crimson',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#fbbf24',
      secondaryColor: '#ef4444',
      glowColor: 'rgba(251, 191, 36, 0.46)',
      castRingStyle: 'petal_vortex',
      dashStyle: 'katana_wave',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#fbbf24',
      secondaryColor: '#f87171',
      glowColor: 'rgba(251, 191, 36, 0.44)',
      castRingStyle: 'petal_vortex',
      auraStyle: 'samurai_stance',
    },
    r: {
      kind: 'radial_burst',
      primaryColor: '#fbbf24',
      secondaryColor: '#ef4444',
      glowColor: 'rgba(251, 191, 36, 0.58)',
      castRingStyle: 'petal_vortex',
      rVariant: 'meiro_crest',
      signatureEffect: 'sakura_x_slash',
      decalStyle: 'sakura_slash',
      projectileShape: 'katana_crescent',
    },
  },
  baston: {
    heroId: 'baston',
    basic: {
      primaryColor: '#60a5fa',
      secondaryColor: '#e0f2fe',
      slashStyle: 'electric_baton',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#60a5fa',
      secondaryColor: '#dbeafe',
      glowColor: 'rgba(96, 165, 250, 0.48)',
      castRingStyle: 'tech_grid',
      dashStyle: 'aegis_bash',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#60a5fa',
      secondaryColor: '#93c5fd',
      glowColor: 'rgba(96, 165, 250, 0.46)',
      castRingStyle: 'tech_grid',
      auraStyle: 'hex_barrier',
    },
    r: {
      kind: 'leap_slam',
      primaryColor: '#60a5fa',
      secondaryColor: '#bae6fd',
      glowColor: 'rgba(96, 165, 250, 0.58)',
      castRingStyle: 'tech_grid',
      rVariant: 'baston_aegis',
      signatureEffect: 'hex_shield_dome',
      decalStyle: 'tech_hex',
    },
  },
  nina: {
    heroId: 'nina',
    basic: {
      primaryColor: '#a3e635',
      secondaryColor: '#ecfccb',
      projectileShape: 'neon_smg',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#a3e635',
      secondaryColor: '#ecfccb',
      glowColor: 'rgba(163, 230, 53, 0.48)',
      castRingStyle: 'sonic_cone',
      projectileShape: 'venom_dart',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#a3e635',
      secondaryColor: '#4ade80',
      glowColor: 'rgba(163, 230, 53, 0.44)',
      castRingStyle: 'sonic_cone',
      auraStyle: 'neon_skates',
      dashStyle: 'neon_skates',
    },
    r: {
      kind: 'fan_volley',
      primaryColor: '#a3e635',
      secondaryColor: '#bef264',
      glowColor: 'rgba(163, 230, 53, 0.56)',
      castRingStyle: 'sonic_cone',
      rVariant: 'neon_fan',
      signatureEffect: 'acid_vapor_fan',
      decalStyle: 'acid_pool',
      projectileShape: 'acid_fan',
    },
  },
  drake: {
    heroId: 'drake',
    basic: {
      primaryColor: '#10b981',
      secondaryColor: '#d1fae5',
      projectileShape: 'sniper_slug',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#10b981',
      secondaryColor: '#d1fae5',
      glowColor: 'rgba(16, 185, 129, 0.48)',
      castRingStyle: 'sonic_cone',
      projectileShape: 'mag_slug',
    },
    e: {
      kind: 'stealth_buff',
      primaryColor: '#10b981',
      secondaryColor: '#064e3b',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      castRingStyle: 'tech_grid',
      auraStyle: 'tactical_cloak',
      dashStyle: 'stealth_recoil',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#10b981',
      secondaryColor: '#6ee7b7',
      glowColor: 'rgba(16, 185, 129, 0.56)',
      castRingStyle: 'tech_grid',
      rVariant: 'drake_predator',
      signatureEffect: 'satellite_lock_beam',
      decalStyle: 'sniper_reticle',
    },
  },
  knox: {
    heroId: 'knox',
    basic: {
      primaryColor: '#fb923c',
      secondaryColor: '#fde047',
      projectileShape: 'lava_canister',
    },
    q: {
      kind: 'trap_mine',
      primaryColor: '#fb923c',
      secondaryColor: '#facc15',
      glowColor: 'rgba(251, 146, 60, 0.48)',
      castRingStyle: 'flame_crown',
      zoneVariant: 'powder_mine',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#fb923c',
      secondaryColor: '#fde047',
      glowColor: 'rgba(251, 146, 60, 0.46)',
      castRingStyle: 'starburst',
      auraStyle: 'firework_jump',
      dashStyle: 'firework_recoil',
    },
    r: {
      kind: 'barrage',
      primaryColor: '#fb923c',
      secondaryColor: '#facc15',
      glowColor: 'rgba(251, 146, 60, 0.58)',
      castRingStyle: 'flame_crown',
      rVariant: 'knox_volcano',
      signatureEffect: 'volcanic_geysers',
      decalStyle: 'magma_crater',
    },
  },
  kairo: {
    heroId: 'kairo',
    basic: {
      primaryColor: '#2dd4bf',
      secondaryColor: '#e0f2fe',
      slashStyle: 'voltaic_palm',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#2dd4bf',
      secondaryColor: '#e0f2fe',
      glowColor: 'rgba(45, 212, 191, 0.48)',
      castRingStyle: 'lightning_crown',
      dashStyle: 'voltaic_step',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#2dd4bf',
      secondaryColor: '#38bdf8',
      glowColor: 'rgba(45, 212, 191, 0.44)',
      castRingStyle: 'lightning_crown',
      auraStyle: 'zen_aura',
    },
    r: {
      kind: 'radial_burst',
      primaryColor: '#2dd4bf',
      secondaryColor: '#7dd3fc',
      glowColor: 'rgba(45, 212, 191, 0.58)',
      castRingStyle: 'lightning_crown',
      rVariant: 'kairo_storm',
      signatureEffect: 'chain_lightning_storm',
      decalStyle: 'storm_burn',
      projectileShape: 'lightning_orb',
    },
  },
  boulder: {
    heroId: 'boulder',
    basic: {
      primaryColor: '#d97706',
      secondaryColor: '#fb923c',
      slashStyle: 'magma_fist',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#d97706',
      secondaryColor: '#fb923c',
      glowColor: 'rgba(217, 119, 6, 0.48)',
      castRingStyle: 'shockwave',
      dashStyle: 'avalanche_rock',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#f59e0b',
      secondaryColor: '#78350f',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      castRingStyle: 'shockwave',
      auraStyle: 'basalt_skin',
    },
    r: {
      kind: 'leap_slam',
      primaryColor: '#d97706',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(217, 119, 6, 0.58)',
      castRingStyle: 'shockwave',
      rVariant: 'boulder_tectonic',
      signatureEffect: 'basalt_monoliths',
      decalStyle: 'tectonic_cracks',
    },
  },
  ryder: {
    heroId: 'ryder',
    basic: {
      primaryColor: '#ec4899',
      secondaryColor: '#a855f7',
      projectileShape: 'void_boomerang',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#ec4899',
      secondaryColor: '#a855f7',
      glowColor: 'rgba(236, 72, 153, 0.48)',
      castRingStyle: 'void_iris',
      dashStyle: 'void_rift',
    },
    e: {
      kind: 'stealth_buff',
      primaryColor: '#ec4899',
      secondaryColor: '#581c87',
      glowColor: 'rgba(168, 85, 247, 0.44)',
      castRingStyle: 'void_iris',
      auraStyle: 'eclipse_veil',
    },
    r: {
      kind: 'radial_burst',
      primaryColor: '#ec4899',
      secondaryColor: '#c084fc',
      glowColor: 'rgba(236, 72, 153, 0.58)',
      castRingStyle: 'void_iris',
      rVariant: 'ryder_void',
      signatureEffect: 'dimensional_void_tear',
      decalStyle: 'void_scar',
      projectileShape: 'void_blade',
    },
  },
  solara: {
    heroId: 'solara',
    basic: {
      primaryColor: '#facc15',
      secondaryColor: '#fef9c3',
      projectileShape: 'solar_orb',
    },
    q: {
      kind: 'aoe_zone',
      primaryColor: '#facc15',
      secondaryColor: '#fef9c3',
      glowColor: 'rgba(250, 204, 21, 0.5)',
      castRingStyle: 'rune_circle',
      zoneVariant: 'solar_sanctuary',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#fde047',
      secondaryColor: '#fb923c',
      glowColor: 'rgba(253, 224, 71, 0.46)',
      castRingStyle: 'starburst',
      auraStyle: 'solar_blessing',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#facc15',
      secondaryColor: '#fef9c3',
      glowColor: 'rgba(250, 204, 21, 0.6)',
      castRingStyle: 'rune_circle',
      rVariant: 'solara_pillar',
      signatureEffect: 'celestial_sun_pillar',
      decalStyle: 'solar_mandala',
    },
  },
  frost: {
    heroId: 'frost',
    basic: {
      primaryColor: '#38bdf8',
      secondaryColor: '#e0f2fe',
      projectileShape: 'ice_shard',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#38bdf8',
      secondaryColor: '#e0f2fe',
      glowColor: 'rgba(56, 189, 248, 0.5)',
      castRingStyle: 'shock_diamond',
      projectileShape: 'cryo_spear',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#7dd3fc',
      secondaryColor: '#f0f9ff',
      glowColor: 'rgba(125, 211, 252, 0.46)',
      castRingStyle: 'shock_diamond',
      auraStyle: 'crystal_armor',
      dashStyle: 'cryo_slide',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#38bdf8',
      secondaryColor: '#bae6fd',
      glowColor: 'rgba(56, 189, 248, 0.58)',
      castRingStyle: 'shock_diamond',
      rVariant: 'frost_blizzard',
      signatureEffect: 'cryo_icicle_cyclone',
      decalStyle: 'frost_fracture',
    },
  },
  valkyria: {
    heroId: 'valkyria',
    basic: {
      primaryColor: '#22d3ee',
      secondaryColor: '#facc15',
      slashStyle: 'halberd_sweep',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#22d3ee',
      secondaryColor: '#facc15',
      glowColor: 'rgba(34, 211, 238, 0.48)',
      castRingStyle: 'sonic_cone',
      dashStyle: 'valkyrie_wings',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#38bdf8',
      secondaryColor: '#fde047',
      glowColor: 'rgba(56, 189, 248, 0.46)',
      castRingStyle: 'starburst',
      auraStyle: 'redemption_wings',
    },
    r: {
      kind: 'radial_burst',
      primaryColor: '#22d3ee',
      secondaryColor: '#fde047',
      glowColor: 'rgba(34, 211, 238, 0.58)',
      castRingStyle: 'starburst',
      rVariant: 'valkyria_halo',
      signatureEffect: 'angelic_wing_spears',
      decalStyle: 'solar_mandala',
      projectileShape: 'halberd_lance',
    },
  },
  kronos: {
    heroId: 'kronos',
    basic: {
      primaryColor: '#a855f7',
      secondaryColor: '#fbbf24',
      projectileShape: 'chrono_orb',
    },
    q: {
      kind: 'projectile',
      primaryColor: '#a855f7',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      castRingStyle: 'chrono_gears',
      projectileShape: 'chrono_ray',
    },
    e: {
      kind: 'dash_buff',
      primaryColor: '#c084fc',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(192, 132, 252, 0.48)',
      castRingStyle: 'chrono_gears',
      auraStyle: 'chrono_warp',
      dashStyle: 'chrono_warp',
    },
    r: {
      kind: 'orbital_strike',
      primaryColor: '#a855f7',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(168, 85, 247, 0.6)',
      castRingStyle: 'chrono_gears',
      rVariant: 'kronos_collapse',
      signatureEffect: 'clockwork_time_collapse',
      decalStyle: 'clock_sigil',
    },
  },
  titanx: {
    heroId: 'titanx',
    basic: {
      primaryColor: '#ef4444',
      secondaryColor: '#fbbf24',
      projectileShape: 'mecha_rocket',
    },
    q: {
      kind: 'dash_trail',
      primaryColor: '#ef4444',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      castRingStyle: 'tech_grid',
      dashStyle: 'mecha_thruster',
    },
    e: {
      kind: 'shield_aura',
      primaryColor: '#ef4444',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(239, 68, 68, 0.46)',
      castRingStyle: 'tech_grid',
      auraStyle: 'reactor_overdrive',
    },
    r: {
      kind: 'barrage',
      primaryColor: '#ef4444',
      secondaryColor: '#fbbf24',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      castRingStyle: 'tech_grid',
      rVariant: 'titanx_barrage',
      signatureEffect: 'thermobaric_missile_salvo',
      decalStyle: 'tech_hex',
    },
  },
};

export function getHeroSkillVfx(heroId: HeroId): HeroSkillVfxSpec {
  return HERO_SKILL_VFX[heroId];
}
