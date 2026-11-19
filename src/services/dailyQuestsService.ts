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
  DailyQuestItem,
  PlayerProgressionState,
  SEASON_WELCOME_GIFT_GEMS,
  SEASON_WELCOME_GIFT_ID,
  applyDailyLoginStreak,
  ensureDailyProgressionState,
  getLocalDateKey,
  sanitizeQuestItem,
} from '../game/dailyQuests';

export interface LoginStreakBonusInfo {
  streak: number;
  gemsGained: number;
  wasReset: boolean;
}

export interface ProgressionSyncResult {
  state: PlayerProgressionState;
  loginBonus: LoginStreakBonusInfo | null;
  welcomeGiftGems: number | null;
  welcomeGiftClaimed: boolean;
}

const STORAGE_PREFIX = 'thetan_progression_v1:';

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalProgression(
  uid?: string | null,
  dateKey: string = getLocalDateKey()
): PlayerProgressionState {
  const salt = uid || 'guest';
  if (typeof window === 'undefined' || !window.localStorage) {
    return ensureDailyProgressionState(null, dateKey, salt);
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) {
      const fresh = ensureDailyProgressionState(null, dateKey, salt);
      saveLocalProgression(fresh, uid);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<PlayerProgressionState>;
    const normalized = ensureDailyProgressionState(parsed, dateKey, salt);
    if (normalized.dateKey !== parsed.dateKey) {
      saveLocalProgression(normalized, uid);
    }
    return normalized;
  } catch {
    const fresh = ensureDailyProgressionState(null, dateKey, salt);
    saveLocalProgression(fresh, uid);
    return fresh;
  }
}

export function loadLocalProgressionWithLoginStreak(
  uid?: string | null,
  dateKey: string = getLocalDateKey()
): { state: PlayerProgressionState; loginBonus: LoginStreakBonusInfo | null } {
  const loaded = loadLocalProgression(uid, dateKey);
  const streakRes = applyDailyLoginStreak(loaded, dateKey);
  if (streakRes.awarded) {
    saveLocalProgression(streakRes.state, uid);
  }
  return {
    state: streakRes.state,
    loginBonus: streakRes.awarded
      ? {
          streak: streakRes.streak,
          gemsGained: streakRes.gemsGained,
          wasReset: streakRes.wasReset,
        }
      : null,
  };
}

