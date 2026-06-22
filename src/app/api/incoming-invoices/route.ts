import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateIncomingInvoiceSchema } from '@/lib/validations/incoming-invoice';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['number', 'notes'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.incomingInvoice.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incomingInvoice.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'accountant']);
    const body = await request.json();
    const validation = validateBody(body, CreateIncomingInvoiceSchema);
    if (!validation.success) return validation.error;
    if (validation.data.number) {
      const existing = await prisma.incomingInvoice.findUnique({ where: { number: validation.data.number } });
      if (existing) return apiError(`Документ с номером ${validation.data.number} уже существует`, 400);
    }
    const item = await prisma.incomingInvoice.create({ data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
