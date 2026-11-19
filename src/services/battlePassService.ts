import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  BATTLE_PASS_ELITE_COST_GEMS,
  BATTLE_PASS_SEASON_ID,
  BattlePassState,
  createDefaultBattlePassState,
  getBattlePassTierForXp,
  mergeBattlePassStates,
  sanitizeBattlePassState,
} from '../game/battlePass';
import { getLocalDateKey } from '../game/dailyQuests';

const STORAGE_PREFIX = 'thetan_battle_pass_v1:';

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalBattlePass(uid?: string | null): BattlePassState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultBattlePassState();
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return createDefaultBattlePassState();
    return sanitizeBattlePassState(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultBattlePassState();
  }
}

export function saveLocalBattlePass(
  state: BattlePassState,
  uid?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify(sanitizeBattlePassState(state))
    );
  } catch {
    // Ignore storage quota errors
  }
}

const inFlightBattlePassLoad = new Map<string, Promise<BattlePassState>>();

export async function syncLoadBattlePassFromFirestore(
  user: User
): Promise<BattlePassState> {
  const existing = inFlightBattlePassLoad.get(user.uid);
  if (existing) return existing;

  const promise = syncLoadBattlePassFromFirestoreInternal(user).finally(() => {
    inFlightBattlePassLoad.delete(user.uid);
  });
  inFlightBattlePassLoad.set(user.uid, promise);
  return promise;
}

