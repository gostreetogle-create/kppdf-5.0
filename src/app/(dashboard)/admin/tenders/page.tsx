'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Tender {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  customerName: string;
  totalAmount: number;
  deadline: string;
  notes: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700' },
  won: { label: 'Выиграно', className: 'bg-green-100 text-green-700' },
  lost: { label: 'Проиграно', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700' },
  overdue: { label: 'Просрочено', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function TenderForm({ item, onClose }: { item: Tender | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    customerName: item?.customerName ?? '',
    totalAmount: item?.totalAmount ?? 0,
    deadline: item?.deadline ? item.deadline.slice(0, 10) : '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/tenders/${item.id}` : '/api/tenders';
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
        {item?.id ? 'Редактировать тендер' : 'Новый тендер'}
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
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Заказчик</label>
          <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Сумма</label>
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} step={0.01} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Дедлайн</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
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

export default function TendersPage() {
  return (
    <CrudPage<Tender>
      title="Тендеры"
      apiPath="/api/tenders"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.status} />,
        },
        { key: 'customerName', label: 'Заказчик' },
        {
          key: 'totalAmount',
          label: 'Сумма',
          render: (item) => `${(item.totalAmount ?? 0).toLocaleString('ru-RU')} ₽`,
        },
      ]}
      renderForm={(item, onClose) => <TenderForm item={item} onClose={onClose} />}
    />
  );
}
