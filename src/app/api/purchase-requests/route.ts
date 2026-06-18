import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { nextSupplierOrderNumber } from '@/lib/counter';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['number', 'title'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    if (!body?.number) {
      body.number = await nextSupplierOrderNumber();
    } else {
      const existing = await prisma.purchaseRequest.findUnique({ where: { number: body.number } });
      if (existing) return apiError(`Документ с номером ${body.number} уже существует`, 400);
    }
    const item = await prisma.purchaseRequest.create({
      data: body,
      include: { items: true },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
