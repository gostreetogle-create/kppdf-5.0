'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, User, Clock, CheckCircle, Play, Pause, RefreshCw, AlertTriangle, Building2, Wrench } from 'lucide-react';

interface WorkerInfo {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface TaskInfo {
  id: string;
  title: string;
  description?: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  sortOrder: number;
  plannedStart?: string;
  plannedEnd?: string;
  order?: { id: string; number: string; title: string; status: string };
  workType?: { id: string; name: string };
  workCenter?: { id: string; name: string };
}

interface MyTasksData {
  worker: WorkerInfo | null;
  tasks: TaskInfo[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Ожидание', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
  in_progress: { label: 'В работе', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Play },
  completed: { label: 'Завершено', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  blocked: { label: 'Заблокировано', color: 'bg-red-100 text-red-700 border-red-300', icon: Pause },
};

export default function MyTasksPage() {
  const [data, setData] = useState<MyTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const load = async (workerId?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = workerId ? `?workerId=${workerId}` : '';
      const res = await fetch(`/api/my-tasks${params}`);
      const json = await res.json();
      if (json.success) {
        // Сортируем по приоритету статуса: in_progress → pending → blocked → completed
        const statusPriority: Record<string, number> = { in_progress: 1, pending: 2, blocked: 3, completed: 4 };
        const sorted = {
          ...json.data,
          tasks: [...(json.data.tasks || [])].sort((a: TaskInfo, b: TaskInfo) => {
            const pa = statusPriority[a.status] || 5;
            const pb = statusPriority[b.status] || 5;
            return pa - pb || a.sortOrder - b.sortOrder;
          }),
        };
        setData(sorted);
        if (json.data?.worker && !workerId) {
          setSelectedWorkerId(json.data.worker.id);
        }
      } else {
        setError(json.message || 'Ошибка загрузки');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем список работников для селектора
    fetch('/api/workers?limit=200')
      .then(r => r.json())
      .then(d => { if (d.success) setWorkers(d.data.items); })
      .catch(() => {});

    load();
  }, []);

  const handleWorkerChange = (id: string) => {
    setSelectedWorkerId(id);
    load(id);
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    setStatusUpdating(taskId);
    const prevStatus = data?.tasks.find(t => t.id === taskId)?.status;
    // Optimistic update
    setData(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
    } : null);
    try {
      const res = await fetch(`/api/order-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        // Revert on error
        setData(prev => prev ? {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId && prevStatus ? { ...t, status: prevStatus } : t),
        } : null);
        alert(json.message || 'Ошибка обновления');
      }
    } catch {
      // Revert on error
      setData(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId && prevStatus ? { ...t, status: prevStatus } : t),
      } : null);
    } finally {
      setStatusUpdating(null);
    }
  };

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
      blocked: 'in_progress',
    };
    return flow[current] || null;
  };

  const getNextLabel = (current: string): string => {
    const labels: Record<string, string> = {
      pending: 'Начать',
      in_progress: 'Завершить',
      completed: 'Вернуть',
      blocked: 'Возобновить',
    };
    return labels[current] || '';
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[var(--primary)]" />
            Мои задачи
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Панель работника — просмотр и отметка выполнения задач
          </p>
        </div>
        <button onClick={() => load(selectedWorkerId)} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-all disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Worker selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
          <User className="h-4 w-4 text-[var(--muted-foreground)]" />
          Работник:
        </label>
        <select
          value={selectedWorkerId}
          onChange={e => handleWorkerChange(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none min-w-[200px]"
        >
          <option value="">— Выбрать —</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
          ))}
        </select>
        {data?.worker && (
          <span className="text-sm text-[var(--muted-foreground)]">
            ({data.worker.firstName} {data.worker.lastName})
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Task list */}
      {data && data.tasks.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
          <CheckCircle className="h-12 w-12 mb-3 text-green-500" />
          <p className="text-lg font-medium">
            {data.worker ? 'Нет задач' : 'Выберите работника'}
          </p>
          <p className="text-sm mt-1">
            {data.worker ? 'Все задачи выполнены или ещё не назначены' : 'Выберите работника из списка выше'}
          </p>
        </div>
      )}

      {data && data.tasks.length > 0 && (
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-[var(--muted)]/50 text-[var(--foreground)]">
              Всего: <strong>{data.tasks.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400">
              В работе: <strong>{data.tasks.filter(t => t.status === 'in_progress').length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
              Завершено: <strong>{data.tasks.filter(t => t.status === 'completed').length}</strong>
            </span>
          </div>

          {data.tasks.map(task => {
            const stat = STATUS_MAP[task.status] || STATUS_MAP.pending;
            const StatIcon = stat.icon;
            const nextStatus = getNextStatus(task.status);
            const nextLabel = getNextLabel(task.status);

            return (
              <div
                key={task.id}
                className={`bg-[var(--card)] border rounded-xl p-4 transition-all ${
                  task.status === 'completed'
                    ? 'border-green-200 dark:border-green-800 opacity-75'
                    : 'border-[var(--border)] hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stat.color}`}>
                        <StatIcon className="h-3 w-3" />
                        {stat.label}
                      </span>
                      {task.order && (
                        <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.order.number}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--muted-foreground)]">
                      {task.workType && (
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {task.workType.name}
                        </span>
                      )}
                      {task.workCenter && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.workCenter.name}
                        </span>
                      )}
                      {task.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedHours}ч
                        </span>
                      )}
                      {task.plannedStart && task.plannedEnd && (
                        <span>
                          {formatDate(task.plannedStart)} — {formatDate(task.plannedEnd)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(task.id, nextStatus)}
                        disabled={statusUpdating === task.id}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50 ${
                          nextStatus === 'in_progress'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : nextStatus === 'completed'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                      >
                        {statusUpdating === task.id ? '...' : nextLabel}
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(task.id, 'blocked')}
                        disabled={statusUpdating === task.id}
                        className="px-3 py-1 rounded-lg text-[10px] font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        Заблокировать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
