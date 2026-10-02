# Tenant Architecture

This backend is organization-scoped. Tenant isolation is enforced at three layers:

1. JWT claims and request middleware
2. Service-layer fail-fast guards
3. Mongoose query guard plugin

The goal is simple: tenant leaks should be caught during development, blocked in tests, and rejected immediately at runtime if they still slip through.

## Tenant Model

- A user belongs to exactly one organization.
- Tenant-owned data includes items, orders, inventory, ledgers, taxes, invoices, alerts, event logs, and adjustments.
- Every tenant-owned record must include `organizationId`.

## organizationId Flow

Tenant scope flows through the system like this:

1. User authenticates.
2. JWT includes `organizationId`.
3. Auth middleware validates the token and attaches user context.
4. `attachOrganization` populates `req.organizationId`.
5. Controllers pass `req.organizationId` into services.
6. Services validate `organizationId` first and build scoped filters.
7. Mongoose plugin rejects unscoped tenant-owned model queries.

## Service Contract Rules

All tenant-scoped services must follow this contract:

- `organizationId` must be the first parameter.
- The first executable line must validate tenant scope.
- Services must never trust tenant scope from client body or query input.
- Use helper utilities instead of hand-writing raw unscoped queries.

Recommended shape:

```js
const getItemById = async (organizationId, itemId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Item, organizationId, { _id: itemId });
};
```

## Guard Utilities

The shared utilities are in `src/utils/organizationGuard.js`.

Available helpers:

- `validateOrganizationId(organizationId)`
- `buildOrganizationFilter(organizationId, filter)`
- `safeQuery(model, organizationId, filter)`
- `safeFindOne(model, organizationId, filter)`

### Example

```js
const { validateOrganizationId, safeFindOne } = require('../utils/organizationGuard');

const getInventoryById = async (organizationId, inventoryId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Inventory, organizationId, { _id: inventoryId });
};
```

## Mongoose Plugin Enforcement

Tenant-owned models use `organizationGuard.plugin.js`.

It blocks these operations when `organizationId` is missing:

- `find`
- `findOne`
- `updateOne`
- `updateMany`
- `deleteOne`
- `deleteMany`
- `findOneAndUpdate`
- `findOneAndDelete`
- `countDocuments`
- `aggregate`

That means this is forbidden:

```js
await Item.find({});
await Item.findOne({ _id: itemId });
await Item.aggregate([]);
```

And this is allowed:

```js
await Item.find({ organizationId });
await safeFindOne(Item, organizationId, { _id: itemId });
await Item.aggregate([{ $match: { organizationId } }]);
```

## Allowed vs Forbidden Patterns

Allowed:

```js
const queryItems = async (organizationId, filter, options) => {
  validateOrganizationId(organizationId);
  return Item.paginate(buildOrganizationFilter(organizationId, filter), options);
};
```

Forbidden:

```js
const queryItems = async (filter, options) => {
  return Item.paginate(filter, options);
};
```

Allowed:

```js
const getOrder = async (organizationId, orderId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Order, organizationId, { _id: orderId });
};
```

Forbidden:

```js
const getOrder = async (orderId) => {
  return Order.findById(orderId);
};
```

## Developer Guardrails

### ESLint Rule

The repo includes a custom ESLint rule at `eslint-rules/tenant-service-organization-id.js`.

It checks service files under `src/services` and flags exported functions that:

- contain direct database query calls
- but do not accept `organizationId` as the first parameter

This runs automatically in:

```bash
npm run lint
```

### Test Suite

Tenant isolation tests live in:

`tests/tenantIsolation.test.js`

They verify:

- unscoped model queries throw
- `safeFindOne` works when tenant scope is valid
- missing tenant scope throws immediately
- cross-tenant reads return `null`

Run them with:

```bash
npm test
```

## Debugging Tenant Issues

If tenant access fails unexpectedly:

1. Confirm the JWT contains `organizationId`.
2. Confirm `req.organizationId` is present after auth middleware.
3. Confirm the controller passes `req.organizationId` as the first service argument.
4. Confirm the service validates `organizationId` first.
5. Confirm the query uses `safeFindOne`, `safeQuery`, or `buildOrganizationFilter`.
6. If the error comes from a model query, check whether the Mongoose plugin rejected an unscoped query.

Common failure messages:

- `organizationId is required`
- `organizationId must be a valid ObjectId`
- `organizationId query scope is required`
- `organizationId aggregate scope is required`
- `Cross-organization query attempted`

## Intentional Exceptions

Some auth/bootstrap flows cannot be tenant-scoped in the same way as business data.

Examples:

- organization creation
- token verification helpers
- login lookups before request tenant scope is attached

These exceptions must be explicit, documented, and kept narrow.

## Service Signature Hint

Use this JSDoc convention for tenant-scoped services:

```js
/**
 * @callback TenantScopedService
 * @param {string} organizationId
 * @param {...any} args
 */
```

Or annotate individual functions directly:

```js
/**
 * @param {string} organizationId
 * @param {string} itemId
 */
const getItemById = async (organizationId, itemId) => {
  validateOrganizationId(organizationId);
  return safeFindOne(Item, organizationId, { _id: itemId });
};
```

The contract matters more than the syntax: tenant scope always comes first.