const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const models = require('../models');

const outputPath = process.env.RMS_EXPORT_PATH;
const mongoUrl = process.env.MONGODB_URL;

if (!outputPath) {
  throw new Error('RMS_EXPORT_PATH is required');
}

if (!mongoUrl) {
  throw new Error('MONGODB_URL is required');
}

const exportCollections = async () => {
  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      appVersion: process.env.RMS_APP_VERSION || 'unknown',
      mongoUrl,
      collections: {},
    };

    const collectionEntries = await Promise.all(
      Object.entries(models).map(async ([modelName, Model]) => [modelName, await Model.find({}).lean()])
    );

    payload.collections = Object.fromEntries(collectionEntries);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

exportCollections()
  .then(() => {
    process.stdout.write(`${outputPath}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  });
