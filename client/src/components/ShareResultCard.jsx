import React, { useState } from 'react';
import {
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Trash2,
  RefreshCw,
  Clock,
  Flame,
  FileCheck2,
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import { formatTimeRemaining } from '../utils/formatters';
import { useToast } from '../hooks/useToast';
import QRCodeModal from './QRCodeModal';
import { deleteShareAuthorized } from '../services/uploadService';

export default function ShareResultCard({
  shareData,
  onReset,
  onDeleteSuccess,
}) {
  const { showToast } = useToast();
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!shareData) return null;

  const {
    shareId,
    code,
    shareUrl,
    expiresAt,
    managementToken,
    burnAfterRead,
    filename,
    size,
    shareType,
  } = shareData;

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCodeCopied(true);
      showToast(`Retrieval code ${code} copied!`, 'success');
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setLinkCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!managementToken) {
      showToast('No management authorization found for this share.', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this share now? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteShareAuthorized(shareId, managementToken);
      showToast('Share permanently deleted.', 'success');
      if (onDeleteSuccess) {
        onDeleteSuccess(shareId);
      }
      if (onReset) {
        onReset();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete share', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all animate-fade-in">
      {/* Success Badge */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Share Created Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share the 6-digit code or link with the recipient.
            </p>
          </div>
        </div>

        {/* Expiry Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
          {burnAfterRead ? (
            <>
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Burn after 1 view</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span>{formatTimeRemaining(expiresAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Main 6-Digit Code Highlight */}
      <div className="text-center py-6 px-4 mb-6 rounded-2xl bg-gradient-to-b from-brand-50/60 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-800/30 border border-brand-100 dark:border-slate-700/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          Retrieval Code
        </span>
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
          {code.split('').map((digit, idx) => (
            <div
              key={idx}
              className="w-11 h-14 sm:w-14 sm:h-16 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400"
            >
              {digit}
            </div>
          ))}
        </div>

        <button
          onClick={handleCopyCode}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
        >
          {codeCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {codeCopied ? 'Code Copied!' : 'Copy 6-Digit Code'}
        </button>
      </div>

      {/* Share Link Row */}
      <div className="space-y-2 mb-6">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
          Direct Shareable Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 py-2.5 px-3.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {linkCopied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => setQrModalOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            title="Scan QR code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="py-2 px-3.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Share Another
            </button>
          )}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 rounded-xl text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Preview
          </a>
        </div>

        {managementToken && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="py-2 px-3.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 ml-auto disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete Now'}
          </button>
        )}
      </div>

      {/* QR Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={shareUrl}
        code={code}
        title={filename || 'QuickClip Share'}
      />
    </div>
  );
}
