const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const routesPath = path.join(__dirname);

const loadRoutes = (dirPath) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.readdirSync(dirPath).forEach((file) => {
    const fullPath = path.join(dirPath, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const routePath = path.join(fullPath, 'route.js');
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(routePath)) {
        // eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require, global-require
        const route = require(routePath);
        router.use(`/${file}`, route);
      }
    }
  });
};
loadRoutes(routesPath);

module.exports = router;
