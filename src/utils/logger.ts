import pino from 'pino';
import { env } from '../config/env.js';

// Redaction untuk mencegah secret / PII bocor ke log
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.signature_key',
      '*.serverKey',
      '*.server_key',
      '*.clientKey',
      '*.client_key',
      '*.privateKey',
      '*.private_key',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
});
