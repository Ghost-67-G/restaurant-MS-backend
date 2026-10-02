const httpStatus = require('http-status');
const Invoice = require('../models/invoice.model');
const Order = require('../models/order.model');
const ApiError = require('../utils/ApiError');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

/**
 * Generate next invoice number
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20260208-0001)
 * @returns {Promise<string>}
 */
const generateInvoiceNumber = async (organizationId) => {
  validateOrganizationId(organizationId);
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  // Find the latest invoice for today
  const prefix = `INV-${dateStr}-`;
  const latestInvoice = await Invoice.findOne({
    organizationId,
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
 * @param {Object} user - User creating the invoice
 * @returns {Promise<Invoice>}
 */
const createInvoice = async (organizationId, orderId, user) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  const order = await safeFindOne(Order, normalizedOrganizationId, { _id: orderId }).populate('createdBy', 'name email');

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  const existingInvoice = await safeFindOne(Invoice, normalizedOrganizationId, { orderId });
  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = await generateInvoiceNumber(normalizedOrganizationId);

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
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    status: order.status,
    createdAt: order.createdAt,
    organizationId: order.organizationId,
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

  const invoice = await Invoice.create({
    organizationId: normalizedOrganizationId,
    orderId,
    invoiceNumber,
    snapshot,
    printedBy: user.id,
  });

  return invoice;
};

/**
 * Get invoice by ID
 * @param {ObjectId} invoiceId
 * @returns {Promise<Invoice>}
 */
const getInvoiceById = async (organizationId, invoiceId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Invoice, organizationId, { _id: invoiceId });
};

/**
 * Get invoice by invoice number
 * @param {string} invoiceNumber
 * @returns {Promise<Invoice>}
 */
const getInvoiceByNumber = async (organizationId, invoiceNumber) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Invoice, organizationId, { invoiceNumber });
};

/**
 * Get invoice by order ID
 * @param {ObjectId} orderId
 * @returns {Promise<Invoice>}
 */
const getInvoiceByOrderId = async (organizationId, orderId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Invoice, organizationId, { orderId });
};

/**
 * Query invoices
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryInvoices = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  const invoices = await Invoice.paginate(buildOrganizationFilter(organizationId, filter), options);
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
