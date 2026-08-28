import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiClock } from 'react-icons/fi';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import StatsCard from './StatsCard';
import WeeklyChart from './WeeklyChart';
import QuoteWidget from './QuoteWidget';
import FrogCard from './FrogCard';
import LevelWidget from './LevelWidget';
import { SkeletonPage } from '../Common/Skeleton';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useHabits, habitDoneOn } from '../../hooks/useHabits';
import { sectionColors } from '../../themes/themes';
import { localizeDigits, pct, fmtShort, fmtTime, todayKey, minutesToHuman, lastNDays, dateKey, isoDay } from '../../utils/dateUtils';

export default function Dashboard() {
  const { data, todayTasks, completedToday, overdue, pomodorosToday } = useApp();
  const { t, lang } = useTranslation();
  const { status, remaining, phase } = usePomodoro();
  const { habits, stats, toggleHabit, setWater } = useHabits();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setLoading(false), 300); return () => clearTimeout(id); }, []);

  const goal = data.settings.dailyGoal || 10;
  const progress = Math.min(100, Math.round((completedToday.length / goal) * 100));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'dashboard.greetingMorning' : hour < 17 ? 'dashboard.greetingAfternoon' : 'dashboard.greetingEvening';

  const pieData = useMemo(() => {
    const sections = ['gym', 'programming', 'german', 'gaming'];
    return sections
      .map((s) => ({ name: t(`nav.${s}`), value: (data.tasks[s] || []).filter((x) => !x.archived).length, color: sectionColors[s].hex }))
      .filter((d) => d.value > 0);
  }, [data.tasks, t]);

  const upcomingEvents = useMemo(() => {
    const tk = todayKey();
    return [...data.calendar]
      .filter((e) => e.date >= tk)
      .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
      .slice(0, 3);
  }, [data.calendar]);

  const weekFocusMins = useMemo(() => {
    const keys = lastNDays(7).map(dateKey);
    return data.pomodoro.history
      .filter((h) => h.phase === 'work' && h.endedAt && keys.includes(isoDay(h.endedAt)))
      .reduce((s, h) => s + (h.duration || 0), 0);
  }, [data.pomodoro.history]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">
          {t(greeting)}{data.settings.userName ? `، ${data.settings.userName}` : ''} {data.settings.avatar}
        </h2>
        {weekFocusMins > 0 && (
          <p className="text-xs text-slate-400 mt-1">🔥 {t('dashboard.focusWeek', { h: minutesToHuman(weekFocusMins, lang) })}</p>
        )}
      </div>

      {overdue.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-400/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 animate-fade-in">
          <FiAlertTriangle className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium flex-1">
            {localizeDigits(overdue.length, lang)} {t('dashboard.overdueWarning')}
          </p>
          <Link to="/programming" className="text-xs font-bold text-red-500 underline shrink-0">{t('common.viewAll')}</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <LevelWidget />
        <FrogCard />
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon="📋" label={t('dashboard.tasksToday')} value={localizeDigits(todayTasks.length, lang)} />
        <StatsCard icon="✅" label={t('dashboard.completed')} value={localizeDigits(completedToday.length, lang)} color="text-green-500 bg-green-500/10" />
        <StatsCard icon="🎯" label={t('dashboard.habitsDone')} value={localizeDigits(`${stats.doneToday}/${stats.total}`, lang)} color="text-amber-500 bg-amber-500/10" />
        <StatsCard icon="🍅" label={t('dashboard.pomodoros')} value={localizeDigits(pomodorosToday.length, lang)} color="text-red-500 bg-red-500/10" />
      </div>

      {/* daily goal progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">{t('dashboard.dailyProgress')}</span>
          <span className="text-xs text-slate-400">
            {t('dashboard.dailyGoal')}: {localizeDigits(`${completedToday.length}/${goal}`, lang)} · {pct(progress, lang)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {progress >= 100 && <p className="mt-2 text-sm font-semibold text-green-500 animate-pop">{t('dashboard.goalReached')}</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* weekly chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-sm mb-3">📊 {t('dashboard.weeklyChart')}</h3>
          <WeeklyChart />
        </div>

        {/* pie */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🧩 {t('dashboard.sectionBreakdown')}</h3>
          {pieData.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">{t('common.empty')}</p>
          ) : (
            <div className="h-44" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {pieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* mini habits */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">🎯 {t('dashboard.todaysHabits')}</h3>
            <Link to="/habits" className="text-xs text-primary font-semibold">{t('common.viewAll')}</Link>
          </div>
          {stats.allDone && <p className="text-xs font-semibold text-green-500 mb-2">{t('dashboard.allHabitsDone')}</p>}
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {habits.map((h) => {
              const done = habitDoneOn(h, todayKey());
              const name = typeof h.name === 'object' ? h.name[lang] : h.name;
              return (
                <button
                  key={h.id}
                  onClick={() => h.type === 'water'
                    ? setWater(h.id, done ? 0 : h.target || 8)
                    : toggleHabit(h.id)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all
                    ${done ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <span>{h.icon}</span>
                  <span className={`flex-1 text-start truncate ${done ? 'line-through' : ''}`}>{name}</span>
                  <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {done && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* mini pomodoro */}
        <div className="card p-5 flex flex-col items-center justify-center text-center gap-3">
          <h3 className="font-bold text-sm self-start">🍅 {t('dashboard.miniPomodoro')}</h3>
          {status === 'idle' ? (
            <>
              <FiClock size={36} className="text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400">{t('dashboard.notRunning')}</p>
            </>
          ) : (
            <>
              <div className={`text-4xl font-extrabold tabular-nums ${status === 'running' ? 'text-primary' : 'text-slate-400'}`}>
                {localizeDigits(`${mm}:${ss}`, lang)}
              </div>
              <span className="chip bg-primary/10 text-primary">
                {t(phase === 'work' ? 'pomodoro.work' : phase === 'short' ? 'pomodoro.shortBreak' : 'pomodoro.longBreak')}
              </span>
            </>
          )}
          <Link to="/pomodoro" className="btn-soft !text-xs">{t('dashboard.openTimer')} <FiArrowRight className="rtl:rotate-180" /></Link>
        </div>

        {/* next events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">📅 {t('dashboard.nextEvents')}</h3>
            <Link to="/calendar" className="text-xs text-primary font-semibold">{t('common.viewAll')}</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{t('dashboard.noEvents')}</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color || '#3b82f6' }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {fmtShort(e.date, lang)}{!e.allDay && e.startTime ? ` · ${fmtTime(e.startTime, lang)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuoteWidget />
    </div>
  );
}
