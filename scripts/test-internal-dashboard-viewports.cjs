const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 4174;
const DIST_DIR = path.resolve('client/dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function createServer() {
  return http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url.includes('/central-orders/summary')) {
        return res.end(JSON.stringify({
          metrics: {
            total_orders: 8, new_orders: 2, confirmed_orders: 1, preparing_orders: 1,
            ready_orders: 1, dispatch_orders: 1, completed_orders: 2, cancelled_orders: 0,
            total_revenue: 16400
          },
          by_source: [{ source: 'table_qr', count: 4, revenue: 8200 }]
        }));
      }
      if (req.url.includes('/central-orders')) {
        return res.end(JSON.stringify([
          {
            id: 'ord-1', order_number: 'ORD-20261108-0001', source: 'table_qr', fulfillment_type: 'dine_in',
            fulfillment_status: 'received', status: 'received', customer_name: 'John Doe', customer_phone: '0712345678',
            table_number: '01', total_amount: 2450, payment_status: 'paid', item_count: 2,
            items_summary: '2x Flame-Grilled Ribeye Steak, 1x Swahili Coconut Curry', created_at: new Date().toISOString()
          }
        ]));
      }
      if (req.url.includes('/tables')) {
        return res.end(JSON.stringify([
          { id: 't1', table_number: '01', name: 'Main Terrace 01', capacity: 4, status: 'available', section_name: 'Terrace' }
        ]));
      }
      if (req.url.includes('/kds/stations')) {
        return res.end(JSON.stringify([{ id: 'st-1', name: 'Hot Grill' }]));
      }
      if (req.url.includes('/kds/tickets')) {
        return res.end(JSON.stringify([]));
      }
      if (req.url.includes('/reports/dashboard')) {
        return res.end(JSON.stringify({ todayRevenue: 24500, todayOrders: 12, avgOrderValue: 2041, kitchenQueue: { pending: 2, preparing: 1, ready: 3 } }));
      }
      if (req.url.includes('/reports/mpesa-recon')) {
        return res.end(JSON.stringify({ summary: { totalReconciled: 24500, completedCount: 12 }, transactions: [] }));
      }
      return res.end(JSON.stringify({ status: 'ok' }));
    }

    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const VIEWPORTS = [320, 375, 430, 768, 1024, 1366, 1920];

async function runInternalAudit() {
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Inject staff user auth into storage
  await context.addInitScript(() => {
    window.localStorage.setItem('sironi_pos_token', 'demo-jwt-token');
    window.localStorage.setItem('sironi_pos_user', JSON.stringify({
      id: 'usr-1',
      name: 'Executive Chef & Manager',
      email: 'admin@hotel.com',
      role: 'hotel_owner',
      tenant_id: 'tenant-grand-heritage'
    }));
  });

  const page = await context.newPage();

  console.log('\n======================================================');
  console.log('   INTERNAL MANAGEMENT DASHBOARD VIEWPORT AUDIT');
  console.log('======================================================\n');

  let failures = 0;

  for (const width of VIEWPORTS) {
    const height = width < 768 ? 844 : 900;
    await page.setViewportSize({ width, height });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const check = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const isOverflowing = scrollW > docW;
      return { docW, scrollW, isOverflowing };
    });

    if (check.isOverflowing) {
      failures++;
      console.log(`❌ Internal Dashboard at ${width}px: OVERFLOW (scrollWidth: ${check.scrollW}px > ${check.docW}px)`);
    } else {
      console.log(`✔ Internal Dashboard at ${width}px: PASS (scrollWidth: ${check.scrollW}px <= ${check.docW}px)`);
    }
  }

  await browser.close();
  server.close();

  console.log(`\nINTERNAL AUDIT COMPLETE: ${VIEWPORTS.length - failures} / ${VIEWPORTS.length} passed.`);
  if (failures > 0) process.exit(1);
}

runInternalAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
