import confetti from 'canvas-confetti';

/**
 * Copies text to system clipboard with fallback
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback using temporary textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Fires celebration confetti on successful share creation
 */
export function fireCelebration() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#8b5cf6', '#10b981', '#3b82f6'],
    });
  } catch (e) {
    // Ignore confetti errors if canvas unavailable
  }
}

/**
 * Returns QR code image URL for a given target link
 */
export function getQrCodeUrl(url, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1e1b4b&margin=10`;
}
