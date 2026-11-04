import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { CustomerOrdering } from './pages/customer/CustomerOrdering.js';
import { KitchenDisplay } from './pages/kds/KitchenDisplay.js';
import { ServiceRunner } from './pages/service/ServiceRunner.js';
import { CashierPOS } from './pages/cashier/CashierPOS.js';
import { TableManager } from './pages/tables/TableManager.js';
import { MenuManager } from './pages/menu/MenuManager.js';
import { InventoryManager } from './pages/inventory/InventoryManager.js';
import { HotelRooms } from './pages/hotel/HotelRooms.js';
import { ReportsDashboard } from './pages/reports/ReportsDashboard.js';
import { UserManager } from './pages/users/UserManager.js';
import { StaffLogin } from './pages/login/StaffLogin.js';
import { SuperAdminDashboard } from './pages/saas/SuperAdminDashboard.js';
import { BrandingCenter } from './pages/saas/BrandingCenter.js';
import { PublicWebsite } from './pages/public/PublicWebsite.js';
import { HotelShowcasePage } from './pages/showcase/HotelShowcasePage.js';
import { CentralOrderManager } from './pages/orders/CentralOrderManager.js';
import { DeliveryManager } from './pages/delivery/DeliveryManager.js';
import { DriverPortal } from './pages/delivery/DriverPortal.js';
import { CateringManager } from './pages/catering/CateringManager.js';
import { HotelSettings } from './pages/settings/HotelSettings.js';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('saas_showcase');
  const [activeHotelSlug, setActiveHotelSlug] = useState<string>('grand-heritage');
  const [targetTableToken, setTargetTableToken] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // URL Path & Query Parameter Detection (Simulating Subdomains & Direct Links)
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant') || params.get('hotel');
    const tableParam = params.get('table') || params.get('token');

    if (path.startsWith('/h/')) {
      const slug = path.replace('/h/', '').split('/')[0];
      if (slug) {
        setActiveHotelSlug(slug);
        setCurrentTab('hotel_showcase');
      }
    } else if (path === '/showcase' || path === '/saas' || params.has('saas')) {
      setCurrentTab('saas_showcase');
    } else if (tenantParam) {
      setActiveHotelSlug(tenantParam);
      setCurrentTab('hotel_showcase');
    }

    if (tableParam) {
      setTargetTableToken(tableParam);
      setCurrentTab('customer');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Dedicated standalone views that should not render internal staff chrome
  if (currentTab === 'saas_showcase') {
    return (
      <PublicWebsite
        onNavigateToHotel={(slug) => {
          setActiveHotelSlug(slug);
          setCurrentTab('hotel_showcase');
        }}
        onLaunchGuestDemo={(tableToken) => {
          if (tableToken) setTargetTableToken(tableToken);
          setCurrentTab('customer');
        }}
        onOpenStaffPortal={() => setCurrentTab('login')}
      />
    );
  }

  if (currentTab === 'customer') {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <CustomerOrdering
          initialToken={targetTableToken}
          onBackToWebsite={() => setCurrentTab('saas_showcase')}
        />
      </div>
    );
  }

  const getDefaultTabForRole = (role?: string): string => {
    if (!role) return 'orders';
    if (role.startsWith('saas_')) return 'saas_dashboard';
    if (role === 'chef' || role === 'sous_chef') return 'kds';
    if (role === 'cashier') return 'cashier';
    if (role === 'delivery_driver') return 'driver_portal';
    if (role === 'dispatch_manager') return 'delivery';
    if (role.startsWith('catering_')) return 'catering';
    if (role === 'runner' || role === 'waiter') return 'service';
    if (role === 'inventory_manager' || role === 'procurement') return 'inventory';
    if (role === 'accountant' || role === 'auditor') return 'reports';
    return 'orders';
  };

  if (currentTab === 'login') {
    return (
      <StaffLogin
        onSuccess={(role) => setCurrentTab(getDefaultTabForRole(role))}
        onBackToWebsite={() => setCurrentTab('saas_showcase')}
      />
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'hotel_showcase':
        return (
          <HotelShowcasePage
            slug={activeHotelSlug}
            onBackToDirectory={() => setCurrentTab('saas_showcase')}
            onLaunchTableOrder={(token) => {
              if (token) setTargetTableToken(token);
              setCurrentTab('customer');
            }}
            onSwitchHotel={(slug) => setActiveHotelSlug(slug)}
          />
        );
      case 'saas_dashboard':
        return <SuperAdminDashboard />;
      case 'saas_branding':
        return <BrandingCenter />;
      case 'orders':
        return <CentralOrderManager />;
      case 'delivery':
        return <DeliveryManager />;
      case 'driver_portal':
        return <DriverPortal />;
      case 'catering':
        return <CateringManager />;
      case 'kds':
        return <KitchenDisplay />;
      case 'service':
        return <ServiceRunner />;
      case 'cashier':
        return <CashierPOS />;
      case 'tables':
        return <TableManager />;
      case 'menu':
        return <MenuManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'hotel':
        return <HotelRooms />;
      case 'reports':
        return <ReportsDashboard />;
      case 'users':
        return <UserManager />;
      case 'hotel_settings':
        return <HotelSettings />;
      default:
        return <CentralOrderManager />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 antialiased flex flex-col font-sans">
      {/* Professional Internal Role-Aware Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Internal Content Area (Offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Contextual Internal Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          collapsed={sidebarCollapsed}
        />

        {/* View Canvas */}
        <main className="flex-1 w-full overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
