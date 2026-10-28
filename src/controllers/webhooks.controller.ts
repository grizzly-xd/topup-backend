import type { Request, Response } from 'express';
import { processMidtransNotification, type MidtransNotification } from '../services/webhook.service.js';

export async function midtransWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body as MidtransNotification;
  await processMidtransNotification(body);
  res.status(200).json({ success: true, message: 'OK' });
}
