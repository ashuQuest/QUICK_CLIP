import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  File,
  Clock,
  Flame,
  AlertCircle,
  FileText,
  Eye,
  Trash2,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import { getShareMetadata, getDownloadUrl, deleteShareAuthorized } from '../services/uploadService';
import { formatBytes, formatTimeRemaining, formatDate, getFileCategory } from '../utils/formatters';
import { copyToClipboard } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import { useLocalHistory } from '../hooks/useLocalHistory';

export default function ShareViewPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getManagementToken, removeShare } = useLocalHistory();

  const [shareData, setShareData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchShare() {
      if (!shareId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await getShareMetadata(shareId);
        setShareData(data);
      } catch (err) {
        setError(err.message || 'Share not found or has expired.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchShare();
  }, [shareId]);

  const handleCopyText = async () => {
    if (!shareData?.textContent) return;
    const ok = await copyToClipboard(shareData.textContent);
    if (ok) {
      setCopiedText(true);
      showToast('Text copied to clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!shareData?.shareId) return;
    window.location.href = getDownloadUrl(shareData.shareId);
  };

  const managementToken = shareData
    ? getManagementToken(shareData.shareId) || getManagementToken(shareData.code)
    : null;

  const handleDelete = async () => {
    if (!managementToken) return;
    if (!window.confirm('Are you sure you want to permanently delete this share?')) return;

    try {
      setIsDeleting(true);
      await deleteShareAuthorized(shareData.shareId, managementToken);
      removeShare(shareData.shareId);
      showToast('Share deleted permanently.', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading shared content...
        </p>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Share Expired or Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || 'This link may have expired, reached its download limit, or was removed by the sender.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go to QuickClip Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              Code: {shareData.code}
            </span>
            <span className="text-xs text-slate-400">
              Created {formatDate(shareData.createdAt)}
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

        {/* Text View */}
        {shareData.shareType === 'text' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shared Text
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

        {/* File View */}
        {shareData.shareType === 'file' && shareData.file && (
          <div className="space-y-6">
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
                onClick={handleDownload}
                className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>

            {/* Safe Image Preview */}
            {getFileCategory(shareData.file.mimeType, shareData.file.filename) === 'image' && (
              <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Image Preview
                </p>
                <img
                  src={getDownloadUrl(shareData.shareId)}
                  alt={shareData.file.filename}
                  className="max-h-80 mx-auto rounded-lg object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {shareData.downloadCount} {shareData.downloadCount === 1 ? 'access' : 'accesses'}
          </span>

          {managementToken && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="py-1.5 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete (Sender)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
