import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListMultipartUploadsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider } from './IStorageProvider.js';

export class S3StorageProvider extends IStorageProvider {
  /**
   * @param {Object} options
   * @param {string} options.endpoint
   * @param {string} options.region
   * @param {string} options.bucket
   * @param {string} options.accessKeyId
   * @param {string} options.secretAccessKey
   * @param {boolean} options.forcePathStyle
   */
  constructor(options) {
    super();
    this.bucket = options.bucket;
    
    const clientConfig = {
      region: options.region || 'auto',
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    };

    if (options.endpoint) {
      clientConfig.endpoint = options.endpoint;
    }
    if (typeof options.forcePathStyle === 'boolean') {
      clientConfig.forcePathStyle = options.forcePathStyle;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  /**
   * Generates a signed PUT URL for direct single-file upload (up to ~100MB)
   */
  async initiateUpload({ storageKey, mimeType, fileSize }) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType || 'application/octet-stream',
    });

    // Signed URL valid for 30 minutes
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 1800 });

    return {
      uploadType: 'direct_s3',
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
      },
    };
  }

  /**
   * Initiates an S3/R2 multipart upload for large files (up to 1GB or more)
   */
  async initiateMultipartUpload({ storageKey, mimeType }) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType || 'application/octet-stream',
    });

    const response = await this.s3Client.send(command);
    return {
      uploadType: 'multipart_s3',
      uploadId: response.UploadId,
      partSize: 10 * 1024 * 1024, // 10MB default chunk size (S3 min part is 5MB)
    };
  }

  /**
   * Generates a signed URL for a specific part in a multipart upload
   */
  async getPartUploadUrl({ storageKey, uploadId, partNumber }) {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: storageKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    // Valid for 20 minutes
    const partUploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 1200 });
    return {
      partUploadUrl,
      method: 'PUT',
    };
  }

  /**
   * Completes an S3/R2 multipart upload
   */
  async completeMultipartUpload({ storageKey, uploadId, parts }) {
    // S3 expects parts sorted by PartNumber
    const sortedParts = parts
      .map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag.replace(/"/g, ''), // Ensure no stray quotes
      }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts.map((p) => ({
          PartNumber: p.PartNumber,
          ETag: `"${p.ETag}"`,
        })),
      },
    });

    await this.s3Client.send(command);
    return true;
  }

  /**
   * Aborts an incomplete S3 multipart upload
   */
  async abortMultipartUpload({ storageKey, uploadId }) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: storageKey,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);
    return true;
  }

  /**
   * Verify an uploaded object exists and retrieve its content length
   */
  async verifyObject(storageKey) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });
      const response = await this.s3Client.send(command);
      return {
        exists: true,
        size: response.ContentLength,
        mimeType: response.ContentType,
      };
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return { exists: false };
      }
      throw err;
    }
  }

  /**
   * Generates a short-lived presigned GET download URL with Content-Disposition
   */
  async getDownloadTarget({ storageKey, filename, mimeType, expiresInSeconds = 300 }) {
    const safeFilename = encodeURIComponent(filename).replace(/['()]/g, escape);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
      ResponseContentType: mimeType || 'application/octet-stream',
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    return {
      type: 'redirect',
      url,
    };
  }

  /**
   * Deletes an object from S3
   */
  async deleteObject(storageKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      console.error(`[S3Storage] Error deleting object ${storageKey}:`, err.message);
      return false;
    }
  }

  /**
   * Cleans up stale multipart uploads older than maxAgeMs
   */
  async abortStaleMultipartUploads(maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const command = new ListMultipartUploadsCommand({
        Bucket: this.bucket,
      });
      const response = await this.s3Client.send(command);
      const now = Date.now();

      if (response.Uploads && response.Uploads.length > 0) {
        for (const upload of response.Uploads) {
          const initiated = new Date(upload.Initiated).getTime();
          if (now - initiated > maxAgeMs) {
            console.log(`[S3Storage] Aborting stale multipart upload: ${upload.Key} (${upload.UploadId})`);
            await this.abortMultipartUpload({
              storageKey: upload.Key,
              uploadId: upload.UploadId,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[S3Storage] Could not list multipart uploads for cleanup:`, err.message);
    }
  }
}
