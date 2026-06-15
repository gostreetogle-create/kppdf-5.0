import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ProposalPdfData {
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
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    markupPercent?: number;
    total: number;
  }>;
  markupPercent?: number;
  notes?: string;
  validUntil?: string;
  createdAt: string;
}

export interface ContractPdfData {
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
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  signedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export async function generateProposalPdf(data: ProposalPdfData): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  doc.setFont('helvetica');

  if (data.organization) {
    doc.setFontSize(10);
    doc.text(data.organization.name, margin, y);
    y += 5;
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}  КПП: ${data.organization.kpp || '—'}`, margin, y);
      y += 5;
    }
    if (data.organization.legalAddress) {
      doc.text(`Адрес: ${data.organization.legalAddress}`, margin, y);
      y += 5;
    }
    if (data.organization.phone || data.organization.email) {
      doc.text(`Тел: ${data.organization.phone || '—'}  Email: ${data.organization.email || '—'}`, margin, y);
      y += 5;
    }
  }

  y += 10;
  doc.setFontSize(16);
  doc.text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.text(`№ ${data.number}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`от ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  if (data.client) {
    doc.setFontSize(10);
    doc.text('Клиент:', margin, y);
    y += 5;
    doc.text(`${data.client.lastName} ${data.client.firstName} ${data.client.patronymic || ''}`, margin, y);
    y += 5;
    if (data.client.phone) {
      doc.text(`Тел: ${data.client.phone}`, margin, y);
      y += 5;
    }
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`, margin, y);
      y += 5;
    }
  }

  y += 5;
  doc.setFontSize(10);
  doc.text(`Наименование: ${data.title}`, margin, y);
  y += 10;

  if (data.items && data.items.length > 0) {
    const tableStartY = y;
    const colWidths = [80, 25, 20, 30, 35];
    const headers = ['Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма'];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 2, y + 4);
      x += colWidths[i];
    });
    y += 6;

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    data.items.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      x = margin;
      doc.text(item.name.substring(0, 40), x + 2, y + 4);
      x += colWidths[0];
      doc.text(String(item.quantity), x + 2, y + 4);
      x += colWidths[1];
      doc.text(item.unit || 'шт', x + 2, y + 4);
      x += colWidths[2];
      doc.text(formatCurrency(item.unitPrice), x + 2, y + 4);
      x += colWidths[3];
      doc.text(formatCurrency(item.total), x + 2, y + 4);
      y += 6;
    });

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 5;

    const total = data.items.reduce((sum, item) => sum + item.total, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`ИТОГО: ${formatCurrency(total)} руб.`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y + 4);
    y += 10;
  }

  if (data.markupPercent && data.markupPercent > 0) {
    doc.setFontSize(10);
    doc.text(`Наценка: ${data.markupPercent}%`, margin, y);
    y += 8;
  }

  if (data.validUntil) {
    doc.setFontSize(10);
    doc.text(`Действительно до: ${formatDate(data.validUntil)}`, margin, y);
    y += 8;
  }

  if (data.notes) {
    doc.setFontSize(10);
    doc.text('Примечания:', margin, y);
    y += 5;
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5;
  }

  y += 15;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(10);
  doc.text('Подпись: ___________________', margin, y);
  y += 8;
  if (data.organization?.signerName) {
    doc.text(`${data.organization.signerPosition || ''} ${data.organization.signerName}`, margin, y);
  }

  return doc;
}

