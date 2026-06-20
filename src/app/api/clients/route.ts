import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateClientSchema } from '@/lib/validations/client';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      // Cycle 54: search расширен companyName + inn для юрлица.
      // mode: 'insensitive' — case-insensitive поиск по всем полям (Postgres feature).
      // Без mode Cyrillic search "ооо" не находит "ООО СтройМонтаж".
      where.OR = [
        { lastName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { inn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { organization: true },
      }),
      prisma.client.count({ where }),
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
    // Cycle 54 (B.2): backward compat — если клиент не передал type,
    // устанавливаем 'individual' перед Zod-валидацией. Это позволяет
    // существующим API-консьюмерам, отправляющим только lastName/firstName,
    // продолжить работу без изменений.
    if (!body.type) {
      body.type = 'individual';
    }
    const validation = validateBody(body, CreateClientSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.client.create({ data: validation.data, include: { organization: true } });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
