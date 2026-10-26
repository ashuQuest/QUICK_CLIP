import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  UploadCloud,
  Zap,
  Shield,
  Clock,
  KeyRound,
  ArrowRight,
  Smartphone,
  Laptop,
  CheckCircle,
} from 'lucide-react';
import TextEditor from '../components/TextEditor';
import FileDropzone from '../components/FileDropzone';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('clipboard'); // 'clipboard' | 'files'
  const [heroCode, setHeroCode] = useState('');
  const navigate = useNavigate();

  const handleHeroRetrieve = (e) => {
    e.preventDefault();
    const clean = heroCode.trim().replace(/\s+/g, '');
    if (clean) {
      navigate(`/retrieve?code=${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="text-center pt-8 sm:pt-14 px-4 max-w-4xl mx-auto space-y-6">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-brand-600 text-brand-600 dark:fill-brand-400 dark:text-brand-400" />
          <span>Zero Sign-up • Instant Transfer • End-to-End Secure</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none sm:leading-tight">
          Copy. Share.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">
            Transfer.
          </span>
        </h1>

        {/* Supporting Subheading */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Share text snippets, clipboard notes, and large files up to <strong>1 GB</strong> across any device in seconds using a simple <strong>6-digit retrieval code</strong> or a private link.
        </p>

        {/* Quick Hero Code Retriever */}
        <div className="pt-2 max-w-md mx-auto">
          <form
            onSubmit={handleHeroRetrieve}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg focus-within:border-brand-500 dark:focus-within:border-brand-500 transition-all"
          >
            <KeyRound className="w-5 h-5 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={heroCode}
              onChange={(e) => setHeroCode(e.target.value.toUpperCase())}
              placeholder="Have a 6-digit code? (e.g. 849201)"
              maxLength={8}
              className="w-full py-2 px-2 text-sm font-mono font-medium bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!heroCode.trim()}
              className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
            >
              Retrieve <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>

      {/* Main Tabs Section */}
      <section className="max-w-4xl mx-auto px-4">
        {/* Tab Switcher Header */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('clipboard')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'clipboard'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Text Clipboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>File Transfer (1 GB)</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'clipboard' ? <TextEditor /> : <FileDropzone />}
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Engineered for Speed, Privacy, and Scale
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need for seamless device-to-device transfers without logins, ads, or complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              6-Digit Pin Retrieval
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Never hassle with emailing yourself links or typing 40-character URLs on your phone. Just punch in the 6-digit code on any browser.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Up to 1 GB Large Files
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct-to-cloud presigned and multipart streaming architecture uploads gigabytes directly without memory bottlenecks or server proxies.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Temporary & Ephemeral
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Configurable time-to-live auto-purging, burn-after-read destruction, and bearer credential privacy ensure your data leaves no trace.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
