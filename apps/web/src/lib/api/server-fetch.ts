// 📍 /apps/web/src/lib/api/server-fetch.ts
//
// Server-side fetch wrapper for Next.js Server Components.
// - Builds absolute URL (fetch on server can't use relative paths)
// - Uses ISR (`revalidate`) so the page stays fast without hitting
//   the API on every request.
// - Never throws on error — returns null so callers can show a
//   graceful empty state instead of crashing the whole page.

const API_BASE = `${process.env.API_URL ?? "http://localhost:4000"}/api/v1`;

export async function serverFetch<T>(
  path: string,
  revalidateSeconds = 300,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}