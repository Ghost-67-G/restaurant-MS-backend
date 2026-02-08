# Event-Driven Architecture - Order → Inventory Flow

## Overview

The order processing system now uses an event-driven architecture to decouple order management from inventory management. This provides better maintainability, prevents double deductions, and makes it easy to add analytics and debugging.

## Architecture

### Before (Tightly Coupled)
```javascript
// Order Service directly calls inventory
if (status === COMPLETED) {
  await reduceInventory()
}
```

**Problems:**
- ❌ Tight coupling between order and inventory modules
- ❌ Risk of double deduction if called multiple times
- ❌ Hard to add analytics or side effects
- ❌ Difficult to debug
- ❌ No audit trail of what triggered inventory changes

### After (Event-Driven)
```javascript
// Order Service emits event
if (status === COMPLETED) {
  emitEvent("ORDER_COMPLETED", { orderId })
}

// Inventory handler listens to event
on("ORDER_COMPLETED", handleInventoryDeduction)
```

**Benefits:**
- ✅ Loose coupling - modules are independent
- ✅ Prevents double deduction (event handlers track processing)
- ✅ Easy to add analytics, notifications, etc.
- ✅ Built-in event logging for debugging
- ✅ Full audit trail via EventLog model
- ✅ Supports future features (refunds, inventory restoration)

## Components

### 1. Event Emitter (`utils/eventEmitter.js`)
- Custom EventEmitter class with logging
- Defines all event names as constants
- Prevents typos and makes events discoverable

### 2. Event Handlers (`events/orderEvents.js`)
- `handleOrderCompleted` - Deducts inventory when order completes
- `handleOrderCancelled` - Handles order cancellations (prepared for refunds)
- `handleOrderCreated` - Logs order creation for analytics
- `handleOrderUpdated` - Logs order updates

### 3. Event Registration (`events/index.js`)
- Registers all event handlers at startup
- Wraps handlers with error handling
- Logs events to EventLog model for debugging

### 4. EventLog Model (`models/eventLog.model.js`)
- Tracks all events with status (pending/processing/completed/failed)
- Provides audit trail for debugging
- Enables retry mechanisms for failed events

## Event Flow

```
┌─────────────────┐
│  Order Service  │
│  updateOrder()  │
└────────┬────────┘
         │
         │ emitEvent(ORDER_COMPLETED)
         ▼
┌─────────────────┐
│  Event Emitter  │
│  (singleton)    │
└────────┬────────┘
         │
         │ triggers registered handlers
         ▼
┌─────────────────┐
│ Event Handler   │
│ handleOrder     │
│ Completed()     │
└────────┬────────┘
         │
         │ calls
         ▼
┌─────────────────┐
│ Recipe Service  │
│ deductIngredients│
└────────┬────────┘
         │
         │ creates ledger entries
         ▼
┌─────────────────┐
│ Inventory Ledger│
│ (audit trail)   │
└─────────────────┘
```

## Events

### ORDER_CREATED
**When:** New order is created  
**Data:** `{ orderId, userId, orderData }`  
**Handlers:** Analytics logging

### ORDER_UPDATED
**When:** Order status changes (generic)  
**Data:** `{ orderId, userId, status, previousStatus }`  
**Handlers:** Analytics logging

### ORDER_COMPLETED
**When:** Order status → COMPLETED  
**Data:** `{ orderId, userId, previousStatus, order }`  
**Handlers:** 
- Inventory deduction via recipe system
- Falls back to legacy inventory if needed
- Creates ledger entries with ORDER reference

### ORDER_CANCELLED
**When:** Order status → CANCELLED  
**Data:** `{ orderId, userId, previousStatus, order }`  
**Handlers:**
- Checks if inventory restoration needed
- Logs for manual review (future: auto-restore)

## Preventing Double Deduction

The system prevents double deduction through:

1. **Status Check**: `previousStatus !== COMPLETED`
   ```javascript
   if (updateBody.status === COMPLETED && previousStatus !== COMPLETED) {
     emitEvent(ORDER_COMPLETED, { ... })
   }
   ```

2. **Event Logging**: Each event is logged to EventLog
   - Status: pending → processing → completed/failed
   - Can detect duplicate events by checking log

3. **Idempotent Handlers**: Event handlers check before processing
   ```javascript
   if (previousStatus === 'completed') {
     logger.warn('Already processed - skipping');
     return;
   }
   ```

## Debugging

### View Event Logs
```javascript
// Query failed events
db.eventlogs.find({ status: 'failed' })

// View events for specific order
db.eventlogs.find({ 'eventData.orderId': '...' })

// Count processing times
db.eventlogs.aggregate([
  { $match: { status: 'completed' } },
  { $project: {
      duration: { $subtract: ['$processingCompletedAt', '$processingStartedAt'] }
  }},
  { $group: { _id: '$eventName', avgDuration: { $avg: '$duration' } }}
])
```

### Check Inventory Ledger
```javascript
// View all ledger entries for an order
db.inventoryledgers.find({ referenceId: orderId })

// Verify deduction happened
db.inventoryledgers.find({
  referenceType: 'ORDER',
  referenceId: orderId,
  type: 'OUT'
})
```

## Future Enhancements

### 1. Refunds/Cancellations
When an order is cancelled after completion:
```javascript
// Already scaffolded in handleOrderCancelled
if (previousStatus === 'completed') {
  // Create positive ledger entries to restore inventory
  await restoreInventoryForOrder(orderId);
}
```

### 2. Analytics
Add event handlers for metrics:
```javascript
on(ORDER_COMPLETED, async (data) => {
  await metrics.recordSale(data);
  await analytics.trackRevenue(data);
});
```

### 3. Notifications
```javascript
on(ORDER_COMPLETED, async (data) => {
  await notifyKitchen(data);
  await notifyCustomer(data);
});
```

### 4. Event Replay
Use EventLog to replay events:
```javascript
const failedEvents = await EventLog.find({ status: 'failed' });
for (const event of failedEvents) {
  await retryEvent(event);
}
```

## Testing

```javascript
// Test event emission
it('should emit ORDER_COMPLETED event', async () => {
  const spy = jest.spyOn(eventEmitter, 'emitEvent');
  await updateOrderById(orderId, { status: 'completed' }, userId);
  expect(spy).toHaveBeenCalledWith(EVENTS.ORDER_COMPLETED, expect.any(Object));
});

// Test event handler
it('should deduct inventory on ORDER_COMPLETED', async () => {
  await handleOrderCompleted({ orderId, userId });
  const ledger = await InventoryLedger.find({ referenceId: orderId });
  expect(ledger).toHaveLength(expectedItemCount);
});
```

## Migration Notes

### Before
```javascript
// In order service
if (status === ORDER_STATUS.COMPLETED) {
  for (const item of order.items) {
    await recipeService.deductIngredients(...);
  }
}
```

### After
```javascript
// In order service (simplified)
eventEmitter.emitEvent(EVENTS.ORDER_COMPLETED, { orderId, userId });

// In event handler (extracted logic)
on(ORDER_COMPLETED, handleOrderCompleted);
```

**No Breaking Changes:**
- Order API stays the same
- Frontend doesn't need updates
- Inventory deduction still happens automatically
- Just cleaner architecture internally
