import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { lastNDays, dateKey, fmtShort, isoDay } from '../../utils/dateUtils';

export default function WeeklyChart() {
  const { allTasks } = useApp();
  const { t, lang } = useTranslation();

  const chartData = useMemo(() =>
    lastNDays(7).map((d) => {
      const key = dateKey(d);
      return {
        name: fmtShort(d, lang),
        value: allTasks.filter((task) => task.completedAt && isoDay(task.completedAt) === key).length,
      };
    }), [allTasks, lang]);

  return (
    <div className="h-52" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.1)' }}
            contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
            formatter={(v) => [v, t('reports.tasksCompleted')]}
          />
          <Bar dataKey="value" fill="rgb(var(--c-primary))" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
