import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FiHome, FiList, FiCheckCircle, FiClock, FiCalendar, FiMoreHorizontal, FiActivity, FiCode, FiBookOpen, FiPlay, FiBarChart2, FiSettings, FiX, FiFeather, FiDollarSign } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';

const MAIN = [
  { to: '/', key: 'dashboard', icon: FiHome },
  { to: '/today', key: 'today', icon: FiList },
  { to: '/habits', key: 'habits', icon: FiCheckCircle },
  { to: '/pomodoro', key: 'pomodoro', icon: FiClock },
  { to: '/calendar', key: 'calendar', icon: FiCalendar },
];

const MORE = [
  { to: '/gym', key: 'gym', icon: FiActivity },
  { to: '/programming', key: 'programming', icon: FiCode },
  { to: '/german', key: 'german', icon: FiBookOpen },
  { to: '/gaming', key: 'gaming', icon: FiPlay },
  { to: '/journal', key: 'journal', icon: FiFeather },
  { to: '/budget', key: 'budget', icon: FiDollarSign },
  { to: '/reports', key: 'reports', icon: FiBarChart2 },
  { to: '/settings', key: 'settings', icon: FiSettings },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const itemCls = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-slate-400'}`;

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex pb-[env(safe-area-inset-bottom)]">
        {MAIN.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={itemCls} onClick={() => setMoreOpen(false)}>
            <Icon size={20} />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
        <button
          className={`flex flex-col items-center gap-0.5 flex-1 py-2 text-[10px] font-medium ${moreOpen ? 'text-primary' : 'text-slate-400'}`}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <FiMoreHorizontal size={20} />
          {t('nav.more')}
        </button>
      </nav>

      {moreOpen && createPortal(
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-24 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t('nav.more')}</h3>
              <button onClick={() => setMoreOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><FiX /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE.map(({ to, key, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-2 rounded-2xl p-4 text-xs font-medium border transition-all
                    ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`
                  }
                >
                  <Icon size={22} />
                  {t(`nav.${key}`)}
                </NavLink>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
