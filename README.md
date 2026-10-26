# QuickClip — Online Clipboard & Large File Sharing

> **"Copy. Share. Transfer."**  
> A modern, responsive web application for sharing clipboard text and transferring large files up to **1 GB** across devices with unique 6-digit retrieval codes or private links.

Inspired by [online-clipboard.online](https://online-clipboard.online/online-clipboard/), redesigned from the ground up with original branding, a clean minimal UI/UX, dark mode, rate limiting, and a streaming / multipart object storage architecture.

---

## Features

- 📋 **Instant Online Clipboard**: Type or paste rich text, notes, code snippets, or credentials. Real-time character count, word count, and reading time estimate.
- 📁 **Large File Transfers (Up to 1 GB)**: Drag-and-drop file transfer supporting PDFs, documents, images, video, audio, and archives.
- 🚀 **Direct-to-Cloud / Streaming Architecture**: Files stream directly to Cloudflare R2 or Amazon S3 using presigned URLs and multipart uploads—large files are never buffered into Node.js server RAM.
- 🔢 **Unique 6-Digit Retrieval Codes**: Clean, collision-safe numeric PINs (e.g. `849201`) for effortless mobile keyboard entry without typing long URLs.
- 🔗 **Direct Shareable Links & QR Codes**: Share via URL (`/share/:id`) or display instant QR codes for camera scanning from smartphones.
- ⏳ **Configurable Expiry & TTL**: Set expiration to 10 minutes, 1 hour, 24 hours, or 7 days with automated MongoDB TTL purging and cloud storage cleanup jobs.
- 🔥 **Burn-After-Reading**: One-time access mode that self-destructs text or files immediately upon first view/download.
- 🛡️ **Sender Management Tokens**: Client-stored management tokens allow senders to delete their own shares before expiration without requiring centralized user accounts.
- ⏱️ **Real Upload Progress**: Upload progress bars with byte-accurate speed and percentage tracking via Axios (zero simulated or fake progress).
- 🌓 **Dark Mode**: Seamless system-aware light/dark theme toggle persisted in `localStorage`.
- 💻 **Zero-Config Local Development**: Automatically starts with local disk streaming and an embedded in-memory database when external S3/MongoDB credentials are not supplied.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ES Modules)
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router DOM (v6)
- **Networking**: Axios (with progress tracking & abort controllers)
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti

### Backend
- **Runtime**: Node.js (v20+ / v22+)
- **Framework**: Express.js (v4)
- **Database**: MongoDB with Mongoose (with automated fallback to embedded MongoMemoryServer for local dev)
- **Object Storage**: AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) compatible with **Cloudflare R2** and **Amazon S3**
- **Security & Reliability**: Helmet, CORS, Express-Rate-Limit (strict rate limiting against code-guessing attacks), Node Crypto, SHA-256 token hashing, path traversal sanitizers

---

## Project Structure

```text
file_app/
├── client/                     # Vite + React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, Dropzone, Editor, PinInput, QRCodeModal, ShareResultCard, ExpirySelector
│   │   ├── pages/              # Home, Clipboard, ShareFiles, Retrieve, ShareView, MyShares, HowItWorks
│   │   ├── hooks/              # useTheme, useToast, useLocalHistory
│   │   ├── services/           # api, clipboardService, uploadService
│   │   ├── utils/              # formatters, helpers
│   │   ├── App.jsx             # Router and layouts
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind base & utilities
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── .env.example
│   └── .env
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # Environment, DB, S3 configuration
│   │   ├── controllers/        # clipboardController, uploadController, shareController
│   │   ├── middleware/         # rateLimiter, errorHandler
│   │   ├── models/             # Share model (TTL index & multipart metadata)
│   │   ├── routes/             # clipboardRoutes, uploadRoutes, shareRoutes
│   │   ├── services/           # storage/ (S3StorageProvider, LocalStorageProvider, cleanupService)
│   │   ├── utils/              # codeGenerator, token, sanitizer
│   │   └── server.js           # Server entrypoint
│   ├── tests/                  # Automated integration test suite
│   ├── scripts/                # End-to-end verification scripts
│   ├── uploads/                # Local streaming storage (gitignored)
│   ├── package.json
│   ├── .env.example
│   └── .env
├── .gitignore
├── package.json                # Root scripts for convenience
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js v18+ or v22+
- npm v9+

### 1. Install Dependencies
Run in the respective folders:
```bash
# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### 2. Configure Environment Variables

#### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173

# Optional: MongoDB connection string
# If left empty in development, QuickClip starts an embedded in-memory MongoDB automatically!
MONGODB_URI=

# Storage Provider: "local" (default) or "s3"
STORAGE_PROVIDER=local

