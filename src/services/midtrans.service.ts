import { core, snap } from '../config/midtrans.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

export interface CreateSnapParams {
  orderId: string;
  grossAmount: number;
  currency: string;
  customer: { firstName?: string; email?: string };
  itemName: string;
  expiredAtIso?: string;
}

export interface SnapResult {
  token: string;
  redirectUrl: string;
}

export async function createSnapTransaction(p: CreateSnapParams): Promise<SnapResult> {
  const payload = {
    transaction_details: {
      order_id: p.orderId,
      gross_amount: p.grossAmount,
    },
    item_details: [
      {
        id: 'topup',
        price: p.grossAmount,
        quantity: 1,
        name: p.itemName.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: p.customer.firstName ?? 'Customer',
      email: p.customer.email,
    },
    // Tidak memaksa metode pembayaran: mengikuti konfigurasi merchant di dashboard Midtrans.
    callbacks: {
      finish: `${env.FRONTEND_URL}/topup/finish`,
    },
    ...(p.expiredAtIso ? { expiry: { start_time: undefined, unit: 'minutes', duration: 60 } } : {}),
  };

  try {
    const res = await snap.createTransaction(payload);
    return { token: res.token, redirectUrl: res.redirect_url };
  } catch (err) {
    logger.error({ err, orderId: p.orderId }, 'snap.createTransaction failed');
    throw new ApiError(502, 'MIDTRANS_CREATE_FAILED', 'Gagal membuat transaksi pembayaran');
  }
}

export interface MidtransStatusResult {
  orderId: string;
  transactionStatus: string;
  fraudStatus: string | null;
  grossAmount: string; // string dari Midtrans, mis. "50000.00"
  statusCode: string;
  paymentType: string | null;
}

export async function fetchMidtransStatus(orderId: string): Promise<MidtransStatusResult> {
  try {
    const res = await core.transaction.status(orderId);
    return {
      orderId: String(res.order_id),
      transactionStatus: String(res.transaction_status),
      fraudStatus: res.fraud_status ? String(res.fraud_status) : null,
      grossAmount: String(res.gross_amount),
      statusCode: String(res.status_code),
      paymentType: res.payment_type ? String(res.payment_type) : null,
    };
  } catch (err) {
    logger.error({ err, orderId }, 'midtrans.core.transaction.status failed');
    throw new ApiError(502, 'MIDTRANS_STATUS_FAILED', 'Gagal memeriksa status pembayaran');
  }
}
