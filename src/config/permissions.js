/**
 * Permission Registry
 *
 * This file documents all available permissions in the system.
 * Use this as reference when adding new features or roles.
 *
 * Naming Convention: module.action
 * - module: The feature/resource (order, menu, inventory, etc.)
 * - action: The operation (view, create, manage, etc.)
 *
 * Standard Actions:
 * - view: Read/list items
 * - create: Create new items
 * - manage: Full CRUD (create, update, delete)
 * - adjust: Update specific fields (like inventory quantity)
 * - delete: Remove items
 */

const PERMISSIONS = {
  ORGANIZATION: {
    VIEW: 'organization.view',
    MANAGE: 'organization.manage',
  },

  // Order Management
  ORDER: {
    CREATE: 'order.create',
    VIEW: 'order.view',
    UPDATE_STATUS: 'order.updateStatus',
    CANCEL: 'order.cancel',
    DELETE: 'order.delete',
    MANAGE: 'order.manage', // create, update status, cancel, delete
  },

  // Item Management
  ITEM: {
    VIEW: 'item.view',
    MANAGE: 'item.manage',
  },

  // Inventory Management
  INVENTORY: {
    VIEW: 'inventory.view',
    MANAGE: 'inventory.manage', // create, delete
    ADJUST: 'inventory.adjust', // update quantities
  },

  // Tax Configuration
  TAX: {
    VIEW: 'tax.view',
    MANAGE: 'tax.manage',
  },

  // Dashboard & Reports
  DASHBOARD: {
    VIEW: 'dashboard.view',
  },

  REPORTS: {
    VIEW: 'reports.view',
  },

  // User Management
  USER: {
    VIEW: 'user.view',
    MANAGE: 'user.manage',
  },

  // POS
  POS: {
    ACCESS: 'pos.access',
  },
};

/**
 * Role to Permission Mapping
 */
const ROLE_PERMISSIONS = {
  owner: [
    PERMISSIONS.ORGANIZATION.VIEW,
    PERMISSIONS.ORGANIZATION.MANAGE,
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.MANAGE,
    PERMISSIONS.ITEM.VIEW,
    PERMISSIONS.ITEM.MANAGE,
    PERMISSIONS.ORDER.CREATE,
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    PERMISSIONS.ORDER.CANCEL,
    PERMISSIONS.ORDER.DELETE,
    PERMISSIONS.ORDER.MANAGE,
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.INVENTORY.MANAGE,
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.TAX.VIEW,
    PERMISSIONS.TAX.MANAGE,
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.POS.ACCESS,
  ],

  manager: [
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.ITEM.VIEW,
    PERMISSIONS.ITEM.MANAGE,
    PERMISSIONS.ORDER.CREATE,
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    PERMISSIONS.ORDER.CANCEL,
    PERMISSIONS.INVENTORY.VIEW,
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.TAX.VIEW,
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.POS.ACCESS,
  ],

  staff: [
    PERMISSIONS.POS.ACCESS,
    PERMISSIONS.ITEM.VIEW,
    PERMISSIONS.ORDER.CREATE,
    PERMISSIONS.ORDER.VIEW,
    PERMISSIONS.ORDER.UPDATE_STATUS,
    PERMISSIONS.ORDER.CANCEL,
    PERMISSIONS.TAX.VIEW,
    PERMISSIONS.DASHBOARD.VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
};
