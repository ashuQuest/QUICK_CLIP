import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for code retrieval to prevent brute force guessing
 */
export const codeRetrievalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 45, // Limit each IP to 45 code lookups per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many retrieval attempts. Please wait a few minutes before trying again.',
  },
});

/**
 * Upload initiation rate limiter to prevent spamming upload sessions
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached. Please wait before creating more shares.',
  },
});
