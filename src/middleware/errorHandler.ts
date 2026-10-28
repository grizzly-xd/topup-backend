import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import type { ApiErrorBody } from '../types/api.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const code = isApiError ? err.code : 'INTERNAL_ERROR';

  // Log tanpa menyertakan stack ke response; stack hanya untuk server log
  logger.error(
    { err, path: req.path, method: req.method, status },
    'request failed',
  );

  const body: ApiErrorBody = {
    success: false,
    message: isApiError ? err.message : 'Permintaan tidak dapat diproses',
    code,
    ...(isApiError && err.details && env.NODE_ENV !== 'production'
      ? { details: err.details }
      : {}),
  };
  res.status(status).json(body);
}
