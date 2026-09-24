// Reusable Parto calendar — month grid + day picker.
// Jalali when Persian, Gregorian otherwise. Light/dark + responsive.
// Returns an ISO date string (yyyy-MM-dd) on selection.
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { calLib, weekStart } from '../Calendar/calendarUtils';
import { dateKey, addDays, localizeDigits } from '../../utils/dateUtils';
import { ChevronDownIcon, BackIcon } from '../icons';

const WD_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

export default function DatePicker({ value, onChange, className = '', minDate = null }) {
  const { lang } = useTranslation();
  const lib = calLib(lang);
  const initial = value ? new Date(value + 'T00:00:00') : new Date();
  const [cursor, setCursor] = useState(initial);

  useEffect(() => {
    if (value) setCursor(new Date(value + 'T00:00:00'));
  }, [value]);

  const monthLabel = useMemo(() => {
    try { return localizeDigits(lib.format(cursor, 'MMMM yyyy'), lang); } catch { return ''; }
  }, [cursor, lang, lib]);

  const days = useMemo(() => {
    const start = lib.startOfMonth(cursor);
    const ws = weekStart(lang);
    const gridStart = addDays(start, ((start.getDay() - ws + 7) % 7));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      const inMonth = (() => {
        try { return lib.getMonth(d) === lib.getMonth(cursor); } catch { return d.getMonth() === cursor.getMonth(); }
      })();
      cells.push({ date: d, key: dateKey(d), inMonth });
    }
    return cells;
  }, [cursor, lang, lib]);

  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 6); // a Saturday
    return WD_KEYS.map((_, i) => {
      const d = addDays(base, i);
      try { return lib.format(d, 'EEEEEE'); } catch { return ''; }
    });
  }, [lang, lib]);

  const shift = (n) => {
    try { setCursor(lib.addMonths(cursor, n)); } catch { setCursor(addDays(cursor, n * 30)); }
  };

  const wdOrder = lang === 'fa' ? WD_KEYS : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2.5">
        <button type="button" onClick={() => shift(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <BackIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => setCursor(new Date())}
          className="text-sm font-bold hover:text-primary transition-colors"
        >
          {monthLabel}
        </button>
        <button type="button" onClick={() => shift(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <BackIcon size={15} className="rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {wdOrder.map((k) => {
          const idx = WD_KEYS.indexOf(k);
          return (
            <div key={k} className="h-7 flex items-center justify-center text-[11px] font-medium text-slate-400">
              {weekdayNames[idx]}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, key, inMonth }) => {
          const selected = key === value;
          const isToday = key === dateKey(new Date());
          const past = minDate ? key < minDate : false;
          const dayNum = (() => { try { return localizeDigits(String(lib.getDate(date)), lang); } catch { return localizeDigits(String(date.getDate()), lang); } })();
          return (
            <button
              key={key}
              type="button"
              disabled={past}
              onClick={() => onChange?.(key)}
              className={`h-9 rounded-lg text-sm font-medium transition-all
                ${selected ? 'bg-primary text-white shadow-sm' : ''}
                ${!selected && isToday ? 'ring-1 ring-primary/40 text-primary' : ''}
                ${!selected && !isToday && inMonth ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                ${!selected && !inMonth ? 'text-slate-300 dark:text-slate-700' : ''}
                ${past ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
