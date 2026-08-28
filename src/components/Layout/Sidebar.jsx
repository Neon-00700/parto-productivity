import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiActivity, FiCode, FiBookOpen, FiPlay,
  FiCheckCircle, FiCalendar, FiClock, FiBarChart2, FiSettings,
  FiFeather, FiDollarSign, FiList,
} from 'react-icons/fi';
import LevelWidget from '../Dashboard/LevelWidget';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { APP_VERSION } from '../../utils/storageUtils';

export const NAV_ITEMS = [
  { to: '/', key: 'dashboard', icon: FiHome },
  { to: '/today', key: 'today', icon: FiList },
  { to: '/gym', key: 'gym', icon: FiActivity },
  { to: '/programming', key: 'programming', icon: FiCode },
  { to: '/german', key: 'german', icon: FiBookOpen },
  { to: '/gaming', key: 'gaming', icon: FiPlay },
  { to: '/habits', key: 'habits', icon: FiCheckCircle },
  { to: '/calendar', key: 'calendar', icon: FiCalendar },
  { to: '/pomodoro', key: 'pomodoro', icon: FiClock },
  { to: '/journal', key: 'journal', icon: FiFeather },
  { to: '/budget', key: 'budget', icon: FiDollarSign },
  { to: '/reports', key: 'reports', icon: FiBarChart2 },
  { to: '/settings', key: 'settings', icon: FiSettings },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { data } = useApp();

  return (
    <aside className="hidden lg:flex w-[270px] shrink-0 flex-col border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-lg shadow-md">
          {data.settings.avatar || '✓'}
        </div>
        <div>
          <div className="font-extrabold text-lg leading-tight">{data.settings.userName || t('app.name')}</div>
          <div className="text-[11px] text-slate-400">{t('app.tagline')}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200
              ${isActive ? 'bg-primary/15 text-primary font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}`
            }
          >
            <Icon size={17} />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
      <LevelWidget compact />
      <div className="px-5 py-3 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
        {t('app.name')} v{APP_VERSION}
      </div>
    </aside>
  );
}
