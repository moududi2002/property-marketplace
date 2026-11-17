// 📍 /apps/api/src/modules/properties/utils/slug.util.ts
//
// Property slug helpers.
//   • Drafts get a random `draft-xxxxxxxxxxxx` slug (unique, no leaks).
//   • On submit, the real slug is generated from the title and made unique.

import { randomBytes } from "node:crypto";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * Convert arbitrary title → URL-safe slug.
 * Preserves Latin characters; Bengali-only titles fall back to "property".
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // keep a-z 0-9 space hyphen (Bengali is stripped)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base.length >= 3 ? base : "property";
}

/** Temporary unique slug for drafts (never shown publicly). */
export function temporarySlug(): string {
  return `draft-${randomBytes(6).toString("hex")}`;
}

/**
 * Generate a unique slug from a title. Appends "-2", "-3"… on collisions.
 * Call inside a transaction for correctness under concurrency.
 */
export async function uniqueSlugFromTitle(
  prisma: PrismaService,
  title: string,
  excludePropertyId?: string,
): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  // Bounded loop — at most 50 collisions before giving up with a random suffix.
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.property.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludePropertyId) return candidate;
    suffix++;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}