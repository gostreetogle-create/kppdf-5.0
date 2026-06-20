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

  return <ClientsClient initialData={clients} initialTotal={total} />;
}
