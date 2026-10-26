import React from 'react';
import {
  Zap,
  KeyRound,
  Shield,
  UploadCloud,
  Clock,
  Flame,
  HardDrive,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Paste Text or Select Files',
      desc: 'Type or paste clipboard notes into the editor, or drag-and-drop any document, image, video, audio, or archive file up to 1 GB.',
      icon: UploadCloud,
    },
    {
      step: '02',
      title: 'Direct-to-Cloud Streaming',
      desc: 'QuickClip initiates a secure upload session. Files stream in real-time directly to cloud storage (or local disk in dev) without ever buffering whole gigabytes in Node.js memory.',
      icon: HardDrive,
    },
    {
      step: '03',
      title: 'Unique 6-Digit Code & Link',
      desc: 'A unique 6-digit retrieval code and a cryptographic share link are instantly generated. Collision detection ensures the code is unique among active shares, and rate limiters block brute-force attacks.',
      icon: KeyRound,
    },
    {
      step: '04',
      title: 'Instant Cross-Device Retrieval',
      desc: 'Open QuickClip on any phone, tablet, or PC. Punch in the 6-digit code or open the link. The receiver views the text or downloads the exact original file without data corruption.',
      icon: Zap,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" /> Architecture & Security Guide
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How QuickClip Works
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Designed from the ground up for friction-free, peer-to-peer style temporary transfers with enterprise-grade reliability and security.
        </p>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-slate-300 dark:text-slate-700">
                  {item.step}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Security & Reliability Model */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-6 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Security, Privacy & Bearer Model</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-indigo-100/90 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Bearer Credential Model
            </h4>
            <p>
              A share link or 6-digit code acts as an access token. Anyone who holds the code or URL can view or download the item. Never share codes in public forums.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Ephemeral Storage & TTL
            </h4>
            <p>
              Shares expire automatically after your selected time (10m, 1h, 24h, 7d). A background cron daemon purges expired storage objects and aborts incomplete multipart uploads.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" /> Burn After Reading
            </h4>
            <p>
              When enabled, the file or text is deleted immediately upon first retrieval. Once accessed, the link becomes invalid forever.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-brand-300" /> Rate Limiting & Collisions
            </h4>
            <p>
              Retrieval attempts are strictly rate-limited per IP to prevent automated code guessing attacks. Codes are cryptographically verified for uniqueness among active shares.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-indigo-200">
            Ready to transfer text or files?
          </p>
          <Link
            to="/"
            className="py-2.5 px-6 rounded-xl font-bold text-xs bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-md"
          >
            Start Sharing Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
