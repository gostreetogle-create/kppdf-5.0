import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

// POST /api/proposals/[id]/to-production — конвертировать КП в производственный заказ
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, client: true, organization: true },
    });

    if (!proposal) return apiError('КП не найдено', 404);
    if (proposal.items.length === 0) return apiError('КП не содержит товаров', 400);
    if (proposal.status !== 'accepted') {
      return apiError('КП должно быть в статусе "принято" для конвертации в производство', 400);
    }

    const existingOrder = await prisma.productionOrder.findFirst({
      where: { proposalId: id },
    });
    if (existingOrder) {
      return apiError('Производственный заказ для этого КП уже существует', 400);
    }

    const year = new Date().getFullYear();
    const count = await prisma.productionOrder.count();
    const number = `ПЗ-${year}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const orderItems = proposal.items.map((item, index) => {
      const total = item.total || Math.round(item.unitPrice * item.quantity * 100) / 100;
      totalAmount += total;
      return {
        name: item.product?.name || `Позиция ${index + 1}`,
        quantity: item.quantity,
        unit: item.product?.unit || 'шт',
        unitPrice: item.unitPrice,
        total,
        sortOrder: index,
      };
    });

    const [order] = await prisma.$transaction([
      prisma.productionOrder.create({
        data: {
          number,
          title: `Производственный заказ №${number} (из КП ${proposal.number})`,
          status: 'planned',
          priority: 0,
          notes: `Создано из КП ${proposal.number}${proposal.client ? ` | Клиент: ${proposal.client.lastName} ${proposal.client.firstName}` : ''}`,
          proposalId: id,
          contractId: proposal.clientId ? undefined : undefined,
        },
      }),
      prisma.proposal.update({
        where: { id },
        data: { status: 'converted' },
      }),
    ]);

    return apiOk({
      productionOrder: order,
      proposal: { id: proposal.id, number: proposal.number, status: 'converted' },
    }, 'Производственный заказ создан из КП');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
