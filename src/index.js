const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { registerEventHandlers } = require('./events');

let server;
const mongooseOptions = {
  ...config.mongoose.options,
  serverSelectionTimeoutMS: 10000,
};

logger.info(`Connecting to MongoDB at ${config.mongoose.url}`);

mongoose
  .connect(config.mongoose.url, mongooseOptions)
  .then(() => {
    logger.info('Connected to MongoDB');

    // Register event handlers
    registerEventHandlers();

    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  // Ensure crash reason is emitted even if logger formatting drops stack.
  // eslint-disable-next-line no-console
  console.error('Unexpected backend error:', error);
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
