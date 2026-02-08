const httpStatus = require('http-status');
const Invoice = require('../models/invoice.model');
const Order = require('../models/order.model');
const ApiError = require('../utils/ApiError');

/**
 * Generate next invoice number
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20260208-0001)
 * @returns {Promise<string>}
 */
const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  // Find the latest invoice for today
  const prefix = `INV-${dateStr}-`;
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (latestInvoice) {
    const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  // Pad sequence to 4 digits
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${prefix}${sequenceStr}`;
};

/**
 * Create invoice for an order
 * @param {ObjectId} orderId
 * @param {ObjectId} userId - User creating the invoice
 * @returns {Promise<Invoice>}
 */
const createInvoice = async (orderId, userId) => {
  // Get the order with populated data
  const order = await Order.findById(orderId).populate('createdBy', 'name email');

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Check if invoice already exists for this order
  const existingInvoice = await Invoice.findOne({ orderId });
  if (existingInvoice) {
    // Return existing invoice instead of creating duplicate
    return existingInvoice;
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create complete snapshot of order
  const snapshot = {
    orderId: order._id.toString(),
    orderNumber: order._id.toString().slice(-8).toUpperCase(),
    items: order.items,
    subtotal: order.subtotal,
    discountType: order.discountType,
    discountValue: order.discountValue,
    discountAmount: order.discountAmount || 0,
    taxName: order.taxName,
    taxPercentage: order.taxPercentage,
    taxAmount: order.taxAmount || 0,
    deliveryFee: order.deliveryFee || 0,
    totalAmount: order.totalAmount,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    status: order.status,
    createdAt: order.createdAt,
    createdBy: order.createdBy
      ? {
          name: order.createdBy.name,
          email: order.createdBy.email,
        }
      : null,
    // Include adjustment info if any
    isVoided: order.isVoided,
    isRefunded: order.isRefunded,
    refundedAmount: order.refundedAmount || 0,
  };

  // Create invoice
  const invoice = await Invoice.create({
    orderId,
    invoiceNumber,
    snapshot,
    printedBy: userId,
  });

  return invoice;
};

/**
 * Get invoice by ID
 * @param {ObjectId} invoiceId
 * @returns {Promise<Invoice>}
 */
const getInvoiceById = async (invoiceId) => {
  return Invoice.findById(invoiceId);
};

/**
 * Get invoice by invoice number
 * @param {string} invoiceNumber
 * @returns {Promise<Invoice>}
 */
const getInvoiceByNumber = async (invoiceNumber) => {
  return Invoice.findOne({ invoiceNumber });
};

/**
 * Get invoice by order ID
 * @param {ObjectId} orderId
 * @returns {Promise<Invoice>}
 */
const getInvoiceByOrderId = async (orderId) => {
  return Invoice.findOne({ orderId });
};

/**
 * Query invoices
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryInvoices = async (filter, options) => {
  const invoices = await Invoice.paginate(filter, options);
  return invoices;
};

module.exports = {
  generateInvoiceNumber,
  createInvoice,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoiceByOrderId,
  queryInvoices,
};
