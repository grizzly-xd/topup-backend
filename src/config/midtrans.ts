import midtransClient from 'midtrans-client';
import { env } from './env.js';

// Snap untuk pembuatan token dari backend
export const snap = new midtransClient.Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

// Core API untuk cek status transaksi (server-side verification)
export const core = new midtransClient.CoreApi({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});
