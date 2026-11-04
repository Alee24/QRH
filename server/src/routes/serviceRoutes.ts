import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';
import { KdsService } from '../modules/kds/kdsService.js';
import { authenticate } from '../middleware/auth.js';

export const serviceRouter = Router();

// Ready items awaiting delivery to tables
serviceRouter.get('/ready-tickets', (req, res) => {
  const readyTickets = queryAll(`
    SELECT 
      kt.*,
      ks.name as station_name,
      ks.color_code as station_color,
      o.order_number,
      t.name as table_name
    FROM kitchen_tickets kt
    JOIN kitchen_stations ks ON kt.station_id = ks.id
    JOIN orders o ON kt.order_id = o.id
    JOIN restaurant_tables t ON kt.table_number = t.table_number
    WHERE kt.status = 'ready'
    ORDER BY kt.ready_at ASC
  `);

  for (const t of readyTickets) {
    t.items = queryAll('SELECT * FROM kitchen_ticket_items WHERE ticket_id = ?', [t.id]);
  }

  res.json(readyTickets);
});

// Confirm delivery of ticket to table
serviceRouter.post('/deliver-ticket/:id', (req, res) => {
  try {
    const updated = KdsService.updateTicketStatus(req.params.id, 'served');
    res.json({ success: true, ticket: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Assistance requests queue
serviceRouter.get('/assistance-requests', (req, res) => {
  const requests = queryAll(`
    SELECT ar.*, t.name as table_name
    FROM assistance_requests ar
    JOIN restaurant_tables t ON ar.table_id = t.id
    WHERE ar.status = 'pending'
    ORDER BY ar.created_at ASC
  `);
  res.json(requests);
});

// Resolve assistance request
serviceRouter.patch('/assistance-requests/:id/resolve', authenticate, (req, res) => {
  execute(`
    UPDATE assistance_requests 
    SET status = 'completed', resolved_at = CURRENT_TIMESTAMP, handled_by = ?
    WHERE id = ?
  `, [req.user?.id || null, req.params.id]);

  res.json({ success: true });
});
