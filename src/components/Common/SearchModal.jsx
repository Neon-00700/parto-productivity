import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCommand } from 'react-icons/fi';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';

const SECTION_ROUTE = { gym: '/gym', programming: '/programming', german: '/german', gaming: '/gaming', custom: '/' };
const NAV_COMMANDS = [
  ['/', 'nav.dashboard', '🏠'], ['/gym', 'nav.gym', '🏋️'], ['/programming', 'nav.programming', '💻'],
  ['/german', 'nav.german', '🇩🇪'], ['/gaming', 'nav.gaming', '🎮'], ['/habits', 'nav.habits', '✅'],
  ['/calendar', 'nav.calendar', '📅'], ['/pomodoro', 'nav.pomodoro', '🍅'], ['/journal', 'nav.journal', '📖'],
  ['/budget', 'nav.budget', '💰'], ['/reports', 'nav.reports', '📈'], ['/settings', 'nav.settings', '⚙️'],
];

export default function SearchModal() {
  const { searchOpen, setSearchOpen, allTasks, data, setQuickAddOpen, setNotesOpen } = useApp();
  const { t, lang, setLanguage } = useTranslation();
  const { toggleDark } = useTheme();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  const commands = useMemo(() => {
    const close = () => setSearchOpen(false);
    const list = [
      ...NAV_COMMANDS.map(([route, key, icon]) => ({
        icon, label: `${t('palette.navTo')}: ${t(key)}`, run: () => { nav(route); close(); },
      })),
      { icon: '➕', label: t('common.newTask'), run: () => { close(); setQuickAddOpen(true); } },
      { icon: '📝', label: t('notes.title'), run: () => { close(); setNotesOpen(true); } },
      { icon: '🌓', label: t('settings.darkMode'), run: () => { toggleDark(); close(); } },
      { icon: '🌐', label: lang === 'fa' ? 'English' : 'فارسی', run: () => { setLanguage(lang === 'fa' ? 'en' : 'fa'); close(); } },
    ];
    const query = q.trim().toLowerCase();
    if (!query) return list.slice(0, 6);
    return list.filter((c) => c.label.toLowerCase().includes(query)).slice(0, 6);
  }, [q, t, lang, nav, setSearchOpen, setQuickAddOpen, setNotesOpen, toggleDark, setLanguage]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const out = [];
    const match = (s) => s && String(s).toLowerCase().includes(query);
    allTasks.forEach((task) => {
      if (match(task.title) || match(task.description) || (task.tags || []).some(match)) {
        out.push({ type: 'task', label: task.title, sub: t(`nav.${task.section === 'custom' ? 'dashboard' : task.section}`), route: SECTION_ROUTE[task.section], done: task.done });
      }
    });
    data.habits.forEach((h) => {
      const name = typeof h.name === 'object' ? `${h.name.fa} ${h.name.en}` : h.name;
      if (match(name)) out.push({ type: 'habit', label: `${h.icon} ${typeof h.name === 'object' ? h.name[lang] : h.name}`, sub: t('nav.habits'), route: '/habits' });
    });
    data.calendar.forEach((e) => {
      if (match(e.title) || match(e.description)) out.push({ type: 'event', label: e.title, sub: `${t('nav.calendar')} · ${e.date}`, route: '/calendar' });
    });
    data.games.forEach((g) => {
      if (match(g.name) || match(g.genre) || match(g.platform)) out.push({ type: 'game', label: g.name, sub: t('nav.gaming'), route: '/gaming' });
    });
    data.flashcards.forEach((c) => {
      if (match(c.german) || match(c.persian) || match(c.english)) out.push({ type: 'card', label: c.german, sub: t('german.flashcards'), route: '/german' });
    });
    return out.slice(0, 30);
  }, [q, allTasks, data, t, lang]);

  if (!searchOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh] px-4 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <FiSearch className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder={t('search.placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
          />
          <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <FiX />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {/* commands */}
          <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <FiCommand size={10} /> {t('palette.commands')}
          </div>
          {commands.map((c, i) => (
            <button key={`cmd-${i}`} onClick={c.run}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary/10 text-start text-sm">
              <span>{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
            </button>
          ))}

          {q.trim() === '' ? (
            <p className="p-4 text-center text-xs text-slate-400">{t('search.hint')}</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-400">{t('common.noResults')}</p>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-start"
                onClick={() => { nav(r.route); setSearchOpen(false); }}
              >
                <span className="chip bg-primary/10 text-primary shrink-0">{t(`search.${r.type}`)}</span>
                <span className={`text-sm flex-1 truncate ${r.done ? 'line-through text-slate-400' : ''}`}>{r.label}</span>
                <span className="text-[11px] text-slate-400 shrink-0">{r.sub}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
