const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { Organization, Item } = require('../src/models');
const ApiError = require('../src/utils/ApiError');
const { safeFindOne } = require('../src/utils/organizationGuard');

describe('tenant isolation guardrails', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const createOrganization = async (name) => {
    return Organization.create({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      plan: 'starter',
      limits: {
        maxUsers: 10,
        maxItems: 100,
        maxWarehouses: 1,
      },
      isActive: true,
    });
  };

  const createItem = async (organizationId, name) => {
    return Item.create({
      organizationId,
      name,
      sku: `${name}-sku`,
      unit: 'pcs',
      price: 10,
      costPrice: 5,
      isSellable: true,
      trackStock: true,
      isActive: true,
      options: [],
    });
  };

  test('plugin blocks unscoped model find queries', async () => {
    await expect(Item.find({}).exec()).rejects.toThrow('organizationId query scope is required');
  });

  test('plugin blocks unscoped model findOne queries', async () => {
    await expect(Item.findOne({}).exec()).rejects.toThrow('organizationId query scope is required');
  });

  test('plugin blocks unscoped model updateOne queries', async () => {
    await expect(Item.updateOne({}, { $set: { name: 'unsafe' } }).exec()).rejects.toThrow(
      'organizationId query scope is required'
    );
  });

  test('plugin blocks unscoped aggregate queries', async () => {
    await expect(Item.aggregate([]).exec()).rejects.toThrow('organizationId aggregate scope is required');
  });

  test('safeFindOne works with a valid organizationId', async () => {
    const organization = await createOrganization('Alpha Org');
    const item = await createItem(organization.id, 'Tenant Safe Item');

    const result = await safeFindOne(Item, organization.id, { _id: item.id });

    expect(result).not.toBeNull();
    expect(result.id).toBe(item.id);
    expect(result.organizationId.toString()).toBe(organization.id);
  });

  test('safeFindOne throws when organizationId is missing', () => {
    expect(() => safeFindOne(Item, null, { name: 'Unsafe Item' })).toThrow(ApiError);
    expect(() => safeFindOne(Item, null, { name: 'Unsafe Item' })).toThrow('organizationId is required');
  });

  test('cross-tenant access returns null', async () => {
    const organizationA = await createOrganization('Org A');
    const organizationB = await createOrganization('Org B');
    const item = await createItem(organizationA.id, 'Org A Item');

    const result = await safeFindOne(Item, organizationB.id, { _id: item.id });

    expect(result).toBeNull();
  });
});