async function ensureBattlePassDocExists(user: User, seedXp = 0): Promise<BattlePassState> {
  const path = `users/${user.uid}/battlePass/${BATTLE_PASS_SEASON_ID}`;
  const ref = doc(db, 'users', user.uid, 'battlePass', BATTLE_PASS_SEASON_ID);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    return sanitizeBattlePassState(snap.data());
  }

  const boundedInitialXp = Math.min(400, Math.max(0, Math.floor(seedXp)));
  const fresh: BattlePassState = {
    seasonId: BATTLE_PASS_SEASON_ID,
    seasonXp: boundedInitialXp,
    premiumUnlocked: false,
    claimedFreeTiers: [],
    claimedEliteTiers: [],
    unlockedCosmetics: [],
  };

  try {
    await setDoc(ref, {
      uid: user.uid,
      seasonId: BATTLE_PASS_SEASON_ID,
      seasonXp: fresh.seasonXp,
      premiumUnlocked: false,
      claimedFreeTiers: [],
      claimedEliteTiers: [],
      unlockedCosmetics: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return fresh;
}

async function syncLoadBattlePassFromFirestoreInternal(
  user: User
): Promise<BattlePassState> {
  const local = loadLocalBattlePass(user.uid);
  const path = `users/${user.uid}/battlePass/${BATTLE_PASS_SEASON_ID}`;
  const ref = doc(db, 'users', user.uid, 'battlePass', BATTLE_PASS_SEASON_ID);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    const created = await ensureBattlePassDocExists(user, local.seasonXp);
    saveLocalBattlePass(created, user.uid);
    return created;
  }

  const remote = sanitizeBattlePassState(snap.data());
  const merged = mergeBattlePassStates(local, remote);
  saveLocalBattlePass(merged, user.uid);
  return merged;
}

export async function syncBattlePassXpToFirestore(
  user: User,
  nextState: BattlePassState
): Promise<void> {
  const path = `users/${user.uid}/battlePass/${BATTLE_PASS_SEASON_ID}`;
  const ref = doc(db, 'users', user.uid, 'battlePass', BATTLE_PASS_SEASON_ID);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const cleanNext = sanitizeBattlePassState(nextState);

  if (!snap.exists()) {
    await ensureBattlePassDocExists(user, cleanNext.seasonXp);
    return;
  }

  const existing = sanitizeBattlePassState(snap.data());
  const targetXp = Math.min(
    existing.seasonXp + 400,
    Math.max(existing.seasonXp, cleanNext.seasonXp)
  );
  if (targetXp <= existing.seasonXp) return;

  try {
    await updateDoc(ref, {
      seasonXp: targetXp,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncBattlePassClaimToFirestore(
  user: User,
  nextState: BattlePassState,
  gemsGained: number
): Promise<void> {
  const bpPath = `users/${user.uid}/battlePass/${BATTLE_PASS_SEASON_ID}`;
  const bpRef = doc(db, 'users', user.uid, 'battlePass', BATTLE_PASS_SEASON_ID);
  const walletPath = `users/${user.uid}/progression/wallet`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');

  const cleanNext = sanitizeBattlePassState(nextState);

  let bpSnap;
  try {
    bpSnap = await getDoc(bpRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, bpPath);
  }

  if (!bpSnap.exists()) {
    await ensureBattlePassDocExists(user, cleanNext.seasonXp);
    try {
      bpSnap = await getDoc(bpRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, bpPath);
    }
  }

  const existingBp = bpSnap.exists()
    ? sanitizeBattlePassState(bpSnap.data())
    : createDefaultBattlePassState();
  const safeXp = Math.min(
    existingBp.seasonXp + 400,
    Math.max(existingBp.seasonXp, cleanNext.seasonXp)
  );
  const maxTierForSafeXp = getBattlePassTierForXp(safeXp);
  const nextFree = Array.from(
    new Set([...existingBp.claimedFreeTiers, ...cleanNext.claimedFreeTiers])
  )
    .filter((t) => t <= maxTierForSafeXp)
    .sort((a, b) => a - b);
  const nextElite = existingBp.premiumUnlocked
    ? Array.from(
        new Set([...existingBp.claimedEliteTiers, ...cleanNext.claimedEliteTiers])
      )
        .filter((t) => t <= maxTierForSafeXp)
        .sort((a, b) => a - b)
    : existingBp.claimedEliteTiers;
  const nextCosmetics = Array.from(
    new Set([...existingBp.unlockedCosmetics, ...cleanNext.unlockedCosmetics])
  ).slice(0, 40);

  const batch = writeBatch(db);
  batch.update(bpRef, {
    seasonXp: safeXp,
    claimedFreeTiers: nextFree,
    claimedEliteTiers: nextElite,
    unlockedCosmetics: nextCosmetics,
    updatedAt: serverTimestamp(),
  });

  if (gemsGained > 0) {
    let walletSnap;
    try {
      walletSnap = await getDoc(walletRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, walletPath);
    }

    if (walletSnap.exists()) {
      const existingGems = Math.max(
        0,
        Math.floor(Number(walletSnap.data().gems ?? 0) || 0)
      );
      batch.update(walletRef, {
        gems: existingGems + Math.min(1200, Math.floor(gemsGained)),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(walletRef, {
        uid: user.uid,
        xp: 0,
        gems: Math.min(560, Math.floor(gemsGained)),
        loginStreak: 1,
        lastLoginDateKey: getLocalDateKey(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, bpPath);
  }
}

export async function syncUnlockEliteBattlePassToFirestore(
  user: User,
  seedXp = 0
): Promise<void> {
  const bpPath = `users/${user.uid}/battlePass/${BATTLE_PASS_SEASON_ID}`;
  const bpRef = doc(db, 'users', user.uid, 'battlePass', BATTLE_PASS_SEASON_ID);
  const walletPath = `users/${user.uid}/progression/wallet`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');

  const existingBp = await ensureBattlePassDocExists(user, seedXp);
  if (existingBp.premiumUnlocked) return;

  let walletSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }

  if (!walletSnap.exists()) return;
  const existingGems = Math.max(
    0,
    Math.floor(Number(walletSnap.data().gems ?? 0) || 0)
  );
  if (existingGems < BATTLE_PASS_ELITE_COST_GEMS) return;

  const batch = writeBatch(db);
  batch.update(walletRef, {
    gems: existingGems - BATTLE_PASS_ELITE_COST_GEMS,
    updatedAt: serverTimestamp(),
  });
  batch.update(bpRef, {
    premiumUnlocked: true,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, bpPath);
  }
}
