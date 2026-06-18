import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ContractsClient } from './client';

export default async function ContractsPage() {
  await requireAuth();

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { client: { select: { lastName: true, firstName: true } } },
    }),
    prisma.contract.count(),
  ]);

  return (
    <ContractsClient
      initialData={contracts as any[]}
      initialTotal={total}
    />
  );
}
