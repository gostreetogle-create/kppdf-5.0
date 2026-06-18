import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ProductsClient } from './client';

export default async function ProductsPage() {
  await requireAuth();

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count(),
    prisma.productCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <ProductsClient
      initialData={products as any[]}
      initialTotal={total}
      categories={categories as any[]}
    />
  );
}
