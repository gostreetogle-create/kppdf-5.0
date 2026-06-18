'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Client {
  [key: string]: unknown;
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  phone: string;
  email: string;
  organization?: { name: string };
  address: string;
  notes: string;
}

function ClientForm({ item, onClose }: { item: Client | null; onClose: () => void }) {
  const [form, setForm] = useState({
    lastName: item?.lastName ?? '',
    firstName: item?.firstName ?? '',
    patronymic: item?.patronymic ?? '',
    phone: item?.phone ?? '',
    email: item?.email ?? '',
    inn: '',
    address: item?.address ?? '',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/clients/${item.id}` : '/api/clients';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const inp = (label: string, key: string, type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{label}</label>
      <input type={type} value={form[key as keyof typeof form] as string} onChange={(e) => update(key, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{item?.id ? 'Редактировать клиента' : 'Новый клиент'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Фамилия', 'lastName')}
        {inp('Имя', 'firstName')}
        {inp('Отчество', 'patronymic')}
        {inp('Телефон', 'phone', 'tel')}
        {inp('Email', 'email', 'email')}
        {inp('ИНН', 'inn')}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Адрес</label>
          <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Примечания</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" />
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

export function ClientsClient({ initialData, initialTotal }: { initialData: Client[]; initialTotal: number }) {
  return (
    <CrudPage<Client>
      title="Клиенты"
      apiPath="/api/clients"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'lastName', label: 'ФИО', render: (item) => `${item.lastName} ${item.firstName} ${item.patronymic || ''}`.trim() },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        { key: 'organization', label: 'Организация', render: (item) => item.organization?.name ?? '—' },
      ]}
      renderForm={(item, onClose) => <ClientForm item={item} onClose={onClose} />}
    />
  );
}
