import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ProposalsClient } from './client';
import { PROPOSAL_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function ProposalsPage() {
  await requireAuthPage();

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany(PROPOSAL_LIST_QUERY_ARGS),
    prisma.proposal.count(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ProposalsClient initialData={proposals as any[]} initialTotal={total} />;
}
