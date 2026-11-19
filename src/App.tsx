/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, onAuthStateChanged } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { BattlePassModal } from './components/BattlePassModal';
import { DailyQuestsModal } from './components/DailyQuestsModal';
import { GameHud } from './components/GameHud';
import { HeroEvolutionModal } from './components/HeroEvolutionModal';
import { HeroMasteryModal } from './components/HeroMasteryModal';
import { MobileControls } from './components/MobileControls';
import { RankingModal } from './components/RankingModal';
import { RecentMatchesModal } from './components/RecentMatchesModal';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { TrainingScreen } from './components/TrainingScreen';
import { VoiceLineToast } from './components/VoiceLineToast';
import { auth } from './firebase';
import { MAPS_META } from './game/arena';
import { soundEngine } from './game/audio';
import {
  BattlePassState,
  BattlePassTrack,
  applyMatchToBattlePass,
  applyQuestBonusToBattlePass,
  claimAllAvailableBattlePassRewards,
  claimBattlePassReward,
  unlockEliteBattlePass,
} from './game/battlePass';
import { EmoteId } from './game/emotes';
import { VoiceLineEvent } from './game/voiceLines';
import {
  MatchRewardBreakdown,
  PlayerProgressionState,
  applyMatchRewardToProgression,
  applyMatchToDailyQuests,
  claimDailyQuestReward,
  computeLevelInfo,
  countClaimableDailyQuests,
  ensureDailyProgressionState,
  getLocalDateKey,
} from './game/dailyQuests';
import { ThetanEngine } from './game/engine';
import {
  HeroEvolutionMap,
  evolveAllEligibleHeroes,
  evolveHeroOnce,
  getHeroEvolutionLevel,
} from './game/heroEvolution';
import {
  HeroMasteryMap,
  MasteryFrameId,
  applyMatchToHeroMastery,
  computeHeroMasteryProgress,
  equipHeroMasteryFrame,
  evolveAccountMasteryFrames,
  evolveHeroMasteryFrameOnce,
  getMasteryTierByFrameId,
} from './game/heroMastery';
import {
  HeroSkinsMap,
  equipHeroSkin,
  resolveEquippedHeroSkin,
} from './game/heroSkins';
import { HEROES } from './game/heroes';
import { LevelUpEvent, detectAccountLevelUp } from './game/levelUp';
import { MAX_STORM_RADIUS } from './game/physics';
import {
  GameMode,
  GamePhase,
  HeroId,
  HeroSkinId,
  HudSnapshot,
  MapId,
  RankingEntry,
  RecentMatchEntry,
  UserProfile,
} from './game/types';
import {
  ensureUserDocuments,
  logoutAccount,
  recordMatchResult,
  subscribeLeaderboard,
  subscribeRecentMatches,
} from './services/accountService';
import {
  LoginStreakBonusInfo,
  loadLocalProgressionWithLoginStreak,
  saveLocalProgression,
  syncClaimToFirestore,
  syncDailyQuestsToFirestore,
  syncLoadProgressionFromFirestore,
  syncMatchCompletionToFirestore,
} from './services/dailyQuestsService';
import {
  loadLocalHeroMastery,
  saveLocalHeroMastery,
  syncHeroMasteryFrameToFirestore,
  syncHeroMasteryFrameUpgradesToFirestore,
  syncHeroMasteryMatchToFirestore,
  syncLoadHeroMasteryFromFirestore,
} from './services/heroMasteryService';
import {
  loadLocalBattlePass,
  saveLocalBattlePass,
  syncBattlePassClaimToFirestore,
  syncBattlePassXpToFirestore,
  syncLoadBattlePassFromFirestore,
  syncUnlockEliteBattlePassToFirestore,
} from './services/battlePassService';
import {
  loadLocalHeroSkins,
  saveLocalHeroSkins,
  syncEquipHeroSkinToFirestore,
  syncLoadHeroSkinsFromFirestore,
} from './services/heroSkinsService';
import {
  loadLocalHeroEvolutions,
  saveLocalHeroEvolutions,
  syncHeroEvolutionUpgradesToFirestore,
  syncLoadHeroEvolutionsFromFirestore,
} from './services/heroEvolutionService';

const VALID_MODES: GameMode[] = ['royale', 'brawl', 'superstar', 'tower'];

let guestBootResolved = false;
let guestBootCache: { state: PlayerProgressionState; loginBonus: LoginStreakBonusInfo | null } | null = null;

