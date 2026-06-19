import { prisma } from '@/lib/db';
import { requireAuthPage } from '@/lib/auth-page';
import { ClientsClient } from './client';
import { CLIENT_LIST_QUERY_ARGS } from '@/lib/types/server-pages';

export default async function ClientsPage() {
  await requireAuthPage();

  const [clients, total] = await Promise.all([
    prisma.client.findMany(CLIENT_LIST_QUERY_ARGS),
    prisma.client.count(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ClientsClient initialData={clients as any[]} initialTotal={total} />;
}
