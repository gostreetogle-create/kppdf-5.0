'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Contract {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  client?: { lastName: string; firstName: string };
  totalAmount: number;
  signedAt: string;
  clientId: string;
  organizationId: string;
  notes: string;
}

interface SelectItem {
  id: string;
  name: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Принято', className: 'bg-green-100 text-green-700' },
  active: { label: 'Активно', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонено', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Завершено', className: 'bg-green-100 text-green-700' },
  won: { label: 'Выиграно', className: 'bg-green-100 text-green-700' },
  lost: { label: 'Проиграно', className: 'bg-red-100 text-red-700' },
  planned: { label: 'Запланировано', className: 'bg-purple-100 text-purple-700' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function ContractForm({ item, onClose }: { item: Contract | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    clientId: item?.clientId ?? '',
    organizationId: item?.organizationId ?? '',
    totalAmount: item?.totalAmount ?? 0,
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<SelectItem[]>([]);
  const [organizations, setOrganizations] = useState<SelectItem[]>([]);

  useEffect(() => {
    fetch('/api/clients?limit=100').then(r => r.json()).then(d => {
      if (d.success) setClients(d.data.items.map((c: SelectItem) => ({ id: c.id, name: `${c.name || ''}`.trim() || c.id })));
    }).catch(() => {});
    fetch('/api/organizations?limit=100').then(r => r.json()).then(d => {
      if (d.success) setOrganizations(d.data.items.map((o: SelectItem) => ({ id: o.id, name: o.name || o.id })));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/contracts/${item.id}` : '/api/contracts';
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
        {item?.id ? 'Редактировать договор' : 'Новый договор'}
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
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Клиент</label>
          <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
            <option value="">— Не выбран —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Организация</label>
          <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none">
            <option value="">— Не выбрана —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Сумма</label>
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} step={0.01} />
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

export default function ContractsPage() {
  return (
    <CrudPage<Contract>
      title="Договоры"
      apiPath="/api/contracts"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',
          render: (item) => <StatusBadge status={item.status} />,
        },
        {
          key: 'client',
          label: 'Клиент',
          render: (item) => item.client ? `${item.client.lastName} ${item.client.firstName}` : '—',
        },
        {
          key: 'totalAmount',
          label: 'Сумма',
          render: (item) => `${(item.totalAmount ?? 0).toLocaleString('ru-RU')} ₽`,
        },
        {
          key: 'signedAt',
          label: 'Дата подписания',
          render: (item) => item.signedAt ? new Date(item.signedAt).toLocaleDateString('ru-RU') : '—',
        },
      ]}
      renderForm={(item, onClose) => <ContractForm item={item} onClose={onClose} />}
    />
  );
}
