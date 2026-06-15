'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Type, Table, Minus, Undo2, Redo2 } from 'lucide-react';
import { A4Canvas } from './a4-canvas';
import { TextBlockDialog, TableBlockDialog, SeparatorBlockDialog } from './block-dialogs';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { useDraftAutosave } from '@/hooks/use-draft-autosave';
import type { DocBlock } from '@/types';

interface BlockEditorProps {
  blocks: DocBlock[];
  onChange: (blocks: DocBlock[]) => void;
  backgroundImage?: string;
  backgroundOpacity?: number;
  templateId?: string;
  tableTemplates?: Array<{ id: string; name: string }>;
  onCreateTableTemplate?: () => void;
}

export function BlockEditor({
  blocks,
  onChange,
  backgroundImage,
  backgroundOpacity,
  templateId,
  tableTemplates = [],
  onCreateTableTemplate,
}: BlockEditorProps) {
  const {
    state: editorBlocks,
    setState: setEditorBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<DocBlock[]>(blocks);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<DocBlock | null>(null);

  const onChangeRef = useRef(onChange);
  const prevBlocksRef = useRef(editorBlocks);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { loadDraft, clearDraft } = useDraftAutosave(editorBlocks, {
    key: templateId || 'new',
    interval: 2000,
    enabled: !!templateId,
  });

  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (templateId && !draftLoadedRef.current) {
      draftLoadedRef.current = true;
      const draft = loadDraft();
      if (draft && Array.isArray(draft)) {
        setEditorBlocks(draft);
      }
    }
  }, [templateId]);

  useEffect(() => {
    if (prevBlocksRef.current !== editorBlocks) {
      prevBlocksRef.current = editorBlocks;
      onChangeRef.current(editorBlocks);
    }
  }, [editorBlocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const addBlock = useCallback(
    (type: DocBlock['type']) => {
      const newBlock: DocBlock = {
        id: `block-${Date.now()}`,
        type,
        order: editorBlocks.length,
        title: '',
        content: type === 'text' ? '' : undefined,
        showLine: type === 'table' || type === 'separator' ? true : undefined,
        height: type === 'separator' ? 20 : undefined,
      };
      setEditorBlocks([...editorBlocks, newBlock]);
      setSelectedBlockId(newBlock.id);
      setEditingBlock(newBlock);
    },
    [editorBlocks, setEditorBlocks]
  );

  const handleBlockSelect = useCallback((id: string) => {
    setSelectedBlockId(id);
  }, []);

  const handleBlockEdit = useCallback(
    (block: DocBlock) => {
      setEditingBlock(block);
    },
    []
  );

  const handleBlockRemove = useCallback(
    (id: string) => {
      setEditorBlocks(editorBlocks.filter((b) => b.id !== id));
      if (selectedBlockId === id) {
        setSelectedBlockId(null);
      }
    },
    [editorBlocks, setEditorBlocks, selectedBlockId]
  );

  const handleBlocksReorder = useCallback(
    (reordered: DocBlock[]) => {
      setEditorBlocks(reordered);
    },
    [setEditorBlocks]
  );

  const handleBlockSave = useCallback(
    (updatedBlock: DocBlock) => {
      setEditorBlocks(
        editorBlocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
      );
      setEditingBlock(null);
    },
    [editorBlocks, setEditorBlocks]
  );

  const handleClearDraft = useCallback(() => {
    clearDraft();
    setEditorBlocks(blocks);
  }, [clearDraft, blocks, setEditorBlocks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Добавить блок:</span>
          <button
            onClick={() => addBlock('text')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            <Type size={14} />
            Текст
          </button>
          <button
            onClick={() => addBlock('table')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            <Table size={14} />
            Таблица
          </button>
          <button
            onClick={() => addBlock('separator')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            <Minus size={14} />
            Разделитель
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
            title="Повторить (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
          {templateId && (
            <button
              onClick={handleClearDraft}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Сбросить черновик
            </button>
          )}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-gray-50 p-4">
        <A4Canvas
          blocks={editorBlocks}
          selectedBlockId={selectedBlockId}
          backgroundImage={backgroundImage}
          backgroundOpacity={backgroundOpacity}
          editable={true}
          scale={0.5}
          onBlockSelect={handleBlockSelect}
          onBlocksReorder={handleBlocksReorder}
          onBlockEdit={handleBlockEdit}
          onBlockRemove={handleBlockRemove}
        />
      </div>

      {editingBlock && editingBlock.type === 'text' && (
        <TextBlockDialog
          block={editingBlock}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {editingBlock && editingBlock.type === 'table' && (
        <TableBlockDialog
          block={editingBlock}
          tableTemplates={tableTemplates}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
          onCreateTemplate={onCreateTableTemplate}
        />
      )}

      {editingBlock && editingBlock.type === 'separator' && (
        <SeparatorBlockDialog
          block={editingBlock}
          onSave={handleBlockSave}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}
