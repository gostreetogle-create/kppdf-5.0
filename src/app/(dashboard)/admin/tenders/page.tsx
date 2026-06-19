import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { TendersClient } from './client';
import { TENDER_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function TendersPage() {
  await requireAuthPage();

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany(TENDER_LIST_QUERY_ARGS),
    prisma.tender.count(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TendersClient initialData={tenders as any[]} initialTotal={total} />;
}
