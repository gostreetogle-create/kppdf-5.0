import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextProductionOrderNumber } from '@/lib/counter';

const include = { items: { include: { product: true } }, client: true, organization: true };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.proposal.findUnique({ where: { id }, include });
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
    const item = await prisma.proposal.update({ where: { id }, data: body, include });
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
    await prisma.proposal.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['accepted', 'rejected', 'paid'],
  accepted: ['converted', 'paid'],
  paid: ['converted'],
  rejected: ['draft'],
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const { status } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
    if (!current) return apiError('Не найдено', 404);

    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status)) {
      return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
    }

    // Авто-конвертация в ProductionOrder при оплате
    if (status === 'paid') {
      // Загружаем полное КП с товарами и договором
      const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, client: true, organization: true, contract: true },
      });
      if (!proposal) return apiError('Не найдено', 404);
      if (proposal.items.length === 0) return apiError('КП не содержит товаров', 400);

      // Всё в одной транзакции: проверка дубликатов + создание заказа + обновление статуса
      const [productionOrder, updatedProposal] = await prisma.$transaction(async (tx) => {
        // Проверяем, не создан ли уже производственный заказ
        const existing = await tx.productionOrder.findFirst({
          where: { proposalId: id },
        });
        if (existing) throw new Error('ALREADY_EXISTS');

        // Номер заказа = номер КП. Если занят — авто-генерация ЗК-XXXX
        const duplicate = await tx.productionOrder.findUnique({ where: { number: proposal.number } });
        const orderNumber = duplicate
          ? await nextProductionOrderNumber()
          : proposal.number;

        const order = await tx.productionOrder.create({
          data: {
            number: orderNumber,
            title: `Производство: ${proposal.title || `КП №${proposal.number}`}`,
            status: 'planned',
            plannedStart: new Date(),
            notes: proposal.notes || '',
            proposalId: id,
            contractId: proposal.contract?.id || null,
            tasks: {
              create: proposal.items.map((item, index) => ({
                title: item.product?.name || `Позиция ${index + 1}`,
                description: `Изготовление: ${item.product?.name || `Позиция ${index + 1}`} × ${item.quantity} шт`,
                status: 'pending',
                sortOrder: index,
              })),
            },
          },
          include: { tasks: true },
        });

        const updated = await tx.proposal.update({
          where: { id },
          data: { status },
          include,
        });

        return [order, updated];
      });

      return apiOk({ order: productionOrder, proposal: updatedProposal }, `Оплата принята. Производственный заказ №${productionOrder.number} создан автоматически`);
    }

    // Обычная смена статуса (не paid)
    const item = await prisma.proposal.update({ where: { id }, data: { status }, include });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'ALREADY_EXISTS') return apiError('Производственный заказ для этого КП уже существует', 400);
    return apiError(String(error), 500);
  }
}
