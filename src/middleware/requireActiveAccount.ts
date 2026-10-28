import type { Response, NextFunction } from 'express';
import type { AuthedRequest } from './authenticateUser.js';
import { db } from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireActiveAccount(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) throw ApiError.unauthorized();
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) throw ApiError.forbidden('USER_NOT_FOUND');
    const data = snap.data() as { accountStatus?: string } | undefined;
    if (data?.accountStatus !== 'active') throw ApiError.forbidden('ACCOUNT_NOT_ACTIVE');
    next();
  } catch (err) {
    next(err);
  }
}
