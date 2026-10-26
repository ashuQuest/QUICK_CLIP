import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Copy,
  Check,
  Download,
  Trash2,
  File,
  FileText,
  Clock,
  ExternalLink,
  Flame,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { useLocalHistory } from '../hooks/useLocalHistory';
import { useToast } from '../hooks/useToast';
import { copyToClipboard } from '../utils/helpers';
import { formatBytes, formatTimeRemaining, formatDate } from '../utils/formatters';
import { deleteShareAuthorized, getDownloadUrl } from '../services/uploadService';

export default function MySharesPage() {
  const { shares, removeShare, clearHistory } = useLocalHistory();
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCopyLink = async (share) => {
    const url = `${window.location.origin}/share/${share.shareId}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedId(share.shareId);
      showToast('Share link copied!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteShare = async (share) => {
    if (!share.managementToken) {
      // Local removal only if token missing
      removeShare(share.shareId);
      showToast('Removed from local history.', 'info');
      return;
    }

    if (!window.confirm(`Permanently delete "${share.title || share.filename || share.code}" from server?`)) {
      return;
    }

    try {
      setDeletingId(share.shareId);
      await deleteShareAuthorized(share.shareId, share.managementToken);
      removeShare(share.shareId);
      showToast('Share deleted from servers.', 'success');
    } catch (err) {
      // If already deleted or expired on server, still remove locally
      removeShare(share.shareId);
      showToast('Share was already removed from server.', 'info');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all locally remembered shares from this browser? (Note: Files on server will still expire at their scheduled times).')) {
      clearHistory();
      showToast('Local history cleared.', 'info');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" /> Browser-Remembered Shares
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            My Recent Shares
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Shares created on this device are remembered locally. No account or password needed.
          </p>
        </div>

        {shares.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-auto py-2 px-3.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Browser History
          </button>
        )}
      </div>

      {/* Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          This history is saved in your browser storage, not tied to a centralized account. Clearing your cookies or browsing history will reset this list.
        </span>
      </div>

      {/* Shares List */}
      {shares.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
              No recent shares found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Any text snippets or files you upload on this browser will appear here for quick access.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
            >
              Create a Share Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((share) => {
            const isFile = share.shareType === 'file';
            const isDeleting = deletingId === share.shareId;
            const isCopied = copiedId === share.shareId;

            return (
              <div
                key={share.shareId}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left side: Icon + Title + Meta */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                    {isFile ? <File className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {share.title || share.filename || 'Clipboard Share'}
                      </h4>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700">
                        {share.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {share.size && <span>{formatBytes(share.size)}</span>}
                      <span>•</span>
                      <span>{formatDate(share.createdAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {share.burnAfterRead ? (
                          <>
                            <Flame className="w-3 h-3 text-rose-500" />
                            <span className="text-rose-500">Burn on read</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTimeRemaining(share.expiresAt)}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleCopyLink(share)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Copy share link"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  {isFile && (
                    <a
                      href={getDownloadUrl(share.shareId)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}

                  <Link
                    to={`/share/${share.shareId}`}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Open share preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteShare(share)}
                    disabled={isDeleting}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Delete share from server"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
