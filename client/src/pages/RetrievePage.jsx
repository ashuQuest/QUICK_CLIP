import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  KeyRound,
  Download,
  Copy,
  Check,
  File,
  Clock,
  Flame,
  AlertCircle,
  FileText,
  Eye,
  CheckCircle2,
  Trash2,
  Share2,
} from 'lucide-react';
import PinInput from '../components/PinInput';
import { getShareMetadata, getDownloadUrl, deleteShareAuthorized } from '../services/uploadService';
import { formatBytes, formatTimeRemaining, formatDate, getFileCategory } from '../utils/formatters';
import { copyToClipboard } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import { useLocalHistory } from '../hooks/useLocalHistory';

export default function RetrievePage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { getManagementToken, removeShare } = useLocalHistory();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-fill and retrieve if ?code= is passed in query
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const clean = codeParam.trim().toUpperCase();
      setCode(clean);
      performRetrieve(clean);
    }
  }, [searchParams]);

  const performRetrieve = async (codeToFetch) => {
    const targetCode = (codeToFetch || code).trim();
    if (!targetCode) {
      showToast('Please enter a 6-digit retrieval code.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setShareData(null);

      const data = await getShareMetadata(targetCode);
      setShareData(data);
      showToast('Content retrieved successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Invalid retrieval code or share has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = async () => {
    if (!shareData?.textContent) return;
    const ok = await copyToClipboard(shareData.textContent);
    if (ok) {
      setCopiedText(true);
      showToast('Text copied to clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    if (!shareData?.shareId) return;
    const downloadUrl = getDownloadUrl(shareData.shareId);
    // Open download endpoint
    window.location.href = downloadUrl;
  };

  const handleDeleteIfOwner = async () => {
    const token = getManagementToken(shareData.shareId) || getManagementToken(shareData.code);
    if (!token) {
      showToast('No sender management token available on this browser.', 'error');
      return;
    }

    if (!window.confirm('Delete this share permanently from servers?')) return;

    try {
      setIsDeleting(true);
      await deleteShareAuthorized(shareData.shareId, token);
      removeShare(shareData.shareId);
      setShareData(null);
      setCode('');
      showToast('Share deleted permanently.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete share', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const managementToken = shareData ? (getManagementToken(shareData.shareId) || getManagementToken(shareData.code)) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <KeyRound className="w-3.5 h-3.5" /> Fast Retrieval
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Retrieve Text or Files
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Enter the unique 6-digit code shared with you to view clipboard text or download files.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all text-center">
        <PinInput
          value={code}
          onChange={setCode}
          disabled={isLoading}
          onComplete={(completedCode) => performRetrieve(completedCode)}
        />

        <div className="pt-6">
          <button
            type="button"
            onClick={() => performRetrieve()}
            disabled={isLoading || code.replace(/\s+/g, '').length < 6}
            className="w-full sm:w-auto py-3 px-8 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Retrieving...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Retrieve Content
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3 animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Could Not Retrieve Content</h4>
            <p className="text-xs leading-relaxed">{error}</p>
            <p className="text-[11px] text-rose-500/80 pt-1">
              Double check that the 6-digit code is correct and has not expired.
            </p>
          </div>
        </div>
      )}

      {/* Retrieved Content State */}
      {shareData && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6 animate-fade-in">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                Code: {shareData.code}
              </span>
              <span className="text-xs text-slate-400">
                Shared {formatDate(shareData.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
              {shareData.burnAfterRead ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">Single-use burned</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  <span>{formatTimeRemaining(shareData.expiresAt)}</span>
                </>
              )}
            </div>
          </div>

          {/* Text Content Display */}
          {shareData.shareType === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Shared Text Content
                </span>
                <button
                  onClick={handleCopyText}
                  className="py-1.5 px-3 rounded-xl text-xs font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto select-all">
                {shareData.textContent}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{shareData.textContent?.length.toLocaleString()} characters</span>
                <span>{shareData.textContent?.trim().split(/\s+/).length} words</span>
              </div>
            </div>
          )}

          {/* File Content Display */}
          {shareData.shareType === 'file' && shareData.file && (
            <div className="space-y-6">
              {/* File Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {shareData.file.filename}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(shareData.file.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getFileCategory(shareData.file.mimeType, shareData.file.filename)}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>

              {/* Safe Preview (Image preview if applicable) */}
              {getFileCategory(shareData.file.mimeType, shareData.file.filename) === 'image' && (
                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Image Preview
                  </p>
                  <img
                    src={getDownloadUrl(shareData.shareId)}
                    alt={shareData.file.filename}
                    className="max-h-72 mx-auto rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              {shareData.downloadCount} {shareData.downloadCount === 1 ? 'view / download' : 'views / downloads'}
            </span>

            {managementToken && (
              <button
                onClick={handleDeleteIfOwner}
                disabled={isDeleting}
                className="py-1.5 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting...' : 'Delete (Sender)'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
