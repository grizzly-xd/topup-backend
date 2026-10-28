import { z } from 'zod';
import { env } from '../config/env.js';

export const createTopupBody = z.object({
  amount: z.coerce
    .number()
    .int('Amount must be integer')
    .positive('Amount must be positive')
    .min(env.MIN_TOPUP_AMOUNT, `Minimum is ${env.MIN_TOPUP_AMOUNT}`)
    .max(env.MAX_TOPUP_AMOUNT, `Maximum is ${env.MAX_TOPUP_AMOUNT}`),
});
export type CreateTopupInput = z.infer<typeof createTopupBody>;
