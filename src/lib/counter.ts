/**
 * counter.ts — Автоинкремент номеров документов
 *
 * Аналог nextCounter() из v4.0.
 * При создании документа вызывает nextCounter('proposal') → получает число,
 * форматирует как "КП-0001".
 */

import { prisma } from './db';

/**
 * Получить следующее значение счётчика (атомарно)
 * Аналог MongoDB $inc + upsert
 */
export async function nextCounter(name: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

/**
 * Форматировать номер документа с префиксом
 */
export function formatDocNumber(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`;
}

/**
 * Сгенерировать номер для КП
 */
export async function nextProposalNumber(): Promise<string> {
  const val = await nextCounter('proposal');
  return formatDocNumber('КП', val);
}

/**
 * Сгенерировать номер для договора
 */
export async function nextContractNumber(): Promise<string> {
  const val = await nextCounter('contract');
  return formatDocNumber('Д', val);
}

/**
 * Сгенерировать номер для счёта
 */
export async function nextInvoiceNumber(): Promise<string> {
  const val = await nextCounter('invoice');
  return formatDocNumber('СФ', val);
}

/**
 * Сгенерировать номер для заказа поставщику
 */
export async function nextSupplierOrderNumber(): Promise<string> {
  const val = await nextCounter('supplier-order');
  return formatDocNumber('ЗП', val);
}

/**
 * Сбросить счётчик (для тестов/админки)
 */
export async function resetCounter(name: string): Promise<void> {
  await prisma.counter.upsert({
    where: { name },
    create: { name, value: 0 },
    update: { value: 0 },
  });
}
