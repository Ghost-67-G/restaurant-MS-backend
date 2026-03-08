const mongoose = require('mongoose');
const config = require('../config/config');
const { User, Ingredient, MenuItem, Recipe, Tax } = require('../models');

const seedUsers = [
  {
    name: 'Owner Admin',
    restaurantName: 'RMS Demo Kitchen',
    email: 'owner@rms.local',
    password: 'Owner123',
    role: 'owner',
    isEmailVerified: true,
  },
  {
    name: 'Cashier User',
    restaurantName: 'RMS Demo Kitchen',
    email: 'cashier@rms.local',
    password: 'Cashier123',
    role: 'cashier',
    isEmailVerified: true,
  },
  {
    name: 'Kitchen User',
    restaurantName: 'RMS Demo Kitchen',
    email: 'kitchen@rms.local',
    password: 'Kitchen123',
    role: 'kitchen',
    isEmailVerified: true,
  },
];

const seedIngredients = [
  {
    name: 'Burger Bun',
    unit: 'pcs',
    currentStock: 120,
    lowStockThreshold: 25,
    isActive: true,
  },
  {
    name: 'Chicken Patty',
    unit: 'pcs',
    currentStock: 100,
    lowStockThreshold: 20,
    isActive: true,
  },
  {
    name: 'Mayonnaise',
    unit: 'ml',
    currentStock: 6000,
    lowStockThreshold: 1000,
    isActive: true,
  },
  {
    name: 'Lettuce',
    unit: 'g',
    currentStock: 3000,
    lowStockThreshold: 500,
    isActive: true,
  },
  {
    name: 'Tomato',
    unit: 'g',
    currentStock: 2500,
    lowStockThreshold: 400,
    isActive: true,
  },
  {
    name: 'Cheese Slice',
    unit: 'pcs',
    currentStock: 200,
    lowStockThreshold: 40,
    isActive: true,
  },
  {
    name: 'French Fries (Frozen)',
    unit: 'g',
    currentStock: 9000,
    lowStockThreshold: 1500,
    isActive: true,
  },
  {
    name: 'Cooking Oil',
    unit: 'ltr',
    currentStock: 60,
    lowStockThreshold: 10,
    isActive: true,
  },
  {
    name: 'Soft Drink Syrup',
    unit: 'ltr',
    currentStock: 40,
    lowStockThreshold: 8,
    isActive: true,
  },
];

const seedMenuItems = [
  {
    name: 'Chicken Burger',
    price: 8.99,
    costPrice: 3.4,
    isAvailable: true,
    modifiers: [
      { name: 'Extra Mayo', price: 0.5 },
      { name: 'Extra Cheese', price: 0.8 },
    ],
  },
  {
    name: 'Cheese Chicken Burger',
    price: 9.79,
    costPrice: 3.9,
    isAvailable: true,
    modifiers: [{ name: 'Double Patty', price: 2.2 }],
  },
  {
    name: 'French Fries',
    price: 3.99,
    costPrice: 1.25,
    isAvailable: true,
    modifiers: [{ name: 'Large Size', price: 1.2 }],
  },
  {
    name: 'Cola',
    price: 1.99,
    costPrice: 0.45,
    isAvailable: true,
    modifiers: [{ name: 'Large Cup', price: 0.7 }],
  },
];

const recipeMap = {
  'Chicken Burger': [
    { ingredientName: 'Burger Bun', quantityUsed: 1 },
    { ingredientName: 'Chicken Patty', quantityUsed: 1 },
    { ingredientName: 'Mayonnaise', quantityUsed: 30 },
    { ingredientName: 'Lettuce', quantityUsed: 20 },
    { ingredientName: 'Tomato', quantityUsed: 25 },
  ],
  'Cheese Chicken Burger': [
    { ingredientName: 'Burger Bun', quantityUsed: 1 },
    { ingredientName: 'Chicken Patty', quantityUsed: 1 },
    { ingredientName: 'Cheese Slice', quantityUsed: 1 },
    { ingredientName: 'Mayonnaise', quantityUsed: 30 },
    { ingredientName: 'Lettuce', quantityUsed: 20 },
    { ingredientName: 'Tomato', quantityUsed: 25 },
  ],
  'French Fries': [
    { ingredientName: 'French Fries (Frozen)', quantityUsed: 150 },
    { ingredientName: 'Cooking Oil', quantityUsed: 0.03 },
  ],
  Cola: [{ ingredientName: 'Soft Drink Syrup', quantityUsed: 0.05 }],
};

async function upsertUser(userData) {
  const existing = await User.findOne({ email: userData.email });

  if (!existing) {
    const created = new User(userData);
    await created.save();
    return created;
  }

  existing.name = userData.name;
  existing.restaurantName = userData.restaurantName;
  existing.password = userData.password;
  existing.role = userData.role;
  existing.isEmailVerified = userData.isEmailVerified;
  await existing.save();
  return existing;
}

async function upsertIngredient(ingredientData) {
  return Ingredient.findOneAndUpdate({ name: ingredientData.name }, ingredientData, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

async function upsertMenuItem(menuItemData) {
  return MenuItem.findOneAndUpdate({ name: menuItemData.name }, menuItemData, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
}

async function seedTax() {
  await Tax.updateMany({}, { $set: { isActive: false } });

  await Tax.findOneAndUpdate(
    { name: 'VAT' },
    {
      name: 'VAT',
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

  const users = await Promise.all(seedUsers.map((user) => upsertUser(user)));
  console.log(`Seeded users: ${users.length}`);

  const ingredients = await Promise.all(seedIngredients.map((ingredient) => upsertIngredient(ingredient)));
  const ingredientByName = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient]));
  console.log(`Seeded ingredients: ${ingredients.length}`);

  const menuItems = await Promise.all(seedMenuItems.map((menuItem) => upsertMenuItem(menuItem)));
  const menuItemByName = new Map(menuItems.map((menuItem) => [menuItem.name, menuItem]));
  console.log(`Seeded menu items: ${menuItems.length}`);

  await Recipe.deleteMany({ menuItemId: { $in: menuItems.map((menuItem) => menuItem._id) } });

  const recipesToInsert = [];

  Object.entries(recipeMap).forEach(([menuItemName, recipeLines]) => {
    const menuItem = menuItemByName.get(menuItemName);
    if (!menuItem) {
      return;
    }

    recipeLines.forEach((line) => {
      const ingredient = ingredientByName.get(line.ingredientName);
      if (!ingredient) {
        return;
      }

      recipesToInsert.push({
        menuItemId: menuItem._id,
        ingredientId: ingredient._id,
        quantityUsed: line.quantityUsed,
      });
    });
  });

  if (recipesToInsert.length > 0) {
    await Recipe.insertMany(recipesToInsert);
  }

  console.log(`Seeded recipes: ${recipesToInsert.length}`);

  await seedTax();
  console.log('Seeded tax settings: VAT 12% active');

  console.log('--- Login Accounts ---');
  console.log('Owner   : owner@rms.local / Owner123');
  console.log('Cashier : cashier@rms.local / Cashier123');
  console.log('Kitchen : kitchen@rms.local / Kitchen123');
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
