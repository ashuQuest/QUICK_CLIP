import crypto from 'crypto';
import { Share } from '../models/Share.js';
import { generateUniqueCode } from '../utils/codeGenerator.js';
import { generateManagementToken, hashToken } from '../utils/token.js';
import { calculateExpiryDate } from '../utils/sanitizer.js';
import { config } from '../config/index.js';

export async function createClipboardShare(req, res, next) {
  try {
    const { text, expirySeconds, burnAfterRead } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text content cannot be empty.',
      });
    }

    // Limit text length to 200,000 characters
    if (text.length > 200000) {
      return res.status(400).json({
        success: false,
        message: 'Text content exceeds maximum limit of 200,000 characters.',
      });
    }

    const shareId = crypto.randomUUID();
    const code = await generateUniqueCode();
    const expiresAt = calculateExpiryDate(expirySeconds, config.defaultExpirySeconds);
    const managementToken = generateManagementToken();
    const managementTokenHash = hashToken(managementToken);

    const share = await Share.create({
      shareId,
      shareType: 'text',
      code,
      textContent: text,
      uploadStatus: 'completed',
      managementTokenHash,
      burnAfterRead: Boolean(burnAfterRead),
      expiresAt,
    });

    const shareUrl = `${config.publicAppUrl}/share/${shareId}`;

    res.status(201).json({
      success: true,
      data: {
        shareId: share.shareId,
        code: share.code,
        shareUrl,
        expiresAt: share.expiresAt,
        managementToken,
        burnAfterRead: share.burnAfterRead,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getClipboardShare(req, res, next) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }

    const query = {
      $or: [{ code: code.toUpperCase() }, { shareId: code }],
      shareType: 'text',
      uploadStatus: 'completed',
    };

    const share = await Share.findOne(query);

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared text not found. The code may be invalid or expired.',
      });
    }

    // Check expiration
    if (new Date() > share.expiresAt) {
      await Share.deleteOne({ _id: share._id });
      return res.status(410).json({
        success: false,
        message: 'This shared clipboard text has expired.',
      });
    }

    // If burn after read, increment or delete
    const isBurnAfterRead = share.burnAfterRead;
    if (isBurnAfterRead) {
      await Share.deleteOne({ _id: share._id });
    } else {
      share.downloadCount += 1;
      await share.save();
    }

    res.json({
      success: true,
      data: {
        shareId: share.shareId,
        code: share.code,
        shareType: share.shareType,
        text: share.textContent,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        burnAfterRead: isBurnAfterRead,
      },
    });
  } catch (err) {
    next(err);
  }
}
