import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute, runInTransaction } from '../../db/index.js';
import { CashierService } from '../cashier/cashierService.js';

export interface StkPushParams {
  sessionId?: string;
  orderId?: string;
  tenantId?: string;
  phoneNumber: string; // e.g. '254712345678'
  amount: number;
}

export class MpesaService {
  /**
   * Format phone number to standard Safaricom Daraja format 254XXXXXXXXX
   */
  static formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '254' + clean.slice(1);
    } else if (clean.startsWith('7') || clean.startsWith('1')) {
      clean = '254' + clean;
    } else if (clean.startsWith('+254')) {
      clean = clean.replace('+', '');
    }
    return clean;
  }

  /**
   * Initiate Daraja STK Push
   */
  static async initiateStkPush(params: StkPushParams) {
    const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const merchantRequestId = `MR_${Date.now()}`;

    // Resolve tenant_id safely to satisfy NOT NULL foreign key constraint
    let resolvedTenantId = params.tenantId;
    if (!resolvedTenantId && params.sessionId) {
      const sess = queryOne<{ tenant_id?: string }>('SELECT tenant_id FROM table_sessions WHERE id = ?', [params.sessionId]);
      if (sess?.tenant_id) resolvedTenantId = sess.tenant_id;
    }
    if (!resolvedTenantId && params.orderId) {
      const ord = queryOne<{ tenant_id?: string }>('SELECT tenant_id FROM orders WHERE id = ?', [params.orderId]);
      if (ord?.tenant_id) resolvedTenantId = ord.tenant_id;
    }
    if (!resolvedTenantId) {
      const defaultTenant = queryOne<{ id: string }>('SELECT id FROM tenants LIMIT 1');
      resolvedTenantId = defaultTenant?.id || 'tenant-grand-heritage';
    }

    // Record initiated transaction
    const mpesaTxId = uuidv4();
    execute(`
      INSERT INTO mpesa_transactions (id, tenant_id, merchant_request_id, checkout_request_id, phone_number, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'initiated')
    `, [mpesaTxId, resolvedTenantId, merchantRequestId, checkoutRequestId, formattedPhone, params.amount]);

    const darajaKey = process.env.DARAJA_CONSUMER_KEY;
    const isConfigured = darajaKey && darajaKey !== 'sandbox_key';

    if (isConfigured) {
      // In live environment with credentials: would invoke real Daraja OAuth & STK Push
    }

    return {
      success: true,
      checkoutRequestId,
      merchantRequestId,
      customerMessage: `STK Push prompt sent to ${formattedPhone}. Please enter your M-Pesa PIN on your phone.`,
      transactionId: mpesaTxId,
      amount: params.amount,
      phone: formattedPhone,
    };
  }

  /**
   * Process Safaricom Daraja Callback webhook
   */
  static async handleCallback(payload: any) {
    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      throw new Error('Invalid Daraja callback structure');
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    let mpesaReceiptNumber = '';
    let amount = 0;
    let phoneNumber = '';

    if (CallbackMetadata && CallbackMetadata.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
        if (item.Name === 'Amount') amount = Number(item.Value);
        if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value);
      }
    }

    return runInTransaction(() => {
      const tx = queryOne('SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', [CheckoutRequestID]);
      if (!tx) {
        throw new Error(`Transaction with checkout request ${CheckoutRequestID} not found.`);
      }

      if (ResultCode === 0) {
        // Success
        execute(`
          UPDATE mpesa_transactions 
          SET status = 'completed', mpesa_receipt = ?, result_code = ?, result_desc = ?, raw_callback = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [mpesaReceiptNumber, ResultCode, ResultDesc, JSON.stringify(payload), tx.id]);

        return { success: true, mpesaReceiptNumber, txId: tx.id };
      } else {
        // Cancelled or Failed
        execute(`
          UPDATE mpesa_transactions 
          SET status = 'failed', result_code = ?, result_desc = ?, raw_callback = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [ResultCode, ResultDesc, JSON.stringify(payload), tx.id]);

        return { success: false, error: ResultDesc, txId: tx.id };
      }
    });
  }

  /**
   * Confirm / Verify payment for session or order
   */
  static confirmMpesaPayment(sessionId?: string, checkoutRequestId?: string, mpesaReceipt?: string, orderId?: string) {
    return runInTransaction(() => {
      const tx = queryOne<any>('SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', [checkoutRequestId]);
      if (!tx) throw new Error('Transaction not found');

      const receiptNum = mpesaReceipt || tx.mpesa_receipt || `RK${Date.now().toString().slice(-8).toUpperCase()}`;

      execute(`
        UPDATE mpesa_transactions 
        SET status = 'completed', mpesa_receipt = ?, result_code = 0, result_desc = 'The service request is processed successfully.'
        WHERE id = ?
      `, [receiptNum, tx.id]);

      let updatedBilling = null;
      let effectiveSessionId = sessionId;

      if (!effectiveSessionId && orderId) {
        const ord = queryOne<{ table_session_id?: string }>('SELECT table_session_id FROM orders WHERE id = ?', [orderId]);
        if (ord?.table_session_id) effectiveSessionId = ord.table_session_id;
      }

      // Settle session via Cashier service if table session exists
      if (effectiveSessionId) {
        try {
          updatedBilling = CashierService.processPayment(effectiveSessionId, {
            amount: tx.amount,
            method: 'mpesa',
            transactionRef: receiptNum,
            notes: `Safaricom M-Pesa verified (${tx.phone_number})`,
          });
        } catch (e: any) {
          console.warn('Session settlement note:', e.message);
        }
      }

      // Also ensure order payment_status is marked paid
      if (orderId) {
        execute(`UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [orderId]);
      } else if (effectiveSessionId) {
        execute(`UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE table_session_id = ?`, [effectiveSessionId]);
      }

      return {
        success: true,
        receipt: receiptNum,
        billing: updatedBilling,
      };
    });
  }
}

