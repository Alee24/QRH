import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../../db/index.js';
import { emitPaymentSettled, emitTableStatusUpdated } from '../../socket/index.js';

export interface SplitPaymentInput {
  amount: number;
  method: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'room_charge';
  transactionRef?: string;
  notes?: string;
  cashierId?: string;
  roomId?: string; // If room charge
}

export class CashierService {
  /**
   * Generates sequential Invoice number
   */
  static generateInvoiceNumber(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRow = queryOne(`SELECT COUNT(*) as cnt FROM invoices WHERE created_at >= date('now')`);
    const nextSeq = (countRow ? Number(countRow.cnt) : 0) + 1;
    return `INV-${today}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Retrieves full table session billing details including all orders, items, payments, and balance
   */
  static getSessionBilling(sessionId: string) {
    const session = queryOne(`
      SELECT s.*, t.table_number, t.name as table_name, t.status as table_status,
             o.name as outlet_name, h.currency, h.vat_rate, h.catering_levy_rate, h.service_charge_rate,
             h.name as hotel_name, h.tax_pin, h.phone as hotel_phone, h.address as hotel_address
      FROM table_sessions s
      JOIN restaurant_tables t ON s.table_id = t.id
      JOIN outlets o ON s.outlet_id = o.id
      JOIN hotels h ON o.hotel_id = h.id
      WHERE s.id = ?
    `, [sessionId]);

    if (!session) throw new Error('Table session not found');

    const orders = queryAll(`
      SELECT * FROM orders WHERE table_session_id = ? AND status != 'cancelled'
      ORDER BY created_at ASC
    `, [sessionId]);

    for (const ord of orders) {
      ord.items = queryAll(`
        SELECT oi.*, ks.name as station_name
        FROM order_items oi
        LEFT JOIN kitchen_stations ks ON oi.station_id = ks.id
        WHERE oi.order_id = ?
      `, [ord.id]);
    }

    const payments = queryAll(`
      SELECT p.*, u.name as cashier_name
      FROM payments p
      LEFT JOIN users u ON p.cashier_id = u.id
      WHERE p.table_session_id = ?
      ORDER BY p.created_at ASC
    `, [sessionId]);

    // Calculate subtotal from all active orders
    let subtotal = 0;
    for (const ord of orders) {
      subtotal += ord.subtotal;
    }

    // Existing invoice if any
    const invoice = queryOne('SELECT * FROM invoices WHERE table_session_id = ?', [sessionId]);

    const discountAmount = invoice ? invoice.discount_amount : 0.0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const vat = Math.round(taxableAmount * (session.vat_rate / 100) * 100) / 100;
    const levy = Math.round(taxableAmount * (session.catering_levy_rate / 100) * 100) / 100;
    const serviceCharge = Math.round(taxableAmount * (session.service_charge_rate / 100) * 100) / 100;

    const totalAmount = taxableAmount; // In standard inclusive dining, subtotal is final inclusive total
    const totalPaid = payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0);
    const balance = Math.max(0, totalAmount - totalPaid);

    return {
      session,
      orders,
      payments,
      invoice,
      pricing: {
        currency: session.currency || 'KES',
        subtotal,
        discountAmount,
        vatRate: session.vat_rate,
        vatAmount: vat,
        cateringLevyRate: session.catering_levy_rate,
        cateringLevyAmount: levy,
        serviceChargeRate: session.service_charge_rate,
        serviceChargeAmount: serviceCharge,
        totalAmount,
        totalPaid,
        balance,
      }
    };
  }

  /**
   * Applies discount to session bill
   */
  static applyDiscount(sessionId: string, discountAmount: number, discountReason: string = 'Authorized Discount') {
    return runInTransaction(() => {
      let invoice = queryOne('SELECT * FROM invoices WHERE table_session_id = ?', [sessionId]);
      if (!invoice) {
        const billing = this.getSessionBilling(sessionId);
        const invId = uuidv4();
        const invNum = this.generateInvoiceNumber();
        execute(`
          INSERT INTO invoices (id, invoice_number, table_session_id, outlet_id, subtotal, vat_amount, catering_levy, service_charge, discount_amount, total_amount, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'unpaid')
        `, [
          invId, invNum, sessionId, billing.session.outlet_id,
          billing.pricing.subtotal, billing.pricing.vatAmount,
          billing.pricing.cateringLevyAmount, billing.pricing.serviceChargeAmount,
          discountAmount, Math.max(0, billing.pricing.subtotal - discountAmount)
        ]);
      } else {
        execute(`
          UPDATE invoices 
          SET discount_amount = ?, total_amount = MAX(0, subtotal - ?)
          WHERE id = ?
        `, [discountAmount, discountAmount, invoice.id]);
      }

      return this.getSessionBilling(sessionId);
    });
  }

  /**
   * Process payment (full or partial split)
   */
  static processPayment(sessionId: string, paymentInput: SplitPaymentInput) {
    return runInTransaction(() => {
      const billing = this.getSessionBilling(sessionId);

      // Ensure invoice exists
      let invoice = queryOne('SELECT * FROM invoices WHERE table_session_id = ?', [sessionId]);
      if (!invoice) {
        const invId = uuidv4();
        const invNum = this.generateInvoiceNumber();
        execute(`
          INSERT INTO invoices (id, invoice_number, table_session_id, outlet_id, subtotal, vat_amount, catering_levy, service_charge, discount_amount, total_amount, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, 0.0, 'unpaid')
        `, [
          invId, invNum, sessionId, billing.session.outlet_id,
          billing.pricing.subtotal, billing.pricing.vatAmount,
          billing.pricing.cateringLevyAmount, billing.pricing.serviceChargeAmount,
          billing.pricing.totalAmount
        ]);
        invoice = queryOne('SELECT * FROM invoices WHERE id = ?', [invId]);
      }

      // If room charge, verify room and guest
      if (paymentInput.method === 'room_charge') {
        if (!paymentInput.roomId) throw new Error('Room ID is required for hotel room charging.');
        const room = queryOne('SELECT * FROM hotel_rooms WHERE id = ?', [paymentInput.roomId]);
        if (!room || !room.is_occupied) {
          throw new Error('Room is not occupied or invalid.');
        }
        if (!room.billing_authorized) {
          throw new Error(`Room ${room.room_number} is not authorized for restaurant direct billing.`);
        }

        execute(`
          INSERT INTO room_charges (id, room_id, table_session_id, amount, guest_name, authorized_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), room.id, sessionId, paymentInput.amount, room.guest_name, paymentInput.cashierId || 'POS']);
      }

      // Record payment
      const paymentId = uuidv4();
      execute(`
        INSERT INTO payments (id, invoice_id, table_session_id, amount, method, status, transaction_ref, notes, cashier_id)
        VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?)
      `, [
        paymentId, invoice.id, sessionId, paymentInput.amount, paymentInput.method,
        paymentInput.transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
        paymentInput.notes || null, paymentInput.cashierId || null
      ]);

      // Update invoice paid amount
      const newPaid = billing.pricing.totalPaid + paymentInput.amount;
      const isFull = newPaid >= billing.pricing.totalAmount;

      execute(`
        UPDATE invoices 
        SET paid_amount = ?, status = ?, settled_at = ?
        WHERE id = ?
      `, [newPaid, isFull ? 'paid' : 'partially_paid', isFull ? new Date().toISOString() : null, invoice.id]);

      // Update session balance
      execute(`
        UPDATE table_sessions 
        SET paid_amount = ?, balance_amount = MAX(0, total_amount - ?)
        WHERE id = ?
      `, [newPaid, newPaid, sessionId]);

      // Mark all orders in session as paid if settled
      if (isFull) {
        execute(`
          UPDATE orders 
          SET payment_status = 'paid' 
          WHERE table_session_id = ?
        `, [sessionId]);

        // Table status moves to awaiting cleaning or ready for release
        execute(`
          UPDATE restaurant_tables 
          SET status = 'awaiting_payment' 
          WHERE id = ?
        `, [billing.session.table_id]);
      }

      const updatedBilling = this.getSessionBilling(sessionId);
      emitPaymentSettled(billing.session.session_code, {
        paymentId,
        amount: paymentInput.amount,
        method: paymentInput.method,
        isFull,
        balance: updatedBilling.pricing.balance
      });

      return updatedBilling;
    });
  }

  /**
   * Release and cycle table:
   * Rule: Table can only be marked available after:
   * 1. Balance is 0 (or settled)
   * 2. Marked for cleaning
   * 3. Cleaning is confirmed -> Available!
   */
  static markForCleaning(tableId: string) {
    execute(`UPDATE restaurant_tables SET status = 'cleaning', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [tableId]);
    const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [tableId]);
    emitTableStatusUpdated(tableId, 'cleaning', table);
    return table;
  }

  static confirmCleaning(tableId: string) {
    return runInTransaction(() => {
      // Close active session for this table
      execute(`
        UPDATE table_sessions 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP 
        WHERE table_id = ? AND status != 'closed'
      `, [tableId]);

      // Set table available
      execute(`
        UPDATE restaurant_tables 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [tableId]);

      const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [tableId]);
      emitTableStatusUpdated(tableId, 'available', table);
      return table;
    });
  }
}
