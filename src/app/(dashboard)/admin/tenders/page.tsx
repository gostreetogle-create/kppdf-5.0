import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { TendersClient } from './client';

export default async function TendersPage() {
  await requireAuth();

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.tender.count(),
  ]);

  return (
    <TendersClient initialData={tenders as any[]} initialTotal={total} />
  );
}
