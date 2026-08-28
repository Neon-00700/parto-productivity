import React from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { localizeDigits } from '../../../../utils/dateUtils';

// A +/- stepper with an editable number in the middle, styled with Parto's theme.
// `nullable` allows clearing the value (used for optional effort fields).
export default function Stepper({ value, onChange, step = 1, min = 0, max = Infinity, decimal = false, nullable = false, lang, className = '', small = false }) {
  const bump = (dir) => {
    const cur = value == null || value === '' ? (dir > 0 ? (nullable ? (min === 0 ? step : min) : 0) : (nullable ? null : 0)) : Number(value);
    let next = (cur || 0) + dir * step;
    if (nullable && dir < 0 && next < min) next = null;
    if (next != null) {
      next = dir > 0 ? Math.min(max, next) : Math.max(min, next);
      next = decimal ? Math.round(next * 100) / 100 : Math.round(next);
    }
    onChange(next);
  };
  const onInput = (e) => {
    const v = e.target.value;
    if (v === '') { if (nullable) onChange(null); return; }
    let n = Number(v);
    if (!isFinite(n)) return;
    n = decimal ? Math.round(n * 100) / 100 : Math.round(n);
    onChange(Math.min(max, Math.max(min, n)));
  };
  const btn = `grid place-items-center rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${small ? 'h-7 w-7' : 'h-9 w-9'}`;
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 p-1 ${className}`}>
      <button type="button" className={btn} onClick={() => bump(-1)} aria-label="decrease"><FiMinus size={small ? 13 : 15} /></button>
      <input
        className={`bg-transparent text-center font-bold tabular-nums outline-none text-slate-800 dark:text-slate-100 ${small ? 'w-12 text-sm' : 'w-14'}`}
        inputMode="decimal"
        value={value == null ? '' : localizeDigits(value, lang)}
        onChange={onInput}
      />
      <button type="button" className={btn} onClick={() => bump(1)} aria-label="increase"><FiPlus size={small ? 13 : 15} /></button>
    </div>
  );
}
