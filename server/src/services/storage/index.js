import { config } from '../../config/index.js';
import { S3StorageProvider } from './S3StorageProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';

let providerInstance = null;

export function getStorageProvider() {
  if (providerInstance) {
    return providerInstance;
  }

  const { storageProvider, s3 } = config;

  if (storageProvider === 's3') {
    if (!s3.bucket || !s3.accessKeyId || !s3.secretAccessKey) {
      console.warn(
        `[Storage] STORAGE_PROVIDER is set to 's3', but S3_BUCKET or credentials are missing. Falling back to local disk storage.`
      );
      providerInstance = new LocalStorageProvider();
    } else {
      console.log(`[Storage] Initialized AWS S3 / Cloudflare R2 storage provider (Bucket: ${s3.bucket})`);
      providerInstance = new S3StorageProvider(s3);
    }
  } else {
    console.log(`[Storage] Initialized Local disk storage provider.`);
    providerInstance = new LocalStorageProvider();
  }

  return providerInstance;
}

export const storageProvider = getStorageProvider();
