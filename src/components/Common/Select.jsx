// Reusable, theme-aware select — replaces native <select> in Parto UI.
// Keyboard-friendly (arrow keys, Enter, Esc), responsive, RTL-aware.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '../icons';

export default function Select({
  value, onChange, options = [], placeholder = '', className = '', disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selRef = useRef(-1);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); selRef.current = Math.min(options.length - 1, selRef.current + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selRef.current = Math.max(0, selRef.current - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const o = options[selRef.current];
        if (o) { onChange?.(o.value); setOpen(false); }
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open, options, onChange]);

  useEffect(() => { if (open) selRef.current = Math.max(0, options.findIndex((o) => o.value === value)); }, [open, options, value]);

  if (disabled) {
    return (
      <div className={`input flex items-center justify-between opacity-60 ${className}`} ref={ref}>
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon size={15} className="text-slate-400 shrink-0" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input w-full flex items-center justify-between text-start"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon size={15} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg animate-fade-in py-1"
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400">—</div>
          ) : options.map((o, i) => (
            <button
              key={String(o.value)}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => { selRef.current = i; }}
              onClick={() => { onChange?.(o.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-start transition-colors
                ${selRef.current === i ? 'bg-primary/10' : ''}
                ${o.value === value ? 'font-semibold text-primary' : 'text-slate-700 dark:text-slate-200'}`}
            >
              <span className="flex-1 truncate">{o.label}</span>
              {o.value === value && <CheckIcon size={14} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
