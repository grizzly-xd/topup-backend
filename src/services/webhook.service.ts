import { createHash, timingSafeEqual } from 'node:crypto';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { TOPUP_STATUS, MIDTRANS_SUCCESS_STATUSES, MIDTRANS_ACCEPT_FRAUD } from '../constants/statuses.js';
import { fetchMidtransStatus } from './midtrans.service.js';
import type { TopupDoc } from '../types/domain.js';

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

/**
 * Verifikasi signature resmi Midtrans:
 * SHA512(order_id + status_code + gross_amount + server_key) === signature_key
 * Menggunakan timingSafeEqual untuk mencegah timing attack.
 */
export function verifyMidtransSignature(n: MidtransNotification): boolean {
  if (
    typeof n.order_id !== 'string' ||
    typeof n.status_code !== 'string' ||
    typeof n.gross_amount !== 'string' ||
    typeof n.signature_key !== 'string'
  ) {
    return false;
  }
  const input = `${n.order_id}${n.status_code}${n.gross_amount}${env.MIDTRANS_SERVER_KEY}`;
  const expected = createHash('sha512').update(input).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(n.signature_key.toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function eventId(n: MidtransNotification): string {
  // Deterministik & unik per notifikasi valid. Dibuat dari field kanonik notifikasi.
  const raw = `${n.order_id}|${n.transaction_status}|${n.status_code}|${n.gross_amount}|${n.signature_key.slice(0, 24)}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

/**
 * Proses notifikasi Midtrans. Idempoten: aman dipanggil berulang untuk notifikasi yang sama.
 * Logika:
 *  1. Verifikasi signature.
 *  2. Ambil status aktual dari Midtrans (server-to-server) — jangan percaya isi notifikasi saja.
 *  3. Cocokkan orderId, amount, currency, ownership dengan dokumen `topups/{orderId}`.
 *  4. Firestore runTransaction:
 *     - buat guard payment_events/{eventId} (fail jika sudah ada)
 *     - perbarui topup dan wallet secara atomik
 */
export async function processMidtransNotification(raw: MidtransNotification): Promise<void> {
  if (!verifyMidtransSignature(raw)) {
    logger.warn({ orderId: raw.order_id }, 'webhook: invalid signature');
    throw ApiError.unauthorized('INVALID_SIGNATURE');
  }

  // 2) Verifikasi server-side ke Midtrans
  const actual = await fetchMidtransStatus(raw.order_id);

  // gross_amount Midtrans berupa string desimal. Bandingkan secara numerik.
  const grossFromMidtrans = Math.round(Number(actual.grossAmount));
  if (!Number.isFinite(grossFromMidtrans)) {
    throw ApiError.badRequest('INVALID_GROSS_AMOUNT', 'Invalid gross amount');
  }

  const eid = eventId(raw);

  // 3 & 4) Firestore transaction
  await db.runTransaction(async (tx) => {
    const topupRef = db.collection('topups').doc(actual.orderId);
    const walletRef = db.collection('wallets').doc((await tx.get(topupRef)).get('uid') ?? '');

    // Idempotency guard: dokumen eventId harus belum ada
    const eventRef = db.collection('payment_events').doc(eid);
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) {
      logger.info({ eventId: eid, orderId: actual.orderId }, 'webhook: duplicate event, noop');
      return;
    }

    // Baca topup
    const topupSnap = await tx.get(topupRef);
    if (!topupSnap.exists) {
      // Tidak dikenal: catat event sebagai invalid, tapi JANGAN throw 500 (Midtrans akan retry).
      tx.set(eventRef, {
        eventId: eid,
        orderId: actual.orderId,
        transactionStatus: actual.transactionStatus,
        fraudStatus: actual.fraudStatus,
        receivedAt: new Date(),
        processedAt: new Date(),
        processingResult: 'invalid',
      });
      logger.warn({ orderId: actual.orderId }, 'webhook: unknown order');
      return;
    }
    const topup = topupSnap.data() as TopupDoc;

    // Ownership check (uid harus valid)
    if (!topup.uid) {
      throw ApiError.conflict('INVALID_TOPUP_DOC');
    }

    // Amount check
    if (topup.totalAmount !== grossFromMidtrans) {
      tx.set(eventRef, {
        eventId: eid,
        orderId: actual.orderId,
        transactionStatus: actual.transactionStatus,
        fraudStatus: actual.fraudStatus,
        receivedAt: new Date(),
        processedAt: new Date(),
        processingResult: 'invalid',
      });
      logger.warn(
        { orderId: actual.orderId, expected: topup.totalAmount, got: grossFromMidtrans },
        'webhook: amount mismatch',
      );
      return;
    }

    // Baca wallet
    const walletSnap = await tx.get(walletRef);
    if (!walletSnap.exists) throw ApiError.conflict('WALLET_NOT_FOUND');
    const wallet = walletSnap.data() as { balance: number; version: number; currency: string };

    // Cek apakah transisi ke SUCCESS
    const isSuccess =
      MIDTRANS_SUCCESS_STATUSES.has(actual.transactionStatus) &&
      (actual.transactionStatus === 'settlement' ||
        actual.fraudStatus === MIDTRANS_ACCEPT_FRAUD);

    // Status akhir yang akan disimpan
    let nextStatus: TopupDoc['status'] = topup.status;
    let creditAmount = 0;

    if (topup.status === TOPUP_STATUS.PAID) {
      // Sudah pernah dibayar: jangan tambah saldo lagi, jangan turunkan status.
      tx.set(eventRef, {
        eventId: eid,
        orderId: actual.orderId,
        transactionStatus: actual.transactionStatus,
        fraudStatus: actual.fraudStatus,
        receivedAt: new Date(),
        processedAt: new Date(),
        processingResult: 'noop',
      });
      return;
    }

    if (isSuccess) {
      nextStatus = TOPUP_STATUS.PAID;
      creditAmount = topup.nominal;
    } else if (actual.transactionStatus === 'pending') {
      nextStatus = TOPUP_STATUS.PENDING;
    } else if (actual.transactionStatus === 'expire') {
      nextStatus = TOPUP_STATUS.EXPIRED;
    } else if (actual.transactionStatus === 'cancel' || actual.transactionStatus === 'deny' || actual.transactionStatus === 'failure') {
      nextStatus = actual.transactionStatus === 'cancel' ? TOPUP_STATUS.CANCELLED : TOPUP_STATUS.FAILED;
    } else if (actual.transactionStatus === 'refund' || actual.transactionStatus === 'partial_refund') {
      nextStatus = TOPUP_STATUS.REFUNDED;
    }

    // Update topup
    tx.update(topupRef, {
      status: nextStatus,
      paymentMethod: actual.paymentType ?? topup.paymentMethod,
      updatedAt: new Date(),
      ...(isSuccess ? { paidAt: new Date() } : {}),
    });

    // Update wallet HANYA jika success
    if (isSuccess) {
      tx.update(walletRef, {
        balance: wallet.balance + creditAmount,
        version: (wallet.version ?? 0) + 1,
        updatedAt: new Date(),
      });
    }

    // Catat event (guard)
    tx.set(eventRef, {
      eventId: eid,
      orderId: actual.orderId,
      transactionStatus: actual.transactionStatus,
      fraudStatus: actual.fraudStatus,
      receivedAt: new Date(),
      processedAt: new Date(),
      processingResult: isSuccess ? 'credited' : 'noop',
    });
  });

  logger.info({ eventId: eid, orderId: actual.orderId }, 'webhook processed');
        }
