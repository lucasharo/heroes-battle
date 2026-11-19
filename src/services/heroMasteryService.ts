import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  HeroMasteryMap,
  HeroMasteryStats,
  MASTERY_POINTS_PER_KILL,
  MASTERY_POINTS_PER_MATCH,
  MASTERY_TIERS,
  MAX_HERO_BONUS_POINTS,
  MasteryFrameId,
  MasteryFrameUpgradeEntry,
  computeHeroMasteryProgress,
  isValidHeroId,
  mergeHeroMasteryMaps,
  sanitizeHeroMasteryMap,
  sanitizeHeroMasteryStats,
} from '../game/heroMastery';
import { HeroId } from '../game/types';

const STORAGE_PREFIX = 'thetan_hero_mastery_v1:';

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalHeroMastery(uid?: string | null): HeroMasteryMap {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeHeroMasteryMap(parsed);
  } catch {
    return {};
  }
}

export function saveLocalHeroMastery(
  map: HeroMasteryMap,
  uid?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify(sanitizeHeroMasteryMap(map))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export async function syncLoadHeroMasteryFromFirestore(
  user: User
): Promise<HeroMasteryMap> {
  const local = loadLocalHeroMastery(user.uid);
  const path = `users/${user.uid}/heroMastery`;
  const q = query(
    collection(db, 'users', user.uid, 'heroMastery'),
    where('uid', '==', user.uid),
    limit(30)
  );

  let snap;
  try {
    snap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  const remote: HeroMasteryMap = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Partial<HeroMasteryStats>;
    const heroId = data.heroId ?? docSnap.id;
    if (!isValidHeroId(heroId)) return;
    remote[heroId] = sanitizeHeroMasteryStats(heroId, data);
  });

  const merged = mergeHeroMasteryMaps(local, remote);
  saveLocalHeroMastery(merged, user.uid);
  return merged;
}

function resolveSafeEquippedFrame(
  heroId: HeroId,
  matches: number,
  kills: number,
  bonusPoints: number,
  desired?: MasteryFrameId | 'auto'
): MasteryFrameId | 'auto' {
  if (!desired || desired === 'auto') return 'auto';
  const progress = computeHeroMasteryProgress(heroId, {
    heroId,
    matches,
    kills,
    bonusPoints,
    equippedFrame: desired,
  });
  return progress.unlockedFrames.includes(desired) ? desired : 'auto';
}

