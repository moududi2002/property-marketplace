<!-- 📍 /README.md -->
# Property Marketplace

Bangladesh-এর জন্য একটি Admin-Moderated Property Marketplace। Seller Property Submit করবে, Admin Review করে Approve করলে তবেই Public Website-এ Publish হবে।

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** NestJS 11, Prisma 6, PostgreSQL 16
- **Real-time:** Socket.IO 4.8
- **Queue:** BullMQ + Redis
- **Monorepo:** pnpm + Turborepo

## Prerequisites
- Node.js 22+
- pnpm 9+
- Docker & Docker Compose

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file
cp .env.example .env

# 3. Start databases
pnpm db:up

# 4. Generate Prisma client & migrate
pnpm db:generate
pnpm db:migrate

# 5. Run dev servers
pnpm dev