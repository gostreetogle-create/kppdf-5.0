import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { isProd } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Build the SQLite driver adapter for the current DATABASE_URL.
 *
 * Cycle v3.1.1 introduced a dual-adapter (PrismaBetterSqlite3 + PrismaPg)
 * for SCRAM/connection robustness. Cycle v3.3.1 removed the PrismaPg branch
 * as it was dead code given `datasource db { provider = "sqlite" }` in
 * prisma/schema.prisma. Prisma 7 throws `PrismaClientInitializationError`
 * at instantiation when adapter driver ≠ schema provider.
 *
 * Now: file: → PrismaBetterSqlite3 (only). Matches
 * deploy/docker-compose.prod.yml intent: prod runs on `file:/data/dev.db`,
 * and dev.db on disk is the dev path of choice.
 */
function createAdapter(url: string) {
  if (url.startsWith('file:')) {
    return new PrismaBetterSqlite3({ url });
  }
  throw new Error(
    `Unsupported DATABASE_URL protocol: "${url.split(':', 1)[0]}". ` +
    `Expected "file:" (SQLite). This project uses sqlite exclusively.`,
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
