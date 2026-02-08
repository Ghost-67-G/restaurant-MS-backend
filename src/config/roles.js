const { PERMISSIONS } = require('./permissions');

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
 * - POS screen access
 * - Create orders
 * - View own orders by default
 * - Update order status: pending → completed
 * - Cancel orders
 * - View menu and dashboard
 *
 * KITCHEN:
 * - View all orders
 * - Update order status: pending → preparing → completed
 * - View menu items
 * - No dashboard, inventory, or cancel access
 *
 * OWNER:
 * - Full access to everything
 * - All CRUD operations on all modules
 */

const allRoles = {
  owner: [
    // User management
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.MANAGE,
    // Menu management
    PERMISSIONS.MENU.VIEW,
    PERMISSIONS.MENU.MANAGE,
    // Order management
    PERMISSIONS.ORDER.CREATE,
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    PERMISSIONS.ORDER.CANCEL,
    PERMISSIONS.ORDER.DELETE,
    PERMISSIONS.ORDER.MANAGE,
    // Inventory management
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.INVENTORY.MANAGE,
    PERMISSIONS.INVENTORY.ADJUST,
    // Tax configuration
    PERMISSIONS.TAX.VIEW,
    PERMISSIONS.TAX.MANAGE,
    // Dashboard & Reports
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    // POS access
    PERMISSIONS.POS.ACCESS,
  ],
  cashier: [
    // POS operations
    PERMISSIONS.POS.ACCESS,
    // Order operations
    PERMISSIONS.ORDER.CREATE,
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    PERMISSIONS.ORDER.CANCEL,
    // View menu
    PERMISSIONS.MENU.VIEW,
    // View tax
    PERMISSIONS.TAX.VIEW,
    // Dashboard access
    PERMISSIONS.DASHBOARD.VIEW,
  ],
  kitchen: [
    // Order operations only
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    // View menu
    PERMISSIONS.MENU.VIEW,
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
