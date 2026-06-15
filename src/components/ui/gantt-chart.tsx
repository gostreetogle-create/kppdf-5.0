'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  type: 'order' | 'task';
  group?: string;
  progress?: number;
  assignee?: string;
}

interface GanttChartProps {
  items: GanttItem[];
  loading?: boolean;
  onItemClick?: (item: GanttItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-purple-400',
  in_progress: 'bg-yellow-400',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
  pending: 'bg-gray-400',
  active: 'bg-blue-400',
  draft: 'bg-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Запланировано',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено',
  pending: 'Ожидание',
  active: 'Активно',
  draft: 'Черновик',
};

const MS_IN_DAY = 86400000;

export function GanttChart({ items, loading = false, onItemClick }: GanttChartProps) {
  const [scale, setScale] = useState(1); // 1 = day view, 0.5 = week view

  const { startDate, endDate, totalDays, dayWidth } = useMemo(() => {
    if (items.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: start, endDate: end, totalDays: Math.ceil((end.getTime() - start.getTime()) / MS_IN_DAY) + 1, dayWidth: 40 * scale };
    }

    const dates = items.flatMap((item) => [new Date(item.startDate), new Date(item.endDate)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = new Date(min.getFullYear(), min.getMonth(), min.getDate() - 7);
    const end = new Date(max.getFullYear(), max.getMonth(), max.getDate() + 14);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;

    return { startDate: start, endDate: end, totalDays, dayWidth: 40 * scale };
  }, [items, scale]);

  const groups = useMemo(() => {
    const g = new Map<string, GanttItem[]>();
    const standalone: GanttItem[] = [];
    items.forEach((item) => {
      if (item.group) {
        const existing = g.get(item.group) || [];
        existing.push(item);
        g.set(item.group, existing);
      } else {
        standalone.push(item);
      }
    });
    return { grouped: g, standalone };
  }, [items]);

  const timelineWidth = totalDays * dayWidth;

  const formatDateFull = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

  const getBarStyle = (start: Date, end: Date) => {
    const left = ((start.getTime() - startDate.getTime()) / MS_IN_DAY) * dayWidth;
    const width = Math.max(((end.getTime() - start.getTime()) / MS_IN_DAY) * dayWidth, dayWidth * 0.5);
    return { left: `${left}px`, width: `${width}px` };
  };

  const renderHeader = () => {
    const headers: { label: string; width: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / MS_IN_DAY);
      const width = daysInMonth * dayWidth;
      headers.push({
        label: cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        width,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return headers;
  };

  const headers = renderHeader();

  const handleScroll = (direction: number) => {
    const container = document.querySelector('.gantt-timeline') as HTMLElement | null;
    if (container) {
      container.scrollBy({ left: direction * dayWidth * 7, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button onClick={() => handleScroll(-1)} className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors">
            <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
          <button onClick={() => handleScroll(1)} className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors">
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
          <span className="text-xs text-[var(--muted-foreground)] ml-2">
            {formatDateFull(startDate)} — {formatDateFull(endDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale((s) => Math.max(0.3, s - 0.2))} className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors">
            <ZoomOut className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
          <span className="text-xs text-[var(--muted-foreground)] w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))} className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors">
            <ZoomIn className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/20">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-[var(--muted-foreground)]">{STATUS_LABELS[status] || status}</span>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
          <p className="text-sm font-medium">Нет задач для отображения</p>
          <p className="text-xs mt-1">Создайте производственные заказы, чтобы увидеть их на диаграмме</p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
          <div className="flex" style={{ minWidth: `${timelineWidth + 300}px` }}>
            {/* Left column: item names */}
            <div className="flex-shrink-0 border-r border-[var(--border)]" style={{ width: '280px' }}>
              {/* Header placeholder */}
              <div className="h-10 border-b border-[var(--border)] px-4 flex items-center">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Название</span>
              </div>
              {/* Items */}
              {Array.from(groups.grouped.entries()).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  <div className="h-8 px-4 flex items-center bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{groupName}</span>
                  </div>
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onItemClick?.(item)}
                      className="h-9 px-4 flex items-center border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-colors"
                    >
                      <span className="text-xs truncate text-[var(--foreground)]">{item.title}</span>
                      {item.assignee && (
                        <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">{item.assignee}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {groups.standalone.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className="h-9 px-4 flex items-center border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-colors"
                >
                  <span className="text-xs truncate text-[var(--foreground)]">{item.title}</span>
                  {item.assignee && (
                    <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">{item.assignee}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Right: timeline */}
            <div className="flex-1 overflow-hidden gantt-timeline">
              {/* Month headers */}
              <div className="flex h-10 border-b border-[var(--border)]">
                {headers.map((h, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-[var(--border)] px-2 flex items-center"
                    style={{ width: `${h.width}px` }}
                  >
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Timeline rows */}
              <div className="relative">
                {Array.from(groups.grouped.entries()).map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    {/* Group row (empty spacer) */}
                    <div className="h-8 border-b border-[var(--border)]" />
                    {groupItems.map((item) => {
                      const start = new Date(item.startDate);
                      const end = new Date(item.endDate);
                      const barStyle = getBarStyle(start, end);
                      const color = STATUS_COLORS[item.status] || 'bg-gray-400';

                      return (
                        <div key={item.id} className="relative h-9 border-b border-[var(--border)]">
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${color} opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex items-center`}
                            style={{ ...barStyle, minWidth: '20px' }}
                            onClick={() => onItemClick?.(item)}
                            title={`${item.title}: ${formatDateFull(start)} → ${formatDateFull(end)}`}
                          >
                            {barStyle.width && parseFloat(barStyle.width) > 60 && (
                              <span className="text-[10px] text-white font-medium px-1.5 truncate w-full">
                                {item.title}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {groups.standalone.map((item) => {
                  const start = new Date(item.startDate);
                  const end = new Date(item.endDate);
                  const barStyle = getBarStyle(start, end);
                  const color = STATUS_COLORS[item.status] || 'bg-gray-400';

                  return (
                    <div key={item.id} className="relative h-9 border-b border-[var(--border)]">
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${color} opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex items-center`}
                        style={{ ...barStyle, minWidth: '20px' }}
                        onClick={() => onItemClick?.(item)}
                        title={`${item.title}: ${formatDateFull(start)} → ${formatDateFull(end)}`}
                      >
                        {barStyle.width && parseFloat(barStyle.width) > 60 && (
                          <span className="text-[10px] text-white font-medium px-1.5 truncate w-full">
                            {item.title}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
        Всего: {items.length} элементов · {totalDays} дней · Масштаб: {scale >= 1 ? 'день' : scale >= 0.5 ? 'неделя' : 'месяц'}
      </div>
    </div>
  );
}
