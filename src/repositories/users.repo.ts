import { db } from '../config/firebase.js';
import type { UserDoc } from '../types/domain.js';

const col = db.collection('users');

export async function getUserByUid(uid: string): Promise<UserDoc | null> {
  const snap = await col.doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as UserDoc;
}

/** Idempotent: hanya buat jika belum ada. */
export async function ensureUserDoc(params: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}): Promise<UserDoc> {
  const ref = col.doc(params.uid);
  const now = new Date();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return snap.data() as UserDoc;
    }
    const doc: UserDoc = {
      uid: params.uid,
      displayName: params.displayName ?? null,
      email: params.email ?? null,
      createdAt: now as unknown as FirebaseFirestore.Timestamp,
      updatedAt: now as unknown as FirebaseFirestore.Timestamp,
      accountStatus: 'active',
    };
    tx.set(ref, doc);
    return doc;
  });
}
