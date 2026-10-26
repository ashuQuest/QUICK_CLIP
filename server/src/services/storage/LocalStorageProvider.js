import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IStorageProvider } from './IStorageProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

export class LocalStorageProvider extends IStorageProvider {
  constructor() {
    super();
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  getFilePath(storageKey) {
    // Prevent directory traversal attacks
    const safeKey = path.basename(storageKey);
    return path.join(UPLOADS_DIR, safeKey);
  }

  getPartPath(storageKey, partNumber) {
    const safeKey = path.basename(storageKey);
    return path.join(UPLOADS_DIR, `${safeKey}.part_${partNumber}`);
  }

  async initiateUpload({ storageKey, mimeType, fileSize }) {
    return {
      uploadType: 'direct_local',
      // The frontend will PUT directly to our local stream upload endpoint
      uploadUrl: `/api/uploads/local/${encodeURIComponent(storageKey)}`,
      method: 'PUT',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
      },
    };
  }

  async initiateMultipartUpload({ storageKey, mimeType }) {
    return {
      uploadType: 'multipart_local',
      uploadId: `local_${Date.now()}`,
      partSize: 10 * 1024 * 1024, // 10MB chunks
    };
  }

  async getPartUploadUrl({ storageKey, uploadId, partNumber }) {
    return {
      partUploadUrl: `/api/uploads/local/${encodeURIComponent(storageKey)}/part/${partNumber}`,
      method: 'PUT',
    };
  }

  /**
   * Concatenate all parts into the final file without reading into memory (stream piping)
   */
  async completeMultipartUpload({ storageKey, uploadId, parts }) {
    const finalPath = this.getFilePath(storageKey);
    const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

    const writeStream = fs.createWriteStream(finalPath);

    for (const part of sortedParts) {
      const partPath = this.getPartPath(storageKey, part.partNumber);
      if (!fs.existsSync(partPath)) {
        writeStream.destroy();
        throw new Error(`Missing part file: part ${part.partNumber}`);
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(partPath);
        readStream.on('error', reject);
        readStream.on('end', () => {
          // Remove part after writing
          try {
            fs.unlinkSync(partPath);
          } catch (e) {
            console.warn(`Could not delete temp part ${partPath}:`, e.message);
          }
          resolve();
        });
        readStream.pipe(writeStream, { end: false });
      });
    }

    await new Promise((resolve) => writeStream.end(resolve));
    return true;
  }

  async abortMultipartUpload({ storageKey, uploadId }) {
    // Delete any parts matching this key
    try {
      const safeKey = path.basename(storageKey);
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        if (file.startsWith(`${safeKey}.part_`)) {
          fs.unlinkSync(path.join(UPLOADS_DIR, file));
        }
      }
    } catch (err) {
      console.warn(`[LocalStorage] Error aborting multipart:`, err.message);
    }
    return true;
  }

  async verifyObject(storageKey) {
    const filePath = this.getFilePath(storageKey);
    if (!fs.existsSync(filePath)) {
      return { exists: false };
    }
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      size: stat.size,
    };
  }

  async getDownloadTarget({ storageKey, filename, mimeType }) {
    const filePath = this.getFilePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in local storage');
    }

    const stat = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);

    return {
      type: 'stream',
      stream: readStream,
      size: stat.size,
      mimeType: mimeType || 'application/octet-stream',
      filename,
    };
  }

  async deleteObject(storageKey) {
    try {
      const filePath = this.getFilePath(storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (err) {
      console.error(`[LocalStorage] Error deleting ${storageKey}:`, err.message);
      return false;
    }
  }

  async abortStaleMultipartUploads(maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const now = Date.now();
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        if (file.includes('.part_')) {
          const fullPath = path.join(UPLOADS_DIR, file);
          const stat = fs.statSync(fullPath);
          if (now - stat.mtimeMs > maxAgeMs) {
            console.log(`[LocalStorage] Deleting orphaned part file: ${file}`);
            fs.unlinkSync(fullPath);
          }
        }
      }
    } catch (err) {
      console.warn(`[LocalStorage] Cleanup error:`, err.message);
    }
  }
}
