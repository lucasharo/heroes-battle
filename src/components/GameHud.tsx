import React from 'react';
import { MAPS_META } from '../game/arena';
import { EmoteId } from '../game/emotes';
import { HEROES } from '../game/heroes';
import { getHeroSkinSpec } from '../game/heroSkins';
import { HudSnapshot } from '../game/types';
import { DeathCamOverlay } from './DeathCamOverlay';
import { RadialEmoteMenu } from './RadialEmoteMenu';
import {
  PauseIcon,
  PowerCubeIcon,
  RestartIcon,
  SkillSlotIcon,
  SkullKillIcon,
  SoundIcon,
  VitalityHeartIcon,
} from './GameIcons';
import { KillStreakBanner } from './KillStreakBanner';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  isMobile?: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onTriggerSkill: (slot: 'basic' | 'q' | 'e' | 'r') => void;
  onTriggerEmote: (emoteId: EmoteId) => boolean;
  onFocusHero: () => void;
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  isMobile = false,
  onToggleMute,
  onTogglePause,
  onRestart,
  onTriggerSkill,
  onTriggerEmote,
  onFocusHero,
}) => {
  const hero = HEROES[hud.playerHero];
  const activeSkin = getHeroSkinSpec(hud.playerHero, hud.playerSkin);
  const mapMeta = MAPS_META[hud.mapId];
  const hpPct = hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100)) : 0;
  const ghostPct =
    hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.ghostHp / hud.maxHp) * 100)) : 0;
  const shieldPct =
    hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.shield / hud.maxHp) * 100)) : 0;
  const lowHp = hpPct > 0 && hpPct < 28;
  const allyTowerPct =
    hud.allyTowerMaxHp > 0 ? Math.max(0, Math.ceil((hud.allyTowerHp / hud.allyTowerMaxHp) * 100)) : 0;
  const enemyTowerPct =
    hud.enemyTowerMaxHp > 0 ? Math.max(0, Math.ceil((hud.enemyTowerHp / hud.enemyTowerMaxHp) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Peripheral Low-HP / Storm Danger Vignette */}
      {(lowHp || hud.inStorm) && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: hud.inStorm
              ? 'inset 0 0 90px rgba(168, 85, 247, 0.5)'
              : 'inset 0 0 85px rgba(244, 63, 94, 0.48)',
          }}
        />
      )}

      {/* CLUSTER 1 (Top-Left): Hero Vitality, Power Cubes & Tactical Minimap */}
      <div className="fixed top-2.5 left-2.5 sm:top-4 sm:left-4 flex flex-col gap-2">
        <div
          className="rounded-xl border-2 border-indigo-400/35 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-lg"
          style={{ backgroundColor: 'rgba(14, 21, 52, 0.92)' }}
        >
          <img
            src={hero.portraitUrl}
            alt={hero.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg object-cover object-top border-2 shrink-0"
            style={{
              borderColor: activeSkin.accentColor,
              filter:
                activeSkin.portraitFilter !== 'none'
                  ? activeSkin.portraitFilter
                  : undefined,
            }}
          />

          <div className="flex flex-col gap-0.5 sm:gap-1 min-w-[116px] sm:min-w-[185px]">
            <div className="flex items-baseline justify-between gap-2 sm:gap-3">
              <span className="font-display text-sm sm:text-lg font-bold text-white leading-none truncate">
                {hero.name}
              </span>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono-num text-emerald-300">
                <VitalityHeartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>
                  {hud.hp}/{hud.maxHp}
                </span>
              </div>
            </div>

            {/* HP Bar with Ghost Drain & Shield (Thetan Arena Emerald Green) */}
            <div className="relative h-2 sm:h-2.5 w-full rounded bg-slate-950 border border-slate-700/90 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-slate-100/80 transition-transform duration-150"
                style={{ width: `${ghostPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500"
                style={{ width: `${hpPct}%` }}
              />
              {shieldPct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400/95 h-1"
                  style={{ width: `${shieldPct}%` }}
                />
              )}
            </div>

            {/* Secondary Metrics: Power Cubes, Kills, Stars Held, Stealth Cue */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-300 font-mono-num pt-0.5">
              <span className="flex items-center gap-1" title="Cubos de Poder">
                <PowerCubeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{hud.powerCubes}</span>
              </span>
              <span className="flex items-center gap-1" title="Abates">
                <SkullKillIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{hud.playerKills}</span>
              </span>
              {hud.mode === 'superstar' && (
                <span className="flex items-center gap-1 text-amber-300 font-bold" title="Suas Estrelas">
                  <span>★ {hud.starsHeld}</span>
                </span>
              )}
              {(hud.isStealthed || hud.inBush) && (
                <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-emerald-400">
                  {hud.isStealthed ? 'Furtivo' : 'Oculto'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Super Estrela Countdown Banner */}
      {hud.mode === 'superstar' && hud.starCountdown !== null && hud.starLeader && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl border-2 font-display text-xl font-extrabold tracking-wide shadow-2xl ${
            hud.starLeader === 'ally'
              ? 'border-sky-400 text-sky-200'
              : 'border-rose-400 text-rose-200'
          }`}
          style={{ backgroundColor: 'rgba(11, 17, 42, 0.94)' }}
        >
          {hud.starLeader === 'ally' ? 'SUA EQUIPE' : 'INIMIGOS'} COM 10+ ESTRELAS ·{' '}
          <span className="font-mono-num text-amber-300">{hud.starCountdown.toFixed(1)}s</span>
        </div>
      )}

      {/* Kill Streak Announcement Banner (Double Kill .. Godlike) */}
      {hud.killStreak && (
        <KillStreakBanner
          streak={hud.killStreak}
          offsetForSuperStar={
            hud.mode === 'superstar' && hud.starCountdown !== null && hud.starLeader !== null
          }
        />
      )}

      {/* CLUSTER 2 (Top-Right): Match Telemetry + Utility Square Buttons + Kill Feed */}
      <div className="fixed top-2.5 right-2.5 sm:top-4 sm:right-4 flex flex-col items-end gap-1.5 sm:gap-2">
        <div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
          {/* Mode & Map Score Readout */}
          <div
            className="rounded-xl border border-slate-700/75 px-2.5 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2 sm:gap-3.5 shadow-lg"
            style={{ backgroundColor: 'rgba(13, 20, 36, 0.9)' }}
          >
            <div className="hidden sm:flex flex-col items-start pr-1">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider leading-none"
                style={{ color: mapMeta.accent }}
              >
                {mapMeta.shortName}
              </span>
              <span className="text-[11px] text-slate-300 font-semibold leading-tight mt-0.5">
                {hud.mode === 'royale'
                  ? 'Battle Royale'
                  : hud.mode === 'brawl'
                  ? 'Deathmatch'
                  : hud.mode === 'superstar'
                  ? 'Super Estrela'
                  : 'Cerco à Torre'}
              </span>
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-700" />

            {hud.mode === 'royale' ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                    VIVOS
                  </span>
                  <span className="font-display text-2xl font-extrabold text-amber-400 leading-none tabular-nums">
                    {hud.aliveCount}/{hud.totalCombatants}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                    TEMPO
                  </span>
                  <span className="font-mono-num text-lg font-bold text-slate-100 leading-none">
                    {formatClock(hud.elapsedTime)}
                  </span>
                </div>
              </>
            ) : hud.mode === 'tower' ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-sky-400 leading-none">ALIADA</span>
                    <span className="font-display text-xl font-extrabold text-sky-300 leading-none tabular-nums mt-0.5">
                      {allyTowerPct}%
                    </span>
                  </div>
                  <span className="text-slate-500 font-bold">×</span>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-rose-400 leading-none">INIMIGA</span>
                    <span className="font-display text-xl font-extrabold text-rose-300 leading-none tabular-nums mt-0.5">
                      {enemyTowerPct}%
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <span className="font-mono-num text-base font-bold text-slate-100">
                  {formatClock(hud.timeRemaining)}
                </span>
              </>
            ) : hud.mode === 'superstar' ? (
              <>
                <div className="flex items-baseline gap-2 font-display text-2xl font-extrabold leading-none tabular-nums">
                  <span className="text-sky-400">★{hud.allyScore}</span>
                  <span className="text-slate-500 text-lg">×</span>
                  <span className="text-rose-400">★{hud.enemyScore}</span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold text-amber-300 leading-none">
                    META {hud.targetScore}★
                  </span>
                  <span className="font-mono-num text-sm font-bold text-slate-100 leading-none mt-0.5">
                    {formatClock(hud.timeRemaining)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 font-display text-2xl font-extrabold leading-none tabular-nums">
                  <span className="text-sky-400">{hud.allyScore}</span>
                  <span className="text-slate-500 text-lg">×</span>
                  <span className="text-rose-400">{hud.enemyScore}</span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold text-slate-400 leading-none">
                    META {hud.targetScore}
                  </span>
                  <span className="font-mono-num text-sm font-bold text-slate-100 leading-none mt-0.5">
                    {formatClock(hud.timeRemaining)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Utility Square Controls: Mute, Pause, Restart */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Ativar som' : 'Silenciar som'}
              title="Som [M]"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(13, 20, 36, 0.9)' }}
            >
              <SoundIcon muted={muted} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pausar partida"
              title="Pausar [Esc / P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(13, 20, 36, 0.9)' }}
            >
              <PauseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Reiniciar partida"
              title="Reiniciar"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(13, 20, 36, 0.9)' }}
            >
              <RestartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Clean Unboxed Kill Feed (hidden on ultra-narrow portrait so playfield stays clear) */}
        {hud.killFeed.length > 0 && (
          <div className="hidden sm:flex flex-col items-end gap-1 mt-1">
            {hud.killFeed.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="text-xs px-2.5 py-1 rounded border border-slate-800/80 text-slate-200"
                style={{ backgroundColor: 'rgba(13, 20, 36, 0.84)' }}
              >
                <span className="font-semibold text-amber-400">{item.killerName}</span>
                <span className="text-slate-400 mx-1.5">eliminou</span>
                <span className="font-semibold text-rose-400">{item.victimName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tactical Death Cam Overlay (or fallback respawn countdown notice) */}
      {hud.deathCam ? (
        <DeathCamOverlay
          deathCam={hud.deathCam}
          offsetForTopBanners={
            Boolean(hud.killStreak) ||
            (hud.mode === 'superstar' && hud.starCountdown !== null && hud.starLeader !== null)
          }
          onFocusHero={onFocusHero}
        />
      ) : (
        hud.mode !== 'royale' &&
        hud.hp <= 0 &&
        hud.respawnTimer > 0 && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border border-rose-500/50 text-sm font-semibold text-rose-200"
            style={{ backgroundColor: 'rgba(13, 20, 36, 0.92)' }}
          >
            Retornando à arena em <span className="font-mono-num">{hud.respawnTimer.toFixed(1)}s</span>
          </div>
        )
      )}

      {/* CLUSTER 3 (Bottom-Center): Desktop 4-Slot Ability & Ammo Dock */}
      {!isMobile && (
      <div
        data-testid="hud-combo-dock"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        data-combo-step={hud.comboStep}
        data-ammo={hud.ammo}
      >
        {/* Combo Status / Rapid 3-Bar Combo Indicator */}
        {hud.comboStep >= 2 ? (
          <div
            data-testid="hud-combo-indicator"
            className={`px-3 py-0.5 rounded-md border text-[11px] font-display font-extrabold tracking-wide uppercase shadow-md ${
              hud.comboStep >= 3
                ? 'border-amber-300 text-amber-200 bg-amber-500/25'
                : 'border-amber-400/70 text-amber-300 bg-slate-950/85'
            }`}
          >
            {hud.comboStep >= 3 ? 'COMBO FINAL x3! +65% DANO' : 'COMBO x2 · +25% DANO'}
          </div>
        ) : hud.ammo === hud.maxAmmo ? (
          <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300/90 drop-shadow">
            3/3 · 3 ataques = COMBO
          </div>
        ) : null}

        {/* Ammo Charges Bar */}
        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: hud.maxAmmo }).map((_, i) => {
            const filled = i < hud.ammo;
            const reloading = i === hud.ammo;
            const comboGlow = hud.comboStep >= 1;
            return (
              <div
                key={i}
                className={`w-12 h-2 rounded-sm bg-slate-900 border overflow-hidden transition-colors ${
                  comboGlow ? 'border-amber-400' : 'border-slate-700'
                }`}
              >
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: filled ? '100%' : reloading ? `${hud.ammoReloadProgress * 100}%` : '0%',
                    backgroundColor: filled
                      ? hud.comboStep >= 2
                        ? '#f97316'
                        : '#fbbf24'
                      : '#94a3b8',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 4 Ability Buttons */}
        <div
          className="pointer-events-auto rounded-xl border border-slate-700/80 p-2 flex items-center gap-2.5 shadow-xl"
          style={{ backgroundColor: 'rgba(13, 20, 36, 0.92)' }}
        >
          {/* Basic Attack Slot */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerSkill('basic');
            }}
            aria-label={`Ataque Principal LMB: ${hero.skills.basic.name}`}
            className={`relative w-14 h-14 rounded-lg border bg-slate-900/90 hover:border-amber-400/80 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              hud.comboStep >= 1 ? 'border-amber-400' : 'border-slate-700'
            }`}
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="LMB" accent={hero.accent} />
            <span className="text-[10px] font-mono-num font-bold text-slate-300 mt-0.5">
              LMB
            </span>
          </button>

          {/* Skill Q */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerSkill('q');
            }}
            aria-label={`Habilidade Q: ${hero.skills.q.name}`}
            className="relative w-14 h-14 rounded-lg border border-slate-700 bg-slate-900/90 hover:border-slate-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="Q" accent={hero.accent} />
            <span className="text-[10px] font-mono-num font-bold text-amber-400 mt-0.5">Q</span>
            {hud.qCooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center font-mono-num text-sm font-bold text-white"
                style={{ backgroundColor: 'rgba(9, 14, 26, 0.8)' }}
              >
                {hud.qCooldown.toFixed(1)}
              </div>
            )}
          </button>

          {/* Skill E */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerSkill('e');
            }}
            aria-label={`Habilidade E: ${hero.skills.e.name}`}
            className="relative w-14 h-14 rounded-lg border border-slate-700 bg-slate-900/90 hover:border-slate-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="E" accent={hero.accent} />
            <span className="text-[10px] font-mono-num font-bold text-amber-400 mt-0.5">E</span>
            {hud.eCooldown > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center font-mono-num text-sm font-bold text-white"
                style={{ backgroundColor: 'rgba(9, 14, 26, 0.8)' }}
              >
                {hud.eCooldown.toFixed(1)}
              </div>
            )}
          </button>

          {/* Skill R (Fury / Ultimate) */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerSkill('r');
            }}
            aria-label={`Fúria R: ${hero.skills.r.name}`}
            className={`relative w-16 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${
              hud.furyCharge >= 100
                ? 'border-amber-400 bg-amber-500/20'
                : 'border-slate-700 bg-slate-900/90'
            }`}
          >
            <SkillSlotIcon heroId={hud.playerHero} slot="R" accent={hud.furyCharge >= 100 ? '#fbbf24' : hero.accent} />
            <span className="text-[10px] font-mono-num font-bold text-amber-300 mt-0.5">
              R · {hud.furyCharge}%
            </span>
            {hud.furyCharge < 100 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-amber-400"
                style={{ width: `${hud.furyCharge}%` }}
              />
            )}
          </button>

          <div className="h-9 w-px bg-slate-700/80 mx-0.5" aria-hidden="true" />

          {/* Quick Emote Radial Menu Trigger */}
          <RadialEmoteMenu
            inlineTrigger
            emoteCooldown={hud.emoteCooldown}
            disabled={hud.hp <= 0}
            onSendEmote={onTriggerEmote}
          />
        </div>
      </div>
      )}

      {isMobile && (
        <RadialEmoteMenu
          isMobile
          emoteCooldown={hud.emoteCooldown}
          disabled={hud.hp <= 0}
          onSendEmote={onTriggerEmote}
        />
      )}
    </div>
  );
};
