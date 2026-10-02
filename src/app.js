const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const httpStatus = require('http-status');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const logger = require('./config/logger');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const { attachOrganization } = require('./middlewares/attachOrganization');
const routes = require('./modules');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();
const runtimeMode = process.env.RMS_RUNTIME === 'desktop' ? 'desktop' : 'web';

// set security HTTP headers
app.use(helmet());

// http request logging
if (config.env !== 'test') {
  const successHandler = morgan(':method :url :status - :response-time ms', {
    skip: (req, res) => res.statusCode >= 400,
    stream: { write: (message) => logger.info(message.trim()) },
  });

  const errorHandler1 = morgan(':method :url :status - :response-time ms', {
    skip: (req, res) => res.statusCode < 400,
    stream: { write: (message) => logger.error(message.trim()) },
  });

  app.use(successHandler);
  app.use(errorHandler1);
}

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// parse cookies
app.use(cookieParser());

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
const allowedOrigins =
  config.env === 'production'
    ? [config.frontendUrl]
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin (server-to-server, curl, or same-origin tools).
    if (!origin) {
      callback(null, true);
      return;
    }

    // Electron file:// renderer can appear as "null" origin in some flows.
    if (origin === 'null') {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/api/auth', authLimiter);
}

// Attach tenant context from JWT for downstream controllers/services.
app.use('/api', attachOrganization);

// Health endpoint used by desktop wrapper startup checks.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', runtime: runtimeMode });
});

// v1 api routes
app.use('/api', routes);

// Serve frontend static files in packaged desktop mode
if (runtimeMode === 'desktop') {
  const frontendDistPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/dist');

  app.use(express.static(frontendDistPath));

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// send back a 404 error for any unknown api request (only in non-desktop or non-SPA contexts)
if (runtimeMode !== 'desktop') {
  app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  });
}

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
