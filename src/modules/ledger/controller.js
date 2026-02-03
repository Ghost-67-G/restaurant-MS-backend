const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { inventoryLedgerService } = require('../../services');

const getLedgerEntries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ingredientId', 'type', 'referenceType', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Default sort by most recent
  if (!options.sortBy) {
    options.sortBy = 'createdAt:desc';
  }
  
  const result = await inventoryLedgerService.queryLedgerEntries(filter, options);
  res.send(result);
});

const getLedgerEntry = catchAsync(async (req, res) => {
  const ledgerEntry = await inventoryLedgerService.getLedgerEntryById(req.params.ledgerId);
  if (!ledgerEntry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ledger entry not found');
  }
  res.send(ledgerEntry);
});

const getLedgerByIngredient = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await inventoryLedgerService.getLedgerByIngredient(req.params.ingredientId, options);
  res.send(result);
});

const getLedgerStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await inventoryLedgerService.getLedgerStats(req.params.ingredientId, startDate, endDate);
  res.send(stats);
});

module.exports = {
  getLedgerEntries,
  getLedgerEntry,
  getLedgerByIngredient,
  getLedgerStats,
};
