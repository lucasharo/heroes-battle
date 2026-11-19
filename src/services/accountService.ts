import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  FIREBASE_PROJECT_ID,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import { applyMatchStats, sanitizeDisplayName } from '../game/ranking';
import {
  RECENT_MATCHES_LIMIT,
  buildMatchResultPayload,
  normalizeMatchResult,
  sortAndLimitRecentMatches,
} from '../game/recentMatches';
import { GameMode, HeroId, RankingEntry, RecentMatchEntry, UserProfile } from '../game/types';

export function mapAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return `Login por E-mail/Senha ainda não ativado no projeto Firebase (${FIREBASE_PROJECT_ID}). Use "Entrar com Google" ou ative "E-mail/senha" em Authentication → Sign-in method no Console do Firebase.`;
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Faça login na aba Entrar.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/weak-password':
      return 'A senha precisa ter no mínimo 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado antes de concluir.';
    case 'auth/cancelled-popup-request':
      return 'Já existe uma janela de login do Google aberta. Conclua ou feche-a antes de tentar novamente.';
    case 'auth/popup-blocked':
      return 'Pop-up bloqueado pelo navegador. Permita pop-ups para entrar com o Google.';
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
      return `Domínio (${host}) não autorizado no Firebase Authentication. Adicione-o em Authentication → Settings → Authorized domains.`;
    }
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este e-mail usando outro método de login.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a rede ao falar com o Google. Verifique sua internet e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    default:
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        return 'Permissão insuficiente no banco de dados ao carregar o perfil. Tente novamente em instantes.';
      }
      return error instanceof Error
        ? `Não foi possível autenticar: ${error.message}`
        : 'Erro inesperado ao autenticar.';
  }
}

const inFlightEnsureUser = new Map<string, Promise<UserProfile>>();

export async function ensureUserDocuments(
  user: User,
  preferredName?: string,
  preferredHero: HeroId = 'steelshot'
): Promise<UserProfile> {
  const existingPromise = inFlightEnsureUser.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const run = ensureUserDocumentsInternal(user, preferredName, preferredHero).finally(() => {
    inFlightEnsureUser.delete(user.uid);
  });
  inFlightEnsureUser.set(user.uid, run);
  return run;
}

