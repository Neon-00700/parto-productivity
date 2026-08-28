import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiClock, FiEdit2, FiLink, FiPause, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from './Common/Modal';
import Button from './Common/Button';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { todayKey, localizeDigits, minutesToHuman } from '../utils/dateUtils';

const EMPTY = { title: '', type: 'task', recurring: 'none', linkedSection: 'custom', linkedId: '', estimatedMinutes: '' };

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((x) => String(x).padStart(2, '0')).join(':');
}

export default function DailyTasksPage() {
  const { data, today, addDailyTask, updateDailyTask, deleteDailyTask, toggleDailyTask, addGameToToday, updateTodayGameActivity, startDailyTimer, stopDailyTimer } = useApp();
  const { t, lang } = useTranslation();
  const tasks = useMemo(() => (data.dailyTasks || []).filter((x) => x.date === today), [data.dailyTasks, today]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const done = tasks.filter((x) => x.done).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const linkedGames = data.games || [];

  const openAdd = () => { setForm(EMPTY); setModal(true); };
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addDailyTask({ ...form, title: form.title.trim(), date: today, recurring: form.recurring });
    setModal(false);
    toast.success(t('daily.added'));
  };

  const elapsed = (task) => {
    const base = task.timerSeconds || 0;
    return task.timerRunning && task.timerStartedAt ? base + Math.floor((now - new Date(task.timerStartedAt).getTime()) / 1000) : base;
  };

  const remove = (task) => { deleteDailyTask(task.id); toast.success(t('daily.deleted')); };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">{t('common.today')}</div>
            <h1 className="text-2xl font-black mt-1">{t('daily.title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{done} / {tasks.length} {t('daily.completed')}</p>
          </div>
          <Button onClick={openAdd}><FiPlus /> {t('daily.addTask')}</Button>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl">📋</div>
          <p className="font-bold mt-3">{t('daily.empty')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('daily.emptyHint')}</p>
          <Button className="mt-4" onClick={openAdd}><FiPlus /> {t('daily.addTask')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const seconds = elapsed(task);
            const game = task.type === 'game' ? linkedGames.find((g) => g.id === task.gameId) : null;
            return (
              <div key={task.id} className={`card p-4 transition-all ${task.done ? 'opacity-65' : ''}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleDailyTask(task.id)} className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.done ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary'}`}>
                    {task.done && <FiCheck size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => task.linkedSection && task.linkedSection !== 'custom' ? window.location.hash = `#/${task.linkedSection}` : null} className={`font-bold text-start ${task.done ? 'line-through text-slate-400' : ''}`}>
                        {task.type === 'game' ? '🎮 ' : task.type === 'timer' ? '⏱️ ' : ''}{task.title}
                      </button>
                      {task.recurring !== 'none' && <span className="chip bg-primary/10 text-primary">🔁 {t('daily.everyDay')}</span>}
                    </div>
                    {task.type === 'game' && game && (
                      <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-semibold">{game.name}</span>
                          <span className="text-slate-400">🏆 {localizeDigits(game.dailyAchievements || 0, lang)} {t('daily.achievementsToday')}</span>
                          <span className="text-slate-400">⏱ {minutesToHuman(game.dailyMinutes || 0, lang, t)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <input className="input" type="number" min="0" step="0.25" value={game.dailyMinutes ? game.dailyMinutes / 60 : 0} onChange={(e) => updateTodayGameActivity(game.id, { hours: e.target.value, achievements: game.dailyAchievements || 0 })} placeholder={t('daily.hoursToday')} />
                          <input className="input" type="number" min="0" step="1" value={game.dailyAchievements || 0} onChange={(e) => updateTodayGameActivity(game.id, { hours: (game.dailyMinutes || 0) / 60, achievements: e.target.value })} placeholder={t('daily.achievementsToday')} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">{t('daily.gameHint')}</div>
                      </div>
                    )}
                    {(task.type === 'timer' || task.showTimer) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-lg font-bold tabular-nums">{formatClock(seconds)}</span>
                        {!task.timerRunning ? (
                          <Button variant="soft" className="!py-1.5 !px-3" onClick={() => startDailyTimer(task.id)}><FiPlay size={13} /> {t('daily.startTimer')}</Button>
                        ) : (
                          <Button variant="soft" className="!py-1.5 !px-3" onClick={() => stopDailyTimer(task.id)}><FiPause size={13} /> {t('daily.stopTimer')}</Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {task.linkedSection && task.linkedSection !== 'custom' && <button className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { window.location.hash = `#/${task.linkedSection}`; }}><FiLink size={15} /></button>}
                    <button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => remove(task)}><FiTrash2 size={15} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t('daily.addTask')}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">{t('common.title')} *</label><input autoFocus className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('daily.type')}</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="task">{t('daily.simple')}</option><option value="timer">{t('daily.timerTask')}</option></select></div>
            <div><label className="label">{t('daily.repeat')}</label><select className="input" value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })}><option value="none">{t('daily.todayOnly')}</option><option value="daily">{t('daily.everyDay')}</option></select></div>
          </div>
          <div><label className="label">{t('daily.link')}</label><select className="input" value={form.linkedSection} onChange={(e) => setForm({ ...form, linkedSection: e.target.value })}><option value="custom">{t('daily.other')}</option><option value="gym">{t('nav.gym')}</option><option value="german">{t('nav.german')}</option><option value="programming">{t('nav.programming')}</option><option value="habits">{t('nav.habits')}</option></select></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setModal(false)}>{t('common.cancel')}</Button><Button type="submit">{t('common.add')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
