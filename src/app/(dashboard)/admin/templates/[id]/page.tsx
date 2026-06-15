'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { BlockEditor } from '@/components/ui/block-editor';
import type { DocBlock } from '@/types';

interface DocType {
  id: string;
  name: string;
  slug: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  pageSize?: string;
  backgroundOpacity?: number;
  isDefault?: boolean;
  docTypeId?: string;
  docType?: DocType;
  blocks: DocBlock[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [template, setTemplate] = useState<Template>({
    id: '',
    name: '',
    description: '',
    pageSize: 'A4',
    backgroundOpacity: 1,
    isDefault: false,
    blocks: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const res = await fetch('/api/doc-types');
        if (res.ok) {
          const data = await res.json();
          setDocTypes(data?.data?.items ?? data?.data ?? []);
        }
      } catch {
        console.error('Failed to fetch doc types');
      }
    };
    fetchDocTypes();
  }, []);

  useEffect(() => {
    if (isNew) return;

    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/document-templates/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTemplate(data.data || data);
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
      const url = isNew ? '/api/document-templates' : `/api/document-templates/${params.id}`;

      const body = {
        name: template.name,
        description: template.description,
        pageSize: template.pageSize,
        backgroundOpacity: template.backgroundOpacity,
        isDefault: template.isDefault,
        docTypeId: template.docTypeId || null,
        blocks: {
          deleteMany: {},
          create: template.blocks.map((block, index) => ({
            type: block.type,
            order: index,
            title: block.title,
            content: block.content,
            height: block.height,
            showLine: block.showLine,
            settings: block.settings,
          })),
        },
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/admin/templates');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/templates')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {isNew ? 'Новый шаблон' : `Редактирование: ${template.name}`}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Настройте блоки шаблона перетаскиванием
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
          >
            <Eye size={16} />
            Предпросмотр
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !template.name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Настройки шаблона</h2>
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
                  placeholder="Название шаблона"
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
                  placeholder="Описание шаблона"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Тип документа
                </label>
                <select
                  value={template.docTypeId || ''}
                  onChange={(e) => setTemplate({ ...template, docTypeId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">Не выбран</option>
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Размер страницы
                </label>
                <select
                  value={template.pageSize || 'A4'}
                  onChange={(e) => setTemplate({ ...template, pageSize: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Прозрачность фона: {Math.round((template.backgroundOpacity || 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={template.backgroundOpacity || 1}
                  onChange={(e) => setTemplate({ ...template, backgroundOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={template.isDefault || false}
                  onChange={(e) => setTemplate({ ...template, isDefault: e.target.checked })}
                  className="rounded border-[var(--input)]"
                />
                Шаблон по умолчанию
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Блоки шаблона</h2>
            <BlockEditor
              blocks={template.blocks}
              onChange={(blocks) => setTemplate({ ...template, blocks })}
            />
          </div>

          {showPreview && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4">Предпросмотр</h2>
              <div className="bg-white p-8 shadow-inner min-h-[400px] rounded border">
                {template.blocks.length === 0 ? (
                  <p className="text-gray-400 text-center">Добавьте блоки для предпросмотра</p>
                ) : (
                  <div className="space-y-4">
                    {template.blocks.map((block) => (
                      <div key={block.id}>
                        {block.title && (
                          <h3 className="font-medium text-sm mb-2">{block.title}</h3>
                        )}
                        {block.type === 'text' && (
                          <p className="text-sm whitespace-pre-wrap">{block.content || 'Текст блока'}</p>
                        )}
                        {block.type === 'table' && (
                          <div className="border rounded">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border p-2 text-left">Колонка 1</th>
                                  <th className="border p-2 text-left">Колонка 2</th>
                                  <th className="border p-2 text-left">Колонка 3</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border p-2">—</td>
                                  <td className="border p-2">—</td>
                                  <td className="border p-2">—</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {block.type === 'separator' && (
                          <hr className="border-t border-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