export async function generateContractPdf(data: ContractPdfData): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  doc.setFont('helvetica');

  if (data.organization) {
    doc.setFontSize(10);
    doc.text(data.organization.name, margin, y);
    y += 5;
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}  КПП: ${data.organization.kpp || '—'}`, margin, y);
      y += 5;
    }
    if (data.organization.legalAddress) {
      doc.text(`Адрес: ${data.organization.legalAddress}`, margin, y);
      y += 5;
    }
  }

  y += 10;
  doc.setFontSize(16);
  doc.text('ДОГОВОР', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.text(`№ ${data.number}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`от ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.text(`Наименование: ${data.title}`, margin, y);
  y += 8;

  if (data.client) {
    doc.text('Заказчик:', margin, y);
    y += 5;
    doc.text(`${data.client.lastName} ${data.client.firstName} ${data.client.patronymic || ''}`, margin, y);
    y += 5;
    if (data.client.phone) {
      doc.text(`Тел: ${data.client.phone}`, margin, y);
      y += 5;
    }
  }

  y += 5;

  if (data.items && data.items.length > 0) {
    const colWidths = [80, 25, 20, 35];
    const headers = ['Наименование', 'Кол-во', 'Ед.', 'Сумма'];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 2, y + 4);
      x += colWidths[i];
    });
    y += 6;

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    data.items.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      x = margin;
      doc.text(item.name.substring(0, 40), x + 2, y + 4);
      x += colWidths[0];
      doc.text(String(item.quantity), x + 2, y + 4);
      x += colWidths[1];
      doc.text(item.unit || 'шт', x + 2, y + 4);
      x += colWidths[2];
      doc.text(formatCurrency(item.total), x + 2, y + 4);
      y += 6;
    });

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`ИТОГО: ${formatCurrency(data.totalAmount)} руб.`, margin + colWidths[0] + colWidths[1] + colWidths[2], y + 4);
    y += 10;
  }

  if (data.signedAt) {
    doc.setFontSize(10);
    doc.text(`Дата подписания: ${formatDate(data.signedAt)}`, margin, y);
    y += 8;
  }

  if (data.expiresAt) {
    doc.text(`Действует до: ${formatDate(data.expiresAt)}`, margin, y);
    y += 8;
  }

  if (data.notes) {
    doc.text('Примечания:', margin, y);
    y += 5;
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5;
  }

  y += 15;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(10);
  doc.text('ЗАКАЗЧИК:', margin, y);
  doc.text('ИСПОЛНИТЕЛЬ:', pageWidth / 2, y);
  y += 8;
  doc.text('___________________', margin, y);
  doc.text('___________________', pageWidth / 2, y);
  y += 5;
  if (data.client) {
    doc.text(`${data.client.lastName} ${data.client.firstName}`, margin, y);
  }
  if (data.organization?.signerName) {
    doc.text(data.organization.signerName, pageWidth / 2, y);
  }

  return doc;
}

export interface InvoicePdfData {
  number: string;
  title: string;
  status: string;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  doc.setFont('helvetica');

  if (data.organization) {
    doc.setFontSize(10);
    doc.text(data.organization.name, margin, y);
    y += 5;
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}  КПП: ${data.organization.kpp || '—'}`, margin, y);
      y += 5;
    }
    if (data.organization.legalAddress) {
      doc.text(`Адрес: ${data.organization.legalAddress}`, margin, y);
      y += 5;
    }
    if (data.organization.phone || data.organization.email) {
      doc.text(`Тел: ${data.organization.phone || '—'}  Email: ${data.organization.email || '—'}`, margin, y);
      y += 5;
    }
  }

  y += 10;
  doc.setFontSize(16);
  doc.text('СЧЁТ-ФАКТУРА', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.text(`№ ${data.number}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`от ${formatDate(data.createdAt)}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  if (data.client) {
    doc.setFontSize(10);
    doc.text('Покупатель:', margin, y);
    y += 5;
    doc.text(`${data.client.lastName} ${data.client.firstName} ${data.client.patronymic || ''}`, margin, y);
    y += 5;
    if (data.client.phone) {
      doc.text(`Тел: ${data.client.phone}`, margin, y);
      y += 5;
    }
  }

  y += 5;

  if (data.items && data.items.length > 0) {
    const colWidths = [80, 25, 20, 30, 35];
    const headers = ['Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма'];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 2, y + 4);
      x += colWidths[i];
    });
    y += 6;

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    data.items.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      x = margin;
      doc.text(item.name.substring(0, 40), x + 2, y + 4);
      x += colWidths[0];
      doc.text(String(item.quantity), x + 2, y + 4);
      x += colWidths[1];
      doc.text(item.unit || 'шт', x + 2, y + 4);
      x += colWidths[2];
      doc.text(formatCurrency(item.unitPrice), x + 2, y + 4);
      x += colWidths[3];
      doc.text(formatCurrency(item.total), x + 2, y + 4);
      y += 6;
    });

    doc.setDrawColor(200);
    doc.line(margin, y, margin + colWidths.reduce((a, b) => a + b, 0), y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`ИТОГО: ${formatCurrency(data.totalAmount)} руб.`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y + 4);
    y += 10;
  }

  if (data.organization?.bankName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Реквизиты для оплаты:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Банк: ${data.organization.bankName}`, margin, y);
    y += 5;
    if (data.organization.bankBik) doc.text(`БИК: ${data.organization.bankBik}`, margin, y);
    y += 5;
    if (data.organization.bankAccount) doc.text(`Счёт: ${data.organization.bankAccount}`, margin, y);
    y += 5;
    if (data.organization.inn) doc.text(`ИНН: ${data.organization.inn}`, margin, y);
    y += 8;
  }

  if (data.notes) {
    doc.setFontSize(10);
    doc.text('Примечания:', margin, y);
    y += 5;
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5;
  }

  y += 15;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(10);
  doc.text('Подпись: ___________________', margin, y);
  y += 8;
  if (data.organization?.signerName) {
    doc.text(`${data.organization.signerPosition || ''} ${data.organization.signerName}`, margin, y);
  }

  return doc;
}

export async function generatePdfFromHtml(elementId: string): Promise<jsPDF> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  return pdf;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
