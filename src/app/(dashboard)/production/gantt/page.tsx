'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GanttChart, type GanttItem } from '@/components/ui/gantt-chart';
import { BarChart3, RefreshCw } from 'lucide-react';

export default function GanttPage() {
  const router = useRouter();
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, tasksRes] = await Promise.all([
        fetch('/api/production-orders?limit=100'),
        fetch('/api/order-tasks?limit=200'),
      ]);

      const ordersData = await ordersRes.json();
      const tasksData = await tasksRes.json();

      const orders: GanttItem[] = (ordersData.data?.items || ordersData.data || []).map((o: Record<string, unknown>) => ({
        id: String(o.id),
        title: String(o.title || o.number || ''),
        startDate: String(o.plannedStart || o.createdAt || new Date().toISOString()),
        endDate: String(o.plannedEnd || o.createdAt || new Date().toISOString()),
        status: String(o.status || 'draft'),
        type: 'order' as const,
        progress: o.status === 'completed' ? 100 : o.status === 'in_progress' ? 50 : 0,
      }));

      const tasks: GanttItem[] = (tasksData.data?.items || tasksData.data || []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        title: String(t.title || ''),
        startDate: String(t.plannedStart || t.createdAt || new Date().toISOString()),
        endDate: String(t.plannedEnd || t.createdAt || new Date().toISOString()),
        status: String(t.status || 'pending'),
        type: 'task' as const,
        group: t.order ? String((t.order as Record<string, unknown>).title || (t.order as Record<string, unknown>).number || '') : undefined,
        assignee: t.worker ? String((t.worker as Record<string, unknown>).firstName || '') + ' ' + String((t.worker as Record<string, unknown>).lastName || '') : undefined,
        progress: t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0,
      }));

      setItems([...orders, ...tasks]);
    } catch (err) {
      console.error('Failed to load gantt data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleItemClick = useCallback((item: GanttItem) => {
    if (item.type === 'order') {
      router.push('/production');
    } else {
      router.push('/production');
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
            Диаграмма Гантта
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Визуализация производственных заказов и задач на временной шкале
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <GanttChart
        items={items}
        loading={loading}
        onItemClick={handleItemClick}
      />

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Условные обозначения</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-400" />
            <span>Запланировано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span>В работе</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-400" />
            <span>Завершено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span>Отменено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span>Ожидание / Черновик</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400" />
            <span>Активно</span>
          </div>
        </div>
      </div>
    </div>
  );
}
