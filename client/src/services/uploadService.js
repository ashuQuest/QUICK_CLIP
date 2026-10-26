import axios from 'axios';
import api from './api';

/**
 * Initiates an upload session on the server
 */
export async function initiateUploadSession({
  filename,
  fileSize,
  mimeType,
  expirySeconds = 86400,
  burnAfterRead = false,
  multipart = false,
}) {
  const response = await api.post('/api/uploads/initiate', {
    filename,
    fileSize,
    mimeType,
    expirySeconds,
    burnAfterRead,
    multipart,
  });
  return response.data.data;
}

/**
 * Direct file upload (for single-part S3 presigned or local streaming endpoint)
 */
export async function uploadDirect({
  uploadUrl,
  method = 'PUT',
  headers = {},
  file,
  onProgress,
  abortSignal,
}) {
  const isRelative = uploadUrl.startsWith('/');
  const fullUrl = isRelative
    ? `${import.meta.env.VITE_API_BASE_URL || ''}${uploadUrl}`
    : uploadUrl;

  await axios({
    method,
    url: fullUrl,
    data: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...headers,
    },
    signal: abortSignal,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({
          percentage: percent,
          loaded: progressEvent.loaded,
          total: progressEvent.total,
        });
      }
    },
  });
}

/**
 * Uploads large files in chunks (Multipart) with real cumulative progress tracking
 */
export async function uploadMultipart({
  shareId,
  file,
  partSize = 10 * 1024 * 1024,
  onProgress,
  abortSignal,
}) {
  const totalParts = Math.ceil(file.size / partSize);
  const parts = [];
  let totalUploadedBytes = 0;

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    if (abortSignal?.aborted) {
      throw new Error('Upload aborted by user');
    }

    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    // 1. Get part URL from backend
    const partInfoRes = await api.post(`/api/uploads/${shareId}/part-url`, { partNumber });
    const { partUploadUrl } = partInfoRes.data.data;

    const isRelative = partUploadUrl.startsWith('/');
    const targetUrl = isRelative
      ? `${import.meta.env.VITE_API_BASE_URL || ''}${partUploadUrl}`
      : partUploadUrl;

    let partLoadedInCurrent = 0;

    // 2. Upload part
    const partRes = await axios.put(targetUrl, chunk, {
      signal: abortSignal,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress: (evt) => {
        const delta = evt.loaded - partLoadedInCurrent;
        partLoadedInCurrent = evt.loaded;
        totalUploadedBytes += delta;

        if (onProgress) {
          const percent = Math.min(99, Math.round((totalUploadedBytes * 100) / file.size));
          onProgress({
            percentage: percent,
            loaded: totalUploadedBytes,
            total: file.size,
          });
        }
      },
    });

    // Extract ETag from response headers or returned JSON
    const etag = partRes.headers?.etag || partRes.data?.etag || `part_${partNumber}`;
    parts.push({
      partNumber,
      etag: etag.replace(/"/g, ''),
    });
  }

  return parts;
}

/**
 * Signals server that upload is complete and verifies file
 */
export async function completeUploadSession(shareId, parts = []) {
  const response = await api.post(`/api/uploads/${shareId}/complete`, { parts });
  return response.data.data;
}

/**
 * Aborts an upload session on the server
 */
export async function abortUploadSession(shareId) {
  try {
    await api.post(`/api/uploads/${shareId}/abort`);
  } catch (err) {
    console.warn('Abort upload call error:', err);
  }
}

/**
 * Fetches share metadata by 6-digit code or share ID
 */
export async function getShareMetadata(codeOrId) {
  const response = await api.get(`/api/shares/${encodeURIComponent(codeOrId)}`);
  return response.data.data;
}

/**
 * Deletes an authorized share using sender management token
 */
export async function deleteShareAuthorized(shareId, managementToken) {
  const response = await api.delete(`/api/shares/${encodeURIComponent(shareId)}`, {
    headers: {
      'X-Management-Token': managementToken,
    },
  });
  return response.data;
}

/**
 * Generates direct download URL
 */
export function getDownloadUrl(codeOrId) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}/api/shares/${encodeURIComponent(codeOrId)}/download`;
}
