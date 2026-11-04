import React, { useState } from 'react';
import { Navbar } from './components/Navbar.js';
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
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="transition-all">{renderContent()}</main>
    </div>
  );
};

