import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { WarehouseClient } from './client';

export default async function WarehousePage() {
  await requireAuth();

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.warehouse.count(),
  ]);

  return (
    <WarehouseClient initialData={warehouses as any[]} initialTotal={total} />
  );
}
