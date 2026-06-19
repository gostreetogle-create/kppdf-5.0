import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ContractsClient } from './client';
import { CONTRACT_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function ContractsPage() {
  await requireAuthPage();

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany(CONTRACT_LIST_QUERY_ARGS),
    prisma.contract.count(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ContractsClient initialData={contracts as any[]} initialTotal={total} />;
}
