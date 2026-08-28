import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useGamification } from '../../hooks/useGamification';
import { isoDay, localizeDigits, minutesToHuman } from '../../utils/dateUtils';

export default function Achievements() {
  const { data, allTasks } = useApp();
  const { t, lang } = useTranslation();
  const { badges, earnedCount } = useGamification();

  const records = useMemo(() => {
    const tasksPerDay = {};
    allTasks.forEach((task) => {
      if (task.completedAt) { const k = isoDay(task.completedAt); tasksPerDay[k] = (tasksPerDay[k] || 0) + 1; }
    });
    const pomosPerDay = {};
    const focusPerDay = {};
    data.pomodoro.history.forEach((h) => {
      if (h.phase !== 'work' || !h.endedAt) return;
      const k = isoDay(h.endedAt);
      pomosPerDay[k] = (pomosPerDay[k] || 0) + 1;
      focusPerDay[k] = (focusPerDay[k] || 0) + (h.duration || 0);
    });
    return {
      bestTasksDay: Math.max(0, ...Object.values(tasksPerDay)),
      mostPomosDay: Math.max(0, ...Object.values(pomosPerDay)),
      longestFocusDay: Math.max(0, ...Object.values(focusPerDay)),
      totalCompleted: allTasks.filter((task) => task.completedAt).length,
      totalFocus: Object.values(focusPerDay).reduce((s, v) => s + v, 0),
    };
  }, [allTasks, data.pomodoro.history]);

  const recordItems = [
    ['🏆', 'records.bestTasksDay', localizeDigits(records.bestTasksDay, lang)],
    ['🍅', 'records.mostPomosDay', localizeDigits(records.mostPomosDay, lang)],
    ['⏱️', 'records.longestFocusDay', minutesToHuman(records.longestFocusDay, lang)],
    ['✅', 'records.totalCompleted', localizeDigits(records.totalCompleted, lang)],
    ['🎯', 'records.totalFocus', minutesToHuman(records.totalFocus, lang)],
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* personal records */}
      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3">🥇 {t('records.title')}</h3>
        <div className="space-y-2.5">
          {recordItems.map(([icon, key, val]) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{icon}</span>
              <span className="flex-1 text-slate-500 dark:text-slate-400">{t(key)}</span>
              <span className="font-extrabold text-primary tabular-nums">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* badges */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">🏅 {t('gam.achievements')}</h3>
          <span className="text-xs text-slate-400">{localizeDigits(earnedCount, lang)}/{localizeDigits(badges.length, lang)} {t('gam.earned')}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {badges.map((b) => (
            <div
              key={b.id}
              title={lang === 'fa' ? b.dfa : b.den}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all
                ${b.earned ? 'border-amber-400/60 bg-amber-400/10' : 'border-slate-200 dark:border-slate-800 opacity-40 grayscale'}`}
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[9px] font-bold leading-tight">{lang === 'fa' ? b.fa : b.en}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
