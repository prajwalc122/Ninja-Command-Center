import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID as required
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Configure Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is currently offline or unreachable.');
    }
  }
}
testConnection();

// Structured Firestore error handler conforming to skill requirements
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Sign in using official Google account via popup
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user is admin based on email
    const isAdmin =
      user.email === 'prajwal9625@gmail.com' ||
      user.email === 'admin@ninja.local';

    const userProfile = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      role: isAdmin ? ('admin' as const) : ('user' as const),
      updatedAt: new Date().toISOString(),
    };

    // Upsert user profile to Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          ...userProfile,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, userProfile, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Could not sync user profile to Firestore:', fsErr);
    }

    return user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase
 */
export async function firebaseSignOut() {
  await signOut(auth);
}

/**
 * Persist command history to Firestore under users/{userId}/history/{historyId}
 */
export async function recordHistoryToFirestore(userId: string, record: any) {
  if (!userId) return;
  try {
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const historyRef = doc(db, 'users', userId, 'history', historyId);
    await setDoc(historyRef, {
      id: historyId,
      userId,
      command: record.command || 'Unnamed Command',
      toolId: record.toolId || 'gemini-assistant',
      toolName: record.toolName || record.toolId || 'Gemini Assistant',
      status: record.status || 'success',
      resultPreview: record.resultPreview ? String(record.resultPreview).slice(0, 1000) : '',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not persist history item to Firestore:', err);
  }
}
