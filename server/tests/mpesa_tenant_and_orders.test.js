import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, queryOne, execute } from '../dist/db/index.js';
import { MpesaService } from '../dist/modules/payments/mpesaService.js';

test('MPESA TRANSACTIONS & TENANT SAFETY VERIFICATION', async (t) => {
  initDatabase();

  await t.test('1. Verify initiateStkPush inserts with tenant_id resolved safely without NOT NULL failure', async () => {
    // Test with no explicit tenantId or sessionId
    const res1 = await MpesaService.initiateStkPush({
      phoneNumber: '0712345678',
      amount: 1500,
    });

    assert.ok(res1.success);
    assert.ok(res1.checkoutRequestId);
    assert.equal(res1.phone, '254712345678');
    assert.equal(res1.amount, 1500);

    const tx1 = queryOne('SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', [res1.checkoutRequestId]);
    assert.ok(tx1, 'Transaction record exists');
    assert.ok(tx1.tenant_id, 'tenant_id is populated');
    assert.equal(tx1.status, 'initiated');
  });

  await t.test('2. Verify confirmMpesaPayment marks transaction completed', async () => {
    const res = await MpesaService.initiateStkPush({
      phoneNumber: '0799887766',
      amount: 2500,
    });

    const confirmed = MpesaService.confirmMpesaPayment(
      undefined,
      res.checkoutRequestId,
      'RKTEST9988'
    );

    assert.ok(confirmed.success);
    assert.equal(confirmed.receipt, 'RKTEST9988');

    const tx = queryOne('SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', [res.checkoutRequestId]);
    assert.equal(tx.status, 'completed');
    assert.equal(tx.mpesa_receipt, 'RKTEST9988');
  });
});
