const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ORDER_TYPE = {
  DINE_IN: 'dine-in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
};

const DISCOUNT_TYPE = {
  PERCENT: 'PERCENT',
  FLAT: 'FLAT',
};

const ADJUSTMENT_TYPE = {
  REFUND: 'REFUND',
  VOID: 'VOID',
};

const WASTE_REASON = {
  EXPIRED: 'EXPIRED',
  BURNT: 'BURNT',
  SPOILED: 'SPOILED',
  DAMAGED: 'DAMAGED',
  OTHER: 'OTHER',
};

const LEDGER_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  WASTE: 'WASTE',
  ADJUSTMENT: 'ADJUSTMENT',
};

const LEDGER_REFERENCE_TYPE = {
  ORDER: 'ORDER',
  PURCHASE: 'PURCHASE',
  WASTE: 'WASTE',
  MANUAL: 'MANUAL',
};

module.exports = {
  ORDER_STATUS,
  ORDER_TYPE,
  DISCOUNT_TYPE,
  ADJUSTMENT_TYPE,
  WASTE_REASON,
  LEDGER_TYPE,
  LEDGER_REFERENCE_TYPE,
};
