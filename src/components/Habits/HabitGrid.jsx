import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { habitDoneOn } from '../../hooks/useHabits';
import { lastNDays, dateKey, fmtShort, fmtDate } from '../../utils/dateUtils';

// GitHub-contributions-style grid: days × habits
export default function HabitGrid({ habits, days = 7 }) {
  const { t, lang } = useTranslation();
  const dates = lastNDays(days);

  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="text-start text-[11px] font-medium text-slate-400 pe-3 sticky start-0 bg-white dark:bg-slate-900" />
            {dates.map((d) => (
              <th key={dateKey(d)} className="text-[9px] font-normal text-slate-400 min-w-[22px]">
                {days <= 7 ? fmtShort(d, lang) : fmtDate(d, lang, 'd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const name = typeof h.name === 'object' ? h.name[lang] : h.name;
            return (
              <tr key={h.id}>
                <td className="text-xs whitespace-nowrap pe-3 sticky start-0 bg-white dark:bg-slate-900">
                  <span className="me-1">{h.icon}</span>
                  <span className="text-slate-500 dark:text-slate-400">{name}</span>
                </td>
                {dates.map((d) => {
                  const k = dateKey(d);
                  const done = habitDoneOn(h, k);
                  const partial = h.type === 'water' && !done && (h.history?.[k] || 0) > 0;
                  return (
                    <td key={k}>
                      <div
                        title={`${name} · ${fmtShort(d, lang)}`}
                        className={`h-[18px] w-[18px] rounded-[5px] transition-colors ${!done && !partial ? 'bg-slate-200/80 dark:bg-slate-800' : ''}`}
                        style={done ? { background: h.color } : partial ? { background: `${h.color}55` } : undefined}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {habits.length === 0 && <p className="text-xs text-slate-400 py-4">{t('common.empty')}</p>}
    </div>
  );
}
