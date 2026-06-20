'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Client {
  [key: string]: unknown;
  id: string;
  type: string; // 'individual' | 'legal'
  lastName: string;
  firstName: string;
  patronymic: string | null;
  phone: string;
  email: string | null;
  organization: { name: string } | null;
  address: string | null;
  // Cycle 54: legal-only fields may be null for individuals.
  companyName: string | null;
  legalForm: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  notes: string | null;
}

/**
 * Cycle 54 (B.2): ClientForm с radio Тип клиента + условный набор полей.
 *
 * - legal: компания/юр.адрес/КПП/ОГРН + 10|12 digits INN.
 * - individual (default): ФИО + опциональный 12 digits INN (ИП).
 */
function ClientForm({ item, onClose }: { item: Client | null; onClose: () => void }) {
  // Determine initial type from item.type or default to 'individual'.
  const initialType: 'individual' | 'legal' =
    item?.type === 'legal' ? 'legal' : 'individual';

  // Use key to force remount when item changes (React 19: avoid setState in useEffect).
  const [type, setType] = useState<'individual' | 'legal'>(initialType);
  const [form, setForm] = useState(() => ({
    // individual fields
    lastName: item?.lastName ?? '',
    firstName: item?.firstName ?? '',
    patronymic: item?.patronymic ?? '',
    address: item?.address ?? '',
    // legal fields
    companyName: item?.companyName ?? '',
    legalForm: item?.legalForm ?? '',
    inn: item?.inn ?? '',
    kpp: item?.kpp ?? '',
    ogrn: item?.ogrn ?? '',
    legalAddress: item?.legalAddress ?? '',
    // common
    phone: item?.phone ?? '',
    email: item?.email ?? '',
    notes: item?.notes ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Build payload based on selected type — only relevant fields sent.
      const baseCommon = {
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes,
      };
      const payload = type === 'legal'
        ? {
            type: 'legal',
            ...baseCommon,
            companyName: form.companyName,
            legalForm: form.legalForm,
            inn: form.inn,
            kpp: form.kpp || undefined,
            ogrn: form.ogrn || undefined,
            legalAddress: form.legalAddress,
          }
        : {
            type: 'individual',
            ...baseCommon,
            lastName: form.lastName,
            firstName: form.firstName,
            patronymic: form.patronymic || undefined,
            inn: form.inn || undefined,
            address: form.address || undefined,
          };
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/clients/${item.id}` : '/api/clients';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? 'Ошибка сохранения');
        setSaving(false);
        return;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setSaving(false);
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const inp = (label: string, key: string, type = 'text', required = false) => (
    <div key={key}>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        type={type}
        value={form[key as keyof typeof form] as string}
        onChange={(e) => update(key, e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {item?.id ? 'Редактировать клиента' : 'Новый клиент'}
      </h2>

      {/* Тип клиента: Физлицо / Юрлицо */}
      <div className="flex gap-4 p-3 rounded-lg bg-[var(--muted)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="clientType"
            value="individual"
            checked={type === 'individual'}
            onChange={() => setType('individual')}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Физическое лицо</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="clientType"
            value="legal"
            checked={type === 'legal'}
            onChange={() => setType('legal')}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Юридическое лицо</span>
        </label>
      </div>

      {/* Conditional field sets */}
      {type === 'individual' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inp('Фамилия', 'lastName', 'text', true)}
          {inp('Имя', 'firstName', 'text', true)}
          {inp('Отчество', 'patronymic')}
          {inp('ИНН (12 цифр, ИП/физлицо)', 'inn')}
          <div className="sm:col-span-2">
            {inp('Адрес', 'address')}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inp('Название компании', 'companyName', 'text', true)}
          {inp('Организационно-правовая форма (ООО, ИП, АО, ПАО)', 'legalForm', 'text', true)}
          {inp('ИНН (10 цифр юрлицо / 12 цифр ИП)', 'inn', 'text', true)}
          {inp('КПП (9 цифр, опционально)', 'kpp')}
          {inp('ОГРН (13 цифр юрлицо / 15 цифр ИП, опционально)', 'ogrn')}
          <div className="sm:col-span-2">
            {inp('Юридический адрес', 'legalAddress', 'text', true)}
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {inp('Телефон', 'phone', 'tel', true)}
        {inp('Email', 'email', 'email')}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Примечания</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}

/**
 * Cycle 54: список клиентов визуально различает физлица и юрлица.
 * - legal: companyName + legalForm + ИНН (предпочтительно).
 * - individual: ФИО.
 */
export function ClientsClient({ initialData, initialTotal }: { initialData: Client[]; initialTotal: number }) {
  const renderName = (item: Client) => {
    if (item.type === 'legal') {
      return (
        <div>
          <div className="font-medium">{item.companyName ?? '—'}</div>
          {item.legalForm && (
            <div className="text-xs text-muted-foreground">{item.legalForm}</div>
          )}
        </div>
      );
    }
    return `${item.lastName} ${item.firstName} ${item.patronymic || ''}`.trim();
  };

  return (
    <CrudPage<Client>
      title="Клиенты"
      apiPath="/api/clients"
      searchId="search-klienty"
      initialData={initialData}
      initialTotal={initialTotal}
      columns={[
        {
          key: 'name',
          label: 'Имя / Компания',
          render: renderName,
        },
        { key: 'phone', label: 'Телефон' },
        { key: 'email', label: 'Email' },
        {
          key: 'inn',
          label: 'ИНН',
          render: (item) => item.inn ?? '—',
        },
        {
          key: 'organization',
          label: 'Организация',
          render: (item) => item.organization?.name ?? '—',
        },
      ]}
      renderForm={(item, onClose) => <ClientForm key={item?.id ?? 'new'} item={item} onClose={onClose} />}
    />
  );
}
