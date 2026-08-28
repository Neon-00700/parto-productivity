import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from './AppContext';
import { useLanguage } from './LanguageContext';
import { playChime } from '../utils/sound';

export const PRESETS = {
  classic: { workTime: 25, shortBreak: 5, longBreak: 15, rounds: 4 },
  deepWork: { workTime: 50, shortBreak: 10, longBreak: 20, rounds: 4 },
  shortSprint: { workTime: 15, shortBreak: 3, longBreak: 10, rounds: 4 },
};

const PomodoroContext = createContext(null);
export const usePomodoroContext = () => useContext(PomodoroContext);

export function PomodoroProvider({ children }) {
  const { data, addPomodoroHistory, updatePomodoroSettings } = useApp();
  const { t } = useLanguage();
  const settings = data.pomodoro.settings;

  const [phase, setPhase] = useState('work'); // work | short | long
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(settings.workTime * 60);
  const [currentTask, setCurrentTask] = useState(null); // { id, title, section }
  const endsAtRef = useRef(null);
  const phaseStartRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const phaseDuration = useCallback((p, s = settingsRef.current) => {
    if (p === 'work') return s.workTime * 60;
    if (p === 'short') return s.shortBreak * 60;
    return s.longBreak * 60;
  }, []);

  // keep idle remaining in sync when settings change
  useEffect(() => {
    if (status === 'idle') setRemaining(phaseDuration(phase));
  }, [settings.workTime, settings.shortBreak, settings.longBreak]); // eslint-disable-line

  const notify = useCallback((body) => {
    try {
      if (data.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(t('pomodoro.notifTitle'), { body, icon: '/icon.svg' });
      }
    } catch (e) { console.warn(e); }
  }, [data.settings.notifications, t]);

  const startPhase = useCallback((p, r) => {
    setPhase(p);
    if (r) setRound(r);
    const dur = phaseDuration(p);
    setRemaining(dur);
    endsAtRef.current = Date.now() + dur * 1000;
    phaseStartRef.current = new Date().toISOString();
    setStatus('running');
  }, [phaseDuration]);

  const completePhase = useCallback((skipped = false) => {
    const s = settingsRef.current;
    if (!skipped) playChime();
    if (phase === 'work') {
      const dur = Math.round((phaseDuration('work') - Math.max(0, remaining)) / 60) || s.workTime;
      addPomodoroHistory({
        phase: 'work',
        duration: skipped ? Math.max(1, dur) : s.workTime,
        taskId: currentTask?.id || null,
        taskName: currentTask?.title || '',
        startedAt: phaseStartRef.current,
        endedAt: new Date().toISOString(),
      });
      if (!skipped) { toast.success(t('pomodoro.workDone')); notify(t('pomodoro.workDone')); }
      const isLong = round >= s.rounds;
      const nextPhase = isLong ? 'long' : 'short';
      if (s.autoStartBreak) startPhase(nextPhase, round);
      else {
        setPhase(nextPhase);
        setRound(round);
        setStatus('idle');
        setRemaining(phaseDuration(nextPhase));
        endsAtRef.current = null;
      }
    } else {
      addPomodoroHistory({
        phase: phase === 'long' ? 'longBreak' : 'shortBreak',
        duration: phase === 'long' ? s.longBreak : s.shortBreak,
        startedAt: phaseStartRef.current,
        endedAt: new Date().toISOString(),
      });
      if (!skipped) { toast.success(t('pomodoro.breakDone')); notify(t('pomodoro.breakDone')); }
      const nextRound = phase === 'long' ? 1 : round + 1;
      if (s.autoStartWork) startPhase('work', nextRound);
      else {
        setPhase('work');
        setRound(nextRound);
        setStatus('idle');
        setRemaining(phaseDuration('work'));
        endsAtRef.current = null;
      }
    }
  }, [phase, round, remaining, currentTask, addPomodoroHistory, notify, phaseDuration, startPhase, t]);

  // global ticking — lives in context so the timer keeps running across pages
  useEffect(() => {
    if (status !== 'running') return undefined;
    const iv = setInterval(() => {
      const left = Math.round((endsAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        clearInterval(iv);
        completePhase(false);
      } else {
        setRemaining(left);
      }
    }, 400);
    return () => clearInterval(iv);
  }, [status, completePhase]);

  // document title while running
  useEffect(() => {
    if (status === 'running') {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const sec = String(remaining % 60).padStart(2, '0');
      document.title = `${m}:${sec} · ${t(phase === 'work' ? 'pomodoro.work' : phase === 'short' ? 'pomodoro.shortBreak' : 'pomodoro.longBreak')}`;
    } else {
      document.title = 'پرتو | Parto Productivity';
    }
  }, [remaining, status, phase, t]);

  const start = useCallback(() => startPhase(phase, round), [startPhase, phase, round]);
  const pause = useCallback(() => {
    if (status !== 'running') return;
    setRemaining(Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000)));
    setStatus('paused');
  }, [status]);
  const resume = useCallback(() => {
    if (status !== 'paused') return;
    endsAtRef.current = Date.now() + remaining * 1000;
    setStatus('running');
  }, [status, remaining]);
  const reset = useCallback(() => {
    setStatus('idle');
    setPhase('work');
    setRound(1);
    setRemaining(phaseDuration('work'));
    endsAtRef.current = null;
  }, [phaseDuration]);
  const skip = useCallback(() => completePhase(true), [completePhase]);

  const applyPreset = useCallback((id) => {
    const p = PRESETS[id];
    if (p) updatePomodoroSettings({ ...p, preset: id });
    else updatePomodoroSettings({ preset: 'custom' });
    setStatus('idle');
    setPhase('work');
    setRound(1);
    setRemaining((p ? p.workTime : settingsRef.current.workTime) * 60);
    endsAtRef.current = null;
  }, [updatePomodoroSettings]);

  const totalSeconds = phaseDuration(phase);
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  const value = useMemo(() => ({
    phase, status, round, remaining, progress, totalSeconds, settings,
    currentTask, setCurrentTask,
    start, pause, resume, reset, skip, applyPreset, updatePomodoroSettings,
    history: data.pomodoro.history,
  }), [phase, status, round, remaining, progress, totalSeconds, settings, currentTask, start, pause, resume, reset, skip, applyPreset, updatePomodoroSettings, data.pomodoro.history]);

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}
