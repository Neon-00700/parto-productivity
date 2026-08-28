import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import SearchModal from '../Common/SearchModal';
import NotesPanel from '../Common/NotesPanel';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Onboarding from './Onboarding';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { safeGet, safeSet } from '../../utils/storageUtils';
import { todayKey } from '../../utils/dateUtils';

function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen, addTask } = useApp();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('programming');
  const [error, setError] = useState(false);

  useEffect(() => { if (quickAddOpen) { setTitle(''); setError(false); } }, [quickAddOpen]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError(true); return; }
    addTask(section, { title: title.trim() });
    toast.success(t('toast.taskAdded'));
    setQuickAddOpen(false);
  };

  return (
    <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title={t('common.newTask')}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">{t('common.title')} *</label>
          <input autoFocus className={`input ${error ? 'input-error' : ''}`} value={title} onChange={(e) => { setTitle(e.target.value); setError(false); }} />
          {error && <p className="mt-1 text-xs text-red-500">{t('common.requiredField')}</p>}
        </div>
        <div>
          <label className="label">{t('common.addTo')}</label>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="gym">{t('nav.gym')}</option>
            <option value="programming">{t('nav.programming')}</option>
            <option value="german">{t('nav.german')}</option>
            <option value="gaming">{t('nav.gaming')}</option>
            <option value="custom">{t('nav.dashboard')}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(false)}>{t('common.cancel')}</Button>
          <Button type="submit">{t('common.add')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Layout() {
  const { setSearchOpen, setQuickAddOpen, data, completedToday, todayTasks, levelUpFlash, setLevelUpFlash } = useApp();
  const { toggleDark } = useTheme();
  const { t } = useTranslation();
  const nav = useNavigate();
  const loc = useLocation();
  const confettiFired = useRef(false);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'n') { e.preventDefault(); setQuickAddOpen(true); }
      else if (k === 'p') { e.preventDefault(); nav('/pomodoro'); }
      else if (k === 'd') { e.preventDefault(); toggleDark(); }
      else if (k === 'f' || k === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, setQuickAddOpen, setSearchOpen, toggleDark]);

  // confetti when daily goal reached (once per day)
  useEffect(() => {
    const goal = data.settings.dailyGoal || 10;
    const key = `parto_confetti_${todayKey()}`;
    if (completedToday.length >= goal && !safeGet(key) && !confettiFired.current) {
      confettiFired.current = true;
      safeSet(key, true);
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.4 } }), 400);
      }).catch(() => {});
      toast.success(t('toast.goalConfetti'), { duration: 4000 });
    }
  }, [completedToday.length, data.settings.dailyGoal, t]);

  // level-up celebration
  useEffect(() => {
    if (!levelUpFlash) return;
    toast.success(t('gam.levelUp', { n: levelUpFlash }), { duration: 4000, icon: '🏅' });
    import('canvas-confetti').then(({ default: confetti }) =>
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } })
    ).catch(() => {});
    setLevelUpFlash(null);
  }, [levelUpFlash, setLevelUpFlash, t]);

  // 9 PM daily summary notification
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const key = `parto_summary_${todayKey()}`;
      if (now.getHours() === 21 && !safeGet(key)) {
        safeSet(key, true);
        try {
          if (data.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
            const total = todayTasks.length;
            const done = completedToday.length;
            const body = data.settings.language === 'fa'
              ? `امروز ${done} از ${total} کار را انجام دادید!`
              : `You completed ${done}/${total} tasks today!`;
            new Notification(t('app.name'), { body, icon: '/icon.svg' });
          }
        } catch (e) { console.warn(e); }
      }
    }, 60000);
    return () => clearInterval(iv);
  }, [data.settings.notifications, data.settings.language, todayTasks.length, completedToday.length, t]);

  if (!data.settings.onboarded) return <Onboarding />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main key={loc.pathname} className="flex-1 px-4 sm:px-6 py-5 pb-24 lg:pb-8 max-w-6xl w-full mx-auto page-enter">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <SearchModal />
      <QuickAddModal />
      <NotesPanel />
    </div>
  );
}
