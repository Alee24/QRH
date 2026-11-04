import { Router } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import { KdsService } from '../modules/kds/kdsService.js';
import { authenticate } from '../middleware/auth.js';

export const kdsRouter = Router();

// Get Kitchen Stations
kdsRouter.get('/stations', (req, res) => {
  const stations = queryAll('SELECT * FROM kitchen_stations WHERE is_active = 1 ORDER BY name ASC');
  res.json(stations);
});

// Get Active Tickets for KDS screen
kdsRouter.get('/tickets', (req, res) => {
  const { stationId } = req.query;
  const tickets = KdsService.getActiveTickets(stationId as string);
  res.json(tickets);
});

// Update Ticket Status (Pending -> Preparing -> Ready -> Served)
kdsRouter.patch('/tickets/:id/status', (req, res) => {
  const { status } = req.body;
  try {
    const updated = KdsService.updateTicketStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Ticket Item Status
kdsRouter.patch('/items/:id/status', (req, res) => {
  const { status } = req.body;
  try {
    const result = KdsService.updateItemStatus(req.params.id, status);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Set Ticket Priority (Rush / Normal / Delayed)
kdsRouter.patch('/tickets/:id/priority', (req, res) => {
  const { priority } = req.body;
  try {
    const result = KdsService.setTicketPriority(req.params.id, priority);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// KDS Kitchen Station Metrics
kdsRouter.get('/metrics', (req, res) => {
  const counts = queryOne(`
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_count,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count,
      COUNT(*) as total_active
    FROM kitchen_tickets
    WHERE status IN ('pending', 'preparing', 'ready')
  `);

  res.json({
    pending: Number(counts?.pending_count || 0),
    preparing: Number(counts?.preparing_count || 0),
    ready: Number(counts?.ready_count || 0),
    totalActive: Number(counts?.total_active || 0),
  });
});
