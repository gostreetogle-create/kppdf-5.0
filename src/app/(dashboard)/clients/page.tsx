import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ClientsClient } from './client';

export default async function ClientsPage() {
  await requireAuth();

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { organization: { select: { name: true } } },
  });

  const total = await prisma.client.count();

  return (
    <ClientsClient
      initialData={clients as any[]}
      initialTotal={total}
    />
  );
}
