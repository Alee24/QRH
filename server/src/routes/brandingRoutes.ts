import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const brandingRouter = Router();

// 1. Public: Get Global Platform Appearance Settings
brandingRouter.get('/platform', (req, res) => {
  let settings = queryOne('SELECT * FROM platform_settings WHERE id = \'global\'');
  if (!settings) {
    // Return defaults if not found
    settings = {
      id: 'global',
      platform_name: 'PlateIQ Hospitality Cloud',
      company_name: 'PlateIQ Technologies Ltd',
      logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      login_logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      favicon_url: '/vite.svg',
      browser_title: 'PlateIQ - Restaurant & Hotel Cloud POS',
      support_email: 'support@plateiq.cloud',
      support_phone: '+254 700 999 888',
      footer_text: 'Powered by PlateIQ Multi-Tenant Hospitality Platform',
      copyright_text: '© 2026 PlateIQ Technologies Ltd. All rights reserved.',
      primary_color: '#ca8a26',
      secondary_color: '#1c1917',
      accent_color: '#2563eb',
      border_radius: '16px',
      font_family: 'Plus Jakarta Sans',
    };
  }
  res.json(settings);
});

// 2. Super Admin: Update Global Platform Appearance
brandingRouter.put('/platform', authenticate, authorize(['saas_super_admin', 'super_admin']), (req, res) => {
  const {
    platform_name,
    company_name,
    logo_url,
    login_logo_url,
    favicon_url,
    browser_title,
    support_email,
    support_phone,
    footer_text,
    copyright_text,
    primary_color,
    secondary_color,
    accent_color,
    border_radius,
    font_family,
  } = req.body;

  execute(`
    INSERT INTO platform_settings (
      id, platform_name, company_name, logo_url, login_logo_url, favicon_url,
      browser_title, support_email, support_phone, footer_text, copyright_text,
      primary_color, secondary_color, accent_color, border_radius, font_family, updated_at
    )
    VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      platform_name = COALESCE(?, platform_name),
      company_name = COALESCE(?, company_name),
      logo_url = COALESCE(?, logo_url),
      login_logo_url = COALESCE(?, login_logo_url),
      favicon_url = COALESCE(?, favicon_url),
      browser_title = COALESCE(?, browser_title),
      support_email = COALESCE(?, support_email),
      support_phone = COALESCE(?, support_phone),
      footer_text = COALESCE(?, footer_text),
      copyright_text = COALESCE(?, copyright_text),
      primary_color = COALESCE(?, primary_color),
      secondary_color = COALESCE(?, secondary_color),
      accent_color = COALESCE(?, accent_color),
      border_radius = COALESCE(?, border_radius),
      font_family = COALESCE(?, font_family),
      updated_at = CURRENT_TIMESTAMP
  `, [
    platform_name, company_name, logo_url, login_logo_url, favicon_url, browser_title, support_email, support_phone, footer_text, copyright_text, primary_color, secondary_color, accent_color, border_radius, font_family,
    platform_name, company_name, logo_url, login_logo_url, favicon_url, browser_title, support_email, support_phone, footer_text, copyright_text, primary_color, secondary_color, accent_color, border_radius, font_family
  ]);

  logAudit(req.user!.id, 'UPDATE_PLATFORM_BRANDING', 'SETTINGS', 'global', { platform_name, primary_color });

  const updated = queryOne('SELECT * FROM platform_settings WHERE id = \'global\'');
  res.json(updated);
});

// 3. Get Tenant White-Label Customization
brandingRouter.get('/tenant/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const branding = queryOne(`
    SELECT tb.*, t.name as tenant_name, t.slug as tenant_slug
    FROM tenant_branding tb
    JOIN tenants t ON tb.tenant_id = t.id
    WHERE tb.tenant_id = ?
  `, [tenantId]);

  if (!branding) {
    // Return empty fallback
    return res.json({
      tenant_id: tenantId,
      brand_name: null,
      logo_url: null,
      primary_color: '#ca8a26',
      secondary_color: '#1c1917',
      accent_color: '#2563eb',
      receipt_header: null,
      receipt_footer: null,
    });
  }

  res.json(branding);
});

// 4. Update Tenant White-Label Customization
brandingRouter.put('/tenant/:tenantId', authenticate, (req, res) => {
  const { tenantId } = req.params;

  // Verify access: user must be SaaS admin or belong to this tenant with manager/owner role
  const isSaas = req.user!.role.startsWith('saas_') || req.user!.role === 'super_admin';
  const isTenantAdmin = req.user!.tenant_id === tenantId && ['hotel_owner', 'hotel_admin', 'restaurant_manager'].includes(req.user!.role);

  if (!isSaas && !isTenantAdmin) {
    return res.status(403).json({ error: 'Access denied. You can only customize branding for your own hotel.' });
  }

  const {
    brand_name,
    logo_url,
    primary_color,
    secondary_color,
    accent_color,
    receipt_header,
    receipt_footer,
    custom_css,
  } = req.body;

  const existing = queryOne('SELECT id FROM tenant_branding WHERE tenant_id = ?', [tenantId]);

  if (existing) {
    execute(`
      UPDATE tenant_branding
      SET 
        brand_name = COALESCE(?, brand_name),
        logo_url = COALESCE(?, logo_url),
        primary_color = COALESCE(?, primary_color),
        secondary_color = COALESCE(?, secondary_color),
        accent_color = COALESCE(?, accent_color),
        receipt_header = COALESCE(?, receipt_header),
        receipt_footer = COALESCE(?, receipt_footer),
        custom_css = COALESCE(?, custom_css),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `, [brand_name, logo_url, primary_color, secondary_color, accent_color, receipt_header, receipt_footer, custom_css, tenantId]);
  } else {
    execute(`
      INSERT INTO tenant_branding (id, tenant_id, brand_name, logo_url, primary_color, secondary_color, accent_color, receipt_header, receipt_footer, custom_css)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), tenantId, brand_name, logo_url, primary_color || '#ca8a26', secondary_color || '#1c1917', accent_color || '#2563eb', receipt_header, receipt_footer, custom_css]);
  }

  logAudit(req.user!.id, 'UPDATE_TENANT_BRANDING', 'BRANDING', tenantId, { brand_name, primary_color });

  const updated = queryOne('SELECT * FROM tenant_branding WHERE tenant_id = ?', [tenantId]);
  res.json(updated);
});

