
import React from 'react';
import { getHeroSkillVfx } from '../game/skillVfx';
import { HeroId } from '../game/types';

export const ThetanTitleEmblem: React.FC = () => (
  <svg
    viewBox="0 0 380 86"
    className="w-full max-w-[360px] h-auto"
    role="img"
    aria-label="Thetan Arena"
  >
    {/* Shield Crest Emblem */}
    <g transform="translate(4, 7)">
      <polygon
        points="34,2 64,16 58,52 34,70 10,52 4,16"
        fill="#131c31"
        stroke="#f59e0b"
        strokeWidth="3"
      />
      <polygon
        points="34,12 52,22 48,46 34,58 20,46 16,22"
        fill="#1e293b"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <path d="M34 19 L43 35 L34 50 L25 35 Z" fill="#f59e0b" />
      <circle cx="34" cy="35" r="4" fill="#0f172a" />
    </g>

    {/* Title Wordmark */}
    <text
      x="82"
      y="48"
      fill="#f8fafc"
      fontFamily="'Barlow Condensed', sans-serif"
      fontWeight="800"
      fontSize="44"
      letterSpacing="2.5"
    >
      THETAN ARENA
    </text>
    <rect x="84" y="57" width="96" height="3" fill="#f59e0b" rx="1.5" />
    <text
      x="190"
      y="64"
      fill="#94a3b8"
      fontFamily="'Plus Jakarta Sans', sans-serif"
      fontWeight="700"
      fontSize="12.5"
      letterSpacing="2.2"
    >
      BATALHA DE HERÓIS
    </text>
  </svg>
);

export const VitalityHeartIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 21s-7.5-4.8-9.5-9.2C.9 8.2 3.1 4.5 6.8 4.5c2.2 0 4 1.2 5.2 2.9 1.2-1.7 3-2.9 5.2-2.9 3.7 0 5.9 3.7 4.3 7.3C19.5 16.2 12 21 12 21z"
      fill="#0f172a"
      stroke="#0f172a"
      strokeWidth="2"
    />
    <path
      d="M12 19.6s-6.7-4.3-8.5-8.2C2.2 8.4 4 5.5 7 5.5c2 0 3.7 1.1 5 2.9 1.3-1.8 3-2.9 5-2.9 3 0 4.8 2.9 3.5 5.9-1.8 3.9-8.5 8.2-8.5 8.2z"
      fill="#38bdf8"
    />
    <path d="M5.5 8.5c.5-1.2 1.6-1.8 2.7-1.6" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

export const PowerCubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="12,2 21,12 12,22 3,12" fill="#064e3b" stroke="#052e16" strokeWidth="2" />
    <polygon points="12,4 19,12 12,20 5,12" fill="#10b981" />
    <polygon points="12,4 19,12 12,12" fill="#6ee7b7" />
  </svg>
);

export const SkullKillIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="10.5" r="7" fill="#1e293b" stroke="#090e1a" strokeWidth="2" />
    <rect x="8.5" y="15.5" width="7" height="4.5" rx="1.5" fill="#cbd5e1" stroke="#090e1a" strokeWidth="1.5" />
    <circle cx="12" cy="10.5" r="6.2" fill="#f43f5e" />
    <circle cx="9.6" cy="10.2" r="1.5" fill="#090e1a" />
    <circle cx="14.4" cy="10.2" r="1.5" fill="#090e1a" />
  </svg>
);

