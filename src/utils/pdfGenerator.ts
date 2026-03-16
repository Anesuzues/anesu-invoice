import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row'];
  companies: Database['public']['Tables']['companies']['Row'];
  invoice_items: Database['public']['Tables']['invoice_items']['Row'][];
};

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.companies.name, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (invoice.companies.address) {
    doc.text(invoice.companies.address, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.companies.city && invoice.companies.state) {
    doc.text(`${invoice.companies.city}, ${invoice.companies.state} ${invoice.companies.zip || ''}`, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.companies.email) {
    doc.text(invoice.companies.email, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.companies.phone) {
    doc.text(invoice.companies.phone, 20, yPosition);
    yPosition += 5;
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 20, 30, { align: 'right' });
  doc.text(`Issue Date: ${format(new Date(invoice.issue_date), 'MMM dd, yyyy')}`, pageWidth - 20, 35, { align: 'right' });
  doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}`, pageWidth - 20, 40, { align: 'right' });

  const statusColors: Record<string, [number, number, number]> = {
    draft: [156, 163, 175],
    sent: [59, 130, 246],
    paid: [16, 185, 129],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128]
  };

  const color = statusColors[invoice.status] || [0, 0, 0];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(pageWidth - 45, 43, 25, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.status.toUpperCase(), pageWidth - 32.5, 47.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  yPosition = 60;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clients.name, 20, yPosition);
  yPosition += 5;

  if (invoice.clients.address) {
    doc.text(invoice.clients.address, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.clients.city && invoice.clients.state) {
    doc.text(`${invoice.clients.city}, ${invoice.clients.state} ${invoice.clients.zip || ''}`, 20, yPosition);
    yPosition += 5;
  }
  if (invoice.clients.email) {
    doc.text(invoice.clients.email, 20, yPosition);
    yPosition += 5;
  }

  yPosition = Math.max(yPosition, 80);
  yPosition += 10;

  const tableStartY = yPosition;
  const colWidths = [90, 20, 25, 20, 25];
  const colPositions = [20, 110, 130, 155, 175];

  doc.setFillColor(249, 250, 251);
  doc.rect(20, tableStartY, pageWidth - 40, 8, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', colPositions[0], tableStartY + 5);
  doc.text('Qty', colPositions[1], tableStartY + 5, { align: 'right' });
  doc.text('Price', colPositions[2], tableStartY + 5, { align: 'right' });
  doc.text('Tax', colPositions[3], tableStartY + 5, { align: 'right' });
  doc.text('Amount', colPositions[4], tableStartY + 5, { align: 'right' });

  yPosition = tableStartY + 12;
  doc.setFont('helvetica', 'normal');

  invoice.invoice_items.forEach((item) => {
    const description = item.description;
    const maxWidth = colWidths[0] - 5;
    const lines = doc.splitTextToSize(description, maxWidth);

    lines.forEach((line: string, index: number) => {
      doc.text(line, colPositions[0], yPosition + (index * 5));
    });

    const lineHeight = lines.length * 5;

    doc.text(item.quantity.toString(), colPositions[1], yPosition, { align: 'right' });
    doc.text(`$${item.unit_price.toFixed(2)}`, colPositions[2], yPosition, { align: 'right' });
    doc.text(`${item.tax_rate}%`, colPositions[3], yPosition, { align: 'right' });
    doc.text(`$${item.amount.toFixed(2)}`, colPositions[4], yPosition, { align: 'right' });

    yPosition += Math.max(lineHeight, 5) + 3;

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });

  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 8;

  const totalsX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPosition);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 6;

  doc.text('Tax:', totalsX, yPosition);
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 6;

  if (invoice.discount_amount > 0) {
    doc.text('Discount:', totalsX, yPosition);
    doc.text(`-$${invoice.discount_amount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;
  }

  doc.setLineWidth(1);
  doc.line(totalsX, yPosition, pageWidth - 20, yPosition);
  yPosition += 7;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', totalsX, yPosition);
  doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });

  if (invoice.notes) {
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    noteLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
  }

  if (invoice.terms) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 40);
    termLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
  }

  doc.save(`invoice-${invoice.invoice_number}.pdf`);
}