export async function syncHeroMasteryMatchToFirestore(
  user: User,
  heroId: HeroId,
  killsInMatch: number,
  preferredFrame?: MasteryFrameId | 'auto'
): Promise<HeroMasteryStats> {
  const path = `users/${user.uid}/heroMastery/${heroId}`;
  const ref = doc(db, 'users', user.uid, 'heroMastery', heroId);
  const clampedKills = Math.max(0, Math.min(40, Math.floor(killsInMatch || 0)));

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    const existing = sanitizeHeroMasteryStats(
      heroId,
      snap.data() as Partial<HeroMasteryStats>
    );
    const nextMatches = Math.min(100000, existing.matches + 1);
    const nextKills = Math.min(1000000, existing.kills + clampedKills);
    const bonusPoints = existing.bonusPoints ?? 0;
    const nextEquipped = resolveSafeEquippedFrame(
      heroId,
      nextMatches,
      nextKills,
      bonusPoints,
      preferredFrame ?? existing.equippedFrame
    );

    try {
      await updateDoc(ref, {
        matches: nextMatches,
        kills: nextKills,
        equippedFrame: nextEquipped,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }

    return sanitizeHeroMasteryStats(heroId, {
      heroId,
      matches: nextMatches,
      kills: nextKills,
      bonusPoints,
      equippedFrame: nextEquipped,
    });
  }

  const nextEquipped = resolveSafeEquippedFrame(
    heroId,
    1,
    clampedKills,
    0,
    preferredFrame ?? 'auto'
  );
  try {
    await setDoc(ref, {
      uid: user.uid,
      heroId,
      matches: 1,
      kills: clampedKills,
      equippedFrame: nextEquipped,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    heroId,
    matches: 1,
    kills: clampedKills,
    equippedFrame: nextEquipped,
  };
}

export async function syncHeroMasteryFrameToFirestore(
  user: User,
  stats: HeroMasteryStats
): Promise<void> {
  const path = `users/${user.uid}/heroMastery/${stats.heroId}`;
  const ref = doc(db, 'users', user.uid, 'heroMastery', stats.heroId);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    const existing = sanitizeHeroMasteryStats(
      stats.heroId,
      snap.data() as Partial<HeroMasteryStats>
    );
    const safeEquipped = resolveSafeEquippedFrame(
      stats.heroId,
      existing.matches,
      existing.kills,
      existing.bonusPoints ?? 0,
      stats.equippedFrame
    );
    try {
      await updateDoc(ref, {
        equippedFrame: safeEquipped,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return;
  }

  const safeEquipped = resolveSafeEquippedFrame(
    stats.heroId,
    0,
    0,
    0,
    stats.equippedFrame
  );
  const tier0 = MASTERY_TIERS[0].frameId;
  try {
    await setDoc(ref, {
      uid: user.uid,
      heroId: stats.heroId,
      matches: 0,
      kills: 0,
      equippedFrame: safeEquipped === 'auto' || safeEquipped === tier0 ? safeEquipped : 'auto',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function splitFrameUpgradesIntoWaves(
  upgrades: readonly MasteryFrameUpgradeEntry[]
): MasteryFrameUpgradeEntry[][] {
  const waves: MasteryFrameUpgradeEntry[][] = [];
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

export async function syncHeroMasteryFrameUpgradesToFirestore(
  user: User,
  upgrades: readonly MasteryFrameUpgradeEntry[]
): Promise<{ syncedGems: number; syncedMap: HeroMasteryMap }> {
  if (upgrades.length === 0) {
    return {
      syncedGems: 0,
      syncedMap: loadLocalHeroMastery(user.uid),
    };
  }

  const walletPath = `users/${user.uid}/progression/wallet`;
  const masteryPath = `users/${user.uid}/heroMastery`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');
  const masteryQuery = query(
    collection(db, 'users', user.uid, 'heroMastery'),
    where('uid', '==', user.uid),
    limit(30)
  );

  let walletSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }

  if (!walletSnap.exists()) {
    throw new Error('Carteira de gemas não encontrada para evoluir molduras.');
  }

  const walletData = walletSnap.data() as { gems?: unknown };
  let serverGems =
    typeof walletData.gems === 'number' && Number.isFinite(walletData.gems)
      ? Math.max(0, Math.floor(walletData.gems))
      : 0;

  let masterySnap;
  try {
    masterySnap = await getDocs(masteryQuery);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, masteryPath);
  }

  const existingRemoteDocs = new Set<string>();
  const serverRemoteMap: HeroMasteryMap = {};
  masterySnap.forEach((docSnap) => {
    const data = docSnap.data() as Partial<HeroMasteryStats>;
    const heroId = data.heroId ?? docSnap.id;
    if (!isValidHeroId(heroId)) return;
    existingRemoteDocs.add(heroId);
    serverRemoteMap[heroId] = sanitizeHeroMasteryStats(heroId, data);
  });

  const waves = splitFrameUpgradesIntoWaves(upgrades);

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
      const heroRef = doc(db, 'users', user.uid, 'heroMastery', item.heroId);
      const current = sanitizeHeroMasteryStats(item.heroId, serverRemoteMap[item.heroId]);
      const basePts =
        current.matches * MASTERY_POINTS_PER_MATCH +
        current.kills * MASTERY_POINTS_PER_KILL;
      const currentBonus = current.bonusPoints ?? 0;

      if (!existingRemoteDocs.has(item.heroId)) {
        const initialBonus = Math.max(60, Math.min(1250, item.targetMinPoints));
        batch.set(heroRef, {
          uid: user.uid,
          heroId: item.heroId,
          matches: 0,
          kills: 0,
          bonusPoints: initialBonus,
          equippedFrame: 'auto',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        existingRemoteDocs.add(item.heroId);
        serverRemoteMap[item.heroId] = sanitizeHeroMasteryStats(item.heroId, {
          heroId: item.heroId,
          matches: 0,
          kills: 0,
          bonusPoints: initialBonus,
          equippedFrame: 'auto',
        });
      } else {
        const neededForTier = Math.max(0, item.targetMinPoints - basePts);
        const nextBonus = Math.min(
          MAX_HERO_BONUS_POINTS,
          Math.max(
            currentBonus + 1,
            Math.min(currentBonus + 1250, Math.max(neededForTier, item.nextBonusPoints))
          )
        );
        batch.update(heroRef, {
          bonusPoints: nextBonus,
          equippedFrame: 'auto',
          updatedAt: serverTimestamp(),
        });
        serverRemoteMap[item.heroId] = sanitizeHeroMasteryStats(item.heroId, {
          heroId: item.heroId,
          matches: current.matches,
          kills: current.kills,
          bonusPoints: nextBonus,
          equippedFrame: 'auto',
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, walletPath);
    }

    serverGems = nextGems;
  }

  saveLocalHeroMastery(serverRemoteMap, user.uid);
  return { syncedGems: serverGems, syncedMap: serverRemoteMap };
}
