import mongoose from 'mongoose';

const fileSubschema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    sanitizedName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    storageKey: { type: String, required: true },
    storageProvider: { type: String, enum: ['s3', 'local'], required: true },
    isMultipart: { type: Boolean, default: false },
    uploadId: { type: String, default: null }, // S3 multipart upload ID
    parts: [
      {
        partNumber: { type: Number, required: true },
        etag: { type: String, required: true },
        size: { type: Number },
      },
    ],
  },
  { _id: false }
);

const shareSchema = new mongoose.Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shareType: {
      type: String,
      required: true,
      enum: ['text', 'file'],
      index: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
    },
    textContent: {
      type: String,
      default: null,
    },
    file: {
      type: fileSubschema,
      default: null,
    },
    uploadStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed', // For text shares, completed right away
      index: true,
    },
    managementTokenHash: {
      type: String,
      default: null,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    burnAfterRead: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index on expiresAt for MongoDB automatic document expiration
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index on code and expiresAt to speed up active code lookups
shareSchema.index({ code: 1, expiresAt: 1, uploadStatus: 1 });

export const Share = mongoose.model('Share', shareSchema);
