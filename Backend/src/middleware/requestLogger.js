const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    logger.info('http.request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - started,
    });
  });
  next();
};