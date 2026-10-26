import React from 'react';
import { X, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import { getQrCodeUrl, copyToClipboard } from '../utils/helpers';
import { useToast } from '../hooks/useToast';

export default function QRCodeModal({ isOpen, onClose, url, code, title }) {
  const { showToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !url) return null;

  const qrImageUrl = getQrCodeUrl(url, 260);

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close QR Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scan with Camera</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Scan this QR code on your phone or tablet to open this share instantly.
        </p>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block mb-4">
          <img
            src={qrImageUrl}
            alt="QuickClip QR Code"
            className="w-52 h-52 object-contain mx-auto rounded-lg"
          />
        </div>

        {/* 6-Digit Code Badge */}
        {code && (
          <div className="mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Retrieval Code:</span>
            <span className="font-mono text-2xl font-extrabold tracking-widest text-brand-600 dark:text-brand-400 px-3 py-1 bg-brand-50 dark:bg-brand-950/60 rounded-xl border border-brand-200 dark:border-brand-800">
              {code}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
