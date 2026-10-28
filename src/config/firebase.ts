import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { env, firebasePrivateKey } from './env.js';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: firebasePrivateKey,
    }),
  });
}

export const db: Firestore = getFirestore();
export const auth: Auth = getAuth();

// Batasi log internal admin SDK agar tidak bocor
db.settings({ ignoreUndefinedProperties: true });
