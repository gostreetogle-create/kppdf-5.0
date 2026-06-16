'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home, Building2, Package, Factory, Warehouse, Banknote, Shield, ChevronDown, X
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: 'Главная', href: '/dashboard', icon: Home },
  {
    label: 'Справочники', href: '/organizations', icon: Building2,
    children: [
      { label: 'Контрагенты', href: '/organizations' },
      { label: 'Клиенты', href: '/clients' },
      { label: 'Категории', href: '/products/categories' },
      { label: 'Товары', href: '/products' },
    ],
  },
  {
    label: 'Продажи', href: '/proposals', icon: Package,
    children: [
      { label: 'КП (список)', href: '/proposals' },
      { label: 'Оформить КП', href: '/proposals/new' },
      { label: 'Договоры', href: '/contracts' },
    ],
  },
  {
    label: 'Производство', href: '/production', icon: Factory,
    children: [
      { label: 'Заказы', href: '/production' },
      { label: 'Гантт-чарт', href: '/production/gantt' },
      { label: 'Модули', href: '/production/modules' },
      { label: 'Снабжение', href: '/production/procurement' },
      { label: 'Мои задачи', href: '/production/my-tasks' },
      { label: 'Типы работ', href: '/production/work-types' },
      { label: 'Центры', href: '/production/work-centers' },
      { label: 'Работники', href: '/production/workers' },
    ],
  },
  {
    label: 'Склад', href: '/warehouse', icon: Warehouse,
    children: [
      { label: 'Склады', href: '/warehouse' },
      { label: 'Позиции', href: '/warehouse/positions' },
      { label: 'Закупки', href: '/warehouse/purchases' },
    ],
  },
  {
    label: 'Финансы', href: '/finance', icon: Banknote,
    children: [
      { label: 'Обзор', href: '/finance' },
      { label: 'Закрытия заказов', href: '/finance/order-closings' },
      { label: 'Сверки', href: '/finance/reconciliation' },
      { label: 'Отчёты', href: '/finance/reports' },
    ],
  },
  {
    label: 'Администрирование', href: '/admin', icon: Shield,
    children: [
      { label: 'Пользователи', href: '/admin/users' },
      { label: 'Типы документов', href: '/admin/doc-types' },
      { label: 'Шаблоны таблиц', href: '/admin/table-templates' },
      { label: 'Шаблоны документов', href: '/admin/templates' },
      { label: 'Мастер статусов', href: '/admin/status-workflows' },
      { label: 'Тендеры', href: '/admin/tenders' },
      { label: 'Сертификаты', href: '/admin/certificates' },
      { label: 'РПП записи', href: '/admin/rpp-entries' },
      { label: 'CAD-файлы', href: '/admin/inventor-files' },
      { label: 'Дашборд', href: '/admin' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSection = (href: string) => {
    setExpanded(expanded === href ? null : href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-[var(--sidebar)] border-r border-[var(--border)]',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)]">
              <span className="text-[var(--primary)]">KP</span>
              <span>CRM</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-[var(--muted)]">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.children && item.children.some(c => pathname === c.href));
                const isExpanded = expanded === item.href || item.children?.some(c => pathname === c.href);

                if (item.children) {
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => toggleSection(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180',
                        )} />
                      </button>
                      {isExpanded && (
                        <ul className="mt-1 ml-6 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                                  pathname === child.href
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)]">KP CRM v5.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
