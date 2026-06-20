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

  return <ProposalsClient initialData={proposals} initialTotal={total} />;
}
