import path from 'path';
import { PrismaClient } from '@/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Always resolve relative to project root (process.cwd()), independent of where
  // prisma CLI runs from. Aligns runtime adapter with the file that `npx prisma db push`
  // updates via `DATABASE_URL=file:./dev.db` in .env (resolved relative to prisma.config.ts).
  const absoluteDbPath = path.join(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: `file:${absoluteDbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
