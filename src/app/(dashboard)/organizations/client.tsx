'use client';

import { useState, useEffect, useCallback } from 'react';
import { CrudPage } from '@/components/crud-page';
import { StatusBadge, IS_ACTIVE_FEMININE } from '@/lib/constants/statuses';

interface OrgRole {
  id: string;
  name: string;
  slug: string;
}

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
  roles?: OrgRole[];
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
  const [loadingDaData, setLoadingDaData] = useState(false);
  const [daDataError, setDaDataError] = useState('');
  const [roleList, setRoleList] = useState<OrgRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    (item?.roles as OrgRole[] | undefined)?.map((r) => r.id) ?? [],
  );

  useEffect(() => {
    fetch('/api/org-roles').then(r => r.json()).then(d => {
      if (d.success) setRoleList(d.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/organizations/${item.id}` : '/api/organizations';
      const payload = { ...form, roleIds: selectedRoles };
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const fillByInn = useCallback(async () => {
    const inn = form.inn.trim();
    if (!inn || !/^\d{10,12}$/.test(inn)) {
      setDaDataError('Введите корректный ИНН (10 или 12 цифр)');
      return;
    }
    setLoadingDaData(true);
    setDaDataError('');
    try {
      const res = await fetch('/api/dadata/find-by-inn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn }),
      });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({
          ...f,
          name: data.data.name || f.name,
          shortName: data.data.shortName || f.shortName,
          inn: data.data.inn || f.inn,
          kpp: data.data.kpp || f.kpp,
          ogrn: data.data.ogrn || f.ogrn,
          legalAddress: data.data.legalAddress || f.legalAddress,
          signerName: data.data.signerName || f.signerName,
          signerPosition: data.data.signerPosition || f.signerPosition,
        }));
      } else {
        setDaDataError(data.message || 'Ошибка при запросе к DaData');
      }
    } catch {
      setDaDataError('Ошибка сети при запросе к DaData');
    } finally {
      setLoadingDaData(false);
    }
  }, [form.inn]);

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
        {/* ИНН с кнопкой DaData */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">ИНН</label>
          <div className="flex gap-2">
            <input type="text" value={form.inn} onChange={(e) => { update('inn', e.target.value); setDaDataError(''); }}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <button type="button" onClick={fillByInn} disabled={loadingDaData}
              className="shrink-0 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">
              {loadingDaData ? '...' : 'Заполнить по ИНН'}
            </button>
          </div>
          {daDataError && <p className="mt-1 text-xs text-[var(--destructive)]">{daDataError}</p>}
        </div>
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

      {/* Роли организации */}
      <div className="border-t border-[var(--border)] pt-4">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Роли организации
          <span className="ml-1 text-xs text-[var(--muted-foreground)]" title="Определяет, как организация используется в системе: поставщик материалов, клиент для КП, подрядчик для производства">ⓘ</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {roleList.map((role) => (
            <label key={role.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-sm cursor-pointer transition-colors hover:border-[var(--primary)] has-checked:bg-[var(--primary)]/10 has-checked:border-[var(--primary)] has-checked:text-[var(--primary)]">
              <input type="checkbox" checked={selectedRoles.includes(role.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRoles([...selectedRoles, role.id]);
                  } else {
                    setSelectedRoles(selectedRoles.filter((id) => id !== role.id));
                  }
                }}
                className="sr-only" />
              {role.name}
            </label>
          ))}
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
