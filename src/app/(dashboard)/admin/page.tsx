'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Shield, Building2, Package, Factory } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Typography, H1, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  users: number;
  proposals: number;
  contracts: number;
  organizations: number;
  products: number;
  productionOrders: number;
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
    { label: 'Пользователи', value: stats?.users ?? 0, icon: Users, bgClass: 'bg-blue-500/10', iconClass: 'text-blue-500', href: '/admin/users' },
    { label: 'КП', value: stats?.proposals ?? 0, icon: FileText, bgClass: 'bg-green-500/10', iconClass: 'text-green-500', href: '/proposals' },
    { label: 'Договоры', value: stats?.contracts ?? 0, icon: Shield, bgClass: 'bg-purple-500/10', iconClass: 'text-purple-500', href: '/contracts' },
    { label: 'Контрагенты', value: stats?.organizations ?? 0, icon: Building2, bgClass: 'bg-orange-500/10', iconClass: 'text-orange-500', href: '/organizations' },
    { label: 'Товары', value: stats?.products ?? 0, icon: Package, bgClass: 'bg-cyan-500/10', iconClass: 'text-cyan-500', href: '/products' },
    { label: 'Заказы производства', value: stats?.productionOrders ?? 0, icon: Factory, bgClass: 'bg-red-500/10', iconClass: 'text-red-500', href: '/production' },
  ];

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <H1>Администрирование</H1>
        <Muted>Обзор системы и управление</Muted>
      </Stack>

      {loading ? (
        <Grid cols="auto-md" gap="md">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton shape="circle" className="h-10 w-10 mb-4" />
              <Skeleton shape="text-lg" className="w-20 mb-2" />
              <Skeleton shape="text-sm" className="w-32" />
            </Card>
          ))}
        </Grid>
      ) : (
        <Grid cols="auto-md" gap="md">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.label}
                href={card.href}
                className="group"
              >
                <Card variant="interactive" className="p-6 h-full">
                  <Flex justify="between" align="start">
                    <div className={`h-10 w-10 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${card.iconClass}`} />
                    </div>
                    <Typography variant="h3">{card.value}</Typography>
                  </Flex>
                  <Muted className="mt-3 group-hover:text-foreground transition-colors">{card.label}</Muted>
                </Card>
              </a>
            );
          })}
        </Grid>
      )}

      <Grid cols="auto-sm" gap="lg">
        <Card className="p-6">
          <Typography variant="h4" className="mb-4">Быстрые ссылки</Typography>
          <Stack gap="sm">
            {([
              { icon: Users, label: 'Управление пользователями', href: '/admin/users' },
              { icon: Shield, label: 'Мастер статусов', href: '/admin/status-workflows' },
              { icon: Shield, label: 'Сертификаты', href: '/admin/certificates' },
              { icon: FileText, label: 'РПП записи', href: '/admin/rpp-entries' },
              { icon: Package, label: 'CAD-файлы', href: '/admin/inventor-files' },
            ]).map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground"
              >
                <link.icon className="h-4 w-4 text-muted-foreground" />
                {link.label}
              </a>
            ))}
          </Stack>
        </Card>

        <Card className="p-6">
          <Typography variant="h4" className="mb-4">Информация о системе</Typography>
          <Stack gap="sm">
            {([
              ['Версия', '5.0.0'],
              ['Framework', 'Next.js'],
              ['База данных', 'SQLite'],
              ['ORM', 'Prisma'],
              ['UI', 'Tailwind CSS'],
            ] as const).map(([label, value]) => (
              <Flex key={label} justify="between">
                <Muted>{label}</Muted>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </Flex>
            ))}
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}
