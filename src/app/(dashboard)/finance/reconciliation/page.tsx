'use client';

import { useState } from 'react';
import { CrudPage } from '@/components/crud-page';

interface ReconciliationAct {
  [key: string]: unknown;
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

function ReconciliationForm({ item, onClose }: { item: ReconciliationAct | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    title: item?.title ?? '',
    totalAmount: item?.totalAmount ?? 0,
    status: item?.status ?? 'draft',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/reconciliation-acts/${item.id}` : '/api/reconciliation-acts';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">{item?.id ? 'Редактировать' : 'Новый'} акт</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Номер</label>
          <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Название</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Сумма</label>
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm">
            <option value="draft">Черновик</option>
            <option value="approved">Согласован</option>
            <option value="rejected">Отклонён</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Отмена</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm">{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </form>
  );
}

export default function ReconciliationPage() {
  return (
    <CrudPage<ReconciliationAct>
      title="Акты сверки"
      apiPath="/api/reconciliation-acts"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'title', label: 'Название' },
        { key: 'status', label: 'Статус' },
        { key: 'totalAmount', label: 'Сумма', render: (item) => `${(item.totalAmount || 0).toLocaleString('ru-RU')} ₽` },
        { key: 'createdAt', label: 'Дата', render: (item) => new Date(item.createdAt).toLocaleDateString('ru-RU') },
      ]}
      renderForm={(item, onClose) => <ReconciliationForm item={item} onClose={onClose} />}
    />
  );
}
