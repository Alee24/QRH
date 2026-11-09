import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../db/index.js';
import { generateToken, authenticate, authorize, logAudit } from '../middleware/auth.js';

export const authRouter = Router();

// Login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  const user = queryOne('SELECT * FROM users WHERE email = ? AND is_active = 1', [email.toLowerCase().trim()]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  // Tenant validation
  if (user.tenant_id) {
    const tenant = queryOne('SELECT id, name, status, plan_id FROM tenants WHERE id = ?', [user.tenant_id]);
    if (tenant && tenant.status === 'suspended') {
      return res.status(403).json({
        error: `Account suspended: The hotel subscription for '${tenant.name}' has been suspended. Please contact platform support at support@sironi.kkdes.co.ke.`
      });
    }
    if (tenant && tenant.status === 'pending_approval') {
      return res.status(403).json({
        error: `Account pending: The hotel registration for '${tenant.name}' is currently awaiting SaaS administrator approval.`
      });
    }
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id || null,
    outlet_id: user.outlet_id,
    station_id: user.station_id,
  });

  logAudit(user.id, 'LOGIN', 'USER', user.id, { email: user.email, role: user.role, tenant_id: user.tenant_id });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id || null,
      outlet_id: user.outlet_id,
      station_id: user.station_id,
    },
  });
});

// Current authenticated user
authRouter.get('/me', authenticate, (req, res) => {
  const user = queryOne(`
    SELECT u.id, u.name, u.email, u.role, u.tenant_id, u.outlet_id, u.station_id,
           o.name as outlet_name, ks.name as station_name,
           t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status
    FROM users u
    LEFT JOIN outlets o ON u.outlet_id = o.id
    LEFT JOIN kitchen_stations ks ON u.station_id = ks.id
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = ?
  `, [req.user!.id]);

  if (!user) return res.status(404).json({ error: 'User profile not found.' });
  res.json(user);
});

// List users (Admin - scoped to tenant)
authRouter.get('/users', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin', 'restaurant_manager', 'auditor']), (req, res) => {
  const isSaas = req.user!.role.startsWith('saas_') || req.user!.role === 'super_admin';
  const tenantFilter = req.tenantId || req.user!.tenant_id;

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.tenant_id, u.is_active, u.created_at,
           o.name as outlet_name, ks.name as station_name,
           t.name as tenant_name
    FROM users u
    LEFT JOIN outlets o ON u.outlet_id = o.id
    LEFT JOIN kitchen_stations ks ON u.station_id = ks.id
    LEFT JOIN tenants t ON u.tenant_id = t.id
  `;
  const params: any[] = [];

  if (!isSaas || tenantFilter) {
    query += ` WHERE u.tenant_id = ? `;
    params.push(tenantFilter);
  }

  query += ` ORDER BY u.created_at DESC `;

  const users = queryAll(query, params);
  res.json(users);
});

// Create Staff Member
authRouter.post('/users', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { name, email, password, role, stationId, outletId } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    return res.status(400).json({ error: 'A staff member with this email already exists.' });
  }

  const userId = `usr-${uuidv4().substring(0, 8)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const tenantId = req.tenantId || req.user!.tenant_id || 'tenant-heritage-nairobi';

  execute(`
    INSERT INTO users (id, tenant_id, name, email, password_hash, role, outlet_id, station_id, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `, [userId, tenantId, name.trim(), email.toLowerCase().trim(), passwordHash, role, outletId || null, stationId || null]);

  logAudit(req.user!.id, 'CREATE_USER', 'USER', userId, { name, email, role });

  res.status(201).json({
    success: true,
    message: `Staff member ${name} (${role}) created successfully.`,
    user: { id: userId, name, email, role, is_active: 1 },
  });
});

// Toggle Active / Deactivate Staff Member
authRouter.patch('/users/:id/status', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { isActive } = req.body;
  const targetId = req.params.id;

  execute(`UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?`, [isActive ? 1 : 0, targetId]);
  logAudit(req.user!.id, 'UPDATE_USER_STATUS', 'USER', targetId, { is_active: isActive });

  res.json({ success: true, message: `Staff status updated.` });
});

