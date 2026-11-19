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
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { isValidHeroId } from '../game/heroMastery';
import {
  HeroSkinsMap,
  isValidHeroSkinId,
  mergeHeroSkinsMaps,
  sanitizeHeroSkinsMap,
} from '../game/heroSkins';
import { HeroId, HeroSkinId } from '../game/types';

const STORAGE_PREFIX = 'thetan_hero_skins_v1:';

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadLocalHeroSkins(uid?: string | null): HeroSkinsMap {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeHeroSkinsMap(parsed);
  } catch {
    return {};
  }
}

export function saveLocalHeroSkins(
  map: HeroSkinsMap,
  uid?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify(sanitizeHeroSkinsMap(map))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export async function syncLoadHeroSkinsFromFirestore(
  user: User
): Promise<HeroSkinsMap> {
  const local = loadLocalHeroSkins(user.uid);
  const path = `users/${user.uid}/heroSkins`;
  const q = query(
    collection(db, 'users', user.uid, 'heroSkins'),
    where('uid', '==', user.uid),
    limit(30)
  );

  let snap;
  try {
    snap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  const remote: HeroSkinsMap = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data() as { heroId?: unknown; equippedSkin?: unknown };
    const heroId = data.heroId ?? docSnap.id;
    if (!isValidHeroId(heroId)) return;
    if (!isValidHeroSkinId(data.equippedSkin)) return;
    remote[heroId] = data.equippedSkin;
  });

  const merged = mergeHeroSkinsMaps(local, remote);
  saveLocalHeroSkins(merged, user.uid);
  return merged;
}

export async function syncEquipHeroSkinToFirestore(
  user: User,
  heroId: HeroId,
  skinId: HeroSkinId
): Promise<void> {
  const path = `users/${user.uid}/heroSkins/${heroId}`;
  const ref = doc(db, 'users', user.uid, 'heroSkins', heroId);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (snap.exists()) {
    try {
      await updateDoc(ref, {
        equippedSkin: skinId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return;
  }

  try {
    await setDoc(ref, {
      uid: user.uid,
      heroId,
      equippedSkin: skinId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
