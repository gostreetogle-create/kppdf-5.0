'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GanttChart, type GanttItem } from '@/components/ui/gantt-chart';
import { BarChart3, RefreshCw, X, Calendar, Clock, User, MapPin, FileText } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  planned: 'Запланировано',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено',
  pending: 'Ожидание',
  active: 'Активно',
  draft: 'Черновик',
};

export default function GanttPage() {
  const router = useRouter();
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GanttItem | null>(null);

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
        actualStart: o.actualStart ? String(o.actualStart) : undefined,
        actualEnd: o.actualEnd ? String(o.actualEnd) : undefined,
        status: String(o.status || 'draft'),
        type: 'order' as const,
        progress: o.status === 'completed' ? 100 : o.status === 'in_progress' ? 50 : 0,
        priority: Number(o.priority || 0),
        workCenter: o.workCenter ? String((o.workCenter as Record<string, unknown>).name || '') : undefined,
        workType: o.workType ? String((o.workType as Record<string, unknown>).name || '') : undefined,
        notes: o.notes ? String(o.notes) : undefined,
      }));

      const tasks: GanttItem[] = (tasksData.data?.items || tasksData.data || []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        title: String(t.title || ''),
        startDate: String(t.plannedStart || t.createdAt || new Date().toISOString()),
        endDate: String(t.plannedEnd || t.createdAt || new Date().toISOString()),
        actualStart: t.actualStart ? String(t.actualStart) : undefined,
        actualEnd: t.actualEnd ? String(t.actualEnd) : undefined,
        status: String(t.status || 'pending'),
        type: 'task' as const,
        group: t.order ? String((t.order as Record<string, unknown>).title || (t.order as Record<string, unknown>).number || '') : undefined,
        assignee: t.worker ? String((t.worker as Record<string, unknown>).firstName || '') + ' ' + String((t.worker as Record<string, unknown>).lastName || '') : undefined,
        progress: t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0,
        priority: Number(t.priority || 0),
        notes: t.notes ? String(t.notes) : undefined,
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
    setSelectedItem(item);
  }, []);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d: string) => {
    try {
      return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
            Диаграмма Гантта
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Планирование производства · загрузка сотрудников · контроль сроков
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50 active:scale-[0.97]"
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

      {/* Detail dialog */}
      {selectedItem && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelectedItem(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[90vw] bg-[var(--card)] border-l border-[var(--border)] shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedItem.type === 'order'
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    {selectedItem.type === 'order' ? 'ЗАКАЗ' : 'ЗАДАЧА'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedItem.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedItem.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    selectedItem.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_LABELS[selectedItem.status] || selectedItem.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <X size={18} className="text-[var(--muted-foreground)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Timeline */}
              <div>
                <h3 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Сроки</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">Плановое начало</div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(selectedItem.startDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">Плановое окончание</div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(selectedItem.endDate)}</div>
                    </div>
                  </div>
                  {selectedItem.actualStart && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Clock size={14} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Фактическое начало</div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-400">{formatDateTime(selectedItem.actualStart)}</div>
                      </div>
                    </div>
                  )}
                  {selectedItem.actualEnd && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Clock size={14} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Фактическое окончание</div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-400">{formatDateTime(selectedItem.actualEnd)}</div>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Длительность: {Math.ceil((new Date(selectedItem.endDate).getTime() - new Date(selectedItem.startDate).getTime()) / 86400000)} дн.
                    </span>
                    {selectedItem.progress !== undefined && (
                      <>
                        <span className="text-[10px] text-[var(--muted-foreground)]">·</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--primary)] transition-all"
                              style={{ width: `${selectedItem.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-[var(--foreground)]">{selectedItem.progress}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-[var(--border)] pt-5">
                <h3 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Детали</h3>
                <div className="space-y-3">
                  {selectedItem.assignee && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <User size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Исполнитель</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{selectedItem.assignee}</div>
                      </div>
                    </div>
                  )}
                  {selectedItem.workCenter && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <MapPin size={14} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Рабочий центр</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{selectedItem.workCenter}</div>
                      </div>
                    </div>
                  )}
                  {selectedItem.workType && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <FileText size={14} className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Тип работы</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{selectedItem.workType}</div>
                      </div>
                    </div>
                  )}
                  {selectedItem.priority !== undefined && selectedItem.priority > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">!</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">Приоритет</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{selectedItem.priority}/5</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="border-t border-[var(--border)] pt-5">
                  <h3 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Примечания</h3>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              {/* Action */}
              <div className="border-t border-[var(--border)] pt-5">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    router.push('/production');
                  }}
                  className="w-full h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.97] shadow-sm"
                >
                  Открыть заказ в таблице
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
