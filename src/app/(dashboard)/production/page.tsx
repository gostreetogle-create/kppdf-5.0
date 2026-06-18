import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ProductionClient } from './client';

export default async function ProductionPage() {
  await requireAuth();

  const [orders, total] = await Promise.all([
    prisma.productionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { workType: { select: { name: true } } },
    }),
    prisma.productionOrder.count(),
  ]);

  return (
    <ProductionClient
      initialData={orders as any[]}
      initialTotal={total}
    />
  );
}
