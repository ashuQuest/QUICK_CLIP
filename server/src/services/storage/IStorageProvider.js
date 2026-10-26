/**
 * Storage Provider Interface
 * All storage adapters (AWS S3 / Cloudflare R2 / Local disk) must implement this interface.
 */
export class IStorageProvider {
  /**
   * Initialize single-part or direct upload session
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.mimeType
   * @param {number} params.fileSize
   * @returns {Promise<{ uploadUrl?: string, method?: string, headers?: Object, direct?: boolean }>}
   */
  async initiateUpload(params) {
    throw new Error('Not implemented');
  }

  /**
   * Initiate a multipart upload session for large files (>100MB up to 1GB)
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.mimeType
   * @returns {Promise<{ uploadId: string, partSize: number }>}
   */
  async initiateMultipartUpload(params) {
    throw new Error('Not implemented');
  }

  /**
   * Get an upload URL or handle a part for multipart upload
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.uploadId
   * @param {number} params.partNumber
   * @returns {Promise<{ partUploadUrl?: string, headers?: Object }>}
   */
  async getPartUploadUrl(params) {
    throw new Error('Not implemented');
  }

  /**
   * Complete multipart upload
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.uploadId
   * @param {Array<{ partNumber: number, etag: string }>} params.parts
   * @returns {Promise<boolean>}
   */
  async completeMultipartUpload(params) {
    throw new Error('Not implemented');
  }

  /**
   * Abort multipart upload
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.uploadId
   * @returns {Promise<boolean>}
   */
  async abortMultipartUpload(params) {
    throw new Error('Not implemented');
  }

  /**
   * Verify an uploaded object exists and get metadata
   * @param {string} storageKey
   * @returns {Promise<{ exists: boolean, size?: number, mimeType?: string }>}
   */
  async verifyObject(storageKey) {
    throw new Error('Not implemented');
  }

  /**
   * Get secure download URL or stream for the object
   * @param {Object} params
   * @param {string} params.storageKey
   * @param {string} params.filename
   * @param {string} params.mimeType
   * @param {number} [params.expiresInSeconds]
   * @returns {Promise<{ type: 'redirect' | 'stream', url?: string, stream?: NodeJS.ReadableStream, size?: number, headers?: Object }>}
   */
  async getDownloadTarget(params) {
    throw new Error('Not implemented');
  }

  /**
   * Permanently delete an object from storage
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async deleteObject(storageKey) {
    throw new Error('Not implemented');
  }
}
