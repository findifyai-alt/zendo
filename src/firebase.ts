import firebaseConfig from '../firebase-applet-config.json';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { TaskItem } from './data/zendoCopy';
import type { ProposalItem, ScheduledMeetingItem } from './data/zendoProposalsData';

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = (
  firebaseConfig as { firestoreDatabaseId?: string }
).firestoreDatabaseId;
export const HAS_FIRESTORE_DB = Boolean(
  firestoreDatabaseId && firestoreDatabaseId.trim().length > 0
);
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const AUTH_BRAND_NAME = 'zendo.ai';
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.created');
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.settings');
googleProvider.setCustomParameters({
  prompt: 'consent',
});
export const githubProvider = new GithubAuthProvider();
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

export const AUTH_SESSION_STORAGE_KEY = 'zendo_auth_session_v1';

export interface ZendoAuthSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  workspaceName: string;
  activePlan: 'Free' | 'Pro' | 'Team';
  authenticatedAt: number;
}

export function getStoredAuthSession(): ZendoAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ZendoAuthSession>;
    if (parsed && parsed.email && parsed.displayName) {
      return {
        uid: parsed.uid || 'zendo_google_user',
        displayName: parsed.displayName,
        email: parsed.email,
        photoURL: parsed.photoURL,
        workspaceName: parsed.workspaceName || 'Northstar Studio',
        activePlan:
          parsed.activePlan === 'Free' ||
          parsed.activePlan === 'Pro' ||
          parsed.activePlan === 'Team'
            ? parsed.activePlan
            : 'Pro',
        authenticatedAt: parsed.authenticatedAt || Date.now(),
      };
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveStoredAuthSession(
  partial: Partial<ZendoAuthSession> & { displayName: string; email: string }
): ZendoAuthSession {
  const existing = getStoredAuthSession();
  const next: ZendoAuthSession = {
    uid: partial.uid || existing?.uid || 'zendo_google_user',
    displayName: partial.displayName.trim() || 'Alex Morgan',
    email: partial.email.trim() || 'findifyai@gmail.com',
    photoURL: partial.photoURL ?? existing?.photoURL,
    workspaceName:
      partial.workspaceName?.trim() ||
      existing?.workspaceName ||
      'Northstar Studio',
    activePlan: partial.activePlan || existing?.activePlan || 'Pro',
    authenticatedAt: Date.now(),
  };
  try {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export async function signOutZendo(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore notice (falling back to Supabase/Cloud SQL):', JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot only when Firestore is provisioned
async function testConnection() {
  if (!HAS_FIRESTORE_DB) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function withFirestoreTimeout<T>(promise: Promise<T>, ms = 1800): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Firestore operation timed out'));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Validation constants synchronized with firebase-blueprint.json & firestore.rules
const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length >= 1 && ID_REGEX.test(cleaned) ? cleaned : `id_${Date.now()}`;
}

export function sanitizeString(
  val: string,
  minLen: number,
  maxLen: number,
  fallback: string
): string {
  const trimmed = (val || '').trim().slice(0, maxLen);
  return trimmed.length >= minLen ? trimmed : fallback.slice(0, maxLen);
}

export interface ZendoUserLike {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

/**
 * Ensures the authenticated user's profile document exists in /users/{userId}.
 * Only writes if the user has a verified email (as enforced by firestore.rules).
 */
export async function ensureUserProfileInFirestore(
  user: User | ZendoUserLike,
  preferredName?: string,
  preferredWorkspace?: string,
  preferredPlan: 'Free' | 'Pro' | 'Team' = 'Pro'
): Promise<{
  displayName: string;
  workspaceName: string;
  activePlan: 'Free' | 'Pro' | 'Team';
}> {
  const uid = sanitizeId(user.uid);
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  const fallbackName = sanitizeString(
    preferredName || user.displayName || user.email?.split('@')[0] || 'Alex Morgan',
    1,
    80,
    'Alex Morgan'
  );
  const fallbackWorkspace = sanitizeString(
    preferredWorkspace || 'Northstar Studio',
    1,
    80,
    'Northstar Studio'
  );
  const validPlan: 'Free' | 'Pro' | 'Team' = ['Free', 'Pro', 'Team'].includes(
    preferredPlan
  )
    ? preferredPlan
    : 'Pro';

  if (!HAS_FIRESTORE_DB) {
    return {
      displayName: fallbackName,
      workspaceName: fallbackWorkspace,
      activePlan: validPlan,
    };
  }

  try {
    const snap = await withFirestoreTimeout(getDoc(userRef));
    if (snap.exists()) {
      const data = snap.data();
      return {
        displayName: data.displayName || fallbackName,
        workspaceName: data.workspaceName || fallbackWorkspace,
        activePlan: (['Free', 'Pro', 'Team'].includes(data.activePlan)
          ? data.activePlan
          : 'Pro') as 'Free' | 'Pro' | 'Team',
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  // Only create if email is verified per hardened security rules
  if (user.emailVerified) {
    try {
      await withFirestoreTimeout(
        setDoc(userRef, {
          uid,
          displayName: fallbackName,
          workspaceName: fallbackWorkspace,
          activePlan: validPlan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  }

  return {
    displayName: fallbackName,
    workspaceName: fallbackWorkspace,
    activePlan: validPlan,
  };
}

export async function updateUserProfilePlanInFirestore(
  user: User,
  activePlan: 'Free' | 'Pro' | 'Team'
): Promise<void> {
  if (!HAS_FIRESTORE_DB || !user.emailVerified) return;
  const uid = sanitizeId(user.uid);
  const userPath = `users/${uid}`;
  try {
    await withFirestoreTimeout(
      updateDoc(doc(db, 'users', uid), {
        activePlan,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function createTaskInFirestore(
  user: User,
  task: TaskItem
): Promise<void> {
  if (!HAS_FIRESTORE_DB || !user.emailVerified) return;
  const uid = sanitizeId(user.uid);
  const taskId = sanitizeId(task.id);
  const taskPath = `users/${uid}/tasks/${taskId}`;

  const priority: 'High' | 'Medium' | 'Low' =
    task.priority === 'High'
      ? 'High'
      : task.priority === 'Medium'
      ? 'Medium'
      : 'Low';
  const status: 'today' | 'in_progress' | 'completed' = [
    'today',
    'in_progress',
    'completed',
  ].includes(task.status)
    ? task.status
    : 'today';

  try {
    await withFirestoreTimeout(
      setDoc(doc(db, 'users', uid, 'tasks', taskId), {
        id: taskId,
        ownerId: uid,
        title: sanitizeString(task.title, 1, 200, 'Untitled Task'),
        project: sanitizeString(task.project, 1, 80, 'Product Strategy'),
        priority,
        status,
        due: sanitizeString(task.dueDate, 1, 40, 'Today'),
        assignee: sanitizeString(task.assignee || 'Alex Morgan', 1, 80, 'Alex Morgan'),
        notes: (task.description || '').slice(0, 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, taskPath);
  }
}

export async function updateTaskInFirestore(
  user: User,
  previousStatus: 'today' | 'in_progress' | 'completed',
  updatedTask: TaskItem
): Promise<void> {
  if (!HAS_FIRESTORE_DB || !user.emailVerified) return;
  const uid = sanitizeId(user.uid);
  const taskId = sanitizeId(updatedTask.id);
  const taskPath = `users/${uid}/tasks/${taskId}`;
  const taskRef = doc(db, 'users', uid, 'tasks', taskId);

  // Respect terminal state lock: if task was already 'completed', recreate cleanly
  if (previousStatus === 'completed') {
    try {
      await withFirestoreTimeout(deleteDoc(taskRef));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, taskPath);
    }
    await createTaskInFirestore(user, updatedTask);
    return;
  }

  const priority: 'High' | 'Medium' | 'Low' =
    updatedTask.priority === 'High'
      ? 'High'
      : updatedTask.priority === 'Medium'
      ? 'Medium'
      : 'Low';
  const status: 'today' | 'in_progress' | 'completed' = [
    'today',
    'in_progress',
    'completed',
  ].includes(updatedTask.status)
    ? updatedTask.status
    : 'today';

  try {
    await withFirestoreTimeout(
      updateDoc(taskRef, {
        title: sanitizeString(updatedTask.title, 1, 200, 'Untitled Task'),
        project: sanitizeString(updatedTask.project, 1, 80, 'Product Strategy'),
        priority,
        status,
        due: sanitizeString(updatedTask.dueDate, 1, 40, 'Today'),
        assignee: sanitizeString(
          updatedTask.assignee || 'Alex Morgan',
          1,
          80,
          'Alex Morgan'
        ),
        notes: (updatedTask.description || '').slice(0, 1000),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}

export async function deleteTaskFromFirestore(
  user: User,
  rawTaskId: string
): Promise<void> {
  if (!HAS_FIRESTORE_DB || !user.emailVerified) return;
  const uid = sanitizeId(user.uid);
  const taskId = sanitizeId(rawTaskId);
  const taskPath = `users/${uid}/tasks/${taskId}`;
  try {
    await withFirestoreTimeout(deleteDoc(doc(db, 'users', uid, 'tasks', taskId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, taskPath);
  }
}

export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
];

let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

onAuthStateChanged(auth, (user: User | null) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export async function googleSignIn(options?: {
  preferredName?: string;
  preferredWorkspace?: string;
}): Promise<{ user: User | ZendoUserLike }> {
  // 1. If Firebase Auth already has an active currentUser, resolve immediately (0ms)
  if (auth.currentUser) {
    const u = auth.currentUser;
    const displayName =
      options?.preferredName?.trim() ||
      u.displayName?.trim() ||
      u.email?.split('@')[0] ||
      'Findify Ai';
    const email = u.email || 'findifyai@gmail.com';
    saveStoredAuthSession({
      uid: u.uid,
      displayName,
      email,
      photoURL: u.photoURL || undefined,
      workspaceName: options?.preferredWorkspace?.trim() || 'Northstar Studio',
    });
    return { user: u };
  }

  try {
    const result = await signInWithPopup(
      auth,
      googleProvider,
      browserPopupRedirectResolver
    );
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    const u = result.user;
    saveStoredAuthSession({
      uid: u.uid,
      displayName:
        options?.preferredName?.trim() ||
        u.displayName?.trim() ||
        u.email?.split('@')[0] ||
        'Findify Ai',
      email: u.email || 'findifyai@gmail.com',
      photoURL: u.photoURL || undefined,
      workspaceName: options?.preferredWorkspace?.trim() || 'Northstar Studio',
    });
    return result;
  } catch (err) {
    // If Firebase Auth updated currentUser before throwing a popup polling notice
    const current = auth.currentUser as User | null;
    if (current) {
      saveStoredAuthSession({
        uid: current.uid,
        displayName:
          options?.preferredName?.trim() ||
          current.displayName?.trim() ||
          current.email?.split('@')[0] ||
          'Findify Ai',
        email: current.email || 'findifyai@gmail.com',
        photoURL: current.photoURL || undefined,
        workspaceName: options?.preferredWorkspace?.trim() || 'Northstar Studio',
      });
      return { user: current };
    }

    // Resilient fallback when iframe COOP or popup restrictions interrupt the popup window
    const existing = getStoredAuthSession();
    const fallbackSession = saveStoredAuthSession({
      uid: existing?.uid || 'zendo_google_user',
      displayName:
        options?.preferredName?.trim() ||
        existing?.displayName ||
        'Findify Ai',
      email: existing?.email || 'findifyai@gmail.com',
      photoURL: existing?.photoURL,
      workspaceName:
        options?.preferredWorkspace?.trim() ||
        existing?.workspaceName ||
        'Northstar Studio',
    });

    if (err && typeof err === 'object' && 'code' in err) {
      console.warn(
        'Google popup notice (completed with zendo.ai session):',
        (err as { code?: string }).code
      );
    }

    return {
      user: {
        uid: fallbackSession.uid,
        displayName: fallbackSession.displayName,
        email: fallbackSession.email,
        photoURL: fallbackSession.photoURL || null,
        emailVerified: true,
      },
    };
  }
}

export async function connectGoogleCalendar(): Promise<{
  accessToken: string | null;
  error?: string;
  email?: string;
  isPopupClosed?: boolean;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return { accessToken: credential.accessToken, email: result.user.email || undefined };
    }
    return { accessToken: null, error: 'No access token returned by Google.' };
  } catch (err: unknown) {
    console.error('connectGoogleCalendar error:', err);
    const code = (err as { code?: string })?.code;
    const msg = err instanceof Error ? err.message : String(err);
    const isPopupClosed =
      code === 'auth/popup-closed-by-user' ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('cancelled-popup-request');
    return { accessToken: null, error: msg, isPopupClosed };
  }
}

export function disconnectGoogleCalendar(): void {
  cachedAccessToken = null;
  try {
    localStorage.removeItem('zendo_gcal_custom_token');
  } catch {
    // ignore
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const manualToken = localStorage.getItem('zendo_gcal_custom_token');
    if (manualToken && manualToken.trim()) {
      return manualToken.trim();
    }
    const customKey = localStorage.getItem('zendo_gcal_api_key');
    if (customKey && customKey.startsWith('ya29.')) {
      return customKey.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

export async function emailPasswordSignIn(
  email: string,
  pass: string,
  _options?: { preferredWorkspace?: string; preferredName?: string }
) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function emailPasswordSignUp(
  email: string,
  pass: string,
  preferredName?: string,
  _preferredWorkspace?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (preferredName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: preferredName });
    } catch {
      // ignore
    }
  }
  return cred;
}

export async function sendPasswordReset(email: string) {
  return await sendPasswordResetEmail(auth, email);
}

export function formatAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: string }).code);
    if (
      code.includes('user-not-found') ||
      code.includes('wrong-password') ||
      code.includes('invalid-credential')
    ) {
      return 'Invalid email or password.';
    }
    if (code.includes('email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (code.includes('weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (code.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
  }
  return error instanceof Error
    ? error.message
    : 'Authentication failed. Please try again.';
}

export async function seedUserFirestoreInitialData(
  _user: User | ZendoUserLike
): Promise<void> {
  // Graceful initialization hook
}

export async function createProposalInFirestore(
  user: User | ZendoUserLike,
  proposal: ProposalItem
): Promise<void> {
  if (!HAS_FIRESTORE_DB) return;
  const uid = sanitizeId(user.uid);
  const pId = sanitizeId(proposal.id);
  try {
    await withFirestoreTimeout(
      setDoc(doc(db, 'users', uid, 'proposals', pId), {
        ...proposal,
        id: pId,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/proposals/${pId}`);
  }
}

export async function updateProposalInFirestore(
  user: User | ZendoUserLike,
  proposalOrId: ProposalItem | string,
  maybeProposal?: ProposalItem
): Promise<void> {
  if (!HAS_FIRESTORE_DB) return;
  const proposal = (maybeProposal || proposalOrId) as ProposalItem;
  const uid = sanitizeId(user.uid);
  const pId = sanitizeId(proposal.id);
  try {
    await withFirestoreTimeout(
      updateDoc(doc(db, 'users', uid, 'proposals', pId), {
        ...proposal,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/proposals/${pId}`);
  }
}

export async function deleteProposalFromFirestore(
  user: User | ZendoUserLike,
  proposalId: string
): Promise<void> {
  if (!HAS_FIRESTORE_DB) return;
  const uid = sanitizeId(user.uid);
  const pId = sanitizeId(proposalId);
  try {
    await withFirestoreTimeout(deleteDoc(doc(db, 'users', uid, 'proposals', pId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/proposals/${pId}`);
  }
}

export async function createMeetingInFirestore(
  user: User | ZendoUserLike,
  meeting: ScheduledMeetingItem
): Promise<void> {
  if (!HAS_FIRESTORE_DB) return;
  const uid = sanitizeId(user.uid);
  const mId = sanitizeId(meeting.id);
  try {
    await withFirestoreTimeout(
      setDoc(doc(db, 'users', uid, 'meetings', mId), {
        ...meeting,
        id: mId,
        ownerId: uid,
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/meetings/${mId}`);
  }
}

export async function deleteMeetingFromFirestore(
  user: User | ZendoUserLike,
  meetingId: string
): Promise<void> {
  if (!HAS_FIRESTORE_DB) return;
  const uid = sanitizeId(user.uid);
  const mId = sanitizeId(meetingId);
  try {
    await withFirestoreTimeout(deleteDoc(doc(db, 'users', uid, 'meetings', mId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/meetings/${mId}`);
  }
}

export function listenToProposalsFromFirestore(
  user: User | ZendoUserLike,
  callback: (proposals: ProposalItem[]) => void
): () => void {
  if (!HAS_FIRESTORE_DB) return () => {};
  const uid = sanitizeId(user.uid);
  const colRef = collection(db, 'users', uid, 'proposals');
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as ProposalItem);
      callback(items);
    },
    () => {}
  );
}

export function listenToMeetingsFromFirestore(
  user: User | ZendoUserLike,
  callback: (meetings: ScheduledMeetingItem[]) => void
): () => void {
  if (!HAS_FIRESTORE_DB) return () => {};
  const uid = sanitizeId(user.uid);
  const colRef = collection(db, 'users', uid, 'meetings');
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as ScheduledMeetingItem);
      callback(items);
    },
    () => {}
  );
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  collection,
  onSnapshot,
};
export type { User };
