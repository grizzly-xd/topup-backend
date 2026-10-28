import { randomBytes } from 'node:crypto';

/**
 * Format: TP-<epochMs>-<8 hex chars>
 * - Unik secara statistik
 * - Tidak memuat data pengguna
 * - Hanya karakter [A-Za-z0-9-] (aman untuk Midtrans order_id)
 */
export function generateOrderId(now: Date = new Date()): string {
  const ts = now.getTime();
  const rand = randomBytes(4).toString('hex');
  return `TP-${ts}-${rand}`;
}
