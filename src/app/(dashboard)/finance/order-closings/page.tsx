'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';

interface OrderClosing {
  [key: string]: unknown;
  id: string;
  number: string;
  orderId: string;
  closingType: string;
  totalAmount: number;
  status: string;
  notes: string;
  createdAt: string;
}

function OrderClosingForm({ item, onClose }: { item: OrderClosing | null; onClose: () => void }) {
  const [form, setForm] = useState({
    number: item?.number ?? '',
    orderId: item?.orderId ?? '',
    closingType: item?.closingType ?? 'full',
    totalAmount: item?.totalAmount ?? 0,
    status: item?.status ?? 'draft',
    notes: item?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && !form.number) {
      const year = new Date().getFullYear();
      const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      setForm(f => f.number ? f : { ...f, number: `ЗАК-${year}-${num}` });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/order-closings/${item.id}` : '/api/order-closings';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      onClose();
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">{item?.id ? 'Редактировать' : 'Новое'} закрытие</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Номер</label>
          <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" required readOnly={!!item} placeholder={item ? undefined : 'Авто-генерация...'} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID заказа</label>
          <input type="text" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Тип закрытия</label>
          <select value={form.closingType} onChange={(e) => setForm({ ...form, closingType: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm">
            <option value="full">Полное</option>
            <option value="partial">Частичное</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Сумма</label>
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm">
            <option value="draft">Черновик</option>
            <option value="approved">Согласовано</option>
            <option value="completed">Завершено</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Примечания</label>
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Отмена</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm">{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </form>
  );
}

export default function OrderClosingsPage() {
  return (
    <CrudPage<OrderClosing>
      title="Закрытия заказов"
      apiPath="/api/order-closings"
      columns={[
        { key: 'number', label: 'Номер' },
        { key: 'orderId', label: 'Заказ' },
        { key: 'closingType', label: 'Тип', render: (item) => item.closingType === 'full' ? 'Полное' : 'Частичное' },
        { key: 'totalAmount', label: 'Сумма', render: (item) => `${(item.totalAmount || 0).toLocaleString('ru-RU')} ₽` },
        { key: 'status', label: 'Статус' },
        { key: 'createdAt', label: 'Дата', render: (item) => new Date(item.createdAt).toLocaleDateString('ru-RU') },
      ]}
      renderForm={(item, onClose) => <OrderClosingForm item={item} onClose={onClose} />}
    />
  );
}
