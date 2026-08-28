import React, { useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { calLib, weekStart, eventsOn } from './calendarUtils';
import { dateKey, todayKey, localizeDigits } from '../../utils/dateUtils';

export default function MonthView({ cursor, events, selected, onSelect }) {
  const { lang } = useTranslation();
  const df = calLib(lang);
  const ws = weekStart(lang);

  const days = useMemo(() => {
    const start = df.startOfWeek(df.startOfMonth(cursor), { weekStartsOn: ws });
    const end = df.endOfWeek(df.endOfMonth(cursor), { weekStartsOn: ws });
    return df.eachDayOfInterval({ start, end });
  }, [cursor, df, ws]);

  const weekDays = useMemo(() => days.slice(0, 7).map((d) => df.format(d, 'EEEEEE')), [days, df]);
  const tk = todayKey();

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((w, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-slate-400 py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = dateKey(d);
          const inMonth = df.isSameMonth(d, cursor);
          const isToday = key === tk;
          const isSelected = key === selected;
          const evs = eventsOn(events, d);
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`aspect-square sm:aspect-auto sm:h-20 rounded-xl p-1 flex flex-col items-center sm:items-start gap-0.5 border transition-all text-sm
                ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}
                ${!inMonth ? 'opacity-30' : ''}`}
            >
              <span className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold
                ${isToday ? 'bg-primary text-white shadow-md' : ''}`}>
                {localizeDigits(df.format(d, 'd'), lang)}
              </span>
              <span className="flex flex-wrap gap-0.5 justify-center sm:justify-start px-0.5">
                {evs.slice(0, 4).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: e.color || '#3b82f6' }} />
                ))}
                {evs.length > 4 && <span className="text-[9px] text-slate-400">+{evs.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
