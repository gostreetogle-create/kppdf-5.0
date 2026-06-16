'use client';

import { useState, useEffect } from 'react';
import { CrudPage } from '@/components/crud-page';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductModule {
  [key: string]: unknown;
  id: string;
  name: string;
  article?: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  sortOrder: number;
  productId: string;    image?: string;
    product?: { id: string; name: string; sku: string };
  workTypes?: ModuleWorkType[];
  materials?: ModuleMaterial[];
}

interface ModuleWorkType {
  id?: string;
  workTypeId: string;
  estimatedHours: number;
  sortOrder?: number;
  workType?: { id: string; name: string };
}

interface ModuleMaterial {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
}

function ModuleForm({ item, onClose }: { item: ProductModule | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    article: item?.article ?? '',
    productId: item?.productId ?? '',
    image: item?.image ?? '',
    width: item?.width ?? '',
    height: item?.height ?? '',
    depth: item?.depth ?? '',
    weight: item?.weight ?? '',
    sortOrder: item?.sortOrder ?? 0,
  });
  const [workTypes, setWorkTypes] = useState<ModuleWorkType[]>(
    item?.workTypes?.map((wt) => ({
      workTypeId: wt.workTypeId,
      estimatedHours: wt.estimatedHours,
      sortOrder: wt.sortOrder ?? 0,
    })) ?? [],
  );
  const [materials, setMaterials] = useState<ModuleMaterial[]>(
    item?.materials?.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      isPurchased: m.isPurchased,
    })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [workTypesList, setWorkTypesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=500').then((r) => r.json()).then((d) => {
      if (d.success) setProducts(d.data.items);
    }).catch(() => {});
    fetch('/api/work-types?limit=100').then((r) => r.json()).then((d) => {
      if (d.success) setWorkTypesList(d.data.items);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = item?.id ? 'PUT' : 'POST';
      const url = item?.id ? `/api/product-modules/${item.id}` : '/api/product-modules';
      const payload = {
        ...form,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        depth: form.depth ? Number(form.depth) : null,
        weight: form.weight ? Number(form.weight) : null,
        workTypes: workTypes.filter((wt) => wt.workTypeId),
        materials: materials.filter((m) => m.name.trim()),
      };
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const addWorkType = () => setWorkTypes([...workTypes, { workTypeId: '', estimatedHours: 1 }]);
  const removeWorkType = (idx: number) => setWorkTypes(workTypes.filter((_, i) => i !== idx));

  const addMaterial = () => setMaterials([...materials, { name: '', quantity: 1, unit: 'шт', isPurchased: true }]);
  const removeMaterial = (idx: number) => setMaterials(materials.filter((_, i) => i !== idx));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {item?.id ? 'Редактировать модуль' : 'Новый модуль'}
      </h2>

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Артикул</label>
          <input type="text" value={form.article} onChange={(e) => setForm({ ...form, article: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Продукт *</label>
          <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none" required>
            <option value="">— Выберите продукт —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Ширина (мм)</label>
          <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" step="0.1" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Высота (мм)</label>
          <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" step="0.1" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Глубина (мм)</label>
          <input type="number" value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" step="0.1" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Вес (кг)</label>
          <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" step="0.01" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Изображение (URL)</label>
          <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Порядок</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" min={0} />
        </div>
      </div>

      {/* Work Types sub-form */}
      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Виды работ модуля</h3>
          <Button type="button" variant="ghost" size="icon-sm" onClick={addWorkType}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {workTypes.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">Нет видов работ. Нажмите + чтобы добавить.</p>
        )}
        {workTypes.map((wt, idx) => (
          <div key={idx} className="grid grid-cols-[1fr,120px,40px] gap-2 mb-2 items-end">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Вид работы</label>
              <select value={wt.workTypeId} onChange={(e) => {
                const updated = [...workTypes];
                updated[idx].workTypeId = e.target.value;
                setWorkTypes(updated);
              }} className="w-full px-2 py-1.5 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)] appearance-none">
                <option value="">— Выбрать —</option>
                {workTypesList.map((wtl) => (
                  <option key={wtl.id} value={wtl.id}>{wtl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Часы</label>
              <input type="number" value={wt.estimatedHours} onChange={(e) => {
                const updated = [...workTypes];
                updated[idx].estimatedHours = Number(e.target.value);
                setWorkTypes(updated);
              }} className="w-full px-2 py-1.5 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" min={0} step="0.5" />
            </div>
            <button type="button" onClick={() => removeWorkType(idx)} className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Materials sub-form */}
      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Материалы модуля</h3>
          <Button type="button" variant="ghost" size="icon-sm" onClick={addMaterial}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {materials.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">Нет материалов. Нажмите + чтобы добавить.</p>
        )}
        {materials.length > 0 && (
          <div className="grid grid-cols-[1fr,70px,60px,60px,36px] gap-2 mb-1 px-1">
            <span className="text-xs text-[var(--muted-foreground)]">Название</span>
            <span className="text-xs text-[var(--muted-foreground)]">Кол-во</span>
            <span className="text-xs text-[var(--muted-foreground)]">Ед.</span>
            <span className="text-xs text-[var(--muted-foreground)]">Покупной</span>
            <span />
          </div>
        )}
        {materials.map((m, idx) => (
          <div key={idx} className="grid grid-cols-[1fr,70px,60px,60px,36px] gap-2 mb-2 items-center">
            <input type="text" value={m.name} onChange={(e) => {
              const updated = [...materials];
              updated[idx].name = e.target.value;
              setMaterials(updated);
            }} className="w-full px-2 py-1.5 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" placeholder="Название" />
            <input type="number" value={m.quantity} onChange={(e) => {
              const updated = [...materials];
              updated[idx].quantity = Number(e.target.value);
              setMaterials(updated);
            }} className="w-full px-2 py-1.5 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" min={0} step="0.01" />
            <input type="text" value={m.unit} onChange={(e) => {
              const updated = [...materials];
              updated[idx].unit = e.target.value;
              setMaterials(updated);
            }} className="w-full px-2 py-1.5 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
            <label className="flex items-center justify-center cursor-pointer">
              <input type="checkbox" checked={m.isPurchased} onChange={(e) => {
                const updated = [...materials];
                updated[idx].isPurchased = e.target.checked;
                setMaterials(updated);
              }} className="w-4 h-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--ring)]" />
            </label>
            <button type="button" onClick={() => removeMaterial(idx)} className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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

export default function ModulesPage() {
  return (
    <CrudPage<ProductModule>
      title="Модули продуктов"
      apiPath="/api/product-modules"
      columns={[
        { key: 'name', label: 'Название' },
        { key: 'article', label: 'Артикул', render: (item) => item.article || '—' },
        {
          key: 'product',
          label: 'Продукт',
          render: (item) => item.product?.name ?? '—',
        },
        {
          key: 'workTypes',
          label: 'Видов работ',
          render: (item) => String(item.workTypes?.length ?? 0),
        },
        {
          key: 'materials',
          label: 'Материалов',
          render: (item) => String(item.materials?.length ?? 0),
        },
        {
          key: 'dimensions',
          label: 'Габариты',
          render: (item) => {
            const parts = [];
            if (item.width) parts.push(`${item.width}мм`);
            if (item.height) parts.push(`${item.height}мм`);
            if (item.depth) parts.push(`${item.depth}мм`);
            return parts.length > 0 ? parts.join('×') : '—';
          },
        },
      ]}
      renderForm={(item, onClose) => <ModuleForm item={item} onClose={onClose} />}
    />
  );
}
