'use client';

// Cycle 44 (B.3 Block 3.1): thin wrapper for /proposals/new.
//
// Вся логика вынесена в <ProposalEditor /> (src/components/proposal-editor/).
// Документ-обёртка ≤100 строк (per spec audit-tasks.md Block 3.1 AC).
//
// Future: <ProposalEditor mode="edit" /> для /proposals/[id]/edit (out of scope
// для cycles 44-45 — зарезервировано для следующего тех-цикла).

import { ProposalEditor } from '@/components/proposal-editor';

export default function NewProposalPage() {
  return <ProposalEditor />;
}
