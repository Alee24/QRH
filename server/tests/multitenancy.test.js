import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('MASTER MULTI-TENANCY & SAAS ISOLATION SUITE', async (t) => {
  let superAdminToken = '';
  let grandHeritageToken = '';
  let serenaToken = '';

  await t.test('1. Authenticate SaaS Super Admin and Tenant Managers', async () => {
    // SaaS Super Admin
    const superRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@plateiq.cloud', password: 'Admin@2026!' }),
    });
    assert.equal(superRes.status, 200);
    const superData = await superRes.json();
    assert.equal(superData.user.role, 'saas_super_admin');
    superAdminToken = superData.token;

    // Tenant 1: Grand Heritage Owner
    const grandRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(grandRes.status, 200);
    const grandData = await grandRes.json();
    assert.equal(grandData.user.tenant_id, 'tenant-grand-heritage');
    grandHeritageToken = grandData.token;

    // Tenant 2: Serena Safari Owner
    const serenaRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gm@serenasafari.com', password: 'Admin@2026!' }),
    });
    assert.equal(serenaRes.status, 200);
    const serenaData = await serenaRes.json();
    assert.equal(serenaData.user.tenant_id, 'tenant-serena-safari');
    serenaToken = serenaData.token;
  });

  await t.test('2. Verify SaaS Platform Dashboard & Metrics', async () => {
    const res = await fetch(`${BASE_URL}/api/saas/dashboard`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.metrics.total_tenants >= 3);
    assert.ok(data.metrics.mrr > 0);
    assert.equal(data.system_health.status, 'operational');
  });

  await t.test('3. Verify Multi-Tenant Table Scoping & Isolation', async () => {
    // Grand Heritage tables
    const grandTablesRes = await fetch(`${BASE_URL}/api/tables?tenant_id=tenant-grand-heritage`);
    const grandTables = await grandTablesRes.json();
    assert.ok(grandTables.length > 0);
    assert.ok(grandTables.every((t) => t.tenant_id === 'tenant-grand-heritage'));

    // Serena Safari tables
    const serenaTablesRes = await fetch(`${BASE_URL}/api/tables?tenant_id=tenant-serena-safari`);
    const serenaTables = await serenaTablesRes.json();
    assert.ok(serenaTables.length > 0);
    assert.ok(serenaTables.every((t) => t.tenant_id === 'tenant-serena-safari'));

    // Ensure no ID crossover
    const grandIds = new Set(grandTables.map((t) => t.id));
    const hasOverlap = serenaTables.some((t) => grandIds.has(t.id));
    assert.equal(hasOverlap, false, 'Tenant tables must be strictly isolated');
  });

  await t.test('4. Verify White-Label Theming & Dynamic Resolution', async () => {
    // Global Platform default
    const globalRes = await fetch(`${BASE_URL}/api/branding/platform`);
    const globalData = await globalRes.json();
    assert.equal(globalData.platform_name, 'PlateIQ Hospitality Cloud');

    // Serena Safari custom branding
    const serenaBrandRes = await fetch(`${BASE_URL}/api/branding/resolve?tenant_id=tenant-serena-safari`);
    const serenaBrand = await serenaBrandRes.json();
    assert.equal(serenaBrand.is_tenant_override, true);
    assert.equal(serenaBrand.theme.platform_name, 'Serena Safari Lodge');
    assert.equal(serenaBrand.theme.primary_color, '#059669');

    // Grand Heritage custom branding
    const grandBrandRes = await fetch(`${BASE_URL}/api/branding/resolve?tenant_id=tenant-grand-heritage`);
    const grandBrand = await grandBrandRes.json();
    assert.equal(grandBrand.is_tenant_override, true);
    assert.equal(grandBrand.theme.platform_name, 'Grand Heritage Hotel');
    assert.equal(grandBrand.theme.primary_color, '#ca8a26');
  });

  await t.test('5. Verify Tenant Lifecycle: Approve Pending Tenant & Suspend/Reactivate', async () => {
    // 1. Approve pending tenant 'tenant-carnivore-pit'
    const approveRes = await fetch(`${BASE_URL}/api/saas/tenants/tenant-carnivore-pit/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'active', reason: 'Verified documentation and billing details.' }),
    });
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.tenant.status, 'active');

    // 2. Suspend tenant
    const suspendRes = await fetch(`${BASE_URL}/api/saas/tenants/tenant-carnivore-pit/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'suspended', reason: 'Audit review.' }),
    });
    assert.equal(suspendRes.status, 200);
    const suspendData = await suspendRes.json();
    assert.equal(suspendData.tenant.status, 'suspended');

    // 3. Reactivate tenant
    const reactivateRes = await fetch(`${BASE_URL}/api/saas/tenants/tenant-carnivore-pit/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ status: 'active', reason: 'Audit passed.' }),
    });
    assert.equal(reactivateRes.status, 200);
    const reactivateData = await reactivateRes.json();
    assert.equal(reactivateData.tenant.status, 'active');
  });

  await t.test('6. Verify QR Scan Resolves Tenant Custom White-Label', async () => {
    // Get table S1 for Serena
    const serenaTablesRes = await fetch(`${BASE_URL}/api/tables?tenant_id=tenant-serena-safari`);
    const serenaTables = await serenaTablesRes.json();
    const s1 = serenaTables.find((t) => t.table_number === 'S1');
    assert.ok(s1);

    const scanRes = await fetch(`${BASE_URL}/api/tables/scan/${s1.qr_token}`);
    assert.equal(scanRes.status, 200);
    const scanData = await scanRes.json();
    assert.equal(scanData.table.hotel_name, 'Serena Safari Lodge');
    assert.equal(scanData.table.primary_color, '#059669');
  });
});
