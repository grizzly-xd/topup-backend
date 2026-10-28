import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { midtransWebhook } from '../controllers/webhooks.controller.js';
import { webhookLimiter } from '../middleware/rateLimit.js';

export const webhooksRouter = Router();

webhooksRouter.post('/midtrans', webhookLimiter, asyncHandler(midtransWebhook));
