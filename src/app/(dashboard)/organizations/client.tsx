'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';
import { StatusBadge, IS_ACTIVE_FEMININE } from '@/lib/constants/statuses';

interface Organization {
  [key: string]: unknown;
  id: string;
  name: string;
  shortName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  phone: string;
  email: string;
  legalAddress: string;
  bankName: string;
  bankBik: string;
  bankAccount: string;
  signerName: string;
  signerPosition: string;
  vatRate: number;
  isActive: boolean;
}

function OrganizationForm({ item, onClose }: { item: Organization | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    shortName: item?.shortName ?? '',
    inn: item?.inn ?? '',
    kpp: item?.kpp ?? '',
    ogrn: item?.ogrn ?? '',
    phone: item?.phone ?? '',
    email: item?.email ?? '',
    legalAddress: item?.legalAddress ?? '',
    bankName: item?.bankName ?? '',
    bankBik: item?.bankBik ?? '',
    bankAccount: item?.bankAccount ?? '',
    signerName: item?.signerName ?? '',
    signerPosition: item?.signerPosition ?? '',
    vatRate: item?.vatRate ?? 20,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/organizations/${item.id}` : '/api/organizations';
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
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{item?.id ? 'Редактировать организацию' : 'Новая организация'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Название', 'name')}
        {inp('Краткое название', 'shortName')}
        {inp('ИНН', 'inn')}
        {inp('КПП', 'kpp')}
        {inp('ОГРН', 'ogrn')}
        {inp('Телефон', 'phone', 'tel')}
        {inp('Email', 'email', 'email')}
        {inp('Юридический адрес', 'legalAddress')}
        {inp('Банк', 'bankName')}
        {inp('БИК', 'bankBik')}
        {inp('Расчётный счёт', 'bankAccount')}
        {inp('Подписывающее лицо', 'signerName')}
        {inp('Должность', 'signerPosition')}
        {inp('НДС, %', 'vatRate', 'number')}
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

export function OrganizationsClient({ initialData, initialTotal }: { initialData: Organization[]; initialTotal: number }) {
  return (
    <CrudPage<Organization>
      title="Организации"
      apiPath="/api/organizations"
      searchId="search-organizacii"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        { key: 'name', label: 'Название' },
        { key: 'shortName', label: 'Краткое' },
        { key: 'inn', label: 'ИНН' },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        { key: 'isActive', label: 'Статус', render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} map={IS_ACTIVE_FEMININE} /> },
      ]}
      renderForm={(item, onClose) => <OrganizationForm item={item} onClose={onClose} />}
    />
  );
}
