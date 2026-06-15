'use client';

import { DocPreview } from '@/components/ui/doc-preview';
import { generateProposalPdf, downloadPdf, type ProposalPdfData } from '@/lib/pdf';

interface ProposalPreviewProps {
  data: ProposalPdfData;
}

export function ProposalPreview({ data }: ProposalPreviewProps) {
  const handleDownload = async () => {
    const doc = await generateProposalPdf(data);
    downloadPdf(doc, `КП-${data.number}.pdf`);
  };

  const total = data.items?.reduce((sum, item) => sum + item.total, 0) || 0;

  return (
    <DocPreview title={`КП ${data.number}`} onDownload={handleDownload} downloadLabel="Скачать КП">
      <div className="space-y-6 font-sans text-sm">
        {data.organization && (
          <div className="text-xs text-gray-600">
            <p className="font-medium">{data.organization.name}</p>
            {data.organization.inn && <p>ИНН: {data.organization.inn}  КПП: {data.organization.kpp || '—'}</p>}
            {data.organization.legalAddress && <p>Адрес: {data.organization.legalAddress}</p>}
            {(data.organization.phone || data.organization.email) && (
              <p>Тел: {data.organization.phone || '—'}  Email: {data.organization.email || '—'}</p>
            )}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xl font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
          <p className="text-lg">№ {data.number}</p>
          <p className="text-sm text-gray-500">от {new Date(data.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>

        {data.client && (
          <div className="border-b pb-4">
            <p className="font-medium">Клиент:</p>
            <p>{data.client.lastName} {data.client.firstName} {data.client.patronymic || ''}</p>
            {data.client.phone && <p>Тел: {data.client.phone}</p>}
            {data.client.email && <p>Email: {data.client.email}</p>}
          </div>
        )}

        <div>
          <p><span className="font-medium">Наименование:</span> {data.title}</p>
        </div>

        {data.items && data.items.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Наименование</th>
                <th className="border p-2 text-right">Кол-во</th>
                <th className="border p-2 text-center">Ед.</th>
                <th className="border p-2 text-right">Цена</th>
                <th className="border p-2 text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 text-right">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.unit || 'шт'}</td>
                  <td className="border p-2 text-right">{item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                  <td className="border p-2 text-right">{item.total.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={4} className="border p-2 text-right">ИТОГО:</td>
                <td className="border p-2 text-right">{total.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        )}

        {data.markupPercent && data.markupPercent > 0 && (
          <p><span className="font-medium">Наценка:</span> {data.markupPercent}%</p>
        )}

        {data.validUntil && (
          <p><span className="font-medium">Действительно до:</span> {new Date(data.validUntil).toLocaleDateString('ru-RU')}</p>
        )}

        {data.notes && (
          <div>
            <p className="font-medium">Примечания:</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="pt-8 border-t">
          <p>Подпись: ___________________</p>
          {data.organization?.signerName && (
            <p className="mt-2">{data.organization.signerPosition || ''} {data.organization.signerName}</p>
          )}
        </div>
      </div>
    </DocPreview>
  );
}
