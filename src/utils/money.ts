import { ApiError } from './ApiError.js';
import { env } from '../config/env.js';

export function assertValidAmount(amount: unknown): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isInteger(amount)) {
    throw ApiError.badRequest('INVALID_AMOUNT', 'Amount must be an integer');
  }
  if (amount <= 0) {
    throw ApiError.badRequest('INVALID_AMOUNT', 'Amount must be greater than zero');
  }
  if (amount < env.MIN_TOPUP_AMOUNT) {
    throw ApiError.badRequest('AMOUNT_BELOW_MINIMUM', `Minimum top up is ${env.MIN_TOPUP_AMOUNT}`);
  }
  if (amount > env.MAX_TOPUP_AMOUNT) {
    throw ApiError.badRequest('AMOUNT_ABOVE_MAXIMUM', `Maximum top up is ${env.MAX_TOPUP_AMOUNT}`);
  }
  return amount;
}

/**
 * Admin fee server-side. Saat ini 0. Ubah bila aturan bisnis berubah.
 * Nilai disimpan di Firestore sebagai integer rupiah.
 */
export function calculateAdminFee(_amount: number): number {
  return 0;
}

export function computeTotalAmount(amount: number, adminFee: number): number {
  return amount + adminFee;
}
