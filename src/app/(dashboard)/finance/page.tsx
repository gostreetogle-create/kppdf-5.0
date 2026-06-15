'use client';

import { Receipt, FileCheck, BarChart3 } from 'lucide-react';

const sections = [
  {
    title: 'Закрытия заказов',
    description: 'Учёт закрытия производственных заказов и списания',
    href: '/finance/order-closings',
    icon: <Receipt className="h-6 w-6" />,
  },
  {
    title: 'Акты сверки',
    description: 'Акты сверки расчётов с клиентами и поставщиками',
    href: '/finance/reconciliation',
    icon: <FileCheck className="h-6 w-6" />,
  },
  {
    title: 'Финансовые отчёты',
    description: 'Сводные отчёты по доходам, расходам и прибыли',
    href: '/finance/reports',
    icon: <BarChart3 className="h-6 w-6" />,
  },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Финансы</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <a
            key={s.title}
            href={s.href}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:shadow-md transition-shadow block"
          >
            <div className="text-[var(--primary)] mb-3">{s.icon}</div>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{s.title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{s.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
