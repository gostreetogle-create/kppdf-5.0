'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { DocBlock, DocTextColumn, DocBlockSettings } from '@/types';

interface TextBlockDialogProps {
  block: DocBlock;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
}

export function TextBlockDialog({ block, onSave, onClose }: TextBlockDialogProps) {
  const [columns, setColumns] = useState<DocTextColumn[]>(
    block.columns && block.columns.length > 0
      ? block.columns
      : [{ id: 'col-1', content: block.content || '', width: '100%', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none' }]
  );
  const [title, setTitle] = useState(block.title || '');
  const [settings, setSettings] = useState(block.settings || { padding: '0', fontSize: '14px', align: 'left' as const });

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: `col-${Date.now()}`,
        content: '',
        width: '50%',
        textAlign: 'left',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
      },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<DocTextColumn>) => {
    setColumns(columns.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSave = () => {
    onSave({
      ...block,
      title,
      content: columns.length === 1 ? columns[0].content : undefined,
      columns: columns.length > 1 ? columns : undefined,
      settings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Редактирование текстового блока</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Заголовок блока</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Опционально"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Колонки</label>
              <button
                onClick={addColumn}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} />
                Добавить колонку
              </button>
            </div>

            <div className="space-y-3">
              {columns.map((col, index) => (
                <div key={col.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Колонка {index + 1}</span>
                    {columns.length > 1 && (
                      <button
                        onClick={() => removeColumn(col.id)}
                        className="p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={col.content}
                    onChange={(e) => updateColumn(col.id, { content: e.target.value })}
                    rows={3}
                    className="w-full px-2 py-1.5 rounded border text-sm resize-none"
                    placeholder="Текст. Используйте {{client.name}}, {{date}}, {{number}}"
                  />

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ширина</label>
                      <input
                        type="text"
                        value={col.width || ''}
                        onChange={(e) => updateColumn(col.id, { width: e.target.value })}
                        className="w-full px-2 py-1 rounded border text-xs"
                        placeholder="50%"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Выравнивание</label>
                      <select
                        value={col.textAlign || 'left'}
                        onChange={(e) => updateColumn(col.id, { textAlign: e.target.value as DocTextColumn['textAlign'] })}
                        className="w-full px-2 py-1 rounded border text-xs"
                      >
                        <option value="left">Лево</option>
                        <option value="center">Центр</option>
                        <option value="right">Право</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Начертание</label>
                      <select
                        value={col.fontWeight || 'normal'}
                        onChange={(e) => updateColumn(col.id, { fontWeight: e.target.value as DocTextColumn['fontWeight'] })}
                        className="w-full px-2 py-1 rounded border text-xs"
                      >
                        <option value="normal">Обычное</option>
                        <option value="bold">Жирное</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Курсив</label>
                      <select
                        value={col.fontStyle || 'normal'}
                        onChange={(e) => updateColumn(col.id, { fontStyle: e.target.value as DocTextColumn['fontStyle'] })}
                        className="w-full px-2 py-1 rounded border text-xs"
                      >
                        <option value="normal">Нет</option>
                        <option value="italic">Да</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Цвет текста</label>
                    <input
                      type="color"
                      value={col.color || '#000000'}
                      onChange={(e) => updateColumn(col.id, { color: e.target.value })}
                      className="w-8 h-6 rounded border cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Отступ</label>
              <input
                type="text"
                value={settings.padding || ''}
                onChange={(e) => setSettings({ ...settings, padding: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-sm"
                placeholder="0px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Размер шрифта</label>
              <input
                type="text"
                value={settings.fontSize || ''}
                onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-sm"
                placeholder="14px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Выравнивание</label>
              <select
                value={settings.align || 'left'}
                onChange={(e) => setSettings({ ...settings, align: e.target.value as DocBlockSettings['align'] })}
                className="w-full px-2 py-1.5 rounded border text-sm"
              >
                <option value="left">Лево</option>
                <option value="center">Центр</option>
                <option value="right">Право</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button            onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableBlockDialogProps {
  block: DocBlock;
  tableTemplates: Array<{ id: string; name: string }>;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
  onCreateTemplate?: () => void;
}

export function TableBlockDialog({ block, tableTemplates, onSave, onClose, onCreateTemplate }: TableBlockDialogProps) {
  const [title, setTitle] = useState(block.title || '');
  const [tableTemplateId, setTableTemplateId] = useState(block.tableTemplateId || '');
  const [showLine, setShowLine] = useState(block.showLine ?? true);
  const [height, setHeight] = useState(block.height || 0);

  const handleSave = () => {
    onSave({
      ...block,
      title,
      tableTemplateId: tableTemplateId || undefined,
      showLine,
      height: height || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Настройка таблицы</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Заголовок таблицы</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Опционально"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Шаблон таблицы</label>
              {onCreateTemplate && (
                <button
                  onClick={onCreateTemplate}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Создать шаблон
                </button>
              )}
            </div>
            <select
              value={tableTemplateId}
              onChange={(e) => setTableTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            >
              <option value="">Без шаблона (стандартные колонки)</option>
              {tableTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Высота (px)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Авто"
              min={0}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLine}
              onChange={(e) => setShowLine(e.target.checked)}
              className="rounded"
            />
            Показывать линии таблицы
          </label>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button            onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

interface SeparatorBlockDialogProps {
  block: DocBlock;
  onSave: (block: DocBlock) => void;
  onClose: () => void;
}

export function SeparatorBlockDialog({ block, onSave, onClose }: SeparatorBlockDialogProps) {
  const [height, setHeight] = useState(block.height || 20);
  const [showLine, setShowLine] = useState(block.showLine ?? true);

  const handleSave = () => {
    onSave({
      ...block,
      height,
      showLine,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Настройка разделителя</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Высота (px)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              min={1}
              max={100}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLine}
              onChange={(e) => setShowLine(e.target.checked)}
              className="rounded"
            />
            Показывать линию
          </label>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button            onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
