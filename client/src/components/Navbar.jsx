import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Paperclip,
  ClipboardList,
  UploadCloud,
  Download,
  History,
  HelpCircle,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useLocalHistory } from '../hooks/useLocalHistory';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { shares } = useLocalHistory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCode, setQuickCode] = useState('');

  const handleQuickRetrieve = (e) => {
    e.preventDefault();
    const clean = quickCode.trim().replace(/\s+/g, '');
    if (clean) {
      navigate(`/retrieve?code=${encodeURIComponent(clean)}`);
      setQuickCode('');
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Paperclip },
    { name: 'Clipboard', path: '/clipboard', icon: ClipboardList },
    { name: 'Share Files', path: '/share-files', icon: UploadCloud },
    { name: 'Retrieve', path: '/retrieve', icon: Download },
    {
      name: 'My Shares',
      path: '/my-shares',
      icon: History,
      badge: shares.length > 0 ? shares.length : null,
    },
    { name: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Paperclip className="w-5 h-5 -rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              QuickClip
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                Fast & Secure
              </span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Copy. Share. Transfer.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-950/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 opacity-75" />
                <span>{link.name}</span>
                {link.badge && (
                  <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-brand-500 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Code & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          <form onSubmit={handleQuickRetrieve} className="relative">
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code..."
              maxLength={8}
              className="w-44 pl-3 pr-8 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:w-48 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-0.5"
              title="Retrieve with code"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-5 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <form onSubmit={handleQuickRetrieve} className="relative mt-2">
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit retrieval code..."
              maxLength={8}
              className="w-full pl-3 pr-10 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold rounded bg-brand-600 text-white"
            >
              Retrieve
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-auto text-xs px-1.5 py-0.2 rounded-full bg-brand-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
