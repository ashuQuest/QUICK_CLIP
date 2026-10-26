import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  
  // Storage settings
  storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '1073741824', 10), // 1 GB default
  defaultExpirySeconds: parseInt(process.env.DEFAULT_EXPIRY_SECONDS || '86400', 10), // 24 hours
  cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '15', 10),

  // AWS S3 / Cloudflare R2
  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'auto',
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },
};
