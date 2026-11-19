import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  HeroEvolutionMap,
  HeroEvolutionUpgradeEntry,
  MIN_HERO_EVOLUTION_LEVEL,
  clampHeroEvolutionLevel,
  sanitizeHeroEvolutionMap,
} from '../game/heroEvolution';
import { isValidHeroId } from '../game/heroMastery';

const STORAGE_PREFIX = 'thetan_hero_evolution_v1:';

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalHeroEvolutions(uid?: string | null): HeroEvolutionMap {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return {};
    return sanitizeHeroEvolutionMap(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

export function saveLocalHeroEvolutions(
  map: HeroEvolutionMap,
  uid?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify(sanitizeHeroEvolutionMap(map))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export async function syncLoadHeroEvolutionsFromFirestore(
  user: User
): Promise<HeroEvolutionMap> {
  const path = `users/${user.uid}/heroEvolutions`;
  const q = query(
    collection(db, 'users', user.uid, 'heroEvolutions'),
    where('uid', '==', user.uid),
    limit(30)
  );

  let snap;
  try {
    snap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  const remote: HeroEvolutionMap = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data() as { heroId?: unknown; level?: unknown };
    const heroId = data.heroId ?? docSnap.id;
    if (!isValidHeroId(heroId)) return;
    const lvl = clampHeroEvolutionLevel(data.level);
    if (lvl > MIN_HERO_EVOLUTION_LEVEL) {
      remote[heroId] = lvl;
    }
  });

  saveLocalHeroEvolutions(remote, user.uid);
  return remote;
}

/**
 * Splits a sequence of +1 evolution upgrades into waves where each wave
 * contains at most one upgrade per heroId so every writeBatch satisfies
 * single-step Firestore rules cleanly.
 */
function splitUpgradesIntoWaves(
  upgrades: readonly HeroEvolutionUpgradeEntry[]
): HeroEvolutionUpgradeEntry[][] {
  const waves: HeroEvolutionUpgradeEntry[][] = [];
  for (const entry of upgrades) {
    let placed = false;
    for (const wave of waves) {
      if (!wave.some((w) => w.heroId === entry.heroId)) {
        wave.push(entry);
        placed = true;
        break;
      }
    }
    if (!placed) {
      waves.push([entry]);
    }
  }
  return waves;
}

export async function syncHeroEvolutionUpgradesToFirestore(
  user: User,
  upgrades: readonly HeroEvolutionUpgradeEntry[]
): Promise<{ syncedGems: number; syncedMap: HeroEvolutionMap }> {
  if (upgrades.length === 0) {
    const currentLocal = loadLocalHeroEvolutions(user.uid);
    return { syncedGems: 0, syncedMap: currentLocal };
  }

  const walletPath = `users/${user.uid}/progression/wallet`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');

  let walletSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }

  if (!walletSnap.exists()) {
    throw new Error('Carteira de gemas não encontrada para evoluir heróis.');
  }

  const walletData = walletSnap.data() as { gems?: unknown };
  let serverGems =
    typeof walletData.gems === 'number' && Number.isFinite(walletData.gems)
      ? Math.max(0, Math.floor(walletData.gems))
      : 0;

  const currentRemoteMap: HeroEvolutionMap = {
    ...(await syncLoadHeroEvolutionsFromFirestore(user)),
  };
  const waves = splitUpgradesIntoWaves(upgrades);

  for (const wave of waves) {
    const waveCost = wave.reduce((sum, item) => sum + item.costGems, 0);
    if (serverGems < waveCost) break;

    const batch = writeBatch(db);
    const nextGems = serverGems - waveCost;

    batch.update(walletRef, {
      gems: nextGems,
      updatedAt: serverTimestamp(),
    });

    for (const item of wave) {
      const heroPath = `users/${user.uid}/heroEvolutions/${item.heroId}`;
      const heroRef = doc(db, 'users', user.uid, 'heroEvolutions', item.heroId);
      const currentLevel = currentRemoteMap[item.heroId] ?? MIN_HERO_EVOLUTION_LEVEL;

      if (currentLevel <= MIN_HERO_EVOLUTION_LEVEL && item.newLevel === 2) {
        batch.set(heroRef, {
          uid: user.uid,
          heroId: item.heroId,
          level: 2,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        currentRemoteMap[item.heroId] = 2;
      } else if (item.newLevel === currentLevel + 1) {
        batch.update(heroRef, {
          level: item.newLevel,
          updatedAt: serverTimestamp(),
        });
        currentRemoteMap[item.heroId] = item.newLevel;
      } else {
        throw new Error(`Transição de evolução inválida em ${heroPath}`);
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, walletPath);
    }

    serverGems = nextGems;
  }

  saveLocalHeroEvolutions(currentRemoteMap, user.uid);
  return { syncedGems: serverGems, syncedMap: currentRemoteMap };
}
