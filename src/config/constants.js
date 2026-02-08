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

module.exports = {
  ORDER_STATUS,
  ORDER_TYPE,
  DISCOUNT_TYPE,
  ADJUSTMENT_TYPE,
};
