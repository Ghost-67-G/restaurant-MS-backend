# Permission System Documentation

## Overview
The backend uses a modular permission system with the format: `module.action`

This makes it easy to:
- Add new roles (like "manager", "waiter", etc.)
- Fine-tune permissions per role
- Keep code clean and maintainable

## Permission Naming Convention

```
module.action
```

- **module**: The feature/resource (order, menu, inventory, user, etc.)
- **action**: The operation (view, create, manage, adjust, delete, etc.)

### Standard Actions:
- `view` - Read/list items
- `create` - Create new items  
- `manage` - Full CRUD (create, update, delete)
- `adjust` - Update specific fields
- `delete` - Remove items
- `updateStatus` - Change status only

## All Permissions

### Order Module
- `order.create` - Create new orders
- `order.view` - View/list orders
- `order.updateStatus` - Update order status (pending → preparing → completed)
- `order.cancel` - Cancel orders
- `order.delete` - Delete orders (hard delete)

### Menu Module
- `menu.view` - View menu items
- `menu.manage` - Full CRUD on menu items

### Inventory Module
- `inventory.view` - View inventory items
- `inventory.manage` - Create/delete inventory items
- `inventory.adjust` - Update inventory quantities

### Dashboard Module
- `dashboard.view` - View dashboard statistics

### Reports Module
- `reports.view` - View reports (future feature)

### User Module
- `user.view` - View users
- `user.manage` - CRUD users

### POS Module
- `pos.access` - Access POS screen

## Current Roles

### Owner (Full Access)
```javascript
[
  'user.view', 'user.manage',
  'menu.view', 'menu.manage',
  'order.create', 'order.view', 'order.updateStatus', 'order.cancel', 'order.delete',
  'inventory.view', 'inventory.manage', 'inventory.adjust',
  'dashboard.view', 'reports.view',
  'pos.access'
]
```

### Cashier (POS Focused)
```javascript
[
  'pos.access',
  'order.create', 'order.view', 'order.updateStatus', 'order.cancel',
  'menu.view',
  'dashboard.view'
]
```

### Kitchen (Order Processing)
```javascript
[
  'order.view', 'order.updateStatus',
  'menu.view'
]
```

## Usage in Routes

```javascript
// Old way (hardcoded)
router.post('/orders', auth('createOrders'), controller.create);

// New way (modular)
router.post('/orders', auth('order.create'), controller.create);
```

## Adding a New Role

Example: Adding a "Manager" role

1. Update `/src/config/roles.js`:
```javascript
const allRoles = {
  owner: [...],
  manager: [
    'menu.view', 'menu.manage',
    'order.view', 'order.updateStatus',
    'inventory.view', 'inventory.adjust',
    'dashboard.view', 'reports.view',
  ],
  cashier: [...],
  kitchen: [...],
};
```

2. That's it! No route changes needed.

## Adding a New Permission

1. Add to `/src/config/permissions.js`:
```javascript
REPORTS: {
  EXPORT: 'reports.export',
}
```

2. Add to relevant roles in `/src/config/roles.js`

3. Use in routes:
```javascript
router.get('/reports/export', auth('reports.export'), controller.export);
```

## Benefits

✅ **Cleaner Code** - No hardcoded permission strings  
✅ **Flexible** - Easy to add/modify roles  
✅ **Scalable** - Support any number of roles  
✅ **Maintainable** - Single source of truth for permissions  
✅ **Self-Documenting** - Permission names are descriptive  

## Migration from Old System

| Old Permission | New Permission |
|---------------|----------------|
| `createOrders` | `order.create` |
| `viewOrders` | `order.view` |
| `updateOrderStatus` | `order.updateStatus` |
| `cancelOrder` | `order.cancel` |
| `manageOrders` | `order.delete` |
| `viewMenu` | `menu.view` |
| `manageMenu` | `menu.manage` |
| `manageInventory` | `inventory.manage` |
| `viewDashboard` | `dashboard.view` |
| `manageUsers` | `user.manage` |
| `getUsers` | `user.view` |
| `managePOS` | `pos.access` |
