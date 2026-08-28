import React, { useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { calLib, weekStart, eventsOn } from './calendarUtils';
import { dateKey, todayKey, localizeDigits, fmtTime } from '../../utils/dateUtils';

export default function WeekView({ cursor, events, selected, onSelect }) {
  const { t, lang } = useTranslation();
  const df = calLib(lang);
  const ws = weekStart(lang);

  const days = useMemo(() => {
    const start = df.startOfWeek(cursor, { weekStartsOn: ws });
    return df.eachDayOfInterval({ start, end: df.addDays(start, 6) });
  }, [cursor, df, ws]);

  const tk = todayKey();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((d) => {
        const key = dateKey(d);
        const isToday = key === tk;
        const evs = eventsOn(events, d);
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`rounded-xl border p-2 text-start min-h-[90px] transition-all
              ${key === selected ? 'border-primary bg-primary/10' : 'border-slate-200 dark:border-slate-800 hover:border-primary/40'}`}
          >
            <div className={`text-xs font-bold mb-1.5 ${isToday ? 'text-primary' : 'text-slate-500'}`}>
              {df.format(d, 'EEEE')} {localizeDigits(df.format(d, 'd'), lang)}
              {isToday && <span className="ms-1 chip bg-primary/15 text-primary !text-[9px]">{t('common.today')}</span>}
            </div>
            <div className="space-y-1">
              {evs.length === 0 && <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>}
              {evs.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 text-[11px] truncate">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="truncate">{e.title}</span>
                  {!e.allDay && e.startTime && <span className="text-slate-400 ms-auto shrink-0">{fmtTime(e.startTime, lang)}</span>}
                </div>
              ))}
              {evs.length > 3 && <div className="text-[10px] text-slate-400">+{localizeDigits(evs.length - 3, lang)}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
