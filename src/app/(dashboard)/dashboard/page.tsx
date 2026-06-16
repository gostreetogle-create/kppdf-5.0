'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Building2, Users, Package, FileText, ClipboardList, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { H1, Typography, Muted } from '@/components/ui/typography';
import { Grid, Flex, Stack } from '@/components/ui/layout';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCard {
  title: string;
  count: number;
  icon: ReactNode;
  href: string;
}

interface ProposalByStatus {
  name: string;
  value: number;
  color: string;
}

interface ProductByCategory {
  name: string;
  count: number;
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

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
  const [proposalStats, setProposalStats] = useState<ProposalByStatus[]>([]);
  const [categoryStats, setCategoryStats] = useState<ProductByCategory[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const endpoints = [
          { api: '/api/organizations', idx: 0 },
          { api: '/api/clients', idx: 1 },
          { api: '/api/products', idx: 2 },
          { api: '/api/proposals', idx: 3 },
          { api: '/api/contracts', idx: 4 },
          { api: '/api/production-orders', idx: 5 },
        ];
        const results = await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await fetch(`${ep.api}?limit=1`);
              const data = await res.json();
              return { idx: ep.idx, total: data?.data?.total ?? 0 };
            } catch {
              return { idx: ep.idx, total: 0 };
            }
          }),
        );
        setStats((prev) =>
          prev.map((s, i) => {
            const r = results.find((x) => x.idx === i);
            return r ? { ...s, count: r.total } : s;
          }),
        );

        const [proposalsRes, productsRes] = await Promise.all([
          fetch('/api/proposals?limit=200').then(r => r.json()).catch(() => ({ data: { items: [] } })),
          fetch('/api/products?limit=200').then(r => r.json()).catch(() => ({ data: { items: [] } })),
        ]);

        const proposals = proposalsRes.data?.items || [];
        const statusCounts: Record<string, number> = {};
        proposals.forEach((p: { status: string }) => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        setProposalStats([
          { name: 'Черновик', value: statusCounts.draft || 0, color: '#94a3b8' },
          { name: 'Отправлено', value: statusCounts.sent || 0, color: '#3b82f6' },
          { name: 'Принято', value: statusCounts.accepted || 0, color: '#22c55e' },
          { name: 'Отклонено', value: statusCounts.rejected || 0, color: '#ef4444' },
          { name: 'Конвертировано', value: statusCounts.converted || 0, color: '#8b5cf6' },
        ].filter(s => s.value > 0));

        const products = productsRes.data?.items || [];
        const catCounts: Record<string, number> = {};
        products.forEach((p: { category: { name: string } | null }) => {
          const cat = p.category?.name || 'Без категории';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        setCategoryStats(
          Object.entries(catCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
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

      <Grid cols="auto-sm" gap="lg">
        <Card className="p-6">
          <Typography variant="h4" className="mb-4">КП по статусам</Typography>
          {proposalStats.length === 0 ? (
            <Muted className="text-center py-8">Нет данных</Muted>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={proposalStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {proposalStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <Typography variant="h4" className="mb-4">Товары по категориям</Typography>
          {categoryStats.length === 0 ? (
            <Muted className="text-center py-8">Нет данных</Muted>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Grid>
    </Stack>
  );
}
