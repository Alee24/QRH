import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db/index.js';

export function resolveTenantContext(req: Request, res: Response, next: NextFunction) {
  // If user is authenticated, check their assigned tenant
  if (req.user) {
    if (req.user.tenant_id) {
      req.tenantId = req.user.tenant_id;
    } else if (req.user.role.startsWith('saas_') || req.user.role === 'super_admin') {
      // Super admin can specify tenant via header or query parameter
      const requested = (req.headers['x-tenant-id'] as string) || (req.query.tenant_id as string);
      if (requested) {
        req.tenantId = requested;
      }
    }
  }

  next();
}

export function requireTenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.tenantId && !req.user?.role?.startsWith('saas_') && req.user?.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Tenant context required. You must be associated with an active hotel tenant to perform this operation.'
    });
  }
  next();
}

