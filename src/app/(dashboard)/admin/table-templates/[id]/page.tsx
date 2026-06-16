'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, EyeOff, Eye, Settings2 } from 'lucide-react';
import {
  DATA_SOURCES,
  getDataSourceOptions,
  getFieldOptions,
  getFieldLabel,
  type TableTemplateColumnV4,
} from '@/lib/table-template-data';

interface TableTemplate {
  id: string;
  name: string;
  description?: string;
  columns?: string;
}

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'Центр' },
  { value: 'right', label: 'Справа' },
];

const SOURCE_COLORS: Record<string, string> = {
  products: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  items: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  services: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  finance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: 'Aa',
  number: '#',
  date: '📅',
  currency: '₽',
};

function reindexColumns(cols: TableTemplateColumnV4[]): TableTemplateColumnV4[] {
  return cols.map((col, i) => ({ ...col, order: i }));
}

function isV4Columns(json: string): boolean {
  try {
    const cols = JSON.parse(json);
    if (!Array.isArray(cols)) return false;
    if (cols.length === 0) return true;
    return 'tableName' in cols[0] && 'fieldName' in cols[0];
  } catch {
    return false;
  }
}

function migrateV5toV4(cols: any[]): TableTemplateColumnV4[] {
  return cols.map((col, i) => ({
    id: col.id || `col_${Date.now()}_${i}`,
    tableName: 'products',
    fieldName: col.key || 'name',
    label: col.label || '',
    width: col.width ? `${col.width}px` : undefined,
    type: col.type || 'text',
    order: i,
    visible: true,
    align: 'left',
  }));
}

