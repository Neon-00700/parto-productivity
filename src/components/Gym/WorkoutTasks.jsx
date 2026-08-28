import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiArchive } from 'react-icons/fi';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import EmptyState from '../Common/EmptyState';
import RestTimer from './RestTimer';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { DAY_IDS, dayIdOf, localizeDigits } from '../../utils/dateUtils';

const emptyForm = { title: '', sets: '', reps: '', weight: '', notes: '', day: '', priority: 'medium' };

export default function WorkoutTasks() {
  const { data, addTask, updateTask, toggleTask, deleteTask } = useApp();
  const { t, lang } = useTranslation();
  const tasks = data.tasks.gym || [];

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchive, setShowArchive] = useState(false);

  const visible = useMemo(() => {
    let list = tasks.filter((x) => !!x.archived === showArchive);
    if (dayFilter !== 'all') list = list.filter((x) => x.day === dayFilter || !x.day);
    if (statusFilter === 'done') list = list.filter((x) => x.done);
    if (statusFilter === 'active') list = list.filter((x) => !x.done);
    return list;
  }, [tasks, dayFilter, statusFilter, showArchive]);

  const openNew = () => { setForm({ ...emptyForm, day: dayIdOf() }); setModal('new'); setError(false); };
  const openEdit = (task) => { setForm({ ...emptyForm, ...task }); setModal(task); setError(false); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError(true); return; }
    if (modal === 'new') { addTask('gym', form); toast.success(t('toast.taskAdded')); }
    else { updateTask('gym', modal.id, form); toast.success(t('toast.taskUpdated')); }
    setModal(null);
  };

  const handleDelete = (task) => {
    const { restore } = deleteTask('gym', task.id);
    toast((tst) => (
      <div className="flex items-center gap-3">
        <span>{t('toast.taskDeleted')}</span>
        <button className="font-bold text-sky-400 underline" onClick={() => { restore(); toast.dismiss(tst.id); }}>{t('common.undo')}</button>
      </div>
    ), { duration: 5000, icon: '🗑️' });
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <RestTimer />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openNew}><FiPlus /> {t('gym.addWorkout')}</Button>
        <select className="input !w-auto !py-1.5 text-xs" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
          <option value="all">{t('gym.filterDay')}: {t('common.all')}</option>
          {DAY_IDS.map((d) => <option key={d} value={d}>{t(`days.${d}`)}</option>)}
        </select>
        <select className="input !w-auto !py-1.5 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t('common.status')}: {t('common.all')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="done">{t('common.done')}</option>
        </select>
        <button className={`btn-ghost !px-3 !py-1.5 text-xs ${showArchive ? '!bg-primary/15 !text-primary' : ''}`} onClick={() => setShowArchive(!showArchive)}>
          <FiArchive size={13} /> {showArchive ? t('common.hideArchive') : t('common.showArchive')}
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState message={showArchive ? t('task.emptyArchive') : t('common.empty')} action={!showArchive && <Button variant="soft" onClick={openNew}><FiPlus /> {t('gym.addWorkout')}</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {visible.map((task) => (
            <div key={task.id} className={`group card p-4 ${task.done ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => { if (!task.done) toast.success(t('toast.taskCompleted')); toggleTask('gym', task.id); }}
                  className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${task.done ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-orange-500'}`}
                >
                  {task.done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${task.done ? 'line-through text-slate-400' : ''}`}>{task.title}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                    {task.day && <Badge tone="primary">{t(`days.${task.day}`)}</Badge>}
                    {task.priority && <Badge tone={task.priority}>{t(`common.${task.priority}`)}</Badge>}
                    {task.sets && <span>🔁 {localizeDigits(task.sets, lang)}×{localizeDigits(task.reps || '?', lang)}</span>}
                    {task.weight && <span>🏋️ {localizeDigits(task.weight, lang)}kg</span>}
                  </div>
                  {task.notes && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{task.notes}</p>}
                </div>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {!showArchive && (
                    <>
                      <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary"><FiEdit2 size={14} /></button>
                      {task.done && (
                        <button onClick={() => { updateTask('gym', task.id, { archived: true }); toast.success(t('toast.taskArchived')); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500"><FiArchive size={14} /></button>
                      )}
                    </>
                  )}
                  <button onClick={() => handleDelete(task)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500"><FiTrash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('gym.addWorkout') : t('gym.editWorkout')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('gym.exercise')} *</label>
            <input autoFocus className={`input ${error ? 'input-error' : ''}`} value={form.title} onChange={(e) => { set('title', e.target.value); setError(false); }} />
            {error && <p className="mt-1 text-xs text-red-500">{t('common.requiredField')}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">{t('gym.sets')}</label><input type="number" min="0" className="input" value={form.sets} onChange={(e) => set('sets', e.target.value)} /></div>
            <div><label className="label">{t('gym.reps')}</label><input className="input" value={form.reps} onChange={(e) => set('reps', e.target.value)} /></div>
            <div><label className="label">{t('gym.weight')}</label><input type="number" min="0" step="0.5" className="input" value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('gym.dayOfWeek')}</label>
              <select className="input" value={form.day} onChange={(e) => set('day', e.target.value)}>
                <option value="">{t('gym.anyDay')}</option>
                {DAY_IDS.map((d) => <option key={d} value={d}>{t(`days.${d}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('common.priority')}</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="high">{t('common.high')}</option>
                <option value="medium">{t('common.medium')}</option>
                <option value="low">{t('common.low')}</option>
              </select>
            </div>
          </div>
          <div><label className="label">{t('common.notes')}</label><textarea rows={2} className="input resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
