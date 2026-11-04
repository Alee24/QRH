import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export interface PlatformBranding {
  platform_name: string;
  company_name: string;
  logo_url: string | null;
  login_logo_url: string | null;
  favicon_url: string | null;
  browser_title: string;
  support_email: string;
  support_phone: string;
  footer_text: string;
  copyright_text: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  border_radius: string;
  font_family: string;
  receipt_header?: string | null;
  receipt_footer?: string | null;
}

const defaultBranding: PlatformBranding = {
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

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  branding: PlatformBranding;
  refreshBranding: () => Promise<void>;
  setCustomBranding: (branding: Partial<PlatformBranding>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  branding: defaultBranding,
  refreshBranding: async () => {},
  setCustomBranding: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app_theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [branding, setBranding] = useState<PlatformBranding>(defaultBranding);

  const applyBrandingCss = (brand: PlatformBranding) => {
    const root = document.documentElement;
    if (brand.primary_color) {
      root.style.setProperty('--color-primary', brand.primary_color);
      root.style.setProperty('--primary-color', brand.primary_color);
    }
    if (brand.accent_color) {
      root.style.setProperty('--color-accent', brand.accent_color);
      root.style.setProperty('--accent-color', brand.accent_color);
    }
    if (brand.border_radius) {
      root.style.setProperty('--app-border-radius', brand.border_radius);
    }
    if (brand.browser_title) {
      document.title = brand.browser_title;
    }
  };

  const fetchBranding = async () => {
    try {
      const activeTenant = localStorage.getItem('active_tenant_id');
      const url = activeTenant 
        ? `/api/branding/resolve?tenant_id=${encodeURIComponent(activeTenant)}`
        : '/api/branding/platform';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const loaded = data.theme || data;
        setBranding((prev) => {
          const merged = { ...prev, ...loaded };
          applyBrandingCss(merged);
          return merged;
        });
      }
    } catch (e) {
      // Fallback to default branding
      applyBrandingCss(defaultBranding);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setCustomBranding = (custom: Partial<PlatformBranding>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...custom };
      applyBrandingCss(updated);
      return updated;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, branding, refreshBranding: fetchBranding, setCustomBranding }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
