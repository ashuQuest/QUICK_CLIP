import React from 'react';
import { Clock, Flame, ShieldAlert } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: '10 Mins', value: 600 },
  { label: '1 Hour', value: 3600 },
  { label: '24 Hours', value: 86400 },
  { label: '7 Days', value: 604800 },
];

export default function ExpirySelector({
  expirySeconds,
  setExpirySeconds,
  burnAfterRead,
  setBurnAfterRead,
  type = 'text',
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-sm">
      {/* Expiry Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" /> Expiry:
        </span>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {EXPIRY_OPTIONS.map((opt) => {
            const isSelected = expirySeconds === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpirySeconds(opt.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Burn After Read Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={burnAfterRead}
          onChange={(e) => setBurnAfterRead(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 relative"></div>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Flame className={`w-3.5 h-3.5 ${burnAfterRead ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
          {type === 'file' ? 'Burn after 1 download' : 'Burn after 1 read'}
        </span>
      </label>
    </div>
  );
}
