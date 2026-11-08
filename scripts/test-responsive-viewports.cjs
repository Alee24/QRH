const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 4173;
const DIST_DIR = path.resolve('client/dist');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 1. Static file server for client/dist (with SPA fallback to index.html)
function createServer() {
  return http.createServer((req, res) => {
    // API mock response for testing frontend without backend running
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
          },
          {
            id: 'ord-2', order_number: 'ORD-20261108-0002', source: 'delivery', fulfillment_type: 'delivery',
            fulfillment_status: 'preparing', status: 'preparing', customer_name: 'Sarah Kimani', customer_phone: '0799887766',
            delivery_address: 'Kilimani, Ring Road, Mimosa Court Apt 4B', total_amount: 3800, payment_status: 'paid',
            item_count: 3, items_summary: '1x Seafood Platter, 2x Passion Mojito', created_at: new Date().toISOString()
          }
        ]));
      }
      if (req.url.includes('/tables')) {
        return res.end(JSON.stringify([
          { id: 't1', table_number: '01', name: 'Main Terrace 01', capacity: 4, status: 'available', section_name: 'Terrace' },
          { id: 't2', table_number: '02', name: 'Bar Lounge 02', capacity: 2, status: 'occupied', section_name: 'Bar' },
          { id: 't3', table_number: '03', name: 'Private Room 01', capacity: 8, status: 'available', section_name: 'VIP' }
        ]));
      }
      if (req.url.includes('/menu')) {
        return res.end(JSON.stringify({ categories: [] }));
      }
      return res.end(JSON.stringify({ status: 'ok' }));
    }

    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      } else {
        filePath = path.join(DIST_DIR, 'index.html');
      }
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

// 2. Viewport test runner
const VIEWPORTS = [
  320, 360, 375, 390, 430, 600, 768, 900, 1024, 1280, 1366, 1440, 1920
];

async function runViewportAudit() {
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test preview server running on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n======================================================');
  console.log('   RESPONSIVE VIEWPORT & OVERFLOW AUDIT VERIFICATION');
  console.log('======================================================\n');

  let totalFailures = 0;
  const auditResults = [];

  for (const width of VIEWPORTS) {
    const height = width < 768 ? 844 : 900;
    await page.setViewportSize({ width, height });

    // Test 1: Sironi Guest Home & Public Website
    await page.goto(`http://localhost:${PORT}/?t=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const isOverflowing = scrollWidth > docWidth || bodyScrollWidth > docWidth;

      // Find overflowing elements
      const overflowingElements = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '';
          overflowingElements.push(`${tag}.${cls} (right: ${Math.round(rect.right)}px > ${docWidth}px)`);
          if (overflowingElements.length >= 3) break;
        }
      }

      return {
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        isOverflowing,
        overflowingElements
      };
    });

    // Test 2: Navigate to Customer Table Self-Ordering View
    await page.goto(`http://localhost:${PORT}/order/demo-token?t=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const orderOverflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const isOverflowing = scrollWidth > docWidth;
      return { docWidth, scrollWidth, isOverflowing };
    });

    const passed = !overflowInfo.isOverflowing && !orderOverflowInfo.isOverflowing;
    if (!passed) {
      totalFailures++;
      console.log(`❌ Viewport ${width}px: OVERFLOW DETECTED (ScrollWidth: ${overflowInfo.scrollWidth}px vs Viewport: ${width}px)`);
      if (overflowInfo.overflowingElements.length > 0) {
        console.log(`   Overflowing culprits:`, overflowInfo.overflowingElements);
      }
    } else {
      console.log(`✔ Viewport ${width}px: PASS (ScrollWidth: ${overflowInfo.scrollWidth}px <= Viewport: ${width}px, Zero page overflow)`);
    }

    auditResults.push({
      width,
      passed,
      scrollWidth: overflowInfo.scrollWidth,
      orderScrollWidth: orderOverflowInfo.scrollWidth,
    });
  }

  await browser.close();
  server.close();

  console.log('\n======================================================');
  console.log(`AUDIT COMPLETE: ${VIEWPORTS.length - totalFailures} / ${VIEWPORTS.length} viewports PASSED.`);
  console.log('======================================================\n');

  if (totalFailures > 0) {
    process.exit(1);
  }
}

runViewportAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
