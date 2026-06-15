'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { A4Page } from './a4-page';
import { SortableBlock } from './sortable-block';
import type { DocBlock } from '@/types';

interface A4CanvasProps {
  blocks: DocBlock[];
  selectedBlockId: string | null;
  backgroundImage?: string;
  backgroundOpacity?: number;
  editable?: boolean;
  scale?: number;
  onBlockSelect: (id: string) => void;
  onBlocksReorder: (blocks: DocBlock[]) => void;
  onBlockEdit: (block: DocBlock) => void;
  onBlockRemove: (id: string) => void;
}

export function A4Canvas({
  blocks,
  selectedBlockId,
  backgroundImage,
  backgroundOpacity,
  editable = false,
  scale = 0.6,
  onBlockSelect,
  onBlocksReorder,
  onBlockEdit,
  onBlockRemove,
}: A4CanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
        ...b,
        order: i,
      }));

      onBlocksReorder(reordered);
    },
    [blocks, onBlocksReorder]
  );

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <A4Page
      backgroundImage={backgroundImage}
      backgroundOpacity={backgroundOpacity}
      scale={scale}
      editable={editable}
    >
      {sortedBlocks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          {editable ? 'Добавьте блоки из панели слева' : 'Нет блоков'}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedBlocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedBlocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  editable={editable}
                  onSelect={() => onBlockSelect(block.id)}
                  onEdit={() => onBlockEdit(block)}
                  onRemove={() => onBlockRemove(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </A4Page>
  );
}
