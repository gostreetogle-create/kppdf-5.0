import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProductsClient } from './client';
import { PRODUCT_LIST_QUERY_ARGS, PRODUCT_CATEGORY_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function ProductsPage() {
  await requireAuthPage();

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany(PRODUCT_LIST_QUERY_ARGS),
    prisma.product.count(),
    prisma.productCategory.findMany(PRODUCT_CATEGORY_LIST_QUERY_ARGS),
  ]);

  return (
    <ProductsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialData={products as any[]}
      initialTotal={total}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories={categories as any[]}
    />
  );
}
