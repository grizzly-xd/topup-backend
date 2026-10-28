export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  static unauthorized(code = 'UNAUTHORIZED') {
    return new ApiError(401, code, 'Unauthorized');
  }
  static forbidden(code = 'FORBIDDEN') {
    return new ApiError(403, code, 'Forbidden');
  }
  static notFound(code = 'NOT_FOUND') {
    return new ApiError(404, code, 'Not found');
  }
  static badRequest(code = 'BAD_REQUEST', message = 'Bad request') {
    return new ApiError(400, code, message);
  }
  static conflict(code = 'CONFLICT', message = 'Conflict') {
    return new ApiError(409, code, message);
  }
}
