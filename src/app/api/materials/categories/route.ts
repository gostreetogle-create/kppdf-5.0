import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { CreateMaterialCategorySchema } from '@/lib/validations/material';
import { validateBody } from '@/lib/validations';
import { invalidateByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'material-categories';

export async function GET() {
  try {
    await requireAuth();
    const items = await prisma.materialCategory.findMany({ orderBy: { name: 'asc' } });
    return apiOk(items);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const validation = validateBody(body, CreateMaterialCategorySchema);
    if (!validation.success) return validation.error;
    const item = await prisma.materialCategory.create({ data: validation.data });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
