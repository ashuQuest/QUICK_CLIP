import React from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import TextEditor from '../components/TextEditor';

export default function ClipboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Instant Text Sharing
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Online Clipboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste text, notes, code snippets, or credentials to retrieve on any other computer, smartphone, or tablet.
        </p>
      </div>

      <TextEditor />
    </div>
  );
}
