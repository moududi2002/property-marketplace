-- 📍 /infrastructure/docker/postgres/init.sql
--
-- PostgreSQL startup-এ একবার চলে।
-- Bangladesh-focused Extensions + Full-text search setup।

-- ─── Extensions ─────────────────────────────────────────────
-- pg_trgm: fuzzy search (property title, address)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent: easier text matching (future-proof for diacritics)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- citext: case-insensitive email column (Prisma @db.Citext দিয়ে ব্যবহার হবে)
CREATE EXTENSION IF NOT EXISTS citext;

-- uuid-ossp: UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Timezone ───────────────────────────────────────────────
-- সব timestamp UTC-এ সংরক্ষিত হবে, Frontend locale অনুযায়ী দেখাবে
SET timezone = 'UTC';

-- ─── Log ────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Property Marketplace database initialized (pg_trgm, unaccent, citext, uuid-ossp)';
END $$;