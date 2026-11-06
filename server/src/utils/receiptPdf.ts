import PDFDocument from 'pdfkit';

export interface ReceiptOrderData {
  order_number: string;
  table_number: string;
  table_name?: string;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  items: Array<{
    name?: string;
    item_name?: string;
    portion_name?: string;
    quantity: number;
    portion_price?: number;
    unit_price?: number;
    total_price?: number;
    modifiers?: any;
    notes?: string;
  }>;
}

export async function generateOrderReceiptPdf(order: ReceiptOrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'portrait',
        margins: { top: 25, bottom: 25, left: 25, right: 25 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const margin = 25;
      const contentWidth = pageWidth - margin * 2;

      // Outer border
      doc.rect(15, 15, pageWidth - 30, doc.page.height - 30)
        .lineWidth(1)
        .strokeColor('#e7e5e4')
        .stroke();

      // Brand Header
      doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#78350f')
        .text('SIRONI RESTAURANTS', { align: 'center', characterSpacing: 1.5 });

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#78716c')
        .text('CONTEMPORARY CHARCOAL DINING & CRAFT BAR', { align: 'center', characterSpacing: 1 });

      doc.fontSize(8)
        .fillColor('#a8a29e')
        .text('Westlands Rooftop & Kilimani Garden, Nairobi • Tel: +254 700 123 456', { align: 'center' });

      doc.moveDown(0.8);

      // Sironi Table Banner
      const bannerY = doc.y;
      doc.rect(margin, bannerY, contentWidth, 34)
        .fillColor('#1c1917')
        .fill();

      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#ffffff')
        .text(`SIRONI TABLE ${order.table_number}`, margin, bannerY + 6, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 1,
        });

      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor('#ca8a26')
        .text('OFFICIAL DINING GUEST RECEIPT', margin, bannerY + 21, {
          width: contentWidth,
          align: 'center',
        });

      doc.y = bannerY + 42;

      // Order Details Grid
      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor('#57534e');

      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2 + 5;
      const metaY = doc.y;

      const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

      doc.text(`Receipt / Order: ${order.order_number}`, col1X, metaY);
      doc.text(`Date: ${dateStr}`, col1X, metaY + 12);
      doc.text(`Table: Sironi Table ${order.table_number}`, col1X, metaY + 24);

      doc.text(`Guest: ${order.customer_name || 'Guest'}`, col2X, metaY);
      doc.text(`M-Pesa Phone: ${order.customer_phone || 'M-Pesa Customer'}`, col2X, metaY + 12);
      doc.text(`Payment: M-PESA STK (PAID)`, col2X, metaY + 24);

      doc.y = metaY + 42;

      // Divider
      doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .lineWidth(0.5)
        .strokeColor('#d6d3d1')
        .stroke();

      doc.moveDown(0.5);

      // Table Header
      const headerY = doc.y;
      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1c1917');

      doc.text('ITEM DESCRIPTION', margin + 5, headerY, { width: 190 });
      doc.text('QTY', margin + 200, headerY, { width: 35, align: 'center' });
      doc.text('PRICE (KES)', margin + 240, headerY, { width: 60, align: 'right' });
      doc.text('TOTAL (KES)', margin + 305, headerY, { width: 65, align: 'right' });

      doc.y = headerY + 14;
      doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .lineWidth(0.5)
        .strokeColor('#e7e5e4')
        .stroke();

      doc.moveDown(0.4);

      // Items Rows
      doc.font('Helvetica').fontSize(8.5).fillColor('#292524');

      let currentY = doc.y;
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const itemName = item.name || item.item_name || 'Gourmet Dish';
          const portion = item.portion_name ? ` (${item.portion_name})` : '';
          const unitPrice = item.portion_price || item.unit_price || 0;
          const totalLinePrice = item.total_price || unitPrice * item.quantity;

          doc.font('Helvetica-Bold').text(`${itemName}${portion}`, margin + 5, currentY, { width: 190 });
          doc.font('Helvetica').text(String(item.quantity), margin + 200, currentY, { width: 35, align: 'center' });
          doc.text(unitPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 }), margin + 240, currentY, { width: 60, align: 'right' });
          doc.font('Helvetica-Bold').text(totalLinePrice.toLocaleString('en-KE', { minimumFractionDigits: 2 }), margin + 305, currentY, { width: 65, align: 'right' });

          currentY += 14;

          if (item.notes) {
            doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#78716c');
            doc.text(`Note: ${item.notes}`, margin + 12, currentY, { width: 180 });
            doc.font('Helvetica').fontSize(8.5).fillColor('#292524');
            currentY += 11;
          }
        }
      }

      doc.y = currentY + 6;
      doc.moveTo(margin, doc.y)
        .lineTo(pageWidth - margin, doc.y)
        .lineWidth(0.5)
        .strokeColor('#d6d3d1')
        .stroke();

      doc.moveDown(0.5);

      // Totals Box
      const totalsY = doc.y;
      const rightColX = margin + 190;
      const valueColX = margin + 285;
      const colW = 85;

      doc.font('Helvetica').fontSize(8.5).fillColor('#57534e');
      doc.text('Subtotal:', rightColX, totalsY, { width: 90, align: 'right' });
      doc.text(`KES ${(order.subtotal || order.total_amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, valueColX, totalsY, { width: colW, align: 'right' });

      doc.text('VAT 16% (Included):', rightColX, totalsY + 13, { width: 90, align: 'right' });
      doc.text(`KES ${(order.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, valueColX, totalsY + 13, { width: colW, align: 'right' });

      // Grand Total Highlight
      const grandTotalY = totalsY + 28;
      doc.rect(rightColX - 10, grandTotalY - 3, contentWidth - (rightColX - 10 - margin), 22)
        .fillColor('#f5f5f4')
        .fill();

      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#78350f');
      doc.text('TOTAL PAID:', rightColX, grandTotalY + 3, { width: 90, align: 'right' });
      doc.text(`KES ${order.total_amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`, valueColX, grandTotalY + 3, { width: colW, align: 'right' });

      doc.y = grandTotalY + 35;

      // M-Pesa Confirmation Banner
      const mpesaY = doc.y;
      doc.rect(margin, mpesaY, contentWidth, 24)
        .fillColor('#ecfdf5')
        .strokeColor('#a7f3d0')
        .lineWidth(0.5)
        .fillAndStroke();

      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#065f46')
        .text('SAFARICOM M-PESA PAYMENT VERIFIED & SETTLED', margin, mpesaY + 7, {
          width: contentWidth,
          align: 'center',
        });

      doc.y = mpesaY + 32;

      // Footer
      doc.font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#ca8a26')
        .text('THANK YOU FOR DINING AT SIRONI RESTAURANTS', { align: 'center' });

      doc.font('Helvetica')
        .fontSize(7.5)
        .fillColor('#a8a29e')
        .text('Fresh Woodfire Culinary Craftsmanship • Please Visit Us Again', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
