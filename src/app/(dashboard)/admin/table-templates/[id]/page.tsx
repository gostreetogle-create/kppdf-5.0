'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, EyeOff, Eye } from 'lucide-react';
import {
  DATA_SOURCES,
  getDataSourceOptions,
  getFieldOptions,
  getFieldLabel,
  type TableTemplateColumnV4,
  type FieldOption,
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

/** Обновить order у всех колонок по порядку массива */
function reindexColumns(cols: TableTemplateColumnV4[]): TableTemplateColumnV4[] {
  return cols.map((col, i) => ({ ...col, order: i }));
}

/** Проверить, является ли JSON строкой колонок v4.0 */
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

/** Сконвертировать v5.0 колонки (с key) в v4.0 (с tableName/fieldName) */
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

  const [template, setTemplate] = useState<TableTemplate>({
    id: '',
    name: '',
    description: '',
    columns: '[]',
  });
  const [columns, setColumns] = useState<TableTemplateColumnV4[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialise with a default column for new templates
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
  }, [isNew]); // eslint-disable-line react-hooks/exhaustive-deps

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
                // Migrate from v5.0 format
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

      // Validate: all columns must have tableName and fieldName
      const validCols = columns.filter((c) => c.tableName && c.fieldName);
      if (validCols.length === 0) {
        alert('Добавьте хотя бы одну колонку с выбранным источником и полем');
        setSaving(false);
        return;
      }

      const body = {
        name: template.name,
        description: template.description,
        columns: JSON.stringify(reindexColumns(validCols)),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/admin/table-templates');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    const lastSource = columns.length > 0 ? columns[columns.length - 1].tableName : 'products';
    const lastField = getFieldOptions(lastSource)[0];
    const newCol: TableTemplateColumnV4 = {
      id: `col_${Date.now()}`,
      tableName: lastSource,
      fieldName: lastField?.value || 'name',
      label: lastField?.label || '',
      width: lastField ? undefined : '100px',
      type: (lastField?.type as any) || 'text',
      order: columns.length,
      visible: true,
      align: (lastField as any)?.align || 'left',
    };
    setColumns([...columns, newCol]);
  };

  const updateColumn = (index: number, column: TableTemplateColumnV4) => {
    const newColumns = [...columns];
    newColumns[index] = column;
    setColumns(newColumns);
  };

  /** When tableName changes, reset fieldName to first available field */
  const changeTableName = (index: number, tableName: string) => {
    const fields = getFieldOptions(tableName);
    const first = fields[0];
    const prev = columns[index];
    updateColumn(index, {
      ...prev,
      tableName,
      fieldName: first?.value || '',
      label: first?.label || '',
      type: (first?.type || 'text') as 'text' | 'number' | 'date' | 'currency',
      align: (first?.align || 'left') as 'left' | 'center' | 'right',
      // Keep custom width if user set it
      width: prev.width,
    });
  };

  /** When fieldName changes, auto-update label and type */
  const changeFieldName = (index: number, fieldName: string) => {
    const col = columns[index];
    const label = getFieldLabel(col.tableName, fieldName);
    const fieldInfo = getFieldOptions(col.tableName).find((f) => f.value === fieldName);
    updateColumn(index, {
      ...col,
      fieldName,
      label,
      type: (fieldInfo?.type || col.type || 'text') as 'text' | 'number' | 'date' | 'currency',
      align: (fieldInfo?.align || col.align || 'left') as 'left' | 'center' | 'right',
    });
  };

  const deleteColumn = (index: number) => {
    setColumns(reindexColumns(columns.filter((_, i) => i !== index)));
  };

  const toggleVisible = (index: number) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], visible: !newCols[index].visible };
    setColumns(newCols);
  };

  const moveColumn = (from: number, to: number) => {
    const newColumns = [...columns];
    const [removed] = newColumns.splice(from, 1);
    newColumns.splice(to, 0, removed);
    setColumns(reindexColumns(newColumns));
  };

  const getSourceLabel = (tableName: string): string => {
    return DATA_SOURCES[tableName]?.label || tableName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/table-templates')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {isNew ? 'Новый шаблон таблицы' : `Редактирование: ${template.name}`}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Каждая колонка привязана к источнику данных ({'tableName.fieldName'})
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !template.name}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
        >
          <Save size={16} />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Settings */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Настройки</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder="Например: Спецификация товаров"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Описание
                </label>
                <textarea
                  value={template.description || ''}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                  placeholder="Для каких документов этот шаблон"
                />
              </div>

              {/* Sources info */}
              <div className="bg-[var(--muted)]/30 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Доступные источники
                </h3>
                <div className="space-y-1">
                  {Object.values(DATA_SOURCES).map((ds) => (
                    <div key={ds.name} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span className="font-mono text-[var(--primary)]">{ds.name}</span>
                      <span>— {ds.label}</span>
                      <span className="text-[10px]">({ds.fields.length} полей)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Columns editor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Колонки</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">
                  {columns.filter((c) => c.visible).length} видимых · {columns.length} всего
                </span>
                <button
                  onClick={addColumn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  Колонка
                </button>
              </div>
            </div>

            {columns.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-xl">
                <div className="text-4xl mb-3 opacity-30">📊</div>
                <p className="text-[var(--muted-foreground)] text-sm font-medium mb-1">
                  Нет колонок
                </p>
                <p className="text-[var(--muted-foreground)] text-xs mb-4">
                  Нажмите «Колонка», чтобы добавить первую
                </p>
                <button
                  onClick={addColumn}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  Добавить колонку
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {columns.map((col, index) => {
                  const fieldOptions = getFieldOptions(col.tableName);
                  const sourceOptions = getDataSourceOptions();
                  const isVisible = col.visible !== false;

                  return (
                    <div
                      key={col.id}
                      className={`flex items-start gap-2 p-3 bg-[var(--background)] border rounded-lg transition-all duration-200 ${
                        dragOverIndex === index ? 'border-[var(--primary)] shadow-md scale-[1.02]' : 'border-[var(--border)]'
                      } ${!isVisible ? 'opacity-60' : ''}`}
                      draggable
                      onDragStart={() => { setDragOverIndex(index); }}
                      onDragEnter={() => { setDragOverIndex(index); }}
                      onDragLeave={() => { setDragOverIndex(null); }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDragEnd={(e) => {
                        e.preventDefault();
                        if (dragOverIndex !== null && dragOverIndex !== index) {
                          moveColumn(dragOverIndex, index);
                        }
                        setDragOverIndex(null);
                      }}
                    >
                      {/* Drag handle */}
                      <div className="pt-2 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} className="text-[var(--muted-foreground)]" />
                      </div>

                      {/* Column number */}
                      <div className="pt-1.5 w-6 text-center text-xs font-mono text-[var(--muted-foreground)] font-bold">
                        {index + 1}
                      </div>

                      {/* Column fields */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {/* Data source (tableName) */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">
                            Источник
                          </label>
                          <select
                            value={col.tableName}
                            onChange={(e) => changeTableName(index, e.target.value)}
                            className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                          >
                            {sourceOptions.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Field (fieldName) */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">
                            Поле
                          </label>
                          <select
                            value={col.fieldName}
                            onChange={(e) => changeFieldName(index, e.target.value)}
                            className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                          >
                            {fieldOptions.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label} ({f.value})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Label override */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">
                            Заголовок
                          </label>
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => updateColumn(index, { ...col, label: e.target.value })}
                            className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                            placeholder="Авто"
                          />
                        </div>

                        {/* Width */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">
                            Ширина
                          </label>
                          <input
                            type="text"
                            value={col.width || ''}
                            onChange={(e) => updateColumn(index, { ...col, width: e.target.value || undefined })}
                            className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                            placeholder="auto"
                          />
                        </div>

                        {/* Align */}
                        <div>
                          <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">
                            Выравнивание
                          </label>
                          <select
                            value={col.align || 'left'}
                            onChange={(e) => updateColumn(index, { ...col, align: e.target.value as 'left' | 'center' | 'right' })}
                            className="w-full h-9 px-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] appearance-none cursor-pointer"
                          >
                            {ALIGN_OPTIONS.map((a) => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-5">
                        <button
                          onClick={() => toggleVisible(index)}
                          className="p-1.5 rounded hover:bg-[var(--muted)] transition-colors"
                          title={isVisible ? 'Скрыть колонку' : 'Показать колонку'}
                        >
                          {isVisible
                            ? <Eye size={14} className="text-[var(--muted-foreground)]" />
                            : <EyeOff size={14} className="text-[var(--muted-foreground)]" />
                          }
                        </button>
                        <button
                          onClick={() => deleteColumn(index)}
                          className="p-1.5 rounded hover:bg-[var(--destructive)]/10 transition-colors"
                          title="Удалить колонку"
                        >
                          <Trash2 size={14} className="text-[var(--destructive)]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          {columns.filter((c) => c.visible !== false).length > 0 && (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                Предпросмотр
                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                  (колонки, привязанные к источникам данных)
                </span>
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--muted)]">
                      {columns
                        .filter((c) => c.visible !== false)
                        .sort((a, b) => a.order - b.order)
                        .map((col) => (
                          <th
                            key={col.id}
                            className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--foreground)] border-r border-[var(--border)] last:border-r-0"
                            style={{
                              width: col.width || 'auto',
                              textAlign: col.align || 'left',
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[var(--primary)] opacity-60">
                                {col.tableName}.{col.fieldName}
                              </span>
                              <span>{col.label}</span>
                            </div>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-[var(--muted)]/30 transition-colors">
                      {columns
                        .filter((c) => c.visible !== false)
                        .sort((a, b) => a.order - b.order)
                        .map((col) => (
                          <td
                            key={col.id}
                            className="px-3 py-3 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0 text-[var(--muted-foreground)]"
                            style={{ textAlign: col.align || 'left' }}
                          >
                            <span className="text-xs">
                              {col.type === 'currency' ? '1 234,56 ₽' :
                               col.type === 'number' ? '1234' :
                               col.type === 'date' ? '01.01.2026' :
                               getFieldLabel(col.tableName, col.fieldName)}
                            </span>
                          </td>
                        ))}
                    </tr>
                    <tr className="bg-[var(--muted)]/20">
                      {columns
                        .filter((c) => c.visible !== false)
                        .sort((a, b) => a.order - b.order)
                        .map((col) => (
                          <td
                            key={col.id}
                            className="px-3 py-2 border-t border-[var(--border)] border-r border-[var(--border)] last:border-r-0 font-semibold text-[var(--foreground)] text-xs"
                            style={{ textAlign: col.align || 'left' }}
                          >
                            {col.type === 'currency' ? '12 345,00 ₽' :
                             col.type === 'number' ? '999' : ''}
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
                <span>🟢 Видимые колонки ({columns.filter(c => c.visible !== false).length})</span>
                <span>🔴 Скрытые ({columns.filter(c => c.visible === false).length})</span>
                <span>📦 Источник: {getSourceLabel(columns[0]?.tableName)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
