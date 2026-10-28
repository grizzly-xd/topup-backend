import type { TopupStatus } from '../constants/statuses.js';

export interface UserDoc {
  uid: string;
  displayName: string | null;
  email: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  accountStatus: 'active' | 'suspended' | 'disabled';
}

export interface WalletDoc {
  uid: string;
  balance: number; // integer rupiah
  currency: string;
  updatedAt: FirebaseFirestore.Timestamp;
  version: number;
}

export interface TopupDoc {
  id: string;          // docId = orderId
  uid: string;
  orderId: string;
  nominal: number;
  adminFee: number;
  totalAmount: number;
  currency: string;
  status: TopupStatus;
  paymentMethod: string | null;
  snapToken: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  paidAt: FirebaseFirestore.Timestamp | null;
  expiredAt: FirebaseFirestore.Timestamp | null;
}

export interface PaymentEventDoc {
  eventId: string;
  orderId: string;
  transactionStatus: string;
  fraudStatus: string | null;
  receivedAt: FirebaseFirestore.Timestamp;
  processedAt: FirebaseFirestore.Timestamp | null;
  processingResult: 'credited' | 'noop' | 'failed' | 'invalid';
}

export interface AuditLogDoc {
  actorUid: string | null;
  action: string;
  resourceId: string;
  timestamp: FirebaseFirestore.Timestamp;
  result: 'success' | 'failure' | 'denied';
  }
