import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiMinimize2, FiPause, FiPlay, FiSkipForward } from 'react-icons/fi';
import TimerCircle from './TimerCircle';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeDigits } from '../../utils/dateUtils';

export default function FocusMode({ onExit }) {
  const { phase, status, remaining, progress, round, settings, currentTask, pause, resume, start, skip } = usePomodoro();
  const { t, lang } = useTranslation();

  // enter browser fullscreen; exit cleanly on unmount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    const onFsChange = () => { if (!document.fullscreenElement) onExit(); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, [onExit]);

  const isBreak = phase !== 'work';
  const phaseLabel = t(phase === 'work' ? 'pomodoro.work' : phase === 'short' ? 'pomodoro.shortBreak' : 'pomodoro.longBreak');

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col items-center justify-center gap-8 animate-fade-in">
      <button onClick={onExit} className="absolute top-5 end-5 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
        <FiMinimize2 /> {t('pomodoro.exitFullscreen')}
      </button>

      {isBreak && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[420px] w-[420px] rounded-full bg-emerald-500/10 animate-breathe" />
        </div>
      )}

      <div className="relative flex flex-col items-center gap-6">
        <span className={`chip !text-sm !px-4 !py-1.5 ${isBreak ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary-light'}`}>
          {phaseLabel} · {t('pomodoro.round')} {localizeDigits(round, lang)}/{localizeDigits(settings.rounds, lang)}
        </span>
        <TimerCircle remaining={remaining} progress={progress} phase={phase} size={320} lang={lang} />
        {currentTask && <p className="text-lg text-slate-300">🎯 {currentTask.title}</p>}
        {isBreak && <p className="text-sm text-emerald-400/80 animate-pulse">{t('pomodoro.breathe')}</p>}
        <div className="flex gap-3">
          {status === 'running' ? (
            <button onClick={pause} className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><FiPause size={22} /></button>
          ) : (
            <button onClick={status === 'paused' ? resume : start} className="h-14 w-14 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center"><FiPlay size={22} /></button>
          )}
          <button onClick={skip} className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><FiSkipForward size={20} /></button>
        </div>
      </div>
    </div>,
    document.body
  );
}
