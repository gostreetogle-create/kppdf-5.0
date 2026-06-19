import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProductionClient } from './client';
import { PRODUCTION_ORDER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function ProductionPage() {
  await requireAuthPage();

  const [orders, total] = await Promise.all([
    prisma.productionOrder.findMany(PRODUCTION_ORDER_LIST_QUERY_ARGS),
    prisma.productionOrder.count(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ProductionClient initialData={orders as any[]} initialTotal={total} />;
}
