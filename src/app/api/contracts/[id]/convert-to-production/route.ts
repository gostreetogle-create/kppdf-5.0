import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { nextProductionOrderNumber } from '@/lib/counter';

// POST /api/contracts/[id]/convert-to-production — конвертировать договор в производственный заказ
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    // Получаем договор с товарами и КП
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
        organization: true,
        proposal: { include: { items: { include: { product: true } } } },
      },
    });

    if (!contract) return apiError('Договор не найден', 404);
    if (contract.items.length === 0 && (!contract.proposal || contract.proposal.items.length === 0))
      return apiError('Договор не содержит товаров', 400);

    // Проверяем, не создан ли уже производственный заказ
    const existing = await prisma.productionOrder.findFirst({
      where: { contractId: id },
    });
    if (existing) {
      return apiError('Производственный заказ для этого договора уже существует', 400);
    }

    // Генерируем номер заказа
    const number = await nextProductionOrderNumber();

    // Определяем товары для производства (из договора или КП)
    const sourceItems = contract.items.length > 0
      ? contract.items
      : (contract.proposal?.items || []);

    // Создаём производственный заказ с задачами по каждому товару
    const [productionOrder] = await prisma.$transaction([
      prisma.productionOrder.create({
        data: {
          number,
          title: `Производство: ${contract.title || `Договор №${contract.number}`}`,
          status: 'planned',
          plannedStart: new Date(),
          notes: contract.notes || '',
          contractId: id,
          proposalId: contract.proposalId,
          // Создаём задачи по каждой позиции
          tasks: {
            create: sourceItems.map((item, index) => {
              const itemName = 'name' in item && item.name ? String(item.name) : (item as { product?: { name?: string } }).product?.name || `Позиция ${index + 1}`;
              const itemUnit = 'unit' in item ? String(item.unit || 'шт') : ((item as { product?: { unit?: string } }).product?.unit || 'шт');
              return {
                title: itemName,
                description: `Изготовление: ${itemName} × ${item.quantity} ${itemUnit}`,
                status: 'pending',
                sortOrder: index,
              };
            }),
          },
        },
        include: { tasks: true, workType: true, workCenter: true },
      }),
      // Обновляем статус договора
      prisma.contract.update({
        where: { id },
        data: { status: 'active' },
      }),
    ]);

    return apiOk(productionOrder, `Производственный заказ №${number} создан`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
