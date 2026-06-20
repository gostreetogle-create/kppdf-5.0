'use client';

// Cycle 44 (B.3 Block 3.1): ProposalEditor orchestrator (index).
//
// Compose:
//   <ProposalEditorProvider>     — Context с useProposalEditorState
//     <EditorHeader />            — top compact header
//     <div main: 45/55 split>
//       <ProductSelector />       — left top: products (search + filter)
//       <ConfigPanel />           — left mid: org/client/template/discount/RAL
//       <EditorCart />            — left bottom: cart items + totals
//       <PreviewArea />           — right: A4 preview
//     </div>
//     <SettingsDialog />          — modal: title editor
//     <PdfExport />               — modal: PDF preview
//   </ProposalEditorProvider>

import { Check } from 'lucide-react';
import { ProposalEditorProvider, useProposalEditor } from './editor-provider';
import { EditorHeader } from './editor-header';
import { ProductSelector } from './product-selector';
import { ConfigPanel } from './config-panel';
import { EditorCart } from './editor-cart';
import { PreviewArea } from './preview-area';
import { SettingsDialog } from './settings-dialog';
import { PdfExport } from './pdf-export';

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 animate-fadeIn">
      <div className="h-16 w-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
        <Check className="h-8 w-8 text-[var(--success)]" />
      </div>
      <h2 className="text-xl font-semibold">КП создано!</h2>
    </div>
  );
}

function EditorBody() {
  const { state } = useProposalEditor();

  if (state.loading) return <LoadingState />;
  if (state.success) return <SuccessState />;
  if (!state.cartId)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[var(--muted-foreground)]">Ошибка инициализации</p>
      </div>
    );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <EditorHeader />
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: 45% */}
        <div className="w-[45%] flex flex-col border-r border-[var(--border)] overflow-hidden">
          <ProductSelector />
          <ConfigPanel />
          <EditorCart />
        </div>
        {/* RIGHT: 55% */}
        <PreviewArea />
      </div>
      <SettingsDialog />
      <PdfExport />
    </div>
  );
}

export function ProposalEditor() {
  return (
    <ProposalEditorProvider>
      <EditorBody />
    </ProposalEditorProvider>
  );
}

export default ProposalEditor;
