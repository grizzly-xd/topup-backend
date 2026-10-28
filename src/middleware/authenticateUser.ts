import type { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export interface AuthedRequest extends Request {
  user?: { uid: string; email?: string; displayName?: string };
}

export async function authenticateUser(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('MISSING_TOKEN');
    }
    const decoded = await auth.verifyIdToken(token, /* checkRevoked */ true);
    req.user = {
      uid: decoded.uid,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      displayName: typeof decoded.name === 'string' ? decoded.name : undefined,
    };
    next();
  } catch (err) {
    logger.warn({ err }, 'auth failed');
    next(ApiError.unauthorized('INVALID_TOKEN'));
  }
}
