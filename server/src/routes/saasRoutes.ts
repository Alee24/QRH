import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const saasRouter = Router();

// Protect all SaaS routes - Super Admin, Support Admin, Finance Admin
saasRouter.use(authenticate);
saasRouter.use(authorize(['saas_super_admin', 'saas_support_admin', 'saas_finance_admin', 'super_admin']));

// 1. SaaS Platform Overview & KPIs
saasRouter.get('/dashboard', (req, res) => {
  try {
    const totalTenants = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenants')!.count;
    const activeTenants = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenants WHERE status = ?', ['active'])!.count;
    const pendingTenants = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenants WHERE status = ?', ['pending_approval'])!.count;
    const suspendedTenants = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tenants WHERE status = ?', ['suspended'])!.count;

    // Platform MRR (Monthly Recurring Revenue from active tenants)
    const mrrResult = queryOne<{ mrr: number }>(`
      SELECT COALESCE(SUM(sp.price_monthly), 0) as mrr
      FROM tenants t
      JOIN subscription_plans sp ON t.plan_id = sp.id
      WHERE t.status = 'active'
    `)!;

    // Cross-tenant GMV & Order stats
    const salesStats = queryOne<{ total_sales: number; total_orders: number }>(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders
      FROM orders
      WHERE payment_status = 'paid'
    `)!;

    const totalTables = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM restaurant_tables WHERE is_active = 1')!.count;
    const totalStaff = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND role NOT LIKE \'saas_%\'')!.count;

    // System Health & Uptime
    const uptimeSeconds = process.uptime();
    const memUsage = process.memoryUsage();
    const systemHealth = {
      status: 'operational',
      uptime_hours: (uptimeSeconds / 3600).toFixed(2),
      uptime_seconds: Math.floor(uptimeSeconds),
      node_version: process.version,
      memory_heap_used_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
      memory_rss_mb: (memUsage.rss / 1024 / 1024).toFixed(1),
      os_platform: `${os.type()} ${os.release()}`,
      cpu_cores: os.cpus().length,
      database_type: 'SQLite (WAL Mode with Multi-Tenant Isolation)',
      websocket_status: 'online',
    };

    // Recent Onboarding & Pending Approvals
    const recentTenants = queryAll(`
      SELECT t.id, t.name, t.slug, t.status, t.owner_email, t.created_at,
             sp.name as plan_name, sp.price_monthly, sp.currency
      FROM tenants t
      JOIN subscription_plans sp ON t.plan_id = sp.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    // Top Grossing Tenants
    const topTenants = queryAll(`
      SELECT t.id, t.name, t.status, sp.name as plan_name,
        COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.tenant_id = t.id AND o.payment_status = 'paid'), 0) as gmv,
        (SELECT COUNT(*) FROM restaurant_tables WHERE tenant_id = t.id AND is_active = 1) as table_count
      FROM tenants t
      JOIN subscription_plans sp ON t.plan_id = sp.id
      ORDER BY gmv DESC
      LIMIT 5
    `);

    res.json({
      metrics: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        pending_tenants: pendingTenants,
        suspended_tenants: suspendedTenants,
        mrr: mrrResult.mrr,
        currency: 'KES',
        total_gmv: salesStats.total_sales,
        total_orders: salesStats.total_orders,
        total_tables: totalTables,
        total_staff: totalStaff,
      },
      system_health: systemHealth,
      recent_tenants: recentTenants,
      top_tenants: topTenants,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load SaaS dashboard: ${err.message}` });
  }
});

// 2. Tenant Management: List all hotel tenants
saasRouter.get('/tenants', (req, res) => {
  const { status, search } = req.query;
  let sql = `
    SELECT 
      t.*,
      sp.name as plan_name,
      sp.price_monthly,
      sp.currency,
      (SELECT COUNT(*) FROM restaurant_tables WHERE tenant_id = t.id AND is_active = 1) as table_count,
      (SELECT COUNT(*) FROM outlets WHERE tenant_id = t.id AND is_active = 1) as outlet_count,
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND is_active = 1) as staff_count,
      COALESCE((SELECT SUM(total_amount) FROM orders WHERE tenant_id = t.id AND payment_status = 'paid'), 0) as gmv,
      (SELECT COUNT(*) FROM orders WHERE tenant_id = t.id) as total_orders,
      tb.brand_name,
      tb.logo_url as tenant_logo
    FROM tenants t
    JOIN subscription_plans sp ON t.plan_id = sp.id
    LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ` AND t.status = ? `;
    params.push(status);
  }

  if (search) {
    sql += ` AND (t.name LIKE ? OR t.slug LIKE ? OR t.owner_email LIKE ?) `;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY t.created_at DESC `;

  const tenants = queryAll(sql, params);
  res.json(tenants);
});

// 3. Register / Onboard a new hotel tenant
saasRouter.post('/tenants', (req, res) => {
  const {
    name,
    slug,
    custom_domain,
    plan_id = 'plan-growth',
    owner_email,
    owner_phone,
    max_tables = 50,
    max_outlets = 3,
    max_staff = 30,
    status = 'active',
  } = req.body;

  if (!name || !owner_email) {
    return res.status(400).json({ error: 'Tenant name and owner email are required.' });
  }

  const generatedSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

  // Check unique slug
  const existing = queryOne('SELECT id FROM tenants WHERE slug = ?', [generatedSlug]);
  if (existing) {
    return res.status(400).json({ error: `A hotel tenant with slug '${generatedSlug}' already exists. Please choose a different slug.` });
  }

  const tenantId = `tenant-${generatedSlug}`;
  const hotelId = `hotel-${generatedSlug}`;
  const outletId = `outlet-${generatedSlug}-main`;
  const stationId = `station-${generatedSlug}-main`;

  try {
    runInTransaction(() => {
      // 1. Create Tenant
      execute(`
        INSERT INTO tenants (id, name, slug, custom_domain, status, plan_id, subscription_status, max_tables, max_outlets, max_staff, owner_email, owner_phone)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `, [tenantId, name, generatedSlug, custom_domain || null, status, plan_id, max_tables, max_outlets, max_staff, owner_email, owner_phone || null]);

      // 2. Create Tenant Branding
      execute(`
        INSERT INTO tenant_branding (id, tenant_id, brand_name, primary_color, secondary_color, accent_color, receipt_header, receipt_footer)
        VALUES (?, ?, ?, '#ca8a26', '#1c1917', '#2563eb', ?, ?)
      `, [uuidv4(), tenantId, name, `${name}\nNairobi, Kenya`, `Thank you for dining at ${name}`]);

      // 3. Create Default Hotel Record
      execute(`
        INSERT INTO hotels (id, tenant_id, name, legal_name, currency, phone, email, vat_rate, catering_levy_rate, service_charge_rate)
        VALUES (?, ?, ?, ?, 'KES', ?, ?, 16.0, 2.0, 0.0)
      `, [hotelId, tenantId, name, `${name} Ltd`, owner_phone || null, owner_email]);

      // 4. Create Default Outlet
      execute(`
        INSERT INTO outlets (id, tenant_id, hotel_id, name, code, type, is_active)
        VALUES (?, ?, ?, 'Main Restaurant', 'MAIN', 'restaurant', 1)
      `, [outletId, tenantId, hotelId]);

      // 5. Create Default Main Kitchen Station
      execute(`
        INSERT INTO kitchen_stations (id, tenant_id, outlet_id, name, code, color_code, is_active)
        VALUES (?, ?, ?, 'Main Hot Kitchen', 'MAIN', '#2563eb', 1)
      `, [stationId, tenantId, outletId]);
    });

    logAudit(req.user!.id, 'CREATE_TENANT', 'TENANT', tenantId, { name, plan_id, owner_email });

    const newTenant = queryOne('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    res.status(201).json(newTenant);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to onboard tenant: ${err.message}` });
  }
});

