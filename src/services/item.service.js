const httpStatus = require('http-status');
const { Item, Inventory } = require('../models');
const ApiError = require('../utils/ApiError');
const { validateOrganizationId, buildOrganizationFilter, safeFindOne } = require('../utils/organizationGuard');

const createInventoryRecord = async (organizationId, itemId, itemBody) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);

  if (!itemBody.trackStock) {
    return null;
  }

  return Inventory.create({
    organizationId: normalizedOrganizationId,
    itemId,
    quantity: itemBody.initialStock || 0,
    lowStockThreshold: itemBody.lowStockThreshold || 10,
    allowNegativeStock: Boolean(itemBody.allowNegativeStock),
  });
};

const createItem = async (organizationId, itemBody) => {
  const normalizedOrganizationId = validateOrganizationId(organizationId);
  const item = await Item.create({
    organizationId: normalizedOrganizationId,
    name: itemBody.name,
    sku: itemBody.sku,
    barcode: itemBody.barcode,
    category: itemBody.category,
    description: itemBody.description,
    unit: itemBody.unit,
    price: itemBody.price,
    costPrice: itemBody.costPrice,
    isSellable: itemBody.isSellable,
    trackStock: itemBody.trackStock,
    isActive: itemBody.isActive,
    options: itemBody.options,
  });

  await createInventoryRecord(normalizedOrganizationId, item.id, itemBody);

  return item;
};

const queryItems = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  return Item.paginate(buildOrganizationFilter(organizationId, filter), options);
};

const getItemById = async (organizationId, itemId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Item, organizationId, { _id: itemId });
};

const updateItemById = async (organizationId, itemId, updateBody) => {
  validateOrganizationId(organizationId);
  const item = await getItemById(organizationId, itemId);
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
  }

  Object.assign(item, {
    name: updateBody.name !== undefined ? updateBody.name : item.name,
    sku: updateBody.sku !== undefined ? updateBody.sku : item.sku,
    barcode: updateBody.barcode !== undefined ? updateBody.barcode : item.barcode,
    category: updateBody.category !== undefined ? updateBody.category : item.category,
    description: updateBody.description !== undefined ? updateBody.description : item.description,
    unit: updateBody.unit !== undefined ? updateBody.unit : item.unit,
    price: updateBody.price !== undefined ? updateBody.price : item.price,
    costPrice: updateBody.costPrice !== undefined ? updateBody.costPrice : item.costPrice,
    isSellable: updateBody.isSellable !== undefined ? updateBody.isSellable : item.isSellable,
    trackStock: updateBody.trackStock !== undefined ? updateBody.trackStock : item.trackStock,
    isActive: updateBody.isActive !== undefined ? updateBody.isActive : item.isActive,
    options: updateBody.options !== undefined ? updateBody.options : item.options,
  });
  await item.save();

  const inventory = await safeFindOne(Inventory, organizationId, { itemId: item.id });
  if (item.trackStock) {
    if (!inventory) {
      await createInventoryRecord(organizationId, item.id, updateBody);
    } else {
      if (updateBody.lowStockThreshold !== undefined) {
        inventory.lowStockThreshold = updateBody.lowStockThreshold;
      }
      if (updateBody.allowNegativeStock !== undefined) {
        inventory.allowNegativeStock = updateBody.allowNegativeStock;
      }
      await inventory.save();
    }
  }

  return item;
};

const deleteItemById = async (organizationId, itemId) => {
  validateOrganizationId(organizationId);
  const item = await getItemById(organizationId, itemId);
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
  }

  await Inventory.deleteOne(buildOrganizationFilter(organizationId, { itemId }));
  await item.remove();
  return item;
};

module.exports = {
  createItem,
  queryItems,
  getItemById,
  updateItemById,
  deleteItemById,
};