function getInitialGuestProgression(): {
  state: PlayerProgressionState;
  loginBonus: LoginStreakBonusInfo | null;
} {
  if (!guestBootResolved || !guestBootCache) {
    guestBootResolved = true;
    guestBootCache = loadLocalProgressionWithLoginStreak(null);
  }
  return guestBootCache;
}

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  mode: 'royale',
  mapId: 'coliseu',
  playerHero: 'steelshot',
  playerSkin: 'classic',
  hp: HEROES.steelshot.maxHp,
  maxHp: HEROES.steelshot.maxHp,
  ghostHp: HEROES.steelshot.maxHp,
  shield: 0,
  powerCubes: 0,
  starsHeld: 0,
  ammo: HEROES.steelshot.maxAmmo,
  maxAmmo: HEROES.steelshot.maxAmmo,
  ammoReloadProgress: 0,
  comboStep: 0,
  qCooldown: 0,
  qMaxCooldown: HEROES.steelshot.skills.q.cooldown,
  eCooldown: 0,
  eMaxCooldown: HEROES.steelshot.skills.e.cooldown,
  furyCharge: 0,
  aliveCount: 8,
  totalCombatants: 8,
  allyScore: 0,
  enemyScore: 0,
  targetScore: 12,
  allyTowerHp: 8500,
  allyTowerMaxHp: 8500,
  enemyTowerHp: 8500,
  enemyTowerMaxHp: 8500,
  starCountdown: null,
  starLeader: null,
  timeRemaining: 120,
  playerKills: 0,
  playerDeaths: 0,
  elapsedTime: 0,
  stormRadius: MAX_STORM_RADIUS,
  maxStormRadius: MAX_STORM_RADIUS,
  inStorm: false,
  inBush: false,
  isStealthed: false,
  respawnTimer: 0,
  victory: false,
  placement: 1,
  damageDealt: 0,
  damageTaken: 0,
  lastHitDamage: 0,
  emoteCooldown: 0,
  killFeed: [],
  killStreak: null,
  deathCam: null,
  minimapActors: [],
  minimapCrates: [],
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ThetanEngine | null>(null);

  const [selectedHero, setSelectedHero] = useState<HeroId>('steelshot');
  const [selectedMode, setSelectedMode] = useState<GameMode>('royale');
  const [selectedMap, setSelectedMap] = useState<MapId>('coliseu');
  const [phase, setPhase] = useState<GamePhase>('title');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState<boolean>(false);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 900 ||
      window.innerHeight < 560 ||
      Boolean(window.matchMedia?.('(pointer: coarse)').matches)
    );
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [rankingModalOpen, setRankingModalOpen] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
  const [rankLoading, setRankLoading] = useState<boolean>(true);
  const [rankError, setRankError] = useState<string | null>(null);
  const [trophyDelta, setTrophyDelta] = useState<number | null>(null);
  const [savingRank, setSavingRank] = useState<boolean>(false);
  const [progression, setProgression] = useState<PlayerProgressionState>(
    () => getInitialGuestProgression().state
  );
  const [loginBonus, setLoginBonus] = useState<LoginStreakBonusInfo | null>(
    () => getInitialGuestProgression().loginBonus
  );
  const [welcomeGiftGems, setWelcomeGiftGems] = useState<number | null>(null);
  const [matchReward, setMatchReward] = useState<MatchRewardBreakdown | null>(null);
  const [questsModalOpen, setQuestsModalOpen] = useState<boolean>(false);
  const [recentMatchesModalOpen, setRecentMatchesModalOpen] = useState<boolean>(false);
  const [recentMatches, setRecentMatches] = useState<RecentMatchEntry[]>([]);
  const [recentMatchesLoading, setRecentMatchesLoading] = useState<boolean>(false);
  const [recentMatchesError, setRecentMatchesError] = useState<string | null>(null);
  const [progressedQuestIds, setProgressedQuestIds] = useState<string[]>([]);
  const [heroMastery, setHeroMastery] = useState<HeroMasteryMap>(() =>
    loadLocalHeroMastery(null)
  );
  const [heroSkins, setHeroSkins] = useState<HeroSkinsMap>(() =>
    loadLocalHeroSkins(null)
  );
  const [heroEvolutions, setHeroEvolutions] = useState<HeroEvolutionMap>(() =>
    loadLocalHeroEvolutions(null)
  );
  const [evolutionModalOpen, setEvolutionModalOpen] = useState<boolean>(false);
  const [evolutionSyncing, setEvolutionSyncing] = useState<boolean>(false);
  const [evolutionBanner, setEvolutionBanner] = useState<string | null>(null);
  const [battlePass, setBattlePass] = useState<BattlePassState>(() =>
    loadLocalBattlePass(null)
  );
  const [battlePassModalOpen, setBattlePassModalOpen] = useState<boolean>(false);
  const [battlePassGain, setBattlePassGain] = useState<{
    xpGained: number;
    tierUp: boolean;
    newTier: number;
  } | null>(null);
  const [battlePassBanner, setBattlePassBanner] = useState<string | null>(null);
  const [requestedRightTab, setRequestedRightTab] = useState<{
    tab: 'heroes' | 'skins';
    nonce: number;
  } | null>(null);
  const [masteryModalOpen, setMasteryModalOpen] = useState<boolean>(false);
  const [masterySyncing, setMasterySyncing] = useState<boolean>(false);
  const [masteryBanner, setMasteryBanner] = useState<string | null>(null);
  const [masteryGainInfo, setMasteryGainInfo] = useState<{
    leveledUp: boolean;
    newlyUnlockedFrames: MasteryFrameId[];
  } | null>(null);
  const [lastRewardBanner, setLastRewardBanner] = useState<{
    questTitle: string;
    xp: number;
    gems: number;
  } | null>(null);
  const [activeVoiceLine, setActiveVoiceLine] = useState<VoiceLineEvent | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);

  const selectedHeroRef = useRef<HeroId>(selectedHero);
  const phaseRef = useRef<GamePhase>(phase);
  const selectedModeRef = useRef<GameMode>(selectedMode);
  const selectedMapRef = useRef<MapId>(selectedMap);
  const firebaseUserRef = useRef<User | null>(null);
  const progressionRef = useRef<PlayerProgressionState>(progression);
  const heroMasteryRef = useRef<HeroMasteryMap>(heroMastery);
  const heroSkinsRef = useRef<HeroSkinsMap>(heroSkins);
  const heroEvolutionsRef = useRef<HeroEvolutionMap>(heroEvolutions);
  const battlePassRef = useRef<BattlePassState>(battlePass);
  const matchRecordedRef = useRef<boolean>(false);
  const questsRecordedRef = useRef<boolean>(false);
  const masteryRecordedRef = useRef<boolean>(false);
  const battlePassRecordedRef = useRef<boolean>(false);
  selectedHeroRef.current = selectedHero;
  phaseRef.current = phase;
  selectedModeRef.current = selectedMode;
  selectedMapRef.current = selectedMap;
  firebaseUserRef.current = firebaseUser;
  progressionRef.current = progression;
  heroMasteryRef.current = heroMastery;
  heroSkinsRef.current = heroSkins;
  heroEvolutionsRef.current = heroEvolutions;
  battlePassRef.current = battlePass;

  useEffect(() => {
    let hideTimer: number | null = null;
    const unsub = soundEngine.subscribeVoiceLine((event) => {
      setActiveVoiceLine(event);
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        setActiveVoiceLine((curr) => (curr?.id === event.id ? null : curr));
      }, 2800);
    });
    return () => {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
      }
      unsub();
    };
  }, []);

  useEffect(() => {
    const syncMobileState = () => {
      const next =
        window.innerWidth < 900 ||
        window.innerHeight < 560 ||
        Boolean(window.matchMedia?.('(pointer: coarse)').matches);
      setIsMobileLayout(next);
      engineRef.current?.setTouchControlsActive(next);
    };
    syncMobileState();
    window.addEventListener('resize', syncMobileState);
    return () => window.removeEventListener('resize', syncMobileState);
  }, []);

  useEffect(() => {
    let active = true;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setFirebaseUser(fbUser);
      firebaseUserRef.current = fbUser;
      if (fbUser) {
        try {
          const profile = await ensureUserDocuments(
            fbUser,
            fbUser.displayName ?? undefined,
            selectedHeroRef.current
          );
          if (active) setCurrentUser(profile);
          const [remoteRes, remoteMastery, remoteSkins, remoteBattlePass, remoteEvolutions] =
            await Promise.all([
              syncLoadProgressionFromFirestore(fbUser),
              syncLoadHeroMasteryFromFirestore(fbUser),
              syncLoadHeroSkinsFromFirestore(fbUser),
              syncLoadBattlePassFromFirestore(fbUser),
              syncLoadHeroEvolutionsFromFirestore(fbUser),
            ]);
          if (active) {
            progressionRef.current = remoteRes.state;
            setProgression(remoteRes.state);
            if (remoteRes.loginBonus) {
              setLoginBonus(remoteRes.loginBonus);
            }
            if (remoteRes.welcomeGiftGems) {
              setWelcomeGiftGems(remoteRes.welcomeGiftGems);
              soundEngine.playQuestClaim();
            }
            heroMasteryRef.current = remoteMastery;
            setHeroMastery(remoteMastery);
            heroSkinsRef.current = remoteSkins;
            setHeroSkins(remoteSkins);
            heroEvolutionsRef.current = remoteEvolutions;
            setHeroEvolutions(remoteEvolutions);
            battlePassRef.current = remoteBattlePass;
            setBattlePass(remoteBattlePass);
            const activeSkin = resolveEquippedHeroSkin(
              selectedHeroRef.current,
              remoteSkins[selectedHeroRef.current],
              remoteMastery[selectedHeroRef.current],
              remoteBattlePass.unlockedCosmetics
            );
            engineRef.current?.previewHeroSkin(selectedHeroRef.current, activeSkin.id);
          }
        } catch (err) {
          console.error('Erro ao carregar perfil do jogador:', err);
        } finally {
          if (active) setAuthReady(true);
        }
      } else {
        setCurrentUser(null);
        setWelcomeGiftGems(null);
        const guestRes = loadLocalProgressionWithLoginStreak(null);
        progressionRef.current = guestRes.state;
        setProgression(guestRes.state);
        if (guestRes.loginBonus) {
          setLoginBonus(guestRes.loginBonus);
        }
        const guestMastery = loadLocalHeroMastery(null);
        heroMasteryRef.current = guestMastery;
        setHeroMastery(guestMastery);
        const guestSkins = loadLocalHeroSkins(null);
        heroSkinsRef.current = guestSkins;
        setHeroSkins(guestSkins);
        const guestEvolutions = loadLocalHeroEvolutions(null);
        heroEvolutionsRef.current = guestEvolutions;
        setHeroEvolutions(guestEvolutions);
        const guestBattlePass = loadLocalBattlePass(null);
        battlePassRef.current = guestBattlePass;
        setBattlePass(guestBattlePass);
        const activeSkin = resolveEquippedHeroSkin(
          selectedHeroRef.current,
          guestSkins[selectedHeroRef.current],
          guestMastery[selectedHeroRef.current],
          guestBattlePass.unlockedCosmetics
        );
        engineRef.current?.previewHeroSkin(selectedHeroRef.current, activeSkin.id);
        setAuthReady(true);
      }
    });

    const unsubRank = subscribeLeaderboard(
      (rows) => {
        if (!active) return;
        setLeaderboard(rows);
        setRankLoading(false);
        setRankError(null);
      },
      (err) => {
        if (!active) return;
        setRankError(err.message);
        setRankLoading(false);
      }
    );

    return () => {
      active = false;
      unsubAuth();
      unsubRank();
    };
  }, []);

  useEffect(() => {
    if (!recentMatchesModalOpen || !firebaseUser) {
      setRecentMatchesLoading(false);
      if (!firebaseUser) {
        setRecentMatches([]);
        setRecentMatchesError(null);
      }
      return;
    }

    setRecentMatchesLoading(true);
    setRecentMatchesError(null);
    const unsub = subscribeRecentMatches(
      firebaseUser.uid,
      (rows) => {
        setRecentMatches(rows);
        setRecentMatchesLoading(false);
        setRecentMatchesError(null);
      },
      (err) => {
        setRecentMatchesError(err.message);
        setRecentMatchesLoading(false);
      }
    );

    return () => unsub();
  }, [recentMatchesModalOpen, firebaseUser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const heroParam = params.get('hero') as HeroId | null;
    const modeParam = params.get('mode') as GameMode | null;
    const mapParam = params.get('map') as MapId | null;
    const initialHero: HeroId =
      heroParam && heroParam in HEROES ? heroParam : selectedHeroRef.current;
    const initialMode: GameMode =
      modeParam && VALID_MODES.includes(modeParam) ? modeParam : selectedModeRef.current;
    const initialMap: MapId =
      mapParam && mapParam in MAPS_META ? mapParam : selectedMapRef.current;
    if (initialHero !== selectedHeroRef.current) setSelectedHero(initialHero);
    if (initialMode !== selectedModeRef.current) setSelectedMode(initialMode);
    if (initialMap !== selectedMapRef.current) setSelectedMap(initialMap);

    document.body.dataset.state = autostart ? 'playing' : 'title';

    const engine = new ThetanEngine(
      canvas,
      (snapshot) => setHud(snapshot),
      (nextPhase) => setPhase(nextPhase)
    );
    engineRef.current = engine;
    engine.setTouchControlsActive(
      window.innerWidth < 900 ||
        window.innerHeight < 560 ||
        Boolean(window.matchMedia?.('(pointer: coarse)').matches) ||
        (navigator?.maxTouchPoints ?? 0) > 0
    );
    if (initialMap !== 'coliseu') {
      engine.previewMap(initialMap);
    }
    const initialSkin = resolveEquippedHeroSkin(
      initialHero,
      heroSkinsRef.current[initialHero],
      heroMasteryRef.current[initialHero],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engine.previewHeroSkin(initialHero, initialSkin);
    engine.startLoop();

    let previewTimer: number | undefined;
    if (autostart) {
      matchRecordedRef.current = false;
      questsRecordedRef.current = false;
      masteryRecordedRef.current = false;
      battlePassRecordedRef.current = false;
      engine.startMatch(
        initialHero,
        initialMode,
        initialMap,
        initialSkin,
        getHeroEvolutionLevel(heroEvolutionsRef.current, initialHero)
      );
      if (import.meta.env.DEV && params.get('previewVictory') === '1') {
        previewTimer = window.setTimeout(() => {
          engine.triggerVictoryBeat();
        }, 900);
      } else if (import.meta.env.DEV && params.get('previewStreak')) {
        const streakCount = Number(params.get('previewStreak'));
        if (Number.isFinite(streakCount) && streakCount >= 2) {
          previewTimer = window.setTimeout(() => {
            engine.triggerKillStreakPreview(streakCount);
          }, 500);
        }
      } else if (import.meta.env.DEV && params.get('previewDeathCam')) {
        const dcMode = params.get('previewDeathCam');
        if (dcMode === 'killer' || dcMode === 'teammate' || dcMode === 'postRespawn') {
          previewTimer = window.setTimeout(() => {
            engine.triggerDeathCamPreview(dcMode);
          }, 500);
        }
      }
    }

    return () => {
      if (previewTimer !== undefined) window.clearTimeout(previewTimer);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Automatically record ranked match statistics once when transitioning into gameover
  useEffect(() => {
    if (phase !== 'gameover') return;
    const fbUser = firebaseUserRef.current;
    if (!fbUser || matchRecordedRef.current) return;

    matchRecordedRef.current = true;
    let cancelled = false;
    setSavingRank(true);

    recordMatchResult(fbUser, {
      victory: hud.victory,
      kills: hud.playerKills,
      mode: hud.mode,
      placement: hud.placement,
      heroId: hud.playerHero,
    })
      .then((res) => {
        if (cancelled) return;
        setCurrentUser(res.profile);
        setTrophyDelta(res.delta);
      })
      .catch((err) => {
        console.error('Erro ao salvar pontuação no ranking:', err);
      })
      .finally(() => {
        if (!cancelled) setSavingRank(false);
      });

    return () => {
      cancelled = true;
    };
  }, [phase, hud.victory, hud.playerKills, hud.mode, hud.placement, hud.playerHero]);

  // Automatically update Daily Quests progress once when transitioning into gameover
  useEffect(() => {
    if (phase !== 'gameover' || questsRecordedRef.current) return;
    questsRecordedRef.current = true;

    const fbUser = firebaseUserRef.current;
    const today = getLocalDateKey();
    const current = ensureDailyProgressionState(
      progressionRef.current,
      today,
      fbUser?.uid || 'guest'
    );
    const matchTelemetry = {
      victory: hud.victory,
      kills: hud.playerKills,
      damageDealt: hud.damageDealt,
      powerCubes: hud.powerCubes,
      mode: hud.mode,
      placement: hud.placement,
    };
    const prevXp = current.xp;
    const updated = applyMatchToDailyQuests(current, matchTelemetry);
    const rewarded = applyMatchRewardToProgression(updated.state, matchTelemetry);

    progressionRef.current = rewarded.state;
    setProgression(rewarded.state);
    setProgressedQuestIds(updated.progressedIds);
    setMatchReward(rewarded.reward);
    let detectedLevelUp = detectAccountLevelUp(prevXp, rewarded.state.xp, 'match');
    if (
      !detectedLevelUp &&
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('previewLevelUp') === '1'
    ) {
      detectedLevelUp = detectAccountLevelUp(140, 275, 'match');
    }
    if (detectedLevelUp) {
      setLevelUpEvent(detectedLevelUp);
    }
    saveLocalProgression(rewarded.state, fbUser?.uid || null);

    if (fbUser) {
      syncMatchCompletionToFirestore(
        fbUser,
        rewarded.state,
        rewarded.reward.gems,
        rewarded.reward.xp
      ).catch((err) => {
        console.error('Erro ao sincronizar recompensas da partida:', err);
        return syncDailyQuestsToFirestore(fbUser, rewarded.state);
      });
    }
  }, [phase, hud.victory, hud.playerKills, hud.damageDealt, hud.powerCubes, hud.mode, hud.placement]);

  // Automatically update Hero Mastery (matches & kills) once when transitioning into gameover
  useEffect(() => {
    if (phase !== 'gameover' || masteryRecordedRef.current) return;
    masteryRecordedRef.current = true;

    const fbUser = firebaseUserRef.current;
    const res = applyMatchToHeroMastery(
      heroMasteryRef.current,
      hud.playerHero,
      hud.playerKills
    );
    heroMasteryRef.current = res.nextMap;
    setHeroMastery(res.nextMap);
    setMasteryGainInfo({
      leveledUp: res.leveledUp,
      newlyUnlockedFrames: res.newlyUnlockedFrames,
    });
    saveLocalHeroMastery(res.nextMap, fbUser?.uid || null);

    if (fbUser) {
      syncHeroMasteryMatchToFirestore(
        fbUser,
        hud.playerHero,
        hud.playerKills,
        res.updatedStats.equippedFrame
      ).catch((err) => {
        console.error('Erro ao salvar maestria do herói:', err);
      });
    }
  }, [phase, hud.playerHero, hud.playerKills]);

  // Automatically award seasonal Battle Pass XP once when transitioning into gameover
  useEffect(() => {
    if (phase !== 'gameover' || battlePassRecordedRef.current) return;
    battlePassRecordedRef.current = true;

    const fbUser = firebaseUserRef.current;
    const res = applyMatchToBattlePass(battlePassRef.current, {
      victory: hud.victory,
      kills: hud.playerKills,
      placement: hud.placement,
      mode: hud.mode,
    });
    battlePassRef.current = res.state;
    setBattlePass(res.state);
    setBattlePassGain({
      xpGained: res.xpGained,
      tierUp: res.tierUp,
      newTier: res.newTier,
    });
    saveLocalBattlePass(res.state, fbUser?.uid || null);

    if (fbUser) {
      syncBattlePassXpToFirestore(fbUser, res.state).catch((err) => {
        console.error('Erro ao salvar XP do Passe de Batalha:', err);
      });
    }
  }, [phase, hud.victory, hud.playerKills, hud.placement, hud.mode]);

  const handleSelectHero = useCallback((heroId: HeroId) => {
    setSelectedHero(heroId);
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.previewHeroSkin(heroId, activeSkin);
    soundEngine.playVoiceLine(heroId, 'select');
  }, []);

  const handleEquipSkin = useCallback((heroId: HeroId, skinId: HeroSkinId) => {
    const res = equipHeroSkin(
      heroSkinsRef.current,
      heroId,
      skinId,
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    );
    if (!res.equipped) return;

    const fbUser = firebaseUserRef.current;
    heroSkinsRef.current = res.nextMap;
    setHeroSkins(res.nextMap);
    saveLocalHeroSkins(res.nextMap, fbUser?.uid || null);

    if (selectedHeroRef.current === heroId) {
      engineRef.current?.previewHeroSkin(heroId, res.skin.id);
    }

    if (fbUser) {
      syncEquipHeroSkinToFirestore(fbUser, heroId, res.skin.id).catch((err) => {
        console.error('Erro ao salvar skin equipada:', err);
      });
    }
  }, []);

  const handleSelectMap = useCallback((mapId: MapId) => {
    setSelectedMap(mapId);
    engineRef.current?.previewMap(mapId);
  }, []);

  const handleStart = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
    canvasRef.current?.focus?.();
    matchRecordedRef.current = false;
    questsRecordedRef.current = false;
    masteryRecordedRef.current = false;
    battlePassRecordedRef.current = false;
    setProgressedQuestIds([]);
    setMatchReward(null);
    setLevelUpEvent(null);
    setMasteryGainInfo(null);
    setBattlePassGain(null);
    setTrophyDelta(null);
    const heroId = selectedHeroRef.current;
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.startMatch(
      heroId,
      selectedModeRef.current,
      selectedMapRef.current,
      activeSkin,
      getHeroEvolutionLevel(heroEvolutionsRef.current, heroId)
    );
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !soundEngine.isMuted();
    soundEngine.setMuted(next);
    setMuted(next);
    if (next) {
      setActiveVoiceLine(null);
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleResume = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
    canvasRef.current?.focus?.();
    engineRef.current?.setPhase('playing');
  }, []);

  const handleRestart = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
    canvasRef.current?.focus?.();
    matchRecordedRef.current = false;
    questsRecordedRef.current = false;
    masteryRecordedRef.current = false;
    battlePassRecordedRef.current = false;
    setProgressedQuestIds([]);
    setMatchReward(null);
    setLevelUpEvent(null);
    setMasteryGainInfo(null);
    setBattlePassGain(null);
    setTrophyDelta(null);
    const heroId = selectedHeroRef.current;
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.startMatch(
      heroId,
      selectedModeRef.current,
      selectedMapRef.current,
      activeSkin,
      getHeroEvolutionLevel(heroEvolutionsRef.current, heroId)
    );
  }, []);

  const handleReturnTitle = useCallback(() => {
    matchRecordedRef.current = false;
    questsRecordedRef.current = false;
    masteryRecordedRef.current = false;
    battlePassRecordedRef.current = false;
    setProgressedQuestIds([]);
    setMatchReward(null);
    setLevelUpEvent(null);
    setMasteryGainInfo(null);
    setBattlePassGain(null);
    setTrophyDelta(null);
    engineRef.current?.returnToTitle();
  }, []);

  const handleStartTraining = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
    canvasRef.current?.focus?.();
    const heroId = selectedHeroRef.current;
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.startTraining(
      heroId,
      selectedMapRef.current,
      activeSkin,
      getHeroEvolutionLevel(heroEvolutionsRef.current, heroId)
    );
  }, []);

  const handleSwitchTrainingHero = useCallback((heroId: HeroId) => {
    setSelectedHero(heroId);
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.switchTrainingHero(
      heroId,
      activeSkin,
      getHeroEvolutionLevel(heroEvolutionsRef.current, heroId)
    );
    soundEngine.playVoiceLine(heroId, 'select');
  }, []);

  const handleRefreshTraining = useCallback(() => {
    canvasRef.current?.focus?.();
    engineRef.current?.refreshTrainingLab();
  }, []);

  const handleOpenQuests = useCallback(() => {
    const fbUser = firebaseUserRef.current;
    const synced = ensureDailyProgressionState(
      progressionRef.current,
      getLocalDateKey(),
      fbUser?.uid || 'guest'
    );
    progressionRef.current = synced;
    setProgression(synced);
    saveLocalProgression(synced, fbUser?.uid || null);
    setLastRewardBanner(null);
    setQuestsModalOpen(true);
  }, []);

  const handleClaimQuest = useCallback((questId: string) => {
    const fbUser = firebaseUserRef.current;
    const current = ensureDailyProgressionState(
      progressionRef.current,
      getLocalDateKey(),
      fbUser?.uid || 'guest'
    );
    const prevXp = current.xp;
    const questMeta = current.quests.find((q) => q.id === questId);
    const res = claimDailyQuestReward(current, questId);
    if (!res.claimed) return;

    progressionRef.current = res.state;
    setProgression(res.state);
    saveLocalProgression(res.state, fbUser?.uid || null);
    soundEngine.playQuestClaim();
    if (phaseRef.current === 'gameover') {
      const questLevelUp = detectAccountLevelUp(prevXp, res.state.xp, 'quest');
      if (questLevelUp) {
        setLevelUpEvent((prev) =>
          prev
            ? detectAccountLevelUp(prev.previousXp, res.state.xp, 'quest') ?? questLevelUp
            : questLevelUp
        );
      }
    }
    if (questMeta) {
      setLastRewardBanner({
        questTitle: questMeta.title,
        xp: res.xpGained,
        gems: res.gemsGained,
      });
    }

    const bpRes = applyQuestBonusToBattlePass(battlePassRef.current, 40);
    battlePassRef.current = bpRes.state;
    setBattlePass(bpRes.state);
    saveLocalBattlePass(bpRes.state, fbUser?.uid || null);

    if (fbUser) {
      syncClaimToFirestore(fbUser, res.state).catch((err) => {
        console.error('Erro ao salvar recompensa da missão:', err);
      });
      syncBattlePassXpToFirestore(fbUser, bpRes.state).catch((err) => {
        console.error('Erro ao salvar XP bônus do Passe de Batalha:', err);
      });
    }
  }, []);

  const handleOpenBattlePass = useCallback(() => {
    setBattlePassBanner(null);
    setBattlePassModalOpen(true);
  }, []);

  const handleClaimBattlePassReward = useCallback(
    (tier: number, track: BattlePassTrack) => {
      const fbUser = firebaseUserRef.current;
      const res = claimBattlePassReward(battlePassRef.current, tier, track);
      if (!res.claimed) return;

      battlePassRef.current = res.state;
      setBattlePass(res.state);
      saveLocalBattlePass(res.state, fbUser?.uid || null);
      soundEngine.playQuestClaim();

      if (res.gemsGained > 0) {
        const nextProg: PlayerProgressionState = {
          ...progressionRef.current,
          gems: Math.max(0, progressionRef.current.gems + res.gemsGained),
        };
        progressionRef.current = nextProg;
        setProgression(nextProg);
        saveLocalProgression(nextProg, fbUser?.uid || null);
      }

      setBattlePassBanner(
        res.gemsGained > 0
          ? `Patamar ${tier} (${track === 'elite' ? 'Elite' : 'Grátis'}) resgatado: +${res.gemsGained} Gemas!`
          : `Cosmético desbloqueado: ${res.reward?.label ?? 'Skin Sazonal'}! Equipe na aba Skins.`
      );

      if (fbUser) {
        syncBattlePassClaimToFirestore(fbUser, res.state, res.gemsGained).catch(
          (err) => {
            console.error('Erro ao salvar resgate do Passe de Batalha:', err);
          }
        );
      }
    },
    []
  );

  const handleClaimAllBattlePassRewards = useCallback(() => {
    const fbUser = firebaseUserRef.current;
    const res = claimAllAvailableBattlePassRewards(battlePassRef.current);
    if (res.claimedCount === 0) return;

    battlePassRef.current = res.state;
    setBattlePass(res.state);
    saveLocalBattlePass(res.state, fbUser?.uid || null);
    soundEngine.playQuestClaim();

    if (res.gemsGained > 0) {
      const nextProg: PlayerProgressionState = {
        ...progressionRef.current,
        gems: Math.max(0, progressionRef.current.gems + res.gemsGained),
      };
      progressionRef.current = nextProg;
      setProgression(nextProg);
      saveLocalProgression(nextProg, fbUser?.uid || null);
    }

    setBattlePassBanner(
      `${res.claimedCount} recompensas resgatadas! ${
        res.gemsGained > 0 ? `+${res.gemsGained} Gemas` : ''
      } ${
        res.newlyUnlockedCosmetics.length > 0
          ? `· ${res.newlyUnlockedCosmetics.length} desbloqueios de skins`
          : ''
      }`.trim()
    );

    if (fbUser) {
      syncBattlePassClaimToFirestore(fbUser, res.state, res.gemsGained).catch(
        (err) => {
          console.error('Erro ao salvar resgate em lote do Passe de Batalha:', err);
        }
      );
    }
  }, []);

  const handleUnlockEliteBattlePass = useCallback(() => {
    const fbUser = firebaseUserRef.current;
    const res = unlockEliteBattlePass(
      battlePassRef.current,
      progressionRef.current.gems
    );
    if (!res.unlocked) return;

    battlePassRef.current = res.state;
    setBattlePass(res.state);
    saveLocalBattlePass(res.state, fbUser?.uid || null);

    const nextProg: PlayerProgressionState = {
      ...progressionRef.current,
      gems: res.remainingGems,
    };
    progressionRef.current = nextProg;
    setProgression(nextProg);
    saveLocalProgression(nextProg, fbUser?.uid || null);

    soundEngine.playQuestClaim();
    setBattlePassBanner(
      'Passe Elite ativado! Agora você pode resgatar todas as recompensas exclusivas.'
    );

    if (fbUser) {
      syncUnlockEliteBattlePassToFirestore(fbUser, res.state.seasonXp).catch(
        (err) => {
          console.error('Erro ao ativar Passe Elite:', err);
        }
      );
    }
  }, []);

  const handleInspectBattlePassHeroSkin = useCallback((heroId: HeroId) => {
    setBattlePassModalOpen(false);
    setSelectedHero(heroId);
    const activeSkin = resolveEquippedHeroSkin(
      heroId,
      heroSkinsRef.current[heroId],
      heroMasteryRef.current[heroId],
      battlePassRef.current.unlockedCosmetics
    ).id;
    engineRef.current?.previewHeroSkin(heroId, activeSkin);
    setRequestedRightTab({ tab: 'skins', nonce: Date.now() });
  }, []);

  const handleOpenEvolutionModal = useCallback(() => {
    setEvolutionBanner(null);
    setEvolutionModalOpen(true);
  }, []);

  const handleEvolveHero = useCallback(async (heroId: HeroId) => {
    if (evolutionSyncing) return;
    const fbUser = firebaseUserRef.current;
    const prevMap = heroEvolutionsRef.current;
    const prevProg = progressionRef.current;
    const res = evolveHeroOnce(prevMap, heroId, prevProg.gems);
    if (!res.evolved || !res.upgrade) return;

    const nextProg: PlayerProgressionState = {
      ...prevProg,
      gems: res.nextGems,
    };
    heroEvolutionsRef.current = res.nextMap;
    setHeroEvolutions(res.nextMap);
    saveLocalHeroEvolutions(res.nextMap, fbUser?.uid || null);
    progressionRef.current = nextProg;
    setProgression(nextProg);
    saveLocalProgression(nextProg, fbUser?.uid || null);

    soundEngine.playQuestClaim();
    setEvolutionBanner(
      `${HEROES[heroId].name} evoluiu para o Nv.${res.upgrade.newLevel}! (-${res.upgrade.costGems} Gemas)`
    );

    if (fbUser) {
      setEvolutionSyncing(true);
      try {
        const synced = await syncHeroEvolutionUpgradesToFirestore(fbUser, [res.upgrade]);
        heroEvolutionsRef.current = synced.syncedMap;
        setHeroEvolutions(synced.syncedMap);
        const syncedProg: PlayerProgressionState = {
          ...progressionRef.current,
          gems: synced.syncedGems,
        };
        progressionRef.current = syncedProg;
        setProgression(syncedProg);
        saveLocalProgression(syncedProg, fbUser.uid);
      } catch (err) {
        console.error('Erro ao evoluir herói no Firestore:', err);
        heroEvolutionsRef.current = prevMap;
        setHeroEvolutions(prevMap);
        saveLocalHeroEvolutions(prevMap, fbUser.uid);
        progressionRef.current = prevProg;
        setProgression(prevProg);
        saveLocalProgression(prevProg, fbUser.uid);
        setEvolutionBanner('Não foi possível sincronizar a evolução com o Firestore. Tente novamente.');
      } finally {
        setEvolutionSyncing(false);
      }
    }
  }, [evolutionSyncing]);

  const handleEvolveAllHeroes = useCallback(async () => {
    if (evolutionSyncing) return;
    const fbUser = firebaseUserRef.current;
    const prevMap = heroEvolutionsRef.current;
    const prevProg = progressionRef.current;
    const res = evolveAllEligibleHeroes(prevMap, prevProg.gems, selectedHeroRef.current);
    if (res.evolvedCount === 0 || res.upgrades.length === 0) return;

    const nextProg: PlayerProgressionState = {
      ...prevProg,
      gems: res.nextGems,
    };
    heroEvolutionsRef.current = res.nextMap;
    setHeroEvolutions(res.nextMap);
    saveLocalHeroEvolutions(res.nextMap, fbUser?.uid || null);
    progressionRef.current = nextProg;
    setProgression(nextProg);
    saveLocalProgression(nextProg, fbUser?.uid || null);

    soundEngine.playQuestClaim();
    setEvolutionBanner(
      `${res.evolvedCount} ${res.evolvedCount === 1 ? 'evolução aplicada' : 'evoluções aplicadas'} na sua conta! (-${res.totalCostGems} Gemas)`
    );

    if (fbUser) {
      setEvolutionSyncing(true);
      try {
        const synced = await syncHeroEvolutionUpgradesToFirestore(fbUser, res.upgrades);
        heroEvolutionsRef.current = synced.syncedMap;
        setHeroEvolutions(synced.syncedMap);
        const syncedProg: PlayerProgressionState = {
          ...progressionRef.current,
          gems: synced.syncedGems,
        };
        progressionRef.current = syncedProg;
        setProgression(syncedProg);
        saveLocalProgression(syncedProg, fbUser.uid);
      } catch (err) {
        console.error('Erro ao evoluir heróis no Firestore:', err);
        heroEvolutionsRef.current = prevMap;
        setHeroEvolutions(prevMap);
        saveLocalHeroEvolutions(prevMap, fbUser.uid);
        progressionRef.current = prevProg;
        setProgression(prevProg);
        saveLocalProgression(prevProg, fbUser.uid);
        setEvolutionBanner('Não foi possível sincronizar todas as evoluções com o Firestore. Tente novamente.');
      } finally {
        setEvolutionSyncing(false);
      }
    }
  }, [evolutionSyncing]);

  const handleTriggerSkill = useCallback((slot: 'basic' | 'q' | 'e' | 'r') => {
    engineRef.current?.triggerSkillFromUi(slot);
  }, []);

  const handleTriggerEmote = useCallback((emoteId: EmoteId) => {
    return engineRef.current?.triggerPlayerEmote(emoteId) ?? false;
  }, []);

  const handleMobileMove = useCallback((dx: number, dy: number) => {
    engineRef.current?.setVirtualMove(dx, dy);
  }, []);

  const handleMobileAim = useCallback((dx: number, dy: number, firing: boolean) => {
    engineRef.current?.setVirtualAim(dx, dy, firing);
  }, []);

  const handleMobileAttackTap = useCallback(() => {
    engineRef.current?.triggerVirtualAttackTap();
  }, []);

  const handleFocusHero = useCallback(() => {
    canvasRef.current?.focus?.();
    engineRef.current?.focusPlayerCamera();
  }, []);

  const handleOpenAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const handleEquipMasteryFrame = useCallback(
    (framePreference: MasteryFrameId | 'auto') => {
      const heroId = selectedHeroRef.current;
      const res = equipHeroMasteryFrame(
        heroMasteryRef.current,
        heroId,
        framePreference
      );
      if (!res.equipped) return;

      const fbUser = firebaseUserRef.current;
      heroMasteryRef.current = res.nextMap;
      setHeroMastery(res.nextMap);
      saveLocalHeroMastery(res.nextMap, fbUser?.uid || null);

      if (fbUser) {
        syncHeroMasteryFrameToFirestore(fbUser, res.updatedStats).catch((err) => {
          console.error('Erro ao salvar moldura equipada:', err);
        });
      }
    },
    []
  );

  const handleEvolveHeroFrame = useCallback(async () => {
    if (masterySyncing) return;
    const heroId = selectedHeroRef.current;
    const fbUser = firebaseUserRef.current;
    const prevMap = heroMasteryRef.current;
    const prevProg = progressionRef.current;
    const res = evolveHeroMasteryFrameOnce(prevMap, heroId, prevProg.gems);
    if (!res.evolved || !res.upgrade) return;

    const nextProg: PlayerProgressionState = {
      ...prevProg,
      gems: res.nextGems,
    };
    heroMasteryRef.current = res.nextMap;
    setHeroMastery(res.nextMap);
    saveLocalHeroMastery(res.nextMap, fbUser?.uid || null);
    progressionRef.current = nextProg;
    setProgression(nextProg);
    saveLocalProgression(nextProg, fbUser?.uid || null);

    soundEngine.playQuestClaim();
    const spec = getMasteryTierByFrameId(res.upgrade.newFrameId);
    setMasteryBanner(
      `Moldura de ${HEROES[heroId].name} evoluída para Nv.${res.upgrade.newLevel} (${spec.frameName})! (-${res.upgrade.costGems} Gemas)`
    );

    if (fbUser) {
      setMasterySyncing(true);
      try {
        const synced = await syncHeroMasteryFrameUpgradesToFirestore(fbUser, [res.upgrade]);
        heroMasteryRef.current = synced.syncedMap;
        setHeroMastery(synced.syncedMap);
        const syncedProg: PlayerProgressionState = {
          ...progressionRef.current,
          gems: synced.syncedGems,
        };
        progressionRef.current = syncedProg;
        setProgression(syncedProg);
        saveLocalProgression(syncedProg, fbUser.uid);
      } catch (err) {
        console.error('Erro ao evoluir moldura no Firestore:', err);
        heroMasteryRef.current = prevMap;
        setHeroMastery(prevMap);
        saveLocalHeroMastery(prevMap, fbUser.uid);
        progressionRef.current = prevProg;
        setProgression(prevProg);
        saveLocalProgression(prevProg, fbUser.uid);
        setMasteryBanner(
          'Não foi possível sincronizar a evolução da moldura com o Firestore. Tente novamente.'
        );
      } finally {
        setMasterySyncing(false);
      }
    }
  }, [masterySyncing]);

  const handleEvolveAllFrames = useCallback(async () => {
    if (masterySyncing) return;
    const fbUser = firebaseUserRef.current;
    const prevMap = heroMasteryRef.current;
    const prevProg = progressionRef.current;
    const res = evolveAccountMasteryFrames(
      prevMap,
      prevProg.gems,
      selectedHeroRef.current
    );
    if (res.evolvedCount === 0 || res.upgrades.length === 0) return;

    const nextProg: PlayerProgressionState = {
      ...prevProg,
      gems: res.nextGems,
    };
    heroMasteryRef.current = res.nextMap;
    setHeroMastery(res.nextMap);
    saveLocalHeroMastery(res.nextMap, fbUser?.uid || null);
    progressionRef.current = nextProg;
    setProgression(nextProg);
    saveLocalProgression(nextProg, fbUser?.uid || null);

    soundEngine.playQuestClaim();
    setMasteryBanner(
      `${res.evolvedCount} ${
        res.evolvedCount === 1 ? 'nível de moldura evoluído' : 'níveis de moldura evoluídos'
      } na sua conta! (-${res.totalCostGems} Gemas)`
    );

    if (fbUser) {
      setMasterySyncing(true);
      try {
        const synced = await syncHeroMasteryFrameUpgradesToFirestore(fbUser, res.upgrades);
        heroMasteryRef.current = synced.syncedMap;
        setHeroMastery(synced.syncedMap);
        const syncedProg: PlayerProgressionState = {
          ...progressionRef.current,
          gems: synced.syncedGems,
        };
        progressionRef.current = syncedProg;
        setProgression(syncedProg);
        saveLocalProgression(syncedProg, fbUser.uid);
      } catch (err) {
        console.error('Erro ao evoluir molduras da conta no Firestore:', err);
        heroMasteryRef.current = prevMap;
        setHeroMastery(prevMap);
        saveLocalHeroMastery(prevMap, fbUser.uid);
        progressionRef.current = prevProg;
        setProgression(prevProg);
        saveLocalProgression(prevProg, fbUser.uid);
        setMasteryBanner(
          'Não foi possível sincronizar todas as molduras com o Firestore. Tente novamente.'
        );
      } finally {
        setMasterySyncing(false);
      }
    }
  }, [masterySyncing]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutAccount();
      setCurrentUser(null);
      setTrophyDelta(null);
    } catch (err) {
      console.error('Erro ao sair da conta:', err);
    }
  }, []);

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-[#090e1a] select-none">
      {/* Isolated Canvas2D Playfield */}
      <canvas
        ref={canvasRef}
        data-testid="arena-canvas"
        tabIndex={0}
        className="block w-full h-full outline-none cursor-crosshair touch-none"
      />

      {phase === 'title' && (
        <TitleScreen
          selectedHero={selectedHero}
          selectedMode={selectedMode}
          selectedMap={selectedMap}
          currentUser={currentUser}
          authReady={authReady}
          leaderboardCount={leaderboard.length}
          playerLevel={computeLevelInfo(progression.xp).level}
          playerGems={progression.gems}
          loginStreak={Math.max(1, progression.loginStreak || 1)}
          loginBonus={loginBonus}
          claimableQuestsCount={countClaimableDailyQuests(progression)}
          completedQuestsCount={progression.quests.filter((q) => q.completed).length}
          heroMastery={heroMastery}
          heroSkins={heroSkins}
          heroEvolutions={heroEvolutions}
          battlePass={battlePass}
          requestedRightTab={requestedRightTab}
          disableStartHotkey={
            authModalOpen ||
            rankingModalOpen ||
            questsModalOpen ||
            battlePassModalOpen ||
            recentMatchesModalOpen ||
            masteryModalOpen ||
            evolutionModalOpen
          }
          onSelectHero={handleSelectHero}
          onEquipSkin={handleEquipSkin}
          onSelectMode={setSelectedMode}
          onSelectMap={handleSelectMap}
          onOpenAuth={handleOpenAuth}
          onOpenRanking={() => setRankingModalOpen(true)}
          onOpenRecentMatches={() => setRecentMatchesModalOpen(true)}
          onOpenQuests={handleOpenQuests}
          onOpenBattlePass={handleOpenBattlePass}
          onOpenMasteryModal={() => {
            setMasteryBanner(null);
            setMasteryModalOpen(true);
          }}
          onOpenEvolutionModal={handleOpenEvolutionModal}
          onDismissLoginBonus={() => setLoginBonus(null)}
          welcomeGiftGems={welcomeGiftGems}
          onDismissWelcomeGift={() => setWelcomeGiftGems(null)}
          onLogout={handleLogout}
          onStart={handleStart}
          onOpenTraining={handleStartTraining}
        />
      )}

      {phase === 'playing' && (
        <GameHud
          hud={hud}
          muted={muted}
          isMobile={isMobileLayout}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onRestart={handleRestart}
          onTriggerSkill={handleTriggerSkill}
          onTriggerEmote={handleTriggerEmote}
          onFocusHero={handleFocusHero}
        />
      )}

      {phase === 'training' && (
        <TrainingScreen
          hud={hud}
          muted={muted}
          isMobile={isMobileLayout}
          heroEvolutions={heroEvolutions}
          onSwitchHero={handleSwitchTrainingHero}
          onRefreshLab={handleRefreshTraining}
          onTriggerSkill={handleTriggerSkill}
          onTriggerEmote={handleTriggerEmote}
          onToggleMute={handleToggleMute}
          onExit={handleReturnTitle}
        />
      )}

      {(phase === 'playing' || phase === 'training') && isMobileLayout && (
        <MobileControls
          hud={hud}
          onMoveChange={handleMobileMove}
          onAimChange={handleMobileAim}
          onAttackTap={handleMobileAttackTap}
          onTriggerSkill={handleTriggerSkill}
        />
      )}

      {(phase === 'paused' || phase === 'gameover') && (
        <StatusModal
          hud={hud}
          isSignedIn={Boolean(currentUser)}
          trophyDelta={trophyDelta}
          totalTrophies={currentUser?.trophies ?? null}
          savingRank={savingRank}
          progression={progression}
          progressedQuestIds={progressedQuestIds}
          battlePass={battlePass}
          battlePassGain={battlePassGain}
          heroMasteryProgress={computeHeroMasteryProgress(
            hud.playerHero,
            heroMastery[hud.playerHero]
          )}
          masteryGainInfo={masteryGainInfo}
          matchReward={matchReward}
          levelUpEvent={levelUpEvent}
          onClaimQuest={handleClaimQuest}
          onOpenQuests={handleOpenQuests}
          onOpenBattlePass={handleOpenBattlePass}
          onOpenRecentMatches={() => setRecentMatchesModalOpen(true)}
          onOpenAuth={() => handleOpenAuth('login')}
          onResume={handleResume}
          onRestart={handleRestart}
          onReturnTitle={handleReturnTitle}
        />
      )}

      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        favoriteHero={selectedHero}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(profile) => setCurrentUser(profile)}
      />

      <RankingModal
        open={rankingModalOpen}
        entries={leaderboard}
        loading={rankLoading}
        errorMsg={rankError}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth('login')}
        onClose={() => setRankingModalOpen(false)}
      />

      <RecentMatchesModal
        open={recentMatchesModalOpen}
        matches={recentMatches}
        loading={recentMatchesLoading}
        errorMsg={recentMatchesError}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth('login')}
        onClose={() => setRecentMatchesModalOpen(false)}
      />

      <DailyQuestsModal
        open={questsModalOpen}
        progression={progression}
        loginBonus={loginBonus}
        lastRewardBanner={lastRewardBanner}
        onClaimQuest={handleClaimQuest}
        onClose={() => setQuestsModalOpen(false)}
      />

      <BattlePassModal
        open={battlePassModalOpen}
        battlePass={battlePass}
        playerGems={progression.gems}
        selectedHero={selectedHero}
        lastBanner={battlePassBanner}
        onClaimReward={handleClaimBattlePassReward}
        onClaimAll={handleClaimAllBattlePassRewards}
        onUnlockElite={handleUnlockEliteBattlePass}
        onInspectHeroSkin={handleInspectBattlePassHeroSkin}
        onClose={() => setBattlePassModalOpen(false)}
      />

      <HeroMasteryModal
        open={masteryModalOpen}
        hero={HEROES[selectedHero]}
        progress={computeHeroMasteryProgress(
          selectedHero,
          heroMastery[selectedHero]
        )}
        heroMastery={heroMastery}
        playerGems={progression.gems}
        isSignedIn={Boolean(currentUser)}
        syncing={masterySyncing}
        statusBanner={masteryBanner}
        equippedSkin={resolveEquippedHeroSkin(
          selectedHero,
          heroSkins[selectedHero],
          heroMastery[selectedHero],
          battlePass.unlockedCosmetics
        )}
        onEquipFrame={handleEquipMasteryFrame}
        onEvolveHeroFrame={handleEvolveHeroFrame}
        onEvolveAllFrames={handleEvolveAllFrames}
        onClose={() => setMasteryModalOpen(false)}
      />

      <HeroEvolutionModal
        open={evolutionModalOpen}
        selectedHero={selectedHero}
        heroEvolutions={heroEvolutions}
        heroMastery={heroMastery}
        heroSkins={heroSkins}
        unlockedCosmetics={battlePass.unlockedCosmetics}
        playerGems={progression.gems}
        isSignedIn={Boolean(currentUser)}
        syncing={evolutionSyncing}
        statusBanner={evolutionBanner}
        onSelectHero={handleSelectHero}
        onEvolveHero={handleEvolveHero}
        onEvolveAll={handleEvolveAllHeroes}
        onClose={() => setEvolutionModalOpen(false)}
      />

      <VoiceLineToast
        event={activeVoiceLine}
        heroSkins={heroSkins}
        heroMastery={heroMastery}
        unlockedCosmetics={battlePass.unlockedCosmetics}
        phase={phase}
      />
    </main>
  );
}
