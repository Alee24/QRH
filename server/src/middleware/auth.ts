import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'grand-heritage-jwt-secret-key-2026-production';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string | null;
  outlet_id: string | null;
  station_id: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      outlet_id: user.outlet_id,
      station_id: user.station_id,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;

    // If user belongs to a tenant, verify tenant status
    if (payload.tenant_id) {
      const tenant = queryOne('SELECT id, status, name FROM tenants WHERE id = ?', [payload.tenant_id]);
      if (!tenant) {
        return res.status(403).json({ error: 'The hotel tenant associated with this account does not exist.' });
      }
      if (tenant.status === 'suspended') {
        return res.status(403).json({
          error: `Your hotel subscription account (${tenant.name}) has been suspended. Please contact platform support at support@sironi.kkdes.co.ke.`
        });
      }
      if (tenant.status === 'cancelled') {
        return res.status(403).json({
          error: `Your hotel subscription account (${tenant.name}) has been cancelled.`
        });
      }
      req.tenantId = payload.tenant_id;
    } else if (payload.role.startsWith('saas_')) {
      // Super admin can specify tenant via header or query if inspecting
      const requestedTenant = (req.headers['x-tenant-id'] as string) || (req.query.tenant_id as string);
      if (requestedTenant) {
        req.tenantId = requestedTenant;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please log in again.' });
  }
}

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }

    // SaaS Super Admin has master access across all platform features
    if (req.user.role === 'saas_super_admin' || req.user.role === 'super_admin') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Your role '${req.user.role}' lacks sufficient privileges for this operation.`
    });
  };
}

export function logAudit(userId: string | null, action: string, resourceType: string, resourceId: string | null, details: any, ip: string = '') {
  try {
    execute(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), userId, action, resourceType, resourceId, JSON.stringify(details), ip]);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

