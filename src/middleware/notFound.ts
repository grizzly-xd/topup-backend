import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('ROUTE_NOT_FOUND'));
}
