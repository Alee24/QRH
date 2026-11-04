import { Router } from 'express';
import { CashierService } from '../modules/cashier/cashierService.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const cashierRouter = Router();

// Get billing summary for table session
cashierRouter.get('/session/:sessionId', (req, res) => {
  try {
    const billing = CashierService.getSessionBilling(req.params.sessionId);
    res.json(billing);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Apply discount
cashierRouter.post('/session/:sessionId/discount', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'cashier']), (req, res) => {
  const { amount, reason } = req.body;
  if (amount === undefined || amount < 0) {
    return res.status(400).json({ error: 'Valid discount amount required.' });
  }

  try {
    const updated = CashierService.applyDiscount(req.params.sessionId, Number(amount), reason);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Process payment (Cash, Card, Room Charge, Bank)
cashierRouter.post('/session/:sessionId/pay', (req, res) => {
  const { amount, method, transactionRef, notes, roomId, cashierId } = req.body;
  if (!amount || amount <= 0 || !method) {
    return res.status(400).json({ error: 'Valid amount and payment method are required.' });
  }

  try {
    const result = CashierService.processPayment(req.params.sessionId, {
      amount: Number(amount),
      method,
      transactionRef,
      notes,
      roomId,
      cashierId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Process payment (Direct /pay route)
cashierRouter.post('/pay', (req, res) => {
  const { sessionId, session_id, amount, paymentMethod, method, referenceNumber, transactionRef, notes, roomId, cashierId } = req.body;
  const targetSessionId = sessionId || session_id;
  if (!targetSessionId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid session ID and amount are required.' });
  }

  try {
    const result = CashierService.processPayment(targetSessionId, {
      amount: Number(amount),
      method: paymentMethod || method || 'cash',
      transactionRef: referenceNumber || transactionRef,
      notes,
      roomId,
      cashierId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mark table for cleaning (Step 1 of table cycle)
cashierRouter.post('/table/:tableId/mark-cleaning', (req, res) => {
  try {
    const table = CashierService.markForCleaning(req.params.tableId);
    res.json({ success: true, table });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm cleaning completed (Step 2: Table becomes available again!)
cashierRouter.post('/table/:tableId/confirm-cleaning', (req, res) => {
  try {
    const table = CashierService.confirmCleaning(req.params.tableId);
    res.json({ success: true, table });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

