/**
 * Role-based access control configuration
 *
 * ORDER LIFECYCLE:
 * - pending → default status when order created
 * - preparing → kitchen marks when they start
 * - completed → kitchen or cashier marks when done (inventory reduced)
 * - cancelled → owner or cashier can cancel
 *
 * CASHIER:
 * - POS screen access (managePOS)
 * - Create orders (createOrders)
 * - View own orders by default (viewOrders)
 * - Update order status: pending → completed/cancelled (updateOrderStatus, cancelOrder)
 * - View menu items (viewMenu)
 * - View dashboard stats (viewDashboard)
 *
 * KITCHEN:
 * - View orders list (viewOrders)
 * - Update order status: pending → preparing → completed (updateOrderStatus)
 * - View menu items (viewMenu)
 * - No dashboard access
 * - No inventory access
 * - Cannot cancel orders
 *
 * OWNER:
 * - Full access to everything
 * - CRUD menu items (manageMenu, viewMenu)
 * - CRUD inventory (manageInventory)
 * - View all orders and reports (viewOrders, viewDashboard)
 * - Manage users (manageUsers, getUsers)
 * - Cancel/Delete orders (manageOrders, cancelOrder)
 */

const allRoles = {
  owner: [
    'manageUsers',
    'getUsers',
    'manageMenu',
    'viewMenu',
    'manageOrders',
    'createOrders',
    'viewOrders',
    'updateOrderStatus',
    'cancelOrder',
    'manageInventory',
    'viewDashboard',
    'managePOS',
  ],
  cashier: [
    'managePOS',
    'createOrders',
    'viewOrders',
    'updateOrderStatus',
    'cancelOrder', // Can cancel orders
    'viewMenu',
    'viewDashboard',
  ],
  kitchen: [
    'viewOrders',
    'updateOrderStatus', // preparing → completed only
    'viewMenu',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
