import crypto from 'crypto';

/**
 * Generates a secure random sender management token
 */
export function generateManagementToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Computes SHA-256 hash of a management token for secure storage
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') return null;
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Verifies if provided plain token matches stored hash
 */
export function verifyToken(plainToken, storedHash) {
  if (!plainToken || !storedHash) return false;
  const computed = hashToken(plainToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
  } catch (err) {
    return false;
  }
}
