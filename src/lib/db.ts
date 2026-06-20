import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { isProd } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Build the right driver adapter for the active DATABASE_URL.
 *
 * Cycle v3.1.1 — dual-adapter for SCRAM/connection robustness:
 *   - postgresql:// / postgres://  → PrismaPg (existing Postgres path;
 *     kppdf container / external Postgres)
 *   - file: ...            → PrismaBetterSqlite3 (matches
 *     deploy/docker-compose.prod.yml intent: prod runs on `file:/data/dev.db`,
 *     and dev.db on disk is the dev path of choice)
 *
 * Rationale: the previous PrismaPg-only fallback failed in dev with
 *   `SASL SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`
 * on some reload cycles (stale PrismaClient singleton, env quote-handling
 * edge cases). The SQLite path avoids all SCRAM machinery and matches what
 * `deploy/docker-compose.prod.yml` already mandates for production.
 */
function createAdapter(url: string) {
  if (url.startsWith('file:')) {
    return new PrismaBetterSqlite3({ url });
  }
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return new PrismaPg({ connectionString: url });
  }
  throw new Error(
    `Unsupported DATABASE_URL protocol: "${url.split(':', 1)[0]}". ` +
    `Expected "file:" (SQLite) or "postgresql://"/"postgres://" (Postgres).`,
  );
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const adapter = createAdapter(url);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) globalForPrisma.prisma = prisma;
