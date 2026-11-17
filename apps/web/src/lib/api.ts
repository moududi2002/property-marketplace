// 📍 /apps/web/src/lib/api.ts
//
// Thin typed fetch wrapper. Every request:
//   • sends cookies (credentials: "include")
//   • attaches JSON content-type when there's a body
//   • throws ApiError on non-2xx so callers only handle happy path
//
// NOTE: Runs on both server & client. On the server, cookies won't
// be forwarded automatically — callers that need auth on SSR must
// use `next/headers` to pass them along (not needed for Phase 2).

import { ApiError } from "./api-error";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ErrorBody {
  success?: boolean;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errBody = (data ?? {}) as ErrorBody;
    throw new ApiError(
      errBody.message ?? `Request failed (${response.status})`,
      response.status,
      errBody.errorCode,
      errBody.errors,
    );
  }

  return data as T;
}