import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

// POST /api/cart — создать новую сессию корзины
export async function POST() {
  try {
    await requireAuth();
    const session = await prisma.cartSession.create({
      data: {},
      include: { items: { include: { product: true } } },
    });
    return apiOk(session);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
