'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContractPreview } from '@/components/ui/contract-preview';
import type { ContractPdfData } from '@/lib/pdf';

interface ContractItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

interface Contract {
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
  items: ContractItem[];
  totalAmount: number;
  signedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Активно', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Завершено', className: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700' },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setContract(data.data || data);
        }
      } catch (err) {
        console.error('Error fetching contract:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContract();
    }
  }, [params.id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/contracts/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/contracts');
      }
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Договор не найден</p>
        <button
          onClick={() => router.push('/contracts')}
          className="mt-4 text-[var(--primary)] hover:underline"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const status = STATUS_MAP[contract.status] || { label: contract.status, className: 'bg-gray-100 text-gray-600' };

  const pdfData: ContractPdfData = {
    number: contract.number,
    title: contract.title,
    status: contract.status,
    client: contract.client,
    organization: contract.organization,
    items: contract.items,
    totalAmount: contract.totalAmount,
    signedAt: contract.signedAt,
    expiresAt: contract.expiresAt,
    notes: contract.notes,
    createdAt: contract.createdAt,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/contracts')}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{contract.title}</h1>
            <p className="text-sm text-gray-500">№ {contract.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
            {status.label}
          </span>
          <button
            onClick={() => router.push(`/contracts?edit=${contract.id}`)}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
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
                <p className="text-gray-500">Заказчик</p>
                <p className="font-medium">
                  {contract.client
                    ? `${contract.client.lastName} ${contract.client.firstName}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Сумма</p>
                <p className="font-medium">{contract.totalAmount.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-gray-500">Создан</p>
                <p className="font-medium">
                  {new Date(contract.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              {contract.signedAt && (
                <div>
                  <p className="text-gray-500">Подписан</p>
                  <p className="font-medium">
                    {new Date(contract.signedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              {contract.expiresAt && (
                <div>
                  <p className="text-gray-500">Действует до</p>
                  <p className="font-medium">
                    {new Date(contract.expiresAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
            {contract.notes && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-gray-500 text-sm">Примечания</p>
                <p className="mt-1 text-sm">{contract.notes}</p>
              </div>
            )}
          </div>

          {contract.items && contract.items.length > 0 && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold mb-4">Позиции</h2>
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
                  {contract.items.map((item, index) => (
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
                      {contract.totalAmount.toLocaleString('ru-RU')} ₽
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
            <ContractPreview data={pdfData} />
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDelete}
        title="Удалить договор?"
        message="Это действие нельзя отменить. Все позиции договора будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
