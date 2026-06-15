import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const items = await prisma.docType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return apiOk({ items, total: items.length });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
