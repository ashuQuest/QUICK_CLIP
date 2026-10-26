import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Share } from '../models/Share.js';
import { storageProvider } from '../services/storage/index.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { generateManagementToken, hashToken } from '../utils/token.js';
import { sanitizeFilename, calculateExpiryDate } from '../utils/sanitizer.js';
import { config } from '../config/index.js';

export async function initiateUpload(req, res, next) {
  try {
    const { filename, fileSize, mimeType, expirySeconds, burnAfterRead, multipart } = req.body;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid filename is required.' });
    }

    const size = parseInt(fileSize, 10);
    if (isNaN(size) || size <= 0) {
      return res.status(400).json({ success: false, message: 'Valid file size is required.' });
    }

    if (size > config.maxUploadSizeBytes) {
      const maxMb = Math.round(config.maxUploadSizeBytes / (1024 * 1024));
      return res.status(413).json({
        success: false,
        message: `File exceeds the maximum upload limit of ${maxMb} MB (1 GB).`,
      });
    }

    const sanitizedName = sanitizeFilename(filename);
    const shareId = crypto.randomUUID();
    const code = await generateUniqueCode();
    const expiresAt = calculateExpiryDate(expirySeconds, config.defaultExpirySeconds);
    const managementToken = generateManagementToken();
    const managementTokenHash = hashToken(managementToken);

    // Storage key structure: shares/<shareId>/<sanitizedName>
    const storageKey = `shares/${shareId}/${sanitizedName}`;

    // Decide if multipart: explicitly requested OR size > 100MB
    const useMultipart = Boolean(multipart) || size > 100 * 1024 * 1024;

    let uploadSession;
    if (useMultipart) {
      uploadSession = await storageProvider.initiateMultipartUpload({
        storageKey,
        mimeType,
      });
    } else {
      uploadSession = await storageProvider.initiateUpload({
        storageKey,
        mimeType,
        fileSize: size,
      });
    }

    const share = await Share.create({
      shareId,
      shareType: 'file',
      code,
      uploadStatus: 'pending',
      managementTokenHash,
      burnAfterRead: Boolean(burnAfterRead),
      expiresAt,
      file: {
        originalName: filename,
        sanitizedName,
        size,
        mimeType: mimeType || 'application/octet-stream',
        storageKey,
        storageProvider: config.storageProvider,
        isMultipart: useMultipart,
        uploadId: uploadSession.uploadId || null,
        parts: [],
      },
    });

    const shareUrl = `${config.publicAppUrl}/share/${shareId}`;

    res.status(201).json({
      success: true,
      data: {
        shareId: share.shareId,
        code: share.code,
        shareUrl,
        storageKey,
        isMultipart: useMultipart,
        uploadSession,
        expiresAt: share.expiresAt,
        managementToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPartUploadUrl(req, res, next) {
  try {
    const { id } = req.params;
    const { partNumber } = req.body;

    const num = parseInt(partNumber, 10);
    if (isNaN(num) || num < 1 || num > 10000) {
      return res.status(400).json({ success: false, message: 'Invalid part number.' });
    }

    const share = await Share.findOne({ shareId: id, uploadStatus: 'pending' });
    if (!share || !share.file || !share.file.isMultipart) {
      return res.status(404).json({ success: false, message: 'Multipart upload session not found or expired.' });
    }

    const partInfo = await storageProvider.getPartUploadUrl({
      storageKey: share.file.storageKey,
      uploadId: share.file.uploadId,
      partNumber: num,
    });

    res.json({
      success: true,
      data: {
        partNumber: num,
        ...partInfo,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function completeUpload(req, res, next) {
  try {
    const { id } = req.params;
    const { parts } = req.body;

    const share = await Share.findOne({ shareId: id, uploadStatus: 'pending' });
    if (!share || !share.file) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found, expired, or already completed.',
      });
    }

    // If multipart, complete it with the storage provider
    if (share.file.isMultipart) {
      if (!Array.isArray(parts) || parts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parts array with ETags is required to complete multipart upload.',
        });
      }

      await storageProvider.completeMultipartUpload({
        storageKey: share.file.storageKey,
        uploadId: share.file.uploadId,
        parts,
      });
    }

    // Verify object in storage
    const verification = await storageProvider.verifyObject(share.file.storageKey);
    if (!verification.exists) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file could not be verified in storage. Please retry upload.',
      });
    }

    share.uploadStatus = 'completed';
    if (verification.size) {
      share.file.size = verification.size;
    }
    await share.save();

    const shareUrl = `${config.publicAppUrl}/share/${share.shareId}`;

    res.json({
      success: true,
      data: {
        shareId: share.shareId,
        code: share.code,
        shareUrl,
        filename: share.file.originalName,
        size: share.file.size,
        mimeType: share.file.mimeType,
        expiresAt: share.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function abortUpload(req, res, next) {
  try {
    const { id } = req.params;
    const share = await Share.findOne({ shareId: id });

    if (!share) {
      return res.status(404).json({ success: false, message: 'Upload session not found.' });
    }

    if (share.uploadStatus === 'pending' && share.file) {
      if (share.file.isMultipart && share.file.uploadId) {
        await storageProvider.abortMultipartUpload({
          storageKey: share.file.storageKey,
          uploadId: share.file.uploadId,
        });
      } else {
        await storageProvider.deleteObject(share.file.storageKey);
      }
      share.uploadStatus = 'cancelled';
      await share.save();
    }

    res.json({ success: true, message: 'Upload session cancelled.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Local Streaming Upload Endpoint (Used when STORAGE_PROVIDER=local)
 * Streams the incoming chunk directly into disk storage without reading into memory!
 */
export async function handleLocalStreamUpload(req, res, next) {
  try {
    const rawKey = req.params[0] || req.params.storageKey;
    const storageKey = decodeURIComponent(rawKey);

    if (!storageKey || storageKey.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid storage key.' });
    }

    const filePath = storageProvider.getFilePath(storageKey);
    const writeStream = fs.createWriteStream(filePath);

    await pipeline(req, writeStream);

    res.status(200).json({
      success: true,
      message: 'File streamed to local storage successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Local Streaming Multipart Part Upload Endpoint
 */
export async function handleLocalPartUpload(req, res, next) {
  try {
    const rawKey = req.params[0] || req.params.storageKey;
    const storageKey = decodeURIComponent(rawKey);
    const partNumber = parseInt(req.params.partNumber, 10);

    if (!storageKey || storageKey.includes('..') || isNaN(partNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters.' });
    }

    const partPath = storageProvider.getPartPath(storageKey, partNumber);
    const writeStream = fs.createWriteStream(partPath);

    await pipeline(req, writeStream);

    // Return a dummy ETag for local parts so frontend contract is uniform
    const etag = `local_part_${partNumber}_${Date.now()}`;

    res.status(200).json({
      success: true,
      partNumber,
      etag,
    });
  } catch (err) {
    next(err);
  }
}
