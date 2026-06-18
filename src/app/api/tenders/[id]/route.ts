import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.tender.findUnique({ where: { id } });
    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await request.json();
    if (body.number) {
      const existing = await prisma.tender.findUnique({ where: { number: body.number } });
      if (existing && existing.id !== id) return apiError(`Документ с номером ${body.number} уже существует`, 400);
    }
    const item = await prisma.tender.update({ where: { id }, data: body });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    await prisma.tender.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
