import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateProductSchema } from '@/lib/validations/product';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['sku', 'name', 'description'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, photos: true },
      }),
      prisma.product.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);
    const body = await request.json();
    const validation = validateBody(body, CreateProductSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.product.create({ data: validation.data, include: { category: true, photos: true } });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
