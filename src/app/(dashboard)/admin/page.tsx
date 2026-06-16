'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Shield, Building2, Package, Factory } from 'lucide-react';

interface Stats {
  users: number;
  proposals: number;
  contracts: number;
  organizations: number;
  products: number;
  productionOrders: number;
}

interface RecentActivity {
  type: string;
  label: string;
  count: number;
  trend?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const endpoints = [
          '/api/users?limit=1',
          '/api/proposals?limit=1',
          '/api/contracts?limit=1',
          '/api/organizations?limit=1',
          '/api/products?limit=1',
          '/api/production-orders?limit=1',
        ];
        const results = await Promise.all(endpoints.map((url) => fetch(url).then((r) => r.json()).catch(() => ({ success: false, data: { total: 0 } }))));
        setStats({
          users: results[0].data?.total || 0,
          proposals: results[1].data?.total || 0,
          contracts: results[2].data?.total || 0,
          organizations: results[3].data?.total || 0,
          products: results[4].data?.total || 0,
          productionOrders: results[5].data?.total || 0,
        });
      } catch (e) {
        console.error('Load stats error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Пользователи', value: stats?.users ?? 0, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { label: 'КП', value: stats?.proposals ?? 0, icon: FileText, color: 'bg-green-500', href: '/proposals' },
    { label: 'Договоры', value: stats?.contracts ?? 0, icon: Shield, color: 'bg-purple-500', href: '/contracts' },
    { label: 'Контрагенты', value: stats?.organizations ?? 0, icon: Building2, color: 'bg-orange-500', href: '/organizations' },
    { label: 'Товары', value: stats?.products ?? 0, icon: Package, color: 'bg-cyan-500', href: '/products' },
    { label: 'Заказы производства', value: stats?.productionOrders ?? 0, icon: Factory, color: 'bg-red-500', href: '/production' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Администрирование</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Обзор системы и управление</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-[var(--muted)]" />
              <div className="h-8 w-20 bg-[var(--muted)] rounded mt-4" />
              <div className="h-4 w-32 bg-[var(--muted)] rounded mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.label}
                href={card.href}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-lg ${card.color}/10 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-2xl font-bold text-[var(--foreground)]">{card.value}</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-3 group-hover:text-[var(--foreground)] transition-colors">{card.label}</p>
              </a>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Быстрые ссылки</h2>
          <div className="space-y-2">
            <a href="/admin/users" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm text-[var(--foreground)]">
              <Users className="h-4 w-4 text-[var(--muted-foreground)]" /> Управление пользователями
            </a>
            <a href="/admin/status-workflows" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm text-[var(--foreground)]">
              <Shield className="h-4 w-4 text-[var(--muted-foreground)]" /> Мастер статусов
            </a>
            <a href="/admin/certificates" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm text-[var(--foreground)]">
              <Shield className="h-4 w-4 text-[var(--muted-foreground)]" /> Сертификаты
            </a>
            <a href="/admin/rpp-entries" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm text-[var(--foreground)]">
              <FileText className="h-4 w-4 text-[var(--muted-foreground)]" /> РПП записи
            </a>
            <a href="/admin/inventor-files" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm text-[var(--foreground)]">
              <Package className="h-4 w-4 text-[var(--muted-foreground)]" /> CAD-файлы
            </a>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Информация о системе</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Версия</span>
              <span className="font-medium text-[var(--foreground)]">5.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Framework</span>
              <span className="font-medium text-[var(--foreground)]">Next.js</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">База данных</span>
              <span className="font-medium text-[var(--foreground)]">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">ORM</span>
              <span className="font-medium text-[var(--foreground)]">Prisma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">UI</span>
              <span className="font-medium text-[var(--foreground)]">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