async function ensureUserDocumentsInternal(
  user: User,
  preferredName?: string,
  preferredHero: HeroId = 'steelshot'
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const rankRef = doc(db, 'rankings', user.uid);

  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }

  let rankSnap;
  try {
    rankSnap = await getDoc(rankRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `rankings/${user.uid}`);
  }

  if (userSnap.exists() && rankSnap.exists()) {
    const data = userSnap.data() as UserProfile;
    return data;
  }

  const cleanName = sanitizeDisplayName(
    preferredName || user.displayName || user.email?.split('@')[0] || 'Guerreiro'
  );
  const existingData = userSnap.exists() ? (userSnap.data() as Partial<UserProfile>) : null;
  const email = (user.email ?? existingData?.email ?? '').slice(0, 160);

  const baseProfile: UserProfile = {
    uid: user.uid,
    displayName: existingData?.displayName
      ? sanitizeDisplayName(existingData.displayName)
      : cleanName,
    email,
    favoriteHero: existingData?.favoriteHero ?? preferredHero,
    trophies: typeof existingData?.trophies === 'number' ? existingData.trophies : 0,
    wins: typeof existingData?.wins === 'number' ? existingData.wins : 0,
    matches: typeof existingData?.matches === 'number' ? existingData.matches : 0,
    kills: typeof existingData?.kills === 'number' ? existingData.kills : 0,
  };

  const batch = writeBatch(db);
  if (!userSnap.exists()) {
    batch.set(userRef, {
      ...baseProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  if (!rankSnap.exists()) {
    batch.set(rankRef, {
      uid: user.uid,
      displayName: baseProfile.displayName,
      heroId: baseProfile.favoriteHero,
      trophies: baseProfile.trophies,
      wins: baseProfile.wins,
      matches: baseProfile.matches,
      kills: baseProfile.kills,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  return baseProfile;
}

export async function loginWithGoogle(preferredHero: HeroId): Promise<UserProfile> {
  const cred = await signInWithPopup(auth, googleProvider);
  return ensureUserDocuments(cred.user, cred.user.displayName ?? undefined, preferredHero);
}

export async function loginWithEmail(
  email: string,
  password: string,
  preferredHero: HeroId
): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureUserDocuments(cred.user, cred.user.displayName ?? undefined, preferredHero);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  preferredHero: HeroId
): Promise<UserProfile> {
  const cleanName = sanitizeDisplayName(displayName);
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: cleanName });
  return ensureUserDocuments(cred.user, cleanName, preferredHero);
}

export async function logoutAccount(): Promise<void> {
  await signOut(auth);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function recordMatchResult(
  user: User,
  params: {
    victory: boolean;
    kills: number;
    mode: GameMode;
    placement?: number;
    heroId: HeroId;
  }
): Promise<{ profile: UserProfile; delta: number }> {
  const userRef = doc(db, 'users', user.uid);
  const rankRef = doc(db, 'rankings', user.uid);

  const current = await ensureUserDocuments(user, user.displayName ?? undefined, params.heroId);
  const nextStats = applyMatchStats(
    {
      trophies: current.trophies,
      wins: current.wins,
      matches: current.matches,
      kills: current.kills,
    },
    params
  );

  const cleanName = sanitizeDisplayName(
    current.displayName || user.displayName || user.email?.split('@')[0] || 'Guerreiro'
  );

  const matchRef = doc(collection(db, 'users', user.uid, 'matches'));
  const matchPayload = buildMatchResultPayload({
    uid: user.uid,
    victory: params.victory,
    heroId: nextStats.heroId,
    mode: params.mode,
    kills: params.kills,
    placement: params.placement,
    trophyDelta: nextStats.delta,
  });

  const batch = writeBatch(db);
  batch.update(userRef, {
    displayName: cleanName,
    favoriteHero: nextStats.heroId,
    trophies: nextStats.trophies,
    wins: nextStats.wins,
    matches: nextStats.matches,
    kills: nextStats.kills,
    updatedAt: serverTimestamp(),
  });
  batch.update(rankRef, {
    displayName: cleanName,
    heroId: nextStats.heroId,
    trophies: nextStats.trophies,
    wins: nextStats.wins,
    matches: nextStats.matches,
    kills: nextStats.kills,
    updatedAt: serverTimestamp(),
  });
  batch.set(matchRef, {
    ...matchPayload,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rankings/${user.uid}`);
  }

  return {
    delta: nextStats.delta,
    profile: {
      ...current,
      displayName: cleanName,
      favoriteHero: nextStats.heroId,
      trophies: nextStats.trophies,
      wins: nextStats.wins,
      matches: nextStats.matches,
      kills: nextStats.kills,
    },
  };
}

export function subscribeLeaderboard(
  onData: (entries: RankingEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'rankings'),
    where('trophies', '>=', 0),
    orderBy('trophies', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const rows: RankingEntry[] = snapshot.docs.map((d) => d.data() as RankingEntry);
      onData(rows);
    },
    (error) => {
      const wrapped = new Error(error.message);
      if (onError) onError(wrapped);
      try {
        handleFirestoreError(error, OperationType.LIST, 'rankings');
      } catch {
        // Error already surfaced to UI callback & structured console log
      }
    }
  );
}

export function subscribeRecentMatches(
  uid: string,
  onData: (matches: RecentMatchEntry[]) => void,
  onError?: (err: Error) => void,
  maxItems: number = RECENT_MATCHES_LIMIT
): () => void {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(maxItems)));
  const matchesPath = `users/${uid}/matches`;
  const q = query(
    collection(db, 'users', uid, 'matches'),
    where('playedAtMs', '>=', 0),
    orderBy('playedAtMs', 'desc'),
    limit(safeLimit)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const parsed = snapshot.docs.map((d) =>
        normalizeMatchResult(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortAndLimitRecentMatches(parsed, safeLimit));
    },
    (error) => {
      const wrapped = new Error(error.message);
      if (onError) onError(wrapped);
      try {
        handleFirestoreError(error, OperationType.LIST, matchesPath);
      } catch {
        // Error already surfaced to UI callback & structured console log
      }
    }
  );
}
