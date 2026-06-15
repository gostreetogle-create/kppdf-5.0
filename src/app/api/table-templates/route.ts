import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { page, limit } = parseSearchParams(new URL(request.url).searchParams);

    const [items, total] = await Promise.all([
      prisma.tableTemplate.findMany({
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tableTemplate.count(),
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
    const { name, description, columns } = body;

    if (!name?.trim()) return apiError('Название обязательно', 400);

    const template = await prisma.tableTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        columns: columns || '[]',
      },
    });

    return apiOk(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
