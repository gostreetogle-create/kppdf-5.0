import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { OrganizationsClient } from './client';

export default async function OrganizationsPage() {
  await requireAuth();

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const total = await prisma.organization.count();

  return (
    <OrganizationsClient initialData={organizations as any[]} initialTotal={total} />
  );
}
