import { Router } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const reportRouter = Router();

// Executive Dashboard KPIs
reportRouter.get('/dashboard', authenticate, (req, res) => {
  // Today's total sales
  const salesRow = queryOne(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as today_sales,
      COUNT(*) as total_orders,
      COALESCE(AVG(total_amount), 0) as avg_order_value
    FROM orders
    WHERE status != 'cancelled' AND created_at >= date('now')
  `);

  // Table status summary
  const tableSummary = queryAll(`
    SELECT status, COUNT(*) as count
    FROM restaurant_tables
    WHERE is_active = 1
    GROUP BY status
  `);

  // Kitchen queue
  const kitchenQueue = queryOne(`
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready
    FROM kitchen_tickets
    WHERE status IN ('pending', 'preparing', 'ready')
  `);

  // Top Selling Items Today
  const topItems = queryAll(`
    SELECT oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.total_price) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY oi.item_name
    ORDER BY total_qty DESC
    LIMIT 5
  `);

  // Sales by Category
  const categorySales = queryAll(`
    SELECT c.name as category_name, COALESCE(SUM(oi.total_price), 0) as revenue
    FROM menu_categories c
    LEFT JOIN menu_items mi ON c.id = mi.category_id
    LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
    GROUP BY c.id
    ORDER BY revenue DESC
  `);

  // Sales by Payment Method
  const paymentMethods = queryAll(`
    SELECT method, SUM(amount) as total_amount, COUNT(*) as txn_count
    FROM payments
    WHERE status = 'completed'
    GROUP BY method
  `);

  // Unsettled Balances
  const balanceRow = queryOne(`
    SELECT COALESCE(SUM(balance_amount), 0) as outstanding_balance
    FROM table_sessions
    WHERE status IN ('active', 'bill_requested')
  `);

  res.json({
    todayRevenue: Number(salesRow?.today_sales || 0),
    todayOrders: Number(salesRow?.total_orders || 0),
    avgOrderValue: Math.round(Number(salesRow?.avg_order_value || 0)),
    outstandingBalance: Number(balanceRow?.outstanding_balance || 0),
    tableStatus: tableSummary,
    kitchenQueue: {
      pending: Number(kitchenQueue?.pending || 0),
      preparing: Number(kitchenQueue?.preparing || 0),
      ready: Number(kitchenQueue?.ready || 0),
    },
    topItems,
    categorySales,
    paymentMethods,
  });
});

// Detailed Sales History with date filtering
reportRouter.get('/sales', authenticate, (req, res) => {
  const { startDate, endDate } = req.query;

  let sql = `
    SELECT 
      o.id, o.order_number, o.created_at, o.total_amount, o.status, o.payment_status, o.source,
      t.table_number, s.session_code
    FROM orders o
    JOIN restaurant_tables t ON o.table_id = t.id
    JOIN table_sessions s ON o.table_session_id = s.id
    WHERE o.status != 'cancelled'
  `;
  const params: any[] = [];

  if (startDate) {
    sql += ' AND o.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND o.created_at <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY o.created_at DESC LIMIT 100';
  const orders = queryAll(sql, params);

  res.json(orders);
});

// M-Pesa Reconciliation Report
reportRouter.get('/mpesa-reconciliation', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'accountant', 'auditor']), (req, res) => {
  const mpesaTxs = queryAll(`
    SELECT 
      mt.*, ts.session_code, rt.table_number
    FROM mpesa_transactions mt
    LEFT JOIN payments p ON mt.payment_id = p.id
    LEFT JOIN table_sessions ts ON p.table_session_id = ts.id
    LEFT JOIN restaurant_tables rt ON ts.table_id = rt.id
    ORDER BY mt.created_at DESC
    LIMIT 50
  `);

  const summary = queryOne(`
    SELECT 
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_reconciled,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
    FROM mpesa_transactions
  `);

  res.json({
    summary: {
      totalReconciled: Number(summary?.total_reconciled || 0),
      completedCount: Number(summary?.completed_count || 0),
      failedCount: Number(summary?.failed_count || 0),
    },
    transactions: mpesaTxs,
  });
});

// CSV Export for Sales
reportRouter.get('/export/sales.csv', authenticate, (req, res) => {
  const orders = queryAll(`
    SELECT o.order_number, t.table_number, o.created_at, o.source, o.total_amount, o.payment_status, o.status
    FROM orders o
    JOIN restaurant_tables t ON o.table_id = t.id
    WHERE o.status != 'cancelled'
    ORDER BY o.created_at DESC
  `);

  let csv = 'Order Number,Table,Date Time,Source,Total (KES),Payment Status,Fulfillment Status\n';
  for (const o of orders) {
    csv += `"${o.order_number}","${o.table_number}","${o.created_at}","${o.source}",${o.total_amount},"${o.payment_status}","${o.status}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
  res.send(csv);
});
