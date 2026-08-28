import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';
import HabitGrid from './HabitGrid';
import HabitStats from './HabitStats';
import { useTranslation } from '../../hooks/useTranslation';
import { useHabits, habitDoneOn, habitStreak, habitLongestStreak } from '../../hooks/useHabits';
import { todayKey, localizeDigits } from '../../utils/dateUtils';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f97316', '#f43f5e', '#eab308', '#6366f1', '#14b8a6'];
const EMOJIS = ['⭐', '💧', '🏃', '📚', '🧘', '🪥', '🌙', '📵', '✍️', '🥗', '💪', '🎯', '🎸', '💊', '🚶', '☀️'];
const emptyForm = { nameFa: '', nameEn: '', icon: '⭐', color: COLORS[0] };

function WaterTracker({ habit, onSet, lang, t }) {
  const tk = todayKey();
  const count = habit.history?.[tk] || 0;
  const target = habit.target || 8;
  return (
    <div className="flex items-center gap-1.5 flex-wrap" dir="ltr">
      {Array.from({ length: target }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSet(habit.id, i + 1 === count ? i : i + 1)}
          className={`text-xl transition-all hover:scale-110 ${i < count ? '' : 'opacity-30 grayscale'}`}
          title={`${i + 1}/${target}`}
        >
          🥛
        </button>
      ))}
      <span className="text-xs text-slate-400 ms-1">{localizeDigits(`${count}/${target}`, lang)} {t('habits.glasses')}</span>
    </div>
  );
}

export default function HabitsPage() {
  const { t, lang } = useTranslation();
  const { habits, stats, toggleHabit, setWater, addHabit, updateHabit, deleteHabit } = useHabits();
  const [view, setView] = useState('today'); // today | week | month | stats
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const prevAllDone = useRef(stats.allDone);
  const [burst, setBurst] = useState(false);

  // celebration when all habits become done
  useEffect(() => {
    if (stats.allDone && !prevAllDone.current) {
      setBurst(true);
      toast.success(t('habits.allDone'), { duration: 4000, icon: '🎉' });
      import('canvas-confetti').then(({ default: confetti }) =>
        confetti({ particleCount: 90, spread: 100, origin: { y: 0.5 }, scalar: 0.9 })
      ).catch(() => {});
      const id = setTimeout(() => setBurst(false), 1500);
      return () => clearTimeout(id);
    }
    prevAllDone.current = stats.allDone;
    return undefined;
  }, [stats.allDone, t]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.nameFa.trim() && !form.nameEn.trim()) { setError(true); return; }
    const name = { fa: form.nameFa.trim() || form.nameEn.trim(), en: form.nameEn.trim() || form.nameFa.trim() };
    if (modal === 'new') { addHabit({ name, icon: form.icon, color: form.color }); toast.success(t('toast.habitAdded')); }
    else { updateHabit(modal.id, { name, icon: form.icon, color: form.color }); toast.success(t('toast.habitUpdated')); }
    setModal(null);
  };

  const openEdit = (h) => {
    const name = typeof h.name === 'object' ? h.name : { fa: h.name, en: h.name };
    setForm({ nameFa: name.fa, nameEn: name.en, icon: h.icon, color: h.color });
    setError(false);
    setModal(h);
  };

  const tk = todayKey();
  const tabBtn = (id, label) => (
    <button
      onClick={() => setView(id)}
      className={`btn !py-1.5 !text-xs ${view === id ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 relative">
      {burst && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <span className="text-7xl animate-pop">🎉</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
          {tabBtn('today', t('common.today'))}
          {tabBtn('week', t('habits.weekView'))}
          {tabBtn('month', t('habits.monthView'))}
          {tabBtn('stats', t('habits.statsView'))}
        </div>
        <Button onClick={() => { setForm(emptyForm); setError(false); setModal('new'); }}><FiPlus /> {t('habits.addHabit')}</Button>
        <span className="text-xs text-slate-400 ms-auto">
          {localizeDigits(`${stats.doneToday}/${stats.total}`, lang)} {t('common.done')}
        </span>
      </div>

      {view === 'today' && (
        <div className="space-y-2.5">
          {habits.map((h) => {
            const done = habitDoneOn(h, tk);
            const name = typeof h.name === 'object' ? h.name[lang] : h.name;
            const streak = habitStreak(h);
            const longest = habitLongestStreak(h);
            return (
              <div key={h.id} className={`group card p-4 transition-all ${done ? 'ring-1' : ''}`} style={done ? { borderColor: h.color, boxShadow: `0 0 0 1px ${h.color}` } : {}}>
                <div className="flex items-center gap-3">
                  {h.type !== 'water' ? (
                    <button
                      onClick={() => toggleHabit(h.id)}
                      className="h-9 w-9 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-all active:scale-90"
                      style={{ background: done ? h.color : `${h.color}22` }}
                    >
                      {done ? '✓' : h.icon}
                    </button>
                  ) : (
                    <span className="h-9 w-9 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${h.color}22` }}>{h.icon}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${done ? 'text-green-500' : ''}`}>{name}</div>
                    <div className="text-[11px] text-slate-400">
                      🔥 {t('habits.currentStreak')}: {localizeDigits(streak, lang)} {t('habits.days')}
                      {' · '}🏆 {t('habits.longestStreak')}: {localizeDigits(longest, lang)}
                    </div>
                    {h.type === 'water' && <div className="mt-2"><WaterTracker habit={h} onSet={setWater} lang={lang} t={t} /></div>}
                  </div>
                  <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                    <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary"><FiEdit2 size={14} /></button>
                    <button onClick={() => setConfirmDel(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'week' && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">📅 {t('habits.thisWeek')}</h3>
          <HabitGrid habits={habits} days={7} />
        </div>
      )}

      {view === 'month' && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-4">📅 {t('habits.thisMonth')}</h3>
          <HabitGrid habits={habits} days={30} />
        </div>
      )}

      {view === 'stats' && <HabitStats />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('habits.addHabit') : t('habits.editHabit')}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('habits.habitName')} (فارسی)</label>
              <input dir="rtl" className={`input ${error ? 'input-error' : ''}`} value={form.nameFa} onChange={(e) => { setForm((f) => ({ ...f, nameFa: e.target.value })); setError(false); }} />
            </div>
            <div>
              <label className="label">{t('habits.habitName')} (English)</label>
              <input dir="ltr" className={`input ${error ? 'input-error' : ''}`} value={form.nameEn} onChange={(e) => { setForm((f) => ({ ...f, nameEn: e.target.value })); setError(false); }} />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{t('common.requiredField')}</p>}
          <div>
            <label className="label">{t('habits.emoji')}</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, icon: e }))}
                  className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.icon === e ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('common.color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full transition-all ${form.color === c ? 'ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-primary/40 scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteHabit(confirmDel); toast.success(t('toast.habitDeleted')); }}
        title={t('habits.deleteHabit')}
        message={t('habits.deleteConfirm')}
      />
    </div>
  );
}
