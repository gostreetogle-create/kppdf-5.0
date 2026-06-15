'use client';

import { DocPreview } from '@/components/ui/doc-preview';
import { generateContractPdf, downloadPdf, type ContractPdfData } from '@/lib/pdf';

interface ContractPreviewProps {
  data: ContractPdfData;
}

export function ContractPreview({ data }: ContractPreviewProps) {
  const handleDownload = async () => {
    const doc = await generateContractPdf(data);
    downloadPdf(doc, `Договор-${data.number}.pdf`);
  };

  return (
    <DocPreview title={`Договор ${data.number}`} onDownload={handleDownload} downloadLabel="Скачать договор">
      <div className="space-y-6 font-sans text-sm">
        {data.organization && (
          <div className="text-xs text-gray-600">
            <p className="font-medium">{data.organization.name}</p>
            {data.organization.inn && <p>ИНН: {data.organization.inn}  КПП: {data.organization.kpp || '—'}</p>}
            {data.organization.legalAddress && <p>Адрес: {data.organization.legalAddress}</p>}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xl font-bold">ДОГОВОР</h1>
          <p className="text-lg">№ {data.number}</p>
          <p className="text-sm text-gray-500">от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>

        <div>
          <p><span className="font-medium">Наименование:</span> {data.title}</p>
        </div>

        {data.client && (
          <div className="border-b pb-4">
            <p className="font-medium">Заказчик:</p>
            <p>{data.client.lastName} {data.client.firstName} {data.client.patronymic || ''}</p>
            {data.client.phone && <p>Тел: {data.client.phone}</p>}
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Наименование</th>
                <th className="border p-2 text-right">Кол-во</th>
                <th className="border p-2 text-center">Ед.</th>
                <th className="border p-2 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 text-right">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.unit || 'шт'}</td>
                  <td className="border p-2 text-right">{item.total.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={3} className="border p-2 text-right">ИТОГО:</td>
                <td className="border p-2 text-right">{data.totalAmount.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        )}

        {data.signedAt && (
          <p><span className="font-medium">Дата подписания:</span> {new Date(data.signedAt).toLocaleDateString('ru-RU')}</p>
        )}

        {data.expiresAt && (
          <p><span className="font-medium">Действует до:</span> {new Date(data.expiresAt).toLocaleDateString('ru-RU')}</p>
        )}

        {data.notes && (
          <div>
            <p className="font-medium">Примечания:</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="pt-8 border-t grid grid-cols-2 gap-8">
          <div>
            <p className="font-medium">ЗАКАЗЧИК:</p>
            <p className="mt-4">___________________</p>
            {data.client && (
              <p className="mt-2">{data.client.lastName} {data.client.firstName}</p>
            )}
          </div>
          <div>
            <p className="font-medium">ИСПОЛНИТЕЛЬ:</p>
            <p className="mt-4">___________________</p>
            {data.organization?.signerName && (
              <p className="mt-2">{data.organization.signerName}</p>
            )}
          </div>
        </div>
      </div>
    </DocPreview>
  );
}