export function saveLocalProgression(
  state: PlayerProgressionState,
  uid?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(getStorageKey(uid), JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function toStrictQuestPayload(quests: DailyQuestItem[]): DailyQuestItem[] {
  return quests.slice(0, 3).map((q) => {
    const clean = sanitizeQuestItem(q);
    if (!clean) {
      throw new Error(`Invalid quest payload for ${q?.id ?? 'unknown'}`);
    }
    return {
      id: clean.id,
      metric: clean.metric,
      title: clean.title,
      description: clean.description,
      target: clean.target,
      progress: clean.progress,
      rewardXp: clean.rewardXp,
      rewardGems: clean.rewardGems,
      completed: clean.completed,
      claimed: clean.claimed,
    };
  });
}

const inFlightProgressionSync = new Map<
  string,
  Promise<ProgressionSyncResult>
>();

export async function syncLoadProgressionFromFirestore(
  user: User,
  dateKey: string = getLocalDateKey()
): Promise<ProgressionSyncResult> {
  const key = `${user.uid}:${dateKey}`;
  const existing = inFlightProgressionSync.get(key);
  if (existing) {
    return existing;
  }

  const run = syncLoadProgressionFromFirestoreInternal(user, dateKey).finally(() => {
    inFlightProgressionSync.delete(key);
  });
  inFlightProgressionSync.set(key, run);
  return run;
}

export async function claimSeasonWelcomeGiftFromFirestore(
  user: User
): Promise<{
  claimedNow: boolean;
  alreadyClaimed: boolean;
  gemsGranted: number;
  nextGems: number | null;
}> {
  const redemptionPath = `users/${user.uid}/redemptions/${SEASON_WELCOME_GIFT_ID}`;
  const walletPath = `users/${user.uid}/progression/wallet`;
  const redemptionRef = doc(
    db,
    'users',
    user.uid,
    'redemptions',
    SEASON_WELCOME_GIFT_ID
  );
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');

  let redemptionSnap;
  try {
    redemptionSnap = await getDoc(redemptionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, redemptionPath);
  }

  if (redemptionSnap.exists()) {
    return {
      claimedNow: false,
      alreadyClaimed: true,
      gemsGranted: 0,
      nextGems: null,
    };
  }

  let walletSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }

  if (!walletSnap.exists()) {
    return {
      claimedNow: false,
      alreadyClaimed: false,
      gemsGranted: 0,
      nextGems: null,
    };
  }

  const currentServerGems = Math.max(
    0,
    Math.floor(Number(walletSnap.data().gems ?? 0) || 0)
  );
  const nextGems = currentServerGems + SEASON_WELCOME_GIFT_GEMS;
  if (nextGems > 10000000) {
    return {
      claimedNow: false,
      alreadyClaimed: false,
      gemsGranted: 0,
      nextGems: currentServerGems,
    };
  }

  const batch = writeBatch(db);
  batch.set(redemptionRef, {
    uid: user.uid,
    giftId: SEASON_WELCOME_GIFT_ID,
    gemsGranted: SEASON_WELCOME_GIFT_GEMS,
    createdAt: serverTimestamp(),
  });
  batch.update(walletRef, {
    gems: nextGems,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, redemptionPath);
  }

  return {
    claimedNow: true,
    alreadyClaimed: true,
    gemsGranted: SEASON_WELCOME_GIFT_GEMS,
    nextGems,
  };
}

async function syncLoadProgressionFromFirestoreInternal(
  user: User,
  dateKey: string = getLocalDateKey()
): Promise<ProgressionSyncResult> {
  const local = loadLocalProgression(user.uid, dateKey);
  const walletPath = `users/${user.uid}/progression/wallet`;
  const questsPath = `users/${user.uid}/dailyQuests/${dateKey}`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');
  const questsRef = doc(db, 'users', user.uid, 'dailyQuests', dateKey);

  let walletSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }

  let questsSnap;
  try {
    questsSnap = await getDoc(questsRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, questsPath);
  }

  let xp = local.xp;
  let gems = local.gems;
  let loginStreak = local.loginStreak;
  let lastLoginDateKey = local.lastLoginDateKey;
  let quests = local.quests;
  let hadMissingStreakField = false;

  if (walletSnap.exists()) {
    const data = walletSnap.data() as {
      xp?: number;
      gems?: number;
      loginStreak?: number;
      lastLoginDateKey?: string | null;
    };
    xp = Math.max(0, Math.floor(Number(data.xp ?? 0)));
    gems = Math.max(0, Math.floor(Number(data.gems ?? 0)));
    loginStreak = Math.max(0, Math.floor(Number(data.loginStreak ?? 0)));
    lastLoginDateKey =
      typeof data.lastLoginDateKey === 'string' ? data.lastLoginDateKey : null;
    hadMissingStreakField =
      typeof data.loginStreak !== 'number' || typeof data.lastLoginDateKey !== 'string';
  }

  if (questsSnap.exists()) {
    const data = questsSnap.data() as { quests?: DailyQuestItem[] };
    const normalized = ensureDailyProgressionState(
      { xp, gems, dateKey, loginStreak, lastLoginDateKey, quests: data.quests },
      dateKey,
      user.uid
    );
    quests = normalized.quests;
  } else {
    try {
      await setDoc(questsRef, {
        uid: user.uid,
        dateKey,
        quests: toStrictQuestPayload(quests),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, questsPath);
    }
  }

  const baseState = ensureDailyProgressionState(
    { xp, gems, dateKey, loginStreak, lastLoginDateKey, quests },
    dateKey,
    user.uid
  );
  const streakRes = applyDailyLoginStreak(baseState, dateKey);
  let finalState = streakRes.state;

  if (!walletSnap.exists()) {
    try {
      await setDoc(walletRef, {
        uid: user.uid,
        xp: Math.min(1000, Math.max(0, Math.floor(finalState.xp))),
        gems: Math.min(560, Math.max(0, Math.floor(finalState.gems))),
        loginStreak: Math.min(1, Math.max(1, finalState.loginStreak)),
        lastLoginDateKey: finalState.lastLoginDateKey ?? dateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, walletPath);
    }
  } else if (streakRes.awarded || hadMissingStreakField) {
    try {
      await updateDoc(walletRef, {
        xp: Math.max(0, Math.floor(finalState.xp)),
        gems: Math.max(0, Math.floor(finalState.gems)),
        loginStreak: Math.max(1, Math.floor(finalState.loginStreak)),
        lastLoginDateKey: finalState.lastLoginDateKey ?? dateKey,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, walletPath);
    }
  }

  let welcomeGiftGems: number | null = null;
  let welcomeGiftClaimed = false;
  try {
    const giftRes = await claimSeasonWelcomeGiftFromFirestore(user);
    welcomeGiftClaimed = giftRes.alreadyClaimed;
    if (giftRes.claimedNow && giftRes.nextGems !== null) {
      finalState = {
        ...finalState,
        gems: giftRes.nextGems,
      };
      welcomeGiftGems = giftRes.gemsGranted;
    }
  } catch (err) {
    console.warn('Falha ao resgatar bônus inicial de gemas:', err);
  }

  saveLocalProgression(finalState, user.uid);
  return {
    state: finalState,
    loginBonus: streakRes.awarded
      ? {
          streak: streakRes.streak,
          gemsGained: streakRes.gemsGained,
          wasReset: streakRes.wasReset,
        }
      : null,
    welcomeGiftGems,
    welcomeGiftClaimed,
  };
}

export async function syncDailyQuestsToFirestore(
  user: User,
  state: PlayerProgressionState
): Promise<void> {
  const questsPath = `users/${user.uid}/dailyQuests/${state.dateKey}`;
  const questsRef = doc(db, 'users', user.uid, 'dailyQuests', state.dateKey);

  let snap;
  try {
    snap = await getDoc(questsRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, questsPath);
  }

  try {
    if (snap.exists()) {
      const batch = writeBatch(db);
      batch.update(questsRef, {
        quests: toStrictQuestPayload(state.quests),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(questsRef, {
        uid: user.uid,
        dateKey: state.dateKey,
        quests: toStrictQuestPayload(state.quests),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, questsPath);
  }
}

export async function syncMatchCompletionToFirestore(
  user: User,
  state: PlayerProgressionState,
  gemsDelta: number,
  xpDelta: number
): Promise<void> {
  const walletPath = `users/${user.uid}/progression/wallet`;
  const questsPath = `users/${user.uid}/dailyQuests/${state.dateKey}`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');
  const questsRef = doc(db, 'users', user.uid, 'dailyQuests', state.dateKey);

  const safeGemsDelta = Math.max(0, Math.min(560, Math.floor(gemsDelta || 0)));
  const safeXpDelta = Math.max(0, Math.min(1000, Math.floor(xpDelta || 0)));

  let walletSnap;
  let questsSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }
  try {
    questsSnap = await getDoc(questsRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, questsPath);
  }

  const batch = writeBatch(db);
  if (walletSnap.exists()) {
    const existingData = walletSnap.data() as { xp?: number; gems?: number };
    const baseXp = Math.max(0, Math.floor(Number(existingData.xp ?? 0)));
    const baseGems = Math.max(0, Math.floor(Number(existingData.gems ?? 0)));
    batch.update(walletRef, {
      xp: Math.min(10000000, baseXp + safeXpDelta),
      gems: Math.min(10000000, baseGems + safeGemsDelta),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(walletRef, {
      uid: user.uid,
      xp: Math.min(1000, safeXpDelta),
      gems: Math.min(560, safeGemsDelta),
      loginStreak: 1,
      lastLoginDateKey: state.dateKey,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (questsSnap.exists()) {
    batch.update(questsRef, {
      quests: toStrictQuestPayload(state.quests),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(questsRef, {
      uid: user.uid,
      dateKey: state.dateKey,
      quests: toStrictQuestPayload(state.quests),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, walletPath);
  }
}

export async function syncClaimToFirestore(
  user: User,
  state: PlayerProgressionState
): Promise<void> {
  const walletPath = `users/${user.uid}/progression/wallet`;
  const questsPath = `users/${user.uid}/dailyQuests/${state.dateKey}`;
  const walletRef = doc(db, 'users', user.uid, 'progression', 'wallet');
  const questsRef = doc(db, 'users', user.uid, 'dailyQuests', state.dateKey);

  let walletSnap;
  let questsSnap;
  try {
    walletSnap = await getDoc(walletRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
  }
  try {
    questsSnap = await getDoc(questsRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, questsPath);
  }

  const safeStreak = Math.max(1, Math.floor(state.loginStreak || 1));
  const safeLastLogin = state.lastLoginDateKey ?? state.dateKey;

  const batch = writeBatch(db);
  if (walletSnap.exists()) {
    batch.update(walletRef, {
      xp: Math.max(0, Math.floor(state.xp)),
      gems: Math.max(0, Math.floor(state.gems)),
      loginStreak: safeStreak,
      lastLoginDateKey: safeLastLogin,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(walletRef, {
      uid: user.uid,
      xp: Math.min(1000, Math.max(0, Math.floor(state.xp))),
      gems: Math.min(560, Math.max(0, Math.floor(state.gems))),
      loginStreak: Math.min(1, safeStreak),
      lastLoginDateKey: safeLastLogin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (questsSnap.exists()) {
    batch.update(questsRef, {
      quests: toStrictQuestPayload(state.quests),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(questsRef, {
      uid: user.uid,
      dateKey: state.dateKey,
      quests: toStrictQuestPayload(state.quests),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, walletPath);
  }
}
