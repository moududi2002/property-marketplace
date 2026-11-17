// 📍 /apps/api/src/common/filters/all-exceptions.filter.ts
//
// Global exception filter.
// Every error returns a consistent JSON shape:
//   { success: false, message, errorCode?, errors?, timestamp, path }
// Prevents leaking stack traces in production.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ZodError } from "zod";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errorCode: string | undefined;
    let errors: Record<string, string[]> | undefined;

    // ─── Zod Validation Errors ──────────────────────────────
    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Validation failed";
      errorCode = "VALIDATION_ERROR";
      errors = exception.errors.reduce<Record<string, string[]>>((acc, err) => {
        const key = err.path.join(".") || "_root";
        (acc[key] ||= []).push(err.message);
        return acc;
      }, {});
    }
    // ─── HTTP Exceptions ────────────────────────────────────
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string) || message;
        errorCode = r.errorCode as string | undefined;
        errors = r.errors as Record<string, string[]> | undefined;
      }
    }
    // ─── Generic Errors ─────────────────────────────────────
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log server-side errors (5xx) with full context
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      message,
      errorCode,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}