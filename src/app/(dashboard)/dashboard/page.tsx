'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Building2, Users, Package, FileText, ClipboardList, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { H1, Typography, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardCharts from './charts';

interface StatCard {
  title: string;
  count: number;
  icon: ReactNode;
  href: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Организации', count: 0, icon: <Building2 className="h-6 w-6" />, href: '/organizations' },
    { title: 'Клиенты', count: 0, icon: <Users className="h-6 w-6" />, href: '/clients' },
    { title: 'Товары', count: 0, icon: <Package className="h-6 w-6" />, href: '/products' },
    { title: 'Предложения', count: 0, icon: <FileText className="h-6 w-6" />, href: '/proposals' },
    { title: 'Договоры', count: 0, icon: <ClipboardList className="h-6 w-6" />, href: '/contracts' },
    { title: 'Заказы', count: 0, icon: <ShoppingCart className="h-6 w-6" />, href: '/production' },
  ]);
  const [loading, setLoading] = useState(true);
  const [proposalStats, setProposalStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (!data.success || !data.data) return;

        const d = data.data;

        // Обновляем карточки статистики
        if (d.overview) {
          const iconByTitle: Record<string, ReactNode> = {
            'Организации': <Building2 className="h-6 w-6" />,
            'Клиенты': <Users className="h-6 w-6" />,
            'Товары': <Package className="h-6 w-6" />,
            'Предложения': <FileText className="h-6 w-6" />,
            'Договоры': <ClipboardList className="h-6 w-6" />,
            'Заказы': <ShoppingCart className="h-6 w-6" />,
          };
          setStats(d.overview.map((item: { title: string; count: number; href: string }) => ({
            title: item.title,
            count: item.count,
            icon: iconByTitle[item.title] || <div />,
            href: item.href,
          })));
        }

        // Статусы КП
        if (d.proposalStats) {
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
          setProposalStats(
            d.proposalStats
              .filter((s: { count: number }) => s.count > 0)
              .map((s: { status: string; count: number }) => ({
                name: statusNames[s.status] || s.status,
                value: s.count,
                color: statusColors[s.status] || '#94a3b8',
              }))
          );
        }

        // Категории товаров
        if (d.categoryStats) {
          setCategoryStats(
            d.categoryStats
              .filter((c: { count: number }) => c.count > 0)
              .slice(0, 5)
          );
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <Stack gap="xl">
      <H1>Дашборд</H1>

      {loading ? (
        <Grid cols="auto-md" gap="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton shape="text-sm" className="w-24 mb-4" />
              <Skeleton shape="text-lg" className="w-16" />
            </Card>
          ))}
        </Grid>
      ) : (
        <Grid cols="auto-md" gap="md">
          {stats.map((stat) => (
            <a key={stat.title} href={stat.href}>
              <Card variant="interactive" className="p-6 h-full">
                <Flex justify="between" className="mb-3">
                  <Muted>{stat.title}</Muted>
                  <span className="text-primary">{stat.icon}</span>
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
