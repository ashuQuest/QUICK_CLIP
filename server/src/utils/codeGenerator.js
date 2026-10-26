import crypto from 'crypto';
import { Share } from '../models/Share.js';

/**
 * Generates a cryptographically random 6-digit numeric retrieval code
 * e.g., "492815"
 */
export function generateRandomCode() {
  const codeNum = crypto.randomInt(100000, 1000000);
  return codeNum.toString();
}

/**
 * Generates a unique 6-digit code among active (non-expired) shares.
 * Retries safely in the rare event of collision.
 */
export async function generateUniqueCode(maxAttempts = 10) {
  const now = new Date();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomCode();

    // Check if an active, non-expired share already exists with this code
    const existing = await Share.findOne({
      code,
      expiresAt: { $gt: now },
      uploadStatus: { $in: ['pending', 'completed'] },
    }).select('_id');

    if (!existing) {
      return code;
    }
  }

  // If numeric collision occurs after 10 attempts (extremely unlikely with 900,000 range),
  // fallback to a 6-character alphanumeric code
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let alphaCode = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    alphaCode += chars[bytes[i] % chars.length];
  }
  return alphaCode;
}
