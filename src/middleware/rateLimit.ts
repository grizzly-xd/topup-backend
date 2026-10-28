import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = env.NODE_ENV === 'test';

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: isTest ? 10_000 : 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
});

export const topupLimiter = rateLimit({
  windowMs: 60_000,
  limit: isTest ? 10_000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many top up attempts', code: 'RATE_LIMITED' },
});

// Webhook: rate limit lebih longgar, tapi tetap ada batas untuk mencegah abuse.
export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  limit: isTest ? 10_000 : 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many notifications', code: 'RATE_LIMITED' },
});
