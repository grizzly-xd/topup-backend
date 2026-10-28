export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}
export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}
