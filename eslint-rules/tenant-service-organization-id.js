const path = require('path');

const DB_METHODS = new Set([
  'aggregate',
  'countDocuments',
  'create',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndUpdate',
  'paginate',
  'updateMany',
  'updateOne',
]);

const EXCLUDED_FILES = new Set(['email.service.js', 'organization.service.js', 'token.service.js']);
const EXCLUDED_FUNCTIONS = new Set(['createOrganizationForSignup', 'getOrganizationById', 'getUserByEmail']);

const isServiceFile = (filename) => {
  const normalized = filename.split(path.sep).join('/');
  return normalized.includes('/src/services/');
};

const shouldSkipFile = (filename) => EXCLUDED_FILES.has(path.basename(filename));

const getFunctionName = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === 'FunctionDeclaration' && node.id) {
    return node.id.name;
  }

  if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
    return node.id.name;
  }

  return null;
};

const containsDbCall = (node) => {
  let found = false;

  const visit = (current) => {
    if (!current || found) {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (typeof current !== 'object') {
      return;
    }

    if (
      current.type === 'CallExpression' &&
      current.callee &&
      current.callee.type === 'MemberExpression' &&
      !current.callee.computed &&
      current.callee.property &&
      DB_METHODS.has(current.callee.property.name)
    ) {
      found = true;
      return;
    }

    Object.keys(current).forEach((key) => {
      if (key !== 'parent') {
        visit(current[key]);
      }
    });
  };

  visit(node.body || node.init || node);
  return found;
};

const hasOrganizationIdFirstParam = (functionNode) => {
  const params = functionNode.params || [];
  return params.length > 0 && params[0].type === 'Identifier' && params[0].name === 'organizationId';
};

const getFunctionNodeFromDeclarator = (declarator) => {
  if (!declarator || !declarator.init) {
    return null;
  }

  if (declarator.init.type === 'ArrowFunctionExpression' || declarator.init.type === 'FunctionExpression') {
    return declarator.init;
  }

  return null;
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce organizationId as the first parameter for tenant-scoped service functions',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    if (!isServiceFile(filename) || shouldSkipFile(filename)) {
      return {};
    }

    const functionDeclarations = new Map();
    const functionDeclarators = new Map();
    const exportedFunctionNames = new Set();

    const reportIfNeeded = (functionNode, name, reportNode) => {
      if (!name || EXCLUDED_FUNCTIONS.has(name)) {
        return;
      }

      if (!containsDbCall(functionNode)) {
        return;
      }

      if (!hasOrganizationIdFirstParam(functionNode)) {
        context.report({
          node: reportNode,
          message: "Tenant-scoped service function '{{name}}' must accept organizationId as its first parameter.",
          data: { name },
        });
      }
    };

    return {
      FunctionDeclaration(node) {
        const name = getFunctionName(node);
        if (name) {
          functionDeclarations.set(name, node);
        }
      },
      VariableDeclarator(node) {
        const functionNode = getFunctionNodeFromDeclarator(node);
        if (!functionNode) {
          return;
        }

        const name = getFunctionName(node);
        if (name) {
          functionDeclarators.set(name, {
            functionNode,
            reportNode: node.id || node,
          });
        }
      },
      AssignmentExpression(node) {
        if (
          node.left &&
          node.left.type === 'MemberExpression' &&
          !node.left.computed &&
          node.left.object &&
          node.left.object.type === 'Identifier' &&
          node.left.object.name === 'module' &&
          node.left.property &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'exports' &&
          node.right &&
          node.right.type === 'ObjectExpression'
        ) {
          node.right.properties.forEach((property) => {
            if (property.type === 'Property' && property.key && property.key.type === 'Identifier') {
              exportedFunctionNames.add(property.key.name);
            }
          });
        }

        if (
          node.left &&
          node.left.type === 'MemberExpression' &&
          !node.left.computed &&
          node.left.object &&
          node.left.object.type === 'Identifier' &&
          node.left.object.name === 'module' &&
          node.left.property &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'exports' &&
          node.right &&
          node.right.type === 'Identifier'
        ) {
          exportedFunctionNames.add(node.right.name);
        }

        if (
          node.left &&
          node.left.type === 'MemberExpression' &&
          !node.left.computed &&
          node.left.object &&
          node.left.object.type === 'MemberExpression' &&
          !node.left.object.computed &&
          node.left.object.object &&
          node.left.object.object.type === 'Identifier' &&
          node.left.object.object.name === 'module' &&
          node.left.object.property &&
          node.left.object.property.type === 'Identifier' &&
          node.left.object.property.name === 'exports' &&
          node.left.property &&
          node.left.property.type === 'Identifier'
        ) {
          exportedFunctionNames.add(node.left.property.name);
        }
      },
      'Program:exit': function onProgramExit() {
        exportedFunctionNames.forEach((name) => {
          const functionDeclaration = functionDeclarations.get(name);
          if (functionDeclaration) {
            reportIfNeeded(functionDeclaration, name, functionDeclaration.id || functionDeclaration);
            return;
          }

          const functionDeclarator = functionDeclarators.get(name);
          if (functionDeclarator) {
            reportIfNeeded(functionDeclarator.functionNode, name, functionDeclarator.reportNode);
          }
        });
      },
    };
  },
};
