import React, { useState } from 'react';
import {
  Copy,
  Trash2,
  Share2,
  Check,
  Send,
  Sparkles,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { copyToClipboard, fireCelebration } from '../utils/helpers';
import { useToast } from '../hooks/useToast';
import { useLocalHistory } from '../hooks/useLocalHistory';
import { createClipboardShare } from '../services/clipboardService';
import ExpirySelector from './ExpirySelector';
import ShareResultCard from './ShareResultCard';

export default function TextEditor() {
  const { showToast } = useToast();
  const { addShare } = useLocalHistory();

  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(86400); // 24 hours
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareResult, setShareResult] = useState(null);

  // Statistics
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopyText = async () => {
    if (!text.trim()) {
      showToast('Text area is empty.', 'warning');
      return;
    }
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      showToast('Text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearText = () => {
    if (!text) return;
    if (text.length > 50 && !window.confirm('Clear all text?')) {
      return;
    }
    setText('');
    setShareResult(null);
  };

  const handleShare = async () => {
    if (!text.trim()) {
      showToast('Please enter some text before sharing.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const data = await createClipboardShare({
        text,
        expirySeconds,
        burnAfterRead,
      });

      // Save to local history
      addShare({
        shareId: data.shareId,
        code: data.code,
        shareType: 'text',
        title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
        size: text.length,
        expiresAt: data.expiresAt,
        managementToken: data.managementToken,
        burnAfterRead: data.burnAfterRead,
      });

      setShareResult(data);
      fireCelebration();
      showToast('Text share created successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create share', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {shareResult ? (
        <ShareResultCard
          shareData={shareResult}
          onReset={() => {
            setShareResult(null);
            setText('');
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Online Clipboard Editor
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                disabled={!text.trim()}
                className="py-1.5 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
              <button
                type="button"
                onClick={handleClearText}
                disabled={!text.trim()}
                className="py-1.5 px-3 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Large Textarea */}
          <div className="relative mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text, code snippets, notes, links, or passwords to share across devices..."
              rows={12}
              className="w-full p-4 font-mono text-sm leading-relaxed rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-y min-h-[220px]"
            />
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mb-5">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">{charCount.toLocaleString()}</strong> characters
              </span>
              <span>
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">{wordCount.toLocaleString()}</strong> words
              </span>
              <span className="hidden sm:inline">
                ~{readingTimeMins} min read
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Max 200,000 chars
            </span>
          </div>

          {/* Expiry Selector */}
          <div className="mb-6">
            <ExpirySelector
              expirySeconds={expirySeconds}
              setExpirySeconds={setExpirySeconds}
              burnAfterRead={burnAfterRead}
              setBurnAfterRead={setBurnAfterRead}
              type="text"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Generates a secure 6-digit retrieval code and link valid across all devices.
            </p>
            <button
              type="button"
              onClick={handleShare}
              disabled={isLoading || !text.trim()}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Share...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Generate Share Code & Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
