'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';
import { FormField, FormSelect, FormTextarea, Button } from '@/components/ui';
import { CONTRACT_STATUS, StatusBadge } from '@/lib/constants/statuses';

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
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/clients?limit=100').then(r => r.json()).then(d => {
      if (d.success) setClients(d.data.items.map((c: any) => ({ id: c.id, name: `${c.name || ''}`.trim() || c.id })));
    }).catch(() => {});
    fetch('/api/organizations?limit=100').then(r => r.json()).then(d => {
      if (d.success) setOrganizations(d.data.items.map((o: any) => ({ id: o.id, name: o.name || o.id })));
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
        <FormField label="Номер" name="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required readOnly={!!item} placeholder={item ? undefined : 'Д-XXXX (авто)'} />
        <FormField label="Название" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <FormSelect
          label="Клиент"
          name="clientId"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          options={[{ value: '', label: '— Не выбран —' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <FormSelect
          label="Организация"
          name="organizationId"
          value={form.organizationId}
          onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
          options={[{ value: '', label: '— Не выбрана —' }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]}
        />
        <FormField label="Сумма" name="totalAmount" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} min={0} step={0.01} />
        <div className="sm:col-span-2">
          <FormTextarea label="Примечания" name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
        <Button type="submit" loading={saving}>{saving ? 'Сохранение...' : 'Сохранит'}</Button>
      </div>
    </form>
  );
}

export function ContractsClient({ initialData, initialTotal }: { initialData: Contract[]; initialTotal: number }) {
  return (
    <CrudPage<Contract>
      title="Договоры"
      apiPath="/api/contracts"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        {
          key: 'status',
          label: 'Статус',            render: (item) => <StatusBadge status={item.status} map={CONTRACT_STATUS} />,
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