# Amazon S3 / Cloudflare R2 (required only when STORAGE_PROVIDER=s3)
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=quickclip-shares
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_FORCE_PATH_STYLE=true

# Upload and Expiry Limits
MAX_UPLOAD_SIZE_BYTES=1073741824   # 1 GB
DEFAULT_EXPIRY_SECONDS=86400      # 24 hours
CLEANUP_INTERVAL_MINUTES=15
```

#### Frontend (`client/.env`):
```env
# Leave empty when using Vite's built-in proxy to http://localhost:5000
VITE_API_BASE_URL=
VITE_MAX_UPLOAD_SIZE_BYTES=1073741824
```

### 3. Start the Applications

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
*The server will start on `http://localhost:5000`.*

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
*The React application will start on `http://localhost:5173`.*

---

## Running Automated Tests

Run the test suite inside the `server/` directory:
```bash
cd server
npm test
```
This runs 8 automated tests using Node's native test runner verifying:
- API health check
- Text clipboard creation and validation
- 6-digit retrieval code generation and lookups
- File upload initiation, streaming, and verification
- Byte-for-byte file download integrity
- Brute-force rate limiting
- Sender token authorization on deletion

You can also run the full end-to-end integration verification script:
```bash
cd server
node scripts/verify-integration.js
```

---

## Cloud Storage Setup (Cloudflare R2 / Amazon S3)

When deploying to production, switch `STORAGE_PROVIDER=s3` and configure your credentials.

### Cloudflare R2 CORS Configuration
Add the following CORS policy to your R2 bucket in the Cloudflare Dashboard:
```json
[
  {
    "AllowedOrigins": [
      "https://your-frontend-domain.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD",
      "POST"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Content-Disposition"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Amazon S3 Bucket Policy & CORS
In the AWS S3 Console, configure the Permissions tab:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": ["https://your-frontend-domain.com", "http://localhost:5173"],
    "ExposeHeaders": ["ETag", "Content-Disposition", "Content-Length"]
  }
]
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check, active storage provider, upload limit |
| `POST` | `/api/clipboard` | Create temporary text share (returns 6-digit code & link) |
| `GET` | `/api/clipboard/:code` | Retrieve text content by 6-digit code or share ID |
| `POST` | `/api/uploads/initiate` | Initiate upload session (direct presigned or multipart) |
| `POST` | `/api/uploads/:id/part-url` | Get presigned upload URL for a specific multipart part |
| `POST` | `/api/uploads/:id/complete` | Verify upload completion and activate share |
| `POST` | `/api/uploads/:id/abort` | Abort and clean up incomplete upload |
| `GET` | `/api/shares/:code` | Retrieve share metadata (filename, size, expiry, preview) |
| `GET` | `/api/shares/:code/download`| Authorize & download original file |
| `DELETE` | `/api/shares/:id` | Delete share (requires `X-Management-Token` header) |

---

## Security Model

1. **Bearer Credential Principle**: Share codes and links function as bearer credentials. Anyone in possession of the 6-digit PIN or unique URL can view or download the item until it expires or is burned.
2. **Brute-Force Rate Limiting**: The `/api/shares/:code` endpoint is protected by an IP-based rate limiter (45 attempts / 10 minutes) to prevent code-guessing attacks.
3. **Collision Safety**: When generating 6-digit retrieval codes, the backend checks for collision against all active, non-expired records in MongoDB before assigning.
4. **Sender Management**: Deletion is secured using a 192-bit cryptographic token. The backend only stores the **SHA-256 hash** of this token, preventing unauthorized deletion even if a code is known.
5. **Memory Safety**: Large files up to 1 GB are never read into Node.js heap memory. Files stream directly to S3/R2 or disk pipes.
6. **Double-Ended File Cleanup**:
   - MongoDB TTL indexes automatically expire metadata documents.
   - A scheduled cleanup job (`runCleanup`) periodically deletes expired objects from cloud storage and aborts orphaned multipart uploads.

---

## Production Deployment

### Frontend (Vercel / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment variables:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`

### Backend (Render / Railway / Fly.io)
1. Build command: `npm install`
2. Start command: `node src/server.js`
3. Environment variables:
   - `NODE_ENV`: `production`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app`
   - `PUBLIC_APP_URL`: `https://your-frontend.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/quickclip`
   - `STORAGE_PROVIDER`: `s3`
   - `S3_ENDPOINT`: `https://<account_id>.r2.cloudflarestorage.com`
   - `S3_BUCKET`: `quickclip-shares`
   - `S3_ACCESS_KEY_ID`: `your_access_key_id`
   - `S3_SECRET_ACCESS_KEY`: `your_secret_access_key`

---

## License
MIT License. Open-source and free to use.