// 4b. Upload Restaurant Logo File (Base64 Data URI or Image Blob)
brandingRouter.post('/tenant/:tenantId/logo-upload', authenticate, (req, res) => {
  const { tenantId } = req.params;
  const { logoData, fileName } = req.body;

  const isSaas = req.user!.role.startsWith('saas_') || req.user!.role === 'super_admin';
  const isTenantAdmin = req.user!.tenant_id === tenantId && ['hotel_owner', 'hotel_admin', 'restaurant_manager'].includes(req.user!.role);

  if (!isSaas && !isTenantAdmin) {
    return res.status(403).json({ error: 'Access denied. You can only upload logos for your own hotel.' });
  }

  if (!logoData || typeof logoData !== 'string') {
    return res.status(400).json({ error: 'Logo file data is required (Base64 data URI).' });
  }

  const existing = queryOne('SELECT id FROM tenant_branding WHERE tenant_id = ?', [tenantId]);

  if (existing) {
    execute(`
      UPDATE tenant_branding
      SET logo_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `, [logoData, tenantId]);
  } else {
    execute(`
      INSERT INTO tenant_branding (id, tenant_id, brand_name, logo_url, primary_color, secondary_color, accent_color)
      VALUES (?, ?, (SELECT name FROM tenants WHERE id = ?), ?, '#ca8a26', '#1c1917', '#2563eb')
    `, [uuidv4(), tenantId, tenantId, logoData]);
  }

  logAudit(req.user!.id, 'UPLOAD_TENANT_LOGO', 'BRANDING', tenantId, { fileName: fileName || 'logo-upload' });

  res.json({
    success: true,
    message: 'Restaurant logo uploaded successfully.',
    logo_url: logoData,
    tenant_id: tenantId,
  });
});


// 5. Dynamic Active Theme Resolution (Global + Tenant Overrides merged)
brandingRouter.get('/resolve', (req, res) => {
  const tenantId = (req.query.tenant_id as string) || (req.headers['x-tenant-id'] as string);

  const globalSettings = queryOne('SELECT * FROM platform_settings WHERE id = \'global\'') || {
    platform_name: 'PlateIQ Hospitality Cloud',
    primary_color: '#ca8a26',
    secondary_color: '#1c1917',
    accent_color: '#2563eb',
    border_radius: '16px',
    font_family: 'Plus Jakarta Sans',
  };

  if (!tenantId) {
    return res.json({
      theme: globalSettings,
      is_tenant_override: false,
    });
  }

  const tenantBranding = queryOne('SELECT * FROM tenant_branding WHERE tenant_id = ?', [tenantId]);

  if (!tenantBranding) {
    return res.json({
      theme: globalSettings,
      is_tenant_override: false,
    });
  }

  // Merge tenant overrides with global settings
  const mergedTheme = {
    ...globalSettings,
    platform_name: tenantBranding.brand_name || globalSettings.platform_name,
    logo_url: tenantBranding.logo_url || globalSettings.logo_url,
    primary_color: tenantBranding.primary_color || globalSettings.primary_color,
    secondary_color: tenantBranding.secondary_color || globalSettings.secondary_color,
    accent_color: tenantBranding.accent_color || globalSettings.accent_color,
    receipt_header: tenantBranding.receipt_header,
    receipt_footer: tenantBranding.receipt_footer,
    tenant_id: tenantId,
  };

  res.json({
    theme: mergedTheme,
    is_tenant_override: true,
  });
});
