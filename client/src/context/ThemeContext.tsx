import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface AppThemePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  primaryRgb: string;
  accentColor: string;
  accentRgb: string;
  secondaryColor: string;
  previewGradient: string;
  badgeBg: string;
  chipColor: string;
}

export const THEME_PRESETS: AppThemePreset[] = [
  {
    id: 'heritage_gold',
    name: 'Grand Heritage Gold',
    tagline: 'Imperial Amber & Regal Gold',
    description: 'Warm artisanal honey amber with regal gold highlights and deep bronze accents.',
    primaryColor: '#ca8a26',
    primaryHover: '#b45309',
    primaryLight: '#fef3c7',
    primaryDark: '#78350f',
    primaryRgb: '202, 138, 38',
    accentColor: '#2563eb',
    accentRgb: '37, 99, 235',
    secondaryColor: '#1c1917',
    previewGradient: 'from-amber-600 via-amber-500 to-yellow-500',
    badgeBg: 'bg-amber-500',
    chipColor: '#ca8a26',
  },
  {
    id: 'sapphire_blue',
    name: 'Sapphire Royal Blue',
    tagline: 'Executive Navy & Vivid Cobalt',
    description: 'Refined corporate luxury, vivid sapphire blue and crisp maritime slate.',
    primaryColor: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    primaryDark: '#1e3a8a',
    primaryRgb: '37, 99, 235',
    accentColor: '#ca8a26',
    accentRgb: '202, 138, 38',
    secondaryColor: '#0f172a',
    previewGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    badgeBg: 'bg-blue-600',
    chipColor: '#2563eb',
  },
  {
    id: 'emerald_savanna',
    name: 'Emerald Savanna & Botanical',
    description: 'Lush Mara acacia green, vibrant wild mint and botanical forest jade.',
    tagline: 'African Botanical Jade & Acacia',
    primaryColor: '#059669',
    primaryHover: '#047857',
    primaryLight: '#d1fae5',
    primaryDark: '#064e3b',
    primaryRgb: '5, 150, 105',
    accentColor: '#d97706',
    accentRgb: '217, 119, 6',
    secondaryColor: '#022c22',
    previewGradient: 'from-emerald-600 via-teal-600 to-green-500',
    badgeBg: 'bg-emerald-600',
    chipColor: '#059669',
  },
  {
    id: 'ruby_crimson',
    name: 'Ruby Crimson & Velvet',
    tagline: 'Passionate Fine-Dining Bordeaux',
    description: 'Passionate fine-dining ruby, burgundy wine velvet and warm flame amber.',
    primaryColor: '#e11d48',
    primaryHover: '#be123c',
    primaryLight: '#ffe4e6',
    primaryDark: '#881337',
    primaryRgb: '225, 29, 72',
    accentColor: '#f59e0b',
    accentRgb: '245, 158, 11',
    secondaryColor: '#4c0519',
    previewGradient: 'from-rose-600 via-red-600 to-pink-600',
    badgeBg: 'bg-rose-600',
    chipColor: '#e11d48',
  },
  {
    id: 'obsidian_noir',
    name: 'Obsidian Noir & Titanium',
    tagline: 'Ultra-Sleek Monochrome Architecture',
    description: 'Ultra-modern minimalist monochrome luxury with titanium slate and neon cyan sparks.',
    primaryColor: '#18181b',
    primaryHover: '#27272a',
    primaryLight: '#f4f4f5',
    primaryDark: '#09090b',
    primaryRgb: '24, 24, 27',
    accentColor: '#06b6d4',
    accentRgb: '6, 182, 212',
    secondaryColor: '#09090b',
    previewGradient: 'from-stone-900 via-zinc-800 to-neutral-700',
    badgeBg: 'bg-stone-900',
    chipColor: '#18181b',
  },
  {
    id: 'sunset_terracotta',
    name: 'Sunset Terracotta & Copper',
    tagline: 'Mediterranean Clay & Burnt Copper',
    description: 'Warm Mediterranean clay, spiced sunset terracotta and roasted cayenne copper.',
    primaryColor: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#ffedd5',
    primaryDark: '#7c2d12',
    primaryRgb: '234, 88, 12',
    accentColor: '#ca8a26',
    accentRgb: '202, 138, 38',
    secondaryColor: '#431407',
    previewGradient: 'from-orange-600 via-amber-600 to-red-500',
    badgeBg: 'bg-orange-600',
    chipColor: '#ea580c',
  },
  {
    id: 'amethyst_purple',
    name: 'Amethyst Royal Purple',
    tagline: 'Aristocratic Violet & Electric Lavender',
    description: 'Aristocratic deep violet, royal lilac velvet and sparkling neon rose.',
    primaryColor: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#ede9fe',
    primaryDark: '#4c1d95',
    primaryRgb: '124, 58, 237',
    accentColor: '#ec4899',
    accentRgb: '236, 72, 153',
    secondaryColor: '#2e1065',
    previewGradient: 'from-purple-600 via-violet-600 to-fuchsia-500',
    badgeBg: 'bg-purple-600',
    chipColor: '#7c3aed',
  },
  {
    id: 'cyber_cyan',
    name: 'Cyber Neon Cyan & Tech',
    tagline: 'Futuristic Electric Aqua & Cobalt',
    description: 'Electric cyan, futuristic digital teal and high-contrast glowing aqua.',
    primaryColor: '#0891b2',
    primaryHover: '#0e7490',
    primaryLight: '#cffafe',
    primaryDark: '#164e63',
    primaryRgb: '8, 145, 178',
    accentColor: '#8b5cf6',
    accentRgb: '139, 92, 246',
    secondaryColor: '#083344',
    previewGradient: 'from-cyan-600 via-teal-500 to-blue-500',
    badgeBg: 'bg-cyan-600',
    chipColor: '#0891b2',
  },
  {
    id: 'espresso_artisan',
    name: 'Espresso Artisan Roast',
    tagline: 'Barista Dark Roast & Warm Bronze',
    description: 'Rich dark roast Kenyan highland coffee, roasted cacao and artisanal bronze.',
    primaryColor: '#78350f',
    primaryHover: '#92400e',
    primaryLight: '#fef3c7',
    primaryDark: '#451a03',
    primaryRgb: '120, 53, 15',
    accentColor: '#ca8a26',
    accentRgb: '202, 138, 38',
    secondaryColor: '#291102',
    previewGradient: 'from-amber-950 via-amber-900 to-amber-800',
    badgeBg: 'bg-amber-900',
    chipColor: '#78350f',
  },
  {
    id: 'nordic_frost',
    name: 'Nordic Frost & Glacier Slate',
    tagline: 'Scandinavian Ice Blue & Alpine Silver',
    description: 'Crisp Scandinavian glacial ice blue, alpine mint crystal and cool silver slate.',
    primaryColor: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#e0f2fe',
    primaryDark: '#075985',
    primaryRgb: '2, 132, 199',
    accentColor: '#10b981',
    accentRgb: '16, 185, 129',
    secondaryColor: '#082f49',
    previewGradient: 'from-sky-600 via-blue-500 to-cyan-400',
    badgeBg: 'bg-sky-600',
    chipColor: '#0284c7',
  },
];

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
  platform_name: 'Sironi Restaurants',
  company_name: 'Sironi Restaurants Ltd',
  logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
  login_logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
  favicon_url: '/vite.svg',
  browser_title: 'Sironi Restaurants - QR Ordering & Cloud POS',
  support_email: 'support@sironi.kkdes.co.ke',
  support_phone: '+254 700 999 888',
  footer_text: 'Powered by Sironi Restaurants Cloud Platform',
  copyright_text: '© 2026 Sironi Restaurants Ltd. All rights reserved.',
  primary_color: '#ca8a26',
  secondary_color: '#1c1917',
  accent_color: '#2563eb',
  border_radius: '16px',
  font_family: 'Plus Jakarta Sans',
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  branding: PlatformBranding;
  currentPreset: AppThemePreset;
  themePresets: AppThemePreset[];
  setThemePreset: (presetId: string) => void;
  refreshBranding: () => Promise<void>;
  setCustomBranding: (branding: Partial<PlatformBranding>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  branding: defaultBranding,
  currentPreset: THEME_PRESETS[0],
  themePresets: THEME_PRESETS,
  setThemePreset: () => {},
  refreshBranding: async () => {},
  setCustomBranding: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeMode;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem('app_theme_preset') || 'heritage_gold';
  });

  const [branding, setBranding] = useState<PlatformBranding>(defaultBranding);

  const currentPreset = THEME_PRESETS.find((p) => p.id === activePresetId) || THEME_PRESETS[0];

  // Apply Theme CSS variables and global overrides to document root
  const applyThemeToDocument = (preset: AppThemePreset) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', preset.primaryColor);
    root.style.setProperty('--primary-color', preset.primaryColor);
    root.style.setProperty('--color-primary-hover', preset.primaryHover);
    root.style.setProperty('--color-primary-light', preset.primaryLight);
    root.style.setProperty('--color-primary-dark', preset.primaryDark);
    root.style.setProperty('--color-primary-rgb', preset.primaryRgb);
    root.style.setProperty('--color-accent', preset.accentColor);
    root.style.setProperty('--accent-color', preset.accentColor);
    root.style.setProperty('--color-accent-rgb', preset.accentRgb);
    root.style.setProperty('--color-secondary', preset.secondaryColor);

    // Dynamic style overrides targeting UI elements across the entire application
    let styleTag = document.getElementById('dynamic-theme-overrides');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-theme-overrides';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --color-primary: ${preset.primaryColor};
        --color-primary-hover: ${preset.primaryHover};
        --color-primary-light: ${preset.primaryLight};
        --color-primary-dark: ${preset.primaryDark};
        --color-primary-rgb: ${preset.primaryRgb};
        --color-accent: ${preset.accentColor};
        --color-accent-rgb: ${preset.accentRgb};
      }

      /* Global theme classes */
      .bg-primary-theme { background-color: var(--color-primary) !important; }
      .text-primary-theme { color: var(--color-primary) !important; }
      .border-primary-theme { border-color: var(--color-primary) !important; }

      /* Dynamic amber remap to active theme color across all buttons, tabs & badges */
      .bg-amber-600, .bg-amber-500 {
        background-color: var(--color-primary) !important;
      }
      .hover\\:bg-amber-700:hover, .hover\\:bg-amber-600:hover {
        background-color: var(--color-primary-hover) !important;
      }
      .text-amber-600, .text-amber-500, .text-amber-400 {
        color: var(--color-primary) !important;
      }
      .border-amber-600, .border-amber-500 {
        border-color: var(--color-primary) !important;
      }
      .border-amber-300 {
        border-color: rgba(var(--color-primary-rgb), 0.4) !important;
      }
      .bg-amber-50, .bg-amber-500\\/10, .bg-amber-500\\/20, .bg-amber-50\\/50 {
        background-color: rgba(var(--color-primary-rgb), 0.12) !important;
      }
      .dark .bg-amber-950\\/20, .dark .bg-amber-950\\/50, .dark .bg-amber-950\\/60 {
        background-color: rgba(var(--color-primary-rgb), 0.22) !important;
      }
      .focus\\:ring-amber-500:focus {
        --tw-ring-color: var(--color-primary) !important;
      }
      .accent-amber-600 {
        accent-color: var(--color-primary) !important;
      }
    `;
  };

  useEffect(() => {
    applyThemeToDocument(currentPreset);
    localStorage.setItem('app_theme_preset', currentPreset.id);
  }, [currentPreset]);

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

  const setThemePreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setActivePresetId(presetId);
      applyThemeToDocument(found);
      localStorage.setItem('app_theme_preset', presetId);

      // Async sync with backend
      fetch('/api/hotel/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('sironi_token') || localStorage.getItem('plateiq_token') || ''}`,
        },
        body: JSON.stringify({ theme: presetId }),
      }).catch(() => {});
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
        setBranding((prev) => ({ ...prev, ...loaded }));
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const setCustomBranding = (custom: Partial<PlatformBranding>) => {
    setBranding((prev) => ({ ...prev, ...custom }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        branding,
        currentPreset,
        themePresets: THEME_PRESETS,
        setThemePreset,
        refreshBranding: fetchBranding,
        setCustomBranding,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
