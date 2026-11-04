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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('customer');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'customer':
        return <CustomerOrdering />;
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
      case 'login':
        return <StaffLogin onSuccess={() => setCurrentTab('cashier')} />;
      default:
        return <CustomerOrdering />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 antialiased flex flex-col">
      {/* Professional Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Contextual Header */}
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
