import React, { useEffect, useMemo, useState } from 'react';
import { EmoteId } from '../game/emotes';
import {
  HeroEvolutionMap,
  computeEvolvedHeroStats,
  getHeroEvolutionLevel,
} from '../game/heroEvolution';
import { HERO_LIST, HERO_TIER_META, HEROES } from '../game/heroes';
import { getHeroSkinSpec } from '../game/heroSkins';
import { HeroConfig, HeroId, HeroTier, HudSnapshot, SkillMeta } from '../game/types';
import { SkillSlotIcon, SoundIcon } from './GameIcons';
import { RadialEmoteMenu } from './RadialEmoteMenu';

interface TrainingScreenProps {
  hud: HudSnapshot;
  muted: boolean;
  isMobile: boolean;
  heroEvolutions?: HeroEvolutionMap;
  onSwitchHero: (heroId: HeroId) => void;
  onRefreshLab: () => void;
  onTriggerSkill: (slot: 'basic' | 'q' | 'e' | 'r') => void;
  onTriggerEmote: (emoteId: EmoteId) => boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

const ARCHETYPE_NOTES: Record<HeroConfig['archetype'], string> = {
  ambusher: 'Emboscador · Especialista em aproximação rápida, furtividade e eliminações velozes.',
  kiter: 'Atirador · Mantém distância segura para punir inimigos antes que cheguem perto.',
  brawler: 'Combatente · Alta resistência física para controlar o centro da arena e atordoar.',
  zoner: 'Controlador · Domina áreas estratégicas com explosões, armadilhas e pressão contínua.',
};

const TIER_FILTERS: Array<{ id: 'todos' | HeroTier; label: string }> = [
  { id: 'todos', label: 'Todos (21)' },
  { id: 'comum', label: 'Comum' },
  { id: 'epico', label: 'Épico' },
  { id: 'lendario', label: 'Lendário' },
];

function getSkillLearningTip(hero: HeroConfig, skill: SkillMeta): string {
  switch (skill.key) {
    case 'LMB':
      return `Consome 1 barra de munição (${hero.maxAmmo} máx · recarrega em ${hero.ammoReloadTime.toFixed(2)}s). Ataques em sequência com carga cheia ativam Combo x2 (+25%) e x3 (+65%).`;
    case 'Q':
      return `Recarga de ${skill.cooldown.toFixed(1)}s. Use após o ataque básico para ampliar o combo, atravessar obstáculos ou finalizar alvos recuando.`;
    case 'E':
      return `Recarga de ${skill.cooldown.toFixed(1)}s. Ferramenta tática de mobilidade, defesa ou controle para abrir vantagem ou escapar de emboscadas.`;
    case 'R':
      return 'Ultimate de Fúria (carrega ao acertar inimigos e regenera rápido aqui no treino). Libere quando os alvos estiverem agrupados ou atordoados.';
  }
}

export const TrainingScreen: React.FC<TrainingScreenProps> = ({
  hud,
  muted,
  isMobile,
  heroEvolutions = {},
  onSwitchHero,
  onRefreshLab,
  onTriggerSkill,
  onTriggerEmote,
  onToggleMute,
  onExit,
}) => {
  const hero = HEROES[hud.playerHero];
  const activeSkin = getHeroSkinSpec(hud.playerHero, hud.playerSkin);
  const tierMeta = HERO_TIER_META[hero.tier];
  const evoLevel = getHeroEvolutionLevel(heroEvolutions, hud.playerHero);
  const evolvedStats = computeEvolvedHeroStats(hud.playerHero, evoLevel);

  // Expanded by default on desktop; collapsed on mobile so twin-stick arena stays unobstructed
  const [panelOpen, setPanelOpen] = useState<boolean>(
    () => !(isMobile || (typeof window !== 'undefined' && window.innerWidth < 900))
  );
  const [activeTab, setActiveTab] = useState<'powers' | 'heroes'>('powers');
  const [tierFilter, setTierFilter] = useState<'todos' | HeroTier>('todos');
  const [lastTestedSlot, setLastTestedSlot] = useState<SkillMeta['key'] | null>(null);

  useEffect(() => {
    setPanelOpen(!isMobile);
  }, [isMobile]);

  const skillList = useMemo(
    () => [hero.skills.basic, hero.skills.q, hero.skills.e, hero.skills.r],
    [hero]
  );

  const visibleHeroes = useMemo(
    () =>
      tierFilter === 'todos'
        ? HERO_LIST
        : HERO_LIST.filter((item) => item.tier === tierFilter),
    [tierFilter]
  );

  const hpPct = hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100)) : 0;

  const handleTestPower = (key: SkillMeta['key']) => {
    setLastTestedSlot(key);
    const slot = key === 'LMB' ? 'basic' : (key.toLowerCase() as 'q' | 'e' | 'r');
    onTriggerSkill(slot);
  };

  const getSlotStatus = (key: SkillMeta['key']) => {
    if (key === 'LMB') {
      return {
        ready: hud.ammo > 0,
        label: hud.ammo > 0 ? `${hud.ammo}/${hud.maxAmmo} Mun.` : 'Recarregando',
      };
    }
    if (key === 'Q') {
      return {
        ready: hud.qCooldown <= 0.05,
        label: hud.qCooldown <= 0.05 ? 'Pronto' : `${hud.qCooldown.toFixed(1)}s`,
      };
    }
    if (key === 'E') {
      return {
        ready: hud.eCooldown <= 0.05,
        label: hud.eCooldown <= 0.05 ? 'Pronto' : `${hud.eCooldown.toFixed(1)}s`,
      };
    }
    return {
      ready: hud.furyCharge >= 100,
      label: hud.furyCharge >= 100 ? 'Fúria 100%' : `${hud.furyCharge}%`,
    };
  };

  return (
    <div
      data-testid="training-screen"
      className="fixed inset-0 z-30 pointer-events-none select-none flex flex-col justify-between"
    >
      {/* Top Bar: Exit, Active Hero, Live Combat Telemetry & Panel Controls */}
      <header className="pointer-events-auto w-full px-2.5 pt-2.5 sm:px-4 sm:pt-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Return + Active Hero */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            data-testid="training-exit-button"
            onClick={onExit}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-indigo-400/45 bg-slate-950/90 hover:bg-slate-900 text-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span>Menu</span>
          </button>

          <div
            className="rounded-xl border border-indigo-400/35 px-2.5 py-1.5 flex items-center gap-2.5 shadow-lg min-w-0"
            style={{ backgroundColor: 'rgba(11, 17, 42, 0.92)' }}
          >
            <img
              src={hero.portraitUrl}
              alt={hero.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover object-top border shrink-0"
              style={{
                borderColor: activeSkin.accentColor,
                filter:
                  activeSkin.portraitFilter !== 'none'
                    ? activeSkin.portraitFilter
                    : undefined,
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-extrabold text-white leading-none truncate">
                  {hero.name}
                </span>
                {evoLevel > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/50 text-[10px] font-mono-num font-extrabold text-cyan-200 leading-none shrink-0">
                    Évo {evoLevel}
                  </span>
                )}
                <span className="hidden sm:inline text-[11px] font-mono-num text-emerald-300 truncate">
                  · {hud.hp}/{hud.maxHp} HP
                </span>
              </div>
              <div className="w-28 sm:w-36 h-1.5 rounded bg-slate-950 border border-slate-700/80 overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Damage Readout, Refresh Lab, Panel Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div
            data-testid="training-damage-readout"
            className="hidden sm:flex items-center gap-3 rounded-xl border border-indigo-400/30 px-3 py-1.5 text-xs font-mono-num shadow-lg"
            style={{ backgroundColor: 'rgba(11, 17, 42, 0.92)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">Último golpe</span>
              <span className="font-extrabold text-amber-300 tabular-nums">
                {hud.lastHitDamage}
              </span>
            </div>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">Dano total</span>
              <span className="font-extrabold text-cyan-300 tabular-nums">
                {hud.damageDealt}
              </span>
            </div>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans">Fúria</span>
              <span className="font-extrabold text-fuchsia-300 tabular-nums">
                {hud.furyCharge}%
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="training-refresh-button"
            onClick={onRefreshLab}
            title="Zerar recargas, restaurar alvos e encher fúria"
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-amber-400/55 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg"
          >
            Encher Fúria &amp; Alvos
          </button>

          <button
            type="button"
            data-testid="training-tab-powers-btn"
            onClick={() => {
              if (panelOpen && activeTab === 'powers') {
                setPanelOpen(false);
              } else {
                setActiveTab('powers');
                setPanelOpen(true);
              }
            }}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg ${
              panelOpen && activeTab === 'powers'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                : 'border-cyan-400/45 bg-slate-950/90 text-cyan-200 hover:bg-cyan-400/15'
            }`}
          >
            Poderes
          </button>

          <button
            type="button"
            data-testid="training-tab-heroes-btn"
            onClick={() => {
              if (panelOpen && activeTab === 'heroes') {
                setPanelOpen(false);
              } else {
                setActiveTab('heroes');
                setPanelOpen(true);
              }
            }}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg ${
              panelOpen && activeTab === 'heroes'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'border-indigo-400/45 bg-slate-950/90 text-slate-100 hover:bg-indigo-950'
            }`}
          >
            Trocar Herói
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Ativar som' : 'Silenciar som'}
            className="w-10 h-10 rounded-xl border border-indigo-400/35 bg-slate-950/90 hover:bg-slate-900 text-slate-200 flex items-center justify-center cursor-pointer shrink-0 shadow-lg"
          >
            <SoundIcon muted={muted} className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Middle Area: Right Side Drawer/Panel (Guia de Poderes / Seletor de Heróis) */}
      <div className="flex-1 min-h-0 flex justify-end items-stretch px-2.5 py-2 sm:px-4 sm:py-3">
        {panelOpen && (
          <aside
            data-testid="training-side-panel"
            aria-label="Painel de Aprendizado de Poderes e Heróis"
            className="pointer-events-auto w-full sm:w-[390px] lg:w-[410px] max-h-full rounded-2xl border-2 border-indigo-400/40 shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: 'rgba(11, 17, 42, 0.94)' }}
          >
            {/* Panel Header & Segmented Tabs */}
            <div className="p-3 border-b border-indigo-400/20 flex items-center justify-between gap-2 shrink-0">
              <div
                className="grid grid-cols-2 flex-1 p-1 rounded-xl border border-indigo-400/30 gap-1"
                style={{ backgroundColor: 'rgba(8, 12, 28, 0.85)' }}
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'powers'}
                  onClick={() => setActiveTab('powers')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'powers'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Guia de Poderes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'heroes'}
                  onClick={() => setActiveTab('heroes')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'heroes'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Heróis (21)
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Recolher painel de poderes"
                className="w-8 h-8 rounded-lg border border-indigo-400/30 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer shrink-0"
              >
                ×
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-3.5 pb-4 flex flex-col gap-3">
              {activeTab === 'powers' ? (
                <>
                  {/* Hero Overview & Base Attributes */}
                  <div className="flex items-start gap-3">
                    <img
                      src={hero.portraitUrl}
                      alt={hero.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover object-top border-2 shrink-0"
                      style={{
                        borderColor: activeSkin.accentColor,
                        filter:
                          activeSkin.portraitFilter !== 'none'
                            ? activeSkin.portraitFilter
                            : undefined,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2
                          className="font-display text-2xl font-extrabold leading-none truncate"
                          style={{ color: activeSkin.accentColor }}
                        >
                          {hero.name}
                        </h2>
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider shrink-0"
                          style={{ color: tierMeta.color }}
                        >
                          {tierMeta.label}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
                        {hero.title} · {hero.role} · {activeSkin.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {ARCHETYPE_NOTES[hero.archetype]}
                      </p>
                    </div>
                  </div>

                  {/* Evolved / Base Stats Grid */}
                  <div className="grid grid-cols-4 gap-1.5 text-center border-y border-indigo-400/20 py-2.5">
                    <div>
                      <div className="text-[10px] text-slate-400">
                        {evoLevel > 1 ? `HP Évo ${evoLevel}` : 'HP Máx'}
                      </div>
                      <div className="text-xs font-bold text-emerald-300 font-mono-num">
                        {evolvedStats.maxHp}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">
                        {evoLevel > 1 ? `Dano Évo ${evoLevel}` : 'Dano Base'}
                      </div>
                      <div className="text-xs font-bold text-amber-300 font-mono-num">
                        {evolvedStats.attackDamage}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Alcance</div>
                      <div className="text-xs font-bold text-cyan-300 font-mono-num">
                        {hero.attackRange}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Velocidade</div>
                      <div className="text-xs font-bold text-slate-100 font-mono-num">
                        {hero.speed}
                      </div>
                    </div>
                  </div>

                  {/* Compact Mobile Damage Metrics inside Drawer */}
                  <div className="sm:hidden flex items-center justify-between text-xs font-mono-num border-b border-indigo-400/20 pb-2.5">
                    <span className="text-slate-300">
                      Golpe: <strong className="text-amber-300">{hud.lastHitDamage}</strong>
                    </span>
                    <span className="text-slate-300">
                      Total: <strong className="text-cyan-300">{hud.damageDealt}</strong>
                    </span>
                    <span className="text-slate-300">
                      Fúria: <strong className="text-fuchsia-300">{hud.furyCharge}%</strong>
                    </span>
                  </div>

                  {/* All 4 Powers Detailed Learning Cards */}
                  <div className="flex flex-col gap-2.5">
                    {skillList.map((sk) => {
                      const status = getSlotStatus(sk.key);
                      const isJustTested = lastTestedSlot === sk.key;
                      return (
                        <div
                          key={sk.key}
                          data-testid={`training-power-card-${sk.key}`}
                          className={`rounded-xl border p-3 transition-colors ${
                            isJustTested
                              ? 'border-amber-400/80 bg-slate-900/95'
                              : 'border-indigo-400/25 bg-slate-950/75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-700"
                                style={{ backgroundColor: hero.accentSoft }}
                              >
                                <SkillSlotIcon
                                  heroId={hero.id}
                                  slot={sk.key}
                                  accent={hero.accent}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                                  <span className="font-mono-num text-amber-400">
                                    [{sk.key}]
                                  </span>
                                  <span className="truncate">{sk.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {sk.roleTag} · {status.label}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              data-testid={`training-cast-${sk.key}`}
                              onClick={() => handleTestPower(sk.key)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                status.ready
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Testar
                            </button>
                          </div>

                          <p className="text-xs text-slate-100 leading-relaxed mt-2">
                            {sk.description}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                            {getSkillLearningTip(hero, sk)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Tier Filter */}
                  <div
                    className="grid grid-cols-4 p-1 rounded-xl border border-indigo-400/25 gap-1 shrink-0"
                    style={{ backgroundColor: 'rgba(8, 12, 28, 0.85)' }}
                    role="group"
                    aria-label="Filtrar heróis por raridade"
                  >
                    {TIER_FILTERS.map((tab) => {
                      const active = tierFilter === tab.id;
                      const col =
                        tab.id === 'todos' ? '#fbbf24' : HERO_TIER_META[tab.id].color;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTierFilter(tab.id)}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            active ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                          }`}
                          style={active ? { backgroundColor: col } : undefined}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 21-Hero Instant Switcher Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {visibleHeroes.map((item) => {
                      const active = item.id === hud.playerHero;
                      const itemTier = HERO_TIER_META[item.tier];
                      const itemEvo = getHeroEvolutionLevel(heroEvolutions, item.id);
                      const itemStats = computeEvolvedHeroStats(item.id, itemEvo);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`training-hero-option-${item.id}`}
                          onClick={() => {
                            onSwitchHero(item.id);
                            setActiveTab('powers');
                          }}
                          className={`text-left rounded-xl border p-2 flex items-center gap-2 transition-colors cursor-pointer ${
                            active
                              ? 'border-amber-400 bg-indigo-950/90'
                              : 'border-indigo-400/25 bg-slate-950/75 hover:border-indigo-300/60'
                          }`}
                        >
                          <img
                            src={item.portraitUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover object-top shrink-0 border"
                            style={{ borderColor: item.accent }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-extrabold text-white truncate">
                                {item.name}
                              </span>
                              {itemEvo > 1 && (
                                <span className="text-[9px] font-mono-num font-bold text-cyan-300 shrink-0">
                                  Évo {itemEvo}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-300 truncate">
                              {item.role}
                            </div>
                            <div
                              className="text-[10px] font-bold truncate"
                              style={{ color: itemTier.color }}
                            >
                              {itemTier.label} · ATK {itemStats.attackDamage}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Desktop Skill Bar (Mobile uses MobileControls twin-stick overlay) */}
      {!isMobile && (
        <div
          data-testid="training-combo-dock"
          data-combo-step={hud.comboStep}
          data-ammo={hud.ammo}
          className="pointer-events-none px-4 pb-3 flex flex-col items-center gap-1.5"
        >
          {hud.comboStep >= 2 ? (
            <div
              data-testid="training-combo-indicator"
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
          <div
            className="pointer-events-auto rounded-2xl border border-indigo-400/35 px-3 py-2 flex items-center gap-2.5 shadow-2xl"
            style={{ backgroundColor: 'rgba(11, 17, 42, 0.92)' }}
          >
            {/* Ammo Bars + Basic Button */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                handleTestPower('LMB');
              }}
              className={`px-3 py-1.5 rounded-xl border bg-slate-950/90 hover:border-amber-400/70 flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                hud.comboStep >= 1 ? 'border-amber-400' : 'border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: hud.maxAmmo }).map((_, i) => {
                  const filled = i < hud.ammo;
                  const reloading = i === hud.ammo;
                  return (
                    <div
                      key={i}
                      className={`w-6 h-1.5 rounded-sm bg-slate-900 border overflow-hidden ${
                        hud.comboStep >= 1 ? 'border-amber-400' : 'border-slate-700'
                      }`}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: filled
                            ? '100%'
                            : reloading
                            ? `${Math.min(100, Math.round(hud.ammoReloadProgress * 100))}%`
                            : '0%',
                          backgroundColor: filled
                            ? hud.comboStep >= 2
                              ? '#f97316'
                              : '#fbbf24'
                            : '#38bdf8',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-bold text-slate-200 whitespace-nowrap">
                LMB · {hero.skills.basic.name}
              </span>
            </button>

            {/* Q / E / R Quick Cast */}
            {(['Q', 'E', 'R'] as const).map((key) => {
              const sk = key === 'Q' ? hero.skills.q : key === 'E' ? hero.skills.e : hero.skills.r;
              const status = getSlotStatus(key);
              return (
                <button
                  key={key}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleTestPower(key);
                  }}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-colors cursor-pointer ${
                    status.ready
                      ? key === 'R'
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                        : 'border-cyan-400/55 bg-slate-950/90 text-white hover:bg-slate-900'
                      : 'border-slate-700 bg-slate-950/80 text-slate-400'
                  }`}
                >
                  <SkillSlotIcon heroId={hero.id} slot={key} accent={hero.accent} />
                  <div className="text-left">
                    <div className="text-[11px] font-extrabold leading-none whitespace-nowrap">
                      {key} · {sk.name}
                    </div>
                    <div className="text-[10px] font-mono-num text-slate-300 mt-0.5 whitespace-nowrap">
                      {status.label}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="h-7 w-px bg-slate-700/80" aria-hidden="true" />
            <RadialEmoteMenu
              inlineTrigger
              emoteCooldown={hud.emoteCooldown}
              onSendEmote={onTriggerEmote}
            />
          </div>
          <p className="text-[11px] text-slate-300">
            WASD Mover · Mouse Mirar/Atirar · Q / E / R Poderes · T Emotes · Esc Sair do Treino
          </p>
        </div>
      )}

      {isMobile && !panelOpen && (
        <RadialEmoteMenu
          isMobile
          emoteCooldown={hud.emoteCooldown}
          onSendEmote={onTriggerEmote}
        />
      )}
    </div>
  );
};
