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

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    outlet_id: user.outlet_id,
    station_id: user.station_id,
  });

  logAudit(user.id, 'LOGIN', 'USER', user.id, { email: user.email, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      outlet_id: user.outlet_id,
      station_id: user.station_id,
    },
  });
});

// Current authenticated user
authRouter.get('/me', authenticate, (req, res) => {
  const user = queryOne(`
    SELECT u.id, u.name, u.email, u.role, u.outlet_id, u.station_id,
           o.name as outlet_name, ks.name as station_name
    FROM users u
    LEFT JOIN outlets o ON u.outlet_id = o.id
    LEFT JOIN kitchen_stations ks ON u.station_id = ks.id
    WHERE u.id = ?
  `, [req.user!.id]);

  if (!user) return res.status(404).json({ error: 'User profile not found.' });
  res.json(user);
});

// List users (Admin)
authRouter.get('/users', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'auditor']), (req, res) => {
  const users = queryAll(`
    SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
           o.name as outlet_name, ks.name as station_name
    FROM users u
    LEFT JOIN outlets o ON u.outlet_id = o.id
    LEFT JOIN kitchen_stations ks ON u.station_id = ks.id
    ORDER BY u.created_at DESC
  `);
  res.json(users);
});

