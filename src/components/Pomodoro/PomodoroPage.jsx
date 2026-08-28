import React, { useMemo, useState, useEffect } from 'react';
import { FiPlay, FiPause, FiRotateCcw, FiSkipForward, FiMaximize2, FiBell } from 'react-icons/fi';
import TimerCircle from './TimerCircle';
import FocusMode from './FocusMode';
import Button from '../Common/Button';
import StatsCard from '../Dashboard/StatsCard';
import { usePomodoro } from '../../hooks/usePomodoro';
import { PRESETS } from '../../contexts/PomodoroContext';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeDigits, minutesToHuman, todayKey, fmtTime, isoDay } from '../../utils/dateUtils';
import { startSoundscape, stopSoundscape, setSoundscapeVolume, activeSoundscape } from '../../utils/soundscapes';

export default function PomodoroPage() {
  const {
    phase, status, round, remaining, progress, settings,
    currentTask, setCurrentTask, start, pause, resume, reset, skip,
    applyPreset, updatePomodoroSettings, history,
  } = usePomodoro();
  const { activeTasks } = useApp();
  const { t, lang } = useTranslation();
  const [focusMode, setFocusMode] = useState(false);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [sound, setSound] = useState(activeSoundscape());
  const [volume, setVolume] = useState(0.5);

  const pickSound = (id) => {
    setSound(id);
    if (id === 'off') stopSoundscape();
    else startSoundscape(id, volume);
  };

  useEffect(() => () => {}, []);

  const openTasks = useMemo(() => activeTasks.filter((x) => !x.done).slice(0, 60), [activeTasks]);

  const todayHistory = useMemo(
    () => history.filter((h) => h.endedAt && isoDay(h.endedAt) === todayKey()),
    [history]
  );
  const workToday = todayHistory.filter((h) => h.phase === 'work');
  const focusMins = workToday.reduce((s, h) => s + (h.duration || 0), 0);
  const breakMins = todayHistory.filter((h) => h.phase !== 'work').reduce((s, h) => s + (h.duration || 0), 0);

  const phaseLabel = t(phase === 'work' ? 'pomodoro.work' : phase === 'short' ? 'pomodoro.shortBreak' : 'pomodoro.longBreak');
  const presetId = settings.preset || 'custom';

  const askNotif = async () => {
    try {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    } catch (e) { console.warn(e); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {focusMode && <FocusMode onExit={() => setFocusMode(false)} />}

      {/* main timer */}
      <div className="lg:col-span-2 space-y-4">
        {/* presets */}
        <div className="flex flex-wrap gap-2">
          {[...Object.keys(PRESETS), 'custom'].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`chip !px-3 !py-1.5 transition-all ${presetId === p ? 'bg-primary text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:bg-primary/20'}`}
            >
              {t(`pomodoro.${p}`)}
              {p !== 'custom' && <span className="opacity-60 ms-1" dir="ltr">{PRESETS[p].workTime}/{PRESETS[p].shortBreak}</span>}
            </button>
          ))}
        </div>

        <div className="card p-6 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`chip ${phase === 'work' ? 'bg-primary/15 text-primary' : 'bg-emerald-500/15 text-emerald-500'}`}>{phaseLabel}</span>
            <span>{t('pomodoro.round')} {localizeDigits(round, lang)}/{localizeDigits(settings.rounds, lang)}</span>
            <span>·</span>
            <span>{t('pomodoro.session')} {localizeDigits(workToday.length + 1, lang)}</span>
          </div>

          <TimerCircle remaining={remaining} progress={progress} phase={phase} lang={lang} />

          {/* task link */}
          <select
            className="input max-w-xs text-center"
            value={currentTask?.id || ''}
            onChange={(e) => {
              const task = openTasks.find((x) => x.id === e.target.value);
              setCurrentTask(task ? { id: task.id, title: task.title, section: task.section } : null);
            }}
          >
            <option value="">{t('pomodoro.selectTask')}</option>
            {openTasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {status === 'running' ? (
              <Button onClick={pause} className="!px-6"><FiPause /> {t('pomodoro.pause')}</Button>
            ) : status === 'paused' ? (
              <Button onClick={resume} className="!px-6"><FiPlay /> {t('pomodoro.resume')}</Button>
            ) : (
              <Button onClick={start} className="!px-8"><FiPlay /> {t('pomodoro.start')}</Button>
            )}
            <Button variant="ghost" onClick={reset}><FiRotateCcw /> {t('pomodoro.resetBtn')}</Button>
            <Button variant="ghost" onClick={skip} disabled={status === 'idle'}><FiSkipForward /> {t('pomodoro.skip')}</Button>
            <Button variant="soft" onClick={() => setFocusMode(true)}><FiMaximize2 /> {t('pomodoro.fullscreen')}</Button>
          </div>

          {notifPerm === 'default' && (
            <button onClick={askNotif} className="text-xs text-primary underline flex items-center gap-1">
              <FiBell size={12} /> {t('settings.notifications')}
            </button>
          )}
        </div>

        {/* ambient sounds */}
        <div className="card p-5 space-y-3">
          <h3 className="font-bold text-sm">🎧 {t('sounds.title')}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {[['off', '🔇'], ['rain', '🌧️'], ['cafe', '☕'], ['white', '📻']].map(([id, icon]) => (
              <button key={id} onClick={() => pickSound(id)}
                className={`chip !px-3.5 !py-2 transition-all ${sound === id ? 'bg-primary text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:bg-primary/20'}`}>
                {icon} {t(`sounds.${id}`)}
              </button>
            ))}
            {sound !== 'off' && (
              <div className="flex items-center gap-2 ms-auto">
                <span className="text-xs text-slate-400">{t('sounds.volume')}</span>
                <input type="range" min="0" max="1" step="0.05" value={volume} className="accent-primary w-24"
                  onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); setSoundscapeVolume(v); }} />
              </div>
            )}
          </div>
        </div>

        {/* custom settings */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-sm">⚙️ {t('pomodoro.custom')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['workTime', 'pomodoro.workTime'], ['shortBreak', 'pomodoro.shortBreakTime'], ['longBreak', 'pomodoro.longBreakTime'], ['rounds', 'pomodoro.rounds']].map(([key, label]) => (
              <div key={key}>
                <label className="label">{t(label)}</label>
                <input
                  type="number" min="1" max={key === 'rounds' ? 12 : 180}
                  className="input"
                  value={settings[key]}
                  onChange={(e) => {
                    const v = Math.max(1, parseInt(e.target.value || '1', 10));
                    updatePomodoroSettings({ [key]: v, preset: 'custom' });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!settings.autoStartBreak} onChange={(e) => updatePomodoroSettings({ autoStartBreak: e.target.checked })} />
              {t('pomodoro.autoStartBreak')}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!settings.autoStartWork} onChange={(e) => updatePomodoroSettings({ autoStartWork: e.target.checked })} />
              {t('pomodoro.autoStartWork')}
            </label>
          </div>
        </div>
      </div>

      {/* stats + history */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <StatsCard icon="🍅" label={t('pomodoro.sessionsToday')} value={localizeDigits(workToday.length, lang)} />
          <StatsCard icon="🎯" label={t('pomodoro.focusTime')} value={minutesToHuman(focusMins, lang)} color="text-green-500 bg-green-500/10" />
          <StatsCard icon="☕" label={t('pomodoro.breakTime')} value={minutesToHuman(breakMins, lang)} color="text-amber-500 bg-amber-500/10" />
        </div>

        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">📜 {t('pomodoro.history')}</h3>
          {todayHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">{t('pomodoro.noHistory')}</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {[...todayHistory].reverse().map((h) => (
                <div key={h.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs">
                  <span>{h.phase === 'work' ? '🍅' : '☕'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{h.phase === 'work' ? (h.taskName || t('pomodoro.work')) : t(h.phase === 'longBreak' ? 'pomodoro.longBreak' : 'pomodoro.shortBreak')}</span>
                  </div>
                  <span className="text-slate-400 tabular-nums">{localizeDigits(h.duration, lang)}{t('common.min')}</span>
                  <span className="text-slate-400 tabular-nums" dir="ltr">{fmtTime(h.endedAt ? new Date(h.endedAt).toTimeString().slice(0, 5) : '', lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
