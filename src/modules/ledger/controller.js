const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { inventoryLedgerService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const getLedgerEntries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['inventoryId', 'itemId', 'type', 'referenceType', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Default sort by most recent
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }

  const result = await inventoryLedgerService.queryLedgerEntries(req.organizationId, filter, options);
  res.send(result);
});

const getLedgerEntry = catchAsync(async (req, res) => {
  const ledgerEntry = await inventoryLedgerService.getLedgerEntryById(req.organizationId, req.params.ledgerId);
  if (!ledgerEntry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ledger entry not found');
  }
  res.send(ledgerEntry);
});

const getLedgerByInventory = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await inventoryLedgerService.getLedgerByInventory(req.organizationId, req.params.inventoryId, options);
  res.send(result);
});

const getLedgerStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await inventoryLedgerService.getLedgerStats(req.organizationId, req.params.inventoryId, startDate, endDate);
  res.send(stats);
});

module.exports = {
  getLedgerEntries,
  getLedgerEntry,
  getLedgerByInventory,
  getLedgerStats,
};
