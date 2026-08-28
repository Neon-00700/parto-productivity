import React, { useMemo, useState } from 'react';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Button from '../Common/Button';
import StatsCard from '../Dashboard/StatsCard';
import Achievements from './Achievements';
import YearPixels from './YearPixels';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useHabits, habitDoneOn } from '../../hooks/useHabits';
import { sectionColors } from '../../themes/themes';
import { dateKey, isoDay, addDays, todayKey, fmtShort, fmtDate, localizeDigits, pct, minutesToHuman } from '../../utils/dateUtils';

const tooltipStyle = { background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 };

function daysBetween(from, to) {
  const out = [];
  let d = new Date(from + 'T00:00');
  const end = new Date(to + 'T00:00');
  while (d <= end) { out.push(new Date(d)); d = addDays(d, 1); }
  return out.slice(-92); // cap at ~3 months for performance
}

export default function ReportsPage() {
  const { data, allTasks } = useApp();
  const { t, lang } = useTranslation();
  const { stats: habitStats } = useHabits();

  const [range, setRange] = useState('week');
  const [customFrom, setCustomFrom] = useState(dateKey(addDays(new Date(), -14)));
  const [customTo, setCustomTo] = useState(todayKey());

  const [from, to] = useMemo(() => {
    const tk = todayKey();
    if (range === 'today') return [tk, tk];
    if (range === 'week') return [dateKey(addDays(new Date(), -6)), tk];
    if (range === 'month') return [dateKey(addDays(new Date(), -29)), tk];
    return [customFrom, customTo];
  }, [range, customFrom, customTo]);

  const days = useMemo(() => daysBetween(from, to), [from, to]);
  const dayKeys = useMemo(() => days.map(dateKey), [days]);

  const inRange = (iso) => { const k = isoDay(iso); return k >= from && k <= to; };

  const report = useMemo(() => {
    const created = allTasks.filter((x) => inRange(x.createdAt));
    const completed = allTasks.filter((x) => x.completedAt && inRange(x.completedAt));
    const archived = allTasks.filter((x) => x.archived);
    const completionRate = created.length ? Math.round((completed.length / created.length) * 100) : (completed.length ? 100 : 0);

    const pomos = data.pomodoro.history.filter((h) => h.phase === 'work' && h.endedAt && inRange(h.endedAt));
    const focusMins = pomos.reduce((s, h) => s + (h.duration || 0), 0);

    // habits rate over range
    let habitDone = 0;
    let habitTotal = 0;
    data.habits.forEach((h) => {
      dayKeys.forEach((k) => { habitTotal += 1; if (habitDoneOn(h, k)) habitDone += 1; });
    });
    const habitRate = habitTotal ? Math.round((habitDone / habitTotal) * 100) : 0;

    // daily line
    const daily = days.map((d) => {
      const k = dateKey(d);
      return {
        name: fmtShort(d, lang),
        tasks: completed.filter((x) => isoDay(x.completedAt) === k).length,
        pomos: pomos.filter((h) => isoDay(h.endedAt) === k).length,
      };
    });

    // best day
    const best = [...daily].sort((a, b) => b.tasks - a.tasks)[0];
    const bestIdx = daily.indexOf(best);
    const bestDay = best && best.tasks > 0 ? fmtDate(days[bestIdx], lang, 'EEEE d MMMM') : '—';

    // per section
    const perSection = ['gym', 'programming', 'german', 'gaming'].map((s) => ({
      name: t(`nav.${s}`),
      value: completed.filter((x) => x.section === s).length,
      color: sectionColors[s].hex,
    }));

    // habit pie
    const habitPie = data.habits.map((h) => ({
      name: `${h.icon} ${typeof h.name === 'object' ? h.name[lang] : h.name}`,
      value: dayKeys.filter((k) => habitDoneOn(h, k)).length,
      color: h.color,
    })).filter((x) => x.value > 0);

    // most productive hour
    const hours = {};
    completed.forEach((x) => { const h = new Date(x.completedAt).getHours(); hours[h] = (hours[h] || 0) + 1; });
    pomos.forEach((p) => { const h = new Date(p.endedAt).getHours(); hours[h] = (hours[h] || 0) + 1; });
    const topHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
    const productiveHour = topHour ? `${localizeDigits(String(topHour[0]).padStart(2, '0'), lang)}:00 – ${localizeDigits(String((+topHour[0] + 1) % 24).padStart(2, '0'), lang)}:00` : '—';

    return { created, completed, archived, completionRate, pomos, focusMins, habitRate, daily, bestDay, perSection, habitPie, productiveHour };
  }, [allTasks, data, days, dayKeys, from, to, lang, t]);

  const exportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      range: { from, to },
      stats: {
        tasksCreated: report.created.length,
        tasksCompleted: report.completed.length,
        tasksArchived: report.archived.length,
        completionRate: report.completionRate,
        pomodoroSessions: report.pomos.length,
        focusMinutes: report.focusMins,
        habitCompletionRate: report.habitRate,
        bestDay: report.bestDay,
        mostProductiveHour: report.productiveHour,
      },
      daily: report.daily,
      habitStreaks: habitStats.withStreaks.map(({ habit, streak, longest }) => ({
        habit: typeof habit.name === 'object' ? habit.name.en : habit.name, streak, longest,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `parto-report-${from}_${to}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const streakBoard = [...habitStats.withStreaks].sort((a, b) => b.streak - a.streak);

  return (
    <div className="space-y-4">
      {/* range selector */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
          {['today', 'week', 'month', 'custom'].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`btn !py-1.5 !text-xs ${range === r ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}>
              {r === 'today' ? t('common.today') : r === 'week' ? t('reports.thisWeek') : r === 'month' ? t('reports.thisMonth') : t('reports.customRange')}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{t('reports.from')}</span>
            <input type="date" className="input !w-auto !py-1.5" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-slate-400">{t('reports.to')}</span>
            <input type="date" className="input !w-auto !py-1.5" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        <div className="ms-auto flex gap-2">
          <Button variant="soft" onClick={exportReport}><FiDownload /> {t('reports.exportJson')}</Button>
          <Button variant="ghost" onClick={() => window.print()}><FiPrinter /> {t('reports.print')}</Button>
        </div>
      </div>

      {/* overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon="🆕" label={t('reports.created')} value={localizeDigits(report.created.length, lang)} />
        <StatsCard icon="✅" label={t('reports.completedTasks')} value={localizeDigits(report.completed.length, lang)} color="text-green-500 bg-green-500/10" />
        <StatsCard icon="📦" label={t('reports.archivedTasks')} value={localizeDigits(report.archived.length, lang)} color="text-amber-500 bg-amber-500/10" />
        <StatsCard icon="📈" label={t('reports.completionRate')} value={pct(report.completionRate, lang)} color="text-violet-500 bg-violet-500/10" />
        <StatsCard icon="🍅" label={t('reports.focusSessions')} value={localizeDigits(report.pomos.length, lang)} color="text-red-500 bg-red-500/10" />
        <StatsCard icon="⏱️" label={t('reports.focusTime')} value={minutesToHuman(report.focusMins, lang)} />
        <StatsCard icon="🎯" label={t('reports.habitRate')} value={pct(report.habitRate, lang)} color="text-green-500 bg-green-500/10" />
        <StatsCard icon="🏆" label={t('reports.bestDay')} value={<span className="text-sm">{report.bestDay}</span>} color="text-amber-500 bg-amber-500/10" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* daily line */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">📈 {t('reports.dailyLine')}</h3>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer>
              <LineChart data={report.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="tasks" stroke="rgb(var(--c-primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* per section bar */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">📊 {t('reports.perSection')}</h3>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={report.perSection} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {report.perSection.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* habit pie */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🥧 {t('reports.habitPie')}</h3>
          {report.habitPie.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">{t('reports.noData')}</p>
          ) : (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={report.habitPie} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {report.habitPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* pomodoro area */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🍅 {t('reports.pomodoroArea')}</h3>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={report.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="pomoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="pomos" stroke="rgb(var(--c-accent))" strokeWidth={2} fill="url(#pomoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* streak leaderboard */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🔥 {t('reports.streakBoard')}</h3>
          <div className="space-y-2">
            {streakBoard.slice(0, 8).map(({ habit, streak, longest }, i) => (
              <div key={habit.id} className="flex items-center gap-3 text-sm">
                <span className={`w-6 text-center font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : localizeDigits(i + 1, lang)}</span>
                <span>{habit.icon}</span>
                <span className="flex-1 truncate">{typeof habit.name === 'object' ? habit.name[lang] : habit.name}</span>
                <span className="font-bold text-primary tabular-nums">{localizeDigits(streak, lang)} {t('habits.days')}</span>
                <span className="text-[11px] text-slate-400 tabular-nums">({t('habits.longestStreak')}: {localizeDigits(longest, lang)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* productive hour */}
        <div className="card p-5 flex flex-col items-center justify-center gap-2 text-center">
          <h3 className="font-bold text-sm self-start">⚡ {t('reports.productiveHour')}</h3>
          <div className="text-4xl">🕑</div>
          <div className="text-2xl font-extrabold text-primary" dir="ltr">{report.productiveHour}</div>
          <p className="text-xs text-slate-400">{localizeDigits(report.completed.length, lang)} {t('reports.tasksCompleted')}</p>
        </div>
      </div>

      <Achievements />
      <YearPixels />
    </div>
  );
}
