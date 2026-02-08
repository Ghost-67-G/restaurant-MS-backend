const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const invoiceService = require('../../services/invoice.service');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');

const createInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body.orderId, req.user.id);
  res.status(httpStatus.CREATED).send(invoice);
});

const getInvoices = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['orderId', 'invoiceNumber']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await invoiceService.queryInvoices(filter, options);
  res.send(result);
});

const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found');
  }
  res.send(invoice);
});

const getInvoiceByNumber = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByNumber(req.params.invoiceNumber);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found');
  }
  res.send(invoice);
});

const getOrderInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByOrderId(req.params.orderId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invoice not found for this order');
  }
  res.send(invoice);
});

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  getInvoiceByNumber,
  getOrderInvoice,
};
