import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { logOrderAction } from '@/lib/order-history';

const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['manufacturing', 'painting', 'completed', 'cancelled'],
  manufacturing: ['painting', 'completed', 'cancelled'],
  painting: ['shipping', 'completed', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['planned'],
};

/**
 * Авто-списание материалов со склада при старте производства
 */
async function autoDeductMaterials(orderId: string) {
  // Получаем заказ с proposal/contract
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      proposalId: true,
      contractId: true,
    },
  });
  if (!order) return;

  // Собираем ID продуктов из proposal или contract
  const productIds = new Set<string>();

  if (order.proposalId) {
    const items = await prisma.proposalItem.findMany({
      where: { proposalId: order.proposalId },
      select: { productId: true },
    });
    items.forEach((i) => { if (i.productId) productIds.add(i.productId); });
  }

  if (order.contractId) {
    // ContractItem не имеет productId, используем proposalItems
    const contract = await prisma.contract.findUnique({
      where: { id: order.contractId },
      select: { proposalId: true },
    });
    if (contract?.proposalId) {
      const items = await prisma.proposalItem.findMany({
        where: { proposalId: contract.proposalId },
        select: { productId: true },
      });
      items.forEach((i) => { if (i.productId) productIds.add(i.productId); });
    }
  }

  if (productIds.size === 0) return;

  // Ищем модули продуктов и их материалы
  const materials = await prisma.moduleMaterial.findMany({
    where: {
      module: {
        productId: { in: Array.from(productIds) },
      },
    },
    select: {
      name: true,
      quantity: true,
      unit: true,
      module: {
        select: { productId: true },
      },
    },
  });

  if (materials.length === 0) return;

  // Списание материалов со склада
  for (const material of materials) {
    const storageItems = await prisma.storageItem.findMany({
      where: {
        product: {
          modules: {
            some: {
              materials: {
                some: { name: material.name },
              },
            },
          },
        },
      },
      select: { id: true, quantity: true },
    });

    let remainingQty = Math.ceil(material.quantity);
    for (const item of storageItems) {
      if (remainingQty <= 0) break;
      const deduct = Math.min(item.quantity, remainingQty);
      if (deduct <= 0) continue;

      await prisma.storageItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - deduct },
      });

      await prisma.inventoryMovement.create({
        data: {
          storageItemId: item.id,
          type: 'out',
          quantity: deduct,
          notes: `Авто-списание: производственный заказ ${orderId}`,
        },
      });

      remainingQty -= deduct;
    }
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const { status } = await request.json();

    if (!status || typeof status !== 'string') {
      return apiError('Укажите статус', 400);
    }

    const current = await prisma.productionOrder.findUnique({
      where: { id },
      select: { status: true, number: true },
    });
    if (!current) return apiError('Заказ не найден', 404);

    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(status)) {
      return apiError(`Нельзя перевести из "${current.status}" в "${status}"`, 400);
    }

    // Авто-списание материалов при старте производства
    if (current.status === 'planned' && status === 'in_progress') {
      await autoDeductMaterials(id);
    }

    const item = await prisma.productionOrder.update({
      where: { id },
      data: { status, actualStart: status === 'in_progress' ? new Date() : undefined, actualEnd: status === 'completed' ? new Date() : undefined },
      include: { tasks: true, workType: true, workCenter: true },
    });

    // Логируем смену статуса
    await logOrderAction({
      orderId: id,
      action: status === 'completed' ? 'closed' : 'status_changed',
      details: { fromStatus: current.status, toStatus: status },
    });

    return apiOk(item, `Заказ №${current.number} переведён в статус "${status}"`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
