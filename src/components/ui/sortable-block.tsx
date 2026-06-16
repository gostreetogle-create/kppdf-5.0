'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown, Trash2, Pencil } from 'lucide-react';
import type { DocBlock } from '@/types';

interface SortableBlockProps {
  block: DocBlock;
  isSelected: boolean;
  editable: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function SortableBlock({
  block,
  isSelected,
  editable,
  onSelect,
  onEdit,
  onRemove,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group
        ${isSelected ? 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]' : ''}
        ${editable ? 'cursor-pointer' : ''}
      `}
      onClick={onSelect}
      onDoubleClick={editable ? onEdit : undefined}
    >
      {editable && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} className="text-[var(--muted-foreground)]" />
          </button>
        </div>
      )}

      {isSelected && editable && (
        <div className="absolute -right-10 top-0 flex flex-col gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded bg-[var(--card)] shadow border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            title="Редактировать"
          >
            <Pencil size={12} className="text-[var(--muted-foreground)]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded bg-[var(--card)] shadow border border-[var(--border)] hover:bg-[var(--destructive)]/10 transition-colors"
            title="Удалить"
          >
            <Trash2 size={12} className="text-[var(--destructive)]" />
          </button>
        </div>
      )}

      <BlockContent block={block} />
    </div>
  );
}

function BlockContent({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlockContent block={block} />;
    case 'table':
      return <TableBlockContent block={block} />;
    case 'separator':
      return <SeparatorBlockContent block={block} />;
    default:
      return null;
  }
}

function TextBlockContent({ block }: { block: DocBlock }) {
  if (block.columns && block.columns.length > 0) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {block.columns.map((col) => (
          <div
            key={col.id}
            style={{
              minWidth: '200px',
              width: col.width || 'auto',
              flex: '1 1 auto',
              textAlign: col.textAlign || 'left',
              fontWeight: col.fontWeight || 'normal',
              fontStyle: col.fontStyle || 'normal',
              textDecoration: col.textDecoration || 'none',
              color: col.color || undefined,
            }}
            className="text-sm"
          >
            <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: col.content || 'Текст' }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="text-sm"
      style={{
        textAlign: block.settings?.align || 'left',
        fontSize: block.settings?.fontSize || '14px',
        padding: block.settings?.padding || '0',
      }}
    >
      <div
        className="whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: block.content || 'Текстовый блок' }}
      />
    </div>
  );
}

function TableBlockContent({ block }: { block: DocBlock }) {
  return (
    <div>
      {block.title && (
        <h3 className="text-sm font-medium mb-2">{block.title}</h3>
      )}
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-[var(--border)] px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">Наименование</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Кол-во</th>
              <th className="border border-[var(--border)] px-3 py-2 text-center text-xs font-medium text-[var(--muted-foreground)]">Ед.</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Цена</th>
              <th className="border border-[var(--border)] px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {(block._inlineRows && block._inlineRows.length > 0) ? (
              block._inlineRows.map((row: Record<string, unknown>, i: number) => (
                <tr key={i}>
                  <td className="border border-[var(--border)] px-3 py-2 text-[var(--foreground)]">{String(row.name || '')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.quantity || '')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-center text-[var(--muted-foreground)]">{String(row.unit || 'шт')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.price || '')}</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right text-[var(--foreground)]">{String(row.total || '')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border border-[var(--border)] px-3 py-4 text-center text-[var(--muted-foreground)]">
                  Данные будут подставлены из КП
                </td>
              </tr>
            )}
          </tbody>
          {block._footerRows && block._footerRows.length > 0 && (
            <tfoot>
              {block._footerRows.map((row, i) => (
                <tr key={i} className="font-medium">
                  <td colSpan={4} className="border border-[var(--border)] px-3 py-2 text-right font-medium">
                    {row.label}
                  </td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right font-semibold">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SeparatorBlockContent({ block }: { block: DocBlock }) {
  return (
    <div style={{ height: block.height ? `${block.height}px` : '20px' }}>
      {block.showLine !== false && (
        <hr className="border-t border-[var(--border)] mt-2" />
      )}
    </div>
  );
}
