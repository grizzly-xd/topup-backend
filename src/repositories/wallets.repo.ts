import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import type { WalletDoc } from '../types/domain.js';

const col = db.collection('wallets');

export async function getWallet(uid: string): Promise<WalletDoc | null> {
  const snap = await col.doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as WalletDoc;
}

/** Idempotent: hanya buat wallet baru jika belum ada. */
export async function ensureWallet(uid: string, currency = env.DEFAULT_CURRENCY): Promise<WalletDoc> {
  const ref = col.doc(uid);
  const now = new Date();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return snap.data() as WalletDoc;
    }
    const doc: WalletDoc = {
      uid,
      balance: 0,
      currency,
      version: 0,
      updatedAt: now as unknown as FirebaseFirestore.Timestamp,
    };
    tx.set(ref, doc);
    return doc;
  });
}
