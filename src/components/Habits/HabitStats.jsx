import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';
import { useHabits } from '../../hooks/useHabits';
import { localizeDigits, pct } from '../../utils/dateUtils';

export default function HabitStats() {
  const { t, lang } = useTranslation();
  const { stats } = useHabits();

  const chartData = useMemo(
    () => stats.withStreaks.map(({ habit, weekRate }) => ({
      name: `${habit.icon} ${typeof habit.name === 'object' ? habit.name[lang] : habit.name}`,
      rate: weekRate,
      color: habit.color,
    })),
    [stats, lang]
  );

  const avgWeek = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.rate, 0) / chartData.length) : 0;
  const avgMonth = stats.withStreaks.length
    ? Math.round(stats.withStreaks.reduce((s, x) => s + x.monthRate, 0) / stats.withStreaks.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-primary">{pct(avgWeek, lang)}</div>
          <div className="text-[11px] text-slate-400">{t('habits.completionRate')} · {t('habits.thisWeek')}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-accent">{pct(avgMonth, lang)}</div>
          <div className="text-[11px] text-slate-400">{t('habits.completionRate')} · {t('habits.thisMonth')}</div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3">📊 {t('habits.perHabit')} ({t('habits.thisWeek')})</h3>
        <div style={{ height: Math.max(180, chartData.length * 38) }} dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
                formatter={(v) => [`${v}%`, t('habits.completionRate')]}
              />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3">🔥 {t('habits.longestStreak')}</h3>
        <div className="space-y-2">
          {[...stats.withStreaks].sort((a, b) => b.longest - a.longest).map(({ habit, streak, longest }) => (
            <div key={habit.id} className="flex items-center gap-3 text-sm">
              <span>{habit.icon}</span>
              <span className="flex-1 truncate">{typeof habit.name === 'object' ? habit.name[lang] : habit.name}</span>
              <span className="text-xs text-slate-400">{t('habits.currentStreak')}: <b className="text-primary">{localizeDigits(streak, lang)}</b></span>
              <span className="text-xs text-slate-400">{t('habits.longestStreak')}: <b>{localizeDigits(longest, lang)}</b></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
