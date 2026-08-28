import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiMoon, FiSun, FiPlus, FiClock, FiFeather } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { usePomodoro } from '../../hooks/usePomodoro';
import { fmtDate, localizeDigits } from '../../utils/dateUtils';

const TITLES = {
  '/': 'nav.dashboard', '/gym': 'nav.gym', '/programming': 'nav.programming', '/german': 'nav.german',
  '/gaming': 'nav.gaming', '/habits': 'nav.habits', '/calendar': 'nav.calendar', '/pomodoro': 'nav.pomodoro',
  '/journal': 'nav.journal', '/budget': 'nav.budget', '/reports': 'nav.reports', '/settings': 'nav.settings',
};

export default function Header() {
  const { setSearchOpen, setQuickAddOpen, setNotesOpen } = useApp();
  const { darkMode, toggleDark } = useTheme();
  const { t, lang, setLanguage } = useTranslation();
  const { status, remaining, phase } = usePomodoro();
  const loc = useLocation();
  const nav = useNavigate();

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <header className="app-header sticky top-0 z-30 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-extrabold text-lg truncate">{t(TITLES[loc.pathname] || 'app.name')}</h1>
          <p className="text-[11px] text-slate-400">{fmtDate(new Date(), lang, 'EEEE، d MMMM yyyy')}</p>
        </div>

        {status !== 'idle' && loc.pathname !== '/pomodoro' && (
          <button
            onClick={() => nav('/pomodoro')}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tabular-nums
              ${phase === 'work' ? 'bg-primary/15 text-primary' : 'bg-emerald-500/15 text-emerald-500'} ${status === 'running' ? 'animate-pulse' : ''}`}
          >
            <FiClock size={13} /> {localizeDigits(`${mm}:${ss}`, lang)}
          </button>
        )}

        <button
          onClick={() => setQuickAddOpen(true)}
          title={`${t('common.newTask')} (Ctrl+N)`}
          className="btn-primary !px-3 !py-2"
        >
          <FiPlus size={16} />
          <span className="hidden sm:inline">{t('common.newTask')}</span>
        </button>
        <button onClick={() => setSearchOpen(true)} title="Ctrl+F / Ctrl+K" className="btn-ghost !px-2.5 !py-2.5">
          <FiSearch size={16} />
        </button>
        <button onClick={() => setNotesOpen(true)} title={t('notes.title')} className="btn-ghost !px-2.5 !py-2.5">
          <FiFeather size={16} />
        </button>
        <button
          onClick={() => setLanguage(lang === 'fa' ? 'en' : 'fa')}
          className="btn-ghost !px-2.5 !py-2 text-xs font-bold"
          title={t('common.language')}
        >
          {lang === 'fa' ? 'EN' : 'فا'}
        </button>
        <button
          onClick={() => { toggleDark(); toast(darkMode ? t('common.darkOff') : t('common.darkOn'), { icon: darkMode ? '☀️' : '🌙' }); }}
          title="Ctrl+D"
          className="btn-ghost !px-2.5 !py-2.5"
        >
          {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
      </div>
    </header>
  );
}
