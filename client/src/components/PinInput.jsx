import React, { useRef, useEffect } from 'react';
import { Clipboard } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function PinInput({ value = '', onChange, onComplete, disabled = false }) {
  const { showToast } = useToast();
  const inputRefs = useRef([]);

  // Ensure refs array has 6 elements
  if (inputRefs.current.length !== 6) {
    inputRefs.current = Array(6)
      .fill(null)
      .map((_, i) => inputRefs.current[i] || React.createRef());
  }

  const digits = (value || '').padEnd(6, ' ').slice(0, 6).split('');

  const handleChange = (index, e) => {
    const rawChar = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
    const newDigits = [...digits];
    newDigits[index] = rawChar || ' ';

    const nextVal = newDigits.join('').trimEnd();
    onChange(nextVal);

    if (rawChar && index < 5) {
      inputRefs.current[index + 1]?.current?.focus();
    }

    if (nextVal.length === 6 && onComplete) {
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] || digits[index] === ' ') {
        if (index > 0) {
          inputRefs.current[index - 1]?.current?.focus();
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.current?.focus();
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
        if (cleaned) {
          onChange(cleaned);
          const focusIndex = Math.min(cleaned.length, 5);
          inputRefs.current[focusIndex]?.current?.focus();
          if (cleaned.length === 6 && onComplete) {
            onComplete(cleaned);
          }
          showToast(`Pasted code: ${cleaned}`, 'info');
        } else {
          showToast('No valid code found on clipboard.', 'warning');
        }
      }
    } catch (err) {
      showToast('Clipboard access was denied. Please paste manually.', 'warning');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const char = digits[idx] === ' ' ? '' : digits[idx];
          return (
            <input
              key={idx}
              ref={inputRefs.current[idx]}
              type="text"
              inputMode="text"
              maxLength={1}
              value={char}
              disabled={disabled}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-14 sm:w-14 sm:h-16 text-center font-mono text-2xl sm:text-3xl font-bold uppercase rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-brand-500 dark:focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all disabled:opacity-50"
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={handlePasteButtonClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Clipboard className="w-3.5 h-3.5" /> Paste from Clipboard
      </button>
    </div>
  );
}
