import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
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
      // Cycle 42: composite unique @@unique([number, version]) + block superseded
      const cur = await prisma.proposal.findUnique({
        where: { id },
        select: { version: true, supersededAt: true },
      });
      if (!cur) return apiError('Не найдено', 404);
      if (cur.supersededAt) return apiError('Нельзя редактировать superseded версию. Создайте новую версию.', 400);
      const conflict = await prisma.proposal.findFirst({
        where: { number: body.number, version: cur.version },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) return apiError(`Документ с номером ${body.number} уже существует`, 400);
    }
    const item = await prisma.proposal.update({ where: { id }, data: body, include });
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
    await prisma.proposal.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
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

    const current = await prisma.proposal.findUnique({
      where: { id },
      select: { status: true, supersededAt: true },
    });
    if (!current) return apiError('Не найдено', 404);

    // Cycle 42: hard-block смены статуса для superseded версии
    if (current.supersededAt) return apiError('Нельзя менять статус superseded версии. Создайте новую версию.', 400);

    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status)) {
      return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
    }

    // Авто-конвертация в ProductionOrder при оплате
    if (status === 'paid') {
      // Загружаем полное КП с товарами и договором
      const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  modules: {
                    include: {
                      workTypes: { include: { workType: true } },
                    },
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
          client: true,
          organization: true,
          contract: true,
        },
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

        // Собираем задачи из модулей товаров
        const tasks: Array<{
          title: string;
          description: string;
          status: string;
          sortOrder: number;
          estimatedHours?: number;
          workTypeId?: string;
        }> = [];

        let taskSort = 0;
        for (const item of proposal.items) {
          const product = item.product;
          if (!product?.modules?.length) {
            tasks.push({
              title: product?.name || `Позиция ${taskSort + 1}`,
              description: `Изготовление: ${product?.name || `Позиция ${taskSort + 1}`} × ${item.quantity} шт`,
              status: 'pending',
              sortOrder: taskSort++,
            });
            continue;
          }

          for (const mod of product.modules) {
            if (!mod.workTypes?.length) {
              tasks.push({
                title: `${product.name} — ${mod.name}`,
                description: `Изготовление модуля: ${mod.name}${mod.article ? ` (${mod.article})` : ''}`,
                status: 'pending',
                sortOrder: taskSort++,
              });
              continue;
            }

            for (const wt of mod.workTypes) {
              tasks.push({
                title: `${product.name} — ${mod.name} — ${wt.workType?.name || 'Работа'}`,
                description: `${wt.workType?.name || 'Работа'}: ${mod.name} × ${item.quantity} шт. Ожидается: ${wt.estimatedHours}ч`,
                status: 'pending',
                sortOrder: taskSort++,
                estimatedHours: wt.estimatedHours,
                workTypeId: wt.workTypeId,
              });
            }
          }
        }

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
              create: tasks,
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
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    if (error instanceof Error && error.message === 'ALREADY_EXISTS') return apiError('Производственный заказ для этого КП уже существует', 400);
    return apiError(String(error), 500);
  }
}
