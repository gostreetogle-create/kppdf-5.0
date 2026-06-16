'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, LayoutList, LayoutGrid, Users, Filter, X } from 'lucide-react';

export interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  actualStart?: string;
  actualEnd?: string;
  status: string;
  type: 'order' | 'task';
  group?: string;
  progress?: number;
  assignee?: string;
  priority?: number;
  workCenter?: string;
  workType?: string;
  notes?: string;
}

interface GanttChartProps {
  items: GanttItem[];
  loading?: boolean;
  onItemClick?: (item: GanttItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  planned: '#a78bfa',
  in_progress: '#facc15',
  completed: '#4ade80',
  cancelled: '#f87171',
  pending: '#94a3b8',
  active: '#60a5fa',
  draft: '#cbd5e1',
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

const PRIORITY_COLORS = ['#94a3b8', '#60a5fa', '#fbbf24', '#f97316', '#ef4444'];
const MS_IN_DAY = 86400000;

type ZoomPreset = 'day' | 'week' | 'month';
const ZOOM_SCALES: Record<ZoomPreset, number> = { day: 1, week: 0.4, month: 0.15 };

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function GanttChart({ items, loading = false, onItemClick }: GanttChartProps) {
  const [zoom, setZoom] = useState<ZoomPreset>('week');
  const scale = ZOOM_SCALES[zoom];
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [workerFilter, setWorkerFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (typeFilter && i.type !== typeFilter) return false;
      if (workerFilter && i.assignee !== workerFilter) return false;
      return true;
    });
  }, [items, statusFilter, typeFilter, workerFilter]);

  const { startDate, endDate, totalDays, dayWidth, today } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayDate = now;

    if (filtered.length === 0) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: start, endDate: end, totalDays: Math.ceil((end.getTime() - start.getTime()) / MS_IN_DAY) + 1, dayWidth: 48 * scale, today: todayDate };
    }

    const dates = filtered.flatMap((item) => [new Date(item.startDate), new Date(item.endDate)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = new Date(min.getFullYear(), min.getMonth(), min.getDate() - 7);
    const end = new Date(max.getFullYear(), max.getMonth(), max.getDate() + 14);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;

    return { startDate: start, endDate: end, totalDays, dayWidth: 48 * scale, today: todayDate };
  }, [filtered, scale]);

  const groups = useMemo(() => {
    const g = new Map<string, GanttItem[]>();
    const standalone: GanttItem[] = [];
    filtered.forEach((item) => {
      if (item.group) {
        const existing = g.get(item.group) || [];
        existing.push(item);
        g.set(item.group, existing);
      } else {
        standalone.push(item);
      }
    });
    return { grouped: g, standalone };
  }, [filtered]);

  // Worker workload summary
  const workload = useMemo(() => {
    const map = new Map<string, { count: number; inProgress: number }>();
    filtered.forEach(i => {
      if (i.assignee) {
        const w = map.get(i.assignee) || { count: 0, inProgress: 0 };
        w.count++;
        if (i.status === 'in_progress') w.inProgress++;
        map.set(i.assignee, w);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [filtered]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set(items.map(i => i.status));
    return Array.from(s);
  }, [items]);

  const uniqueWorkers = useMemo(() => {
    const s = new Set(items.filter(i => i.assignee).map(i => i.assignee!));
    return Array.from(s);
  }, [items]);

  const timelineWidth = totalDays * dayWidth;
  const formatDateFull = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatDateShort = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

  const getBarStyle = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const left = ((start.getTime() - startDate.getTime()) / MS_IN_DAY) * dayWidth;
    const width = Math.max(((end.getTime() - start.getTime()) / MS_IN_DAY) * dayWidth, dayWidth * 0.5);
    return { left: `${left}px`, width: `${width}px` };
  };

  const todayLeft = useMemo(() => {
    if (today < startDate || today > endDate) return null;
    return ((today.getTime() - startDate.getTime()) / MS_IN_DAY) * dayWidth;
  }, [today, startDate, dayWidth]);

  const renderMonthHeaders = () => {
    const headers: { label: string; width: number; start: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / MS_IN_DAY);
      const width = daysInMonth * dayWidth;
      headers.push({
        label: cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        width,
        start: headers.reduce((s, h) => s + h.width, 0),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return headers;
  };

  const renderDayHeaders = () => {
    if (zoom === 'month') return null;
    const headers: { label: string; width: number; isWeekend: boolean }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const d = new Date(cursor);
      headers.push({
        label: zoom === 'day' ? d.getDate().toString() : d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        width: dayWidth,
        isWeekend: isWeekend(d),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return headers;
  };

  const monthHeaders = renderMonthHeaders();
  const dayHeaders = renderDayHeaders();

  const handleScroll = (direction: number) => {
    const container = document.querySelector('.gantt-timeline') as HTMLElement | null;
    if (container) {
      container.scrollBy({ left: direction * dayWidth * (zoom === 'day' ? 3 : zoom === 'week' ? 7 : 30), behavior: 'smooth' });
    }
  };

  const getPriorityColor = (item: GanttItem) => {
    const p = Math.min((item.priority || 0), PRIORITY_COLORS.length - 1);
    return PRIORITY_COLORS[p];
  };

  // Weekend columns (memoized)
  const weekendCols = useMemo(() => {
    if (zoom === 'month') return [];
    const cols: { left: number; width: number }[] = [];
    let inWeekend = false;
    let weekendStart = 0;
    const cursor = new Date(startDate);
    let x = 0;
    while (cursor <= endDate) {
      const d = new Date(cursor);
      if (isWeekend(d) && !inWeekend) {
        inWeekend = true;
        weekendStart = x;
      } else if (!isWeekend(d) && inWeekend) {
        inWeekend = false;
        cols.push({ left: weekendStart, width: x - weekendStart });
      }
      x += dayWidth;
      cursor.setDate(cursor.getDate() + 1);
    }
    if (inWeekend) cols.push({ left: weekendStart, width: x - weekendStart });
    return cols;
  }, [startDate, endDate, dayWidth, zoom]);

  // Scroll to today
  const scrollToToday = useCallback(() => {
    const container = document.querySelector('.gantt-timeline') as HTMLElement | null;
    if (container && todayLeft !== null) {
      container.scrollTo({ left: Math.max(0, todayLeft - 200), behavior: 'smooth' });
    }
  }, [todayLeft]);

  const renderBar = (item: GanttItem, rowH = 36) => {
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const barStyle = getBarStyle(item.startDate, item.endDate);
    const statusColor = STATUS_COLORS[item.status] || '#94a3b8';
    const priorityColor = getPriorityColor(item);
    const progress = item.progress || 0;
    const hasActual = item.actualStart && item.actualEnd;
    const actualDiffers = hasActual && (item.actualStart !== item.startDate || item.actualEnd !== item.endDate);

    return (
      <div key={item.id} className="relative" style={{ height: `${rowH}px` }}>
        {/* Planned bar */}
        <div
          className="absolute top-1/2 -translate-y-[60%] rounded cursor-pointer transition-all hover:brightness-110 hover:shadow-md flex items-center overflow-hidden"
          style={{
            ...barStyle,
            minWidth: '4px',
            height: hasActual ? '14px' : '20px',
            backgroundColor: statusColor,
            borderLeft: `3px solid ${priorityColor}`,
            opacity: hasActual ? 0.7 : 0.9,
          }}
          onClick={() => onItemClick?.(item)}
          title={`${item.title} (план): ${formatDateFull(start)} → ${formatDateFull(end)}`}
        >
          {/* Progress fill */}
          {progress > 0 && (
            <div
              className="absolute inset-0 bg-white/25 rounded-r"
              style={{ width: `${progress}%` }}
            />
          )}
          {barStyle.width && parseFloat(barStyle.width) > 60 && (
            <span className="text-[10px] text-white font-medium px-1.5 truncate w-full relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {item.title} {progress > 0 ? `${progress}%` : ''}
            </span>
          )}
        </div>

        {/* Actual bar (if dates differ from planned) */}
        {actualDiffers && (
          <div
            className="absolute top-1/2 translate-y-[10%] rounded border-2 cursor-pointer transition-all hover:brightness-110"
            style={{
              ...getBarStyle(item.actualStart!, item.actualEnd!),
              minWidth: '4px',
              height: '14px',
              borderColor: statusColor,
              backgroundColor: 'transparent',
            }}
            title={`${item.title} (факт): ${formatDateFull(new Date(item.actualStart!))} → ${formatDateFull(new Date(item.actualEnd!))}`}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const hasFilters = statusFilter || typeFilter || workerFilter;

  return (
    <div className="flex gap-4">
      {/* Main chart */}
      <div className="flex-1 min-w-0 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => handleScroll(-1)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
            <button onClick={scrollToToday} className="h-7 px-2.5 rounded-md text-[10px] font-semibold border border-[var(--border)] hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]">
              Сегодня
            </button>
            <button onClick={() => handleScroll(1)} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
            <span className="text-xs text-[var(--muted-foreground)] ml-2 hidden sm:inline">
              {formatDateFull(startDate)} — {formatDateFull(endDate)}
            </span>
          </div>

          {/* Zoom presets */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--muted)]">
            {(['day', 'week', 'month'] as ZoomPreset[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`flex items-center gap-1 h-7 px-2.5 rounded-md text-[10px] font-semibold transition-all ${
                  zoom === z
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {z === 'day' ? <LayoutList size={12} /> : z === 'week' ? <LayoutGrid size={12} /> : <Calendar size={12} />}
                {z === 'day' ? 'День' : z === 'week' ? 'Нед.' : 'Мес.'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/10 flex-wrap">
          <Filter size={12} className="text-[var(--muted-foreground)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="">Все статусы</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="">Заказы + задачи</option>
            <option value="order">Только заказы</option>
            <option value="task">Только задачи</option>
          </select>
          {uniqueWorkers.length > 0 && (
            <select
              value={workerFilter}
              onChange={e => setWorkerFilter(e.target.value)}
              className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="">Все сотрудники</option>
              {uniqueWorkers.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          )}
          {hasFilters && (
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setWorkerFilter(''); }}
              className="h-7 px-2 rounded-md text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-1"
            >
              <X size={10} /> Сброс
            </button>
          )}
          <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
            {filtered.length} из {items.length}
          </span>
        </div>

        {/* Today indicator */}
        {todayLeft !== null && todayLeft >= 0 && (
          <div className="px-4 py-1 border-b border-[var(--border)] bg-red-50/30 dark:bg-red-950/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                Сегодня — {today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
            <p className="text-sm font-medium">{items.length === 0 ? 'Нет задач для отображения' : 'Нет результатов по фильтрам'}</p>
            <p className="text-xs mt-1">{items.length === 0 ? 'Создайте производственные заказы, чтобы увидеть их на диаграмме' : 'Измените фильтры'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
            <div className="flex" style={{ minWidth: `${Math.max(timelineWidth + 280, 800)}px` }}>
              {/* Left: item names */}
              <div className="flex-shrink-0 border-r border-[var(--border)]" style={{ width: '260px' }}>
                <div className="h-10 border-b border-[var(--border)] px-4 flex items-center bg-[var(--muted)]/20">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Название</span>
                </div>
                {/* Day header spacer — matches timeline day/week header row */}
                {dayHeaders && (
                  <div className="h-7 border-b border-[var(--border)] bg-[var(--muted)]/10" />
                )}
                {Array.from(groups.grouped.entries()).map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    <div className="h-8 px-4 flex items-center bg-[var(--muted)]/30 border-b border-[var(--border)]">
                      <span className="text-[11px] font-semibold text-[var(--foreground)] truncate">{groupName}</span>
                      <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">{groupItems.length}</span>
                    </div>
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onItemClick?.(item)}
                        className="h-9 px-4 flex items-center border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-colors gap-2"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityColor(item) }} />
                        <span className="text-xs truncate text-[var(--foreground)]">{item.title}</span>
                        {item.assignee && (
                          <span className="ml-auto text-[10px] text-[var(--muted-foreground)] flex-shrink-0">{item.assignee.split(' ')[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {groups.standalone.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className="h-9 px-4 flex items-center border-b border-[var(--border)] hover:bg-[var(--muted)]/20 cursor-pointer transition-colors gap-2"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPriorityColor(item) }} />
                    <span className="text-xs truncate text-[var(--foreground)]">{item.title}</span>
                    {item.assignee && (
                      <span className="ml-auto text-[10px] text-[var(--muted-foreground)] flex-shrink-0">{item.assignee.split(' ')[0]}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: timeline */}
              <div className="flex-1 overflow-hidden gantt-timeline relative">
                {/* Month headers */}
                <div className="flex h-10 border-b border-[var(--border)] bg-[var(--muted)]/20">
                  {monthHeaders.map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 border-r border-[var(--border)] px-2 flex items-center"
                      style={{ width: `${h.width}px` }}
                    >
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)]">{h.label}</span>
                    </div>
                  ))}
                </div>

                {/* Day/week headers */}
                {dayHeaders && (
                  <div className="flex h-7 border-b border-[var(--border)]">
                    {dayHeaders.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-shrink-0 border-r border-[var(--border)]/30 px-1 flex items-center ${
                          h.isWeekend ? 'bg-[var(--muted)]/30' : ''
                        }`}
                        style={{ width: `${h.width}px` }}
                      >
                        <span className={`text-[11px] font-medium ${h.isWeekend ? 'text-[var(--muted-foreground)]/50' : 'text-[var(--muted-foreground)]'}`}>
                          {h.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline rows */}
                <div className="relative">
                  {/* Weekend columns */}
                  {weekendCols.map((c, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 bg-[var(--muted)]/20 pointer-events-none"
                      style={{ left: `${c.left}px`, width: `${c.width}px` }}
                    />
                  ))}

                  {/* Today vertical line */}
                  {todayLeft !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                      style={{ left: `${todayLeft}px` }}
                    />
                  )}

                  {/* Grouped items */}
                  {Array.from(groups.grouped.entries()).map(([groupName, groupItems]) => (
                    <div key={groupName}>
                      <div className="h-8 border-b border-[var(--border)] bg-[var(--muted)]/10" />
                      {groupItems.map((item) => renderBar(item))}
                    </div>
                  ))}
                  {/* Standalone items */}
                  {groups.standalone.map((item) => renderBar(item))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer stats */}
        <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-4">
          <span>Элементов: {filtered.length}</span>
          <span>·</span>
          <span>Диапазон: {totalDays} дн.</span>
          <span>·</span>
          <span>Масштаб: {zoom === 'day' ? 'День' : zoom === 'week' ? 'Неделя' : 'Месяц'}</span>
          {hasFilters && <span className="ml-auto text-[var(--primary)]">Фильтры активны</span>}
        </div>
      </div>

      {/* Workload panel */}
      {workload.length > 0 && (
        <div className="w-48 flex-shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hidden lg:block">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <Users size={14} className="text-[var(--muted-foreground)]" />
            <span className="text-xs font-semibold text-[var(--foreground)]">Загрузка</span>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
            {workload.map(([name, w]) => (
              <div key={name} className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-[var(--foreground)] truncate">{name.split(' ')[0]}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{w.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${Math.min(100, w.count * 20)}%` }}
                  />
                </div>
                {w.inProgress > 0 && (
                  <div className="text-[9px] text-[var(--muted-foreground)] mt-1">
                    {w.inProgress} в работе
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
