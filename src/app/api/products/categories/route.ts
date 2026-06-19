import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['name'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.name = 'asc';

    const [items, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productCategory.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
