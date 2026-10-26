import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Shield,
  Layers,
} from 'lucide-react';
import { formatBytes, getFileCategory } from '../utils/formatters';
import { fireCelebration } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import { useLocalHistory } from '../hooks/useLocalHistory';
import {
  initiateUploadSession,
  uploadDirect,
  uploadMultipart,
  completeUploadSession,
  abortUploadSession,
} from '../services/uploadService';
import ExpirySelector from './ExpirySelector';
import ShareResultCard from './ShareResultCard';

const MAX_SIZE_BYTES = parseInt(
  import.meta.env.VITE_MAX_UPLOAD_SIZE_BYTES || '1073741824',
  10
); // 1 GB default

export default function FileDropzone() {
  const { showToast } = useToast();
  const { addShare } = useLocalHistory();
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(86400); // 24 hours
  const [burnAfterRead, setBurnAfterRead] = useState(false);

  // Upload States: 'idle' | 'uploading' | 'verifying' | 'completed' | 'error' | 'cancelled'
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [shareResult, setShareResult] = useState(null);
  const [currentShareId, setCurrentShareId] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (file.size > MAX_SIZE_BYTES) {
      const maxMb = Math.round(MAX_SIZE_BYTES / (1024 * 1024));
      showToast(`File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of ${maxMb} MB (1 GB).`, 'error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadedBytes(0);
    setErrorMessage('');
    setShareResult(null);
  };

  const handleClearSelected = () => {
    if (uploadStatus === 'uploading') {
      handleCancelUpload();
    }
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadedBytes(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (currentShareId) {
      await abortUploadSession(currentShareId);
    }
    setUploadStatus('cancelled');
    showToast('Upload cancelled.', 'info');
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadedBytes(0);
    setErrorMessage('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Initiate upload session on server
      const isLargeFile = selectedFile.size > 100 * 1024 * 1024; // > 100MB uses multipart
      const initData = await initiateUploadSession({
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        expirySeconds,
        burnAfterRead,
        multipart: isLargeFile,
      });

      setCurrentShareId(initData.shareId);

      let parts = [];

      // 2. Perform real upload (Direct or Multipart)
      if (initData.isMultipart) {
        // Multipart flow: upload parts sequentially with real chunk tracking
        parts = await uploadMultipart({
          shareId: initData.shareId,
          file: selectedFile,
          partSize: initData.uploadSession.partSize || 10 * 1024 * 1024,
          abortSignal: abortController.signal,
          onProgress: ({ percentage, loaded }) => {
            setUploadProgress(percentage);
            setUploadedBytes(loaded);
          },
        });
      } else {
        // Direct flow: single-part upload directly to S3 presigned PUT or local streaming endpoint
        await uploadDirect({
          uploadUrl: initData.uploadSession.uploadUrl,
          method: initData.uploadSession.method || 'PUT',
          headers: initData.uploadSession.headers || {},
          file: selectedFile,
          abortSignal: abortController.signal,
          onProgress: ({ percentage, loaded }) => {
            setUploadProgress(percentage);
            setUploadedBytes(loaded);
          },
        });
      }

      // 3. Complete and verify upload on server
      setUploadStatus('verifying');
      const completeData = await completeUploadSession(initData.shareId, parts);

      // 4. Save to local history
      addShare({
        shareId: completeData.shareId,
        code: completeData.code,
        shareType: 'file',
        filename: completeData.filename,
        title: completeData.filename,
        size: completeData.size,
        expiresAt: completeData.expiresAt,
        managementToken: initData.managementToken,
        burnAfterRead,
      });

      const finalResult = {
        ...completeData,
        shareUrl: initData.shareUrl,
        managementToken: initData.managementToken,
        burnAfterRead,
      };

      setShareResult(finalResult);
      setUploadStatus('completed');
      fireCelebration();
      showToast('File uploaded and ready to share!', 'success');
    } catch (err) {
      if (abortController.signal.aborted) {
        setUploadStatus('cancelled');
      } else {
        console.error('Upload failed:', err);
        setUploadStatus('error');
        setErrorMessage(err.message || 'File upload failed. Please try again.');
        showToast(err.message || 'Upload failed', 'error');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {shareResult ? (
        <ShareResultCard
          shareData={shareResult}
          onReset={() => {
            setShareResult(null);
            handleClearSelected();
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                Drag and drop your file here
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                or click to browse from your computer or mobile device
              </p>

              <div className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-xs text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <FolderOpen className="w-4 h-4" /> Browse Files
              </div>

              {/* Supported info */}
              <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span>PDF, Docs, Videos, Archives, Images, Audio</span>
                <span>•</span>
                <span>Up to 1 GB per file</span>
                <span>•</span>
                <span>Streaming & Multipart Direct-to-Cloud</span>
              </div>
            </div>
          ) : (
            /* Selected File State & Upload Progress */
            <div className="space-y-6">
              {/* File Info Card */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(selectedFile.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getFileCategory(selectedFile.type, selectedFile.name)}
                      </span>
                    </p>
                  </div>
                </div>

                {uploadStatus === 'idle' && (
                  <button
                    onClick={handleClearSelected}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Upload Progress Bar (when uploading or verifying) */}
              {(uploadStatus === 'uploading' || uploadStatus === 'verifying') && (
                <div className="space-y-2 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                      {uploadStatus === 'verifying' ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                          Verifying file integrity in cloud storage...
                        </>
                      ) : (
                        `Uploading... ${uploadProgress}%`
                      )}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {formatBytes(uploadedBytes)} of {formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Direct streaming without memory buffering
                    </span>
                    <button
                      onClick={handleCancelUpload}
                      className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                </div>
              )}

              {/* Error or Cancelled Message */}
              {(uploadStatus === 'error' || uploadStatus === 'cancelled') && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage || 'Upload was cancelled or interrupted.'}</span>
                  </div>
                  <button
                    onClick={startUpload}
                    className="flex items-center gap-1 font-bold text-rose-800 dark:text-rose-200 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}

              {/* Expiry and Burn Settings (Only editable before upload) */}
              {uploadStatus === 'idle' && (
                <div className="space-y-4">
                  <ExpirySelector
                    expirySeconds={expirySeconds}
                    setExpirySeconds={setExpirySeconds}
                    burnAfterRead={burnAfterRead}
                    setBurnAfterRead={setBurnAfterRead}
                    type="file"
                  />

                  {/* Upload Start Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      onClick={handleClearSelected}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      Choose a different file
                    </button>

                    <button
                      type="button"
                      onClick={startUpload}
                      className="w-full sm:w-auto py-3 px-8 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload & Get Share Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
