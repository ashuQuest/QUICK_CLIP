import { Share } from '../models/Share.js';
import { storageProvider } from './storage/index.js';
import { config } from '../config/index.js';

let intervalHandle = null;

export async function runCleanup() {
  console.log(`[CleanupService] Starting periodic expired files cleanup...`);
  try {
    const now = new Date();

    // 1. Find all expired shares with files
    const expiredShares = await Share.find({
      expiresAt: { $lt: now },
    });

    let deletedFilesCount = 0;

    for (const share of expiredShares) {
      if (share.shareType === 'file' && share.file?.storageKey) {
        await storageProvider.deleteObject(share.file.storageKey);
        deletedFilesCount++;
      }
      await Share.deleteOne({ _id: share._id });
    }

    // 2. Abort stale multipart uploads or orphaned chunks
    await storageProvider.abortStaleMultipartUploads(24 * 60 * 60 * 1000);

    // 3. Remove pending uploads older than 3 hours that were never completed
    const stalePendingTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const stalePending = await Share.find({
      uploadStatus: 'pending',
      createdAt: { $lt: stalePendingTime },
    });

    for (const pending of stalePending) {
      if (pending.file?.storageKey) {
        if (pending.file.isMultipart && pending.file.uploadId) {
          await storageProvider.abortMultipartUpload({
            storageKey: pending.file.storageKey,
            uploadId: pending.file.uploadId,
          });
        } else {
          await storageProvider.deleteObject(pending.file.storageKey);
        }
      }
      await Share.deleteOne({ _id: pending._id });
    }

    console.log(
      `[CleanupService] Cleanup complete. Removed ${expiredShares.length} expired shares (${deletedFilesCount} files) and ${stalePending.length} stale pending uploads.`
    );
  } catch (err) {
    console.error(`[CleanupService] Error during cleanup run:`, err.message);
  }
}

export function startCleanupJob() {
  const intervalMs = config.cleanupIntervalMinutes * 60 * 1000;
  console.log(`[CleanupService] Initialized recurring cleanup job every ${config.cleanupIntervalMinutes} minutes.`);

  // Run initial cleanup 10 seconds after boot
  setTimeout(runCleanup, 10000);

  intervalHandle = setInterval(runCleanup, intervalMs);
}

export function stopCleanupJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
