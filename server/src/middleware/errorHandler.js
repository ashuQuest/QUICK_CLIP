import { config } from '../config/index.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  // Check for specific error types
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Request payload exceeds the maximum allowed size limit.',
    });
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS request blocked by server security policy.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProd = config.nodeEnv === 'production';

  console.error(`[Error] [${req.method} ${req.url}] ${err.message}`, isProd ? '' : err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : (statusCode === 500 ? 'An unexpected server error occurred.' : err.message),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
