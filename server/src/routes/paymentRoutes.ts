import { Router } from 'express';
import { MpesaService } from '../modules/payments/mpesaService.js';

export const paymentRouter = Router();

// Initiate Daraja STK Push
paymentRouter.post('/mpesa/stk-push', async (req, res) => {
  const { sessionId, phoneNumber, amount } = req.body;
  if (!sessionId || !phoneNumber || !amount) {
    return res.status(400).json({ error: 'Session ID, Phone number, and Amount are required.' });
  }

  try {
    const result = await MpesaService.initiateStkPush({
      sessionId,
      phoneNumber,
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
  const { sessionId, checkoutRequestId, mpesaReceipt } = req.body;
  if (!sessionId || !checkoutRequestId) {
    return res.status(400).json({ error: 'Session ID and Checkout Request ID are required.' });
  }

  try {
    const result = MpesaService.confirmMpesaPayment(sessionId, checkoutRequestId, mpesaReceipt);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

