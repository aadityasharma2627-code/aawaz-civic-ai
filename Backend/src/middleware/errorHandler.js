const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  });
}

// No stack traces leak in production; no raw DB errors reach the client.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    logger.warn('request.rejected', { code: err.code, path: req.path, message: err.message });
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' },
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large.' },
    });
  }
  logger.error('request.failed', {
    path: req.path,
    message: err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: config.isProduction ? 'Internal server error.' : err.message,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };