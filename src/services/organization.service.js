const { Organization } = require('../models');

const PLAN_DEFAULT_LIMITS = {
  free: { maxUsers: 5, maxItems: 100, maxWarehouses: 1 },
  starter: { maxUsers: 20, maxItems: 2000, maxWarehouses: 3 },
  pro: { maxUsers: 200, maxItems: 50000, maxWarehouses: 50 },
};

const normalizeSlug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const generateUniqueSlug = async (name) => {
  const baseSlug = normalizeSlug(name) || `org-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Organization.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
};

const createOrganization = async (organizationBody) => {
  if (!organizationBody.name) {
    throw new Error('Organization name is required');
  }

  const plan = PLAN_DEFAULT_LIMITS[organizationBody.plan] ? organizationBody.plan : 'free';
  const slug = organizationBody.slug || (await generateUniqueSlug(organizationBody.name));

  return Organization.create({
    ...organizationBody,
    plan,
    limits: organizationBody.limits || PLAN_DEFAULT_LIMITS[plan],
    isActive: organizationBody.isActive !== undefined ? organizationBody.isActive : true,
    slug,
  });
};

const getOrganizationById = async (organizationId) => Organization.findById(organizationId);

module.exports = {
  createOrganization,
  getOrganizationById,
};
