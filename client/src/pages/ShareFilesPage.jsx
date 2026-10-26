import React from 'react';
import { UploadCloud, Layers } from 'lucide-react';
import FileDropzone from '../components/FileDropzone';

export default function ShareFilesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" /> High-Performance Transfer
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Transfer Large Files
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload and transfer documents, archives, videos, or photos up to 1 GB with multipart streaming and automatic expiration.
        </p>
      </div>

      <FileDropzone />
    </div>
  );
}
