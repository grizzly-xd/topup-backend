export const TOPUP_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type TopupStatus = (typeof TOPUP_STATUS)[keyof typeof TOPUP_STATUS];

/** Status Midtrans yang menandakan pembayaran berhasil & dana diterima. */
export const MIDTRANS_SUCCESS_STATUSES = new Set(['settlement', 'capture']);

/** Fraud status yang boleh dianggap lunas (hanya relevan untuk capture kartu kredit). */
export const MIDTRANS_ACCEPT_FRAUD = 'accept';

export const MIDTRANS_FAILED_STATUSES = new Set(['deny', 'cancel', 'failure']);
export const MIDTRANS_EXPIRED_STATUSES = new Set(['expire']);
export const MIDTRANS_PENDING_STATUSES = new Set(['pending']);
