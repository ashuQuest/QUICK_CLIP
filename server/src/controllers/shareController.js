import { Share } from '../models/Share.js';
import { storageProvider } from '../services/storage/index.js';
import { verifyToken } from '../utils/token.js';

export async function getShareMetadata(req, res, next) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Share code or ID is required.' });
    }

    const trimmed = code.trim();
    const query = {
      $or: [{ code: trimmed.toUpperCase() }, { shareId: trimmed }],
      uploadStatus: 'completed',
    };

    const share = await Share.findOne(query);

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found or upload has not completed yet.',
      });
    }

    // Check expiration
    if (new Date() > share.expiresAt) {
      // Clean up expired
      if (share.shareType === 'file' && share.file?.storageKey) {
        await storageProvider.deleteObject(share.file.storageKey);
      }
      await Share.deleteOne({ _id: share._id });

      return res.status(410).json({
        success: false,
        message: 'This share has expired and is no longer available.',
      });
    }

    // Form safe public response
    const data = {
      shareId: share.shareId,
      code: share.code,
      shareType: share.shareType,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      burnAfterRead: share.burnAfterRead,
      downloadCount: share.downloadCount,
    };

    if (share.shareType === 'text') {
      data.textContent = share.textContent;
    } else if (share.shareType === 'file' && share.file) {
      data.file = {
        filename: share.file.originalName,
        size: share.file.size,
        mimeType: share.file.mimeType,
      };
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Share code or ID is required.' });
    }

    const trimmed = code.trim();
    const query = {
      $or: [{ code: trimmed.toUpperCase() }, { shareId: trimmed }],
      shareType: 'file',
      uploadStatus: 'completed',
    };

    const share = await Share.findOne(query);

    if (!share || !share.file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or upload has not completed.',
      });
    }

    // Check expiration
    if (new Date() > share.expiresAt) {
      if (share.file.storageKey) {
        await storageProvider.deleteObject(share.file.storageKey);
      }
      await Share.deleteOne({ _id: share._id });
      return res.status(410).json({
        success: false,
        message: 'This file share has expired.',
      });
    }

    const isBurnAfterRead = share.burnAfterRead;

    // Get download target (either redirect URL for S3 or stream for local)
    const downloadTarget = await storageProvider.getDownloadTarget({
      storageKey: share.file.storageKey,
      filename: share.file.originalName,
      mimeType: share.file.mimeType,
      expiresInSeconds: 300, // 5 minutes
    });

    // Update download stats
    share.downloadCount += 1;
    await share.save();

    if (downloadTarget.type === 'redirect') {
      // If burn after read with S3, we schedule deletion or delete after short delay
      if (isBurnAfterRead) {
        setTimeout(async () => {
          try {
            await storageProvider.deleteObject(share.file.storageKey);
            await Share.deleteOne({ _id: share._id });
          } catch (e) {
            console.error('Burn after read deletion error:', e);
          }
        }, 15000); // 15 seconds grace period for download to begin
      }

      return res.redirect(downloadTarget.url);
    } else if (downloadTarget.type === 'stream') {
      const safeFilename = encodeURIComponent(share.file.originalName).replace(/['()]/g, escape);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
      res.setHeader('Content-Type', share.file.mimeType || 'application/octet-stream');
      if (downloadTarget.size) {
        res.setHeader('Content-Length', downloadTarget.size);
      }

      downloadTarget.stream.pipe(res);

      if (isBurnAfterRead) {
        downloadTarget.stream.on('end', async () => {
          try {
            await storageProvider.deleteObject(share.file.storageKey);
            await Share.deleteOne({ _id: share._id });
          } catch (e) {
            console.error('Burn after read deletion error:', e);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteShare(req, res, next) {
  try {
    const { id } = req.params;
    const managementToken = req.headers['x-management-token'] || req.body?.managementToken;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Share identifier is required.' });
    }

    if (!managementToken) {
      return res.status(401).json({
        success: false,
        message: 'Sender management token is required to delete this share.',
      });
    }

    const share = await Share.findOne({
      $or: [{ shareId: id }, { code: id.toUpperCase() }],
    });

    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found or already deleted.' });
    }

    // Verify token
    const isAuthorized = verifyToken(managementToken, share.managementTokenHash);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid sender management token for this share.',
      });
    }

    // Delete object from storage if file
    if (share.shareType === 'file' && share.file?.storageKey) {
      await storageProvider.deleteObject(share.file.storageKey);
    }

    await Share.deleteOne({ _id: share._id });

    res.json({
      success: true,
      message: 'Share permanently deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
