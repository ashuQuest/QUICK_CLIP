/**
 * Formats byte size into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculates remaining time until expiration with a human-readable string
 */
export function formatTimeRemaining(expiryDate) {
  if (!expiryDate) return 'No expiry';
  const total = Date.parse(expiryDate) - Date.now();
  if (total <= 0) return 'Expired';

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

/**
 * Formats ISO date into human friendly string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Categorizes a file by MIME type or extension for icons and previews
 */
export function getFileCategory(mimeType = '', filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return 'archive';
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'rs', 'go'].includes(ext)) {
    return 'code';
  }
  if (['txt', 'md', 'doc', 'docx', 'rtf'].includes(ext) || mime.includes('text')) {
    return 'document';
  }
  return 'file';
}
