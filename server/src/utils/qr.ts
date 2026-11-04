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

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#78350f')
        .text(table.hotel_name || 'GRAND HERITAGE HOTEL & RESTAURANT', { align: 'center', characterSpacing: 1 });

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#78716c')
        .text('FINE DINING & ARTISAN COCKTAILS', { align: 'center', characterSpacing: 2 });

      doc.moveDown(1);
      doc.fontSize(12)
        .fillColor('#ca8a26')
        .text('~ SCAN TO ORDER & PAY ~', { align: 'center' });

      doc.moveDown(1.5);

      // Big QR Code
      const qrSize = 180;
      const x = (doc.page.width - qrSize) / 2;
      doc.image(qrBuf, x, doc.y, { width: qrSize, height: qrSize });
      doc.y += qrSize + 15;

      // Table Number Badge
      doc.font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#1c1917')
        .text(`TABLE ${table.table_number}`, { align: 'center' });

      doc.font('Helvetica')
        .fontSize(11)
        .fillColor('#57534e')
        .text(table.name, { align: 'center' });

      doc.moveDown(1.2);
      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#ca8a26')
        .text('HOW IT WORKS', { align: 'center' });

      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#78716c')
        .text('1. Point your phone camera at the QR code above.\n2. Tap the link to open our interactive digital menu.\n3. Customize your dishes & submit directly to the kitchen.\n4. Relax while our chefs prepare your meal!', {
          align: 'center',
          lineGap: 3,
        });

      doc.moveDown(1);
      doc.fontSize(8)
        .fillColor('#a8a29e')
        .text('Free Guest Wi-Fi: GrandHeritage-Guest | Password: heritageguest', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

