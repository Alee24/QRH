import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1c1917',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1c1917',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

export async function generateTableTentPdf(table: {
  table_number: string;
  name: string;
  hotel_name?: string;
  qr_token: string;
  baseUrl: string;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'portrait',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const targetUrl = `${table.baseUrl}/order/${table.qr_token}`;
      const qrBuf = await generateQrBuffer(targetUrl);

      // Card Design
      // Header
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(2)
        .strokeColor('#ca8a26')
        .stroke();

      doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48)
        .lineWidth(0.5)
        .strokeColor('#e7e5e4')
        .stroke();

      const hotelTitle = (table.hotel_name && !table.hotel_name.includes('Grand Heritage')
        ? table.hotel_name
        : 'SIRONI RESTAURANTS').toUpperCase();

      doc.moveDown(1.2);
      doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#78350f')
        .text(hotelTitle, { align: 'center', characterSpacing: 1.5 });

      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#78716c')
        .text('CONTEMPORARY CHARCOAL DINING & CRAFT BAR', { align: 'center', characterSpacing: 2 });

      doc.moveDown(0.8);
      doc.fontSize(11)
        .fillColor('#ca8a26')
        .text('~ SCAN TO OPEN MENU & PAY WITH M-PESA ~', { align: 'center' });

      doc.moveDown(1.2);

      // Big QR Code
      const qrSize = 185;
      const x = (doc.page.width - qrSize) / 2;
      doc.image(qrBuf, x, doc.y, { width: qrSize, height: qrSize });
      doc.y += qrSize + 14;

      // Prominent Table Number Badge
      doc.font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#1c1917')
        .text(`SIRONI TABLE ${table.table_number}`, { align: 'center' });

      doc.font('Helvetica')
        .fontSize(10.5)
        .fillColor('#57534e')
        .text(table.name || 'Main Dining Hall', { align: 'center' });

      doc.moveDown(1.0);
      doc.font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#ca8a26')
        .text('HOW IT WORKS', { align: 'center' });

      doc.font('Helvetica')
        .fontSize(8.5)
        .fillColor('#78716c')
        .text('1. Point your smartphone camera at this QR code.\n2. Tap the link to open the live interactive menu.\n3. Key in your M-Pesa phone number to complete payment.\n4. Your order is instantly routed to our culinary team!', {
          align: 'center',
          lineGap: 3,
        });

      doc.moveDown(0.8);
      doc.fontSize(8)
        .fillColor('#a8a29e')
        .text('Free Guest Wi-Fi: Sironi-Guest | Password: sironiguest', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

