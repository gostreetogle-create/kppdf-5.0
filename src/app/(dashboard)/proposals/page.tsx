import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ProposalsClient } from './client';

export default async function ProposalsPage() {
  await requireAuth();

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        client: { select: { lastName: true, firstName: true } },
        items: { select: { total: true } },
      },
    }),
    prisma.proposal.count(),
  ]);

  return (
    <ProposalsClient
      initialData={proposals as any[]}
      initialTotal={total}
    />
  );
}
