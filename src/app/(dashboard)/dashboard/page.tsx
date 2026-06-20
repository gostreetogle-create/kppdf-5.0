'use client';

import { type ReactNode } from 'react';
import { Building2, Users, Package, FileText, ClipboardList, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { H1, Typography, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardCharts from './charts';

interface DashboardData {
  overview: { title: string; count: number; href: string }[];
  proposalStats: { status: string; count: number }[];
  categoryStats: { name: string; count: number }[];
  recentProposals: unknown[];
  recentOrders: unknown[];
}

const iconByTitle: Record<string, ReactNode> = {
  'Организации': <Building2 className="h-6 w-6" />,
  'Клиенты': <Users className="h-6 w-6" />,
  'Товары': <Package className="h-6 w-6" />,
  'Предложения': <FileText className="h-6 w-6" />,
  'Договоры': <ClipboardList className="h-6 w-6" />,
  'Заказы': <ShoppingCart className="h-6 w-6" />,
};

const statusColors: Record<string, string> = {
  draft: '#94a3b8',
  sent: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  converted: '#8b5cf6',
};

const statusNames: Record<string, string> = {
  draft: 'Черновик',
  sent: 'Отправлено',
  accepted: 'Принято',
  rejected: 'Отклонено',
  converted: 'Конвертировано',
};

export default function DashboardPage() {
  // Замена fetch + useState + useEffect на useQuery
  // Использует агрегированный эндпоинт /api/dashboard/aggregated
  // staleTime: 1 минута (часто обновляемые данные)
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', 'aggregated'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/aggregated');
      const json = await res.json();
      if (!json.success || !json.data) throw new Error(json.message || 'Failed to load dashboard');
      return json.data;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  // Преобразование данных для компонентов
  const proposalStats = data?.proposalStats
    ?.filter((s) => s.count > 0)
    .map((s) => ({
      name: statusNames[s.status] || s.status,
      value: s.count,
      color: statusColors[s.status] || '#94a3b8',
    })) ?? [];

  const categoryStats = data?.categoryStats
    ?.filter((c) => c.count > 0)
    .slice(0, 5) ?? [];

  return (
    <Stack gap="xl">
      <H1>Дашборд</H1>

      {isLoading ? (
        <Grid cols="auto-md" gap="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton shape="text-sm" className="w-24 mb-4" />
              <Skeleton shape="text-lg" className="w-16" />
            </Card>
          ))}
        </Grid>
      ) : error ? (
        <Card className="p-6">
          <Muted>Ошибка загрузки данных</Muted>
        </Card>
      ) : (
        <Grid cols="auto-md" gap="md">
          {(data?.overview ?? []).map((stat) => (
            <a key={stat.title} href={stat.href}>
              <Card variant="interactive" className="p-6 h-full">
                <Flex justify="between" className="mb-3">
                  <Muted>{stat.title}</Muted>
                  <span className="text-primary">{iconByTitle[stat.title] || <div />}</span>
                </Flex>
                <Typography variant="h1">{stat.count}</Typography>
              </Card>
            </a>
          ))}
        </Grid>
      )}

      <DashboardCharts proposalStats={proposalStats} categoryStats={categoryStats} />
    </Stack>
  );
}
