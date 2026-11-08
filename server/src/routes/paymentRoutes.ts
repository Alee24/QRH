import { Router } from 'express';
import { MpesaService } from '../modules/payments/mpesaService.js';
import { queryOne, execute } from '../db/index.js';

export const paymentRouter = Router();

// Initiate Daraja STK Push
paymentRouter.post('/mpesa/stk-push', async (req, res) => {
  let { sessionId, orderId, phoneNumber, phone, amount, tenantId } = req.body;
  const targetPhone = phoneNumber || phone;

  if (orderId && !sessionId) {
    const ord = queryOne<{ table_session_id?: string; total_amount?: number; tenant_id?: string }>(
      'SELECT table_session_id, total_amount, tenant_id FROM orders WHERE id = ?',
      [orderId]
    );
    if (ord) {
      sessionId = ord.table_session_id;
      if (!amount) amount = ord.total_amount;
      if (!tenantId) tenantId = ord.tenant_id;
    }
  }

  if (!targetPhone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required to initiate M-Pesa payment.' });
  }

  try {
    const result = await MpesaService.initiateStkPush({
      sessionId,
      orderId,
      tenantId,
      phoneNumber: targetPhone,
      amount: Number(amount),
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initiate STK push' });
  }
});

// Safaricom Daraja Webhook Callback
paymentRouter.post('/mpesa/callback', async (req, res) => {
  try {
    const result = await MpesaService.handleCallback(req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('M-Pesa callback error:', err.message);
    res.status(400).json({ ResultCode: 1, ResultDesc: err.message });
  }
});

// Verify & Confirm M-Pesa Payment
paymentRouter.post('/mpesa/verify', (req, res) => {
  let { sessionId, orderId, checkoutRequestId, mpesaReceipt } = req.body;

  if (orderId && !sessionId) {
    const ord = queryOne('SELECT table_session_id FROM orders WHERE id = ?', [orderId]);
    if (ord) {
      sessionId = ord.table_session_id;
    }
  }

  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'Checkout Request ID is required.' });
  }

  // If still no sessionId, find it via tx or default
  if (!sessionId) {
    const defaultSession = queryOne("SELECT id FROM table_sessions WHERE status = 'active' LIMIT 1");
    sessionId = defaultSession?.id;
  }

  try {
    const result = MpesaService.confirmMpesaPayment(sessionId, checkoutRequestId, mpesaReceipt, orderId);

    // If orderId was provided, also ensure order payment status is explicitly updated
    if (orderId) {
      execute("UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [orderId]);
    }

    res.json({
      success: true,
      status: 'COMPLETED',
      receiptNumber: result.receipt,
      amount: (result.billing as any)?.pricing?.totalPaid || (result.billing as any)?.pricing?.grandTotal || 0,
      billing: result.billing,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

