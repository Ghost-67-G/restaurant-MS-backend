/* eslint-disable no-console */
const mongoose = require('mongoose');
const config = require('../config/config');
const { Organization, User, Item, Inventory, Tax } = require('../models');

const organizationSeed = {
  name: 'Demo Commerce Co',
  slug: 'demo-commerce-co',
  plan: 'starter',
  limits: {
    maxUsers: 25,
    maxItems: 500,
    maxWarehouses: 3,
  },
  isActive: true,
};

const seedUsers = [
  {
    name: 'Owner User',
    email: 'admin@demo.local',
    password: 'Admin123',
    role: 'owner',
    isEmailVerified: true,
  },
  {
    name: 'Staff User',
    email: 'cashier@demo.local',
    password: 'Cashier123',
    role: 'staff',
    isEmailVerified: true,
  },
  {
    name: 'Store Manager',
    email: 'inventory@demo.local',
    password: 'Inventory123',
    role: 'manager',
    isEmailVerified: true,
  },
];

const seedItems = [
  {
    name: 'Wireless Mouse',
    sku: 'WM-100',
    category: 'Accessories',
    unit: 'pcs',
    price: 24.99,
    costPrice: 12.5,
    isSellable: true,
    trackStock: true,
    isActive: true,
    quantity: 80,
    lowStockThreshold: 10,
  },
  {
    name: 'Notebook A5',
    sku: 'NB-A5',
    category: 'Stationery',
    unit: 'pcs',
    price: 5.99,
    costPrice: 2.1,
    isSellable: true,
    trackStock: true,
    isActive: true,
    quantity: 200,
    lowStockThreshold: 25,
  },
  {
    name: 'Coffee Beans 1kg',
    sku: 'CF-1KG',
    category: 'Beverages',
    unit: 'bag',
    price: 18.5,
    costPrice: 9.75,
    isSellable: true,
    trackStock: true,
    isActive: true,
    quantity: 45,
    lowStockThreshold: 8,
  },
  {
    name: 'Gift Card',
    sku: 'GC-001',
    category: 'Services',
    unit: 'pcs',
    price: 50,
    costPrice: 50,
    isSellable: true,
    trackStock: false,
    isActive: true,
  },
];

async function upsertOrganization(organizationData) {
  return Organization.findOneAndUpdate({ slug: organizationData.slug }, organizationData, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

async function upsertUser(organizationId, userData) {
  const existing = await User.findOne({ email: userData.email });

  if (!existing) {
    const created = new User({
      ...userData,
      organizationId,
    });
    await created.save();
    return created;
  }

  existing.name = userData.name;
  existing.password = userData.password;
  existing.role = userData.role;
  existing.isEmailVerified = userData.isEmailVerified;
  existing.organizationId = organizationId;
  await existing.save();
  return existing;
}

async function upsertItem(organizationId, itemData) {
  const item = await Item.findOneAndUpdate(
    { organizationId, name: itemData.name },
    {
      organizationId,
      name: itemData.name,
      sku: itemData.sku,
      category: itemData.category,
      unit: itemData.unit,
      price: itemData.price,
      costPrice: itemData.costPrice,
      isSellable: itemData.isSellable,
      trackStock: itemData.trackStock,
      isActive: itemData.isActive,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  if (item.trackStock) {
    await Inventory.findOneAndUpdate(
      { organizationId, itemId: item._id },
      {
        organizationId,
        itemId: item._id,
        quantity: itemData.quantity,
        lowStockThreshold: itemData.lowStockThreshold,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  return item;
}

async function seedTax(organizationId) {
  await Tax.updateMany({ organizationId }, { $set: { isActive: false } });

  await Tax.findOneAndUpdate(
    { organizationId, name: 'Standard Sales Tax' },
    {
      organizationId,
      name: 'Standard Sales Tax',
      percentage: 12,
      isActive: true,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function runSeeder() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  console.log('Connected to MongoDB');

  const organization = await upsertOrganization(organizationSeed);
  console.log(`Seeded organization: ${organization.name}`);

  const users = await Promise.all(seedUsers.map((user) => upsertUser(organization.id, user)));
  console.log(`Seeded users: ${users.length}`);

  const items = await Promise.all(seedItems.map((item) => upsertItem(organization.id, item)));
  console.log(`Seeded items: ${items.length}`);

  await seedTax(organization.id);
  console.log('Seeded tax settings: Standard Sales Tax 12% active');

  console.log('--- Login Accounts ---');
  console.log('Owner   : admin@demo.local / Admin123');
  console.log('Staff   : cashier@demo.local / Cashier123');
  console.log('Manager : inventory@demo.local / Inventory123');
}

runSeeder()
  .then(async () => {
    console.log('Seeder completed successfully');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seeder failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
