import path from 'path';

/**
 * Sanitizes a filename to prevent path traversal or filesystem issues
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Extract base filename to strip any directory path
  let name = path.basename(filename.trim());

  // Replace potentially dangerous characters (null bytes, control chars, path delimiters)
  name = name.replace(/[\0\x00-\x1F\x7F\\/:*?"<>|]/g, '_');

  // Avoid empty or dot-only filenames
  if (!name || name === '.' || name === '..') {
    name = `file_${Date.now()}`;
  }

  // Restrict filename length to 200 characters max while preserving extension
  if (name.length > 200) {
    const ext = path.extname(name);
    const base = path.basename(name, ext);
    name = `${base.slice(0, 190)}_${ext}`;
  }

  return name;
}

/**
 * Calculates expiration Date from requested duration (in seconds)
 */
export function calculateExpiryDate(requestedSeconds, defaultSeconds = 86400) {
  let seconds = parseInt(requestedSeconds, 10);
  if (isNaN(seconds) || seconds <= 0) {
    seconds = defaultSeconds;
  }

  // Maximum allowed expiration: 7 days (604,800 seconds)
  const maxSeconds = 7 * 24 * 60 * 60;
  if (seconds > maxSeconds) {
    seconds = maxSeconds;
  }

  // Minimum allowed expiration: 60 seconds (1 minute)
  if (seconds < 60) {
    seconds = 60;
  }

  return new Date(Date.now() + seconds * 1000);
}
