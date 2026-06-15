'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface CrudPageProps<T> {
  title: string;
  apiPath: string;
  columns: Column<T>[];
  createHref?: string;
  detailHref?: (item: T) => string;
  renderForm?: (item: T | null, onClose: () => void) => ReactNode;
  extraActions?: (item: T) => ReactNode;
}

export function CrudPage<T extends Record<string, unknown>>({
  title,
  apiPath,
  columns,
  createHref,
  detailHref,
  renderForm,
  extraActions,
}: CrudPageProps<T>) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        });
        if (search) params.set('search', search);
        const res = await fetch(`${apiPath}?${params}`);
        const data = await res.json();
        if (!cancelled && data.success && data.data) {
          setItems(data.data.items || []);
          setTotal(data.data.total || 0);
          setTotalPages(data.data.totalPages || 0);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiPath, page, limit, search, sortField, sortOrder, trigger]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        setTrigger((t) => t + 1);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTrigger((t) => t + 1)}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            title="Обновить"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {createHref && (
            <button
              onClick={() => router.push(createHref)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Создать
            </button>
          )}
          {renderForm && !createHref && (
            <button
              onClick={() => { setEditItem(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Создать
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)] transition-colors',
                      col.className,
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        <span className="text-[var(--primary)]">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                      Загрузка...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                    Ничего не найдено
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={(item.id as string) || idx} className="hover:bg-[var(--muted)]/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3', col.className)}>
                        {col.render
                          ? col.render(item)
                          : String(item[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {extraActions?.(item)}
                        {detailHref && (
                          <button
                            onClick={() => router.push(detailHref(item))}
                            className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors"
                            title="Просмотр"
                          >
                            <Eye className="h-4 w-4 text-[var(--muted-foreground)]" />
                          </button>
                        )}
                        {renderForm && (
                          <button
                            onClick={() => { setEditItem(item); setShowForm(true); }}
                            className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(item.id as string)}
                          className="p-1.5 rounded hover:bg-[var(--destructive)]/10 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">
              {total} записей, стр. {page} из {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-[var(--muted)] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-3 py-1 rounded text-sm transition-colors',
                      p === page
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'hover:bg-[var(--muted)]',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-[var(--muted)] disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Form Dialog */}
      {showForm && renderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="p-6">
              {renderForm(editItem, () => { setShowForm(false); setEditItem(null); setTrigger((t) => t + 1); })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Удалить запись?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-[var(--destructive)] text-white text-sm hover:opacity-90 transition-opacity"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
