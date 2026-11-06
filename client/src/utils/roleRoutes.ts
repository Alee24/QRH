// ==============================================================================
// Sironi Restaurants - Role Navigation & Department View Resolution Engine
// ==============================================================================

export type DepartmentScope = 'all' | 'kitchen' | 'cashier' | 'service' | 'delivery' | 'catering' | 'inventory';

/**
 * Returns the primary landing dashboard / tab for any staff role.
 */
export const getDefaultTabForRole = (role?: string): string => {
  if (!role) return 'kds';

  // 1. Kitchen Brigade & Chefs -> KDS (Kitchen Display System)
  if (
    role === 'kitchen_manager' ||
    role === 'kitchen_staff' ||
    role.startsWith('station_chef_') ||
    role === 'catering_chef' ||
    role === 'chef' ||
    role === 'sous_chef'
  ) {
    return 'kds';
  }

  // 2. Cashier POS -> Cashier POS Terminal & Billing
  if (role === 'cashier') {
    return 'cashier';
  }

  // 3. Service Staff / Food Runner -> Food Runner Dispatch Queue
  if (
    role === 'service_staff' ||
    role === 'food_runner' ||
    role === 'runner' ||
    role === 'waiter'
  ) {
    return 'service';
  }

  // 4. Delivery Driver -> Courier Mobile Portal & Proof of Delivery
  if (role === 'delivery_driver' || role === 'driver') {
    return 'driver_portal';
  }

  // 5. Dispatch Manager -> Delivery Dispatch Board
  if (role === 'dispatch_manager') {
    return 'delivery';
  }

  // 6. Catering & Events Team -> Catering Operations Hub
  if (
    role.startsWith('catering_') ||
    role.startsWith('event_') ||
    role === 'logistics_officer'
  ) {
    return 'catering';
  }

  // 7. Supply Chain & Inventory -> Recipe BOM & Stock
  if (
    role === 'inventory_manager' ||
    role === 'procurement' ||
    role === 'procurement_officer'
  ) {
    return 'inventory';
  }

  // 8. Front Desk / Receptionist -> Rooms PMS
  if (role === 'receptionist') {
    return 'hotel';
  }

  // 9. Finance & Auditing -> Reports & Audit Trail
  if (role === 'accountant' || role === 'accounting_manager' || role === 'auditor') {
    return 'reports';
  }

  // 10. Order Manager -> Central Orders Hub
  if (role === 'order_manager') {
    return 'orders';
  }

  // 11. Restaurant Leadership & General Manager -> Central Orders Hub / Executive View
  if (
    role === 'hotel_owner' ||
    role === 'hotel_admin' ||
    role === 'restaurant_manager' ||
    role === 'super_admin'
  ) {
    return 'orders';
  }

  if (role.startsWith('saas_')) {
    return 'saas_dashboard';
  }

  return 'kds';
};

/**
 * Returns default order scoping for a role inside CentralOrderManager.
 */
export const getDepartmentScopeForRole = (role?: string): DepartmentScope => {
  if (!role) return 'all';

  if (
    role === 'kitchen_manager' ||
    role === 'kitchen_staff' ||
    role.startsWith('station_chef_') ||
    role === 'catering_chef' ||
    role === 'chef' ||
    role === 'sous_chef'
  ) {
    return 'kitchen';
  }

  if (role === 'cashier') {
    return 'cashier';
  }

  if (
    role === 'service_staff' ||
    role === 'food_runner' ||
    role === 'runner' ||
    role === 'waiter'
  ) {
    return 'service';
  }

  if (role === 'delivery_driver' || role === 'driver' || role === 'dispatch_manager') {
    return 'delivery';
  }

  if (role.startsWith('catering_') || role.startsWith('event_')) {
    return 'catering';
  }

  if (role === 'inventory_manager') {
    return 'inventory';
  }

  return 'all';
};
