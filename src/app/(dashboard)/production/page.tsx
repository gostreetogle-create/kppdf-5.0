'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface ProductionOrder {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  workType?: { name: string };
  plannedStart: string;
  plannedEnd: string;
  workTypeId: string;
  workCenterId: string;
  priority: number;
  notes: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
  planned: { label: 'Запланировано', className: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Завершено', className: 'bg-green-100 text-green-700' },
  active: { label: 'Активно', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function ProductionOrderForm({ item, onClose }: { item: ProductionOrder | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    workTypeId: item?.workTypeId ?? '',
    workCenterId: item?.workCenterId ?? '',
    priority: item?.priority ?? 0,
    plannedStart: item?.plannedStart ? item.plannedStart.slice(0, 16) : '',
    plannedEnd: item?.plannedEnd ? item.plannedEnd.slice(0, 16) : '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/production-orders/${item.id}` : '/api/production-orders';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {item?.id ? 'Редактировать заказ' : 'Новый заказ'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Номер</label>
          <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ID типа работы</label>
          <input type="text" value={form.workTypeId} onChange={(e) => setForm({ ...form, workTypeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ID рабочего центра</label>
          <input type="text" value={form.workCenterId} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Приоритет</label>
          <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">План. начало</label>
          <input type="datetime-local" value={form.plannedStart} onChange={(e) => setForm({ ...form, plannedStart: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">План. окончание</label>
          <input type="datetime-local" value={form.plannedEnd} onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Примечания</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">Отмена</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}

export default function ProductionPage() {
  return (
    <CrudPage<ProductionOrder>
      title="Производственные заказы"
      apiPath="/api/production-orders"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.status} />,
        },
        {
          key: 'workType',
          label: 'Тип работы',
          render: (item) => item.workType?.name ?? '—',
        },
        {
          key: 'plannedStart',
          label: 'План. начало',
          render: (item) => item.plannedStart ? new Date(item.plannedStart).toLocaleDateString('ru-RU') : '—',
        },
        {
          key: 'plannedEnd',
          label: 'План. окончание',
          render: (item) => item.plannedEnd ? new Date(item.plannedEnd).toLocaleDateString('ru-RU') : '—',
        },
      ]}
      renderForm={(item, onClose) => <ProductionOrderForm item={item} onClose={onClose} />}
    />
  );
}
