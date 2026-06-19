import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateDocTypeSchema } from '@/lib/validations/doc-type';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['name', 'slug'].map((f) => ({ [f]: { contains: search } }));
    }

    const [items, total] = await Promise.all([
      prisma.docType.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.docType.count({ where }),
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
    const validation = validateBody(body, CreateDocTypeSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.docType.create({ data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