export default function TableTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [template, setTemplate] = useState<TableTemplate>({ id: '', name: '', description: '', columns: '[]' });
  const [columns, setColumns] = useState<TableTemplateColumnV4[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Popover state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isNew && columns.length === 0) {
      setColumns([{
        id: `col_${Date.now()}`,
        tableName: 'products',
        fieldName: 'name',
        label: 'Наименование',
        width: '200px',
        type: 'text',
        order: 0,
        visible: true,
        align: 'left',
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (isNew) return;
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/table-templates/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const item = data.data || data;
          setTemplate(item);
          if (item.columns) {
            try {
              const parsed = JSON.parse(item.columns);
              if (isV4Columns(item.columns)) {
                setColumns(reindexColumns(parsed as TableTemplateColumnV4[]));
              } else {
                setColumns(reindexColumns(migrateV5toV4(parsed)));
              }
            } catch {
              setColumns([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching template:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [params.id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/table-templates' : `/api/table-templates/${params.id}`;
      const validCols = columns.filter((c) => c.tableName && c.fieldName);
      if (validCols.length === 0) {
        alert('Добавьте хотя бы одну колонку с выбранным источником и полем');
        setSaving(false);
        return;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          columns: JSON.stringify(reindexColumns(validCols)),
        }),
      });
      if (res.ok) router.push('/admin/table-templates');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    const lastSource = columns.length > 0 ? columns[columns.length - 1].tableName : 'products';
    const fields = getFieldOptions(lastSource);
    const first = fields[0];
    const newCol: TableTemplateColumnV4 = {
      id: `col_${Date.now()}`,
      tableName: lastSource,
      fieldName: first?.value || 'name',
      label: first?.label || '',
      width: '150px',
      type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
      order: columns.length,
      visible: true,
      align: (first?.align || 'left') as 'left' | 'center' | 'right',
    };
    setColumns([...columns, newCol]);
    setEditingIndex(columns.length);
  };

  const updateCol = (index: number, patch: Partial<TableTemplateColumnV4>) => {
    const next = [...columns];
    next[index] = { ...next[index], ...patch };
    setColumns(next);
  };

  const deleteColumn = (index: number) => {
    if (editingIndex === index) setEditingIndex(null);
    setColumns(reindexColumns(columns.filter((_, i) => i !== index)));
  };

  const moveColumn = (from: number, to: number) => {
    if (to < 0 || to >= columns.length) return;
    const next = [...columns];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setColumns(reindexColumns(next));
  };

  const visibleColumns = columns.filter((c) => c.visible !== false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/table-templates')}
            className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--muted-foreground)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {isNew ? 'Новый шаблон' : template.name}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isNew ? 'Создайте набор колонок для таблицы в документах' : 'Редактирование шаблона таблицы'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !template.name}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--primary)]/20"
        >
          <Save size={16} />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Template name + Description row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
            placeholder="Название шаблона..."
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={template.description || ''}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            className="w-full h-10 px-4 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
            placeholder="Описание (необязательно)"
          />
        </div>
      </div>

      {/* Main editor */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Колонки</h2>
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md font-medium">
              {columns.length} {columns.length === 1 ? 'колонка' : columns.length < 5 ? 'колонки' : 'колонок'}
              {columns.filter(c => c.visible === false).length > 0 &&
                ` · ${columns.filter(c => c.visible === false).length} скрыто`}
            </span>
          </div>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={14} />
            Добавить колонку
          </button>
        </div>

        {/* Columns grid */}
        <div className="p-5">
          {columns.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--muted)] mb-4">
                <span className="text-3xl opacity-40">📊</span>
              </div>
              <p className="text-[var(--muted-foreground)] text-sm font-medium mb-1">Нет колонок</p>
              <p className="text-[var(--muted-foreground)] text-xs mb-5">Нажмите «Добавить колонку», чтобы начать</p>
              <button
                onClick={addColumn}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold hover:opacity-90 transition-all"
              >
                <Plus size={14} />
                Добавить колонку
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {columns.map((col, index) => {
                const isVisible = col.visible !== false;
                const isEditing = editingIndex === index;
                const sourceColor = SOURCE_COLORS[col.tableName] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                const typeIcon = FIELD_TYPE_ICONS[col.type || 'text'] || 'Aa';

                return (
                  <div key={col.id} className="group relative">
                    {/* Column chip */}
                    <button
                      onClick={() => setEditingIndex(isEditing ? null : index)}
                      className={`relative flex items-center gap-2 h-10 px-3 rounded-xl border-2 transition-all duration-150 ${
                        isEditing
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
                          : isVisible
                            ? 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]/30 hover:shadow-sm'
                            : 'border-dashed border-[var(--border)] bg-[var(--muted)]/30 opacity-60'
                      }`}
                    >
                      {/* Order badge */}
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--muted)] text-[10px] font-bold text-[var(--muted-foreground)]">
                        {index + 1}
                      </span>

                      {/* Type hint */}
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] opacity-60 w-4 text-center">
                        {typeIcon}
                      </span>

                      {/* Label */}
                      <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[120px]">
                        {col.label || col.fieldName}
                      </span>

                      {/* Source badge */}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${sourceColor}`}>
                        {DATA_SOURCES[col.tableName]?.label?.slice(0, 8) || col.tableName.slice(0, 8)}
                      </span>

                      {/* Width hint */}
                      {col.width && (
                        <span className="text-[10px] text-[var(--muted-foreground)] opacity-50 font-mono hidden sm:inline">
                          {col.width}
                        </span>
                      )}

                      {/* Visibility icon */}
                      {!isVisible && (
                        <EyeOff size={12} className="text-[var(--muted-foreground)]" />
                      )}

                      {/* Edit indicator */}
                      {isEditing && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-[var(--card)]" />
                      )}
                    </button>

                    {/* Quick actions (appear on hover) */}
                    <div className="absolute -top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveColumn(index, index - 1); }}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-[var(--card)] border border-[var(--border)] shadow-sm hover:bg-[var(--muted)] transition-colors"
                        title="Переместить влево"
                      >
                        <ChevronUp size={10} className="text-[var(--muted-foreground)]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveColumn(index, index + 1); }}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-[var(--card)] border border-[var(--border)] shadow-sm hover:bg-[var(--muted)] transition-colors"
                        title="Переместить вправо"
                      >
                        <ChevronDown size={10} className="text-[var(--muted-foreground)]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteColumn(index); }}
                        className="w-5 h-5 flex items-center justify-center rounded-md bg-[var(--card)] border border-[var(--border)] shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={10} className="text-[var(--muted-foreground)] hover:text-red-500" />
                      </button>
                    </div>

                    {/* Editing popover */}
                    {isEditing && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setEditingIndex(null)}
                        />
                        <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 w-[360px] bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl p-5 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                              <Settings2 size={14} />
                              Колонка #{index + 1}
                            </h3>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateCol(index, { visible: !isVisible })}
                                className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]' : 'text-[var(--primary)] bg-[var(--primary)]/10'}`}
                                title={isVisible ? 'Скрыть' : 'Показать'}
                              >
                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button
                                onClick={() => { deleteColumn(index); }}
                                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Удалить колонку"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Source */}
                            <div>
                              <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Источник</label>
                              <select
                                value={col.tableName}
                                onChange={(e) => {
                                  const fields = getFieldOptions(e.target.value);
                                  const first = fields[0];
                                  updateCol(index, {
                                    tableName: e.target.value,
                                    fieldName: first?.value || '',
                                    label: first?.label || '',
                                    type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
                                    align: (first?.align || 'left') as 'left' | 'center' | 'right',
                                  });
                                }}
                                className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                              >
                                {getDataSourceOptions().map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Field */}
                            <div>
                              <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Поле</label>
                              <select
                                value={col.fieldName}
                                onChange={(e) => {
                                  const fieldOptions = getFieldOptions(col.tableName);
                                  const fi = fieldOptions.find(f => f.value === e.target.value);
                                  const label = getFieldLabel(col.tableName, e.target.value);
                                  updateCol(index, {
                                    fieldName: e.target.value,
                                    label,
                                    type: (fi?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
                                    align: (fi?.align || 'left') as 'left' | 'center' | 'right',
                                  });
                                }}
                                className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                              >
                                {getFieldOptions(col.tableName).map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Label */}
                            <div>
                              <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                                Заголовок <span className="font-normal normal-case tracking-normal text-[var(--muted-foreground)] opacity-60">(оставьте пустым для авто)</span>
                              </label>
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) => updateCol(index, { label: e.target.value })}
                                className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
                                placeholder={getFieldLabel(col.tableName, col.fieldName)}
                              />
                            </div>

                            {/* Width + Align row */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Ширина</label>
                                <input
                                  type="text"
                                  value={col.width || ''}
                                  onChange={(e) => updateCol(index, { width: e.target.value || undefined })}
                                  className="w-full h-9 px-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
                                  placeholder="auto"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Выравнивание</label>
                                <div className="flex h-9 gap-1 p-0.5 rounded-xl bg-[var(--muted)]">
                                  {ALIGN_OPTIONS.map(a => (
                                    <button
                                      key={a.value}
                                      onClick={() => updateCol(index, { align: a.value as 'left' | 'center' | 'right' })}
                                      className={`flex-1 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                        (col.align || 'left') === a.value
                                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                      }`}
                                    >
                                      {a.value === 'left' ? '⬅' : a.value === 'center' ? '↔' : '➡'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview in popover */}
                          <div className="mt-4 pt-3 border-t border-[var(--border)]">
                            <div className="text-[10px] text-[var(--muted-foreground)] mb-2">Значение по умолчанию:</div>
                            <div className="h-9 px-3 rounded-xl bg-[var(--muted)] flex items-center text-sm" style={{ textAlign: col.align || 'left' }}>
                              <span className={
                                col.type === 'currency' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                                col.type === 'number' ? 'text-blue-600 dark:text-blue-400 font-mono' :
                                col.type === 'date' ? 'text-violet-600 dark:text-violet-400' :
                                'text-[var(--foreground)]'
                              }>
                                {col.type === 'currency' ? '1 234,00 ₽' :
                                 col.type === 'number' ? '1234' :
                                 col.type === 'date' ? '01.06.2026' :
                                 getFieldLabel(col.tableName, col.fieldName)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview table */}
        {visibleColumns.length > 0 && (
          <div className="border-t border-[var(--border)]">
            <div className="px-5 py-3 bg-[var(--muted)]/10 border-b border-[var(--border)]">
              <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                Предпросмотр таблицы
                <span className="text-[10px] font-normal normal-case tracking-normal text-[var(--muted-foreground)] opacity-60">
                  ({visibleColumns.length} {visibleColumns.length === 1 ? 'колонка' : 'колонок'})
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--muted)]/50">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map(col => (
                        <th
                          key={col.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground)] border-r border-[var(--border)] last:border-r-0 whitespace-nowrap"
                          style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[var(--primary)] opacity-50 font-normal">
                              {col.tableName}.{col.fieldName}
                            </span>
                            {col.label}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[var(--muted)]/20 transition-colors">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map(col => (
                        <td
                          key={col.id}
                          className="px-4 py-3 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          <span className={
                            col.type === 'currency' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                            col.type === 'number' ? 'text-blue-600 dark:text-blue-400 font-mono' :
                            col.type === 'date' ? 'text-violet-600 dark:text-violet-400' :
                            'text-[var(--foreground)]'
                          }>
                            {col.type === 'currency' ? '1 234,56 ₽' :
                             col.type === 'number' ? '1234' :
                             col.type === 'date' ? '01.06.2026' :
                             getFieldLabel(col.tableName, col.fieldName)}
                          </span>
                        </td>
                      ))}
                  </tr>
                  <tr className="bg-[var(--muted)]/10">
                    {columns
                      .filter(c => c.visible !== false)
                      .sort((a, b) => a.order - b.order)
                      .map(col => (
                        <td
                          key={col.id}
                          className="px-4 py-3 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0 font-semibold"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          <span className={
                            col.type === 'currency' ? 'text-emerald-600 dark:text-emerald-400' :
                            col.type === 'number' ? 'text-blue-600 dark:text-blue-400 font-mono' :
                            'text-[var(--muted-foreground)]'
                          }>
                            {col.type === 'currency' ? '12 345,00 ₽' :
                             col.type === 'number' ? '9 999' :
                             '—'}
                          </span>
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
