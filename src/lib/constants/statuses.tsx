// ========================================
// Unified Status maps — единый источник истины
// Все компоненты и страницы импортируют отсюда
// ========================================

import type React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export interface StatusConfig {
  label: string;
  className: string;
  icon?: React.ElementType;
}

export type StatusMap = Record<string, StatusConfig>;

// ── Proposal ──────────────────────────────
// draft → sent → accepted/rejected → converted
export const PROPOSAL_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  sent: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  accepted: { label: 'Принято', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Отклонено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  converted: { label: 'Конвертировано', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

// ── Contract ──────────────────────────────
// draft → active → completed / cancelled
export const CONTRACT_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  active: { label: 'Активно', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  completed: { label: 'Завершено', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Production Order ──────────────────────
// planned → in_progress → manufacturing → painting → shipping → completed
// cancelled — в любой момент
export const ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  planned: { label: 'Запланировано', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  manufacturing: { label: 'Производство', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  painting: { label: 'Покраска', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  shipping: { label: 'Отгрузка', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  completed: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Order Task ────────────────────────────
export const TASK_STATUS: Record<string, StatusConfig> = {
  pending: { label: 'Ожидание', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  completed: { label: 'Выполнена', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  blocked: { label: 'Заблокирована', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Purchase Request ─────────────────────
export const PURCHASE_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  pending: { label: 'Ожидание', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  approved: { label: 'Согласована', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  ordered: { label: 'Заказано', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  received: { label: 'Получено', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Supplier Order ────────────────────────
export const SUPPLIER_ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  confirmed: { label: 'Подтверждён', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  shipped: { label: 'Отгружен', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  delivered: { label: 'Доставлен', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Отменён', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Incoming Invoice ─────────────────────
export const INVOICE_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  paid: { label: 'Оплачен', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'Просрочен', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Tender ───────────────────────────────
export const TENDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  submitted: { label: 'Подано', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  won: { label: 'Выигран', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  lost: { label: 'Проигран', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  cancelled: { label: 'Отменён', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  overdue: { label: 'Просрочено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Certificate ──────────────────────────
export const CERTIFICATE_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Действует', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: ShieldCheck },
  expired: { label: 'Истёк', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: ShieldAlert },
  revoked: { label: 'Отозван', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: ShieldX },
};

// ── RPP Entry ────────────────────────────
export const RPP_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  active: { label: 'Активно', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  archived: { label: 'В архиве', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
};

// ── Shipment ────────────────────────────
export const SHIPPING_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  partially: { label: 'Частично', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  shipped: { label: 'Отгружено', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── Order Closing ────────────────────────
export const CLOSING_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  approved: { label: 'Утверждён', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  completed: { label: 'Закрыт', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

// ── Reconciliation Act ─────────────────
export const RECON_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
  signed: { label: 'Подписан', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

// ── Storage Item / Inventory ─────────────
export const INVENTORY_STATUS: Record<string, StatusConfig> = {
  in_stock: { label: 'В наличии', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  low: { label: 'Мало', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  out_of_stock: { label: 'Нет', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

// ── isActive boolean ──────────────────────
// Для сущностей с булевым статусом: организации, склады, типы работ и т.д.
export const IS_ACTIVE_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Активен', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  inactive: { label: 'Неактивен', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
};

export const IS_ACTIVE_MAP: Record<string, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
};

// Для сущностей со статусом блокировки (пользователи)
export const USER_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Активен', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  blocked: { label: 'Заблокирован', className: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400' },
};

// Для isActive как Да/Нет (статус-воркфлоу)
export const IS_ACTIVE_YESNO: Record<string, StatusConfig> = {
  yes: { label: 'Да', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  no: { label: 'Нет', className: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400' },
};

export const IS_ACTIVE_FEMININE: Record<string, StatusConfig> = {
  active: { label: 'Активна', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  inactive: { label: 'Неактивна', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' },
};

// ========================================
// Helpers
// ========================================

export function getStatus(map: Record<string, StatusConfig>, status: string): StatusConfig {
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-300' };
}

export function StatusBadge({
  status,
  map,
  className,
}: {
  status: string;
  map: Record<string, StatusConfig>;
  className?: string;
}) {
  const cfg = getStatus(map, status);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}${className ? ' ' + className : ''}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}
