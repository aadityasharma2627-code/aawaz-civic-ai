const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());

// CORS restricted to configured frontend origins only (never '*' in production).
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '5mb' })); // room for base64 photo data URLs
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'awaaz-backend' });
});

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
});
app.use('/api', apiLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;