export const SoundIcon: React.FC<{ muted: boolean; className?: string }> = ({
  muted,
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
    {muted ? (
      <>
        <line x1="22" y1="9" x2="16" y2="15" stroke="#f43f5e" />
        <line x1="16" y1="9" x2="22" y2="15" stroke="#f43f5e" />
      </>
    ) : (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    )}
  </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
    <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
  </svg>
);

export const RestartIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const SkillSlotIcon: React.FC<{
  heroId: HeroId;
  slot: 'LMB' | 'Q' | 'E' | 'R';
  accent: string;
}> = ({ heroId, slot, accent }) => {
  const vfx = getHeroSkillVfx(heroId);
  const c1 = accent || vfx.basic.primaryColor;
  const c2 =
    slot === 'LMB'
      ? vfx.basic.secondaryColor
      : slot === 'Q'
      ? vfx.q.secondaryColor
      : slot === 'E'
      ? vfx.e.secondaryColor
      : vfx.r.secondaryColor;

  if (slot === 'LMB') {
    const slash = vfx.basic.slashStyle;
    const shape = vfx.basic.projectileShape;

    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        {slash === 'seismic_hammer' && (
          <>
            <path d="M5 19l9-9" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
            <rect x="10" y="3" width="10" height="7" rx="1.8" transform="rotate(45 15 6.5)" fill={c1} stroke="#090d16" strokeWidth="1.6" />
            <path d="M16 17a5 5 0 0 0 5-5" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {slash === 'dragon_claw' && (
          <>
            <path d="M5 15c0-5 3-8 8-8 3 0 6 2 6 5s-2 5-6 5H7z" fill={c1} stroke="#090d16" strokeWidth="1.6" />
            <path d="M9 10h6M8 13h5" stroke={c2} strokeWidth="2" strokeLinecap="round" />
            <path d="M4 19l4-3" stroke={c2} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {slash === 'katana_crimson' && (
          <>
            <path d="M4 19C9 15 15 9 20 3c-1 6-5 11-11 15l-2 2-3-1z" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <path d="M7 20C14 17 19 11 21 5" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {(slash === 'electric_baton' || slash === 'voltaic_palm') && (
          <>
            <path d="M14 2L7 13h5l-2 9 8-12h-5l1-8z" fill={c1} stroke="#090d16" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.2" fill={c2} />
          </>
        )}
        {slash === 'magma_fist' && (
          <>
            <polygon points="6,11 10,5 17,6 20,12 16,19 8,18" fill={c1} stroke="#090d16" strokeWidth="1.6" />
            <path d="M10 8l3 4-2 4M15 9l-2 3 3 3" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {slash === 'halberd_sweep' && (
          <>
            <path d="M4 20L19 5" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
            <polygon points="21,3 14,5 16,8 19,10" fill={c1} stroke="#090d16" strokeWidth="1.4" />
            <path d="M10 5c4 0 8 4 8 8" stroke={c1} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}
        {shape === 'twin_needle' && (
          <>
            <polygon points="19,5 9,8 12,11" fill={c1} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="20,13 7,14 10,18" fill={c2} stroke="#090d16" strokeWidth="1.4" />
            <path d="M4 11l6-2M4 17l5-1" stroke={c1} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        {shape === 'crossbow_bolt' && (
          <>
            <path d="M3 19L19 5" stroke={c1} strokeWidth="2.4" strokeLinecap="round" />
            <polygon points="21,3 14,5 19,10" fill={c2} stroke="#090d16" strokeWidth="1.4" />
            <path d="M6 12c0 4 3 7 7 7" stroke={c1} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}
        {shape === 'fire_orb' && (
          <>
            <path d="M12 2c3 4 7 6.5 7 11a7 7 0 1 1-14 0c0-3.5 2.5-6 4.5-8 0 2 1 3 2.5 3.5-.5-2 0-4 0-6.5z" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <circle cx="12" cy="14" r="2.8" fill={c2} />
          </>
        )}
        {shape === 'plasma_cannon' && (
          <>
            <rect x="3" y="8" width="12" height="8" rx="2" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <circle cx="18" cy="12" r="3.5" fill={c2} stroke="#090d16" strokeWidth="1.4" />
            <path d="M15 6l3-2M15 18l3 2" stroke={c1} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        {(shape === 'mortar_shell' || shape === 'lava_canister') && (
          <>
            <circle cx="11" cy="14" r="6.5" fill={c1} stroke="#090d16" strokeWidth="1.6" />
            <path d="M14 8l3-3" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
            <polygon points="18,2 19,5 22,5 19.5,7 20,10 18,8 16,10 16.5,7 14,5 17,5" fill={c2} />
          </>
        )}
        {shape === 'astral_lance' && (
          <>
            <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.5" fill={c2} />
          </>
        )}
        {shape === 'neon_smg' && (
          <>
            <polygon points="15,4 6,10 9,13" fill={c1} stroke="#090d16" strokeWidth="1.3" />
            <polygon points="20,10 10,16 13,19" fill={c1} stroke="#090d16" strokeWidth="1.3" />
            <circle cx="17" cy="18" r="2.3" fill={c2} />
          </>
        )}
        {shape === 'sniper_slug' && (
          <>
            <circle cx="12" cy="12" r="7.5" fill="none" stroke={c1} strokeWidth="2" />
            <path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke={c2} strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.4" fill={c1} />
          </>
        )}
        {shape === 'void_boomerang' && (
          <>
            <path d="M5 17C5 9 11 4 19 4c-4 3-7 8-7 14l-7-1z" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <path d="M9 19c4-1 9-5 11-11" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {shape === 'solar_orb' && (
          <>
            <circle cx="12" cy="12" r="5" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.2" fill={c2} />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke={c1} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {shape === 'ice_shard' && (
          <>
            <polygon points="20,4 13,7 11,11 4,16 9,15 13,20 17,11" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <path d="M8 16l8-8" stroke={c2} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        {shape === 'chrono_orb' && (
          <>
            <circle cx="12" cy="12" r="7" fill={c1} fillOpacity="0.25" stroke={c1} strokeWidth="2" />
            <path d="M12 7v5l3.5 2" stroke={c2} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="12" r="1.5" fill={c2} />
          </>
        )}
        {shape === 'mecha_rocket' && (
          <>
            <polygon points="20,4 11,8 14,11 16,13" fill={c1} stroke="#090d16" strokeWidth="1.4" />
            <polygon points="18,12 8,16 12,19" fill={c1} stroke="#090d16" strokeWidth="1.4" />
            <path d="M4 13l5-3M4 20l4-2" stroke={c2} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  if (slot === 'Q') {
    const q = vfx.q;
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        {q.kind === 'dash_trail' && (
          <>
            <path d="M4 18L19 5" stroke={c2} strokeWidth="2.4" strokeLinecap="round" />
            <polygon points="21,3 12,5 19,12" fill={c1} stroke="#090d16" strokeWidth="1.4" />
            <path d="M3 13l6-4M11 20l6-5" stroke={c1} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {q.kind === 'projectile' && (
          <>
            <polygon points="22,12 13,6 14,10 3,10 3,14 14,14 13,18" fill={c1} stroke="#090d16" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="5" y1="12" x2="17" y2="12" stroke={c2} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {q.kind === 'aoe_zone' && (
          <>
            <circle cx="12" cy="12" r="8" fill={c1} fillOpacity="0.24" stroke={c1} strokeWidth="2" strokeDasharray="4 2.5" />
            <circle cx="12" cy="12" r="4" fill={c2} />
            {q.zoneVariant === 'solar_sanctuary' && (
              <path d="M12 9.5v5M9.5 12h5" stroke="#090d16" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </>
        )}
        {q.kind === 'trap_mine' && (
          <>
            <polygon points="12,3 15,7 20,7 17,11 20,16 15,16 12,21 9,16 4,16 7,11 4,7 9,7" fill={c1} stroke="#090d16" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill={c2} />
          </>
        )}
      </svg>
    );
  }

  if (slot === 'E') {
    const e = vfx.e;
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        {e.kind === 'stealth_buff' && (
          <>
            <path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" fill={c1} fillOpacity="0.28" stroke={c1} strokeWidth="2" />
            <circle cx="12" cy="12" r="2.8" fill={c2} stroke="#090d16" strokeWidth="1.2" />
            <path d="M5 19L19 5" stroke={c1} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {e.kind === 'trap_backflip' && (
          <>
            <path d="M5 17h14l-2-5-3 2-2-3-2 3-3-2-2 5z" fill={c1} stroke="#090d16" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 7H7m0 0l3-3M7 7l3 3" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
        {e.kind === 'dash_buff' && (
          <>
            <path d="M4 16c4-1 7-4 9-9 2 4 4 6 8 7-4 2-7 5-9 8-2-3-5-5-8-6z" fill={c1} stroke="#090d16" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="13" cy="13" r="2.2" fill={c2} />
          </>
        )}
        {e.kind === 'shield_aura' && (
          <>
            <path
              d="M12 3l7 3.8v5.2c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6.8L12 3z"
              fill={c1}
              fillOpacity="0.28"
              stroke={c1}
              strokeWidth="2"
            />
            {e.auraStyle === 'solar_blessing' ? (
              <path d="M12 8.5v7M8.5 12h7" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
            ) : e.auraStyle === 'hex_barrier' ? (
              <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="none" stroke={c2} strokeWidth="1.8" />
            ) : (
              <path d="M8.5 12l2.5 2.5L15.5 10" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
          </>
        )}
      </svg>
    );
  }

  // Slot 'R' — bespoke signature silhouette matching rVariant!
  const r = vfx.r;
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      {r.rVariant === 'kronos_collapse' && (
        <>
          <circle cx="12" cy="12" r="8.5" fill={c1} fillOpacity="0.24" stroke={c1} strokeWidth="2.2" />
          <path d="M12 6.5V12l4 2.5" stroke={c2} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="12" r="1.6" fill={c2} />
        </>
      )}
      {r.rVariant === 'frost_blizzard' && (
        <>
          <path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17" stroke={c1} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" fill={c2} stroke="#090d16" strokeWidth="1.3" />
        </>
      )}
      {r.rVariant === 'velvet_supernova' && (
        <>
          <circle cx="12" cy="12" r="8" fill={c1} fillOpacity="0.22" stroke={c1} strokeWidth="2" strokeDasharray="8 4" />
          <polygon points="12,6 14,10 18,12 14,14 12,18 10,14 6,12 10,10" fill={c2} />
        </>
      )}
      {r.rVariant === 'solara_pillar' && (
        <>
          <path d="M8 21h8l-1.5-15h-5L8 21z" fill={c1} fillOpacity="0.35" stroke={c1} strokeWidth="1.8" />
          <circle cx="12" cy="6" r="3.5" fill={c2} stroke="#090d16" strokeWidth="1.3" />
        </>
      )}
      {(r.rVariant === 'drake_predator' || r.rVariant === 'crimson_orbital') && (
        <>
          <circle cx="12" cy="12" r="7.5" fill={c1} fillOpacity="0.2" stroke={c1} strokeWidth="2" />
          <path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill={c1} />
        </>
      )}
      {r.rVariant === 'baston_aegis' && (
        <>
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill={c1} fillOpacity="0.28" stroke={c1} strokeWidth="2" />
          <path d="M13 7l-4 5h3l-1 5 4-5h-3l1-5z" fill={c2} />
        </>
      )}
      {(r.rVariant === 'cluster_artillery' || r.rVariant === 'knox_volcano' || r.rVariant === 'titanx_barrage' || r.rVariant === 'phoenix_meteor') && (
        <>
          <polygon points="12,2 15,7 20,6 17,11 21,15 15,16 12,21 9,16 3,15 7,11 4,6 9,7" fill={c1} fillOpacity="0.32" stroke={c1} strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.2" fill={c2} />
        </>
      )}
      {(r.rVariant === 'raidon_shuriken' || r.rVariant === 'meiro_crest' || r.rVariant === 'ryder_void' || r.rVariant === 'kairo_storm' || r.rVariant === 'valkyria_halo') && (
        <>
          <polygon points="12,2 14.5,9.5 22,12 14.5,14.5 12,22 9.5,14.5 2,12 9.5,9.5" fill={c1} stroke="#090d16" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6" fill="none" stroke={c2} strokeWidth="1.6" strokeDasharray="3 3" />
        </>
      )}
      {(r.rVariant === 'kong_fissure' || r.rVariant === 'dragon_slam' || r.rVariant === 'boulder_tectonic') && (
        <>
          <path d="M4 18l4-6 4 2 4-7 4 11H4z" fill={c1} fillOpacity="0.34" stroke={c1} strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 3v7M9 7l3 3 3-3" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {(r.rVariant === 'hyper_rail' || r.rVariant === 'neon_fan') && (
        <>
          <path d="M3 12l17-6M3 12h18M3 12l17 6" stroke={c1} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="5" cy="12" r="2.6" fill={c2} stroke="#090d16" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
};

