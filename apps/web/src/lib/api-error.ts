// 📍 /apps/web/src/lib/api-error.ts
//
// Single error type thrown by every API helper.
// Carries the HTTP status and (optional) field-level errors,
// so forms can map them to inputs directly.

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}