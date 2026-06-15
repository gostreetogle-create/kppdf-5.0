'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';

interface Product {
  [key: string]: unknown;
  id: string;
  sku: string;
  name: string;
  category?: { name: string };
  productType: string;
  basePrice: number;
  unit: string;
  description: string;
  defaultMarkupPercent: number;
  weightKg: number;
  material: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

function ProductForm({ item, onClose }: { item: Product | null; onClose: () => void }) {
  const [form, setForm] = useState({
    sku: item?.sku ?? '',
    name: item?.name ?? '',
    categoryId: '',
    productType: item?.productType ?? 'purchased',
    description: item?.description ?? '',
    basePrice: item?.basePrice ?? 0,
    defaultMarkupPercent: item?.defaultMarkupPercent ?? 0,
    unit: item?.unit ?? 'шт',
    weightKg: item?.weightKg ?? 0,
    material: item?.material ?? '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/products/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d?.data?.items ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/products/${item.id}` : '/api/products';
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
        {item?.id ? 'Редактировать товар' : 'Новый товар'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Артикул</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Категория</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Тип</label>
          <select
            value={form.productType}
            onChange={(e) => setForm({ ...form, productType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="purchased">Закупаемый</option>
            <option value="manufactured">Производимый</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Базовая цена</label>
          <input
            type="number"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Наценка, %</label>
          <input
            type="number"
            value={form.defaultMarkupPercent}
            onChange={(e) => setForm({ ...form, defaultMarkupPercent: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Ед. изм.</label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Вес, кг</label>
          <input
            type="number"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Материал</label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
        </div>
      </div>
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

export default function ProductsPage() {
  return (
    <CrudPage<Product>
      title="Товары"
      apiPath="/api/products"
      columns={[
        { key: 'sku', label: 'Артикул' },
        { key: 'name', label: 'Название' },
        {
          key: 'category',
          label: 'Категория',
          render: (item) => item.category?.name ?? '—',
        },
        {
          key: 'productType',
          label: 'Тип',
          render: (item) => (
            <span className="text-sm">
              {item.productType === 'purchased' ? 'Закупаемый' : 'Производимый'}
            </span>
          ),
        },
        {
          key: 'basePrice',
          label: 'Цена',
          render: (item) => `${item.basePrice?.toLocaleString('ru-RU')} ₽`,
        },
        { key: 'unit', label: 'Ед.' },
        {
          key: 'isActive',
          label: 'Статус',
          render: (item) => (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {item.isActive ? 'Активен' : 'Неактивен'}
            </span>
          ),
        },
      ]}
      renderForm={(item, onClose) => <ProductForm item={item} onClose={onClose} />}
    />
  );
}
