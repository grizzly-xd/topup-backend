import { z } from 'zod';

export const orderIdParam = z.object({
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/, 'Invalid id'),
});

export const paginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
  status: z
    .enum(['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'])
    .optional(),
});
