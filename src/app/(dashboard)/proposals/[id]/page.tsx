'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ProposalPreview } from '@/components/ui/proposal-preview';
import type { ProposalPdfData } from '@/lib/pdf';

interface ProposalItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  markupPercent?: number;
  total: number;
}

interface Proposal {
  id: string;
  number: string;
  title: string;
  status: string;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    legalForm?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: ProposalItem[];
  markupPercent?: number;
  notes?: string;
  validUntil?: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Отправлено', className: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Принято', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонено', className: 'bg-red-100 text-red-700' },
  converted: { label: 'Конвертировано', className: 'bg-purple-100 text-purple-700' },
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`/api/proposals/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data.data || data);
        }
      } catch (err) {
        console.error('Error fetching proposal:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProposal();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это предложение?')) return;
    try {
      const res = await fetch(`/api/proposals/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/proposals');
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Предложение не найдено</p>
        <button
          onClick={() => router.push('/proposals')}
          className="mt-4 text-[var(--primary)] hover:underline"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const status = STATUS_MAP[proposal.status] || { label: proposal.status, className: 'bg-gray-100 text-gray-600' };

  const pdfData: ProposalPdfData = {
    number: proposal.number,
    title: proposal.title,
    status: proposal.status,
    client: proposal.client,
    organization: proposal.organization,
    items: proposal.items,
    markupPercent: proposal.markupPercent,
    notes: proposal.notes,
    validUntil: proposal.validUntil,
    createdAt: proposal.createdAt,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/proposals')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{proposal.title}</h1>
            <p className="text-sm text-gray-500">№ {proposal.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
            {status.label}
          </span>
          <button
            onClick={() => router.push(`/proposals?edit=${proposal.id}`)}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Информация</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Клиент</p>
                <p className="font-medium">
                  {proposal.client
                    ? `${proposal.client.lastName} ${proposal.client.firstName}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Наценка</p>
                <p className="font-medium">{proposal.markupPercent || 0}%</p>
              </div>
              <div>
                <p className="text-gray-500">Создано</p>
                <p className="font-medium">
                  {new Date(proposal.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {proposal.validUntil && (
                <div>
                  <p className="text-gray-500">Действует до</p>
                  <p className="font-medium">
                    {new Date(proposal.validUntil).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
            {proposal.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-gray-500 text-sm">Примечания</p>
                <p className="mt-1 text-sm">{proposal.notes}</p>
              </div>
            )}
          </div>

          {proposal.items && proposal.items.length > 0 && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4">Товары</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2">Наименование</th>
                    <th className="text-right py-2">Кол-во</th>
                    <th className="text-right py-2">Цена</th>
                    <th className="text-right py-2">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.items.map((item, index) => (
                    <tr key={index} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2">{item.name}</td>
                      <td className="text-right py-2">{item.quantity} {item.unit || 'шт'}</td>
                      <td className="text-right py-2">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                      <td className="text-right py-2">{item.total.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="text-right py-2">ИТОГО:</td>
                    <td className="text-right py-2">
                      {proposal.items.reduce((sum, item) => sum + item.total, 0).toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold mb-4">Документы</h2>
            <ProposalPreview data={pdfData} />
          </div>
        </div>
      </div>
    </div>
  );
}