// 4. Update Tenant Status (Approve, Suspend, Reactivate, Cancel)
saasRouter.patch('/tenants/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ['active', 'pending_approval', 'suspended', 'cancelled', 'trial'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const tenant = queryOne('SELECT * FROM tenants WHERE id = ?', [id]);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  execute(`
    UPDATE tenants
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, id]);

  logAudit(req.user!.id, 'UPDATE_TENANT_STATUS', 'TENANT', id, { previous_status: tenant.status, new_status: status, reason });

  res.json({
    message: `Hotel tenant '${tenant.name}' status changed to '${status}'.`,
    tenant: queryOne('SELECT * FROM tenants WHERE id = ?', [id]),
  });
});

// 5. Update Tenant Subscription Plan & Limits
saasRouter.patch('/tenants/:id/plan', (req, res) => {
  const { id } = req.params;
  const { plan_id, max_tables, max_outlets, max_staff, custom_domain } = req.body;

  const tenant = queryOne('SELECT * FROM tenants WHERE id = ?', [id]);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  execute(`
    UPDATE tenants
    SET 
      plan_id = COALESCE(?, plan_id),
      max_tables = COALESCE(?, max_tables),
      max_outlets = COALESCE(?, max_outlets),
      max_staff = COALESCE(?, max_staff),
      custom_domain = COALESCE(?, custom_domain),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [plan_id, max_tables, max_outlets, max_staff, custom_domain, id]);

  logAudit(req.user!.id, 'UPDATE_TENANT_PLAN', 'TENANT', id, { plan_id, max_tables });

  res.json({
    message: `Tenant subscription parameters updated successfully.`,
    tenant: queryOne('SELECT * FROM tenants WHERE id = ?', [id]),
  });
});

// 6. List Subscription Plans
saasRouter.get('/plans', (req, res) => {
  const plans = queryAll(`
    SELECT sp.*,
      (SELECT COUNT(*) FROM tenants WHERE plan_id = sp.id AND status = 'active') as active_subscriber_count
    FROM subscription_plans sp
    ORDER BY sp.price_monthly ASC
  `);
  res.json(plans);
});

// 7. Update Subscription Plan
saasRouter.put('/plans/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price_monthly, max_tables, max_outlets, max_staff, features_json, is_active } = req.body;

  const plan = queryOne('SELECT * FROM subscription_plans WHERE id = ?', [id]);
  if (!plan) return res.status(404).json({ error: 'Subscription plan not found.' });

  execute(`
    UPDATE subscription_plans
    SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price_monthly = COALESCE(?, price_monthly),
      max_tables = COALESCE(?, max_tables),
      max_outlets = COALESCE(?, max_outlets),
      max_staff = COALESCE(?, max_staff),
      features_json = COALESCE(?, features_json),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `, [name, description, price_monthly, max_tables, max_outlets, max_staff, features_json ? JSON.stringify(features_json) : null, is_active, id]);

  logAudit(req.user!.id, 'UPDATE_PLAN', 'PLAN', id, { name, price_monthly });

  res.json(queryOne('SELECT * FROM subscription_plans WHERE id = ?', [id]));
});

// 8. Cross-Tenant Platform Audit Logs
saasRouter.get('/audit-logs', (req, res) => {
  const logs = queryAll(`
    SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role, t.name as tenant_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN tenants t ON al.tenant_id = t.id
    ORDER BY al.created_at DESC
    LIMIT 100
  `);
  res.json(logs);
});
