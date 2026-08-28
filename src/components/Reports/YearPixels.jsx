import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { isoDay, dateKey, fmtShort, addDays } from '../../utils/dateUtils';

// 365-day productivity heatmap: tasks completed + pomodoros per day
export default function YearPixels() {
  const { data, allTasks } = useApp();
  const { t, lang } = useTranslation();

  const { days, max } = useMemo(() => {
    const counts = {};
    allTasks.forEach((task) => {
      if (task.completedAt) { const k = isoDay(task.completedAt); counts[k] = (counts[k] || 0) + 1; }
    });
    data.pomodoro.history.forEach((h) => {
      if (h.phase === 'work' && h.endedAt) { const k = isoDay(h.endedAt); counts[k] = (counts[k] || 0) + 1; }
    });
    const out = [];
    let mx = 1;
    for (let i = 364; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const k = dateKey(d);
      const v = counts[k] || 0;
      mx = Math.max(mx, v);
      out.push({ date: d, key: k, value: v });
    }
    return { days: out, max: mx };
  }, [allTasks, data.pomodoro.history]);

  const levelCls = (v) => {
    if (v === 0) return 'bg-slate-200/80 dark:bg-slate-800';
    const r = v / max;
    if (r <= 0.25) return 'bg-primary/25';
    if (r <= 0.5) return 'bg-primary/50';
    if (r <= 0.75) return 'bg-primary/75';
    return 'bg-primary';
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm">🟦 {t('pixels.title')}</h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          {t('pixels.less')}
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-200/80 dark:bg-slate-800" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/25" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/50" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/75" />
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          {t('pixels.more')}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">{t('pixels.hint')}</p>
      <div className="overflow-x-auto pb-1" dir="ltr">
        <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 12px)' }}>
          {days.map((d) => (
            <div
              key={d.key}
              title={`${fmtShort(d.date, lang)} · ${d.value}`}
              className={`h-3 w-3 rounded-[3px] ${levelCls(d.value)} transition-colors`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
