import React from 'react';
import { Link } from 'react-router-dom';
import { Paperclip, ShieldCheck, Zap, Lock, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Paperclip className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">QuickClip</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Secure, lightning-fast online clipboard and large file sharing. Seamlessly transfer text snippets and files up to 1 GB between computers, phones, and tablets with zero sign-up required.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> End-to-end security
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-brand-500" /> Bearer token privacy
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Auto-purging TTL
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/clipboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Online Clipboard
                </Link>
              </li>
              <li>
                <Link to="/share-files" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Transfer Large Files
                </Link>
              </li>
              <li>
                <Link to="/retrieve" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Retrieve with Code
                </Link>
              </li>
              <li>
                <Link to="/my-shares" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Local Share History
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Security Notice
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              QuickClip shares are temporary. A share code or link acts as a bearer credential; anyone who holds it can access the content until it expires or is burned.
            </p>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Learn about our architecture →
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} QuickClip. Free, open, and privacy-focused.</p>
          <p className="flex items-center gap-1">
            Built with React, Express, MongoDB & Object Storage
          </p>
        </div>
      </div>
    </footer>
  );
}
