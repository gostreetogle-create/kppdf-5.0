import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

const include = { items: true, client: true, organization: true, proposal: true };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.contract.findUnique({ where: { id }, include });
    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const item = await prisma.contract.update({ where: { id }, data: body, include });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: ['draft'],
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const { status, signedAt } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.contract.findUnique({ where: { id }, select: { status: true, signedAt: true } });
    if (!current) return apiError('Не найдено', 404);

    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status)) {
      return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
    }

    const data: Record<string, unknown> = { status };
    // Авто-дата подписания при переходе в active
    if (status === 'active' && !current.signedAt) {
      data.signedAt = signedAt || new Date().toISOString();
    }

    const item = await prisma.contract.update({ where: { id }, data, include });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
